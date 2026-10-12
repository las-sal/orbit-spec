## Context

D6 made the PR lifecycle workflow-body choreography with zero engine git (D-d6-7). The result is three references a performing AI executes: `pr-choreography.md` for propose and ff (18,456 bytes), `pr-archive-tail.md` (12,898), and `pr-resolution.md` for architect (4,611), all built from one source, `src/core/templates/workflows/pr-choreography.ts`. R-crc-5 reverses D-d6-7 conditionally: deterministic sequences may move into an engine command "only for steps … shown to be deterministic by executing them".

The exploration (see explore.md) ran the choreography once for real before designing anything (D-rc12-1). The log is `sketches/dogfood-log.md` and the carrier was PR #15. The run found 27 steps deterministic, 4 needing judgment and 7 wrong (D-rc12-5). Two decisions follow. D-rc12-2: the engine resolves and prints, and every write stays in the body. D-rc12-4: R-crc-5's condition is met by the live run for the happy path and by engine tests for every other branch.

The first proposal's blind pair found that the record it specified could not carry the owners' rules: a PR-half degradation, a step consuming an earlier step's result, the preflight-to-tail handoff. That record was redesigned in the exploration (D-rc12-8 to D-rc12-13, R-crc-6's redesign lane), and this design is regenerated from it (D-rc12-14).

One asset already exists: `test/integration/pr-lifecycle/phase1.ts`, D6's executable transcription of Phase 1. It is 300 lines, driven by 39 cases in `phase1.test.ts` against real git and a contract-validated `gh` stub (`harness.ts`).

## Goals / Non-Goals

**Goals:**

- An `orbit pr` command group that computes every deterministic step of the three references and prints the writes in a record that separates observations, body-run segments and the user's acts.
- Exit (1): every deterministic step is engine-tested, including the branches the live run never reached.
- Exit (3): the consent properties hold by construction, because the engine performs no write. A PATH shim proves it in every case.

**Non-Goals:**

- Body adoption: the references and the propose, ff, archive and architect bodies are unchanged. That is rc12's second change, which measures exit (2).
- The PR-title source bug (D-rc12-6) and the two cleanliness-rule conflicts (D-rc12-7). Each is its own small change.
- Any engine write. Option B, the local writes, is D-rc12-3's measured fallback, decided at change 2's apply.

## Decisions

**D1 — one command group, five subcommands, one per seam step.** These are `select`, `publish`, `preflight`, `tail` and `program`. A single `plan --seam` command was considered. Separate subcommands keep each one's inputs honest: `select` needs no change directory, `tail` takes `--include`, and `program` takes a doc. Each also maps to exactly one place in a body. The precedent is `orbit external runner|save`.

**D2 — the record (D-rc12-8).** It carries `action` and `reason` (a closed code, never prose: D-rc12-13), `degraded` for a PR-half degradation, `observations`, `segments` and `human_acts`. A segment ends wherever a later step consumes something the body authors from an earlier result. The instance that forced the design is `publish`: the propose emit is written from the URL that `gh pr create` returned, and only then is it committed. A flat command list could not express that boundary.

**D3 — the bounded fetch (D-rc12-11).** `git ls-remote --heads` decides which refs exist, then `git fetch --no-tags` with one explicit refspec per existing ref. A bare `git fetch <remote>` would pass any argv allowlist and still follow a configured `refs/heads/` refspec and auto-follow tags (the external pass's finding). Printing a fetch for the body to run first was rejected: resolution, which picks the remote, happens inside the engine.

**D4 — argv arrays and a closed input set.** The inputs are `<message-file>`, `<title>`, `<body-file>` and `<emit-path>`, matching the external runner's no-shell-string rule (rc17d). Commit messages are passed with `-F`.

**D5 — `--no-track` at creation and `-u` at the first push.** These fix the dogfood's two tracking silences. The post-merge return becomes `human_acts` on `tail`, fixing the third.

**D6 — `phase1.ts` is promoted, not rewritten.** Its resolution and precondition logic moves to `src/core/pr/select.ts`, with the switch removed (the engine prints it) and the `remote.<r>.ghurl` test hook removed (the harness reaches its bare remotes through a `url.<path>.insteadOf` rewrite of a GitHub-shaped URL instead, and the engine reads the configured URL with `config --get remote.<r>.url`, since `remote get-url` expands the rewrite). Its 39 cases move to the engine's tests: the commit-isolation case to `publish`, the rest to `select`. Each case executes the printed segments. That keeps the iteration-3 lesson the harness exists for: prose can be coherent and still impossible, and only execution distinguishes the two.

**D7 — the tail takes preflight's outcome and reads the archive emit (D-rc12-9).** The body passes preflight's `observations.outcome` to `tail` as `--outcome`, verbatim; the emit supplies `pr_url`, `pr_state` and `sync_specs.capabilities_updated`. The engine keeps no state between the two invocations, and needs none. The emit's two PR fields alone could not carry the outcome: `none`/`several` (degrade the PR half) and `unobserved`/`gh-absent` (skip the tail) both write neither (the proposal verification's finding; Sal: A over a new emit field or a whole-tail skip). A code that disagrees with the emit is a usage error.

**D8 — the outcome sets are closed (D-rc12-12).** `not-found` is keyed on `gh`'s message for a missing pull request, recorded in the gh contract by the capture script as a third error rule. Any other non-zero exit is `unobserved`. `program` never skips.

