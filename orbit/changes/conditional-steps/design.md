## Context

Stage `conditional-steps` of `reduce-orbit-phase1` (see `explore.md`, D-cs-1 to D-cs-11, and the program doc's R-rop-2
to R-rop-13). Each of seven steps is carried today whole in its bodies, although an orbit command's result decides
whether its procedure is needed: `orbit pr commit` (`action: off` at the defaults), the status `chain` object
(`configured: false`), `orbit brief --hold` (`why: "off"`), the status `gates[]` rows (all passed on the usual
archive here), `orbit fingerprint --check` (all `verified`), the status `size` object (`ceiling: null` at the defaults)
and the resolved `pr:` regime (`never` at the defaults). The bodies are composed in TypeScript: `COMMIT_STEP` and
`CHAIN_END_STEP` in `src/core/disciplines.ts`, `SIGNOFF_HOLD_STEP` in `archive-change.ts` (also interpolated by
bulk-archive), `PROGRAM_SIGNOFF_STEP` in `architect.ts`, and the rest as literal text in each workflow template. Reference
files ship through each template's `references` array, which `orbit-skill-generation` already emits, validates and
converges.

## Goals / Non-Goals

**Goals:**
- Each step keeps its basic content in its bodies and moves its procedure, byte-equal to today's text, to a reference file
  the basic content tells the agent to read on any result it does not handle itself (R-rop-3, R-rop-4).
- Every workflow does what it does today under every setting (RG0); every body is the same under every configuration
  (R-rop-5).
- The per-body budget test and the size report land (R-rop-8, R-rop-12), and the rule for new steps has one home
  (D-cs-10).

**Non-Goals:**
- Rewording any instruction, moving a step into the engine, or touching bulk-archive (D-cs-3), explore or onboard.
- Stage B's and C's moves (the run-summary payload detail, the account step, the decision-writing restructure,
  Guardrails, provenance in headings).
