import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadChangeContext, formatChangeStatus } from '../../src/core/artifact-graph/instruction-loader.js';
import { resolveChainSetting } from '../../src/core/project-config.js';
import {
  CHAIN_KEY_TABLE,
  chainKeyFor,
  chainTargetFor,
  composeChainObject,
  trailHead,
  type ChainObject,
} from '../../src/core/chain.js';
import type { RunnerResolution } from '../../src/core/external-runner.js';
import { statusCommand } from '../../src/commands/workflow/status.js';

/**
 * seam-chaining — the `chain` setting and the `chain` object (`orbit-engine-gates`' `The chain setting
 * grants each command on its own key` and `The change status says whether the next command may run
 * unasked`), over hand-written trails in a disposable project (`<root>/orbit/changes/x`).
 */

type Sev = 'CRITICAL' | 'WARNING' | 'SUGGESTION';
const T = (n: number) => `2026-11-09T11-${String(n).padStart(2, '0')}-00Z`;

let root: string;
let dir: string;
let runs: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'seam-chaining-'));
  dir = path.join(root, 'orbit', 'changes', 'x');
  runs = path.join(dir, '.orbit-runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.mkdirSync(path.join(dir, 'specs'), { recursive: true });
  for (const f of ['proposal.md', 'design.md']) fs.writeFileSync(path.join(dir, f), '# x');
  fs.writeFileSync(path.join(dir, 'specs', 's.md'), '# s');
  fs.writeFileSync(path.join(dir, '.openspec.yaml'), 'schema: spec-driven\ncreated: 2026-11-09\n');
  setTasks(true);
  config('');
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(root, { recursive: true, force: true });
});

function setTasks(done: boolean): void {
  fs.writeFileSync(path.join(dir, 'tasks.md'), done ? '- [x] one\n' : '- [ ] one\n');
}
function config(yaml: string): void {
  fs.writeFileSync(path.join(root, 'orbit', 'config.yaml'), `schema: spec-driven\n${yaml}`);
}
function review(token: string, mode: string, cls: string, findings: Array<[Sev, string]> = []): string {
  const name = `review-${mode}-${token}.json`;
  fs.writeFileSync(
    path.join(runs, name),
    JSON.stringify({
      command: 'review',
      mode,
      reviewer_class: cls,
      findings: findings.map(([severity, title]) => ({ severity, title, file: `f/${title}.ts` })),
    })
  );
  return name;
}
function walk(token: string, source: string, entries: Array<[Sev, string]>): void {
  fs.writeFileSync(
    path.join(runs, `address-reviews-${token}.json`),
    JSON.stringify({
      source_path: `orbit/changes/x/.orbit-runs/${source}`,
      resolution_summary: { resolved: entries.length, deferred: 0, escalated: 0 },
      resolutions: entries.map(([severity, title]) => ({ severity, title, file: `f/${title}.ts`, outcome: 'resolved' })),
    })
  );
}
function decision(name: string, record: Record<string, unknown>): void {
  fs.mkdirSync(path.join(runs, 'decisions'), { recursive: true });
  fs.writeFileSync(path.join(runs, 'decisions', name), JSON.stringify({ change: 'x', model: null, ...record }));
}

const REACHABLE: RunnerResolution = { runner: { form: 'preset', name: 'codex', argv: ['codex'], reachable: true }, warnings: [] };
const NO_RUNNER: RunnerResolution = { runner: null, warnings: [] };

/** The engine's `next_command` for the fixture change, as `orbit status --change x --json` reports it. */
function nextCommand(): string | undefined {
  return formatChangeStatus(loadChangeContext(root, 'x')).next_command;
}
function chain(opts: { chainRan?: string; chainHead?: string; runner?: RunnerResolution } = {}): ChainObject {
  return composeChainObject(root, dir, nextCommand(), { runner: REACHABLE, ...opts });
}

