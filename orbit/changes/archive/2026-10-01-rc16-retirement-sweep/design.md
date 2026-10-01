# Design: rc16-retirement-sweep

## Context

Living prose in three capabilities and the generated explore skill still describes limits that three
shipped stages retired: `orbit-conventions`' Mechanism-grammar requirement and its concluded-outcome
requirement name "the maturity-signal stage" and "the propose-consumption follow-on" as pending
mechanisms (rc13b and rc13c shipped them) and carry a KNOWN paragraph of three "until …" limits whose
owners all landed (rc15 last); `orbit-orientation`'s closed data-source scenario and its chip sentence
say the composed view never reads artifact content, which rc15's header read made false in letter of
the view (true of the module, false transitively); `src/core/templates/workflows/explore.ts` carries
the body's six paraphrases of the conventions and explore-modifications sentences. Q-crc-28 ledgered the set over three
archives; the exploration (`explore.md`, history by rule) enumerated it by sentence at HEAD f3bfd0e2,
partitioned it into three classes, and Sal ruled class C (the retained "five-section" titles — a
RENAMED block in two capabilities plus pointer sites and parity-test title anchors in three more) OUT.

Constraints: R-crc-1 (three capabilities, measured — at the ceiling, which the charter budgets); R-crc-14 (point at the owner, never restate; a
repaired sentence names a CAPABILITY, never a stage id — the class's origin is prose naming a future
stage); R-crc-9 (class C split out, not exceeded); the exit criteria in the stage charter (grep to
zero; MODIFIED-only; the post-archive audit raises nothing and Q-crc-28 closes on it).

## Goals / Non-Goals

**Goals:**
- Every class A and class B sentence is repaired to its pointer form or deleted, in six MODIFIED
  blocks across three capabilities, and the explore body's copies move in the same tasks (exit 1, exit 2).
- The post-archive project-wide audit raises no Category 3 finding on the set; Q-crc-28 closes (exit 3).

**Non-Goals:**
- Renaming the "five-section" requirement titles (D-rc16-1; Alternatives below).
- Any engine code, any new test, any new requirement (D-rc16-5).
- The two module-level code comments in `src/core/orientation.ts` (lines 22 and 50): both describe
  the ORIENTATION MODULE's own reads and are true — the module parses no artifact content; the file
  read lives in the architecture state scan it consumes.

## Decisions

- **D-rc16-1 — the "five-section" titles are OUT** (Sal, in chat; see `explore.md`). Five capabilities
  once pointer sites and the `ownerText` title anchors count; over R-crc-1; cosmetic. Re-entry trigger
  in Alternatives.
- **D-rc16-2 — repair by POINTER or delete, never restate, never name a stage.** Each repaired sentence
  names the capability and requirement that now owns the behaviour: `orbit-run-summary-emit`'s
  `Named-mode explore recommendation by maturity` (the rung that surfaces a residual; the Concluded
  rung's text), `orbit-orientation`'s `Next-recommendation sourcing is time-shifted, never live` (the
  row's render of the concluded rung — the fifth owner, named since the system blind-pair walk),
  `orbit-propose-modifications`' `Mechanism section consumption` (the transfer into spec text)
  and `Consume mode when staging directory exists` (the Step 0 refuse of a concluded exploration), and
  `orbit-architecture-engine`'s `Computed stage state with completion-as-ratification` (the header
  read). A stage id in living prose is how every member of this class was born, so none survives.
  Alternative rejected: naming the stages that shipped the owners ("rc13b surfaces it") — true today
  and the same class one archive later.
- **D-rc16-3 — the body's copies move WITH their owners, in the same task.** Six (body line, owning
  sentence) pairs; one task per pair edits both sides to the same pointer form. The limit stated at
  exploration stands: no fidelity marker pins these sentences, so the pairing is enforced by the task
  list, not a test (a marker set would be four new assertions on prose that this change deletes or
  reduces — not worth pinning). Alternative rejected at the audit walk: the body alone, ahead of the
  spec.
- **D-rc16-4 — enumerate by sentence** (`Kind: fact`). Q-crc-28's line numbers drifted; the task list
  quotes the sentences. AMENDED TWICE: at propose, the exploration's phrase grep (`Closure: SOURCED` over
  six phrases) missed one variant — "the surface reads no file content" (`orbit-orientation` line 128,
  B3); at the fresh proposal walk (iter 1, CRITICAL), an UNANCHORED `maturity-signal` grep found three
  more — `orbit-conventions` line 923 ("maturity-signal successor", a fifth block),
  `orbit-explore-modifications` line 227 ("the maturity-signal stage parses the same exemplars", a third
  capability), and their body copies at `explore.ts` 472 and 534 (A4, A5). The source the set now
  derives from is the WIDENED grep (the Mechanism record below), not the exploration's; `explore.md`
  keeps its entry as superseded history.
