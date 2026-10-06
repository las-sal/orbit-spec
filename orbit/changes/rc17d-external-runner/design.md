## Context

The external half of a review is a relay today. `/orbit:review --reviewer external` loads the external-handoff
reference (`src/core/templates/workflows/review.ts`, `REVIEW_EXTERNAL_HANDOFF_REFERENCE`): it packages a prompt,
writes the T0 emit, and prints a pull invocation gated by the committed-and-pushed preflight. Everything after that
is the user's: carry the prompt to another AI, wait, strip what the AI wrote above `# External Review:` (the walk routes
a `--from-file` source by its leading token, per `orbit-address-reviews`; the trail reader and the renderer find the
heading anywhere outside a fence, so it is the walk that a preamble breaks), save under `external-<mode>-<TS>.md`,
commit.
Since 2026-10-04 that relay has been run with `codex exec -s read-only -o <file> - < <prompt>`, in a throwaway
worktree since rc17a's proposal pair; it worked, and the two defects it surfaced (a preamble line, a reviewer reading
the live checkout) were both relay defects.

The rules come from the exploration (`explore.md`, D-rc17d-1..8), which re-entered D-bpc-1, -2 and -11 from rc17a's
archived exploration and re-read them for a single external. Two facts measured there shape the design: the upstream
`orbit config` CLI already edits the global config but refuses unknown top-level keys (`config-schema.ts`,
`KNOWN_TOP_LEVEL_KEYS`), and `config set` coerces scalars only. One fact measured at this propose moved a surface: the
`--json` requirement of `orbit-orientation` enumerates the bare and `--full` key sets, so the runner cannot ride
`orbit status --json` as the `pr` scalar does without a fourth capability (D1).

## Goals / Non-Goals

**Goals:**
- A recorded runner launches every `--reviewer external` with no paste, and its return is committed with no hand edits
  (exit 1).
- With no record, the external branch is byte-for-byte today's handoff (exit 2).
- A runner present on `PATH` and not recorded is never launched (exit 3).
- One launch path that rc17b's pair reuses for its external half unchanged.

**Non-Goals:**
- The one-command blind pair, the reviewer shorthands and the `blind-pair` presentation row (rc17b).
- A launch-aware T0 record (D-rc17d-7, a named limit and a follow-up).
- Moving the external-AI choice into orbit (model, effort): the runner's own configuration chooses.
- Renaming the global config directory (`openspec/`, a Tier-C deferral).

## Decisions

### D1 — the record is read through its own command, not `orbit status --json`

D-bpc-11 said the engine would surface the record in `orbit status --json`, as the `pr` scalar is surfaced. At this
propose, `orbit-orientation`'s JSON requirement was found to enumerate the key set of every bare and `--full` shape, so
a new key there is a delta to a fourth capability. `orbit external runner [--json]` is the read surface instead, owned
by the new capability. It prints the RESOLVED record — the body never holds preset knowledge — plus `reachable`, a
`PATH` lookup the engine performs without executing anything. Recorded as a correction to D-rc17d-3 in `explore.md`.

### D2 — the return is saved by an engine command (D-rc17d-8)

Sal chose the engine over a body step at this propose. `orbit external save <change> --as <mode> --from <path>
[--launch <token>]` cuts at the first `# External Review:` line OUTSIDE every fence, found with the shared CommonMark
fence tracker (`src/core/markdown-fence.ts`) — the proposal's first-line rule would have cut inside a quoted template
and hidden the real findings (proposal walk, external C1). It drops a leading byte-order mark, refuses a heading naming
another change, checks the result with the trail reader and refuses what that reader rejects, and with `--launch`
refuses a return when an apply token on the trail is later than the launch. The token uses the emit surface's
collision rule (bump a second until no trail file carries it, rc03c), so token order stays write order. The command
reads no git state and runs no process, so it is unit-testable and stays inside D-d6-7.

**Why `--launch`** (proposal walk, external C2; Sal: A). The runner reviews the handoff commit but its file is
timestamped when it returns. An apply in between leaves the freshness rule (`isPassStale`: a pass is stale iff an apply
token is later) counting the return as current, so a review of the old state would cover the new one. The check is that
same rule read at the launch's token. The manual route keeps the gap (no launch token is known to it); with the runner
the case becomes common, because D4 lets the user keep working.

