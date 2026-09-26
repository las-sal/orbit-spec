# Proposal: rc13b-explore-maturity-signal (stage rc13b-explore-maturity-signal)

## Why

The explore readout's top rung asserts readiness on evidence that cannot support it. The maturity
grid grades an exploration by two counts — top-level list items under `## Decisions` and under
`## Open questions` — and fires Mature ("ready to formalize") at four or more decisions with at most
one open question. Confidence rises with heading count. The record shows the defect firing on the
convention's own artifact: `bounded-closure-semantics` rendered Mature at five decisions and zero
questions on 2026-09-15, while the file held only the hinge and no Mechanism section at all.

rc13a shipped what a readout can read instead: a Mechanism section with one entry per live rule, a
`Closure:` token whose two outcomes are CLOSED (DERIVED, SOURCED) and OPEN-DECLARED (BOUNDED with both
residual slots), and a status header with two tokens (`exploring.` / `concluded <date>.`). It shipped
no engine code — the format is proven by a generated-surface test over two exemplars, and this
stage's parser is the grammar's second extension. The convention is ADVISORY until this stage lands:
an author can ignore it today and no readout notices.

Every mechanism here was settled in the exploration (`explore.md`, nine decisions, seven rules with
Mechanism entries checked clean against the grammar by an executed script). Executing the convention
on its own file, and the fresh pass executing it on the archived exemplar, settled how the ID opener is
read: a FIRST-LINE PREFIX match, so a bold title wrapped onto a second line keeps its ID and only an
entry with no date-and-ID prefix at all is ID-less.

## What Changes

- **The grid reads the header FIRST.** A `concluded` header collapses every count to a fifth rung,
  CONCLUDED, whose `next_recommended` is prose naming no command — `Concluded <YYYY-MM-DD>. Reopens
  when: <the Re-entry: slot, verbatim>.` — legal under the spine's "verbatim, best-effort parse"
  definition and the archive emit's existing precedent. It is the only rung that points at nothing.
- **Mature SPLITS on accounting.** Early, Mid and Stalled keep their shipped strings and thresholds.
  At 4+ decisions and ≤1 open question, any live rule with an OPEN domain renders UNACCOUNTED
  (`/orbit:explore <name>`, naming the gap by ID); every live rule accounted renders the top rung,
  which REPORTS — live-rule count, zero open, each BOUNDED residual named — in eligibility phrasing
  and still points at propose. The open-rule list renders as a RECORD beside every rung; it changes
  the verb in exactly one cell.
- **The parse judges FORM over two DISJOINT arrays.** `rules_open` holds live rules only, each in
  exactly one of five states (`open` for an entry with no well-formed ID, `absent`,
  `bounded-incomplete`, `no-closure`, `malformed-entry`), and its length is the rung's K;
  `key_defects` holds orphan Mechanism entries and duplicate Decisions IDs, which are defects in the key
  space and never rules with open domains — reported in their own clause on every rung, never changing
  the verb. A `Kind:` or `Disposition:` value outside its production is no match, so the slot is
  absent and the demanding default applies; no `## Mechanism` section makes every live rule ABSENT with
  one stderr note. No defect blocks an emit. Both parsers use the engine's ONE CommonMark fence tracker. Whether an enumeration is TRUE, or a rule was written down at all, stays a
  reader's judgement — the requirement says so.
- **Five engine-computed fields join the explore emit** — `rules_total`, `rules_open` (open live
  rules, each with its state and, where needed, its line), `key_defects` (orphans and duplicates by
  line), `residuals` (each accounted BOUNDED entry's ID, kind and method) and `status` (the header
  token; date, and the `Re-entry:` text when exactly one live entry carries it). A payload carrying any of them draws the engine-owned refusal,
  the same sentence `decisions_captured` draws today. Every list the rung renders — open domains,
  key defects, residuals — is bounded to three identifiers then `+N more`, under one identifier rule;
  the fields are total.
