## Context

rc12's first change (`orbit/changes/archive/2026-10-12-rc12-engine-owned-choreography/`) shipped
`orbit pr` with five subcommands. Each subcommand observes through read-only `git`/`gh` and prints
one record: `action`, `reason`, `degraded`, `observations`, `segments` and `human_acts`. Every write
appears as an argv for the body to run. The bodies have not adopted it. Propose and ff still load
`references/pr-choreography.md` (18,458 bytes), archive loads `references/pr-archive-tail.md`
(12,900), and the architect loads `references/pr-resolution.md` (4,613). All three are generated from
`src/core/templates/workflows/pr-choreography.ts`, and each re-teaches the resolution, preconditions,
commit scope and query logic the engine now computes.

Two defects came in with the work (see explore.md):
- `preflight.ts:90-95` sets `diverged: recorded !== current` with `recorded = att.doc ?? null`. A
  `per-proposal` attachment never records `doc`, so every cited per-proposal change reads as
  diverged. Change 1's own archive hit this.
- The per-change title rule (`orbit-pr-lifecycle/spec.md:359`, restated at `pr-choreography.ts:212`)
  reads `proposal.md`'s `#` title line, and the schema template writes none.

## Goals / Non-Goals

**Goals:**
- Every PR seam calls its `orbit pr` subcommand and acts on the record alone (D-rba-4).
- The three references shrink by more than half against the scaffold baseline (exit (2), D-rba-6).
- Preflight's `diverged` is true exactly when the current inputs would select a different target
  (D-rba-1).
- The per-change title names an input that exists (D-rba-2).
- The archive close shows `tail`'s `human_acts`, including the post-merge return (D-rba-3, D-rba-7).

**Non-Goals:**
- No change to the `orbit pr` record shape, the `pr_attachment` shape, the allowlist, or any
  consent property (exit (3)).