- **D-rc16-5 — MODIFIED only; three capabilities; two pins once.** Six MODIFIED blocks; the
  `getExploreSkillTemplate` function hash and the `orbit-explore` generated-content hash re-recorded
  once, in the task that edits the body, with a dated reason.

## The repairs (the task list's source of truth)

| site (HEAD f3bfd0e2) | sentence now | repair |
|---|---|---|
| A1 `orbit-conventions` `Mechanism entry grammar and accounted closure`, the VISIBILITY paragraph | "…the MECHANISMS that move it are named elsewhere: the maturity-signal stage surfaces it beside its rung, and the propose-consumption follow-on carries it into spec text at promotion." | "…the MECHANISMS that move it are OWNED elsewhere: `orbit-run-summary-emit`'s `Named-mode explore recommendation by maturity` surfaces it beside its rung, and `orbit-propose-modifications`' `Mechanism section consumption` carries it into spec text at promotion." |
| A2 same requirement, scenario "An entry declares an open domain honestly" | "(the maturity-signal stage's rung surfaces it; the propose-consumption follow-on carries it into spec text)" | "(the maturity rung surfaces it, per `orbit-run-summary-emit`'s `Named-mode explore recommendation by maturity`; propose carries it into spec text, per `orbit-propose-modifications`' `Mechanism section consumption`)" |
| A3 `orbit-conventions` `Concluded exploration outcome`, the KNOWN paragraph | three limits, each "until …" | the delta's paragraph VERBATIM (the delta is canonical; this row quotes it): "**Owned, since shipped**: the stage-state reader reads the header token from the staging directory the kept citation locates and observes a stage cited only by a concluded exploration as `concluded` (`orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`); the orientation row's next line renders the concluded rung from the trail's terminal emit (`orbit-orientation`'s `Next-recommendation sourcing is time-shifted, never live`); and `/orbit:propose <name>` refuses a concluded exploration, naming its `Re-entry:` slot (`orbit-propose-modifications`' `Consume mode when staging directory exists`). None of the three is a limit of concluding; each is named here so a reader of the conclude flow knows who owns the behaviour the conclusion depends on." |
| A4 `orbit-conventions` `Decision entry identity and classification`, the `Kind:` bullet (found at the fresh proposal walk) | "the stated residual, owned by `orbit-explore-modifications`' maturity-signal successor." | "the stated residual, per `Mechanism entry grammar and accounted closure` (R-crc-10)." (an INTERNAL pointer — the grammar requirement is the one sentence in any spec that states this limit; corrected at the in-context walk from a pointer at the maturity requirement, which does not; TRIMMED to the bare pointer at the system blind-pair walk, 2026-10-01 — the fresh SUGGESTION and the external CRITICAL converged on the restatement beside the pointer, the R-crc-14 shape) |
| A5 `orbit-explore-modifications` `Nine moves applied per rule in the Mechanism section`, scenario "The exemplar conforms" (found at the fresh proposal walk) | "…and the maturity-signal stage parses the same exemplars as fixtures" | "…and the engine's form parse accepts the same entries under the grammar `orbit-emit-composition`'s `The explore grammar has one source in code` carries" (the requirement owns the grammar's single source, not a fixture parse — that is a test fact, `test/core/parsers/explore-rules.test.ts`; corrected at the in-context walk) |
| A1' `explore.ts` line 504 | the body's copy of A1 | A1's pointer form (with the body's "(see "Composition with /orbit:propose")" kept) |
| A3' `explore.ts` line 606 | "until the maturity-signal stage lands — so the LAST record on a concluded trail carries a count-derived recommendation" | the clause is DELETED; the sentence ends "its `next_recommended` is the Concluded rung's prose (`orbit-run-summary-emit`'s `Named-mode explore recommendation by maturity`)" — exactly task 1.2's text |
| A4' `explore.ts` line 472 | the body's copy of A4 ("owned by the maturity-signal stage") | A4's pointer form (task 1.5) |
| A5' `explore.ts` line 534 | the body's copy of A5 ("the maturity-signal stage parses the same entries as fixtures") | A5's pointer form (task 1.6) |
| A3'' `explore.ts` line 610 | the body's KNOWN paragraph | the delta's paragraph VERBATIM, backtick-escaped (task 1.3) — byte-equal after unescaping; the closing sentence's referent ("this requirement") was re-voiced ONCE in the delta at the system blind-pair walk so it is true on both surfaces (fresh W2, Sal: C, 2026-10-01), and the middle pointer moved to the row's render-rule owner the same day (fresh W1) |
| A1'' `explore.ts` line 657 | "until a propose-consumption stage lands, that transfer is an instruction the proposing AI follows from the authoritative file, not a checked mapping. A concluded exploration is REOPENED before it is promoted" | "that transfer is `orbit-propose-modifications`' `Mechanism section consumption` (Step 0c.6 of the propose body). A concluded exploration is REFUSED at propose and REOPENED here first" |
| B1 `orbit-orientation` `Bare orbit status renders the current sprint`, scenario "No live inference beyond engine and trail" | "…and `.orbit-runs/` emit files — never artifact-content parsing; and the surface is READ-ONLY" | "…and `.orbit-runs/` emit files — orientation itself parses no artifact content; the stage-state source it consumes reads the concluded header of citing staging directories, per `orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`; and the surface is READ-ONLY" |
| B2 `orbit-orientation` `Sprint strip composition`, the chip sentence | "The concluded glyph is read from the TRAIL, never from the file (per the bare-status requirement's closed data-source scenario), so…" | "The ROW's chip is read from the trail, so…" |
| B3 same requirement, scenario "Hand-flipped header without an emit lags like next" (found at propose) | "— the surface reads no file content" | "— the row reads no file content; under `--full`, the PROGRAM band beside it may already render the cited stage `ended-from-explore`, because stage state reads the header (`orbit-architecture-engine`'s `Computed stage state with completion-as-ratification`)" |

## Mechanism → artifacts

Source: the proposing AI's reading of the file; no engine record. Two Mechanism entries under two live
rules, both conforming in full (heading ID owned; Domain table with member rows; `Closure: SOURCED`
with a justification; no residual slots; nine move lines); two `Kind: scope` owners and one
`Kind: fact` owner with no entry (permitted history, row 2). No key defects. Two accounted, none open.
ONE CORRECTION the record must carry: D-rc16-2's `Closure: SOURCED` named a source — the exploration's
grep over six phrases on HEAD 84f5d67b — that was wrong by four members (B3 at propose; A4, A5 and
their body copies at the fresh proposal pass). A SOURCED entry is accounted BY its source sentence;
when the source is replaced, the record names the ACT that produced the replacement. Two acts did:
the fresh proposal pass (review-proposal-2026-10-01T17-31-53Z) ran fourteen paraphrase patterns plus an
unanchored `maturity-signal` over `git ls-files` minus archives, trails and this change (20 + 1 hits)
and found the three sites the walk then repaired; the in-context pass (review-proposal-2026-10-01T17-44-36Z)
re-ran the same grep on HEAD f3bfd0e2 plus the working tree — 30 hit lines, partitioned: 14 IN the set
(spec: `orbit-conventions` 923/980/994/1022, `orbit-explore-modifications` 227, `orbit-orientation`
44/94/128; body: `explore.ts` 472/504/534/606/610/657 — the fourteen rows of the repair table) and 16
OUT (Q-crc-28 1186-1208 and the charter 2476-2478 as records; rc13a's own stage section 1482/1487 and
the rc13b narrative line CLAUDE.md:309 as history naming a stage, not a limit; `orbit-conventions` 720
and `orbit-engine-gates` 922 unrelated "until … lands"; `orientation.ts` 22/50 module-true). The walk
edited the text and ran no grep (its first record said otherwise — corrected at the in-context walk).
The exploration's entry is superseded history by rule (its file travels unchanged); the in-context
pass's run is the live closure, and exit (1)'s grep at archive is the next measurement of the same set.

SECOND CORRECTION (the system blind-pair walk, 2026-10-01; external W2): neither pass WROTE its pattern set
down — the fresh proposal emit's commentary describes the widening and lists no patterns, the in-context
emit records a count — so the "fourteen patterns" above are a count a reader must trust, not a query they
can re-run. The live closure is therefore THIS command, executed at that walk on the apply tree plus the
walk's own edits, and re-run at archive for exit (1):

```
git ls-files -z | grep -zvE '^orbit/changes/archive/|/\.orbit-runs/|^orbit/changes/rc16-retirement-sweep/' \
  | xargs -0 grep -nE 'maturity-signal|propose-consumption|until .* lands|keys on location|never from the file|artifact-content parsing|reads no file'
```

(The seven alternations task 1.7 records, plus an UNANCHORED `maturity-signal`; the domain is every
tracked file minus archives, every trail directory and this change's own directory.) Result: **24 lines —
8 IN** (the baseline sites the sync retires: `orbit-conventions` 923/980/994/1022,
`orbit-explore-modifications` 227, `orbit-orientation` 44/94/128; the six body sites read 0, repaired)
and **16 OUT** (`clean-up-review-cycle.md` 1186/1190/1205/1208 — Q-crc-28's record — and 2476–2478 —
this charter; 1482/1487 — rc13a's charter section and rc13b's heading, history naming a stage;
`CLAUDE.md` 309 — the rc13b narrative; `orbit-conventions` 720 and `orbit-engine-gates` 922 —
unrelated "until … lands"; `orientation.ts` 22/50 — module-true, named out; and
`skill-templates-parity.test.ts` 64/65 — the apply's dated note quoting the retired phrases as a
record). The IN set is exactly the eight sentences the deltas replace; nothing OUT is a living limit.

| entry | token | owner | destination |
|---|---|---|---|
| D-rc16-2 | SOURCED | live rule | the six MODIFIED requirement texts themselves — the domain table IS the repair list, carried as the SENTENCE shape (each repaired sentence names its owner); source: the WIDENED grep named above (the exploration's six-phrase grep superseded — one row found at propose, three at the walk) |
| D-rc16-3 | SOURCED | live rule | `tasks.md` — one task per (body line, owning sentence) pair, six pairs; the body is template prose, so its edits ride the owners' tasks rather than a spec text of their own |
| D-rc16-1 | — | `Kind: scope` | not carried; Alternatives below |
| D-rc16-4 | — | `Kind: fact` | not carried; its claim is the task list's quoting rule, amended above |
| D-rc16-5 | — | `Kind: scope` | not carried; its claims are exit (2)'s measure (task 3.1) and task 2.1's pin rule |

## Alternatives considered

- **Renaming the "five-section" titles in this change** (D-rc16-1; `explore.md` Considered & out):
  RENAMED blocks in `orbit-conventions` and `orbit-explore-modifications`, pointer edits in
  `orbit-audit-drift` (line 148), `orbit-propose-modifications` (line 185) and `audit-drift.ts`
  (line 302), and the `ownerText` anchors in two parity tests — five capabilities. Re-entry trigger:
  the next change touching both conventions and explore-modifications for another reason carries the
  rename as a rider; or Q-crc-28 reopens on a reader actually misled by a title.
- **Editing the explore body alone** (declined at the audit walk): two statements of one rule in two
  forms until the sweep landed.
- **Naming the shipped stages in the repaired sentences**: the same class one archive later.

## Risks / Trade-offs

- [The pairing in D-rc16-3 is enforced by the task list, not a test] → each pair is ONE task naming
  both sides; the whole-change range (`f3bfd0e2^..` the apply commit) shows the two spec deltas (landed at
  propose) and `explore.ts` (landed at apply) travelling in ONE change — the apply emit's `files_touched`
  carries `explore.ts`, `tasks.md` and two tests, not the deltas, and names
  `orbit-generated-surface.test.ts` as the actual-unpredicted instrument correction (external S1,
  2026-10-01, corrected from a claim that the emit showed the deltas); the regenerated skill is read once
  as a user would (task 2.2).
- [A paraphrase the widened grep still missed] → the post-archive audit is exit (3)'s instrument and
  reads the sentences, not this list; a survivor is a Category 3 finding, named by the audit, and
  Q-crc-28 stays open until it is gone. D-rc16-4's amendment is the precedent: one was found at propose.
- [The `orbit-conventions` grammar requirement is 5.9 KB and the Decision-entry requirement 4.9 KB; this change touches two clauses of one and one bullet of the other] →
  the MODIFIED block is carried whole, as the sync requires; the fingerprint pins the base; the
  review's byte-diff against baseline is the check that nothing else moved.
- [Two pins move] → `getExploreSkillTemplate` and `orbit-explore`, re-recorded ONCE in task 2.1 with a
  dated reason.
- [Size] → THREE capabilities (at the ceiling), six MODIFIED blocks (~26 KB carried, ~1.5 KB changed),
  five decisions, two live rules; twelve tasks, one an at-archive note.

## Touchpoints

- `orbit/specs/orbit-conventions/spec.md` — synced at archive (A1, A2, A3, A4).
- `orbit/specs/orbit-explore-modifications/spec.md` — synced at archive (A5).
- `orbit/specs/orbit-orientation/spec.md` — synced at archive (B1, B2, B3).
- `src/core/templates/workflows/explore.ts` — the six body copies (A1', A3', A3'', A1'', A4', A5').
- `test/core/templates/skill-templates-parity.test.ts` — the two `orbit-explore` pins, once.