- Measuring a repeated read (D-cs-4, carried to `automate-dev-flow`'s `first-run`) or rehearsing an unusual result in a
  real session (D-cs-7).

## Decisions

### 1. The seven splits (the sign-off hold counted once, in archive and architect)

| step | carrying bodies | the body keeps (basic content) | reference file (full text, byte-equal) |
|---|---|---|---|
| commit step | propose, ff, apply, review, address-reviews, archive | when it runs, `orbit pr commit`, `action: off` → nothing | `commit-step.md` ← `COMMIT_STEP` |
| chain end step | propose, ff, apply, review, address-reviews | when it runs, the `chain` read, `configured: false` → nothing, the tag meaning and what a chained command records (R-rop-6) | `chain-end-step.md` ← `CHAIN_END_STEP` |
| archive sign-off hold (Step 3.7) | archive | `orbit brief --hold`, `why: "off"` → go on | `signoff-hold.md` ← `SIGNOFF_HOLD_STEP` |
| program sign-off hold (5.4) | architect | the save (unchanged), the hold, `why: "off"` → observe arc-done | `program-signoff.md` ← `PROGRAM_SIGNOFF_STEP` |
| gate inflection prompt (Step 3.4) | archive | the `gates[]` read, all passed or superseded → go on | `gate-inflection.md` ← the step's text |
| divergence check (Step 3.45) | archive | `orbit fingerprint --check`, all `verified` → go on | `fingerprint-divergence.md` ← the step's text, its prompt subsection included |
| size brief | propose | the `size` read, `ceiling: null` or no breach → silent | `size-brief.md` ← the section's text, the checked mirror included |
| PR sections | propose, ff, architect | the regime read and `never` → return (unchanged); the phase-1 timing in one line; architect's arc-done check (unchanged) | propose's and ff's Position paragraphs join `pr-choreography.md`, in a new section (see below); architect's arc-done act joins `pr-resolution.md` |

`pr-choreography.md` is one text shipped to both propose and ff, so the two Position paragraphs go in a new section,
`## Where each phase runs`, opened by the line "Follow only the subsection of the workflow you are running." and holding
`### In /orbit:propose` and `### In /orbit:ff`, each with its paragraph verbatim. Each moved block runs from the
paragraph's bold `**Position` label up to, not including, the line beginning "Read the RESOLVED regime"; that extent is
what task 1.1 hashes.

Headings stay in the bodies, so every step keeps its name and number ("Step 3.4", "5.4", which
`orbit-archive-modifications`, `orbit-lifecycle-consent` and the architect body cite). Bulk-archive keeps interpolating
`SIGNOFF_HOLD_STEP` and its own divergence and PR text, unchanged (D-cs-3).

### 2. Composed once, held to today's bytes

Each moved block becomes (or stays) one exported constant; its reference file is a one-line title followed by that
constant, and the constant is the only source of the text. Before any template is edited, the first task records the
sha256 of each block as today's templates compose it; a block-hash test then holds each reference file's block to that
recorded hash, so "byte-equal to today's text" is checked rather than asserted. Each basic content is one constant too,
held byte-equal across its carrying bodies by the same test. The chain end step's tag paragraph is one constant
(`CHAIN_TAG_MEANING`) that both `CHAIN_END_STEP` (indented, as today) and the basic content use, so its bytes cannot
diverge between the halves. `PROGRAM_SIGNOFF_STEP` becomes the concatenation of a save part and a hold part, its bytes
unchanged, so the body can carry the save part alone.

### 3. The basic contents, drafted word for word (D-cs-8)

The design drafts each basic content so this stage's size is computed, not estimated (sizes below). Apply may tighten
wording; it may not drop a result the basic content handles, the read it directs, or its position.

**The handoff rule.** A reference file holds the whole of today's step, and today's step opens by running its command.
Every basic content therefore says to follow the reference "from the result you already have", without running the
command again: the agent enters the reference at the result it holds, a non-zero exit included. A literal repeat would
still do no harm — `orbit pr commit --json`, `orbit status --json`, `orbit fingerprint --check --json` and
`orbit brief --hold --json` are read-only, and architect's `orbit brief <doc> --save` writes only a brief that changed
since its latest copy — but it would waste a call and, at architect 5.4, could replace the save outcome the hold's
table reads. The moved-blocks test checks that each basic content's pointer carries "the result you already have".

**The chained read keeps its flags.** The status read in the chain end step's basic content carries the
`--chain-ran`/`--chain-head` clause, because the read happens before the reference is opened, and a read without the
flags never matches `no-progress` (`orbit-engine-gates`).

**Commit step** (each of the six bodies):

````markdown
## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)

Runs in the invoking session only, never in a dispatched worker, after the run summary (in archive, after the PR-attached tail) and before the position readout (in archive, the completion readout); in apply, once at the session's close. Skip it with no change target, or when this invocation's PR layer has already stopped. Otherwise run `orbit pr commit "<name>" --json`. On `action: off`, print nothing and go on. On any other result, or a non-zero exit, read `references/commit-step.md` and follow it from the result you already have, before the readout.
````

**Chain end step** (each of the five bodies; the second paragraph is `CHAIN_TAG_MEANING`, today's text):

````markdown
## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)

The LAST act of the invoking session, after the position readout and the eligibility line; never in a dispatched worker, and nothing with no change target. Read the `chain` object from `orbit status --change "<name>" --json` (the call that supplied the eligibility line, or one right after it); a command a chain ran adds `--chain-ran "<next>" --chain-head "<head>"` to that read, the `next` and `head` the previous read reported, a null `head` written as `null`. On `configured: false`, print nothing more. On any other result, or a non-zero exit, read `references/chain-end-step.md` and follow it from the result you already have.

The chained command runs as on a typed arrival except for its prompts, each tagged at its site: a `(chain: target)` prompt does not fire (the next command names the change and the mode); a `(chain: routine, default: <option>)` prompt takes that default, and the run summary's `final_assessment` records `The chain took the default: <prompt> — <answer>.`; a `(chain: decision)` prompt is asked exactly as on a typed arrival, and after a decision the chain does not continue — the command's own closing step states in one line that the chain stopped at a decision and runs nothing. The chained command records `Chained: granted by chain.<key>.` as one sentence in the record its session writes: a walk in its run summary's `final_assessment`; an external review or a blind pair in its launch record's `final_assessment`; an in-context review in its pass's `commentary` (the review emit owns a pass's `final_assessment`); a chained apply or archive records it as its `consent: "setting"` value and writes no sentence. A chained fresh review records nothing — its worker writes the pass, and its brief carries nothing from this session (a named limit).
````

**Archive Step 3.4** (heading kept):

````markdown
## NEW Step 3.4 — Gate inflection prompt (C1; every reviewed gate since rc10)

After Step 3.2, before the audit sweep (Step 3.5): read every `gates[]` row of kind `reviewed` from `orbit status --change "<change-name>" --json`. When each is `passed` or `superseded: true` (or there are none), go on without prompting. Otherwise, or on a non-zero exit, read `references/gate-inflection.md` and follow it from the result you already have: it prompts once over the listed gates and, on **Proceed anyway**, composes Step 5.5's `continuation` entries before the move.
````

**Archive Step 3.45** (heading kept):

````markdown
## NEW Step 3.45 — Base-fingerprint divergence check (C2)

After Step 3.4, before the Step 3.5 audit sweep, run `orbit fingerprint "<change-name>" --check --json` — this path's ONLY guard against a parallel change's spec loss. When every requirement is `verified` (or none is touched), go on silently. On `diverged`, `unverified` or `missing`, or a non-zero exit, read `references/fingerprint-divergence.md` and follow it from the result you already have.
````

**Archive Step 3.7** (after its heading and its `(Per …)` line):

````markdown
Directly after Step 3.6's save, BEFORE upstream Step 4, in every mode, run `orbit brief --change "<name>" --hold --json` (it renders and writes nothing). On `why: "off"`, go on silently, stating any warning in one line. On any other result or a non-zero exit, read `references/signoff-hold.md` and follow it from the result you already have, before the sync.
````

**Architect 5.4** (after the save part, which stays as today):

````markdown
The hold renders no brief and writes nothing. On `why: "off"`, say nothing about it and observe arc-done as Step 5.5 states, stating any warning in one line. On any other result or a non-zero exit, read `references/program-signoff.md` and follow it from the save's outcome and the result you already have, before Step 5.5.
````

**Architect 5.5** (replacing the paragraph that begins "When arc-done, run"):

````markdown
When arc-done, read `references/pr-resolution.md` and follow its arc-done readout: it runs `orbit pr program <doc> --json` and surfaces the program PR and its human acts — recommend, NEVER invoke; the readout is never suppressed and repeats on every later invocation until the PR is no longer draft.
````

**Propose's size brief:**

````markdown
## Size brief after generation (NEW step — both modes)

After every artifact is generated and `orbit validate "<name>"` passes non-strict, BEFORE Step 0d's move, Phase 3 and the completion emit, read `size` from `orbit status --change "<name>" --json`. When `ceiling` is `null` or `breaches` is empty, say nothing about size. Otherwise, or on a non-zero exit, read `references/size-brief.md` and follow it from the result you already have.
````

**Propose's and ff's PR Position paragraphs** (each replaced; the rest of each PR section stays):

````markdown
**Position (NEW Step 0.5).** Read the regime right after Step 0's mode detection and BEFORE Step 0a; on an active mode, read `references/pr-choreography.md` now and run its Phase 1 here, before any artifact is written; its `Where each phase runs` section, under `### In /orbit:propose`, says where phases 2 and 3 run.
````

````markdown
**Position.** Read the regime BEFORE Step 2 (`orbit new change`); on an active mode, read `references/pr-choreography.md` now and run its Phase 1 here; its `Where each phase runs` section, under `### In /orbit:ff`, says where phases 2 and 3 run.
````

### 4. Prompt tags move with their prompts

The gate, divergence and sign-off prompts carry their `(chain: decision)` tags into their reference files, which
`orbit-conventions`' `Each chained prompt states its kind` already allows ("at its site in the generated body or
reference"). The basic contents name no `AskUserQuestion` and no pause pattern, so they add no site. The tag test's
inventory moves those rows from `SKILL.md` to the reference files, and the text it strips before scanning (today
`CHAIN_END_STEP`) also strips the chain end step's basic content, whose tag paragraph names the tags without being a
prompt.

### 5. The budget test

`test/core/templates/skill-body-budget.test.ts` renders every skill with `generateSkillContent` (as `orbit init` does)
and holds each body to a character ceiling: its size after this change plus 5%, rounded up, recorded in one table. Any
body over 500 lines fails, except explore, held by a line ceiling of 664 that may only go down (R-rop-8). The failure
message names the body, its size and its ceiling, then states the rule: "keep the step's basic content (when it runs,
the command, the usual result, the link) in the body and move its procedure to a reference file — see
skill_body_convention.md" (D-cs-5, D-cs-10). A ceiling only moves down in this program; stages B and C lower it.

