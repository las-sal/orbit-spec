## MODIFIED Requirements

### Requirement: Decision-writing discipline

The system SHALL tell the AI when to write each decision record (`orbit-decision-records`) by a fifth execution
discipline, DECISION-WRITING, stated once in this fence and carried byte-equal by every generated workflow body's
disciplines epitome, as one bullet whose label line is followed by five labelled sub-bullets (before asking,
acting without asking, after a call, not a stop, where records go) — the restructure `tighten-bodies`
(`reduce-orbit-phase1`, R-rop-7) gave it, every clause, gloss and area name of the one-paragraph form kept:

```
- **Decision-writing (call-time)**: under every setting, keep a record of each call and each stop without changing what the user sees or is asked. What each record carries — its fields, its citations and the plain-language rule, with an example of each — is in `references/decision-records.md`, beside this skill; a refused record names the field to fix.
  - *Before asking*: BEFORE asking the user a question that a stop condition describes — `security-unprecedented` (a security-relevant call with nothing approved to rely on), `user-facing-uncovered` (an end-user-visible call no ratified goal covers), `ruling-amendment` (amending a ratified ruling or goal), `outward-act` (an outward or irreversible act the settings do not grant), `unresolvable-critical` (a CRITICAL review finding no edit inside the change resolves) — write a stop record (`orbit emit stop`), then ask exactly as you would have; with the user's answer, write a resolution naming that stop (`orbit emit resolution`).
  - *Acting without asking*: when `ruling-amendment`, `outward-act` or `unresolvable-critical` describes an act you take without asking — the user directed it (they told you to amend a ruling), or no flow asks — write its stop record before the act, then, when the user directed it, a resolution naming that stop whose answer is their direction, and otherwise leave the stop open.
  - *After a call*: AFTER any call that falls in a ledger area — however you reached it: without asking, after a question no condition describes, or with the user's answer to a stop — `user-sees-or-does`, `defaults`, `when-things-go-wrong`, `user-data`, `things-others-build-on`, `docs`, `who-can-get-in`, `secrets`, `network-exposure`, `trusting-input`, `new-dependencies`, `permissions-and-sandboxing`, `encryption`, `personal-data-and-privacy`, `cost`, `licensing`, `accessibility`, `performance-user-feels` — write a ledger entry (`orbit emit ledger`) citing what it relies on; when `security-unprecedented` or `user-facing-uncovered` describes the call, by its own gloss above, the entry cites nothing and names that stop: the one you asked at, or, where you would not have asked, one you write first — ask nothing and leave that stop open.
  - *Not a stop*: a designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — is a seam, not a stop, and writes nothing, unless a stop condition also describes it: then write the stop record first and fire the prompt as designed. A question no condition describes writes nothing, nor does a call in no area.
  - *Where records go*: a record names the work it belongs to (`--change <name>` for a change or a named exploration, or `--doc <doc>` in an architect session); in a session with neither (a project-wide run, an unnamed exploration), or on an archived change (orbit writes no record to its trail), write no record, never attaching it to other work.
```

The fence is the owner. A generated body cannot read this spec, so the statement it carries names the stop conditions
and ledger areas themselves; the ids are those `orbit-decision-records` defines (its event table's five conditions a
payload may raise, and `The ledger's eighteen areas`), composed in code from the same lists the write gate checks, and
a parity test holds the composed statement equal to this fence. The moments the statement names, and what each
writes:

