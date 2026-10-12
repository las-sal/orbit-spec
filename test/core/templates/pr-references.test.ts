/**
 * rc12-body-adoption (D-rba-4, task 3.3): the PR references are call-and-act. The body-side
 * scenarios of `orbit-pr-lifecycle` are read off the generated references and bodies (text), and
 * the worked example is EXECUTED: its `gh pr create` line runs through a shell against a stub
 * that records its argv, so the free-text title is shown to arrive as one argument.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/skill-templates.js';
import {
  PR_ARCHIVE_TAIL_REFERENCE,
  PR_CHOREOGRAPHY_REFERENCE,
  PR_RESOLUTION_REFERENCE,
  PR_TITLE_RULE,
} from '../../../src/core/templates/workflows/pr-choreography.js';

const section = (text: string, heading: string) => {
  const i = text.indexOf(heading);
  expect(i, heading).toBeGreaterThan(-1);
  const next = text.indexOf('\n## ', i + heading.length);
  return text.slice(i, next < 0 ? text.length : next);
};

describe('the propose/ff reference', () => {
  // @scenario text orbit-pr-lifecycle :: PR actions are workflow-body choreography (zero engine git) :: A body runs what the record prints
  it('runs the segment select prints and carries no check of its own', () => {
    const phase1 = section(PR_CHOREOGRAPHY_REFERENCE, '## Phase 1');
    expect(phase1).toContain('orbit pr select <name> --json');
    expect(phase1).toContain('run its one segment');
    expect(PR_CHOREOGRAPHY_REFERENCE).toContain("runs each step's `argv` exactly");
    for (const check of ['check-ref-format', 'rev-parse', 'ls-remote', 'merge-base', 'ls-files', 'git diff']) {
      expect(PR_CHOREOGRAPHY_REFERENCE, check).not.toContain(check);
    }
  });

  // @scenario text orbit-pr-lifecycle :: PR actions are workflow-body choreography (zero engine git) :: A skipped selection ends the PR layer
  it('a select that does not proceed ends the PR layer: publish is never called and the emit carries no attachment', () => {
    const phase1 = section(PR_CHOREOGRAPHY_REFERENCE, '## Phase 1');
    expect(phase1).toMatch(/`off`,\s+`skip`, a non-zero exit, or a failed step ENDS the PR layer/);
    expect(phase1).toContain('`publish` is\nnever called');
    expect(phase1).toContain('no\n`pr_attachment`');
  });

  // @scenario text orbit-pr-lifecycle :: Agent-written landmark descriptions at seams only :: A per-change title is written from the Why
  it("the title is the owner's rule from proposal.md's Why, and no step reads a `# ` title line", () => {
    const phase3 = section(PR_CHOREOGRAPHY_REFERENCE, '## Phase 3');
    expect(phase3).toContain(PR_TITLE_RULE);
    expect(PR_TITLE_RULE).toContain("ONE line the agent writes from proposal.md's Why");
    expect(PR_CHOREOGRAPHY_REFERENCE).not.toContain("proposal.md's title line");
    expect(PR_CHOREOGRAPHY_REFERENCE).not.toContain('without the leading #');
  });

  // @scenario behaviour orbit-pr-lifecycle :: PR actions are workflow-body choreography (zero engine git) :: A free-text input stays one argument
  it("the worked example's title, containing a space and a double quote, reaches gh as ONE argument", () => {
    const fence = PR_CHOREOGRAPHY_REFERENCE.split('```bash\n').find((b) => b.startsWith('gh pr create'));
    expect(fence, 'the worked example').toBeDefined();
    const line = fence!.split('\n')[0];
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-pr-title-'));
    try {
      const log = path.join(dir, 'argv.json');
      const stub = path.join(dir, 'gh');
      fs.writeFileSync(stub, `#!/usr/bin/env node\nrequire('fs').writeFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)));\n`);
      fs.chmodSync(stub, 0o755);
      const run = spawnSync('sh', ['-c', line], { env: { ...process.env, PATH: `${dir}${path.delimiter}${process.env.PATH}` }, encoding: 'utf-8' });
      expect(run.status, run.stderr).toBe(0);
      const argv: string[] = JSON.parse(fs.readFileSync(log, 'utf-8'));
      const title = argv[argv.indexOf('--title') + 1];
      expect(title).toBe('add-thing: Skip the "dirty tree" check');
      expect(title).toContain(' ');
      expect(title).toContain('"');
      expect(argv[argv.indexOf('--title') + 2]).toBe('--body-file');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('the draft window and the archive close', () => {
  // @scenario text orbit-pr-lifecycle :: Agent-written landmark descriptions at seams only :: Draft window carries intent, archive carries achievement
  it('publish authors the INTENT body, the tail the ACHIEVEMENT body, and no other step edits the PR body', () => {
    expect(section(PR_CHOREOGRAPHY_REFERENCE, '## Phase 3')).toContain('the INTENT body');
    expect(PR_CHOREOGRAPHY_REFERENCE).not.toContain('gh pr edit');
    const tail = section(PR_ARCHIVE_TAIL_REFERENCE, '## Tail, after the move and the emit');
    expect(tail).toContain('the ACHIEVEMENT body, replacing the intent');
  });

  it('the tail reference keeps the two notes the record cannot print: an already-READY PR and a branch absent everywhere', () => {
    const tail = section(PR_ARCHIVE_TAIL_REFERENCE, '## Tail, after the move and the emit');
    expect(tail).toContain('`observations.pr_state` is `ready` prints no `ready` step');
    expect(tail).toContain('already READY and was not re-flipped');
    expect(tail).toContain('when its `case` is `absent` (no argv), say plainly that no\nswitch recovers the branch');
  });

  // @scenario text orbit-pr-lifecycle :: PR actions are workflow-body choreography (zero engine git) :: A human act is shown, never run
  it("the archive close shows the tail's human acts verbatim as the user's, and runs none", () => {
    const close = section(PR_ARCHIVE_TAIL_REFERENCE, '## At the close');
    expect(close).toContain('Show every `human_acts` argv verbatim');
    expect(close).toContain('the merge, then the return\nto the default branch');
    expect(close).toContain('Run none of them.');
    const echo = section(getArchiveChangeSkillTemplate().instructions, '## NEW Step 5.8');
    expect(echo).toContain('`human_acts`');
    expect(echo).toContain('Run none of them.');
  });
});

describe('the architect reference', () => {
  it('speaks from observations.outcome when no PR is surfaced, telling an unavailable observation from a confirmed absence', () => {
    for (const s of ['When `observations.pr` is null the readout still speaks', '`unobserved` or `gh-absent`: the program PR could not be observed', '`observations.resolution_failure` or `observations.query_error`', '`none`: the query ran and found no open program PR']) {
      expect(PR_RESOLUTION_REFERENCE).toContain(s);
    }
  });
});

describe('the archive reference reads reason.detail the way validatePrUrl writes it', () => {
  it('a retargeted PR is named by its observed base, never its expected one', () => {
    const pre = section(PR_ARCHIVE_TAIL_REFERENCE, '## Preflight, before the move');
    expect(pre).toContain('`retargeted to` its `observed` base');
    expect(pre).not.toContain('`retargeted to`\n  its `expected` base');
  });
});
