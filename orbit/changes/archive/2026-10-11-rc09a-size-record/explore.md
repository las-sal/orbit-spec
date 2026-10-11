> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc09a-size-record

## Premise
The charter (clean-up-review-cycle.md, Stage rc09-propose-hygiene) gives propose two gates of its own: a SIZE CHECK
against R-crc-1 (capabilities, requirements, bytes, tasks) that names a split when exceeded, and a SPIKE PRECONDITION
(a disposable prototype has run the outward path, cited in design.md, before spec prose) — generalized by R-crc-7 to
any change whose deliverable is a decision procedure. It also owns the size-proximity computation R-crc-4's
near-ceiling proposal pair depends on, and carries R-crc-10's INPUTS-NAMED question as a record. The charter predates
most of the program (written 2026-09-11); this exploration measures what of it still stands after rc01, rc05/rc05b,
rc13a–c and rc17a, before anything is proposed.
Opened as `rc09-propose-hygiene`; renamed at the split (D-rc09-13, 2026-10-10). The directory continues as rc09a's;
D-rc09-12 and its Mechanism entry are assigned to rc09b-tool-inventory as its starting record.

## Mechanism

### D-rc09-3 — changed bytes count the NEW side: ADDED blocks whole, MODIFIED blocks by their added lines
Domain: every construct a delta spec carries, per `parseDeltaSpec`'s `DeltaPlan` plus the text outside its blocks
| member | covered by |
|---|---|
| an ADDED block | its full bytes |
| a MODIFIED block matched by name to a baseline requirement | the bytes of its lines absent from the baseline block, as a MULTISET of lines (D-rc09-14) |
| a MODIFIED block whose name matches no baseline requirement | its full bytes (new text by definition; the sync's own error is not this rule's) |
| a MODIFIED block under a RENAMED entry's new name | diffed against the OLD name's baseline block |
| a REMOVED entry | zero bytes; counted in requirements touched |
| a RENAMED entry alone | zero bytes; counted in requirements touched |
| deleted lines of a MODIFIED block (the `-` side) | not counted — retirements are the stages the 2026-09-23 clarification exists to stop the ceiling firing on |
| fenced content inside a block | part of the block's bytes; the parser's fence mask keeps a fenced header from splitting the block |
| text outside requirement blocks (section headings, preamble) | not counted — no requirement content |
| the baseline a live change diffs against | the current `orbit/specs/` file; a baseline that moved since propose is `base_fingerprints`' business, not size's |
Closure: SOURCED — the four section kinds of the delta format's `DeltaPlan`, plus the non-block remainder
Moves:
- READ: applied — `parseDeltaSpec` and `extractRequirementsSection` (`src/core/parsers/requirement-blocks.ts`) read; R-crc-1's 2026-09-23 clarification read in the program doc
- ENUMERATE: applied — this table
- COHERE: applied — counting removed lines would make the byte figure fire on deletion-heavy retirements, which the clarification rules out; new-side alone is consistent with it
- EXECUTE: applied — Case 1: 37 archived changes, zero unmatched MODIFIED blocks; rc04c reads 14.1K new-side against the clarification's own estimate of ~14K (57K carried less ~43K carriage)
- FALSIFY: applied — a change that rewrites a block by deleting most of it and adding one line reads small; that is the intent (review cost tracks new text), and the deletion still counts as a touched requirement
- CONFORM: applied — R-crc-1 and its clarification; R-crc-10 (every input an artifact the engine owns); R-crc-11(h) (the figure is recorded, never a target)
- FEASIBILITY: applied — a multiset of lines needs no diff dependency and is linear in the block (Case 4)
- CONSUME: not applied — the consumer (validate, status, the propose body) is undecided
- INVOKE: not applied — the trigger is undecided