- **The three productions move into ONE module.** `orbit-conventions`' spec text stays the owner; a
  parity test compares the module's productions to the spec's fenced lines; the explore body template
  interpolates the module byte-identically (the `orbit-explore` hash pin is unchanged); the
  generated-surface test and the new parser import it. No third hand-copy of the grammar.
- **The orientation row stops lying above the rung.** For a staging explore whose newest spine-valid
  emit carries `status.token: concluded`, the strip's explore chip renders `■` instead of `▶` and the
  `--json` position literal is `concluded` instead of `exploring`. Read from the TRAIL, never the
  file — the bare-status requirement closes orientation's data sources at engine computations,
  directory presence, citations and emit files.
- **One spec sentence is corrected, not built toward.** The maturity requirement claims the leading
  token "is the canonical recommendation that a downstream status reader parses into `command`/`args`";
  no such reader exists under `src/core`, and the shape requirement's own scenario already says "(if
  present)". The sentence becomes the spine's words.
- The `five-section format violation` string in the emit surface's stderr note becomes a pointer to
  `orbit-conventions`' format requirement — one of the two engine strings rc13a's residue sweep
  exempted for this stage.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `Decision entry identity and classification` — ONE sentence and one scenario:
  an ID is well-formed when the entry's first line matches the opener prefix; a wrapped title keeps
  its ID. The rule's owner; the parse points at it.
- `orbit-run-summary-emit`: `Named-mode explore recommendation by maturity` — header-first
  precedence, the CONCLUDED and UNACCOUNTED rungs, the reporting top rung, the bounded open-rule
  render, the corrected parse sentence.
- `orbit-emit-composition`: `Per-command computed extensions` — the Mechanism/Decisions parse, the two
  disjoint arrays and the five explore fields, engine-owned; plus an ADDED requirement making the grammar module the single
  imported source of the productions, held to the spec by a parity test.
- `orbit-orientation`: `Sprint strip composition`, `JSON output for both tiers`, and
  `Next-recommendation sourcing is time-shifted, never live` — the concluded chip, position and
  bare next line, all sourced from the newest emit's `status.token`.

FOUR capabilities — one over the R-crc-1 ceiling by a one-sentence delta, a breach declared in design
and ratified at the proposal walk (the external pass found the opener rule stated in its consumer with
no owner). Seven requirement blocks (six MODIFIED, one ADDED).

## Impact

- **Engine**: `src/core/parsers/explore-counter.ts` (the grid gains the header and rules inputs), a new
  `src/core/parsers/explore-rules.ts` (the form parse), a new `src/core/explore-grammar.ts` (the
  productions), `src/core/emit-composition.ts` (the `explore` case and `ENGINE_OWNED_EXTRA`),
  `src/core/orientation.ts` (chip and position from `status.token`).
- **Templates**: `src/core/templates/workflows/explore.ts` interpolates the grammar module — zero
  rendered diff, hash pin unchanged.
- **Tests**: `test/core/templates/orbit-generated-surface.test.ts` imports the module; new parser
  tests over the two body exemplars and the nine entry states; grid and orientation tests extended;
  a spec-parity test for the module.
- **Readers**: every explore emit gains five fields; prior-generation emits lack them and every reader
  tolerates absence (the existing generation rule). The maturity strings for Early, Mid and Stalled
  are byte-identical prefixes (a record suffix may follow); the old Mature string survives as the Accounted rung's shape only with the
  report prefix, so a reader matching `/orbit:propose <name>` on it still matches.
- **Vocabulary shared with rc15**: the position literal `concluded` names the same third state
  rc15's ended-from-explore observation will need; whichever stage ships first names it and the
  other adopts.
- **Not in scope, declared**: the "until the maturity-signal stage lands" clauses in
  `orbit-conventions`' concluded-outcome requirement and in the explore body's KNOWN paragraph become
  historical once this ships; retiring them is a fourth capability and is deferred to the same
  retirement-class sweep rc13a deferred its "five-section" titles to.
