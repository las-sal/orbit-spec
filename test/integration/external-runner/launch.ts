/**
 * rc17d-external-runner task 5.1 — an EXECUTABLE TRANSCRIPTION of the external-handoff reference's
 * launch route (Step 3a's dirty-tree rule and Step 9a–9d), the PR-lifecycle harness's instrument.
 *
 * LIMITS, stated rather than implied: it proves the documented commands are performable, in the
 * order given, against real git with a real bare remote — not that a reading AI follows the body.
 * It stays faithful to the prose only as far as a human keeps the two in step. The T0 emit is
 * written as a fixture file (the emit surface is tested elsewhere); `orbit external save` runs
 * through the real CLI.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface LaunchOutcome {
  launched: boolean;
  handoffPushed: boolean;
  runExit: number | null;
  saved: { path: string; removed: string[] } | null;
  returnCommitted: boolean;
  returnPushed: boolean;
  /** The paste fallback printed on a failed run: the pull invocation, or the handoff-blocked output. */
  fallback: 'pull' | 'handoff-blocked' | null;
  failure: string | null;
  runDir: string;
}

export function sh(cwd: string, cmd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf-8' });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

/** Step 9c's quoting rule: single-quote every element, an embedded `'` written `'\''`. */
export function quote(el: string): string {
  return `'${el.replace(/'/g, `'\\''`)}'`;
}

export function runLaunchRoute(opts: {
  repo: string;
  change: string;
  mode: 'proposal' | 'system';
  argv: string[];
  cliEntry: string;
  token: string;
  t0Token: string;
}): LaunchOutcome {
  const { repo, change, mode } = opts;
  const git = (...a: string[]) => sh(repo, 'git', a);
  const out: LaunchOutcome = {
    launched: false,
    handoffPushed: false,
    runExit: null,
    saved: null,
    returnCommitted: false,
    returnPushed: false,
    fallback: null,
    failure: null,
    runDir: '',
  };

  // Step 3a: a dirty tree, read BEFORE the prompt is written, launches nothing and writes nothing.
  if (git('status', '--porcelain').stdout.trim() !== '') {
    out.failure = 'dirty';
    return out;
  }

  // Step 7: the run dir outside the repository; the prompt's ## Repo names the worktree.
  const runDir = path.join(fs.realpathSync(os.tmpdir()), `orbit-external-${change}-${opts.token}`);
  out.runDir = runDir;
  fs.mkdirSync(runDir, { recursive: true });
  const worktree = path.join(runDir, 'worktree');
  const runs = `orbit/changes/${change}/.orbit-runs`;
  const promptPath = `${runs}/external-prompt-${mode}-${opts.token}.md`;
  const t0Path = `${runs}/review-external-${opts.t0Token}.json`;
  fs.mkdirSync(path.join(repo, runs), { recursive: true });
  fs.writeFileSync(path.join(repo, promptPath), `# External Review: ${change} (iteration 1)\n\n## Repo\n\n${worktree}\n`);
  fs.writeFileSync(path.join(repo, t0Path), JSON.stringify({ command: 'review-external', mode, target: path.basename(opts.argv[0]) }));

  // Step 9a: the handoff commit — the prompt and the T0, nothing else — then push.
  git('add', promptPath, t0Path);
  if (git('commit', '--only', promptPath, t0Path, '-m', `External review handoff (${mode}, iter 1): ${change}`).status !== 0) {
    out.failure = 'handoff commit failed';
    return out;
  }
  out.handoffPushed = git('push').status === 0;
  const handoffSha = git('rev-parse', 'HEAD').stdout.trim();

  // Step 9b: the worktree at the handoff commit, outside the repository.
  if (git('worktree', 'add', '--detach', worktree, handoffSha).status !== 0) {
    out.failure = 'worktree add failed';
    return out;
  }

  // Step 9c: substitute first, quote every element, run in the worktree, prompt by redirect.
  const output = path.join(runDir, 'return.md');
  const argv = opts.argv.map((a) => a.split('{worktree}').join(worktree).split('{output}').join(output));
  const line =
    `( cd ${quote(worktree)} && ${argv.map(quote).join(' ')} < ${quote(path.join(worktree, promptPath))}` +
    ` > ${quote(path.join(runDir, 'runner.log'))} 2>&1 )`;
  out.launched = true;
  // The Bash tool runs the composed line in a shell; the recorded argv itself is never the string.
  const run = spawnSync('/bin/sh', ['-c', line], { encoding: 'utf-8' });
  out.runExit = run.status;

  const removeWorktree = () => git('worktree', 'remove', '--force', worktree);
  const fail = (cause: string): LaunchOutcome => {
    out.failure = cause;
    out.fallback = out.handoffPushed ? 'pull' : 'handoff-blocked';
    removeWorktree();
    return out;
  };
  if (run.status !== 0) return fail(`runner exited ${run.status}`);

  // Step 9d: save through the engine, with the launch token.
  const save = spawnSync(
    process.execPath,
    [opts.cliEntry, 'external', 'save', change, '--as', mode, '--from', output, '--launch', opts.t0Token, '--json'],
    { cwd: repo, encoding: 'utf-8' }
  );
  if (save.status !== 0) return fail(`save refused: ${save.stderr.trim()}`);
  out.saved = JSON.parse(save.stdout);
  const saved = out.saved!;

  // Commit the saved file ALONE, the removed lines quoted, then push. The message is DATA: written
  // with a file write and passed by -F through the shell, exactly as the body states (system walk:
  // the earlier transcription passed it as a spawn argument and so never exercised the shell form).
  const msgFile = path.join(runDir, 'commit-msg.txt');
  const msg =
    `External review (${mode}, iter 1): ${change}` +
    (saved.removed.length > 0
      ? `\n\nRemoved above the heading by orbit external save:\n${saved.removed.map((l) => `> ${l}`).join('\n')}`
      : '');
  fs.writeFileSync(msgFile, msg + '\n');
  git('add', saved.path);
  out.returnCommitted =
    spawnSync('/bin/sh', ['-c', `git commit --only ${quote(saved.path)} -F ${quote(msgFile)}`], { cwd: repo, encoding: 'utf-8' })
      .status === 0;
  out.returnPushed = git('push').status === 0;
  removeWorktree();
  return out;
}
