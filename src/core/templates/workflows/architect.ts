/**
 * Skill Template Workflow Modules
 *
 * orbit program-layer workflow (D-arc Stage D2): /orbit:architect — author and resume
 * architecture docs in the parseable format, with engine-rendered state (never
 * hand-written), the completion-ratification flow, and the architecture-trail emit.
 * Fully orbit-authored (no upstream-derived content); scope is D-d2-6's ladder rungs
 * 1–5 only. `architect` is a NEW authoring-genre verb — it fits none of the
 * check-command prefixes (verify-/review-/audit-) because it authors rather than
 * checks; justified by explore D-d2-6 and arc ruling R-d-1.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getArchitectSkillTemplate(): SkillTemplate {
  return {
    name: 'orbit-architect',
    description:
      'Author or resume an architecture doc (program layer above changes): parseable stage declarations, ruling capture, engine-rendered state, and the completion-ratification flow. Never a required entry point — /orbit:explore plus hand-editing remains first-class.',
    instructions: `Enter an architect session against one architecture doc under \`orbit/architecture/\`. This is the PROGRAM layer — cross-change structure (premise, rulings, stages with charters and exit criteria) — sitting above per-change flow. The session captures program-level material into the doc the way \`/orbit:explore\` captures decisions, while ALL state rendering comes from the engine.

**Input**: Optional \`<doc-name>\` (the filename stem — the doc's citable identity). With a name: create \`orbit/architecture/<doc-name>.md\` if absent, or resume the existing doc. Bare: list docs via \`orbit architecture status\` and prompt selection via **AskUserQuestion** (offering create-new).

**Never a gatekeeper**: architecture authoring via \`/orbit:explore\` plus hand-editing remains a first-class path. This command is a stance, not a checkpoint — no orbit surface requires an architect session, no validation or drift check flags architecture content for having originated outside one, and the canonical flow (explore → propose → …) is unchanged by this workflow's existence.

## Four execution disciplines (apply throughout this command)

**Read-before-reference (authoring-time)**. Before writing a ruling, stage declaration, or considered-and-out entry that names a specific construct (a capability, a command, a file path, a prior ruling ID), read the actual definition. A program doc's rulings constrain future stages; false-precision references corrupt the constraint. If you can't verify, ask the user rather than guessing.

**Change completeness (modification-time)**. When a session edit touches structure the engine reads (stage headings, \`Depends-on:\` / \`Complete:\` slots), run \`orbit architecture validate <doc>\` before the session ends — a typo'd heading is a VALIDATION ERROR (malformed), never a silent downgrade to legacy. When a ruling supersedes an earlier one, update both entries (the superseded ruling gains a supersession note; never silently deleted).

**Pushback (review-time)**. When the user asserts something is already ruled or already captured, verify against the doc's current content before re-writing it. Don't re-litigate ratified rulings; don't duplicate an existing entry under a new ID.

**No-chaining (turn boundary)**. Invoke at most the orbit workflow commands the user's message explicitly requests — one command per explicit user request; recommend, never invoke. Completing a command ENDS the turn at the position readout and the engine's eligibility line; blanket delegation covers work WITHIN the requested command, never the next command — gate \`passed\` means *eligible*, not *commanded*.

## Steps

### 1. Resolve the doc

- **Named**: \`/orbit:architect <doc-name>\` targets \`orbit/architecture/<doc-name>.md\`.
- **Bare**: run \`orbit architecture status --json\`; present the docs (parseable with their computed positions; legacy as opaque; malformed flagged toward validate) via **AskUserQuestion**, with a create-new option.

### 2. Create (doc absent) — scaffold the parseable format

Write the doc scaffolded in the parseable structure BY CONSTRUCTION — format correctness never depends on prose memory:

\`\`\`markdown
# Program: <doc-name>

> Position is COMPUTED — run \\\`orbit architecture status\\\`. This doc declares; the engine renders.

## Premise

<why this program exists; what it must produce>

## Goals

<the program's falsifiable goals>

## Rulings index

<dated, attributed, addressable IDs — e.g. **R-<doc>-1** (<who>, <YYYY-MM-DD>) — <ruling>>

## Program stages

### Stage <kebab-id> — <title>

Depends-on: (none)
Complete: [ ]

<charter prose; exit criteria>

## Considered & out

<rejected directions with rationale + date>

## Status log

<append-only ledger; the engine never reads it>
\`\`\`

The stage-heading grammar is \`### Stage <kebab-id> — <title>\` (kebab-case id unique in the doc, em-dash separator). The two slot lines are OPTIONAL with omission semantics (absent \`Depends-on:\` = no dependencies; absent \`Complete:\` = unratified); when present they follow the exact grammar \`Depends-on: (none)\` / \`Depends-on: <id>[, <id>…]\` and \`Complete: [ ]\` / \`Complete: [x] <YYYY-MM-DD> (<who>)\`. Everything else — charter prose, exit criteria, rulings, status log — is engine-opaque judgment text.

### 3. Resume (doc exists) — the doc is authoritative

Read the doc AND \`orbit architecture status\` (its computed position) BEFORE any edit. If \`status\` lists the doc as MALFORMED, surface the grammar violations (they point at \`orbit architecture validate <doc>\`) and offer to fix them first — malformed docs are fixed, not extended.

### 4. Session stance: capture as ratified, render never author

During the session, capture program-level material into the doc as it is ratified in conversation, with brief chat acknowledgment ("captured"):

- **Rulings** — appended to the rulings index: dated, attributed, addressable ID.
- **Stage declarations** — heading + slots + charter prose + exit criteria, in the parseable grammar.
- **Considered & out** — rejected directions with rationale + date.

**Render state, never author it**: ALL stage-state and program-position statements come from \`orbit architecture status\` — rendered verbatim, never inferred. The body is PROHIBITED from hand-writing state into the doc: no \`*State:*\` lines, no position summaries duplicating what the engine computes. When the doc predates this contract (carries legacy hand-written state lines), FLAG them for deletion rather than updating them — every hand-maintained state line is a future staleness bug.

**R-d-8 residency sweep at every conversation boundary**: pending recommendations, leanings, and open items discussed but not yet ratified must be file-resident BEFORE the emit writes — written into the owning section (e.g. an open question's standing-recommendation slot). Chat is never the store of record.

### 5. Completion-ratification flow (the body's one AskUserQuestion)

When \`orbit architecture status\` shows a stage quiescent-awaiting-ratification (all citing work archived, \`Complete:\` slot unratified), SURFACE it and ask via **AskUserQuestion** — **ratify** / **not yet**:

- **Ratify**: write \`Complete: [x] <YYYY-MM-DD> (<who>)\` into that stage's slot. If the stage was slotless, INSERT the \`Complete:\` line directly after the stage's \`Depends-on:\` line — or directly after the heading when no slots exist (the format's omission semantics). Record the ratified stage id in the session's emit.
- **Not yet**: the slot stays \`[ ]\`, nothing else changes, and the readout continues to render awaiting-ratification.

The body NEVER checks the box on its own judgment, and never nags: the offer fires when the user opens the doc's architect session — not as an interruption elsewhere. (A ratified mark on a NON-quiescent observation is an inconsistency the status render and audit-drift surface; this flow only ever writes marks the engine's observation supports.)

### 6. Out of scope (deliberately — D-d2-6 rungs 6–8)

The body does NOT carry explore-grade thinking-partner stance prose, stage-lifecycle helpers (spin-up/close-out choreography), or retrofit guidance for converting legacy docs. Those are later rungs; v1 is create/resume + capture + render + ratification.

## Run-summary emit (conversation-boundary timing, architecture trail)

(Per \`orbit-run-summary-emit\` — \`/orbit:architect\` is a multi-turn conversational command; emit at conversation boundaries: user stop/pause signal, or AI-initiated wrap.)

Write \`orbit/architecture/.orbit-runs/architect-<TS>.json\` (\`<TS>\` ISO-8601 UTC with hyphens; create the directory if absent — it is the FOURTH trail location, shared by all docs, never moved by change archiving):

\`\`\`json
{
  "command": "architect",
  "timestamp": "<ISO-8601 UTC>",
  "change": null,
  "final_assessment": "<narrative of the session>",
  "next_recommended": "<verbatim eligibility-framed recommendation>",
  "kind": "workflow",
  "doc": "<doc-name>",
  "stages_touched": ["<stage-id>", "..."],
  "rulings_captured": ["<ruling-id>", "..."],
  "completions_ratified": ["<stage-id>", "..."],
  "handoff": {
    "boot_sequence": ["<ordered pointers into existing artifacts — never duplicated substance>"],
    "next_command": "<the one command a cold session would run first>",
    "model_hint": "<model class suited to the next phase, or null>",
    "seam": "<which phase seam this boundary is>"
  }
}
\`\`\`

The \`handoff\` section is arc ruling R-d-9(b), complied with from birth: \`boot_sequence\` entries are POINTERS (paths + one-line why), never content copies; \`completions_ratified\` may be empty. \`/orbit:review --as architecture\` emits carry the same \`handoff\` shape (owned here).

## Output at session end

Render the doc's computed position from \`orbit architecture status\` verbatim, then the eligibility line (\`Ready when you are: <command>\` — never an imperative). Completing this command ENDS the turn there.`,
    license: 'MIT',
    compatibility:
      'Requires orbit CLI (orbit architecture status/show/validate). Composes with /orbit:explore (citation-carrying explorations) and /orbit:review --as architecture.',
    metadata: { author: 'openspec', version: '0.1', capability: 'orbit-architect' },
  };
}

export function getOrbitArchitectCommandTemplate(): CommandTemplate {
  return {
    name: 'ORBIT: Architect',
    description: 'Author or resume an architecture doc (program layer): stages, rulings, engine-rendered state',
    category: 'Workflow',
    tags: ['workflow', 'architecture', 'orbit'],
    content: `Author or resume an architecture doc — parseable stage declarations, ruling capture, engine-rendered state, and the completion-ratification flow.

This command is a thin launcher: invoke the \`orbit-architect\` skill, passing along any arguments given with the command (e.g., \`/orbit:architect [<doc-name>]\`). The skill carries the complete workflow instructions. Do not improvise the workflow from this file; load the skill.`,
  };
}
