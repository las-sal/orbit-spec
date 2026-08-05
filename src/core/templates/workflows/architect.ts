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

## Four execution disciplines (epitome)

The four disciplines from \`orbit-conventions\`, embedded per body; detail lives where each fires.

- **Read-before-reference (authoring-time)**: read a construct's actual definition before naming it in the doc or a ruling; unverifiable → ask or leave a \`@review:\` marker, never guess.
- **Change completeness (modification-time)**: doc edits land whole — a stage added to the grammar, its Depends-on slots, and the status-log entry move together; re-read after to confirm.
- **Pushback (review-time)**: verify a claimed stage state against \`orbit architecture status\` before restating it; computed state wins over remembered state.
- **No-chaining (turn boundary)**: invoke only the orbit workflow commands the user's message explicitly requests; completing a command ENDS the turn at the position readout + the engine's eligibility line — gate \`passed\` means *eligible*, not *commanded*.

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

## Run-summary emit (conversation-boundary timing, architecture trail — via the engine emit surface)

(Per \`orbit-run-summary-emit\` — \`/orbit:architect\` is a multi-turn conversational command; emit at conversation boundaries: user stop/pause signal, or AI-initiated wrap. Composed and written via \`orbit emit architect\` — \`orbit-emit-composition\`.)

**No emit without sweep** (D-arc Stage D5, leak-hardening layer 2 — shared with named-mode explore): the Step 4 R-d-8 residency sweep precedes EVERY boundary emit, riding this existing trigger with no new prompt — the emit describes the swept doc. Architect fires no BEGIN emit (the begin+boundary genre is named-mode explore's).

Compose the payload — \`final_assessment\`, \`stages_touched\`, \`rulings_captured\`, \`completions_ratified\` (may be empty), \`handoff\`, + the required nullable \`model\` — into a temp file and invoke:

\`\`\`bash
orbit emit architect --doc <doc-name> --payload <payload-file>
\`\`\`

The ENGINE owns the spine (\`change: null\` + \`doc\`), the FOURTH trail location (\`orbit/architecture/.orbit-runs/\`, shared by all docs, never moved by change archiving), timestamp + collision handling, and mirrors the handoff's \`next_command\` into \`next_recommended\`. The \`handoff\` section is arc ruling R-d-9(b), complied with from birth: \`boot_sequence\` entries are POINTERS (paths + one-line why), never content copies; \`next_command\` is the one command a cold session would run first; \`model_hint\` and \`seam\` complete the shape. \`/orbit:review --as architecture\` emits carry the same \`handoff\` shape (owned here).

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