### D3 — the commits and the push are body choreography

The handoff commit (prompt + T0, `git commit --only` on those two paths), its push, the return's commit and its push
are steps in the review body, as every git act in orbit is (D-d6-7). Sal ruled 2026-10-05 that designed steps may
commit and push (D-bpc-3), and `orbit-conventions`' Residual outward-actions rule covers only acts not designed into a
step, so it needs no delta.

### D4 — a single external also runs in a worktree

No fresh half runs beside a single external, so blindness is not the reason. The reason is that the user keeps working
while the review runs: a runner reading the live checkout would review whatever the tree holds at each read. A
`git worktree add --detach` at the handoff commit, outside the repository, fixes the reviewed state, and it is the same
path rc17b's pair needs. The process runs with the worktree as its working directory, so an own argv that names no
`{worktree}` reads the same fixed state. Observed on rc17a: Codex still reaches the globally linked engine build outside
the worktree; that is a channel into `dist/`, not into the change, and is stated in rc17b's blindness table, not here.

### D5 — a dirty tree blocks the launch

The handoff preflight reads `git status --porcelain` before the prompt is written. Dirty means the reviewed state is
not committed, so a launch would review something other than what the user believes. The launch is refused and
nothing is written — no prompt file, no T0 — so a re-run after the user commits writes one prompt, not two (proposal
walk, fresh S15); it never auto-commits the user's pending work. Unpushed commits do not block: they ride the
handoff push. A failed push or no remote does not block either, because the worktree is local.

### D6 — the T0 names the runner

The T0 payload already carries `target` (string or null, "the named external AI"). A launched run sets it to the
preset's name or the basename of `argv[0]`. No payload or schema change.

### D7 — the prompt template is unchanged

The template tells a reviewer that cannot write or commit to output the complete findings markdown in its final
message. A read-only runner captured with `-o` does exactly that; the preamble it writes above the heading is what
`orbit external save` removes. No per-route prompt variant exists, so the blind prompt stays one text. Only the value
filled into its `## Repo` placeholder differs on a launched run: the runner's working directory, a checkout of the
handoff commit, never the live checkout's path (proposal walk, fresh S10). A runner that CAN write follows the
template's write, commit and push steps; that is a named limit of own-argv runners, stated in the launch requirement
(proposal walk, converged).

### D8 — the capability's Purpose line is corrected at archive

`orbit-review-external`'s Purpose paragraph says the branch "Does NOT run the review". A delta carries requirements
only, so that sentence is corrected by hand in the baseline at archive (task 6.3).

### D9 — the launch passes each argv element as one argument

The record is an array so that nothing ever parses it as a command line. The body still runs the launch through a
shell (background Bash), so the requirement states how it keeps the array whole: substitute `{worktree}` and `{output}`
first, run in the worktree, single-quote every element with an embedded `'` written `'\''`, feed the prompt by a `<`
redirect, and never hand a recorded string to `sh -c` (proposal walk, fresh W4). A test covers an element carrying a
space and a quote.

### D10 — the task count is declared over the ceiling

