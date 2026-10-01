> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc16-retirement-sweep

## Premise

Three stages in a row (rc13a, rc13b, rc13c) and then rc15 each deferred living prose that a later
stage made false, to "a retirement-class sweep" — Q-crc-28's ledger. The charter (`### Stage
rc16-retirement-sweep`) says: retire the set by POINTER, in one change; the explore body's copies move
with their owning sentences; no mechanism, MODIFIED blocks only; three capabilities at the ceiling.
What this exploration must settle is the SET itself — Q-crc-28 quotes line numbers that have already
drifted (the audit's 980/994 now hold different sentences than rc13c's note named), so the enumeration
is done by SENTENCE, and the one scope question is whether the retained "five-section" TITLES are in
the set or out of it.

## Mechanism

### D-rc16-2 — a retired-limit sentence is repaired by POINTER or deleted, never restated
Domain: every site in classes A and B of the References enumeration (the sentences, not the line numbers)
| member | covered by |
|---|---|
| `orbit-conventions` line 980 — the VISIBILITY paragraph's closing clause naming two "follow-on" mechanisms | rewrite the clause to NAME the shipped owners by capability (`orbit-run-summary-emit`'s maturity rung; `orbit-propose-modifications`' Mechanism consumption) — a pointer, no restatement of either |
| `orbit-conventions` line 994 — the accounted-as-OPEN-DECLARED scenario's parenthetical | same pointer form as line 980 |
| `orbit-conventions` line 1022 — the KNOWN paragraph (three limits "until …") | DELETE the three limits; replace with one sentence naming the owners that closed them (`orbit-architecture-engine`'s state requirement; `orbit-run-summary-emit`'s maturity requirement; `orbit-propose-modifications`' Step 0 refuse) |
| `explore.ts` lines 504, 606, 610, 657 — the body's copies of the three sentences above | move WITH their owners (D-rc16-3) |
| `orbit-orientation` line 44 — "never artifact-content parsing" | qualify: "orientation itself parses no artifact content; the stage-state source it consumes reads the concluded header per `orbit-architecture-engine`" (Q-crc-28's written repair) |
| `orbit-orientation` lines 94-95 — "never from the file (per the bare-status requirement's closed data-source scenario)" | soften to "the ROW's chip is read from the trail" and drop the parenthetical that cites the clause as a transitive prohibition |
Closure: SOURCED — the set is a grep over the named phrases on HEAD 84f5d67b ("propose-consumption follow-on", "until the maturity-signal stage", "until a propose-consumption stage", "keys on location", "never artifact-content parsing", "never from the file") across tracked specs, templates and docs, archives and trails excluded; every hit is a row or is named out (orientation.ts:50, true of the chip; class C, D-rc16-1)
Moves:
- READ: applied — every row's sentence was read verbatim at this exploration (two tails re-read after a column cut); Q-crc-28's line numbers 980/994 no longer hold the sentences rc13c's note named, which is why the domain is keyed by sentence
- ENUMERATE: applied — this table; the grep's eleven hits partition into six rows, one named-out code comment, and class C
- COHERE: applied — the pointer form names an OWNER capability, never a stage id, so the repaired sentence cannot go stale again when a stage archives (the defect the whole class shares is prose naming a FUTURE stage)
- EXECUTE: not applied — nothing runs; the deliverable is prose, measured by exit (1)'s grep to zero
- FALSIFY: applied — a repair that pointed at a stage ("rc13b surfaces it") would be the same class one archive later; a repair that restated the owner's rule would be R-crc-14's pattern; both excluded by the row form
- CONFORM: applied — R-crc-14 (point, never restate), R-crc-1 (two capabilities with the body riding), R-crc-9 (class C split out rather than exceeding)
- FEASIBILITY: not applied — six rows, two MODIFIED blocks per capability at most
- CONSUME: applied — the consumers are readers of the baseline and the generated explore skill; the audit-drift Category 3 scan is exit (3)'s instrument and reads the same sentences
- INVOKE: applied — fires once, at this change's apply; exit (3) re-runs the audit after archive so a surviving site is observed, not assumed

### D-rc16-3 — the explore body's copies move WITH their owning sentences, in the same change
Domain: the (body copy, owning sentence) pairs
| member | covered by |
|---|---|
| `explore.ts` line 504 ↔ `orbit-conventions` line 980 (the VISIBILITY closing clause) | one edit per side, same pointer form, same task |
| `explore.ts` line 606 ↔ `orbit-conventions` line 1022's second limit (the COUNT-DERIVED next line "until the maturity-signal stage lands") | the body's step-4 clause drops "until the maturity-signal stage lands"; the spec's limit goes with it |
| `explore.ts` line 610 ↔ `orbit-conventions` line 1022 (the KNOWN paragraph) | the body's paragraph is deleted or reduced exactly as the spec's is |
| `explore.ts` line 657 ↔ `orbit-conventions` lines 980/994 (the promotion transfer "until a propose-consumption stage lands") | the body's sentence names propose's Mechanism consumption as shipped, as the spec's does |
Closure: SOURCED — the body's sections that paraphrase `orbit-conventions` are the conclude section and the composition section; each paraphrase was located by the same phrase grep as D-rc16-2, and a body sentence with no owning spec sentence (none found) would be a row with an empty right cell
Moves:
- READ: applied — each pair's two sentences read side by side at this exploration
- ENUMERATE: applied — four pairs; the body's "five-section" negative marker (fidelity test line 204) shows class C already has no body copy
- COHERE: applied — the audit walk declined to fix the body alone for exactly this reason: a body ahead of its spec is two statements of one rule in two forms
- EXECUTE: not applied — prose
- FALSIFY: applied — if a pair were edited on one side only, the fidelity suite would not catch it (no marker pins these sentences), so the pairing is enforced by the task list, not a test — stated as the limit it is
- CONFORM: applied — R-crc-14's mirror corollary in spirit (these are paraphrases, not checked mirrors — which is why the task pairs them by hand)
- FEASIBILITY: not applied — four pairs
- CONSUME: applied — the regenerated `orbit-explore` SKILL.md is the consumer; `update --force` after the edit, the hash pin moving once
- INVOKE: applied — fires at apply, in the task that edits each pair

## Decisions

- **2026-10-01 — D-rc16-1: the retained "five-section" titles are OUT of this sweep** (Sal: "out").
  Renaming them is a RENAMED block in two capabilities plus pointer sites in three more and the parity
  tests' title anchors — five capabilities, over R-crc-1; R-crc-9 says split or declare, never exceed, and
  the title's staleness is cosmetic (a delta-identity key, not a rule a reader executes). Carried to
  Considered & out with a re-entry trigger. Consequence: the sweep touches TWO capabilities
  (`orbit-conventions`, `orbit-orientation`) plus the explore body — the charter's "three" is a measured two.
  Kind: scope
- **2026-10-01 — D-rc16-2: a retired-limit sentence is repaired by POINTER or deleted, never restated.**
  A sentence that described a limit a later stage retired either names the capability that now owns the
  behaviour or goes; it never gains a restatement of the owner's rule, and it never names a STAGE (a stage
  id in living prose is the defect's origin — it goes stale the day the stage archives). The charter's
  rule (1), with the owner-not-stage corollary added here.
  Kind: rule
- **2026-10-01 — D-rc16-3: the explore body's copies move WITH their owning sentences, in the same change.**
  The body paraphrases `orbit-conventions` in its conclude and composition sections; each paraphrase is
  edited in the same task as its owner so the generated skill and the spec never say different things.
  The charter's rule (2).
  Kind: rule
- **2026-10-01 — D-rc16-4: the set is enumerated by SENTENCE, never by line number.** Q-crc-28 quotes
  line numbers (980/994/1022; 610/657) that drifted between rc13c's archive and this exploration — lines
  980 and 994 now hold different sentences than rc13c's note described, though the stale clauses are
  still there, further along the paragraph. Exit (1) measures by the quoted sentences.
  Kind: fact
- **2026-10-01 — D-rc16-5: MODIFIED blocks only; no new requirement; two hash pins move once each.**
  `orbit-conventions` (the format requirement's VISIBILITY paragraph and scenario; the conclude
  requirement's KNOWN paragraph) and `orbit-orientation` (the bare-status scenario; the explore-chip
  requirement) — four MODIFIED blocks at most; the `orbit-explore` pins (function hash, content hash) move
  once for the body edits; no engine code, no new test beyond the pins.
  Kind: scope

## Open questions

## Considered & out

- **Renaming the "five-section" requirement titles inside this sweep** (2026-10-01, D-rc16-1) — five
  capabilities once the pointer sites and the parity tests' title anchors are counted; over R-crc-1.
  Re-entry trigger: the next change that touches BOTH `orbit-conventions` and
  `orbit-explore-modifications` for another reason carries the rename as a rider (RENAMED blocks in both,
  pointer sites in `orbit-audit-drift`, `orbit-propose-modifications` and `audit-drift.ts`, the
  `ownerText` anchors in the two parity tests), or Q-crc-28 reopens on a reader actually misled by the
  title — none has been.
- **Editing the explore body alone, ahead of the spec** (2026-10-01; declined first at the audit walk the
  same day) — two statements of one rule in two forms until the sweep landed; D-rc16-3 is the rule.

## References

- `orbit/architecture/clean-up-review-cycle.md` — `### Stage rc16-retirement-sweep` (the charter) and
  Q-crc-28 (the ledger; its line numbers are stale, its sentences are not)