| moment | writes |
|---|---|
| the AI is about to ask the user a question a stop condition describes | a stop record, then the question, asked exactly as without the record |
| the user answers that question | a resolution naming the stop |
| an act `ruling-amendment`, `outward-act` or `unresolvable-critical` describes, taken without asking — the user directed it, or no flow asks | a stop record before the act; when the user directed it, a resolution naming the stop whose answer is that direction; otherwise the stop stays OPEN |
| a call in a ledger area that neither `security-unprecedented` (a security-relevant call with nothing approved to rely on) nor `user-facing-uncovered` (an end-user-visible call no ratified goal covers) describes, however it was reached (without asking, after a question no condition describes, or with the user's answer to a stop) | a ledger entry citing what it relies on |
| a call in a ledger area one of those two conditions describes, each by its own gloss, put to the user as a question | a stop record of that condition, then the question, then, after the answer, the resolution and the ledger entry citing nothing and naming the stop |
| a call in a ledger area one of those two conditions describes, made without asking (where today's flow asks nothing) | a stop record of that condition, then the ledger entry citing nothing and naming it; nothing is asked, and the stop stays OPEN — no resolution answers it |
| a designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — that no stop condition describes | nothing: a designed seam is not a stop |
| a designed prompt a stop condition also describes (a gate's inflection prompt over a CRITICAL finding no edit inside the change resolves: `unresolvable-critical`) | a stop record, then the prompt as designed; with the user's answer, the resolution naming the stop |
| a question no condition describes | nothing for the question itself; a call it leads to is a call row |
| a call in no ledger area | nothing |
| any moment in a session with no change and no architecture doc (a project-wide audit-drift run, an unnamed exploration, an onboard read), or on an archived change (an address-reviews walk of its trail) | nothing: decision records have no project-wide home (`orbit-decision-records`' `Where decision records are kept`), the emit surface writes none to an archived change's trail (a decision is recorded while the work is live), and a record is never attached to work it does not belong to |
| a `tripwire` stop | nothing from the AI: orbit raises it (stage `tripwires` of `automate-dev-flow`), and a payload naming it is refused |

The table is closed by derivation: a moment is either a question for the user — a stop condition, a seam no condition
describes, a seam one does, or neither — or an act a directly raised condition describes, taken with no question (the
user directed it, or no flow asks), or a call the AI makes, however it was reached (without asking, after a question no condition describes, or with
the user's answer to a stop) — in an area neither ledger condition describes, in an area
one does (asked, or not asked), or in none — and every branch is a row; a moment in a session with no home for a
record — no change and no doc, or an archived change — is its own row whatever its branch. The two ledger conditions
are read each by its own gloss, as R-adf-3 rules them: an end-user-visible call that a requirement supports but no
ratified goal covers is `user-facing-uncovered`, and its entry cites nothing and names that stop. Under supervised settings the discipline changes nothing the user sees or is asked: a stop record keeps the
moment and halts nothing (`orbit-decision-records`' `Decision records are written in every mode`), and an OPEN stop —
one written where today's flow asks nothing — is expected: it marks a moment a later setting may halt on. Named limit — a moment in a session
with no change and no doc, or on an archived change, goes unrecorded, and nothing tells the user so. Whether a moment
WAS recorded is a reader's judgement, graded at `automate-dev-flow`'s first-run (G2, G4): orbit checks a record's form
when it is written, never that a record was owed.

#### Scenario: Every workflow body carries the statement

- **WHEN** each generated workflow skill that carries a disciplines epitome is generated
- **THEN** its epitome carries the statement byte-equal to this fence, as its fifth bullet after no-chaining, the five
  labelled sub-bullets nested under it

#### Scenario: The statement is composed from the write gate's lists

- **WHEN** the composed statement is read
- **THEN** it names every stop condition a payload may raise and every ledger area, in the lists' order, and does not
  name `tripwire`; a parity test holds it equal to this fence

#### Scenario: A stop record precedes the question it keeps

- **WHEN** the AI is about to ask the user whether to amend a ratified ruling
- **THEN** it writes a stop record of condition `ruling-amendment` first, then asks exactly as it would have, and on
  the user's answer writes a resolution naming that stop

#### Scenario: A call put to the user leaves all three records

- **WHEN** the AI is about to ask the user how to handle a security-relevant call with nothing approved to rely on
- **THEN** it writes a stop record of condition `security-unprecedented`, asks exactly as it would have, writes a
  resolution naming that stop with the user's answer, and, once it makes the call, a ledger entry whose `raised_stop`
  names that stop

#### Scenario: A call relying on nothing, made without asking, names an open stop

- **WHEN** under default settings the AI picks a default that a spec requirement supports but no ratified goal covers,
  where today's flow asks nothing
- **THEN** it writes a stop record of condition `user-facing-uncovered`, then a ledger entry with `relies_on: []`
  whose `raised_stop` names that stop; it asks the user nothing, and no resolution is written

#### Scenario: A session with no change and no doc writes no record

- **WHEN** during a project-wide `/orbit:audit-drift` run the AI is about to ask the user a question a stop condition
  describes
- **THEN** it writes no decision record and asks exactly as it would have

#### Scenario: An act the user directed writes its stop and its resolution

- **WHEN** the user tells the AI to amend a ratified ruling, and the AI amends it without asking anything
- **THEN** it writes a stop record of condition `ruling-amendment` before the amendment, and a resolution naming that
  stop whose answer is the user's direction

#### Scenario: A walk of an archived change writes no record

- **WHEN** during `/orbit:address-reviews` on an archived change the AI makes a call in a ledger area
- **THEN** it writes no decision record: the emit surface writes none to an archived change's trail

#### Scenario: A call after a clarifying question writes its ledger entry

- **WHEN** the AI asks the user a clarifying question no stop condition describes, then makes a call in a ledger area
  that something approved covers
- **THEN** it writes a ledger entry citing what the call relies on, and no stop record

#### Scenario: A seam prompt writes nothing

- **WHEN** the AI asks the user for consent at a consent-marked seam, or fires a gate's inflection prompt, and no stop
  condition describes the prompt
- **THEN** no decision record is written: the prompt is a seam, not a stop

#### Scenario: A seam a stop condition describes writes its stop first

- **WHEN** a gate's inflection prompt is about to fire over a CRITICAL review finding no edit inside the change
  resolves
- **THEN** the AI writes a stop record of condition `unresolvable-critical`, fires the prompt exactly as designed,
  and on the user's answer writes a resolution naming that stop

#### Scenario: The labelled form keeps every clause

- **WHEN** the statement is compared with its one-paragraph form before `tighten-bodies`
- **THEN** every stop condition with its gloss, every ledger area, every command and every clause of the earlier form
  is in it; only the connecting words and the place of the reference pointer differ, and a test holds each clause

### Requirement: Review mode decision framework

The system SHALL define orbit's three reviewer classes (in-context, fresh, external — the `--reviewer` axis on the merged `/orbit:review` surface, D-arc Stage D5; "mode" belongs to `--as proposal|system|architecture`) and its two PASS GENRES — REVIEW and VERIFICATION — and SHALL state ONCE, here, how a pass's genre is determined and what a REVIEW-genre brief may carry. Every other surface (the external prompt, the renderer, the other specs) names this requirement and points; the ONE exception is the review body, which carries the pass-genre table below as a CHECKED MIRROR — a parity test holds it byte-equal to the fence (R-crc-14's mirror corollary, as `reduce-orbit-phase1`'s R-rop-14 amends it: the body's copy carries no note saying it is a mirror or naming this owner); nothing else restates it. "Pass genre" is a DIFFERENT AXIS from the RENDER genre — internal versus external, the SOURCE of a pass's record — that `orbit-report-rendering`'s `One grammar for internal and external passes` and `orbit-review`'s `Iteration note when prior runs exist` already name; every use here is qualified "pass genre", and a field that ever stores the word is named `pass_genre`. The framework exists because empirical evidence (notably `bootstrap-orbit-status-cli`'s 3-of-3 finding — in-context system review missed all 3 real implementation bugs that external review caught; and the D-arc's ~25 in-context passes yielding one CRITICAL) demonstrates that reviewer class materially affects what a pass finds. WHICH CLASS RUNS NEXT is not a per-change judgement this requirement makes: it is the schema's cadence (per `orbit-engine-gates`' reviewed-gate model), surfaced as the engine's canonical next command and never hard-blocking.

The three classes:

1. **In-context** (default `/orbit:review`) — the current AI session runs the pass against its accumulated context. It is the REACTING class: it holds the context no independent reviewer has, and uses it to react to, push back on and learn from what independent passes returned (R-crc-11(f)). Anchoring risk: it may confirm work it has visibility into — which is why the cadence orders it after the independent slot.
2. **Fresh** (`/orbit:review --reviewer fresh`; `--fresh` remains as shorthand — D-arc Stage D5) — the SAME MODEL in a CLEAN CONTEXT: a subagent spawned within the same process that did not author the artifacts. Loses session-level anchoring; model-level biases remain. One of the two independent classes, and one half of the `blind-pair`.
3. **External** (`/orbit:review --reviewer external` — D-arc Stage D5's merge; the standalone launcher is retired, record vocabulary frozen per `orbit-review-external`) — a DIFFERENT AI in a SEPARATE SESSION, reached by a packaged prompt — launched by the user's recorded runner, or carried across by hand when none is recorded (`orbit-external-runner`; the launch is `orbit-review-external`'s). Maximum independence; cross-AI round-trip cost. The other independent class and the other half of the pair.

**The pass-genre table.** A pass's genre is COMPUTED from three trail facts — its reviewer class, its mode, and whether a QUALIFYING WALK of its mode precedes it on the trail — never declared by the author. A qualifying walk is an address-reviews record whose source resolves to the pass's mode AND whose token lies AFTER the latest ACCEPTED independent pass of that mode (every such walk, when the mode has no independent pass) and BEFORE the pass; a record whose mode cannot be read is MODE-LESS and qualifies for no mode. "Accepted independent pass" is the trail reader's pass set and class rule: a `review-<mode>-*.json` record is `fresh` by its `reviewer_class` field, or — absent that field — by `flags.fresh: true`; an `external-<mode>-*.md` return the trail reader rejects is not a pass. The table is a fenced production — the review body mirrors it byte-equal:

```
| reviewer class | mode | trail position | pass genre |
|---|---|---|---|
| `fresh` or `external` | proposal or system | any | REVIEW — reads the whole artifact and the thesis |
| `in-context` | proposal or system | a qualifying walk of this mode precedes the pass | VERIFICATION — reads that walk and answers landed / regressed per resolution |
| `in-context` | proposal or system | no qualifying walk of this mode precedes it | REVIEW — a reaction with nothing yet to verify; the cadence's slot arithmetic is unchanged by pass genre |
| `in-context` | proposal or system | only MODE-LESS walks precede it | REVIEW — a walk whose mode cannot be read is not evidence of a qualifying walk of this mode |
| `in-context` or `fresh` | architecture | — | REVIEW — the architecture trail carries no change-mode walk records and the mode has no gate |
| `external` | architecture | — | not a member — refused by `orbit-review`'s mode constraint |
```

The pass genre is a RECORD and a header word, never a gate input: the reviewed gate's coverage and resolution clauses (`orbit-engine-gates`) read the class and the findings and nothing of the genre (R-crc-13). This requirement defines the pass genre; it defines no record field for either genre. The in-context body learns its own pass genre from ONE directory fact — the token-ordered listing of the trail's PASS and WALK records — `review-<mode>-*.json` with each record's `reviewer_class` field (or `flags.fresh` when that field is absent), `external-<mode>-*.md` by filename, and `address-reviews-*.json` with each record's `source_path` — read as a LISTING of metadata, never as findings, suppressed lists or resolutions — which is exactly what the qualifying-walk bound needs (the latest ACCEPTED independent pass's token, from the pass records; each walk's mode and token, from the walk records) — and an unreadable listing is REVIEW (the mode-less row). KNOWN LIMIT of that probe: whether the trail reader ACCEPTS an external return cannot be read from metadata, so the body treats every `external-<mode>-*.md` file as a pass; where that differs from the accepted set (a rejected return after a qualifying walk), the engine's computation over the trail reader is authoritative; that bounded METADATA PROBE is not a trail pointer in the sense of the brief rule below, which forbids findings, suppressed lists and resolution content, never filenames and class or source fields.

**A REVIEW-genre brief carries no findings and no pointer at the trail.** Whatever a REVIEW-genre reviewer is handed — the external prompt file, the fresh subagent's launching brief, the in-context pass's own read list — names the change directory's artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/`, and `explore.md` and `sketches/` when present), the project-context files (`CLAUDE.md`, `orbit/project.md`, `*_convention.md` at the root, when present), the baseline specs under `orbit/specs/`, the lens files, and — in system mode — the apply commit range (its start commit found by a hash-only read, never from commit subjects), and names NO finding (open or resolved), NO prior pass, and NO path under `.orbit-runs/` as something to READ — the destinations a brief tells the reviewer to WRITE to (the findings file it produces and the commit line that lands it) are not reads and are exempt; a commit-range diff it is told to read EXCLUDES the trail directory. This is the ONE statement of what a brief carries; the bodies that compose briefs name it and state only their own observable consequence. ONE exemption, stated here: the architecture body's hand-computed per-doc iteration note (`orbit-review`'s `Iteration note when prior runs exist`) is read by the body as a COUNT over the architecture trail — the mode has no pair and no gate, so no blindness is at stake, and no render surface computes the note for it. The property is stronger than R-crc-4's "blind to each other" and compatible with it: the ruling permits history and does not require feeding it; without a finding in any brief, the pair is blind on every launch order and no ordering rule is needed. Pushback is unaffected — `orbit-review`'s pushback discipline verifies a finding against CURRENT STATE, which needs no prior list; staleness-by-record is the walk's. This rule's domain is BOUNDED and its limit is stated here, once — Residual kind: an instruction outside `review.ts` — another body's prose, the chat invocation snippet, the launching brief — that hands a review-genre reviewer prior findings, including one that asks for them WITHOUT naming the trail path (a reworded read such as "read the previous review summary", which no grep decides); and prior-pass content reaching the reviewer through what a brief legitimately names rather than through an instruction — commit messages it reads on its own (the prompt's commit line writes counts into them by design), the gate reason `orbit status` prints once one half of a pair has landed, and narrative prose in a project-context file such as `CLAUDE.md`. Residual method: the exit (3) grep over the WHOLE generated surface for the trail path and the three finding-list phrasings, plus reading each pair's committed prompt file at the walk (the prompt is on the trail; the brief is not), plus checking at the walk whether either half's findings cite a prior pass. How each body honours the rule is that body's own requirement (`orbit-review`'s review-genre read rule; `orbit-review-external`'s cycle-context and recommended-session requirements), which point here.

#### Scenario: Independent classes are REVIEW genre

- **WHEN** a pass's `reviewer_class` is `fresh` or `external`, in proposal or system mode, at any trail position
- **THEN** its pass genre is REVIEW: the pass reads the whole artifact and its brief carries no finding and no trail pointer

#### Scenario: In-context after a qualifying walk of its mode is VERIFICATION genre

- **WHEN** a pass's `reviewer_class` is `in-context` in proposal or system mode AND a qualifying walk of that mode — an address-reviews record whose source resolves to the mode, with a token after the latest ACCEPTED independent pass of the mode (any such walk when none exists) and before the pass — precedes it on the trail
- **THEN** its pass genre is VERIFICATION: the pass reads that walk record and answers landed / regressed per resolution; its genre changes nothing about which cadence slot the pass satisfies

#### Scenario: In-context with no qualifying walk of its mode is REVIEW genre

- **WHEN** a pass's `reviewer_class` is `in-context` in proposal or system mode AND no qualifying walk of that mode precedes it (none at all, only walks older than the latest ACCEPTED independent pass of the mode, or only MODE-LESS records whose source does not resolve to a mode)
- **THEN** its pass genre is REVIEW, recorded as what it is; the cadence's slot arithmetic is unchanged by the genre

#### Scenario: Architecture mode is REVIEW genre

- **WHEN** a pass runs under `--as architecture` as `in-context` or `fresh`
- **THEN** its pass genre is REVIEW; `--reviewer external` is refused in that mode by `orbit-review` and is not a member of the table; the body's hand-computed per-doc iteration note is the one count it reads from the architecture trail, per the exemption stated above

#### Scenario: A review-genre brief is checked for what it carries

- **WHEN** any surface composes a brief for a REVIEW-genre reviewer — the external prompt file, the fresh launching brief, the in-context read list
- **THEN** the brief names no finding, no prior pass and no `.orbit-runs/` path to READ (its write destinations are exempt), and any commit-range diff instruction excludes the trail directory; the generated surface is grep-tested for the finding-list phrasings and the read pointer — how the output sections are told apart from reads is `orbit-review`'s grep scenario's — and the one brief with no artifact (the fresh launching brief) is held by the rule alone, per the stated residual

#### Scenario: The review body carries the table as a checked mirror

- **WHEN** the review skill is generated
- **THEN** its body carries the fenced pass-genre table byte-equal to this requirement's fence, with no note saying it is a mirror or naming this owner; a parity test anchored on the fence's header row (`| reviewer class | mode | trail position | pass genre |`) holds the two equal, and no other surface restates the table

#### Scenario: A user doc stating the framework is held to this requirement

- **WHEN** a user doc (README or `docs/`) states reviewer-class or genre guidance that drifts from this requirement's table (e.g., it claims in-context is the right first pass for a small change, or that an external session should carry its prior findings)
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run; until such a doc exists the framework is spec-only and there is no second statement to drift

#### Scenario: Framework guidance is gate-surfaced, never gate-enforced

- **WHEN** a change's cadence names an independent pass the user has not run AND the user chooses to archive anyway
- **THEN** orbit's archive flow proceeds via the inflection prompt (per `orbit-engine-gates`): the `review-system` gate computes as unpassed and the archive flow fires the address / proceed-anyway / abort prompt; proceeding records the judgement in the archive emit. The gate NEVER refuses the archive — apply-parity enforcement. orbit's role is to surface the engine-computed recommendation and record the decision, not to refuse archive of changes that skip it.

## ADDED Requirements

### Requirement: Restated Guardrails lines are removed from orbit-modified bodies

The system SHALL remove from an orbit-modified body's upstream `**Guardrails**` list each line that a step line of the
same body states with nothing added — no timing, scope or case of its own — and SHALL keep every other line; the
heading goes when no line is left. This requirement is the named edit `Generated-file disposition` asks of a change to
an upstream portion: each removed line is named below with the step that states it, and a test holds the step line
present. The lines it covers, from the bodies generated at `a5ba0f0c`:

| member | covered by |
|---|---|
| apply-change: "Keep going through tasks until done or blocked" | removed — step 6, "Implement tasks (loop until done or blocked)", and "Continue to next task" |
| apply-change: "Always read context files before starting (from the apply instructions output)" | removed — step 4, "Read every file path listed under `contextFiles` from the apply instructions output" |
| apply-change: "If task is ambiguous, pause and ask before implementing (chain: decision)" | kept — adds "before implementing" |
| apply-change: "If implementation reveals issues, pause and suggest artifact updates (chain: decision)" | removed — step 6's pause list, "Implementation reveals a design issue → suggest updating artifacts", under its `(chain: decision)` tag |
| apply-change: "Keep code changes minimal and scoped to each task" | kept — adds "scoped to each task" |
| apply-change: "Update task checkbox immediately after completing each task" | removed — step 6, "Mark task complete in the tasks file" before "Continue to next task" |
| apply-change: "Pause on errors, blockers, or unclear requirements - don't guess (chain: decision)" | removed — step 6, "Task is unclear → ask for clarification (chain: decision)" and "Error or blocker encountered → report and wait for guidance (chain: decision)" |
| apply-change: "Use contextFiles from CLI output, don't assume specific file names" | removed — step 4, "Other schemas: follow the contextFiles from CLI output" |
| archive-change: all seven lines, and the heading | removed — steps 1 (selection), 2 (completion by `orbit status --change <name> --json`), 2 and 3 (warn, confirm, proceed), 5 (the whole directory moves), 6 (the summary), and 4 (sync through `orbit-sync-specs`; "Show a combined summary before prompting") |
| continue-change: "Create ONE artifact per invocation" | removed — step 3, "STOP after creating ONE artifact" |
| continue-change: "Always read dependency artifacts before creating a new one" | removed — step 3, "Read any completed dependency files for context" |
| continue-change: "Never skip artifacts or create out of order" | removed — step 3, "Pick the FIRST artifact with `status: "ready"`" |
| continue-change: "Use the schema's artifact sequence, don't assume specific artifact names" | removed — Artifact Creation Guidelines, "The artifact types and their purpose depend on the schema" |
| continue-change: the unclear-context, file-verification and `context`/`rules` lines | kept — no step asks outside the proposal, verifies the file, or names the `<context>`, `<rules>`, `<project_context>` blocks |
| ff-change and propose: "Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)" | removed — step 4b, until every `applyRequires` artifact is done |
| ff-change and propose: "Always read dependency artifacts before creating a new one" | removed — step 4a, "Read any completed dependency files for context", and the Artifact Creation Guidelines |
| ff-change and propose: the momentum, existing-name and file-verification lines | kept — no step states them |
| new-change: "Do NOT create any artifacts yet - just show the instructions" | kept — a prohibition no step states; steps 5 and 6 show the instructions and stop, but none says not to create an artifact |
| new-change: "Do NOT advance beyond showing the first artifact template" | removed — step 6, "STOP and wait for user direction", after step 5 shows the first artifact's template |
| new-change: "Pass --schema if using a non-default workflow" | removed — step 3, "Add `--schema <name>` only if the user requested a specific workflow" |
| new-change: the invalid-name and existing-name lines | kept — no step states them |
| sync-specs: all five lines | kept — `Generated-file disposition` classes sync-specs as upstream-verbatim, its upstream body unchanged |

The table is sourced from the `**Guardrails**` blocks of the seven bodies that carry one among the twelve
`tighten-bodies` tightens (explore's and bulk-archive's are untouched until `reduce-orbit-phase1`'s evaluation): 42
lines, 23 removed.

#### Scenario: A line a step states goes

- **WHEN** apply's body is generated
- **THEN** it carries no "Pause on errors, blockers, or unclear requirements" Guardrails line, and its step 6 still
  carries "Error or blocker encountered → report and wait for guidance (chain: decision)"

#### Scenario: A line that adds to the steps stays

- **WHEN** apply's body is generated
- **THEN** its Guardrails list still carries "If task is ambiguous, pause and ask before implementing (chain: decision)"
  and "Keep code changes minimal and scoped to each task"

#### Scenario: Archive's Guardrails heading goes with its lines

- **WHEN** archive's body is generated
- **THEN** it carries no `**Guardrails**` heading

#### Scenario: Sync-specs keeps its upstream body

- **WHEN** sync-specs' body is generated
- **THEN** its upstream portion, the `**Guardrails**` list included, is unchanged

### Requirement: Tightened bodies carry no provenance

The system SHALL keep provenance — text that records where an instruction came from rather than what to do — out of
the twelve bodies `tighten-bodies` tightens: new-change, continue-change, apply-change, ff-change, sync-specs,
archive-change, verify-change, propose, review, address-reviews, audit-drift and architect. The instruction it was attached to SHALL stay,
and text only template authors need goes to a comment beside the template literal, which is not emitted:

| member | covered by |
|---|---|
| stage tags (`D-arc Stage D2` to `D6`, `C1`, `C2`, `rc04a`, `rc10`, `rc12`) | removed with the connectors that join them; a bracket goes only when nothing else is left in it; a step's number stays |
| the `NEW` before an orbit step's number, and "(orbit named edit, per …)" | removed; the number stays, so "Step 3.2" still resolves |
| ruling and decision ids (`R-d-8`, `R-crc-6`, `D-c1-2`, `D-d2-6`, `D1`) | removed; where an id is part of a name ("R-d-8 residency sweep", "R-crc-6's three lanes"), the name stays without it, the same at every use in the body |
| mirror notes (thirteen: archive 1, verify 1, propose 5, review 3, address-reviews 2, architect 1) | removed: the sentences or clauses that say the text is a copy, name its owner, say why the copy exists, or tell authors not to edit it; every other sentence or clause of the paragraph stays, and the copied text stays byte-equal, held by its parity test |
| owning-spec citations in headings | removed; the heading's own words and number stay |
| spec citations in prose | removed when the sentence gives the same instruction without it; kept where the citation names something the agent acts on, or where a requirement asks the body to name it (`Severity ladder`'s "SHALL NAME this ladder"; `Review mode decision framework`'s "the bodies that compose briefs name it") |

**The removal unit.** A removal takes only provenance and the connectors that join it to its sentence; every other
word of the paragraph or bracket stays. A span is COVERED by these patterns when, after the mirror-note sentences and
clauses it holds are taken out whole, every remaining character is a match of a token pattern or a connector:

```
CONNECTORS             whitespace, the marks — – - , ; : ( ), and the words per, see, by, since, from, in, at, of, the, its, and
stage tag              D-arc(?:'s)?(?: Stage D[0-9])?  |  Stage D[0-9]  |  \bC[0-9]\b  |  \brc[0-9]{2}[a-z]?\b
NEW marker             \bNEW(?= Step )  |  orbit named edit
ruling or decision id  \bR-[a-z0-9]+-[0-9]+(?:'s)?\b  |  \bD-[a-z0-9]+-[0-9]+(?:'s)?\b  |  \bD[0-9]{1,2}\b
spec citation          `orbit-[a-z-]+`(?:'s?)?(?: (?:`[^`]+`|"[^"]+"|\*\*[^*]+\*\*)(?: requirement)?)?
mirror note            a whole sentence or clause containing, in any case: checked mirror, mirror of, parity test,
                       installed skill, has no specs, cannot open, never edit it here, the owner, its owner,
                       the grammar module supplies it
```

The patterns decide FORM: a span they cover may still name something the agent acts on, which the prose-citation row
above keeps by judgement and a grep of the specs before each removal. The kinds were found by pattern over the
generated bodies at `a5ba0f0c` and by reading the hits; the set is BOUNDED,
and its named limit is this:

Residual kind: a provenance form outside the six above (a coined tag, an archive name, a pointer to orbit's own history)
Residual method: reading each tightened body whole after its edits, recording each find in the change's account and leaving it in place for the evaluation, and the removal test, which lists every removed span with its kind

Explore, onboard and bulk-archive keep their own text until `reduce-orbit-phase1`'s evaluation, and so does the
disciplines epitome's opening line, which explore and bulk-archive share; specs keep their own tags. A step heading's
citation leaves the body's basic content only: the full step a reference file carries stays byte-equal to the block
`moved-blocks.test.ts` records.

#### Scenario: A stage tag leaves a heading and its number stays

- **WHEN** archive's body is generated
- **THEN** its user-validation closure heading reads "Step 3.2 — User-validation closure", with no `NEW` and no
  `(rc10)`

#### Scenario: A mirror note goes and the copy stays

- **WHEN** review's body is generated
- **THEN** no sentence before its pass-genre table says it is a CHECKED MIRROR, and the table is byte-equal to
  `Review mode decision framework`'s fence

#### Scenario: A citation a requirement asks for stays

- **WHEN** review's body assigns a severity
- **THEN** it still names `orbit-conventions`' Severity ladder, as that requirement asks

#### Scenario: An instruction beside a mirror note stays

- **WHEN** review's body is generated
- **THEN** the mirror note before its pass-genre table is gone, and "The pass genre is a record and a header word; the
  gate reads nothing of it." still stands there

#### Scenario: An id that names a thing drops at every use

- **WHEN** architect's body is generated
- **THEN** it says "residency sweep" wherever it said "R-d-8 residency sweep", and carries no `R-d-8`

### Requirement: An edit ledger holds every tightened body to its recorded text

The system SHALL hold every edit `tighten-bodies` makes to a body's instructions — in the twelve bodies it tightens,
and in explore and bulk-archive for the shared decision-writing bullet — in an edit-ledger test: the sha256 of each
edited body's `instructions` is recorded before the first edit, and the test lists every edit as a (before, after)
pair of one kind, checks each kind, and undoes every pair on today's body to compare with the recorded hash:

| member | covered by |
|---|---|
| a Guardrails line removed as restated | a pair of kind `restated`, naming the step line that states it; the test asserts that line is still in the body |
| a provenance span removed | a pair of kind `provenance`; the test asserts the removed span is COVERED by the patterns in `Tightened bodies carry no provenance` — every character a token match or a connector once its mirror-note sentences are taken out — so no instruction is filed as provenance |
| an id dropped from a name | a pair of kind `provenance` at each use; the test asserts the id-bearing name occurs nowhere in the body |
| a mirror note removed | a pair of kind `provenance`; the copied text after it is held unchanged by its parity test |
| the decision-writing bullet restructured | one pair of kind `restructured`, shared by the fourteen bodies; the test asserts each clause of the one-paragraph form (the five conditions with their glosses, the eighteen areas, the three commands (`orbit emit stop`, `orbit emit resolution`, `orbit emit ledger`), the seam sentence, the record-routing sentence, the reference pointer) is in the new one |
| review's flag row naming its two prompt references | a pair of kind `link` |
| any edit the list misses | the undo of every pair no longer matches the recorded hash, and the test fails |

The closure is DERIVED: the reconstruction equals the recorded hash only when the pairs account for every changed
byte. Each check carries a mutation shown to make it fail. An existing test SHALL change only to follow its
instruction to the text that remains, or a requirement this change modifies, and each such edit is named in the
change's archive (RG0):

| member | covered by |
|---|---|
| `chain-prompt-tags.test.ts`' rows for apply's Guardrails lines 4 and 7 | removed: the step 6 lines that state them already have their own rows, so the instruction's home stays asserted; the row for the kept line 3 is unchanged |
| an assertion that includes a provenance string (`NEW Step`, `(rc04a)`, `D-arc Stage`, a spec citation in a heading) | keeps its instruction and drops the provenance |
| a parity test anchored on a `CHECKED MIRROR` note | takes a new anchor on the copied text itself (a heading or the fence's first line); its byte-equality assertion is unchanged |
| a test tagged to a scenario this change modifies | follows the modified scenario |
| the decision-writing parity test | follows the restructured form, the constant still held byte-equal in fourteen bodies |
| `skill-templates-parity.test.ts`' per-body hashes | re-recorded, as for any template edit |
| `skill-body-budget.test.ts`' ceilings | each lowered to its body's new size plus 5% as a named edit, or kept where that would exceed it; explore's line ceiling and the assertion holding it at 664 follow `reduce-orbit-phase1`'s R-rop-8 and RG3 as amended to 669, the one rise |
| an assertion pinning removed text that fits none of the rows above | stops the edit: it is raised, not edited to pass |

The second table is sourced from a grep of `test/` for each removed string, the strings taken from the ledger's pairs.

#### Scenario: An unlisted edit fails the ledger

- **WHEN** a word is removed from a tightened body and no pair lists it
- **THEN** the undo of every pair does not match the recorded hash, and the test fails naming the body

#### Scenario: An instruction filed as provenance fails

- **WHEN** a pair of kind `provenance` removes a span the patterns do not cover — a mirror note together with the
  instruction after it, "The pass genre is a record and a header word; the gate reads nothing of it."
- **THEN** the test fails naming the pair and the words left uncovered

#### Scenario: A restated line needs its step line

- **WHEN** a pair of kind `restated` names a step line the body no longer carries
- **THEN** the test fails naming the pair

#### Scenario: A clause dropped from the bullet fails

- **WHEN** the decision-writing bullet loses a clause of its one-paragraph form
- **THEN** the test fails naming the clause
