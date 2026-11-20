#!/usr/bin/env node
// npm run validate:skills — `claude plugin validate --strict` over a freshly generated skill surface
// (orbit-replay-set: `CI validates the generated skill surface`; reduce-orbit-phase2's R-rop2-5).
//
// It generates the surface in a temporary project with this checkout's built CLI
// (`node bin/orbit.js init --tools claude`) and validates its `.claude/` directory with Claude Code
// pinned to PINNED: the `claude` on PATH when it reports that version, otherwise
// `npx --yes @anthropic-ai/claude-code@<PINNED>`. A validation error or warning exits non-zero.
//
//   node scripts/validate-skills.mjs [--surface <dir>] [--npx]
//     --surface <dir>  validate an existing `.claude/` directory instead of generating one
//     --npx            use the pinned npx copy even when a matching `claude` is on PATH
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PINNED = '2.1.329';
const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = { ...process.env, DISABLE_AUTOUPDATER: '1' };

function parse(argv) {
  const o = { surface: null, npx: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--npx') o.npx = true;
    else if (argv[i] === '--surface' && argv[i + 1]) o.surface = path.resolve(argv[++i]);
    else {
      console.error(`validate-skills: unknown argument ${argv[i]}`);
      process.exit(2);
    }
  }
  return o;
}

function validator(forceNpx) {
  if (!forceNpx) {
    const r = spawnSync('claude', ['--version'], { encoding: 'utf8', env });
    if (r.status === 0 && r.stdout.trim().startsWith(`${PINNED} `)) return { cmd: 'claude', pre: [] };
  }
  return { cmd: 'npx', pre: ['--yes', `@anthropic-ai/claude-code@${PINNED}`] };
}

const o = parse(process.argv.slice(2));
let surface = o.surface;
let tmp = null;
if (!surface) {
  const cli = path.join(REPO, 'bin', 'orbit.js');
  if (!fs.existsSync(path.join(REPO, 'dist', 'cli', 'index.js'))) {
    console.error('validate-skills: no dist/ build; run `npm run build` first');
    process.exit(2);
  }
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-validate-skills-'));
  const init = spawnSync(process.execPath, [cli, 'init', '--tools', 'claude'], { cwd: tmp, encoding: 'utf8', env });
  if (init.status !== 0) {
    console.error(`validate-skills: orbit init failed\n${init.stdout}\n${init.stderr}`);
    process.exit(1);
  }
  surface = path.join(tmp, '.claude');
}

const v = validator(o.npx);
console.log(`validate-skills: ${v.cmd} ${[...v.pre, 'plugin', 'validate', '--strict', surface].join(' ')}`);
const r = spawnSync(v.cmd, [...v.pre, 'plugin', 'validate', '--strict', surface], { stdio: 'inherit', env });
if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
if (r.error) {
  console.error(`validate-skills: ${r.error.message}`);
  process.exit(1);
}
process.exit(r.status ?? 1);
