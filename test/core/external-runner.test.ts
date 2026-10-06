import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  checkRunnerShape,
  resolveExternalRunner,
  isOnPath,
  saveExternalReturn,
  ExternalSaveError,
  RUNNER_PRESETS,
} from '../../src/core/external-runner.js';
import { validateConfig, validateConfigKeyPath, setNestedValue } from '../../src/core/config-schema.js';
import { readTrail } from '../../src/core/artifact-graph/trail.js';

/**
 * rc17d-external-runner tasks 1.4 and 2.4 — the resolver over the shape and storage tables, the
 * config path, and `orbit external save` over every row of its table.
 */

const tmp = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-ext-runner-'));

function binDir(names: string[]): string {
  const dir = tmp();
  for (const n of names) {
    const p = path.join(dir, n);
    fs.writeFileSync(p, '#!/bin/sh\nexit 0\n');
    fs.chmodSync(p, 0o755);
  }
  return dir;
}

describe('runner record: the shape table', () => {
  it('{preset: "codex"} resolves to the preset argv', () => {
    const r = checkRunnerShape({ preset: 'codex' });
    expect(r).toEqual({
      ok: true,
      form: 'preset',
      name: 'codex',
      argv: ['codex', 'exec', '-C', '{worktree}', '-s', 'read-only', '-o', '{output}', '-'],
    });
  });

  it('an own argv carrying {output} as an element, or within one, is used as recorded', () => {
    expect(checkRunnerShape({ argv: ['/opt/tools/my-reviewer', '--out', '{output}'] })).toEqual({
      ok: true,
      form: 'argv',
      name: 'my-reviewer',
      argv: ['/opt/tools/my-reviewer', '--out', '{output}'],
    });
    expect(checkRunnerShape({ argv: ['r', '--out={output}'] }).ok).toBe(true);
  });

  // @scenario behaviour orbit-external-runner :: The runner record is a preset name or an argv array, never a shell string :: An own argv without an output placeholder is refused
  it('an own argv without {output} is refused, and resolves to none with a warning', () => {
    const r = checkRunnerShape({ argv: ['my-reviewer', '--read-only'] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('{output}');
    const res = resolveExternalRunner({ externalRunner: { argv: ['my-reviewer', '--read-only'] } }, { PATH: '' });
    expect(res.runner).toBeNull();
    expect(res.warnings.join('\n')).toMatch(/externalRunner.*\{output\}/);
  });

  it.each([
    ['an empty argv', { argv: [] }, /non-empty/],
    ['a non-string element', { argv: ['r', 3, '{output}'] }, /element 1 is not a string/],
    ['a string (a shell command line)', 'codex exec -o out -', /string/],
    ['an unknown preset', { preset: 'gemini' }, /unknown preset/],
    ['both keys', { preset: 'codex', argv: ['r', '{output}'] }, /both/],
    ['neither key', {}, /neither/],
    ['a key beside them', { preset: 'codex', model: 'x' }, /unknown key/],
    ['an array', ['codex'], /object/],
    ['null', null, /object/],
  ])('%s is malformed', (_label, value, reason) => {
    const r = checkRunnerShape(value);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(reason);
  });

  // @scenario behaviour orbit-external-runner :: The runner record is a preset name or an argv array, never a shell string :: The Codex preset passes no model flag
  it('the Codex preset passes no model flag', () => {
    const argv = RUNNER_PRESETS.codex;
    expect(argv).not.toContain('-m');
    expect(argv).not.toContain('--model');
    expect(argv.some((a) => /model/i.test(a))).toBe(false);
  });
});

describe('runner record: the storage table and resolution', () => {
  // @scenario behaviour orbit-external-runner :: The external runner is recorded in the per-user global config :: No record resolves to none
  it('the field absent resolves to none, with no warning', () => {
    expect(resolveExternalRunner({ profile: 'core' }, { PATH: '' })).toEqual({ runner: null, warnings: [] });
  });

  // @scenario behaviour orbit-external-runner :: The external runner is recorded in the per-user global config :: A malformed record warns and resolves to none
  it.each([
    ['a string', 'codex'],
    ['both keys', { preset: 'codex', argv: ['r', '{output}'] }],
  ])('a malformed record (%s) warns naming the field and resolves to none', (_l, value) => {
    const res = resolveExternalRunner({ externalRunner: value }, { PATH: '' });
    expect(res.runner).toBeNull();
    expect(res.warnings).toHaveLength(1);
    expect(res.warnings[0]).toMatch(/^Warning: externalRunner /);
  });

  // @scenario behaviour orbit-external-runner :: The external runner is recorded in the per-user global config :: A preset record resolves to its argv
  it('a preset record resolves to its argv, reachable when codex resolves on PATH', () => {
    const bin = binDir(['codex']);
    const res = resolveExternalRunner({ externalRunner: { preset: 'codex' } }, { PATH: bin });
    expect(res.runner).toEqual({
      form: 'preset',
      name: 'codex',
      argv: ['codex', 'exec', '-C', '{worktree}', '-s', 'read-only', '-o', '{output}', '-'],
      reachable: true,
    });
    expect(resolveExternalRunner({ externalRunner: { preset: 'codex' } }, { PATH: tmp() }).runner?.reachable).toBe(false);
  });

  it('an own argv names the basename of argv[0]; a path argv[0] is looked up as a path', () => {
    const bin = binDir(["my reviewer's"]);
    const exe = path.join(bin, "my reviewer's");
    const res = resolveExternalRunner({ externalRunner: { argv: [exe, '{output}'] } }, { PATH: '' });
    expect(res.runner).toMatchObject({ form: 'argv', name: "my reviewer's", reachable: true });
  });

  it('reachable executes nothing: a non-executable file does not resolve', () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, 'codex'), 'not executable');
    fs.chmodSync(path.join(dir, 'codex'), 0o644);
    expect(isOnPath('codex', { PATH: dir })).toBe(false);
  });

  describe('invalid JSON in the global file', () => {
    let dir: string;
    let saved: string | undefined;
    beforeEach(() => {
      dir = tmp();
      saved = process.env.XDG_CONFIG_HOME;
      process.env.XDG_CONFIG_HOME = dir;
      fs.mkdirSync(path.join(dir, 'openspec'));
      fs.writeFileSync(path.join(dir, 'openspec', 'config.json'), '{ not json');
    });
    afterEach(() => {
      if (saved === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = saved;
    });
    it('falls back through getGlobalConfig() to none', () => {
      const errors: string[] = [];
      const orig = console.error;
      console.error = (m: string) => errors.push(m);
      try {
        expect(resolveExternalRunner().runner).toBeNull();
      } finally {
        console.error = orig;
      }
      expect(errors.join('\n')).toMatch(/Invalid JSON/);
    });
  });
});