- Moving no write into the engine unless exit (2) misses (D-rc12-3's fallback, D-rba-6).
- Leaving the cleanliness-predicate conflicts out (D-rc12-7: the blind-pair preflight against the PR
  dirty-tree rule, and the archive suite's staging against the tail's commit scope).

## Decisions

**D1 — One targeting predicate, shared (D-rba-1).** `publish.ts:62` computes
`program = regime === 'per-architecture' && citation !== null`. Extract it as one exported function
in `src/core/pr/inputs.ts`, beside `readRegime` and `readCitation`, returning
`{granularity, doc?}`. `publish` resolves its target through it, and `preflight` computes
`would_select` through it. `diverged` compares `would_select` with the attachment's
`(granularity, doc)`. The regime is read only to decide `diverged`, and the outcome logic never
consults it. The five-row table is in the delta. Change 1's false positive is row 4, and it becomes
the first preflight test.
*Alternative:* record the citation in `pr_attachment` at propose. It is out (see Alternatives).

**D2 — The title is judgment from the Why (D-rba-2).** The spec owns the rule. The rewritten
reference says "the title per `orbit-pr-lifecycle`'s `Agent-written landmark descriptions at seams
only`" and points there instead of restating it (R-crc-14). `orbit pr publish` already takes
`<title>` as a body-authored input (`publish.ts:123`), so no engine change is needed.

**D3 — The references become call-and-act (D-rba-4).** Each reference keeps four things: when to
load it (the engine-resolved regime), which subcommand to call at which step, the consumption table
(named in the spec, and pointed at, not restated), and the judgment the body still owns. That
judgment is the title, the intent or achievement body, the stage-entry text, the commit messages,
and the wording of each one-line note from `reason`. Everything a subcommand computes is deleted:
the resolution algorithm, the preconditions, the compatibility tests, the commit-scope enumeration,
the four-axis query, the mid-flight recovery commands, and the success-gated record push (now
`publish`'s second segment). The shared resolution section disappears from all three references,
because every subcommand resolves internally. The architect reference reduces to calling
`orbit pr program <doc>` and showing its `human_acts`.

**D4 — Body PR sections follow the references.** The `## PR lifecycle` sections in `propose.ts`,
`ff-change.ts`, `archive-change.ts` (Steps 5.45 and the tail) and `architect.ts` currently summarise
the runbook ("That reference carries the whole choreography: the shared remote/default-branch
resolution…"). They are rewritten to name the subcommand at each step. The regime read from
`orbit status --json`'s `pr` field stays, because the bodies still decide whether to load the
reference at all, and `select`/`publish` return `off` on `never` anyway.

**D5 — The post-merge return is already printed (D-rba-3, D-rba-7).** `tail.ts:189-193` pushes
`merge`, `return-fetch`, `return-switch` and `return-fast-forward` onto `human_acts` on a per-change
tail that is not degraded, as `orbit pr tail computes the archive tail` specifies. D-rba-3 is
delivered by the archive body showing `human_acts` verbatim at its close. D-rba-3's `git pull`
wording is superseded by the three commands the engine prints, all already in the recorded git
contract.

**D6 — Exit (2) is measured, not projected (D-rba-6).** After the rewrite, `npm run build && node
bin/orbit.js update --force`, then `wc -c` each generated reference. The targets are < 9,229
(propose/ff), < 6,450 (archive) and < 2,307 (architect). A miss triggers D-rc12-3: the engine
performs `switch -c` and `commit --only` for that seam. That would be a scope change, briefed before
any code moves.

## Risks / Trade-offs

- [The architect target is tight: < 2,307 bytes, from a reference whose header and query section
  alone are 1,720] → Measure first. If the reference cannot meet the target as a file, fold the
  `program` call into the architect body and delete the reference. Exit (2) then reads as fully met,
  stated as such at apply.
- [A body substitutes argv into a shell without quoting] → The consumption table requires every
  element to be shell-quoted, and a scenario covers it. The title is the one free-text input, so the
  reference's worked example uses a title containing a space and a quote.
- [The rewritten reference drifts from what the subcommands print] → The reference names the
  subcommands and the record fields only. The recorded-contract sweep and the tool-inventory test
  read the new snippets; the content-fidelity and parity pins move as recorded acts.
- [Reading the live regime for a note] → The read only decides `diverged`. A regime edited after
  propose produces a truthful note ("would select X now"), and the frozen attachment still governs.
- [Undeclared delta scenarios] → The delta carries six; each is tagged at apply against the test
  that exercises it, or ledgered where only a body read can show it.

## Alternatives considered

- **Record the citation in `pr_attachment` at propose** (Q-rba-1 option B). Out: it is a
  record-shape change owned by `orbit-run-summary-emit`, and every existing attachment lacks the
  field (see explore.md, Considered & out).
- **The engine performs the local writes** (D-rc12-2's option B). Kept only as D-rc12-3's measured
  fallback.
- **The engine performs outward writes** (option C). Out since change 1: exit (3) would have to be
  proven by tests instead of holding by construction.
- **A new `orbit-archive-modifications` requirement for the post-merge line.** Out at propose: the
  engine already prints it, and the owner already specifies it (D-rba-7).

## Touchpoints

- `src/core/pr/inputs.ts` — the shared targeting predicate.
- `src/core/pr/preflight.ts` — `would_select` and `diverged`.
- `src/core/pr/publish.ts` — resolves its target through the shared predicate.
- `src/core/templates/workflows/pr-choreography.ts` — the three references, rewritten.
- `src/core/templates/workflows/propose.ts` + `src/core/templates/workflows/ff-change.ts` — PR lifecycle sections.
- `src/core/templates/workflows/archive-change.ts` — the preflight step and the tail step.
- `src/core/templates/workflows/architect.ts` — the arc-done PR readout.
- `test/core/pr/` — preflight divergence cases.
- `test/core/templates/` — the pins the rewrite moves.

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rba-1 | DERIVED | live rule | `orbit-pr-lifecycle`: `` `orbit pr preflight` computes the archive's read-only preflight `` — TABLE (the five-row divergence table) |
| D-rba-2 | SOURCED | live rule | `orbit-pr-lifecycle`: `Agent-written landmark descriptions at seams only` — SENTENCE (the title rule naming its source, proposal.md's Why) |
| D-rba-4 | DERIVED | live rule | `orbit-pr-lifecycle`: `PR actions are workflow-body choreography (zero engine git)` — TABLE (the consumption table) |
| D-rba-3, D-rba-5, D-rba-6, D-rba-7 | — | scope / fact / superseded | not carried |
