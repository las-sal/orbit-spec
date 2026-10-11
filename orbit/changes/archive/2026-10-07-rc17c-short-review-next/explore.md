> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc17c-short-review-next

## Premise

rc17a shipped discovery (D-bpc-15): a change-scoped walk reaches every pass that carries a finding, at any
severity, through `unresolvedPasses` and `unwalkedPasses`. A change-mode review emit's `next_recommended` still names
`/orbit:address-reviews <change> --from-file <own path>`, an aim at ONE pass. Inside a pair that aim walks one half,
which is exactly why the gate's canonical next already names no file (`orbit-engine-gates`, the unresolved-pass
next). This stage makes the emit's pointer agree with the gate's: D-bpc-16, recorded in rc17a's exploration and split
to this stage under R-crc-9 (its eighth preventive application). The charter's exits: (1) no change-mode review emit's
`next_recommended` names a path; (2) a review emit written before the stage, carrying the self pointer, renders
unchanged; (3) the architecture-mode pointer is unchanged.

## Mechanism

### D-rc17c-1 — a change-mode review emit with findings points at the change, never a path
Domain: the review emit's `next_recommended`, by mode and findings (D-bpc-16's table, re-read against the shipped composer)
| member | covered by |
|---|---|
| proposal or system mode, at least one finding | `/orbit:address-reviews <change>` (CHANGED; discovery reaches the pass, D-bpc-15) |
| proposal or system mode, no findings | `orbit status --change <change> --report` (unchanged) |
| architecture mode, findings | `/orbit:address-reviews --from-file <path>` (unchanged: no change-scoped walk reads the architecture trail) |
| architecture mode, no findings | the payload's `handoff.next_command`, mirrored (unchanged) |
| the external T0 emit (`review-external`) | the paste-and-save line (unchanged, rc08b) |
| change-scoped audit-drift | already the short form (unchanged) |
| project-wide audit-drift | `--from-file <path>` (unchanged) |
| a clean change-scoped audit-drift deferring to the prior emit's next | copies whatever that emit recorded (unchanged code; it now copies the short form after a post-stage review) |
Closure: SOURCED — the `review` case of `composeEmit` in `src/core/emit-composition.ts` has exactly two branches (architecture, else change mode) each split on `hasFindings`; the other rows are the other composers that write an address-reviews pointer
Moves:
- READ: applied — `emit-composition.ts` 1871-1894 (both branches), `hasFindings` 1383 (a non-empty `findings` array); the audit-drift composer 2055-2079; `orbit-emit-composition`'s `Deterministic facts are engine-composed per command` says "(all modes …)", which this stage splits
- ENUMERATE: applied — this table
- COHERE: applied — after the change the emit's next and the gate's canonical next (`orbit-engine-gates`, the unresolved-pass next) name the same invocation; the report tail already prints the gate's
- EXECUTE: not applied — nothing built
- FALSIFY: applied — a SUGGESTION-only pass named by the short form is walked only because rc17a's `unwalkedPasses` reaches it; Case 1 records that rc17a shipped it
- CONFORM: applied — single-voiced canonical next; R-crc-14 (the rule stated once, in `orbit-emit-composition`; the review body names it — D-rc17c-3)
- FEASIBILITY: not applied — one branch in one composer
- CONSUME: applied — the renderer's spine check is the one consumer that grades the value (D-rc17c-2); the orientation surface reads explore emits' next, not review emits' (`orientation.ts` 444, 463); the clean audit-drift deferral copies the string and parses nothing
- INVOKE: applied — every `orbit emit review` in proposal or system mode