describe('runner record: the config path', () => {
  it('externalRunner is a known top-level key; externalRunner.preset is its one nested path', () => {
    expect(validateConfigKeyPath('externalRunner')).toEqual({ valid: true });
    expect(validateConfigKeyPath('externalRunner.preset')).toEqual({ valid: true });
    expect(validateConfigKeyPath('externalRunner.argv').valid).toBe(false);
    expect(validateConfigKeyPath('externalRunner.preset.x').valid).toBe(false);
  });

  it('set externalRunner.preset codex validates over no record', () => {
    const cfg: Record<string, unknown> = { profile: 'core' };
    setNestedValue(cfg, 'externalRunner.preset', 'codex');
    expect(validateConfig(cfg)).toEqual({ success: true });
  });

  it('set externalRunner.preset codex over a recorded argv is refused, naming the unset', () => {
    const cfg: Record<string, unknown> = { externalRunner: { argv: ['my-reviewer', '{output}'] } };
    setNestedValue(cfg, 'externalRunner.preset', 'codex');
    const v = validateConfig(cfg);
    expect(v.success).toBe(false);
    expect(v.error).toContain('orbit config unset externalRunner');
  });
});

// ---------------------------------------------------------------------------
// orbit external save
// ---------------------------------------------------------------------------

const REVIEW = (change: string, critical = 'None.'): string =>
  [
    `# External Review: ${change} (iteration 1)`,
    '',
    '**Reviewer**: test-model',
    '**Date**: 2026-10-06',
    '',
    '## CRITICAL',
    '',
    critical,
    '',
    '## WARNING',
    '',
    'None.',
    '',
    '## SUGGESTION',
    '',
    'None.',
    '',
    '## Direction',
    '',
    '**Disposition**: forward',
    '',
    'Fine.',
    '',
  ].join('\n');