// ---- The chain setting grants each command on its own key --------------------------------------

describe('The chain setting grants each command on its own key', () => {
  it('the resolver: absent, non-map, false, non-boolean and unknown keys grant nothing', () => {
    config('');
    expect(resolveChainSetting(root)).toEqual({ configured: false, grants: { review: false, 'review-external': false, 'address-reviews': false } });
    for (const v of ['chain: true', 'chain: [review]', 'chain:', 'chain: review']) {
      config(`${v}\n`);
      expect(resolveChainSetting(root).configured, v).toBe(false);
      expect(Object.values(resolveChainSetting(root).grants).some(Boolean), v).toBe(false);
    }
    config('chain:\n  review: false\n  review-external: "true"\n  address-reviews: 1\n  apply: true\n');
    const s = resolveChainSetting(root);
    expect(s.configured).toBe(true);
    expect(s.grants).toEqual({ review: false, 'review-external': false, 'address-reviews': false });
    config('chain:\n  review: true\n');
    expect(resolveChainSetting(root).grants).toEqual({ review: true, 'review-external': false, 'address-reviews': false });
    fs.rmSync(path.join(root, 'orbit', 'config.yaml'));
    expect(resolveChainSetting(root).configured).toBe(false);
  });

  it('the key table maps each row form to its key, and apply/archive to no key', () => {
    for (const [key, forms] of Object.entries(CHAIN_KEY_TABLE)) {
      for (const form of forms) {
        for (const mode of ['proposal', 'system']) {
          const cmd = form.replace('<mode>', mode).replace('<change>', 'x');
          expect(chainKeyFor(cmd), cmd).toBe(key);
        }
      }
    }
    for (const cmd of ['/orbit:apply x', '/orbit:apply x — user-invoked', '/orbit:archive x', '/orbit:archive x — user-invoked']) {
      expect(chainKeyFor(cmd), cmd).toBeNull();
      expect(chainTargetFor(cmd), cmd).toBe(cmd.startsWith('/orbit:apply') ? 'apply' : 'archive');
    }
    // A review form never carries the consent marker; one that did would be no row's.
    expect(chainTargetFor('/orbit:review --as system --fresh x — user-invoked')).toBeNull();
    expect(chainTargetFor('/orbit:review --as system --reviewer pair x')).toBeNull();
  });

  it('every command string the gate walk can return maps to a key, or to apply or archive', () => {
    // Read the producers' own literals — commandForClass, canonicalNextForReviewed, nextAfterPass and the
    // walk's frontier line in gates.ts, the tracked-gate apply line in instruction-loader.ts — so a new
    // command form fails here before it reaches a chain unmapped.
    const files = ['src/core/artifact-graph/gates.ts', 'src/core/artifact-graph/instruction-loader.ts'];
    const commands: string[] = [];
    for (const f of files) {
      for (const line of fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf-8').split('\n')) {
        const t = line.trim();
        if (t.startsWith('//') || t.startsWith('*')) continue;
        for (const m of t.matchAll(/`(\/orbit:[^`]*)`/g)) {
          for (const mode of ['proposal', 'system']) {
            commands.push(m[1].replace(/\$\{(?:mode|m)\}/g, mode).replace(/\$\{[^}]+\}/g, 'x'));
          }
        }
      }
    }
    expect(commands.length).toBeGreaterThanOrEqual(26); // 13 producer literals × 2 modes
    for (const cmd of commands) {
      const target = chainTargetFor(cmd);
      expect(target, cmd).not.toBeNull();
      if (target === 'apply' || target === 'archive') {
        expect(chainTargetFor(`${cmd} — user-invoked`), cmd).toBe(target);
      }
    }
  });

  // @scenario behaviour orbit-engine-gates :: The chain setting grants each command on its own key :: An absent key grants nothing and changes no readout
  it('an absent key grants nothing and changes no readout', () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    const before = formatChangeStatus(loadChangeContext(root, 'x'));
    config('chain:\n  review: true\n  review-external: true\n  address-reviews: true\n');
    const granted = formatChangeStatus(loadChangeContext(root, 'x'));
    expect(JSON.stringify(granted.gates)).toBe(JSON.stringify(before.gates));
    expect(granted.position).toBe(before.position);
    expect(granted.next_command).toBe(before.next_command);
    config('');
    const c = chain();
    expect(c.may_run).toBe(false);
    expect(c.configured).toBe(false);
  });

  // @scenario behaviour orbit-engine-gates :: The chain setting grants each command on its own key :: Granting review does not grant an external review
  it('granting review does not grant an external review', () => {
    config('chain:\n  review: true\n');
    const c = composeChainObject(root, dir, '/orbit:review --as system --reviewer blind-pair x', { runner: REACHABLE });
    expect(c).toMatchObject({ may_run: false, why: 'not-granted' });
    config('chain:\n  review-external: true\n');
    expect(composeChainObject(root, dir, '/orbit:review --as system --reviewer blind-pair x', { runner: REACHABLE }).may_run).toBe(true);
  });

  // @scenario behaviour orbit-engine-gates :: The chain setting grants each command on its own key :: A key no row names grants nothing
  it('a key no row names grants nothing', () => {
    config('chain:\n  apply: true\n  review: "yes"\n');
    for (const cmd of ['/orbit:apply x — user-invoked', '/orbit:review --as proposal --fresh x']) {
      expect(composeChainObject(root, dir, cmd, { runner: REACHABLE }), cmd).toMatchObject({ may_run: false, why: 'not-granted' });
    }
    config('chain:\n  review: true\n');
    expect(composeChainObject(root, dir, '/orbit:review --as proposal --fresh x', { runner: REACHABLE }).may_run).toBe(true);
  });
});

// ---- The change status says whether the next command may run unasked ---------------------------

describe('The change status says whether the next command may run unasked', () => {
  it('head counts run records only: emits and returns, never the launch record, prompts or decisions/', () => {
    expect(trailHead(dir)).toBeNull();
    review(T(1), 'system', 'fresh');
    fs.writeFileSync(path.join(runs, `external-system-${T(2)}.md`), '# r');
    expect(trailHead(dir)).toBe(T(2));
    fs.writeFileSync(path.join(runs, `review-external-${T(3)}.json`), '{}');
    fs.writeFileSync(path.join(runs, `external-prompt-system-${T(4)}.md`), '# p');
    decision(`ledger-${T(5)}.json`, { command: 'ledger' });
    expect(trailHead(dir)).toBe(T(2));
    walk(T(6), `review-system-${T(1)}.json`, []);
    expect(trailHead(dir)).toBe(T(6));
  });

  it('none: the engine names no next command', () => {
    config('chain:\n  review: true\n');
    expect(composeChainObject(root, dir, undefined)).toMatchObject({ next: null, may_run: false, why: 'none' });
    expect(composeChainObject(root, dir, null).why).toBe('none');
  });

  it('the rows are tested in order: not-granted before open-stop, open-stop before needs-user', () => {
    decision(`stop-${T(1)}.json`, { command: 'stop', condition: 'outward-act', about: 'a', question: 'q?' });
    config('');
    expect(composeChainObject(root, dir, '/orbit:review --as system --reviewer external x', { runner: NO_RUNNER }).why).toBe('not-granted');
    config('chain:\n  review-external: true\n');
    expect(composeChainObject(root, dir, '/orbit:review --as system --reviewer external x', { runner: NO_RUNNER }).why).toBe('open-stop');
    decision(`resolution-${T(2)}.json`, { command: 'resolution', stop: `stop-${T(1)}.json`, answer: 'a', effect: 'e' });
    expect(composeChainObject(root, dir, '/orbit:review --as system --reviewer external x', { runner: NO_RUNNER }).why).toBe('needs-user');
  });

  // @scenario behaviour orbit-engine-gates :: The change status says whether the next command may run unasked :: A granted next command may run
  it('a granted next command may run', () => {
    config('chain:\n  address-reviews: true\n');
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    expect(nextCommand()).toBe('/orbit:address-reviews x');
    const c = chain();
    expect(c).toEqual({ next: '/orbit:address-reviews x', configured: true, head: T(1), may_run: true });
    expect('why' in c).toBe(false);
  });

  // @scenario behaviour orbit-engine-gates :: The change status says whether the next command may run unasked :: An open stop record halts a granted chain
  it('an open stop record halts a granted chain', () => {
    config('chain:\n  address-reviews: true\n');
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    decision(`ledger-${T(2)}.json`, { command: 'ledger' });
    decision(`stop-${T(3)}.json`, { command: 'stop', condition: 'outward-act', about: 'a', question: 'q?' });
    decision(`stop-${T(4)}.json`, { command: 'stop', condition: 'outward-act', about: 'b', question: 'r?' });
    expect(chain()).toMatchObject({
      may_run: false,
      why: 'open-stop',
      stop: `orbit/changes/x/.orbit-runs/decisions/stop-${T(3)}.json`,
    });
  });

  // @scenario behaviour orbit-engine-gates :: The change status says whether the next command may run unasked :: An answered stop lets the chain run again
  it('an answered stop lets the chain run again — including one answered through its replacement chain', () => {
    config('chain:\n  address-reviews: true\n');
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    decision(`stop-${T(3)}.json`, { command: 'stop', condition: 'outward-act', about: 'a', question: 'q?' });
    decision(`stop-${T(4)}.json`, { command: 'stop', condition: 'outward-act', about: 'a2', question: 'q2?', replaces: `stop-${T(3)}.json` });
    expect(chain().why).toBe('open-stop');
    // The resolution names the ORIGINAL stop; its replacement is answered with it.
    decision(`resolution-${T(5)}.json`, { command: 'resolution', stop: `stop-${T(3)}.json`, answer: 'yes', effect: 'e' });
    expect(chain()).toMatchObject({ may_run: true });
  });

  // @scenario behaviour orbit-engine-gates :: The change status says whether the next command may run unasked :: A pasted external review needs the user
  it('a pasted external review needs the user — no runner, or one not reachable', () => {
    config('chain:\n  review-external: true\n');
    const cmd = '/orbit:review --as system --reviewer blind-pair x';
    expect(composeChainObject(root, dir, cmd, { runner: NO_RUNNER })).toMatchObject({ may_run: false, why: 'needs-user' });
    const unreachable: RunnerResolution = { runner: { ...REACHABLE.runner!, reachable: false }, warnings: [] };
    expect(composeChainObject(root, dir, cmd, { runner: unreachable }).why).toBe('needs-user');
    expect(composeChainObject(root, dir, cmd, { runner: REACHABLE }).may_run).toBe(true);
    // needs-user is the external forms' row only.
    config('chain:\n  review: true\n');
    expect(composeChainObject(root, dir, '/orbit:review --as system --fresh x', { runner: NO_RUNNER }).may_run).toBe(true);
  });

  // @scenario behaviour orbit-engine-gates :: The change status says whether the next command may run unasked :: A launch that wrote no run record is not run again
  it('a launch that wrote no run record is not run again — a runner that fails on every launch', () => {
    config('chain:\n  review-external: true\nreview_preference:\n  review-system: external\n');
    review(T(1), 'system', 'in-context');
    const first = chain();
    expect(first.next).toBe('/orbit:review --as system --reviewer external x');
    expect(first.may_run).toBe(true);
    // Each failed launch writes only its prompt and its launch record (the runner exits non-zero).
    for (const n of [2, 3]) {
      fs.writeFileSync(path.join(runs, `external-prompt-system-${T(n)}.md`), '# prompt');
      fs.writeFileSync(path.join(runs, `review-external-${T(n)}.json`), JSON.stringify({ command: 'review-external', mode: 'system' }));
      const again = chain({ chainRan: first.next!, chainHead: first.head! });
      expect(again.head).toBe(first.head);
      expect(again).toMatchObject({ may_run: false, why: 'no-progress' });
    }
    // Without the two flags the row never matches; with a moved head it does not either.
    expect(chain().may_run).toBe(true);
    fs.writeFileSync(path.join(runs, `external-system-${T(4)}.md`), '# r');
    expect(chain({ chainRan: '/orbit:review --as system --reviewer external x', chainHead: first.head! }).why).not.toBe('no-progress');
  });

  it('no-progress compares a null head as the word null', () => {
    config('chain:\n  review: true\n');
    const cmd = '/orbit:review --as proposal --fresh x';
    expect(composeChainObject(root, dir, cmd, { chainRan: cmd, chainHead: 'null' }).why).toBe('no-progress');
    expect(composeChainObject(root, dir, cmd, { chainRan: '/orbit:address-reviews x', chainHead: 'null' }).may_run).toBe(true);
  });

  // @scenario behaviour orbit-engine-gates :: The change status says whether the next command may run unasked :: The human readout is unchanged
  it('the human readout is unchanged and the JSON gains only the chain key', async () => {
    review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    const cwd = process.cwd();
    const capture = async (opts: { json?: boolean }): Promise<string> => {
      const out: string[] = [];
      const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => void out.push(a.join(' ')));
      try {
        process.chdir(root);
        await statusCommand({ change: 'x', ...opts });
      } finally {
        process.chdir(cwd);
        log.mockRestore();
      }
      return out.join('\n');
    };
    const plain = await capture({});
    const json = JSON.parse(await capture({ json: true }));
    for (const setting of ['chain:\n  address-reviews: true\n', 'chain:\n  review: true\n  review-external: true\n', 'chain: nonsense\n']) {
      config(setting);
      expect(await capture({}), setting).toBe(plain);
      const granted = JSON.parse(await capture({ json: true }));
      expect(JSON.stringify(granted.gates)).toBe(JSON.stringify(json.gates));
      expect(granted.next_command).toBe(json.next_command);
      expect(granted.position).toBe(json.position);
      const { chain: a, ...restA } = granted;
      const { chain: b, ...restB } = json;
      expect(JSON.stringify(restA)).toBe(JSON.stringify(restB));
      expect(a).toBeDefined();
      expect(b).toBeDefined();
    }
    expect(plain).not.toMatch(/chain/i);
  });
});

// ---- The fixture chain (task 5.1) ---------------------------------------------------------------

describe('the fixture chain: review → walk → review', () => {
  it('a walk granted after findings, halted by an open stop, then the next review is its own key', () => {
    config('chain:\n  address-reviews: true\n');
    const pass = review(T(1), 'system', 'fresh', [['WARNING', 'w']]);
    expect(chain()).toMatchObject({ next: '/orbit:address-reviews x', may_run: true });

    decision(`stop-${T(2)}.json`, { command: 'stop', condition: 'unresolvable-critical', about: 'a', question: 'q?' });
    expect(chain()).toMatchObject({ may_run: false, why: 'open-stop' });
    decision(`resolution-${T(3)}.json`, { command: 'resolution', stop: `stop-${T(2)}.json`, answer: 'a', effect: 'e' });

    walk(T(4), pass, [['WARNING', 'w']]);
    const afterWalk = chain();
    expect(afterWalk.next).toMatch(/^\/orbit:review --as system /);
    expect(afterWalk).toMatchObject({ may_run: false, why: 'not-granted' });

    config('chain:\n  address-reviews: true\n  review: true\n  review-external: true\n');
    expect(chain().may_run).toBe(true);
  });
});