### D-rc17c-2 — the renderer accepts the self pointer as the prior generation, by value, never by date
Domain: a boundary-conformant internal review emit at `--report`, by its `next_recommended`
| member | covered by |
|---|---|
| findings, `/orbit:address-reviews <change>` | accepted: the current pointer |
| findings, `/orbit:address-reviews <change> --from-file <this emit's own repo path>` | accepted: the prior generation (exit (2)) |
| findings, the self-pointer form naming any OTHER path | refused: drift, naming the field (unchanged behaviour) |
| findings, any other string | refused: drift (unchanged) |
| no findings, the report pointer | accepted (unchanged) |
| no findings, any other value (including either address-reviews form) | refused (unchanged) |
| an archived change's emit | the self path is rebuilt from the emit's `change` as `orbit/changes/<change>/.orbit-runs/<basename>` (unchanged), which is where it was written |
| a pre-boundary emit | the `pre-capability emit` error (unchanged; the check never runs) |
Closure: SOURCED — the renderer's internal-emit branch is the one place `next_recommended` is graded (`report-render.ts` 464-475); the members are its two findings states crossed with the values the composer has ever written, plus the two refusals
Moves:
- READ: applied — `report-render.ts` 447-475 (`emitRepoPath` from `j.change` + basename); the tail prints the gate's canonical next, never the emit's (Case 2)
- ENUMERATE: applied — this table
- COHERE: applied — both accepted values are computed from the emit itself (its change, its basename); neither is a free string, so the check stays deterministic, a closed set of two
- EXECUTE: not applied — nothing built
- FALSIFY: applied — a post-stage emit hand-edited back to the self pointer renders silently; the residual is harmless to the walk (the old form still walks the named pass) and is stated, not checked
- CONFORM: applied — prior generations are marked by shape, never by date (the rc02b and rc04b precedent); R-crc-13 (the render reports, it grades nothing about readiness)
- FEASIBILITY: not applied — one comparison against two strings
- CONSUME: applied — 182 archived proposal/system emits carry the self pointer (Case 2); every boundary-conformant one must keep rendering
- INVOKE: applied — every `orbit status --change <name> --report [<TS>]` on an internal emit

