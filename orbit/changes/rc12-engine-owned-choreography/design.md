## Context

D6 made the PR lifecycle workflow-body choreography with zero engine git (D-d6-7). The result is three references a performing AI executes: `pr-choreography.md` for propose and ff (18,456 bytes), `pr-archive-tail.md` (12,898), and `pr-resolution.md` for architect (4,611), all built from one source, `src/core/templates/workflows/pr-choreography.ts`. R-crc-5 reverses D-d6-7 conditionally: deterministic sequences may move into an engine command "only for steps … shown to be deterministic by executing them".

The exploration (see explore.md) ran the choreography once for real before designing anything (D-rc12-1). The log is `sketches/dogfood-log.md` and the carrier was PR #15. The run found 27 steps deterministic, 4 needing judgment and 7 wrong (D-rc12-5). No deterministic step produced a wrong answer. The 7 failures were silences and two-rule conflicts. Two decisions follow. D-rc12-2: the engine resolves and prints, and every write stays in the body. D-rc12-4: R-crc-5's condition is met by the live run for the happy path and by engine tests for every other branch.

One asset already exists: `test/integration/pr-lifecycle/phase1.ts` is D6's executable transcription of Phase 1 (300 lines), driven by 33 cases in `phase1.test.ts` against real git and a contract-validated `gh` stub (`harness.ts`).

## Goals / Non-Goals

**Goals:**

- An `orbit pr` command group that computes every deterministic step of the three references and prints the writes as argument vectors.
- Exit (1): every deterministic step is engine-tested, including the branches the live run never reached.
- Exit (3): the consent properties hold by construction, because the engine performs no write. A PATH shim proves it in every case.

**Non-Goals:**

- Body adoption: the references and the propose, ff, archive and architect bodies are unchanged. That is rc12's second change, which measures exit (2).
- The PR-title source bug (D-rc12-6) and the two cleanliness-rule conflicts (D-rc12-7). Each is its own small change.
- Any engine write. Option B, the local writes, is D-rc12-3's measured fallback, decided at change 2's apply.

## Decisions

**D1 — one command group, five subcommands, one per seam step.** These are `select`, `publish`, `preflight`, `tail` and `program`. A single `plan --seam` command was considered. Separate subcommands keep each one's inputs honest: `tail` takes `--include`, `program` takes a doc rather than a change. Each also maps to exactly one place in a body, which change 2 will call. The precedent is `orbit external runner|save`.

**D2 — the engine fetches; it does not otherwise write.** The existence and remote-ahead preconditions need current remote-tracking refs. `git ls-remote` gives tips without fetching, but the compatibility test (`diff`, `merge-base`) needs the commits themselves. So `git fetch <resolved-remote>` is the one ref-store update. It moves only remote-tracking refs, the requirement says so, and the shim's allowlist names it. Printing a fetch for the body to run first was rejected: resolution, which picks the remote, happens inside the engine, so the body could not name the remote to fetch without re-resolving it. That is the very duplication D-rc12-2 removes.

**D3 — the printed command is an argv array with a closed placeholder set.** The set is `<title>`, `<body-file>`, `<message-file>`, `<emit-path>`. An argv array, not a shell string, avoids quoting entirely, matching the external runner's rule (rc17d). Commit messages are body judgment, passed with `-F <message-file>` as the repository already does.

**D4 — `--no-track` at creation and `-u` at the push.** These fix the dogfood's two silences on tracking. The creation no longer tracks the default branch, and the first push sets the right upstream. The return after the merge (`facts.after_merge`) fixes the third silence.

**D5 — `phase1.ts` is promoted, not rewritten.** Its resolution and precondition logic moves to `src/core/pr/select.ts` with the switch removed (the engine prints it), and `phase1.test.ts`'s 33 cases move to the engine's tests. Each case additionally executes the printed switch and asserts the outcome the transcription used to perform. That keeps the iteration-3 lesson the harness exists for: prose can be coherent and still impossible, and only execution distinguishes the two.

**D6 — the commit scopes are computed, not inferred.** `publish` takes the change's own paths that git reports, plus explore-path deletions. `tail` takes the delta's capability spec files intersected with what git reports changed, the old-path deletion, the archived directory, and `--include` paths. The intersection is how "the files the sync REPORTED as changed" becomes computable without reading the sync's output: a synced capability's spec file is changed in git exactly when the sync changed it.

**D7 — the allowlist is enforced by a shim, not by review.** The test PATH puts a `git` wrapper and the `gh` stub first. Both record argv to a log, and the wrapper execs the real git. A case asserts that every recorded call matches the allowlist, and that the `off` cases recorded none. This is exit (3)'s instrument.

## Alternatives considered

- **Option B as the primary design** (the engine performs the local writes). Out as primary: resolve-only may already meet exit (2). Kept as D-rc12-3's fallback (see explore.md, Considered & out).
- **Option C** (the engine performs the outward writes too). Out: it makes the engine an outward actor, so exit (3) would have to be proven by tests instead of holding by construction (see explore.md).
- **A printed shell script instead of argv arrays.** Out: it reintroduces the quoting the external runner removed.

## Risks / Trade-offs

- [D-rc12-2's step set is BOUNDED] → see `orbit-pr-lifecycle`'s `The \`orbit pr\` command observes and prints; it never writes`, which carries the residual.
- [D-rc12-4's coverage is BOUNDED] → see `Printed commands are proven by execution`, which carries the residual.
- [Two descriptions of one algorithm until change 2 lands] The references still carry the prose that `orbit pr` now computes. Until body adoption, a fix to one must be made in both. → Change 2 deletes the prose. Until then the select cases are the references' transcription, as `phase1.ts` was.
- [Exit (2) may miss under resolve-only] → D-rc12-3, measured at change 2's apply.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc12-2 | BOUNDED | live rule | `The \`orbit pr\` command observes and prints; it never writes` (named limit, both residual lines verbatim) |
| D-rc12-4 | BOUNDED | live rule | `Printed commands are proven by execution` (named limit, both residual lines verbatim) |
| D-rc12-1, D-rc12-3, D-rc12-6, D-rc12-7 | — | scope | not carried |
| D-rc12-5 | — | fact | not carried |

## Touchpoints

- `src/core/pr/` — new: resolution, the five plans, the read-only runner and its allowlist.
- `src/commands/pr.ts` — new: the command handlers and the text and JSON rendering.
- `src/cli/program.ts` — registration of `orbit pr` and its subcommands.
- `src/core/completions/command-registry.ts` — the registry entries the parity test requires.
- `test/core/pr/` — new: the engine's cases, including the promoted phase-1 cases.
- `test/integration/pr-lifecycle/harness.ts` — scripted `gh pr view` responses and the `git` shim.
- `test/integration/pr-lifecycle/phase1.ts` + `test/integration/pr-lifecycle/phase1.test.ts` — retired into the engine and its tests.
