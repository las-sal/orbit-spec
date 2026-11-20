# Sketch: the replay-set spike (D-rs-5)

One case, one run, a cheap model: it tests the plumbing `claude plugin eval` would need, not a skill body. Everything
lives in scratch space outside the repository, and nothing is committed but the result written back into `explore.md`.

## Setup (scratch, outside the repo)

```
<scratch>/
  shim/orbit                      #!/bin/sh  exec node <repo>/bin/orbit.js "$@"           (D-rs-1)
  plugin/                         orbit's built skills, wrapped as a plugin named `orbit`
    .claude-plugin/plugin.json    {"name": "orbit", ...}
    skills/orbit-*/               copied from a temp project after `node <repo>/bin/orbit.js init --tools claude`
    commands/*.md                 the 15 launchers from .claude/commands/orbit/ → /orbit:<command>
    evals/spike-explore/
      prompt.md                   frontmatter: runs 1, max_turns 15, model (cheap); body: `/orbit:explore spike-probe`
      case.yaml                   context.scaffold_script: seeds a minimal orbit project (orbit/config.yaml,
                                  orbit/specs/, a git repo), no change
      graders/*.md                the five graders below
```

Before the run: `npm run build` in the repo, `claude plugin validate <scratch>/plugin` (structure), and the commit the
build came from noted.

Run: `PATH=<scratch>/shim:$PATH claude plugin eval <scratch>/plugin --case spike-explore --runs 1 --ablation none
--scaffold --allow-tools Bash Write Edit --max-cost-usd 2 --no-publish --json <scratch>/result.json`

## What the run checks

| # | question | grader | passes when |
|---|---|---|---|
| 1 | do the sessions reach the shim? | `regex` on `trace` | the trace shows `orbit decisions status --json` answering `"write": false` (the stale CLI would print `unknown command 'decisions'`) |
| 2 | do the plugin's skill and launcher load and resolve? | `tool_used` (Skill) + `file_exists` | the explore skill was invoked, and `orbit/explore/spike-probe/explore.md` exists |
| 3 | can a timestamped emit be graded? | `regex` on `files` (created paths), then on `trace` | a created path matches `orbit/explore/spike-probe/\.orbit-runs/explore-.*\.json`, and the trace shows the emit command printing that path |
| 4 | can a grader fail? | `regex` on `last_message` | a deliberately absent string (`SPIKE-MUST-NOT-APPEAR`): this grader must FAIL |
| 5 | does a gate's state reach the grade? | `regex` on `trace` | not exercised by explore; noted as untested, carried to a second spike on an apply case if 1–4 pass |

## Outcomes

| result | what follows |
|---|---|
| 1–4 as expected | `claude plugin eval` is the runner; grading by trace and created paths is recorded as a decision, and the open question on timestamped emits closes |
| 1 fails (sessions drop the inherited `PATH`) | try the shim through the scaffold (a `bin/` in the workspace plus an `env` key), then decide |
| 2 fails (the launchers or skills do not resolve as a plugin) | try the scaffold running `orbit init --tools claude` inside the workspace, so the skills load as project skills |
| 3 fails both ways | the runner cannot see orbit's facts: the fallback, a `claude -p` runner of this repository's own (R-rop2-2) |
| 4 passes when it should fail | the runner's grading cannot be trusted as configured; stop and read why |

## Then: skill-creator

Read Anthropic's `skill-creator` skill (no billed run needed to read it) for what its evals and its benchmark with
variance analysis do, and whether they can run orbit's cases or only grade what `plugin eval` produced. Its answer
closes the open question on when a difference between runs is real, or leaves the interim rule standing.

## Cost

One session on a cheap model, at most 15 turns, under a `--max-cost-usd 2` ceiling; the run's reported cost is recorded.