### D-rc09-4 — size is reported; only an undeclared breach fails, under `--strict`
Domain: the configuration state × each dimension's figure against its maximum × the declaration's state, per change
| member | covered by |
|---|---|
| `size_ceiling` absent, or present and inert (warned, treated as absent) | no size issue from validate; status JSON still carries the figures |
| a dimension absent from `size_ceiling` | that dimension is not compared |
| every configured figure at or under its maximum | no issue |
| a figure over its maximum, named by a well-formed `## Size` item | INFO: dimension, figure, maximum, "declared" |
| a figure over its maximum, not named | WARNING: dimension, figure, maximum, "undeclared" — fails `--strict` |
| a well-formed `## Size` item naming a dimension at or under its maximum | INFO: the declaration is stale (the change shrank or the declaration overreached) |
| a `## Size` item naming an unknown dimension, or with an empty reason | WARNING naming the line: malformed, and it declares nothing |
| two items naming one dimension | the first declares; the second is a WARNING naming its line |
| `proposal.md` absent, or carrying no `## Size` section | nothing is declared; every breach is undeclared |
| no `specs/` directory, or a capability directory with no `spec.md` | that capability is not counted; requirements and bytes read zero from it |
| no `tasks.md` | tasks read zero |
Closure: DERIVED — three independent axes (configuration, comparison, declaration), each enumerated by its own states
Moves:
- READ: applied — the validator's strict rule (`createReport`, `src/core/validation/validator.ts`: strict fails on any WARNING); `resolveReviewPreference` as the read-alone config pattern; the Touchpoints parser as the proposal-section precedent
- ENUMERATE: applied — this table
- COHERE: applied — INFO for a declared breach and WARNING for an undeclared one make `--strict` the only failing path, which is D-rc09-4's claim; a malformed item declaring nothing keeps the WARNING on the breach it failed to declare
- EXECUTE: not applied — no `## Size` section exists yet; every archived breach (Case 1) would read undeclared today, and archived changes are not what validate reads
- FALSIFY: applied — a change that grows after review (a capability added at a walk) gains an undeclared breach and fails `--strict` again; that is the intent, since growing past the ceiling unannounced is what R-crc-1 is for
- CONFORM: applied — R-crc-1, R-crc-9 (declare the breach), R-crc-10 (the engine reads presence, never the reason), R-crc-13 (it reports)
- FEASIBILITY: applied — four figures from parsers that already run on validate
- CONSUME: applied — validate's report; the propose body reads it after generation (D-rc09-6)
- INVOKE: applied — the propose body validates after generation; `orbit validate` on the user's word; whatever else already runs validate

### D-rc09-5 — the ceiling is an opt-in `size_ceiling:` map
Domain: every shape the `size_ceiling` key can take in `orbit/config.yaml`
| member | covered by |
|---|---|
| key absent, or no config file | off, silently |
| an unparseable config file | off, silently (the review_preference pattern) |
| a non-map value | warns once, ignored whole |
| a map entry naming no dimension | warns naming the key, ignored |
| an entry whose value is not a positive integer | warns naming the dimension and value, that dimension ignored |
| a map with zero valid entries | on, comparing nothing |
| a valid entry | that dimension compared, breach = figure strictly greater |
Closure: DERIVED — YAML value kinds × the four-key set × the value rule
Moves:
- READ: applied — `resolveReviewPreference` (`src/core/project-config.ts`), whose shapes this table follows
- ENUMERATE: applied — this table
- COHERE: applied — "absent dimension not compared" and "zero valid entries compares nothing" are one rule
- EXECUTE: not applied — no reader yet
- FALSIFY: applied — R-crc-1's "~" figures become exact maxima; the approximation is the program's, and its exact reading is now written in config where it can be changed
- CONFORM: applied — R-crc-1 (the figures), R-crc-10 (config is an artifact the engine owns)
- FEASIBILITY: not applied — four integers
- CONSUME: applied — D-rc09-4's comparison
- INVOKE: applied — read once per validate and status run