**D9 — the allowlist is enforced by a shim, not by review.** The test PATH puts a `git` wrapper and the `gh` stub first. Both record argv, and the wrapper execs the real git. A case asserts that every recorded call matches the allowlist, and that the `off` cases recorded none. Injected cases show the assertion can fail.

**D10 — the zero-engine-git sweep.** Each site gets an explicit disposition:

| site | disposition |
|---|---|
| this capability's MODIFIED requirement | rewritten here; its title is kept for identity, and its body says the title names the WRITE boundary |
| `orbit-pr-lifecycle`'s baseline Purpose ("ZERO git or GitHub operations") | edited in place at archive (no delta carries a Purpose) |
| `orbit-archive-modifications`' "the engine performs no git operation" | kept: it describes the archive MOVE, which still runs no git |
| `orbit-review`'s "(zero engine git)" | kept: it cites the requirement by its kept title |
| `pr-choreography.ts`'s "the orbit engine never shells to git or `gh`" | change 2's to edit, as part of body adoption |
| `CLAUDE.md`'s D6 paragraph ("ZERO ENGINE GIT") | kept: a historical record, true of D6 when written |
| comments in `harness.ts` and `emit-composition.ts` | edited here (task 5.1); `phase1.ts` is deleted by task 4.1 |

## Alternatives considered

- **Option B as the primary design** (the engine performs the local writes). Out as primary: resolve-only may already meet exit (2). Kept as D-rc12-3's fallback (see explore.md, Considered & out).
- **Option C** (the engine performs the outward writes too). Out: it makes the engine an outward actor, so exit (3) would have to be proven by tests instead of holding by construction (see explore.md).
- **A printed shell script instead of argv arrays.** Out: it reintroduces the quoting the external runner removed.
- **A flat `commands` list with a fourth `partial` action.** Out: it answers the degradation and not the segment boundary. `degraded` plus `segments` answers both (D-rc12-8).
- **The tail observing the PR again.** Out: it breaks the owner's one-observation rule, and disagreement between the two observations would need its own behaviour (D-rc12-9).
- **Engine-written notes.** Out: no skip fired on the live run, so note wording is untested judgment. Codes are testable (D-rc12-13).

## Risks / Trade-offs

- [D-rc12-2's step set is BOUNDED] → see `The \`orbit pr\` command observes and prints; it never writes`, which carries the residual.
- [D-rc12-11's fetch side effects are BOUNDED] → see the same requirement.
- [D-rc12-4's coverage is BOUNDED] → see `Printed commands are proven by execution`, which carries the residual.
- [The not-found message is captured from a live `gh`] The capture needs network access and authentication to observe it. → The capture is already a deliberate, human-run act. A capture that cannot observe the message fails rather than records a guess.
- [Two descriptions of one algorithm until change 2 lands] The references still carry the prose that `orbit pr` now computes. Until body adoption, a fix to one must be made in both. → Change 2 deletes the prose.
- [Exit (2) may miss under resolve-only] → D-rc12-3, measured at change 2's apply.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc12-2 | BOUNDED | live rule | `The \`orbit pr\` command observes and prints; it never writes` (named limit, both residual lines verbatim) |
| D-rc12-4 | BOUNDED | live rule | `Printed commands are proven by execution` (named limit, both residual lines verbatim) |
| D-rc12-8 | SOURCED | live rule | `The \`orbit pr\` command observes and prints; it never writes` (the record table: a normative TABLE) |
| D-rc12-9 | SOURCED | live rule | `\`orbit pr tail\` computes the archive tail` (the `--outcome` table: a normative TABLE) |
| D-rc12-10 | SOURCED | live rule | `\`orbit pr select\` computes propose's branch selection` (the inputs table: a normative TABLE) |
| D-rc12-11 | BOUNDED | live rule | `The \`orbit pr\` command observes and prints; it never writes` (named limit, both residual lines verbatim) |
| D-rc12-12 | SOURCED | live rule | `\`orbit pr preflight\` computes the archive's read-only preflight` (the outcome table) and `\`orbit pr program\` computes the architect readout's PR facts` (a SENTENCE naming the owner) |
| D-rc12-13 | SOURCED | live rule | `The \`orbit pr\` command observes and prints; it never writes` (a SENTENCE naming the narrowing) |
| D-rc12-1, D-rc12-3, D-rc12-6, D-rc12-7, D-rc12-14 | — | scope | not carried |
| D-rc12-5 | — | fact | not carried |

## Touchpoints

- `src/core/pr/` — new: resolution, the five plans, the read-only runner and its allowlist, the record type.
- `src/commands/pr.ts` — new: the command handlers and the text and JSON rendering.
- `src/cli/program.ts` — registration of `orbit pr` and its subcommands.
- `src/core/completions/command-registry.ts` — the registry entries the parity test requires.
- `test/core/pr/` — new: the engine's cases, including the promoted phase-1 cases.
- `test/integration/pr-lifecycle/harness.ts` — scripted `gh pr view` / `gh pr list` responses, the not-found response, GitHub-shaped remote URLs, the `git` shim.
- `test/integration/pr-lifecycle/gh-contract.json` + `scripts/capture-gh-contract.mjs` — the not-found error rule.
- `test/integration/pr-lifecycle/phase1.ts` + `test/integration/pr-lifecycle/phase1.test.ts` — retired into the engine and its tests.
- `src/core/emit-composition.ts` — comment wording only.
