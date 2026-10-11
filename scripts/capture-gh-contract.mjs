#!/usr/bin/env node
/**
 * Capture the `gh` CLI contract the PR-lifecycle instruments derive from
 * (change rc01-instrument-fidelity, design D1/D2).
 *
 * This is the ONLY code in the repo that runs a real `gh`. It records, per command the
 * generated PR references invoke: the verbatim USAGE line and its positional shape, every
 * flag from FLAGS / INHERITED FLAGS as `{ long, short, takes_value }`, plus the two error
 * rules a help page cannot express (observed from the real CLI's stderr — both probes fail
 * before any network request), the availability probe's banner, and the gh version.
 *
 * Re-capture is a DELIBERATE act: `npm run capture:gh`, then review the diff like a
 * fingerprint refresh. The test suite reads the checked-in file and never shells to gh.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'test', 'integration', 'pr-lifecycle', 'gh-contract.json');

// Exactly the commands the three PR references invoke (design D1 / explore D-rc01-7).
const COMMANDS = ['repo view', 'pr list', 'pr create', 'pr view', 'pr edit', 'pr ready', 'pr merge'];

function gh(args) {
  const res = spawnSync('gh', args, { encoding: 'utf-8' });
  if (res.error) throw new Error(`gh is not runnable: ${res.error.message}`);
  return res;
}

/**
 * The help line's TYPE token → the parser class the real CLI applies to the value.
 * `int`/`number` parse as integers; everything else is free-form string. A flag with NO type
 * token is boolean and rejects an explicit non-boolean `=value`.
 */
export function classifyType(type) {
  const t = String(type).toLowerCase();
  if (t === 'int' || t === 'number' || t === 'n') return 'int';
  return 'string';
}

/** Parse a `gh <cmd> --help` page into { usage, positional, flags }. */
export function parseHelp(text, command) {
  const lines = text.split('\n');
  const section = (name) => {
    const start = lines.findIndex((l) => l === name);
    if (start < 0) return [];
    const body = [];
    for (let i = start + 1; i < lines.length; i++) {
      const l = lines[i];
      if (/^[A-Z][A-Z ]+$/.test(l)) break; // next section heading
      if (l.trim()) body.push(l);
    }
    return body;
  };
  const usageLine = section('USAGE')[0]?.trim();
  if (!usageLine) throw new Error(`no USAGE line for gh ${command}`);
  // `gh pr view [<number> | <url> | <branch>] [flags]` → shape is the middle; required when
  // the shape is present and not bracketed as optional.
  const m = usageLine.match(/^gh\s+(.+?)\s*(\[flags\])?$/);
  const afterCmd = m ? m[1].slice(command.length).trim() : '';
  const positional = afterCmd
    ? { shape: afterCmd, required: !afterCmd.startsWith('[') }
    : { shape: '', required: false };
  const flagLine = /^\s*(?:(-[A-Za-z]),\s+)?(--[a-z][a-z0-9-]*)(?:\s+(\S+))?\s{2,}/;
  const flags = [];
  for (const l of [...section('FLAGS'), ...section('INHERITED FLAGS')]) {
    const fm = l.match(flagLine);
    if (!fm) continue;
    const [, short, long, type] = fm;
    const takes = Boolean(type && !type.startsWith('-'));
    // The help line's TYPE token is the value's type, and the real CLI parses it before any
    // network call (`--web=garbage` → ParseBool error; `--limit=garbage` → ParseInt error).
    // Recording it lets the validator reject a malformed VALUE, not just an unknown name.
    flags.push({
      long,
      short: short ?? null,
      takes_value: takes,
      value_type: takes ? classifyType(type) : 'boolean',
    });
  }
  if (flags.length === 0) throw new Error(`no flags parsed for gh ${command}`);
  return { usage: usageLine, positional, flags };
}

function main() {
  const version = gh(['--version']);
  const banner = version.stdout.trim().split('\n')[0];
  const commands = {};
  for (const c of COMMANDS) {
    const res = gh([...c.split(' '), '--help']);
    if (res.status !== 0) throw new Error(`gh ${c} --help exited ${res.status}: ${res.stderr}`);
    commands[c] = parseHelp(res.stdout, c);
  }
  // The two rules a help page cannot express, observed from the real CLI (both fail before
  // any network request). Recorded as strings so the stub reproduces the real message.
  const repoViewRepoFlag = gh(['repo', 'view', '--repo', 'x/y', '--json', 'name']);
  const prViewNoSelector = gh(['pr', 'view', '--repo', 'x/y', '--json', 'isDraft']);
  if (repoViewRepoFlag.status === 0 || prViewNoSelector.status === 0) {
    throw new Error('a probe unexpectedly succeeded; the installed gh no longer matches the recorded rules');
  }
  const contract = {
    gh_version: banner,
    captured_at: new Date().toISOString().slice(0, 10),
    availability_probe: { argv: ['--version'], stdout: version.stdout },
    commands,
    rules: {
      repo_view_rejects_repo_flag: repoViewRepoFlag.stderr.trim().split('\n')[0],
      pr_selector_required_with_repo: prViewNoSelector.stderr.trim().split('\n')[0],
      // Orbit-side qualification (the shared resolution's contract) — the real CLI does NOT
      // enforce these (it would guess a repository); the stub and the sweep do.
      pr_verbs_require_repo: true,
      repo_view_requires_positional: true,
    },
  };
  fs.writeFileSync(out, JSON.stringify(contract, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), out)} (${COMMANDS.length} commands, ${banner})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
