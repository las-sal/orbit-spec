## Why

Today the external half of every review is a hand relay: `/orbit:review --reviewer external` packages a prompt,
and the user (or Claude, on the user's word) carries it into another AI, waits, strips whatever the other AI wrote
above `# External Review:`, saves the return under the right name and commits it. Every rc-stage since rc08b ran
that relay by hand with `codex exec`, and the external half's two observed failures came from the relay rather
than from the review: a preamble line above the heading, which the walk's `--from-file` routing refuses, and a
still-running reviewer reading the live checkout. Sal (D-bpc-1, D-bpc-2): the runner is the USER's, set up explicitly, and a recorded runner launches the
external review with no paste; with none recorded, today's handoff is unchanged.

This is stage `rc17d-external-runner` of `clean-up-review-cycle`, split from `rc17b-blind-pair-command` at its
exploration (D-rc17b-1, R-crc-9's ninth preventive application). Its exploration is the design input
(`explore.md`, D-rc17d-1..8). The one-command blind pair, which reuses this launch for its external half, stays in
rc17b and depends on this stage.

## What Changes

- **A per-user runner record.** A new optional `externalRunner` field in the per-user global config
  (`<XDG config>/openspec/config.json`), registered as a known key so `orbit config` accepts it. Its value is
  `{preset: "codex"}` or `{argv: [...]}` with `{worktree}` and `{output}` placeholders — never a shell string. The
  prompt always arrives on stdin. A malformed value warns and resolves to none.
- **Setup.** `orbit init`, interactive, gains one setup step that explains the concept and offers the Codex
  preset (when `codex` resolves on PATH), an own argv, or none; a present record is shown and kept by default.
  `orbit config set externalRunner.preset codex`, `orbit config edit` and `orbit config unset externalRunner`
  change it later. A runner on PATH with nothing recorded is never launched.
- **Two engine read/write commands.** `orbit external runner [--json]` prints the RESOLVED record (none, or the
  argv with its placeholders); the engine never executes it. `orbit external save <change> --as <mode> --from
  <path> [--launch <token>] [--json]` normalizes a raw return — cuts at the first `# External Review:` line outside
  every fence, reports the lines removed, touches nothing from the heading on — checks the result with the trail
  reader, refuses a return older than an apply when given the launch token, and writes it to the change's trail as
  `external-<mode>-<TS>.md`; every refusal writes nothing (D-rc17d-8).
- **The external branch launches.** When `orbit external runner --json` resolves a runner and its command is on
  PATH, the review body commits the prompt and the T0 emit (the handoff commit), pushes, adds a throwaway
  `git worktree` at that commit outside the repository, launches the runner there in the background with the prompt
  on stdin, waits, saves the return through `orbit external save`, commits it alone with the removed lines quoted,
  pushes, and removes the worktree. A dirty tree launches nothing and writes nothing. A failed run commits nothing and
  prints the paste fallback. With no runner, the branch is today's handoff, byte for byte.
- **Named limit (D-rc17d-7).** The T0 record's `next_recommended` stays the paste/save prose
  `orbit-run-summary-emit` requires: it states the manual fallback even when a runner launched, and the launch is
  reported in chat. A launch-aware record would add two capabilities and is left as a follow-up.

## Capabilities

### New Capabilities

- `orbit-external-runner`: the per-user runner record (storage, shapes, resolution, malformed handling), its two
  writers (`orbit init`'s setup step, `orbit config`), the engine's read command `orbit external runner`, and the
  normalizing write command `orbit external save`.

### Modified Capabilities

- `orbit-review-external`: the branch launches a recorded runner instead of only packaging — the chat output gains
  the launched branch, the handoff preflight gains the launch path, `Review-external command available` gives the
  paste-ready snippet only when no runner launches, `Recommended-session note in chat output` is emitted only when the
  prompt is printed for paste, and `Command does not run the review or ingest findings` is REMOVED and replaced by a requirement that runs the review only through the recorded runner and still
  never ingests findings.
- `orbit-conventions`: `Review mode decision framework` stops describing the external class as reached only by "a
  packaged prompt a human carries across vendors".

## Impact

- `src/core/global-config.ts`, `src/core/config-schema.ts` — the field, its registration, its resolver.
- `src/commands/` + `src/cli/index.ts` — the `orbit external` command group.
- `src/core/init.ts` — the interactive setup step.
- `src/core/templates/workflows/review.ts` — the external-handoff reference gains the launch branch.
- No change to the gate, the trail reader, the renderer, the T0 payload shape, or the prompt template (the template
  already tells a reviewer that cannot write a file to put the complete findings in its final message); a launched
  run fills the template's `## Repo` placeholder with the runner's working directory.
- **Size.** Three capabilities, at R-crc-1's ceiling. The tasks number 27 against its "under 20", DECLARED over the
  ceiling at the proposal walk (Sal; design D10).
- **Handed to rc17b.** Two `orbit-review` sentences describe the external class as packaging-only; they read the manual
  route only until rc17b, which modifies `orbit-review`, corrects them (design, Risks).
- Adopters without a recorded runner see no behaviour change. The global config directory keeps its upstream name
  (`openspec/`), a Tier-C deferral this stage does not touch.
