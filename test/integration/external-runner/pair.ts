/**
 * rc17b-blind-pair-command task 6.1 — an EXECUTABLE TRANSCRIPTION of `references/blind-pair.md`'s
 * steps and of the external-handoff reference's Step 3b re-run, rc17d's `launch.ts` instrument
 * extended to the pair.
 *
 * LIMITS, stated rather than implied: it proves the documented commands are performable, in the
 * order given, against real git with a real bare remote — not that a reading AI follows the body.
 * It stays faithful to the prose only as far as a human keeps the two in step. The runner record
 * is passed as an argv (the engine's `orbit external runner` reads the per-user global config,
 * tested elsewhere); the fresh half is a STUB worker that persists through the real `orbit emit
 * review`; the launch T0, the save and the gate are the real CLI. The stub runner returns BEFORE
 * the stub fresh worker runs, so the save-after-fresh order is exercised on its hard side.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { quote, sh } from './launch.js';

export interface FreshStub {
  /** Whether the worker's `orbit emit review` lands a pass file. */
  emit: boolean;
  /** The worker's exit status (a worker stopped after its emit exits non-zero). */
  exit: number;
}

export interface PairOutcome {
  refused: string | null;
  route: 'launched' | 'pasted';
  L: string | null;
  base: string | null;
  reviewedCommit: string | null;
  freshPath: string | null;
  savedPath: string | null;
  failure: string | null;
  fallback: 'pull' | 'handoff-blocked' | null;
  /** Push attempts after BASE's push. */
  laterPushes: number;
  runDir: string;
}

const FRESH_PAYLOAD = (mode: string) => ({
  mode,
  reviewer_class: 'fresh',
  depth: 'full',
  flags: { parallel: false, focus: null, strict: false, fresh: true, mark: false, skip_verify: false },
  passes_run: mode === 'system' ? ['0', '1', '2', '3', '4', '5', '6'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
  passes_skipped: [],
  scorecard: {
    completeness: { critical: 0, warning: 0, suggestion: 0 },
    correctness: { critical: 0, warning: 0, suggestion: 0 },
    coherence: { critical: 0, warning: 0, suggestion: 0 },
  },
  findings: [],
  direction: { disposition: 'forward', reasoning: 'stub fresh worker' },
  model: null,
});

function cli(repo: string, cliEntry: string, args: string[]) {
  const r = spawnSync(process.execPath, [cliEntry, ...args], { cwd: repo, encoding: 'utf-8' });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

/** `orbit emit <cmd>` with a payload file; returns the written trail path (repo-relative). */
function emit(repo: string, cliEntry: string, cmd: string, change: string, payload: object, scratch: string): string {
  const file = path.join(scratch, `${cmd}-payload-${Date.now()}-${Math.random()}.json`);
  fs.writeFileSync(file, JSON.stringify(payload));
  const r = cli(repo, cliEntry, ['emit', cmd, '--change', change, '--payload', file]);
  if (r.status !== 0) throw new Error(`orbit emit ${cmd} failed: ${r.stderr}`);
  return r.stdout.trim().split('\n').pop()!.trim();
}

const tokenOf = (p: string) => /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/.exec(path.basename(p))![1];

function runsDir(repo: string, change: string): string {
  return path.join(repo, 'orbit', 'changes', change, '.orbit-runs');
}

/** Step 6's landing read: the earliest fresh pass of the mode later than L, from the trail. */
export function landedFresh(repo: string, change: string, mode: string, L: string): string | null {
  const dir = runsDir(repo, change);
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`review-${mode}-`) && f.endsWith('.json'))
    .sort();
  for (const f of files) {
    const cls = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')).reviewer_class;
    if (cls === 'fresh' && tokenOf(f) > L) return path.relative(repo, path.join(dir, f));
  }
  return null;
}

function runStub(argv: string[], worktree: string, output: string, prompt: string, runDir: string): number {
  const sub = argv.map((a) => a.split('{worktree}').join(worktree).split('{output}').join(output));
  const line =
    `( cd ${quote(worktree)} && ${sub.map(quote).join(' ')} < ${quote(prompt)}` +
    ` > ${quote(path.join(runDir, 'runner.log'))} 2>&1 )`;
  return spawnSync('/bin/sh', ['-c', line], { encoding: 'utf-8' }).status ?? 1;
}

function commitAlone(repo: string, p: string, msgOrFile: { m?: string; F?: string }): boolean {
  sh(repo, 'git', ['add', p]);
  const args = msgOrFile.F ? ['commit', '--only', p, '-F', msgOrFile.F] : ['commit', '--only', p, '-m', msgOrFile.m!];
  return sh(repo, 'git', args).status === 0;
}