### 6. The size report

`scripts/skill-size-report.mjs` imports the built `generateSkillContent` and `getSkillTemplates` and prints, per skill,
the body's characters, lines and estimated tokens (characters / 4) against the 5,000 Claude Code keeps after a compaction
(R-rop-12), and each reference file's size; then the totals. `npm run size:report` runs it; CI runs it after
`npm test` on the Linux leg. It always exits 0.

### 7. The rule's home

`skill_body_convention.md` at the root, in `orbit-conventions`' four-section format: Purpose, Rules (a step whose
procedure an orbit command's result calls for keeps its basic content in the body and moves its procedure to a reference
file; the basic content names the command, the result it handles, and the file to read otherwise; one home per text,
composed once in code), Examples (the commit step), Exceptions (none yet; bulk-archive, explore and onboard await the
evaluation). CLAUDE.md gains one line naming the rule and the file (D-cs-10).

### 8. Tests follow the text (R-adf-15)

Every test that pins a moved block's text or position retargets to its new home, each named in the archive:
`commit-step.test.ts`, `chain-prompt-tags.test.ts`, `account-step.test.ts` (its anchor becomes the commit step's basic
content), `signoff-hold-step.test.ts`, `program-signoff-step.test.ts`, `size-declaration-parity.test.ts`,
`archive-user-validation.test.ts` (Step 3.4's wording), `orbit-content-fidelity.test.ts` (PR Position paragraphs; the
closed reference sets), `orbit-generated-surface.test.ts` and `config-profile.test.ts` (the closed reference lists), and
`skill-templates-parity.test.ts` (hashes, with a dated comment). No behaviour assertion is weakened.

