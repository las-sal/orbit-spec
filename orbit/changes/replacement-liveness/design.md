## Context

`checkDecisionLinks` (`src/core/decision-records.ts`) runs `checkReplaces` first on a payload carrying `replaces`, which
refuses any link field that differs from the original's, and then runs `checkCitationExists` on every `relies_on`
citation. The `carried` flag already skips the replaced-target checks (a carried resolution, `raised_stop` or `stop`
link may name a record since replaced), but every existence check runs as on a new record. For the `decision` kind that
check is `liveDecisionIds(explore.md).has(id)`, while the brief's `decision` case uses `decisionEntryText`, which finds
an entry of any disposition (`src/core/parsers/explore-rules.ts`). The spec's link-chain table already says a carried
link stays as its original wrote it; only the citation table's `decision` row contradicts it. The motivating case and
the analysis are in `explore.md` (Premise, Case 1).

## Goals / Non-Goals

**Goals:** the five done-when criteria of `explore.md`'s Premise — a replacement carrying a citation of a superseded or
assigned decision is written; a new citation of one is still refused; a carried citation of an ID the file does not hold
is still refused; every other kind and both named-stop links are checked as today; the brief renders whatever a
replacement may cite.

**Non-Goals:** a carried `requirement`, `ruling` or `goal` citation that rots (D-rl-2, a named limit in the requirement); re-pointing a
citation to a successor; any change to the brief, to stop or resolution records, or to what a user is asked.

## Decisions

**D-rl-1 — a carried decision citation must name a Decisions entry of any disposition** (see `explore.md`). On a
replacement, the write gate checks a carried `decision` citation with the brief's own predicate: the work's
`explore.md` holds a Decisions entry with that ID, whatever its `Disposition:`. A new citation still needs a live
entry, and every other kind keeps today's check.

Implementation: `checkCitationExists` gains a `carried: boolean` parameter, passed from `checkDecisionLinks`'s existing
flag. In the `decision` case, `carried` selects `decisionEntryText(content, id) !== null` in place of
`liveDecisionIds(content).has(id)`; the refusal on a carried citation says the file "holds no Decisions entry", and on a
new one keeps "holds no live Decisions entry". The other four cases ignore the parameter. Using the brief's own
function rather than a second predicate keeps the gate and the reader on one definition: whatever the gate admits, the
brief renders.

Why it is safe: `checkReplaces` runs before the existence checks and refuses a `relies_on` that differs from the
original's, and the original passed the live check when it was written, so the looser predicate only ever admits a
citation that was live once.

**D-rl-2 — requirement rot stays refused, as a named limit** (scope; see `explore.md`). Stated in the requirement's
text, not fixed. The limit names ruling and goal citations too: `checkCitationExists` re-runs `rulingExists` and
`goalExists` on a replacement, so an architect session that drops or renumbers a cited ID refuses the replacement the
same way; only a requirement citation also fails the brief, which renders a ruling or goal by its ID alone.

The generated reference: `CITATION_EXISTS.decision` in `src/core/disciplines.ts` gains the carried exception, so every
`decision-records.md` reference states it beside the live rule.

### Alternatives considered (from explore.md, Considered & out)

- **B — check a carried citation only for equality with the original's.** Out: a carried requirement citation could
  point at nothing, and the brief refuses to render at all when one does.
- **C — let a replacement re-point a dead citation to its successor.** Out: it changes a link field, which the
  replacement rule exists to forbid, and the record would no longer say what the call relied on.

## Risks / Trade-offs

- [A carried citation names an entry deleted from `explore.md` rather than superseded] → still refused, as before; the
  scenario `A carried decision citation that names nothing is refused` holds it.
- [The live predicate and the any-disposition predicate drift apart] → both are read from the same Decisions parse
  (`collectSections` and `readDecision`); the tests submit one fixture through both paths.
- [Citation rot: a requirement, ruling or goal renamed or removed mid-flight (D-rl-2)] → the named limit in `A ledger entry names what it relies on`; the refusal names the
  citation, so it surfaces.

## Touchpoints

- `src/core/decision-records.ts` — `checkCitationExists` takes `carried`; `checkDecisionLinks` passes it.
- `src/core/disciplines.ts` — the `decision` line of `CITATION_EXISTS`.
- `test/core/decision-records.test.ts` — the two new scenarios and the narrowed one.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure or state | owner's state | destination |
|---|---|---|---|
| D-rl-1 | SOURCED | live rule | `orbit-decision-records`' `A ledger entry names what it relies on` — TABLE (the citation table's `decision` row gains the carried case) and a SENTENCE naming the source (the rows are every existence check the write gate runs; each applies to a carried citation as to a new one except `decision`) |
| D-rl-2 | — | scope | not carried as a rule; its limit is written into the same requirement as a named limit |