### D-rc17c-7 — every canonical emit example is executed, not trusted
Domain: the ```json fences of `orbit-conventions`' `Internal-run JSON summary format`, enumerated by parse
| member | covered by |
|---|---|
| the workflow-kind example (`apply`) | strip the engine's refused set for `apply`; submit through `orbit emit apply` in a disposable project seeded to the example's situation (chunked, chunk 2); the written emit's top-level key set equals the example's |
| the editorial-kind example (`review`) | the same round trip through `orbit emit review`; then `orbit status --change <name> --report` renders the written emit (the strict reader, D-rc17c-2's check included) |
| the lifecycle-kind example (`archive`) | the same round trip through `orbit emit archive` in the archived scope (rc07b's scope word) |
| a fence whose `command` has no round trip wired | the test fails naming the fence's line: a new example cannot land unexecuted |
| a fence that is not a canonical example (the spine table's own fences above it, if any parse as JSON) | excluded by the requirement's `Canonical examples` heading line: only fences after it are examples |
Closure: SOURCED — the requirement's fences after its `**Canonical examples**` line, found by the engine's CommonMark fence tracker (`src/core/markdown-fence.ts`), never a regex over backticks
Moves:
- READ: applied — the three examples (spec 244-322) against the newest real emits on rc17b's trail (Case 3); `ENGINE_OWNED_EXTRA` in `emit-composition.ts` 220 is the engine's own refused set, so the guard strips by the engine's list, never a test-side copy
- ENUMERATE: applied — this table
- COHERE: applied — rc07b's round trip proves a PAYLOAD reference; this proves an EMIT example by subtracting back to its payload, so the two instruments share the write gate and the subtraction and differ only in direction
- EXECUTE: not applied — nothing built
- FALSIFY: applied — the round trip is exactly as strong as the write gate's validators plus a key-set comparison; a stale VALUE under a current key passes (rc07b's named limit, inherited); the review example is held harder: its engine-composed values other than `timestamp` are compared with the written emit under the example's own `change` name, since the renderer alone grades only the values the engine recomposes
- CONFORM: applied — R-crc-10 (the check runs on what the engine observes: keys and the gate); R-crc-14 (the subtraction list has one home, the engine)
- FEASIBILITY: applied — the apply example's chunk fields need a seeded `tasks.md` with a chunk preamble; if seeding costs more than the example is worth, the example is rewritten to an unchunked apply instead (the apply author's call, recorded)
- CONSUME: applied — no runtime reader consumes these examples; their consumer is the human or AI reading the spec, which is why staleness went unseen (Case 3)
- INVOKE: applied — `npm test`, on every run

### Case 3 — the examples were stale on every kind
Measured 2026-10-06 against rc17b's trail (`apply-2026-10-06T20-42-57Z.json`, `archive-2026-10-07T00-47-00Z.json`, `review-system-2026-10-07T00-43-59Z.json`): the apply example lacks `user_validation_tasks` and `diff_base`; the archive example lacks `judgements`; the review example lacks `reviewer_class`, `flags`, `stale_suppressed`, `passes_skipped`, `pass_genre` and `verified_walks`, and carries the self pointer. No instrument reads the examples, so nothing noticed.

### Case 1 — rc17a's discovery is shipped
`orbit-engine-gates` (baseline) states the unresolved-pass next as the change-scoped form naming no file, and rc17a's archive lists `unwalkedPasses` beside `unresolvedPasses`. The short form's reach is therefore real today, not prospective.

### Case 2 — what a report prints
The three golden reports that carry findings (`proposal-pass`, `verification-pass`, `external-pass`) end `Ready when you are: /orbit:address-reviews <change>` — the gate's canonical next, already the short form. No report prints the emit's `next_recommended`. A count of archived trails: 182 `review-proposal-*`/`review-system-*` emits; 250 lines across archived review emits name `--from-file`.

## Decisions

- **2026-10-06 — D-rc17c-1: a change-mode review emit with findings points at the change, never a path** — `next_recommended` becomes `/orbit:address-reviews <change>`; the clean pointer, architecture mode, the external T0 and both audit-drift scopes are unchanged. Carries D-bpc-16 (rc17a's exploration) into this stage.
  Kind: rule
- **2026-10-06 — D-rc17c-2: the renderer accepts the self pointer as the prior generation, by value, never by date** — the deterministic-pointer check becomes a closed set of two values computed from the emit itself; anything else still fails naming the field.
  Kind: rule
- **2026-10-06 — D-rc17c-3: the review body's two restatements of the pointer become a pointer at the owner** — `review.ts`'s spine paragraph and its schema line restate the composition rule `orbit-emit-composition` owns (R-crc-14); they move to the short form by NAMING the owner, in the same task as the composer. A method call (R-crc-3).
  Kind: scope
- **2026-10-06 — D-rc17c-4: exit (2) is a render-acceptance criterion, not a byte criterion** — no report prints a review emit's `next_recommended` (Case 2), so "renders unchanged" is met exactly when the check accepts the prior value; the goldens do not move for it.
  Kind: fact
- **2026-10-06 — D-rc17c-5: a fourth spec states the old pointer** — `orbit-conventions`' `Internal-run JSON summary format` carries an editorial-kind example whose `next_recommended` is the self pointer. The example is already a prior-generation shape: it lacks `reviewer_class` (which the renderer requires), `pass_genre` and `direction`. The charter counted three capabilities; this is the fourth. Disposition of the example is Q-rc17c-1.
  Kind: fact
- **2026-10-06 — D-rc17c-6: the stage fixes all three canonical examples now, and declares a fourth capability** — Sal: "why wait til audit-drift to fix something we see now? let's fix it now." `orbit-conventions` joins the stage, one over R-crc-1's ceiling, declared under R-crc-9 (the rc07b, rc02b and rc17b precedent). The fix is not one line: every example in the requirement is stale (Case 3), so all three are refreshed to the current shapes. Resolves Q-rc17c-1.
  Kind: scope
- **2026-10-06 — D-rc17c-7: every canonical emit example is executed, not trusted** — a test subtracts each example back to its payload by the engine's own refused set, submits it through the real write gate, and holds the written key set equal to the example's; the review example is also rendered. A method call (R-crc-3): the examples went stale because nothing read them.
  Kind: rule

## Open questions


## Considered & out

- **2026-10-06 — a generation marker field to tell prior emits from new ones.** Out: both accepted values are computed from the emit itself, so no new field or date cutoff is needed (D-rc17c-2).
- **2026-10-06 — the external prompt's "eventual findings path" item (`orbit-review-external`).** Out: the T0 line ends at the save step (rc08b) and `--from-file` stays a legal explicit aim; D-bpc-16 left it unchanged.

## References

- `orbit/changes/archive/2026-10-06-rc17a-invoked-coverage/explore.md` — D-bpc-15 and D-bpc-16, the rule's origin
- `src/core/emit-composition.ts` — the `review` composer (1871-1894), `hasFindings` (1383), the audit-drift deferral (2062-2079)
- `src/core/report-render.ts` — the spine-semantics check (447-475)
- `orbit/specs/orbit-emit-composition/spec.md` — `Deterministic facts are engine-composed per command`
- `orbit/specs/orbit-report-rendering/spec.md` — the spine-semantics paragraph and `Deterministic spine drift fails the render`
- `orbit/specs/orbit-review/spec.md` — `Internal run summary persisted per mode`, scenario `Spine fields carry deterministic facts under persist-first`
- `orbit/specs/orbit-conventions/spec.md` — `Internal-run JSON summary format`, the editorial-kind example (D-rc17c-5)
- `src/core/templates/workflows/review.ts` — lines 19 and 31 (D-rc17c-3)