- The set, enumerated by sentence on 2026-10-01 at HEAD 84f5d67b:
  - CLASS A — "pending follow-on" prose whose stages have landed (rc13b's maturity signal, rc13c's
    propose consumption, rc15's header read): `orbit/specs/orbit-conventions/spec.md` line 980 (the
    VISIBILITY paragraph's closing clause "the maturity-signal stage surfaces it beside its rung, and the
    propose-consumption follow-on carries it into spec text at promotion"), line 994 (the accounted-as-
    OPEN-DECLARED scenario's parenthetical, same two mechanisms), line 1022 (the KNOWN paragraph: three
    limits "until Q-crc-11's stage reads the header token", "until the maturity-signal stage", "the
    propose-consumption follow-on's to specify" — all three owners shipped); and the explore body's copies
    `src/core/templates/workflows/explore.ts` lines 504 (the same closing clause), 606 ("until the
    maturity-signal stage lands"), 610 (the KNOWN paragraph; "until then, REOPEN before promoting"), 657
    ("until a propose-consumption stage lands, that transfer is an instruction … not a checked mapping")
  - CLASS B — `orbit-orientation` sentences rc15's header read makes false in letter:
    `orbit/specs/orbit-orientation/spec.md` line 44 (the `No live inference` THEN clause's "never
    artifact-content parsing"), lines 94-95 (the chip parenthetical "never from the file (per the
    bare-status requirement's closed data-source scenario)"); `src/core/orientation.ts` line 50 is a code
    comment saying the chip is read from the trail — TRUE of the chip, not in the set
  - CLASS C — the retained "five-section" titles and their pointer sites (Q-rc16-1): conventions 123/148,
    explore-modifications 122/181, audit-drift 148, propose-modifications 185, `audit-drift.ts` 302
- `test/core/templates/orbit-content-fidelity.test.ts` line 204 — the body already carries a NEGATIVE
  marker "no 'five-section' residue"; no fidelity marker pins any Class A sentence, so the body edits
  move only the `getExploreSkillTemplate` / `orbit-explore` hash pins (once)
- `test/helpers/owner-text.ts` — the single-active-owner lookup the Class C rename would have to survive