### 9. A stale doc figure

README and `docs/supported-tools.md` say eight workflows hold a `references/` directory; every workflow but onboard has
shipped `decision-records.md` since decision-writing, so fourteen do, before and after this change.

## Size (measured, D-cs-8)

From the generated bodies at `3f5b035b` (434,449 characters), with the drafts above:

| move | today | basic content | bodies | saves |
|---|---|---|---|---|
| commit step | 3,504 | 661 | 6 | 17,058 |
| chain end step | 3,696 | 1,866 | 5 | 9,150 |
| archive Step 3.4 | 3,689 | 563 | 1 | 3,126 |
| archive Step 3.45 | 2,754 | 457 | 1 | 2,297 |
| archive Step 3.7 | 4,349 | 360 | 1 | 3,989 |
| architect 5.4 hold | 6,227 | 324 | 1 | 5,903 |
| propose size brief | 2,865 | 441 | 1 | 2,424 |
| PR: propose, ff, architect 5.5 | 2,017 | 867 | 3 | 1,150 |

About 45,097 characters move: the bodies land at about 389,400, and RG1's projection after stage C is about
352,700, about 2,700 over, to be carried by the later stages (D-cs-11; about 600 when Sal decided it,
before the proposal walk added the handoff rule and the chained read's flags). Apply's body lands at about 27,000; its 17,500 limit is reached in
stage B, as the brief projected. The budget test's ceilings are set from the sizes apply measures, not from this table.

## Touchpoints

- `src/core/disciplines.ts` — `COMMIT_STEP_BASIC`, `CHAIN_TAG_MEANING`, `CHAIN_END_STEP_BASIC` and the two reference constants.
- `src/core/templates/workflows/*.ts` — the bodies and their `references` arrays (propose, ff-change, apply-change, review, address-reviews, archive-change, architect, pr-choreography).
- `test/core/templates/` — the retargeted tests, the block-hash test and the budget test.
- `test/core/size-declaration-parity.test.ts` — the mirror's new home.
- `test/commands/config-profile.test.ts` — the closed reference lists.
- `scripts/skill-size-report.mjs` — the size report.
- `package.json` + `.github/workflows/ci.yml` — the `size:report` script and its CI step.
- `skill_body_convention.md` + `CLAUDE.md` — the rule and its pointer.
- `README.md` + `docs/supported-tools.md` — the reference-directory count.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-cs-1 | — | scope | not carried |
| D-cs-2 | — | fact | not carried |
| D-cs-3 | — | scope | not carried |
| D-cs-4 | — | scope | not carried |
| D-cs-5 | — | scope, superseded D-cs-10 | not carried |
| D-cs-6 | — | scope | not carried |
| D-cs-7 | — | scope | not carried |
| D-cs-8 | — | scope | not carried |
| D-cs-9 | — | scope | not carried |
| D-cs-10 | — | scope | not carried |
| D-cs-11 | — | scope | not carried |

The Mechanism section is empty: every decision is a scope or fact entry, so no live rule owes an entry.

## Risks / Trade-offs

- [An agent meets an unusual result and does not open the reference file] → the named limit in the stage's exit
  criteria (D-cs-7): the basic content names the file and says to read and follow it; real sessions on the new bodies,
  here and at the evaluation, are where a miss would be seen. The gate prompt is where an adopter would meet it first.
- [A compaction drops a body's later steps mid-session] → R-rop-12's observation of this change's own sessions
  (D-cs-9); the size report prints each body's estimated tokens against the 5,000 kept.
- [Text moved byte-equal keeps positional pointers that are wrong in its new home] → accepted, each named so stage C,
  which tightens what stays, finds them: the architect save paragraph's "no row below reads them" (the rows now sit in
  `program-signoff.md`); `SIGNOFF_HOLD_STEP`'s "the save step's just above" (in `signoff-hold.md` the save stays in the
  archive body's Step 3.6, and bulk-archive keeps the constant, so its bytes cannot change); the size brief's "(below)"
  (nothing follows it in `size-brief.md`); and the Position paragraphs' "placed last for reading" labels. Each stays
  true of the step read whole.
- [Today's divergence step defines no row for a non-zero exit] → a gap that predates this change: the basic content
  routes a non-zero exit to the reference, which behaves exactly as today's step does. Defining that behaviour would
  change what the workflow does, outside RG0, so it waits for a change that may.
- [A chained archive meets tags its body does not explain] → a named limit as before this program (R-rop-6 as
  amended): archive carries no chain end step, so it relies on the tag meaning the arriving session read in the
  chaining body that ran it.
- [RG1's projection is about 600 over] → D-cs-11: the next stage's propose measures again from the real bodies.
- [Four capabilities against a limit of three] → declared in the proposal (D-cs-1).

## Alternatives considered

From `explore.md`'s Considered & out: a shared divergence reference across archive and bulk-archive (moot once
bulk-archive left the stage; the shared form is the shape to use if it is moved later); measuring the repeated read here
(D-cs-4); the rule for new steps as an `orbit-conventions` requirement, or the budget test alone with a bare failure
(D-cs-5, D-cs-10); a real-session rehearsal of the unusual results (D-cs-7); splitting the stage into two or three
changes (D-cs-1). Also weighed at propose: trimming the PR sections further, bringing bulk-archive's hold back, or
amending RG1 (D-cs-11); and pinning byte-equality by a snapshot of the old bodies instead of recorded block hashes,
rejected because a snapshot of whole bodies would also pin the text this change deliberately moves.