/** The pair reference's thirteen steps (13 is the caller's read of the gate). */
export function runPair(opts: {
  repo: string;
  change: string;
  mode: 'proposal' | 'system';
  cliEntry: string;
  /** Step 1's runner reading: a reachable runner's argv, or null for the pasted route. */
  runner: string[] | null;
  fresh: FreshStub;
  scratch: string;
}): PairOutcome {
  const { repo, change, mode, cliEntry } = opts;
  const git = (...a: string[]) => sh(repo, 'git', a);
  const out: PairOutcome = {
    refused: null,
    route: opts.runner ? 'launched' : 'pasted',
    L: null,
    base: null,
    reviewedCommit: null,
    freshPath: null,
    savedPath: null,
    failure: null,
    fallback: null,
    laterPushes: 0,
    runDir: '',
  };

  // 1. preflight: a dirty tree refuses before anything is written; the runner is read once.
  const dirty = git('status', '--porcelain').stdout.trim();
  if (dirty !== '') {
    out.refused = dirty;
    return out;
  }

  // 2. the launch: the reviewed commit, the prompt, the T0 with pair: true.
  out.reviewedCommit = git('rev-parse', 'HEAD').stdout.trim();
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  const runDir = path.join(fs.realpathSync(os.tmpdir()), `orbit-external-${change}-${ts}`);
  out.runDir = runDir;
  fs.mkdirSync(runDir, { recursive: true });
  const worktree = path.join(runDir, 'worktree');
  const rel = `orbit/changes/${change}/.orbit-runs`;
  const promptPath = `${rel}/external-prompt-${mode}-${ts}.md`;
  fs.mkdirSync(path.join(repo, rel), { recursive: true });
  const repoLine = opts.runner ? worktree : `${repo} — read the repository at commit ${out.reviewedCommit}`;
  fs.writeFileSync(path.join(repo, promptPath), `# External Review: ${change} (iteration 1)\n\n## Repo\n\n${repoLine}\n`);
  const t0Path = emit(repo, cliEntry, 'review-external', change, {
    mode,
    pair: true,
    prompt_path: promptPath,
    target: opts.runner ? path.basename(opts.runner[0]) : null,
    final_assessment: `External review prompt packaged for ${change} (iter 1, mode ${mode}) as the external half of a launched blind pair; awaiting findings.`,
    model: null,
  }, opts.scratch);
  out.L = tokenOf(t0Path);

  // 3. BASE: the prompt and the T0 alone, on both routes, then push.
  git('add', promptPath, t0Path);
  if (git('commit', '--only', promptPath, t0Path, '-m', `External review handoff (${mode}, iter 1): ${change} — blind pair launch`).status !== 0) {
    out.failure = 'handoff commit failed';
    return out;
  }
  const basePushed = git('push').status === 0;
  out.base = git('rev-parse', 'HEAD').stdout.trim();

  // 5a. the external half, launched at BASE; its return stays outside the repository.
  const output = path.join(runDir, 'return.md');
  let runExit: number | null = null;
  if (opts.runner) {
    git('worktree', 'add', '--detach', worktree, out.base);
    runExit = runStub(opts.runner, worktree, output, path.join(worktree, promptPath), runDir);
  }

  // 5c. the fresh half: a stub worker persisting through the real emit surface.
  if (opts.fresh.emit) emit(repo, cliEntry, 'review', change, FRESH_PAYLOAD(mode), opts.scratch);

  // 6. landing, from the trail — never the worker's exit.
  out.freshPath = landedFresh(repo, change, mode, out.L);

  // 7. the fresh pass file, alone, before the external return enters the repository.
  let committed = false;
  if (out.freshPath) {
    committed = commitAlone(repo, out.freshPath, { m: `Fresh review (${mode}): ${change} — blind pair, fresh half` }) || committed;
  }

  // 8–9. the external return, saved with --launch L only now, committed alone by -F.
  if (opts.runner) {
    const fail = (cause: string) => {
      out.failure = cause;
      out.fallback = basePushed ? 'pull' : 'handoff-blocked';
    };
    if (runExit !== 0) fail(`runner exited ${runExit}`);
    else {
      const save = cli(repo, cliEntry, ['external', 'save', change, '--as', mode, '--from', output, '--launch', out.L, '--json']);
      if (save.status !== 0) fail(`save refused: ${save.stderr.trim()}`);
      else {
        const saved = JSON.parse(save.stdout) as { path: string; removed: string[] };
        out.savedPath = saved.path;
        const msgFile = path.join(runDir, 'commit-msg.txt');
        fs.writeFileSync(msgFile, `External review (${mode}, iter 1): ${change}\n`);
        committed = commitAlone(repo, saved.path, { F: msgFile }) || committed;
      }
    }
  }

  // 10. one push, after both commits.
  if (committed) {
    git('push');
    out.laterPushes++;
  }
  // 11. the worktree.
  if (opts.runner) git('worktree', 'remove', '--force', worktree);
  return out;
}

