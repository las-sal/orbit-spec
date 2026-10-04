> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc06-scenario-test-map

## Premise

rc06's charter (`orbit/architecture/clean-up-review-cycle.md`, Stage rc06): every delta scenario names
the test that exercises it, in a grammar `orbit validate` checks; verify reports the scenario → test map
mechanically (covered / uncovered / test missing); the first review reads the map instead of rebuilding
it by prose. rc06 is the map's ONLY owner. Goal G2 — every claim a machine can verify leaves the
reviewer's budget.

Measured 2026-10-04, before any decision:

- **Scale.** 1090 scenarios across 245 requirements in the 21 baseline capabilities; recent changes
  carry 25–101 delta scenarios each (rc02b 101, rc03c 70, rc04b 63, rc07b 34). The suite has 111 test
  files and ~2877 `it(`/`test(` cases.
- **Today's link is tasks.md prose, at REQUIREMENT grain, naming test FILES.** rc07b's tasks read "add
  the four scenarios of `Audit-drift counts are engine-computed`" in `test/core/emit-composition.test.ts`.
  Tests do not quote scenario titles: 1 of rc07b's 34 delta scenario titles appears verbatim anywhere
  under `test/`.
- **Verify never runs standalone.** Zero `verify-*.json` emits on every archived trail. System review
  runs verify-change as Pass 0 (rc07b's system emit: `passes_run` includes `0`), and Pass 0 writes no
  verify emit. Verify's scenario check is prose: "Check if tests exist covering the scenario … Add
  WARNING: Scenario not covered".
- **Not every scenario is machine-exercisable.** Engine scenarios (e.g. `orbit-engine-gates`' "A walk
  between the pair breaks blindness") are behaviour a test runs. Body scenarios (e.g. `orbit-review`'s
  "System mode `--parallel`": passes run concurrently in subagents) describe what an AI does; a test can
  at most show the generated body CARRIES the instruction. The body-heavy capabilities (review 80,
  address-reviews 81, propose 66, archive 65, explore 37, review-external 31, onboard 23, architect 15)
  hold roughly 400 of the 1090.
- **No baseline capability owns verify-change.** `orbit-verify-change` is upstream's body with no orbit
  spec; the charter's "Touches: orbit-verify-change" names a capability that does not exist.

## Mechanism

### D-rc06-1 — coverage is declared on the TEST side, keyed by the scenario's title triple
Domain: every line a `@scenario` tag can be followed by in a scanned test file (`test/**/*.test.ts`, vitest's include)
| member | covered by |
|---|---|
| `it(` / `test(` | attaches to that call |
| `it.each(` / `test.each(` | attaches; one tag covers every row |
| `it.skipIf(` / `test.skipIf(` | attaches — the test runs where the condition is false |
| `it.only(` / `test.only(` | attaches |
| `it.skip(` / `test.skip(` / `it.todo(` / `test.todo(` | REFUSED, naming the tag's line — a test that never runs covers nothing |
| another `@scenario` tag | stacks: every tag in the run attaches to the same next call |
| a blank line or a non-tag `//` comment | skipped while looking for the call |
| `describe(` / `describe.each(` | REFUSED, naming the tag's line — a tag names a test, never a group |
| any other line, or EOF | REFUSED, naming the tag's line — no silent member |
| a tag-shaped line inside a fixture string | matched like any line, so it attaches or is refused VISIBLY (Case 3) |
| a file outside `test/**/*.test.ts` | not scanned — it is not a test vitest runs |
Closure: DERIVED — the call forms are listed and every other next line is refused by name, so no line passes unclassified
Moves:
- READ: applied — vitest's include is `test/**/*.test.ts` (`vitest.config.ts`); the suite's skip forms are `.skipIf` only today, nine sites, all platform guards (Case 2)
- ENUMERATE: applied — this table; the refusal row makes the set closed by construction rather than by recall
- COHERE: applied — the key is the same title triple D-rc06-2's ledger and D-rc06-4's check use, so one resolution serves all three
- EXECUTE: not applied — no parser exists; the triple's uniqueness was executed over all 1090 baseline scenarios (Case 1)
- FALSIFY: applied — a tag proves a test NAMES the scenario, not that it ASSERTS it; that is why the tag carries a kind (`behaviour` / `text`) and D-rc06-2 never sums the kinds
- CONFORM: applied — R-crc-10 (the engine observes both ends of the link; whether the test really exercises the scenario stays a reader's judgement, recorded by the kind word); R-crc-14 (the grammar is stated once, in the spec that owns it)
- FEASIBILITY: applied — a line scan of 111 files; no TypeScript parse
- CONSUME: applied — D-rc06-3's surface resolves each tag's key against the spec index; an unresolved key renders ORPHAN
- INVOKE: applied — runs whenever D-rc06-3's surface is read, which `orbit validate <change>` does (D-rc06-4)

### D-rc06-2 — a CLOSED set of cover kinds, rendered separately and never summed
Domain: every state a scenario can be in with respect to the map
| member | covered by |
|---|---|
| one or more `behaviour` tags | behaviour column, naming each test file and line |
| one or more `text` tags | text column — the generated body or artifact carries the instruction; says nothing about whether an AI follows it |
| a ledger entry `kind: observed` | observed column, naming the record it cites (a trail file or an archived task line) |
| a ledger entry `kind: untestable` | untestable column, carrying its `why` |
| several of the above | every kind it has is shown; no precedence, no single verdict |
| none of the above | UNCOVERED — the one state D-rc06-4 fails on |
| a tag or ledger key resolving to no scenario | ORPHAN, reported against the tag or entry, never against a scenario |
| a malformed tag or ledger entry | MALFORMED, naming the line |
Closure: DERIVED — the states are the product of the two declaration sources (tags by kind, ledger by kind) plus their two failure forms
Moves:
- READ: applied — the four kinds come from the measured split: engine scenarios a test runs, ~400 body scenarios no test can run (Premise)
- ENUMERATE: applied — this table
- COHERE: applied — `text` and `untestable` are disjoint claims: text says the body carries the instruction, untestable says nothing mechanical can bear on it; a scenario may honestly carry both
- EXECUTE: not applied — no map exists yet
- FALSIFY: applied — a summed "covered" figure would count a grep for an instruction as evidence the AI follows it, the carried-never-inferred failure rc07 recorded; separate columns keep each claim at its real strength
- CONFORM: applied — R-crc-10 (the kind is the author's RECORD, not the engine's check); R-crc-11(h) (a count is shown, never a ratio)
- FEASIBILITY: applied — one ledger file plus the tag scan
- CONSUME: applied — verify and system Pass 0 read the columns (D-rc06-3); rc10's pre-archive condition can read `observed` as its user-validation evidence
- INVOKE: applied — same trigger as D-rc06-1

### D-rc06-3 — the map is ENGINE-COMPUTED by one read surface; nothing records it
Domain: every consumer of the map the program names
| member | covered by |
|---|---|
| `orbit validate <change>` | reads the surface for D-rc06-4's check |
| verify-change's Scenario Coverage step | reads the surface instead of tracing by prose |
| system review Pass 0 | runs verify-change, so reads it through verify (exit (3)) |
| rc10's apply emit ("points at the latest verify emit") | rc10's charter names a record that will never exist; rc10's exploration re-points it at the surface |
Closure: SOURCED — the consumers named in rc06's and rc10's charters and in the verify-change body's Scenario Coverage step
Moves:
- READ: applied — zero `verify-*.json` on every archived trail; rc07b's system emit records `passes_run` including `0` and no verify emit (Premise)
- ENUMERATE: applied — this table, from the two charters and the body
- COHERE: applied — "rc06 is the map's ONLY owner" holds more strongly when no emit carries a copy at all
- EXECUTE: not applied — no surface exists
- FALSIFY: applied — a map stored in an emit goes stale the moment a test is edited; computing it at read time leaves nothing to drift
- CONFORM: applied — engine computes, body reads (the D-arc thesis); R-crc-14 (one statement, every consumer points)
- FEASIBILITY: applied — reads 21 specs, active deltas and 111 test files per call
- CONSUME: applied — a JSON form for bodies and a human render; the command name is D-rc06-8; rc10's charter wording is carried to rc10, not edited here
- INVOKE: applied — called by validate and by the verify body; never by a hook

### D-rc06-4 — a declaration is owed by every scenario in the change's delta blocks
Domain: the delta operations a change can carry
| member | covered by |
|---|---|
| ADDED | every scenario in the block owes a declaration |
| MODIFIED | every scenario in the block owes one, unchanged scenarios included — the block replaces the whole requirement |
| RENAMED | every baseline scenario under the OLD title owes one under the NEW key; tags on the old key render ORPHAN |
| REMOVED | owes nothing; tags on its scenarios render ORPHAN after archive |
| a baseline scenario outside every delta block | reported in the map, never failing |
Closure: SOURCED — `DeltaOperationType` in `src/core/schemas/change.schema.ts` is `ADDED`, `MODIFIED`, `REMOVED`, `RENAMED`
Moves:
- READ: applied — the enum read in `change.schema.ts`; RENAMED appears in 12 archived delta lines
- ENUMERATE: applied — this table, one row per enum member plus the outside-delta row
- COHERE: applied — keys resolve against the post-merge view (baseline with the change's deltas applied), the same view D-rc06-1's orphan check uses
- EXECUTE: not applied — no check exists
- FALSIFY: applied — failing only on ADDED would let a MODIFIED requirement's rewritten scenarios through untagged, and MODIFIED is the common case on this program's record
- CONFORM: applied — R-crc-1 (legacy scenarios are never a migration this stage owes)
- FEASIBILITY: applied — at most 101 delta scenarios per change on the record
- CONSUME: applied — `orbit validate <change>` fails naming each UNCOVERED key (exit (1))
- INVOKE: applied — `orbit validate <change>` already runs at propose, apply and archive

### Case 1 — the title triple is a unique key
Measured 2026-10-04 over all 21 baseline specs: 1090 scenarios, 0 duplicate requirement titles within a capability, 0 duplicate scenario titles within a requirement. Separator candidates in titles: `::` 0, `|` 0, `/` 65, `>` 7, `#` 1 — `::` is the separator.

### Case 2 — skip forms in the suite today
`grep -rn '\.skip(\|\.todo(\|\.skipIf(' test`: nine hits, all `it.skipIf(process.platform === 'win32')`.

### Case 3 — a tag inside a fixture string
Test files embed markdown and code as fixtures, so a `// @scenario` line can sit inside a template literal. The scan does not parse TypeScript; such a line is classified by D-rc06-1's next-line table like any other — it attaches if a call follows, else it is refused by name. Never silent; possibly a false attachment, which the reader of the map sees named with file and line.

## Decisions

- **2026-10-04 — D-rc06-1: coverage is declared on the TEST side, keyed by the scenario's title triple** (Sal: go with the leaning, Q-rc06-1 (b)).
  A line comment `// @scenario <kind> <capability> :: <requirement title> :: <scenario title>`, `<kind>`
  `behaviour` or `text`, titles verbatim as their headings (trimmed), attaches to the next test call per
  the Mechanism table; the engine computes the map by resolving every tag against the specs. Specs carry
  no test ids. Revises the charter's "names the test id" at propose (R-crc-12).
  Kind: rule
- **2026-10-04 — D-rc06-2: a CLOSED set of cover kinds, rendered separately and never summed** (Sal: Q-rc06-2).
  `behaviour` and `text` come from tags; `observed` (citing a record) and `untestable` (with a why) come
  from ONE ledger file keyed by the same triple — its path is D-rc06-9. Only a scenario with no
  declaration is UNCOVERED.
  Kind: rule
- **2026-10-04 — D-rc06-3: the map is ENGINE-COMPUTED by one read surface; nothing records it** (Sal: Q-rc06-3).
  verify-change and system Pass 0 read it; no emit stores it. Exit (2) is revised to name the surface
  (R-crc-12's first case — the mechanism retires "verify-change's emit carries the map").
  Kind: rule
- **2026-10-04 — D-rc06-4: a declaration is owed by every scenario in the change's delta blocks** (Sal: Q-rc06-4).
  ADDED and MODIFIED blocks in full; RENAMED re-keys the old title's baseline scenarios; REMOVED owes
  nothing; baseline scenarios outside the delta are reported, never failing.
  Kind: rule
- **2026-10-04 — D-rc06-5: the scenario title triple is unique across every baseline capability** — 1090 scenarios, zero collisions; `::` occurs in no title (Case 1).
  Kind: fact
- **2026-10-04 — D-rc06-6: rc06 SPLITS into rc06a and rc06b** (Sal: agree, Q-rc06-5; R-crc-9's fifth preventive application, caught at exploration).
  rc06a-scenario-map: the tag and ledger grammar, the engine-computed map and its read surface, and the
  `orbit validate <change>` check — exits (1) and (2, revised per D-rc06-3). rc06b-map-readers: the
  verify-change body's Scenario Coverage step and system Pass 0 read the surface — exit (3). rc06b
  depends on rc06a; rc10's dependency on rc06 moves to rc06a (the map is what it reads). The reason is a
  NEW capability owning the map, which with the readers' capabilities passes R-crc-1's ceiling of three.
  Both children re-measure capabilities, requirements and tasks at their own propose. The split is
  declared in the program doc by an architect session, not by this file.
  Kind: scope
- **2026-10-04 — D-rc06-7: no backfill of the baseline's scenarios** (Sal: agree, Q-rc06-8).
  Coverage grows only as changes touch requirements (D-rc06-4); the map reports the baseline's
  undeclared count so the residue stays visible.
  Kind: scope
- **2026-10-04 — D-rc06-8: the read surface is `orbit status --change <name> --scenarios` (with `--json`)** *(settled under R-crc-3; Sal: settle)*.
  It sits beside `--report`, keeping the status family the one read verb.
  Kind: scope
- **2026-10-04 — D-rc06-9: the ledger is `orbit/scenario-ledger.yaml`** *(settled under R-crc-3; Sal: settle)*.
  It is a judgement RECORD about specs, not test code, so it sits beside `orbit/specs/`; entries keyed by
  D-rc06-1's triple carry `kind: observed` with `record:` or `kind: untestable` with `why:`.
  Kind: scope

## Open questions

## Considered & out

- **2026-10-04 — the spec scenario names its test id (Q-rc06-1 (a), the charter's wording).** Ids sync
  into baselines, couple specs to test layout, and force re-tagging every unchanged scenario of each
  MODIFIED requirement.
- **2026-10-04 — a per-change sidecar map (Q-rc06-1 (c)).** Dies at archive; the next change touching
  the requirement starts from nothing.
- **2026-10-04 — one summed "covered" figure.** Counts presence of an instruction as evidence of
  behaviour (D-rc06-2's FALSIFY).
- **2026-10-04 — the map carried in verify-change's emit (the charter's exit (2)).** No verify emit has
  ever been written; a stored map drifts with every test edit (D-rc06-3).

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc06 charter; rc10 depends on it; R-crc-1,
  R-crc-10, R-crc-12.
- `.claude/skills/orbit-verify-change/SKILL.md` — today's prose scenario-coverage check (Step "Scenario
  Coverage").
- `orbit/changes/archive/2026-10-04-rc07b-reference-roundtrip/tasks.md` — the current requirement-grain,
  file-naming link in task prose.
- `src/core/parsers/markdown-parser.ts` (`parseScenarios`) and `src/core/parsers/requirement-blocks.ts` —
  the existing scenario/requirement parsers.