The proposal walk's tasks number 27 against R-crc-1's "under 20" (the external pass's block). Sal took the
declaration over a split (proposal walk, 2026-10-06): the tasks are small and single-file, and the three-capability
ceiling, the one the calibration ties to review cost, holds.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc17d-1 | BOUNDED | live rule | `orbit-review-external` · `A recorded runner launches the external review` (TABLE) |
| D-rc17d-2 | SOURCED | live rule | `orbit-external-runner` · `A runner is used only through the user's record` (TABLE) |
| D-rc17d-3 | SOURCED | live rule | `orbit-external-runner` · `The external runner is recorded in the per-user global config` (TABLE) |
| D-rc17d-4 | DERIVED | live rule | `orbit-external-runner` · `The runner record is written by init and edited by orbit config` (TABLE) |
| D-rc17d-5 | SOURCED | live rule | `orbit-external-runner` · `The runner record is a preset name or an argv array, never a shell string` (TABLE) |
| D-rc17d-6 | DERIVED | live rule | `orbit-review-external` · `A launched return is committed alone and pushed` (TABLE) |
| D-rc17d-7 | — | scope | not carried (its limit is stated in `A recorded runner launches the external review`) |
| D-rc17d-8 | absent | live rule | none — UNACCOUNTED (see Risks) |

Two tables are revised from the exploration's: D-rc17d-3's "who reads it" row names `orbit external runner` (D1), and
D-rc17d-5's malformed rows add the empty argv, a non-string element and an extra key, which the exploration's table
did not name.

## Touchpoints

- `src/core/global-config.ts` — the optional `externalRunner` field on `GlobalConfig`.
- `src/core/config-schema.ts` — `externalRunner` among the known top-level keys; the one admitted nested path; the shape in `validateConfig`.
- `src/core/external-runner.ts` — the resolver (shapes, the Codex preset argv, `reachable`) and the save function.
- `src/commands/external.ts` — `orbit external runner` and `orbit external save`.
- `src/cli/index.ts` — registration of the `external` command group.
- `src/core/init.ts` — the interactive setup step.
- `src/core/templates/workflows/review.ts` — the external-handoff reference's launch branch, preflight and chat items.
- `test/core/` — resolver, save, init-step and template suites; the disposable-repo launch test.

## Risks / Trade-offs

- **D-rc17d-8 is UNACCOUNTED (state `absent`).** The rule that the engine normalizes the return was answered at this
  propose and has no Mechanism entry; its domain (which inputs the save command sees and how each is handled) is
  written only as the requirement's scenarios. → The proposal review reads `The engine saves an external return into
  the trail` as an open domain.
- **D-rc17d-1's named limit** (a truncated return that still parses) — see `A recorded runner launches the external
  review`.
- **Text after the review is kept by `orbit external save`** and renders inside the review's last section — see `The
  engine saves an external return into the trail`.
- **A writable own runner may commit inside the worktree** — see `A recorded runner launches the external review`.
- **Two `orbit-review` sentences go stale in letter, handed to rc17b** (proposal walk, both halves; Sal: hand to rc17b).
  `orbit-review`'s requirement "Review command available with `--as` mode flag" carries the scenario "External reviewer
  class dispatches to the handoff branch" ("no review passes run in this invocation"), and its requirement "`--fresh`
  runs pass work in a clean execution context" calls the external class "the cross-vendor handoff a human carries"; the review body's trunk
  repeats the first. Correcting them would make `orbit-review` a fourth capability; rc17b modifies it anyway. Between
  this archive and rc17b's, both read the manual route only.
- **The T0 next line is stale during a launched run (D-rc17d-7).** → Named in the same requirement; the chat output
  says a runner launched; a launch-aware record is a follow-up touching `orbit-run-summary-emit` and
  `orbit-emit-composition`.
- **A signed-out or misconfigured runner is reachable and still fails.** `reachable` is a `PATH` lookup only. → The
  failed-run row reports the exit status and falls back to paste.
- **The body runs a user-recorded argv.** → It runs only what the user recorded in their own per-user file, never a
  repository's, and never through a shell (`A runner is used only through the user's record`).

## Migration Plan

None. The field is optional and absent everywhere until a user records it; with it absent, every surface is unchanged.
Rollback is deleting the field (`orbit config unset externalRunner`).

## Open Questions

None open. Q-rc17d-1..4 were resolved in the exploration and at this propose.

## Alternatives considered

- **Surface the record in `orbit status --json`** (D-bpc-11 as written) — out at this propose: a fourth capability
  (`orbit-orientation`).
- **A launch-aware T0 record** — out 2026-10-06 (Sal: A, D-rc17d-7): five capabilities.
- **Normalize the return in a body step** — out at this propose (Sal: engine command).
- **Launching a runner because it is on `PATH`** — out 2026-10-05 (D-bpc-5): no opt-in; the repository would go to a
  third party unasked.
- **A runner record in a committed per-repository file** — out 2026-10-05 (D-bpc-11): cloning a repository would make
  the cloner's AI run the repository's command, rc07's reason for refusing a `command:` field.
- **Running a single external in the live checkout** — out (D4): the reviewed state would move under the reviewer.
