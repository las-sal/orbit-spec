/**
 * Capture the `git` contract the snippet sweep validates against (rc05b-git-grammar, design
 * D3/D4). Run it with `npm run capture:git`; it runs under `scripts/capture.vitest.config.ts`,
 * which collects this file only, because it reaches the TypeScript extractor through the test
 * toolchain. A plain `npm test` never collects it.
 *
 * This is the ONLY code in the repo that runs a real `git` for grammar. Its candidate set is
 * every `git` segment the shared extractor finds on the generated surface and in every user
 * doc, listed or not (docs-under-test design D8), bare names included; each probe runs in its
 * OWN fresh copy of a template repository. The probe table
 * is `orbit-cli-grammar`'s `Every \`git\` and \`gh\` snippet on the generated surface
 * validates against its tool's recorded contract`; the classifiers live in
 * `test/helpers/git-capture.ts`.
 *
 * Re-capture is a DELIBERATE act: run it, then review the diff like `capture:gh`'s. A command
 * it cannot classify fails the capture, and nothing is written.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { it } from 'vitest';
import {
  BOGUS_FLAG,
  BOGUS_VERB,
  ORBIT_SIDE_RULES,
  acceptanceArgs,
  acceptanceFrom,
  captureCandidates,
  classFrom,
  firstLineOf,
  flagEntry,
  formsByName,
  isGroup,
  keyOf,
  knownFrom,
  positionalRequiredFrom,
  takesValueFrom,
  type Probe,
  type ProbeClass,
} from '../test/helpers/git-capture.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'test', 'integration', 'cli-contracts', 'git-contract.json');

const IDENTITY = { name: 'orbit capture', email: 'capture@orbit.invalid' };

/** No user configuration, no editor, no prompt, a fixed locale. */
const ENV: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  LANG: 'C',
  LC_ALL: 'C',
  GIT_EDITOR: 'false',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_TERMINAL_PROMPT: '0',
  GIT_AUTHOR_NAME: IDENTITY.name,
  GIT_AUTHOR_EMAIL: IDENTITY.email,
  GIT_COMMITTER_NAME: IDENTITY.name,
  GIT_COMMITTER_EMAIL: IDENTITY.email,
};

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}

function git(cwd: string, args: string[]): Run {
  const res = spawnSync('git', args, { cwd, env: ENV, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10_000 });
  if (res.error) throw new Error(`git ${args.join(' ')}: ${res.error.message}`);
  return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

/** One commit on branch `main`, no remote. */
function templateRepository(root: string): string {
  const dir = path.join(root, 'template');
  fs.mkdirSync(dir);
  for (const args of [['init', '-q', '-b', 'main'], ['add', 'README'], ['commit', '-q', '-m', 'init']]) {
    if (args[0] === 'add') fs.writeFileSync(path.join(dir, 'README'), 'probe\n');
    const res = git(dir, args);
    if (res.status !== 0) throw new Error(`template repository: git ${args.join(' ')}: ${res.stderr}`);
  }
  return dir;
}

function capture(): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-git-capture-'));
  try {
    const template = templateRepository(root);
    let probes = 0;
    const probe = (args: string[]): Probe => {
      const dir = path.join(root, `probe-${probes++}`);
      fs.cpSync(template, dir, { recursive: true });
      const res = git(dir, args);
      fs.rmSync(dir, { recursive: true, force: true });
      return { status: res.status, firstLine: firstLineOf(res.stderr, res.stdout) };
    };

    // The candidate set: every `git` segment on the generated surface and in every user doc,
    // listed or not, bare names included (no command tree).
    const segments = captureCandidates();

    // 1. Groups and keys.
    const firstWords = [...new Set(segments.map((argv) => argv[0]).filter((w): w is string => w !== undefined))].sort();
    const groups = new Set(firstWords.filter((word) => isGroup(probe([word, BOGUS_VERB]))));
    const byKey = new Map<string, string[][]>();
    for (const argv of segments) {
      const key = keyOf(argv, groups);
      if (key === null) continue; // a group named alone, or with no verb: the sweep decides it
      byKey.set(key, [...(byKey.get(key) ?? []), argv]);
    }

    const commands: Record<string, unknown> = {};
    for (const key of [...byKey.keys()].sort()) {
      const words = key.split(' ');
      // 2. Known.
      const known = knownFrom(key, probe([...words, '-h']));
      if (!known.known) {
        commands[key] = { known: false, message: known.message };
        continue;
      }
      // 3. Class.
      const probeClass: ProbeClass = classFrom(key, probe([...words, BOGUS_FLAG, '-h']), probe([...words, BOGUS_FLAG, 'HEAD']));
      // 4. Per flag, one entry per name the surface writes, every written form probed.
      const flags = [...formsByName(byKey.get(key)!, key)]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, forms]) => {
          if (probeClass === 'rule') return { name, takes_value: false, accepted: true };
          const takesValue = takesValueFrom(probe([...words, name]));
          const acceptances = forms.map((flag) => {
            const args = acceptanceArgs(key, flag, takesValue, probeClass);
            return acceptanceFrom(probeClass, `git ${args.join(' ')}`, probe(args));
          });
          return flagEntry(name, takesValue, acceptances);
        });
      // 5. Positional.
      const positionalRequired = positionalRequiredFrom(probe(words));
      commands[key] = { known: true, class: probeClass, positional_required: positionalRequired, flags };
    }

    const version = git(root, ['--version']).stdout.trim();
    const contract = {
      git_version: version,
      captured_at: new Date().toISOString().slice(0, 10),
      commands,
      rules: Object.fromEntries(Object.values(ORBIT_SIDE_RULES).map((rule) => [rule, true])),
    };
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(contract, null, 2) + '\n');
    const flagCount = Object.values(commands).reduce<number>((n, c) => n + ((c as { flags?: unknown[] }).flags?.length ?? 0), 0);
    console.log(
      `wrote ${path.relative(process.cwd(), out)}: ${segments.length} segments, ${Object.keys(commands).length} keys, ` +
        `${flagCount} flags, ${probes} probes (${version})`
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

it('captures the git contract from real git', capture, 300_000);