const CRIT = '### Broken thing\n**File**: src/x.ts:1\n**Description**: it breaks\n**Reproduction**: run it';

describe('orbit external save', () => {
  let root: string;
  let changeDir: string;
  let src: string;
  const now = new Date('2026-10-06T10:00:00Z');

  beforeEach(() => {
    root = tmp();
    changeDir = path.join(root, 'orbit', 'changes', 'my-change');
    fs.mkdirSync(changeDir, { recursive: true });
    src = path.join(tmp(), 'raw.md');
  });

  const save = (extra: Partial<Parameters<typeof saveExternalReturn>[0]> = {}) =>
    saveExternalReturn({ projectRoot: root, change: 'my-change', mode: 'system', from: src, now, ...extra });
  const runsListing = (): string[] =>
    fs.existsSync(path.join(changeDir, '.orbit-runs')) ? fs.readdirSync(path.join(changeDir, '.orbit-runs')) : [];
  const refused = (fn: () => unknown, cause: RegExp): void => {
    const before = runsListing();
    expect(fn).toThrow(ExternalSaveError);
    expect(fn).toThrow(cause);
    expect(runsListing()).toEqual(before);
  };

  it('a return that opens with the heading is written unchanged', () => {
    fs.writeFileSync(src, REVIEW('my-change'));
    const r = save();
    expect(r).toEqual({ path: 'orbit/changes/my-change/.orbit-runs/external-system-2026-10-06T10-00-00Z.md', removed: [] });
    expect(fs.readFileSync(path.join(root, r.path), 'utf-8')).toBe(REVIEW('my-change'));
  });

  // @scenario behaviour orbit-external-runner :: The engine saves an external return into the trail :: A preamble is removed and reported
  it('a preamble is removed and reported; the rest is unchanged', () => {
    fs.writeFileSync(src, 'I could not save, commit, or push the findings file.\n' + REVIEW('my-change'));
    const r = save();
    expect(r.removed).toEqual(['I could not save, commit, or push the findings file.']);
    expect(fs.readFileSync(path.join(root, r.path), 'utf-8')).toBe(REVIEW('my-change'));
  });

  // @scenario behaviour orbit-external-runner :: The engine saves an external return into the trail :: A heading quoted inside a fence is not the cut point
  it('a heading quoted inside a fence is not the cut point (the proposal walk reproduction)', () => {
    const raw = 'Here is the template I was given:\n\n````markdown\n' + REVIEW('my-change') + '````\n\nMy review:\n\n' + REVIEW('my-change', CRIT);
    fs.writeFileSync(src, raw);
    const r = save();
    expect(fs.readFileSync(path.join(root, r.path), 'utf-8')).toBe(REVIEW('my-change', CRIT));
    const pass = readTrail(changeDir).passes;
    expect(pass).toHaveLength(1);
    expect(pass[0].critical).toBe(1);
  });

  it('a fence the preamble opens and never closes leaves no unfenced heading: refused', () => {
    fs.writeFileSync(src, '```\nunclosed\n' + REVIEW('my-change'));
    refused(save, /outside a fenced block/);
  });

  it('a leading byte-order mark is dropped before the search', () => {
    fs.writeFileSync(src, '﻿' + REVIEW('my-change'));
    const r = save();
    expect(r.removed).toEqual([]);
    expect(fs.readFileSync(path.join(root, r.path), 'utf-8')).toBe(REVIEW('my-change'));
  });

  // @scenario behaviour orbit-external-runner :: The engine saves an external return into the trail :: A return without an unfenced heading is refused
  it('no unfenced heading is refused, naming the source path', () => {
    fs.writeFileSync(src, 'Codex ran out of time.\n');
    refused(save, new RegExp(`no line beginning.*--from ${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  });

  it('a heading naming another change is refused', () => {
    fs.writeFileSync(src, REVIEW('other-change'));
    refused(save, /names another change/);
  });

  // @scenario behaviour orbit-external-runner :: The engine saves an external return into the trail :: A heading-bearing return the reader rejects is refused
  it('a heading-only return is refused by the trail reader', () => {
    fs.writeFileSync(src, '# External Review: my-change (iteration 1)\n');
    refused(save, /trail reader rejects/);
  });

  it('a return missing **Reviewer**: is refused by the trail reader', () => {
    fs.writeFileSync(src, REVIEW('my-change').replace('**Reviewer**: test-model\n', ''));
    refused(save, /trail reader rejects/);
  });

  // @scenario behaviour orbit-external-runner :: The engine saves an external return into the trail :: A return older than an apply is refused
  it('an apply token later than --launch is refused, naming the apply', () => {
    fs.mkdirSync(path.join(changeDir, '.orbit-runs'));
    fs.writeFileSync(path.join(changeDir, '.orbit-runs', 'apply-2026-10-06T10-05-00Z.json'), '{"command":"apply"}');
    fs.writeFileSync(src, REVIEW('my-change'));
    refused(() => save({ launch: '2026-10-06T10-00-00Z' }), /apply-2026-10-06T10-05-00Z\.json/);
    // An earlier apply, or no --launch, does not refuse.
    expect(save({ launch: '2026-10-06T10-06-00Z' }).path).toMatch(/external-system-/);
  });

  it('no --launch runs no apply check', () => {
    fs.mkdirSync(path.join(changeDir, '.orbit-runs'));
    fs.writeFileSync(path.join(changeDir, '.orbit-runs', 'apply-2026-10-06T10-05-00Z.json'), '{"command":"apply"}');
    fs.writeFileSync(src, REVIEW('my-change'));
    expect(() => save()).not.toThrow();
  });

  it.each([
    ['--from missing', () => ({ from: path.join(root, 'nope.md') }), /cannot read/],
    ['--as architecture', () => ({ mode: 'architecture' }), /proposal or system/],
    ['no such change', () => ({ change: 'no-such-change' }), /does not exist/],
  ])('%s is refused', (_l, extra, cause) => {
    fs.writeFileSync(src, REVIEW('my-change'));
    refused(() => save(extra() as never), cause);
  });

  it('text AFTER the review is kept byte for byte', () => {
    const raw = REVIEW('my-change') + '\nI could not commit the findings file.\n';
    fs.writeFileSync(src, raw);
    const r = save();
    expect(fs.readFileSync(path.join(root, r.path), 'utf-8')).toBe(raw);
  });

  // @scenario behaviour orbit-external-runner :: The engine saves an external return into the trail :: The saved token clears the trail
  it('the saved token is bumped until it collides with no trail file of any kind', () => {
    const runs = path.join(changeDir, '.orbit-runs');
    fs.mkdirSync(runs);
    fs.writeFileSync(path.join(runs, 'review-external-2026-10-06T10-00-00Z.json'), '{}');
    fs.writeFileSync(path.join(runs, 'external-prompt-system-2026-10-06T10-00-01Z.md'), 'x');
    fs.writeFileSync(src, REVIEW('my-change'));
    expect(save().path).toBe('orbit/changes/my-change/.orbit-runs/external-system-2026-10-06T10-00-02Z.md');
  });

  it('CRLF line endings are kept and the preamble lines are reported without the carriage return', () => {
    const body = REVIEW('my-change').replace(/\n/g, '\r\n');
    fs.writeFileSync(src, 'preamble\r\n' + body);
    const r = save();
    expect(r.removed).toEqual(['preamble']);
    expect(fs.readFileSync(path.join(root, r.path), 'utf-8')).toBe(body);
  });
});