### D-rc09-7 — the declaration is a `## Size` section in `proposal.md`
Domain: every line kind that can sit under a `## Size` heading, read fence-aware
| member | covered by |
|---|---|
| a list item `- <dimension>: <reason>` with a known dimension and a non-empty reason | declares that dimension |
| a list item with an unknown dimension, no colon, or an empty reason | malformed: a WARNING naming the line (D-rc09-4) |
| a second item for an already-declared dimension | a WARNING naming the line; the first declares |
| a continuation line or nested bullet under an item | part of that item's reason, never read |
| prose that is not a list item | not read |
| fenced content | not read — the engine's shared CommonMark fence tracker (`markdown-fence.ts`) |
| a second `## Size` heading | merges with the first, with a note (the explore collector's repeated-section rule) |
| the section ends | at the next heading of level 1–2, or EOF |
Closure: DERIVED — the CommonMark block kinds a section can hold, one row each
Moves:
- READ: applied — `parsers/touchpoints.ts` (the list-item precedent); rc13b's collector rule for a repeated `##` section, recorded in CLAUDE.md
- ENUMERATE: applied — this table
- COHERE: applied — the malformed and duplicate rows feed D-rc09-4's WARNING rows; the dimension vocabulary is D-rc09-5's key set, one list
- EXECUTE: not applied — no section exists yet
- FALSIFY: applied — an item for a dimension the change is not over is legal and reads stale (INFO), so declaring early never fails
- CONFORM: applied — R-crc-14: the grammar is stated once in the owning spec at propose; the propose body interpolates or mirrors it
- FEASIBILITY: not applied — a line scan
- CONSUME: applied — D-rc09-4's declaration state
- INVOKE: applied — read wherever D-rc09-4 runs

### D-rc09-12 — a command head no contract, utility list or placeholder list names fails the suite
Domain: every word that can head a segment of a tokenized shell-fence line on the generated surface
| member | covered by |
|---|---|
| a tool with a recorded contract (`orbit`'s program; `git-contract.json`; `gh-contract.json`) | passes the inventory; its own sweep checks the grammar |
| a declared utility (`mv`, `mkdir`, `grep`, `rm`, `rmdir` today) | passes |
| a shell builtin or test word (`cd`, `[` today) | passes, through the same declared list |
| a declared placeholder (`<argv[0]>`, the runner record) | passes |
| an assignment prefix (`VAR=value cmd`) | skipped; the next word is the head |
| a subshell or group | stripped by rc05b's tokenizer; each inner segment's head is read |
| a refused line (substitution, here-document) | rc05b's extraction failure already fails it |
| a comment or blank line | not read |
| a non-shell fence (`markdown`, `json`, an untagged fence) | not read |
| any other word | fails, naming surface and line |
Closure: BOUNDED — the shell-fence domain is SOURCED by rc05b's tokenizer; the PURPOSE (no tool reaches the surface unrecorded) is not, because a command can sit outside a shell fence
Residual kind: a tool invoked only in an inline code span or in prose, where a command and a code-formatted name cannot be told apart
Residual method: an independent review reading a new surface's inline spans; rc05's guard already fails a recorded tool's flagged line outside a fence
Moves:
- READ: applied — rc05b's `tokenize` and `generatedSurfaces` (`test/helpers/surface-snippets.ts`); the two contract files
- ENUMERATE: applied — this table, built from Case 3's measured heads plus the tokenizer's segment kinds
- COHERE: applied — the refused-line row defers to rc05b's failure rather than adding a second one
- EXECUTE: applied — Case 3: every head on today's surface falls in a passing row; the test is green on day one
- FALSIFY: applied — a new tool in an inline span only passes; that is the stated residual
- CONFORM: applied — R-crc-10 (heads are tokens of a generated file); R-crc-12 (exit (2) revised, not met by redefinition)
- FEASIBILITY: not applied — one pass over a handful of surfaces
- CONSUME: applied — the suite; a failure names surface and line, as rc05b's matrix does
- INVOKE: applied — `npm test`, on every change

### Case 1 — the four figures over the archive (2026-10-10)
A throwaway vitest probe parsed every archived change's delta with `parseDeltaSpec`, read each capability's baseline at
the parent of the commit that added the archived `proposal.md`, and diffed each MODIFIED block against its baseline block
(`git diff --no-index -U0`). Zero unmatched blocks across 37 changes. Rc-stages, against R-crc-1 (>3 capabilities, >~12
requirements, >~40K changed bytes, 20+ tasks):
| stage | caps | A/M/R | carried | new-side | both sides | tasks |
|---|---|---|---|---|---|---|
| rc02-gate-semantics | 3 | 2/8/0 | 59.1K | 40.5K | 45.7K | 18 |
| rc04c-retire-gate-overridden | 3 | 0/10/0 | 57.0K | 14.1K | 21.6K | 36 |
| rc13b-explore-maturity-signal | 4 | 1/6/0 | 47.2K | 27.9K | 30.1K | 18 |
| rc02b-severity-ladder | 6 | 3/13/0 | 83.5K | 34.9K | 43.8K | 25 |
| rc04b-forward-recommendation | 5 | 2/9/0 | 62.3K | 27.1K | 33.8K | 19 |
| rc07b-reference-roundtrip | 4 | 2/4/0 | 32.4K | 15.5K | 19.0K | 19 |
| rc17a-invoked-coverage | 3 | 3/8/0 | 81.7K | 37.9K | 47.2K | 20 |
| rc17b-blind-pair-command | 4 | 2/7/0 | 56.3K | 29.3K | 37.2K | 18 |
| rc17d-external-runner | 3 | 7/5/1 | 58.4K | 28.6K | 29.6K | 22 |
| rc17c-short-review-next | 4 | 0/4/0 | 40.2K | 15.6K | 23.3K | 20 |
| rc05-executable-references | 1 | 3/0/0 | 15.0K | 15.0K | 15.0K | 21 |
Every other rc-stage sat under all four. The D-arc stages d4/d5/d6 read 50.8K/87.4K/95.6K new-side.

### Case 2 — EXECUTE against independent CRITICALs (2026-10-10)
For every archived `explore.md` carrying move lines: `^- EXECUTE: applied` and `^- EXECUTE: not applied` counted; for
its trail, CRITICALs counted in `review-(proposal|system)-*.json` emits whose `reviewer_class` is not `in-context`, plus
`### ` headings under `## CRITICAL` in `external-(proposal|system)-*.md` (fence-aware). Script in the session scratchpad.
Representative rows (applied/not, proposal CRIT, system CRIT): bounded-closure-semantics 5/4 1 2; rc13b 5/2 3 1; rc13c
0/6 4 2; rc15 0/5 0 0; rc02b 3/0 3 1; rc03b 3/0 0 0; rc03c 10/0 1 1; rc04b 0/4 0 0; rc06a 0/6 1 1; rc17a 1/10 0 1; rc17d
0/6 2 2; rc05 1/4 0 0; rc18 1/0 0 0; rc05b 1/2 0 0.

### Case 3 — command heads on the generated surface (2026-10-10)
A throwaway vitest probe parsed every surface from `generatedSurfaces()` with markdown-it, took each `bash`/`sh`/`shell`
fence, tokenized every non-comment line with rc05b's `tokenize`, and recorded each segment's first non-assignment word.
Heads (surfaces): orbit 15, mv 3, mkdir 2, git 2, grep 1, `[` 1, rm 1, rmdir 1, cd 1, `<argv[0]>` 1. Refusals: 0.

### Case 4 — multiset against git's diff (2026-10-10)
The Case 1 probe re-run with both counts per MODIFIED block: 227 blocks over 35 changes, 6 differ, the largest gap
rc17c at 15.36K multiset against 15.56K git (1.3%); d4, rc02c and rc17a differ by under 0.01K.

## Decisions
- **2026-10-10 — D-rc09-1: the four R-crc-1 figures are computable from disk for every change** The capability count
  is the delta's `specs/` directories; requirements touched are ADDED + MODIFIED + REMOVED + RENAMED entries from
  `parseDeltaSpec`; tasks are the tracked gate's own checkbox count (`parseCheckboxes`, `apply-state.ts`); changed bytes
  per D-rc09-3. Measured on 37 archived changes (Case 1), with every input an artifact the engine already reads.
  Kind: fact
- **2026-10-10 — D-rc09-2: on the record, the ceiling is crossed on capabilities and tasks, rarely on requirements or changed bytes** Of the rc-stages, 6 were over on capabilities, 6 on tasks, 2 on requirements and 1 on new-side changed bytes (rc02 at 40.5K, half a kilobyte over an exact 40,960); eleven in all, every one declared or split and ratified (Case 1). Corrected the same day: the first wording said zero on bytes, reading "~40K" as a rounded line rather than an exact one.
  Kind: fact
- **2026-10-10 — D-rc09-3: changed bytes count the NEW side** ADDED blocks whole; a MODIFIED block by its lines absent
  from the baseline block; deletions not counted. Settled under R-crc-3: it agrees with the 2026-09-23 clarification's
  own rc04c estimate (14.1K measured vs ~14K stated), and counting both sides would put five rc-stages over 40K, all of
  them shallow-touch work the clarification was written to stop the figure firing on.
  Kind: rule

- **2026-10-10 — D-rc09-4: size is REPORTED; only an UNDECLARED breach fails, and only under `--strict`** (Sal: agreed)
  The engine computes the four figures and reports them. A figure over its configured maximum is a WARNING from
  `orbit validate <change>` unless the proposal's `## Size` section names that dimension with a reason, when it is
  INFO; so non-strict validation never fails on size and `--strict` fails exactly an undeclared breach. The engine
  checks that the declaration EXISTS and names each breached dimension, never what the reason says (R-crc-10), and
  where to split stays the author's judgement — exit (1)'s "names the split" is read as naming the breached dimensions
  and their figures. Every ratified breach on the record (D-rc09-2) would have passed once declared (R-crc-9, R-crc-13).
  Kind: rule
- **2026-10-10 — D-rc09-5: the ceiling is an OPT-IN `size_ceiling:` map in `orbit/config.yaml`** (Sal: agreed)
  Four optional integer maxima — `capabilities`, `requirements`, `changed_bytes`, `tasks` — a breach being a figure
  STRICTLY GREATER than its maximum; an absent dimension is not compared; an absent key turns the check off. Read on its
  own, the `scenario_map:` / `review_preference` pattern, so no other field's warning reaches it. This repo opts in
  with R-crc-1's figures as exact maxima: 3, 12, 40960, 19 ("under 20 tasks"). R-crc-1 is this program's ruling; an
  adopter has none, so nothing is on by default.
  Kind: rule
- **2026-10-10 — D-rc09-6: the size shows in status, validate and the propose readout** (Sal: agreed) `orbit status
  --change <name>` carries the figures (a JSON field always — effort is recorded, R-crc-11(h); a human line when
  `size_ceiling` is configured); `orbit validate <change>` carries the D-rc09-4 issues; the propose body reads them after
  generation and briefs any breach before review.
  Kind: scope
- **2026-10-10 — D-rc09-7: the declaration is a `## Size` section in `proposal.md`, one list item per breached dimension**
  `- <dimension>: <reason>`, `<dimension>` one of the four `size_ceiling` keys, the reason non-empty prose the engine
  never reads. In the proposal, not design.md: design.md is optional in the schema ("create only if…") and the proposal
  is always generated; a breach is a statement about SCOPE, which is the proposal's job; and `## Touchpoints` is the
  precedent for an engine-parsed proposal section. Settled under R-crc-3 (reversing the session's earlier lean toward
  design.md). Grammar and states: D-rc09-4's Mechanism entry.
  Kind: rule
- **2026-10-10 — D-rc09-8: size PROXIMITY is dropped; R-crc-4's "within 20% of the ceiling runs a pair" was overtaken** (Sal: yes)
  Since R-crc-4's 2026-10-05 amendment the blind pair is the default review preference for every proposal, and the
  preference shapes only what the readout presents; a proximity rule could act only by overriding a user's own
  `review_preference`, which the amendment rules out. rc09 discharges the charter's "owns the size computation" with
  D-rc09-1/-4, and repoints `orbit-engine-gates`' "the size computation belongs with rc09 … until it ships" sentence at
  the size requirement.
  Kind: scope
- **2026-10-10 — D-rc09-9: on the record, EXECUTE is mostly not applied, and applying it shows no visible relation to independent CRITICALs**
  Across the 21 archived explorations written under the Mechanism convention, 37 EXECUTE move lines read `applied` and
  70 read `not applied`, the dominant reason "no code / no reader / no surface exists yet" — although R-crc-7 admits a
  CONSTRUCTED case. Independent-pass CRITICALs per stage do not track it: rc03c (10/0) drew 1+1, rc03b (3/0) 0+0, rc15
  (0/5) 0+0, rc17d (0/6) 2+2, rc13c (0/6) 4+2 (Case 2). Small numbers, no classification of the CRITICALs by move; it
  does not support a gate on EXECUTE, and it does not refute R-crc-7 either.
  Kind: fact
- **2026-10-10 — D-rc09-10: every command head in the generated surface's shell fences is a recorded tool, a POSIX utility, or the runner placeholder**
  `orbit` (15 surfaces), `git` (2) — both with recorded contracts; `mv`, `mkdir`, `grep`, `[`, `rm`, `rmdir`, `cd`; and
  `<argv[0]>`, the per-user runner record (rc17d) that by design no contract covers. `gh` appears only in inline spans
  (`pr-choreography.ts`), where rc05b reads it through its contract. Measured with rc05b's tokenizer over every shell
  fence of `generatedSurfaces()` (Case 3); zero refusals.
  Kind: fact
- **2026-10-10 — D-rc09-11: rc09 builds nothing for the generalized spike** (Sal: yes) R-crc-7's spike is already
  delivered as a RECORD: each live rule's EXECUTE move line in the Mechanism section (rc13a), carried into the proposal
  by `orbit-propose-modifications`' `Mechanism section consumption` (rc13c). D-rc09-9 gives no evidence for promoting it
  to a gate. The "not applied — no code yet" reading of R-crc-7 goes to the program doc's Open questions.
  Kind: scope
- **2026-10-10 — D-rc09-12: a command head on the generated surface that no contract, utility list or placeholder list names FAILS the suite** (Sal: yes)
  An inventory test over every shell fence of the generated surface; capturing a recorded contract becomes the price of
  a new tool — the external-tool spike made permanent. Exit (2) is REVISED under R-crc-12's first case: "a proposal
  touching an external tool without a cited spike fails strict validation" names an input the engine cannot observe
  (which tools a proposal's prose touches); it becomes "a new command head on the generated surface fails the suite,
  naming surface and line, until a contract or a declared exemption covers it". Owner: `orbit-cli-grammar`.
  Kind: rule
  Disposition: assigned rc09b-tool-inventory
- **2026-10-10 — D-rc09-13: rc09 SPLITS into rc09a-size-record and rc09b-tool-inventory** (Sal: yes) Under R-crc-9, its
  eleventh preventive application, caught at exploration by measuring the stage's own capabilities: size needs a new
  size capability + `orbit-propose-modifications` + `orbit-engine-gates` (three, exit (1)); the inventory needs
  `orbit-cli-grammar` (one, exit (2) as revised). The halves share no mechanism, so neither depends on the other. This
  staging directory continues as rc09a's; D-rc09-12 and its Mechanism entry are rc09b's starting record. The parent takes
  an ENDED mark once the children own its exits.
  Kind: scope
- **2026-10-10 — D-rc09-14: a multiset of lines computes the new side within 1.3% of git's diff** Over the 227 MODIFIED
  blocks of 35 archived changes, the multiset (bytes of new-block lines not in the old block, counted with multiplicity)
  matched git's `+` side exactly on 221 blocks; the largest per-change gap is rc17c, 15.36K against 15.56K, where moved
  lines read as unchanged (Case 4). Settled under R-crc-3 for D-rc09-3's engine: no diff dependency, deterministic, and
  under-counts only text that moved.
  Kind: fact
## Open questions

## Considered & out
- **2026-10-10 — counting changed bytes on both sides of a MODIFIED block.** Puts five rc-stages over 40K, all
  shallow-touch retirements the 2026-09-23 clarification exists to stop the figure firing on (D-rc09-3).
- **2026-10-10 — a size check that BLOCKS on any breach.** It would fire on every ratified breach on the record
  (D-rc09-2); a breach is a declared decision (R-crc-9), and a gate reports (R-crc-13) — D-rc09-4.
- **2026-10-10 — the declaration in `design.md` or as an `.openspec.yaml` field.** design.md is optional in the schema;
  the metadata helpers strip unknown keys — D-rc09-7.
- **2026-10-10 — computing size proximity to drive R-crc-4's near-ceiling pair.** Overtaken by the 2026-10-05
  amendment — D-rc09-8.
- **2026-10-10 — a gate on unexecuted EXECUTE moves (the generalized spike as a check).** Whether a rule is a decision
  procedure is a judgement, and the record shows no relation to independent CRITICALs (D-rc09-9) — D-rc09-11, Q-crc-33.
- **2026-10-10 — exit (2) as written: strict validation of a proposal that "touches an external tool".** The engine
  cannot observe which tools a proposal's prose touches (R-crc-10) — revised to the inventory test, D-rc09-12.

## References
- `orbit/architecture/clean-up-review-cycle.md` — Stage rc09-propose-hygiene; R-crc-1 and its 2026-09-23 clarification, R-crc-4 as amended 2026-10-05, R-crc-7, R-crc-9, R-crc-10, R-crc-11(h), R-crc-13
- `src/core/parsers/requirement-blocks.ts` — `parseDeltaSpec`, `extractRequirementsSection`
- `src/core/parsers/apply-state.ts` — `parseCheckboxes`, the tracked gate's task counter
- `src/core/project-config.ts` — `resolveReviewPreference` (rc17a): blind-pair is the default for both gates