export interface RerunOutcome {
  kind: 're-run' | 'single';
  L: string | null;
  base: string | null;
  worktreeBase: string;
  worktreeHadFresh: boolean;
  saveLaunch: string;
  savedPath: string | null;
  failure: string | null;
}

/** The external-handoff reference's Step 3b re-run, then its 9a–9d on the launch route. */
export function runExternalRerun(opts: {
  repo: string;
  change: string;
  mode: 'proposal' | 'system';
  cliEntry: string;
  runner: string[];
  scratch: string;
}): RerunOutcome {
  const { repo, change, mode, cliEntry } = opts;
  const git = (...a: string[]) => sh(repo, 'git', a);
  const status = JSON.parse(cli(repo, cliEntry, ['status', '--change', change, '--json']).stdout);
  const row = status.gates.find((g: any) => g.id === `review-${mode}`);
  const dir = runsDir(repo, change);
  const files = fs.readdirSync(dir).sort();
  const launches = files.filter((f) => {
    if (!/^review-external-.*\.json$/.test(f)) return false;
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    return j.pair === true && j.mode === mode;
  });
  const lFile = launches[launches.length - 1];
  const L = lFile ? tokenOf(lFile) : null;
  const applyLater = L !== null && files.some((f) => /^apply-/.test(f) && tokenOf(f) > L);
  const isRerun = row?.openPair?.missing === 'external' && L !== null && !applyLater;
  let base: string | null = null;
  if (isRerun) {
    const lines = git('log', '--diff-filter=A', '--format=%H', '--', `orbit/changes/${change}/.orbit-runs/${lFile}`).stdout.trim().split('\n');
    base = lines[lines.length - 1];
  }

  // The re-run's own packaging: its prompt, its T0 with no pair, its handoff commit.
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  const runDir = path.join(fs.realpathSync(os.tmpdir()), `orbit-external-${change}-${ts}-rerun`);
  fs.mkdirSync(runDir, { recursive: true });
  const worktree = path.join(runDir, 'worktree');
  const rel = `orbit/changes/${change}/.orbit-runs`;
  const promptPath = `${rel}/external-prompt-${mode}-${ts}.md`;
  fs.writeFileSync(path.join(repo, promptPath), `# External Review: ${change} (iteration 2)\n\n## Repo\n\n${worktree}\n`);
  const t0Path = emit(repo, cliEntry, 'review-external', change, {
    mode,
    prompt_path: promptPath,
    target: path.basename(opts.runner[0]),
    final_assessment: `External review prompt packaged for ${change} (iter 2, mode ${mode}); awaiting findings.`,
    model: null,
  }, opts.scratch);
  git('add', promptPath, t0Path);
  git('commit', '--only', promptPath, t0Path, '-m', `External review handoff (${mode}, iter 2): ${change}`);
  git('push');
  const handoff = git('rev-parse', 'HEAD').stdout.trim();

  const worktreeBase = isRerun ? base! : handoff;
  git('worktree', 'add', '--detach', worktree, worktreeBase);
  const wtRuns = path.join(worktree, rel);
  const worktreeHadFresh =
    fs.existsSync(wtRuns) &&
    fs.readdirSync(wtRuns).some((f) => f.startsWith(`review-${mode}-`) && JSON.parse(fs.readFileSync(path.join(wtRuns, f), 'utf-8')).reviewer_class === 'fresh');
  // 9c: on a re-run the prompt comes from the live checkout's copy; BASE does not contain it.
  const prompt = isRerun ? path.join(repo, promptPath) : path.join(worktree, promptPath);
  const output = path.join(runDir, 'return.md');
  const exit = runStub(opts.runner, worktree, output, prompt, runDir);
  const saveLaunch = isRerun ? L! : tokenOf(t0Path);
  const out: RerunOutcome = { kind: isRerun ? 're-run' : 'single', L, base, worktreeBase, worktreeHadFresh, saveLaunch, savedPath: null, failure: null };
  if (exit !== 0) out.failure = `runner exited ${exit}`;
  else {
    const save = cli(repo, cliEntry, ['external', 'save', change, '--as', mode, '--from', output, '--launch', saveLaunch, '--json']);
    if (save.status !== 0) out.failure = `save refused: ${save.stderr.trim()}`;
    else {
      out.savedPath = JSON.parse(save.stdout).path;
      const msgFile = path.join(runDir, 'commit-msg.txt');
      fs.writeFileSync(msgFile, `External review (${mode}, iter 2): ${change}\n`);
      commitAlone(repo, out.savedPath!, { F: msgFile });
      git('push');
    }
  }
  git('worktree', 'remove', '--force', worktree);
  return out;
}
