## Why

An independent reviewer forms a view on whether the work should move forward and emits only findings;
the view dies in prose, or is never written. R-crc-11(g) makes that view the INPUT to the readiness
judgement rc04a gave a structured home: the archive's `readiness` record is `formed_against`
independent pass TOKENS, and today a token points at findings and a commentary paragraph, never at a
direction. Of the 124 external returns on the archived trails every one carries a `## Notes` section
and 33 contain a direction-bearing sentence (measured 2026-10-03 by word match) — the practice is real
and SPORADIC, arriving as the last sentence of a paragraph when a reviewer happens to offer it. Stage
`rc04b-forward-recommendation` of `clean-up-review-cycle` (Goal G1) gives every independent pass a
NAMED SLOT for a forward recommendation — a direction with its reasons — distinct from the engine's gate
verdict, which stays the engine's alone.

## What Changes

- **A `direction` slot on every independent pass.** Internal: a top-level `direction: {disposition,
  reasoning}` object on the `review` payload, `disposition` exactly one of `forward` | `hold`,
  `reasoning` a non-empty string (multi-line allowed). External: a `## Direction` section between
  `## Blocks` and `## Notes` whose first non-blank line is `**Disposition**: forward` or
  `**Disposition**: hold` and whose remaining body is the reasoning. The shape adopts rc04a's judgement
  vocabulary (`disposition` + `reasoning`, a kind-specific value set) rather than inventing a second
  (R-crc-11's impact note); the word `recommendation` is TAKEN by every finding's fix body and
  `verdict` is the gate's word (explore D-rc04b-1).
- **Owed by the independent classes, optional in-context.** `fresh` and `external` passes owe the slot
  in every mode (keyed on `reviewer_class`, never on mode — an architecture-mode fresh pass owes it at
  the write gate); an `in-context` pass may carry one and is not incomplete without it, because
  R-crc-11(f) makes it a REACTION whose direction is the readiness record's job (D-rc04b-2). One
  predicate — the gate model's existing two-class `isIndependent` — defines "owed" at both the write
  gate and the renderer.
- **"Incomplete" is two-tier: REFUSED where produced, MARKED where it cannot be, never read by the
  gate.** `orbit emit review` refuses a `fresh`/`external` review payload with no `direction`, and a
  present `direction` of the wrong shape at ANY class — presence and shape only (R-crc-10). The
  renderer renders an independent pass that lacks one with the mark `[no direction]`, and an external
  `## Direction` whose opener is not the production with `[direction malformed]` — the file is never
  rejected for it, and `trail.ts`/`gates.ts` read nothing new: an unknown `##` already leaves the
  severity sections in all three external readers, so no count moves (D-rc04b-3; rc02b's evidence-tax
  pattern — refusing an external file would let a judgement field decide whether a pass COUNTS, the
  gate ruling on prose, R-crc-13).
- **It renders as its own section, inside the quarantine, under a narrowed contract.** The report gains
  `### Direction` between `### Suppressed` and `### Commentary`: first line `Disposition: <token>`,
  the reasoning blockquote-contained, the engine tail still LAST. The content contract at both
  sources moves D4's prohibition onto the axis Q-rc04-c named — JUDGEMENT versus COMPUTATION: the
  direction says WHICH WAY and WHY; it never states finding counts, the gate's state or a command
  token. Commentary's own contract is unchanged (D-rc04b-4).
- **The external prompt carries it as a named field.** The reference prompt template asks for
  `## Direction` with its opener, stating that a return without it renders marked; the walk's
  `--from-file` copy of the format moves WITH its owner and says the section is never walked (no triage
  behaviour added; D-rc04b-6).
- **No migration.** Every prior-generation independent pass renders `[no direction]` — by absence,
  never by date (rc02b's `[unreproduced]` precedent). `--report` cannot address an archived change
  (Q-crc-26), so the 124 archived returns render nowhere (D-rc04b-5).

**Size, measured at exploration and DECLARED (D-rc04b-7, Sal: "declare at five").** FIVE capabilities
against R-crc-1's ceiling of three — the charter's `orbit-review`, `orbit-review-external`,
`orbit-report-rendering`, plus `orbit-conventions` (owner of the external format since rc02b) and
`orbit-emit-composition` (its first requirement enumerates the review payload fields; one requirement
per new field since `blocks`). Ten requirements (8 MODIFIED, 2 ADDED), changed bytes small — the eighth MODIFIED is `orbit-review-external`'s reference template, whose fenced output-format block the existing parity test holds byte-equal to the shipped prompt, so the two move together or not at all.
Not split, under R-crc-9's declare branch: internal-from-external puts the renderer in both halves and
leaves one trail with two generations of the rule; produce-from-render ships a slot nothing renders —
the write-only record the parent charter's exit (4) condemned.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-emit-composition`: `Generic emit surface with a narrative-only payload contract` (the review
  excerpt names `direction`); ADDED `The review payload carries direction` (the owed-by-class refusal
  and the shape check at the write gate, mode-blind, prior generations untouched).
- `orbit-report-rendering`: `Report grammar — the frame sandwiches the commentary` (the `### Direction`
  section in the fixed order); `Strict input validation — fail loud, no partial render` (`direction`
  absent-safe, a present mis-shaped one fails naming the field); `One grammar for internal and external
  passes` (the external parser reads `## Direction`); ADDED `Direction renders as its own section and
  its absence is marked on independent passes` (the render form, the two marks, the content contract).
- `orbit-conventions`: `External-review findings markdown format` (the `## Direction` section and its
  opener production, required on every return; marked never rejected; ignored by the counters).
- `orbit-review-external`: `Output format specification in prompt` (the prompt's format block carries
  `## Direction` between `## Blocks` and `## Notes`, required); `Prompt written to versioned file with chat
  invocation snippet` (the reference template's fenced block gains the section — the text task 3.2
  installs into the review body's template, held byte-equal by `test/core/severity-ladder-parity.test.ts`).
- `orbit-review`: `Internal run summary persisted per mode` (the `direction` field, its owed-by-class
  rule by pointer, its content contract; the architecture-mode interim report prints it).

## Impact

- `src/core/emit-composition.ts` — `direction` joins `COMMANDS.review.payloadFields`; a new write-gate
  check beside `validateReviewEvidence`; the gate model's `isIndependent` exported and reused.
- `src/core/report-render.ts` — both normalizers carry `direction`; the external parser gains a
  `direction` section state with the opener production; `renderReviewReport` prints the section and
  the two marks; the one independent-pass golden (`external-pass.golden.md`) gains the marked section and a
  near-miss fixture is added — the other four goldens are in-context passes and stay byte-unchanged.
- `src/core/artifact-graph/trail.ts` — NO change; `gates.ts` — exactly the `export` keyword on `isIndependent` (a test pins that `## Direction` moves no
  count in the trail reader, the trend counter and `countConfidentExternalPasses`).
- `src/core/templates/workflows/review.ts` — Step 8 authors the direction; Step 9 enumerates it;
  `references/run-summary-schema.md` documents it; the prompt template's `## Direction` section; the
  architecture-mode interim shape prints a `Direction:` line.
- `src/core/templates/workflows/address-reviews.ts` — the format copy gains `## Direction` (never
  walked); `orbit-address-reviews`' spec is untouched.
- Tests: write-gate refusals, parser cases, goldens, three-readers-unchanged, schema-table parity,
  generated-surface fidelity; `test/core/severity-ladder-parity.test.ts` already holds the two
  output-format blocks byte-equal, so the review-external delta's block and the template's must move
  together.
- `CLAUDE.md` — the ACTIVE program section's rc04b paragraph. `orbit/specs/*` — five capabilities,
  synced at archive.
