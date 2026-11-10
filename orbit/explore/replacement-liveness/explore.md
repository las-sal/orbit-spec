> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: replacement-liveness

## Premise

The first of the three changes D-sga-1 set (`orbit/explore/seam-chaining-grants/explore.md`). A replacement record
carries its original's link fields unchanged (`orbit-decision-records`' `A record is fixed by a replacement, never
edited`), but the write gate re-runs every carried citation's existence check (`checkCitationExists`,
`src/core/decision-records.ts`), and a `decision` citation must name a LIVE Decisions entry. So once a cited decision
is superseded or assigned, the record citing it can never be reworded. It happened on 2026-11-10:
`ledger-2026-11-09T17-50-54Z.json` cited D-sc-9, which moved to the driver the same day, and its replacement was
refused, so a new entry was written instead.

The brief already reads the other way: it renders a decision citation from any Decisions entry, whatever its
disposition (`decisionEntryText`), so the reader sees a superseded entry with its `Disposition:` line. Only the
gate is stricter than the reader. The spec is split the same way: its link-chain table says a link a replacement
carries stays as its original wrote it, even when its target has since been replaced, while its citation table's
`decision` row demands a live entry with no exception for a carried link.

**Goal.** A decision record can be corrected after a decision it cites is superseded, as long as what it cites still
exists for a reader to open. Superseding a decision during an exploration is routine; under seam-chaining and later
autonomous runs an AI correcting its own records would otherwise meet a refusal with only a workaround, and each
workaround is a duplicate record a person later reads.

**Done when:**

1. A replacement carrying a citation of a superseded or assigned decision is accepted (the 17-50-54Z case).
2. A new record, not a replacement, citing a superseded decision is still refused.
3. A carried citation of a decision ID the `explore.md` does not hold at all is still refused.
4. Every other citation kind, and `raised_stop` and `stop`, is checked exactly as today.
5. Whatever a replacement may cite, the brief renders.

## Mechanism

### D-rl-1 — a carried decision citation must name a Decisions entry of any disposition
Domain: every link a replacement carries that the write gate checks for existence
| member | covered by |
|---|---|
| `relies_on` `decision` citation | THIS RULE — any Decisions entry with that ID, whatever its `Disposition:` (the brief's `decisionEntryText` predicate) |
| `relies_on` `requirement` citation | unchanged — the baseline holds the requirement (rot is D-rl-2's named limit) |
| `relies_on` `ruling` citation | unchanged — the doc's Rulings index holds the ID |
| `relies_on` `goal` citation | unchanged — the doc's Goals hold the ID |
| `relies_on` `resolution` citation | unchanged existence check; its replaced-target check is already skipped on a replacement |
| `raised_stop` | unchanged — the stop exists with a ledger stop condition; replaced-target check already skipped |
| resolution `stop` | unchanged — the stop exists; replaced-target check already skipped |
| a stop record's `condition` | not a citation — a fixed enum, no existence check |
Closure: SOURCED — the switch in `checkCitationExists` (five kinds) plus the two named-stop reads in `checkDecisionLinks`, `src/core/decision-records.ts`; the link fields are the replacement requirement's table
Moves:
- READ: applied — `checkCitationExists`' `decision` case refuses unless `liveDecisionIds` holds the ID; the brief's `decision` case uses `decisionEntryText`, which matches an entry of any disposition (`src/core/parsers/explore-rules.ts`); the spec's citation table row demands live, its link-chain table's carried-link row says the link stays as written
- ENUMERATE: applied — this table, one row per existence check the gate runs on a replacement
- COHERE: applied — `checkReplaces` runs first and holds every carried link equal to the original's, and the original passed the live check when written, so the looser predicate only ever admits a citation that was live once; it rides the same `carried` flag that already skips the replaced-target checks
- EXECUTE: applied — Case 1: under the rule the 17-50-54Z replacement is accepted, and a fresh ledger entry citing D-sc-9 is still refused
- FALSIFY: applied — a replacement cannot bring in a new dead citation, since its `relies_on` must equal the original's; a cited entry DELETED from `explore.md` (not superseded) is still refused, which is right because the reader could not open it
- CONFORM: applied — `orbit-decision-records`' `A record is fixed by a replacement, never edited` (links unchanged; the carried-link row) and `A ledger entry names what it relies on` (a new citation still needs a live decision); option C is out under the first
- FEASIBILITY: not applied — one predicate chosen by the existing `carried` flag
- CONSUME: applied — the brief renders any Decisions entry with its `Disposition:` line, so every citation the gate now accepts renders; the reference `references/decision-records.md` states the live rule and gains the carried exception beside the spec row
- INVOKE: applied — fires on every `orbit emit ledger` whose payload carries `replaces`
### Case 1 — the D-sc-9 refusal
`orbit/changes/archive/2026-11-10-seam-chaining/.orbit-runs/decisions/ledger-2026-11-09T17-50-54Z.json` cites
`{kind: "decision", id: "D-sc-9"}`; D-sc-9 gained `Disposition: assigned` the same day. Its replacement at the
seam-chaining walk was refused naming the citation, and `ledger-2026-11-10T03-00-50Z.json` was written as a new entry
instead. Under D-rl-1 the gate finds D-sc-9 in Decisions, ignores its disposition because the citation is carried, and
writes the replacement; the brief then renders D-sc-9 with its `Disposition:` line.

## Decisions

- **2026-11-10 — D-rl-1: a carried decision citation must name a Decisions entry of any disposition** On a
  replacement, the write gate checks a carried `decision` citation with the brief's own predicate: the work's
  `explore.md` holds a Decisions entry with that ID, whatever its `Disposition:`. A new citation still needs a live
  entry, and every other kind keeps today's check. It fixes the case that happened, keeps every carried link pointing
  at something a reader can open, and makes the gate, the brief and the spec's carried-link row agree. Option A of the
  open question, ratified by Sal.
  Kind: rule
- **2026-11-10 — D-rl-2: a carried requirement citation that rots stays refused, as a named limit** When another
  change's archive renames or removes a requirement a record cites, a replacement of that record is refused and the
  brief fails whole. This change does not fix it: the rot needs another change archived while this work is mid-flight,
  which is rare under the single-session model, and fixing it means the brief rendering a citation it cannot resolve.
  The limit is written into the requirement's text at propose.
  Kind: scope

## Open questions

## Considered & out

- **2026-11-10 — B: check a carried citation only for equality with the original's.** Out: a carried requirement
  citation could point at nothing, and the brief refuses to render at all when one does.
- **2026-11-10 — C: let a replacement re-point a dead citation to its successor (D-sc-9 → D-sc-17).** Out: it changes a
  link field, which the replacement rule exists to forbid, and the record would no longer say what the call relied on.

## References

- `src/core/decision-records.ts` — `checkCitationExists` (the `decision` case), `checkDecisionLinks` (the carried flag), and the brief's `decision` case
- `src/core/parsers/explore-rules.ts` — `liveDecisionIds` (the gate's predicate) and `decisionEntryText` (the brief's)
- `orbit/specs/orbit-decision-records/spec.md` — `A ledger entry names what it relies on` (the citation table's `decision` row; scenario `A superseded decision is not citable`); `A record is fixed by a replacement, never edited` (the link-chain table's carried-link row)
- `.claude/skills/orbit-explore/references/decision-records.md` — the generated reference's `decision` line, which states the live rule
- `orbit/changes/archive/2026-11-10-seam-chaining/.orbit-runs/decisions/ledger-2026-11-09T17-50-54Z.json` — the refused case; `ledger-2026-11-10T03-00-50Z.json` the new entry written instead
