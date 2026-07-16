/**
 * Skill Template Workflow Modules
 *
 * orbit editorial workflow (B3): relocated from the overlay's openspec-review skill,
 * orbit-named and scrubbed of overlay-era citations (D-b3-1); persistence prose aligned
 * to the orbit-run-summary-emit baseline where the change's iter-1 review corrected it.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const REVIEW_RUN_SUMMARY_SCHEMA_REFERENCE = `# Reference: review run-summary schema

Each \`/orbit:review\` invocation persists a JSON summary to \`orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json\` where \`<TS>\` is ISO-8601 with hyphens (e.g., \`review-proposal-2026-05-18T14-35-23Z.json\`).

Create \`.orbit-runs/\` if it doesn't exist. The file is **committed** (not gitignored) so iteration history travels with the change into archive.

## Universal spine inheritance

This schema inherits the 6-field **universal spine** from \`orbit-conventions\`'s \`Internal-run JSON summary format\` requirement (see \`orbit/specs/orbit-conventions/spec.md\`):

- \`command\` (matches filename prefix; here: \`"review"\`)
- \`timestamp\` (ISO-8601 UTC; JSON field \`YYYY-MM-DDTHH:MM:SSZ\`; filename \`<TS>\` token \`YYYY-MM-DDTHH-MM-SSZ\` with colons replaced by hyphens for filesystem safety)
- \`change\` (change name string)
- \`final_assessment\` (narrative; the stock final-assessment line)
- \`next_recommended\` (verbatim recommendation, e.g., \`"/orbit:address-reviews <name> --from-file <path>"\`)
- \`kind: "editorial"\` (review is an editorial command per the kind taxonomy)

The schema below documents per-command extensions ADDED to that spine (\`mode\`, \`iteration\`, \`depth\`, \`reviewer_class\`, \`flags\`, \`passes_run\`, \`passes_skipped\`, \`findings_summary\`, \`findings\`, \`stale_suppressed\`, \`iteration_note\`). Per-command extensions are review-specific state; they supplement, not replace, the spine.

## Schema

\`\`\`json
{
  "command": "review",
  "timestamp": "<ISO-8601>",
  "change": "<change-name>",
  "final_assessment": "<stock phrasing from final-assessment table>",
  "next_recommended": "<e.g., '/orbit:address-reviews <name> --from-file <path>' or 'proceed to /orbit:apply <name>'>",
  "kind": "editorial",
  "mode": "proposal" | "system",
  "iteration": <integer, per-mode>,
  "depth": "fast" | "full" | "thorough",
  "reviewer_class": "in-context" | "fresh" | "external",
  "flags": {
    "parallel": false,
    "focus": null,
    "strict": false,
    "fresh": false,
    "mark": false,
    "skip_verify": false
  },
  "passes_run": ["1", "2", ...],
  "passes_skipped": [],
  "findings_summary": {
    "critical": 0,
    "warning": 0,
    "suggestion": 0,
    "by_pass": {
      "1": { "critical": 0, "warning": 0, "suggestion": 0 },
      "2": { "critical": 0, "warning": 0, "suggestion": 0 }
    }
  },
  "findings": [
    {
      "pass": "1",
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "file": "design.md",
      "line": 159,
      "title": "<finding title>",
      "recommendation": "<actionable recommendation>",
      "recommendation_options": [
        { "label": "A", "body": "<option A body>" },
        { "label": "B", "body": "<option B body>" }
      ]
    }
  ],
  "stale_suppressed": [
    {
      "pass": "<pass id>",
      "title": "<original finding title>",
      "evidence": "<grep output or commit hash showing why it's stale>"
    }
  ],
  "iteration_note": "<one-sentence note or null>"
}
\`\`\`

## Field notes

- **\`reviewer_class\`** (C1) is the first-class execution-context field the engine's reviewed-gate convergence reads for cadence class coverage: \`"fresh"\` when the pass ran in a clean context (\`--fresh\`), else \`"in-context"\` (externally-sourced findings in \`external-<as>-<TS>.md\` are structurally \`"external"\`). For emits predating this field the engine infers (\`flags.fresh: true\` → \`fresh\`; \`external-*.md\` provenance → \`external\`; otherwise \`in-context\`), so absence never breaks gate computation.
- **\`iteration\`** is per-mode: proposal-mode and system-mode iterations count separately on the same change.
- **\`passes_run\` / \`passes_skipped\`** are strings (pass IDs); skip reasons go in the report body but not the summary array.
- **\`findings_summary.by_pass\`** mirrors the report's per-pass grouping for quick downstream parsing.
- **\`stale_suppressed\`** captures findings that pushback removed; they don't appear in the user-facing report but do persist here for audit.
- **\`final_assessment\`** is one of the stock phrasings (mode-specific gate text); see the final-assessment table in SKILL.md.
- **\`iteration_note\`** is the one-line "Note: N of these findings appeared in the last run" comparison; \`null\` when this is the first run for the mode.
- **\`recommendation_options\`** is OPTIONAL on each finding. Present only when the finding's recommendation is genuinely disjunctive — multiple defensible paths the user must choose between. Producer-side contract (per \`orbit-review\` spec's \`Optional recommendation_options field on finding entries\`): MUST contain ≥ 2 entries; each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, … or \`"1"\`, \`"2"\`, …) and non-empty \`body\`. The prose \`recommendation\` field still summarizes the disjunction for human readers. Consumer (address-reviews) uses this for the structured decision-fork detection path; absence triggers heuristic fallback. Omit the field for single-recommendation findings.
`;

export function getReviewSkillTemplate(): SkillTemplate {
  return {
    name: 'orbit-review',
    description: "Editorial review of an OpenSpec change or an architecture doc: proposal mode (pre-apply, 9 passes over artifacts), system mode (post-apply, verify-change + 6 system-wide passes), or architecture mode (a doc under orbit/architecture/, 6 passes, no gate). Use when the user wants a second-pair-of-eyes pass before applying or archiving, or a graded pass over a program architecture doc.",
    instructions: `Run an editorial review of an OpenSpec change or an architecture doc. Three modes: \`--as proposal\` reviews a change's pre-implementation artifacts (9 passes); \`--as system\` reviews the whole product state after apply (verify-change as Pass 0 + 6 system-wide passes); \`--as architecture\` reviews an architecture DOC under \`orbit/architecture/\` (6 passes, NO gate — D-arc Stage D2). All modes share the 3-dimension scorecard (Completeness / Correctness / Coherence), the severity ladder (CRITICAL / WARNING / SUGGESTION), pushback discipline, and \`.orbit-runs/\` persistence. They differ on which passes run, what the final-assessment references (the \`review-proposal\` / \`review-system\` gates for the change modes; NO gate in architecture mode), and a few mode-specific flags (\`--mark\` for proposal, \`--skip-verify\` for system).

**Generates findings; does not resolve them.** Resolution flows through \`/orbit:address-reviews\` (inline \`@review:\` markers, OR \`--from-file\` ingesting external-review markdown OR internal review JSON OR audit-drift JSON) or by the user replying directly to the report.

**Input**: Optional change name (or, with \`--as architecture\`, a doc name) and optional \`--as proposal|system|architecture\` mode flag plus secondary flags. If change name omitted, prompt via \`AskUserQuestion\` over \`orbit list --json\` (architecture mode prompts over \`orbit architecture status --json\`'s parseable docs instead). If mode omitted, infer from \`tasks.md\` state (see Step 3) — architecture mode is NEVER inferred.

## Four execution disciplines (apply throughout this command)

These four disciplines are embedded in every orbit command as a self-contained reminder. They bracket the authoring lifecycle (authoring-time / modification-time / review-time / turn boundary) and combine with the per-command behavior below. Intentional text duplication across SKILL.md files is the price for self-contained reliability.

**Read-before-reference (authoring-time)**. When you author a finding that names a specific construct — a function, type, interface, field, file path, spec requirement name, CLI flag, capability name — read the actual definition first. Use \`Read\`, \`grep\`, or \`orbit instructions\` as appropriate. Do NOT assume the shape based on common patterns or training-data conventions. A finding that says \`"foo.ts:42 declares getUser() returning Promise<User>"\` must be backed by an actual file read; otherwise the recommendation is unverifiable and the user has no way to trust the report. If you can't verify the reference, downgrade the severity or omit the finding.

**Change completeness (modification-time)**. The \`--mark\` flag (proposal mode) modifies artifacts by writing \`@review:\` markers based on findings. When \`--mark\` runs, apply the markers fully across all affected artifacts in one pass. After mechanical insertion, sweep for residue (markers landed in the wrong place; markers that overwrite existing content; doubled markers). Do NOT leave the user to clean up partial marker placement. For the non-\`--mark\` path this discipline rarely applies (review is read-only), but if a stale \`.orbit-runs/\` file or partial prior run is discovered, clean it before persisting the new summary.

**Pushback (review-time)**. **Primary discipline for this command.** Before reporting a finding, verify it against current state. Use \`grep\`, file inspection, or \`git log\` to confirm the issue still applies. Stale findings (issue already fixed) get suppressed with an explanatory note (\`stale finding suppressed: <evidence>\`) and not surfaced in the user-facing report. Do NOT re-flag already-fixed state. When prior \`.orbit-runs/review-<mode>-*.json\` summaries exist, compare to surface only what's new or unresolved.

**No-chaining (turn boundary)**. Invoke at most the orbit workflow commands the user's message explicitly requests — one command per explicit user request; recommend, never invoke. Completing a command ENDS the turn at the position readout and the engine's eligibility line; blanket delegation ("run the review cadence") covers work WITHIN the requested command (the passes of one review), never the next command — review-cycle COUNT is the user's call. Gate \`passed\` means *eligible*, not *commanded*.

## Steps

### 1. Resolve the mode, THEN the target

Resolve the MODE first (from the \`--as\` flag — rules in Step 2); the mode decides what the positional even IS. Then resolve the target by mode:

**Change modes** (\`--as proposal\` / \`--as system\`, or \`--as\` omitted) — the target is a CHANGE:
- If a change name is provided, use it. Otherwise:
- Run \`orbit list --json\` to get available changes.
- Use the **AskUserQuestion tool** to let the user select.
- Mark changes with incomplete tasks as \`(In Progress)\`.
- Always announce \`Using change: <name> --as <mode>\` at the start of the report header.

**Architecture mode** (\`--as architecture\`) — the target is a DOC, never a change: do NOT run \`orbit list\`, do NOT prompt over changes, and NONE of the change-oriented steps below (Step 4's change CLI calls, Step 9's gate computation) apply. The positional resolves against \`orbit/architecture/\` (the filename stem). When omitted or ambiguous, prompt via \`AskUserQuestion\` over the parseable docs from \`orbit architecture status --json\`. Always announce \`Using doc: <doc-name> --as architecture\` at the start of the report header.

### 2. Resolve the mode

Mode comes from the \`--as proposal|system|architecture\` flag if specified. **Architecture mode is NEVER inferred** — it requires the explicit \`--as architecture\` flag; a positional that happens to match a doc name does NOT trigger it (misfiring review modes on change names would be a sharp edge). If \`--as\` omitted, infer between proposal and system:

1. Read \`orbit/changes/<name>/tasks.md\`.
2. Count \`- [ ]\` (unchecked) vs \`- [x]\` (checked) boxes.
3. **All unchecked** → infer \`proposal\`.
4. **All checked + repo has code changes since the change was proposed** (use \`git log --oneline -- orbit/changes/<name>/\` and \`git diff\` heuristics) → infer \`system\`.
5. **Mixed or ambiguous** → use \`AskUserQuestion\` to ask the user which mode to run.

State the resolved mode and how it was resolved in the report header (\`Mode: proposal (inferred from 12 unchecked tasks)\`).

**Architecture-mode doc-class rules** (target resolution itself is in Step 1): a doc resolving to LEGACY (zero stage-prefixed headings outside fences) is an error suggesting retrofit; one resolving to MALFORMED (fails \`orbit architecture validate\`'s near-miss rule) is an error naming the grammar violation — architecture mode requires a parseable doc.

### 3. Resolve flags

| Flag | Default | Effect |
|---|---|---|
| \`--fast\` / \`--full\` / \`--thorough\` | \`--full\` | Depth. Mutually exclusive. \`--thorough\` is partially specified; fall back to \`--full\` if unclear. |
| \`--parallel\` | off | Spawn subagents for heavy passes. Proposal: parallelize Passes 2, 4, 6. System: parallelize Passes 2, 3, 4, 5. |
| \`--focus <lens>\` | none | Emphasize specific passes (additive — does not skip others). See "Special-case lenses" below. |
| \`--strict\` | off | Fail-fast on first CRITICAL. Useful for CI-like runs. |
| \`--fresh\` | off | Spawn a clean-context subagent for the main pass work. Useful when current conversation has accumulated anchoring. |
| \`--mark\` | off, proposal only | After report, write \`@review: <text>\` markers at each finding's file:line. See "Mark writer". |
| \`--skip-verify\` | off, system only | Skip Pass 0 (verify-change). Use when verify-change was run separately. |

If a flag is specified for the wrong mode (e.g., \`--mark\` in system mode or \`--skip-verify\` in proposal mode), accept it silently and emit a one-line note in the report (\`Note: --mark writes to source files is v2; ignored for v1 system-mode runs.\`). In architecture mode, \`--parallel\`, \`--fast\`, and \`--focus <lens>\` are accepted but are no-ops (architecture docs are small; all six passes run in one context — no per-mode subset or lens table is defined), each noted in the report the same way.

### 4. Load context

**Architecture mode**: the change-oriented CLI calls below do NOT apply — there is no change. Load instead: the doc itself (\`orbit/architecture/<doc>.md\`), \`orbit architecture status --json\` (computed stage states, for cross-checks), and root \`CLAUDE.md\`; then continue at Step 5. \`orbit architecture show <doc> <stage>\` slices single stages when the whole doc is not needed.

**Change modes** — use the orbit CLI as source of truth:

\`\`\`bash
orbit status --change "<name>" --json
orbit instructions apply --change "<name>" --json
\`\`\`

From the returned \`contextFiles\`, read every artifact: \`proposal\`, \`design\`, \`tasks\`, all paths under \`specs\`. Also read:
- \`orbit/changes/<name>/explore.md\` if present
- \`orbit/changes/<name>/sketches/\` if present
- Project context: \`CLAUDE.md\` (root), \`orbit/project.md\`, any \`*_convention.md\` at project root
- Baseline: \`orbit/specs/*/spec.md\`
- Orbit lenses: \`orbit/lenses/perspectives.md\`, \`orbit/lenses/critical-paths.md\` (system mode primarily; proposal mode uses for cross-doc checks)

System mode also reads:
- \`git diff <change-start>..HEAD\` (estimate \`<change-start>\` from \`git log\` against \`orbit/changes/<name>/\`)
- Code paths around the change (cohesion + surface walks)

### 5. Inspect prior runs

**Architecture mode**: inspect \`orbit/architecture/.orbit-runs/\` for prior \`review-architecture-*.json\` emits whose \`doc\` field MATCHES the doc under review — the trail is shared by all docs, so only matching-\`doc\` emits count toward the iteration number and the iteration note (a review of doc B must never treat doc A's run as its previous iteration). First-run wording: \`First architecture review for this doc.\`

**Change modes**: check \`orbit/changes/<name>/.orbit-runs/\` for prior \`review-<mode>-*.json\` summaries:

- Count matching the current mode → iteration number (1 if none).
- Load the most-recent matching summary to identify open vs resolved findings since last run.
- This data fuels the iteration note (Step 8) AND the pushback discipline (suppress findings already resolved).

### 6. Run passes

Run the mode-specific pass set sequentially (or in parallel for the marked passes when \`--parallel\` is on). For each pass:

1. Apply the read-before-reference discipline to every cited construct.
2. Apply the pushback discipline against current state.
3. Emit findings tagged CRITICAL / WARNING / SUGGESTION with file:line + actionable recommendation.

### Disjunctive recommendations: emit structured \`recommendation_options\`

When a finding's recommendation is genuinely disjunctive — offering the user a choice between two or more concrete alternatives (e.g., "Either file a follow-up issue, or extend scope to tasks.md" / numbered alternatives \`(A) … (B)\` / "Options: X / Y") — emit an optional structured field alongside the prose \`recommendation\`:

\`\`\`json
{
  "pass": "...",
  "severity": "WARNING",
  "file": "...",
  "line": ...,
  "title": "...",
  "recommendation": "Either (A) file a follow-up issue tracking the v2 polish, or (B) add Group 19 to tasks.md extending this change's scope.",
  "recommendation_options": [
    { "label": "A", "body": "file a follow-up issue tracking the v2 polish" },
    { "label": "B", "body": "add Group 19 to tasks.md extending this change's scope" }
  ]
}
\`\`\`

**When to emit** \`recommendation_options\`:

- The finding genuinely requires a USER choice between defensible paths (different outcomes; not just rewordings).
- ≥ 2 options. (Single-option arrays defeat the purpose; the prose \`recommendation\` field carries single recommendations.)
- Each entry has non-empty \`label\` (use \`"A"\`, \`"B"\`, \`"C"\`, … or \`"1"\`, \`"2"\`, …) and non-empty \`body\` (the concrete action the user would take).

**When NOT to emit**:

- Single concrete action with no alternative (rename X → Y; remove duplicate; tighten a type signature). The prose \`recommendation\` field alone is sufficient.
- Prose containing "or" that is NOT a real choice ("fix it now or later", "X or Y could happen"). Loose "or" is conversational, not disjunctive — do NOT trigger the structured field.

**Prose summary still required**: when emitting \`recommendation_options\`, the prose \`recommendation\` field still summarizes the disjunction for human readers of the markdown report. The structured field is a producer-side affordance for the consumer (address-reviews) to surface as a structured fork prompt; it complements the prose, does not replace it.

**Backward compatibility**: the field is OPTIONAL on every finding. Findings without disjunctive recommendations omit it. Downstream parsers SHALL ignore the field if unknown (forward-compat). See \`references/run-summary-schema.md\` for the canonical JSON shape.

#### Proposal-mode passes (9)

\`\`\`
PASS                                  WHAT IT CHECKS
─────────────────────────────────────────────────────────────────────
1. Structure & Delta Integrity        artifacts present; delta sections valid;
                                       orbit validate passes
2. Internal Coherence                 proposal/design/specs/tasks align;
                                       counts consistent; no scope creep
3. Cross-Doc Coherence                CLAUDE.md / project.md / *_convention.md
                                       still accurate after this change
4. Archive Consistency                ADDED don't contradict baseline; RENAMED
                                       FROM exists; REMOVED not still referenced
5. Codegen Readiness                  no implicit requirements; no ambiguity;
                                       no decisions left to codegen
6. Gap Hunt (generative completeness) could a fresh AI implement this from
                                       these specs alone? unstated assumptions?
                                       error paths? state transitions?
7. Drift Hunt                         old vocabulary lingering; consistency
                                       with *_convention.md
8. Inline Review Marker Residue       any @review: markers still present?
                                       (CRITICAL — must address before apply)
9. Pre-Handoff Sweep                  small things missed on first read
\`\`\`

**Pass 1 — Structure & Delta Integrity**. Run \`orbit validate "<name>"\`; confirm required artifacts present; check delta sections (ADDED/MODIFIED/REMOVED/RENAMED Requirements) follow the delta-spec format. CRITICAL on validate failure; WARNING on delta-section anomalies; SUGGESTION on cosmetic issues.

**Pass 2 — Internal Coherence**. Compare proposal / design / specs / tasks: scope alignment, design-to-requirement mapping, requirement-to-task coverage, count consistency, no scope creep. CRITICAL when a spec requirement has no task; WARNING on count/label disagreement.

**Pass 3 — Cross-Doc Coherence**. Will \`CLAUDE.md\`, \`orbit/project.md\`, \`*_convention.md\` files still be accurate post-apply? Look for renamed concepts referenced under old names, new capabilities missing from project context, conventions contradicting deltas. WARNING for stale post-apply context; SUGGESTION for enrichment.

**Pass 4 — Archive Consistency**. ADDED requirements don't conflict with archived baseline; RENAMED FROM names exist in archive; REMOVED requirements aren't still referenced. CRITICAL on direct contradiction; WARNING on dangling references.

**Pass 5 — Codegen Readiness**. Per requirement: precise enough that two implementers produce the same code? Inputs/outputs/side effects stated? Hidden assumptions ("the obvious path", "the usual default") made explicit? WARNING for ambiguity that could split implementations.

**Pass 6 — Gap Hunt (generative completeness)**. Per requirement in spec deltas, probe: (a) unstated assumptions an implementer would have to invent? (b) error/edge-case paths specified, not just happy paths? (c) state transitions explicit, including invalid ones? (d) "X SHALL do Y" — Y precise enough? Cite file:line + the specific gap; suggest concrete spec additions.

**Pass 7 — Drift Hunt**. Search artifacts for old vocabulary the change is replacing. Grep change directory AND project docs (\`*_convention.md\`, \`project.md\`, \`CLAUDE.md\`). CRITICAL when a delta itself uses old vocab; WARNING when project docs do.

**Pass 8 — Inline Review Marker Residue**. Grep change directory for \`@review:\` markers. **Actual unresolved markers** in artifact content → CRITICAL (must address before applying). **Documentation appearances** inside fenced code blocks, inline-code spans, or explicit "example" prose contexts → NOT findings. When ambiguous, classify as CRITICAL.

**Pass 9 — Pre-Handoff Sweep**. Final read asking "what would I be embarrassed to ship?" — awkward wording, stale TODO/FIXMEs in artifacts, inconsistent capitalization, examples that don't match prose. Almost always SUGGESTION.

##### \`--fast\` subset (proposal mode)

When \`--fast\` is set, run only Passes 1, 7, 8. Report remaining passes as \`skipped per --fast\`.

#### System-mode passes (0–6)

\`\`\`
PASS                                  WHAT IT CHECKS
─────────────────────────────────────────────────────────────────────
0. verify-change (delegated upstream) tasks done; spec coverage; design
                                       adhered (full verify-change findings)
1. Baseline Compliance                does this change break archived
                                       baseline requirements?
2. Cohesion                           callers/dependents outside the tasks —
                                       signature drift, ripple effects
3. Surface Walk                       every CLI/MCP/HTTP surface still
                                       coherent? (surfaces derived from specs)
4. Perspective Reviews                from each registered caller-perspective
                                       in lenses/perspectives.md
5. Critical-Path Scan                 each flow in lenses/critical-paths.md,
                                       walked end-to-end
6. Drift / Residue                    calls /orbit:audit-drift as a library
\`\`\`

**Pass 0 — verify-change delegation**. Invoke the \`orbit-verify-change\` skill via \`/orbit:verify <change-name>\`. Fold its findings into the scorecard: task-completion + spec-coverage → Completeness; requirement-implementation-mapping + scenario-coverage → Correctness; design-adherence + code-pattern-consistency → Coherence. If \`--skip-verify\` set, omit Pass 0 with note \`Pass 0: skipped per --skip-verify\`.

**Pass 1 — Baseline Compliance**. Read every requirement in archived \`orbit/specs/*/spec.md\` (not just deltas). Does the change break any baseline behavior? CRITICAL on violation; WARNING on regression risk.

**Pass 2 — Cohesion**. Files the change touched (from \`git diff\` + tasks list). Walk callers/dependents not in the change's tasks for signature drift, semantic shifts, new side effects. CRITICAL when downstream clearly broken; WARNING for contract drift.

**Pass 3 — Surface Walk**. Enumerate surfaces from \`orbit/specs/<capability>/spec.md\` — **capabilities ARE surfaces**; do not redefine them in lenses. Check each (CLI flags / subcommand names, HTTP routes, MCP tool names, public function signatures) remains coherent after the change. CRITICAL when a surface was removed unintentionally; WARNING for inconsistencies.

**Pass 4 — Perspective Reviews**. If \`orbit/lenses/perspectives.md\` exists and is non-empty: for each named perspective, simulate typical call patterns from that caller's POV. Flag SUGGESTION/WARNING when interactions are awkward, inconsistent, or surprising from that POV. If the file is empty or absent, skip Pass 4 with the note \`no perspectives defined; skip Pass 4\`.

**Pass 5 — Critical-Path Scan**. If \`orbit/lenses/critical-paths.md\` exists and is non-empty: for each named flow, walk the code end-to-end checking for breakage, regression, or drift. CRITICAL for path breakage; WARNING for regression risk. If absent, skip with \`no critical paths defined; skip Pass 5\`.

**Pass 6 — Drift / Residue**. Invoke \`/orbit:audit-drift\` as a library function (via the orbit-audit-drift skill). Fold its findings into the report under the Coherence dimension. Audit-drift handles its own scorecard and severity assignment; preserve those.

##### \`--fast\` subset (system mode)

When \`--fast\` is set, run Passes 0, 1, 6. Report remaining as \`skipped per --fast\`. Combining \`--fast --skip-verify\` runs only Passes 1 and 6.

#### Architecture-mode passes (6)

The target is an architecture DOC, not a change; findings cite \`<doc>.md:line\`. Read the doc AND \`orbit architecture status --json\` (computed stage states, for cross-checks) before the passes. The pass set (dogfooded by hand on the D-arc, 2026-07-08):

\`\`\`
PASS                                  WHAT IT CHECKS
─────────────────────────────────────────────────────────────────────
1. Cohesion / traceability            rulings, stages, and premise agree;
                                       stage charters trace to goals
2. Completeness / exit-criteria       every stage carries falsifiable exit
                                       criteria; charter items covered by
                                       stage content
3. Dependencies / sequencing          Depends-on: declarations match the
                                       sequencing prose; no cycle exists
4. Layer-fit                          content sits at the right tier
                                       (arc-level rulings vs stage-level
                                       detail, per the doc's ownership rule)
5. Route-level alternatives           major directions record what was
                                       considered and rejected
6. Economy self-audit                 the doc's read-cost story holds (what
                                       a session must load; what the engine
                                       renders vs prose re-narrates)
\`\`\`

No \`--fast\` subset: all six passes always run (the flag is a noted no-op in this mode, as are \`--parallel\` and \`--focus\`).

### 7. Apply scorecard rollup

Roll every pass's findings into the 3-dimension scorecard.

#### Proposal-mode mapping

| Dimension | Passes contributing |
|---|---|
| **Completeness** | 1 (Structure & Delta), 5 (Codegen Readiness), 6 (Gap Hunt) |
| **Correctness** | 2 (Internal Coherence), 4 (Archive Consistency) |
| **Coherence** | 3 (Cross-Doc), 7 (Drift Hunt), 8 (Inline Marker Residue), 9 (Pre-Handoff) |

#### System-mode mapping

| Dimension | Passes contributing |
|---|---|
| **Completeness** | Pass 0 (verify-change completeness portion: task-completion + spec-coverage), Pass 5 (critical-paths existence) |
| **Correctness** | Pass 0 (verify-change correctness portion: requirement-implementation-mapping + scenario-coverage), Pass 1 (Baseline), Pass 2 (Cohesion), Pass 5 (critical-paths working) |
| **Coherence** | Pass 0 (verify-change coherence portion: design-adherence + code-pattern-consistency), Pass 3 (Surface Walk), Pass 4 (Perspective Reviews), Pass 6 (Drift/Residue from audit-drift) |

#### Architecture-mode mapping

| Dimension | Passes contributing |
|---|---|
| **Correctness** | 1 (Cohesion / traceability), 2 (Completeness / exit-criteria), 3 (Dependencies / sequencing) |
| **Completeness** | 2 (Completeness / exit-criteria) |
| **Coherence** | 4 (Layer-fit), 5 (Route-level alternatives), 6 (Economy self-audit) |

### 8. Generate the iteration note

If \`.orbit-runs/\` has prior summaries matching this mode (architecture mode: matching mode AND \`doc\`, per Step 5 — never cross-doc):

- Compare current findings to the most-recent matching prior run.
- Count how many findings repeat (same file:line + same severity + similar title).
- Emit a one-sentence note in the report: \`Note: N of these findings appeared in the last run on <date>. M new this run.\`

If no prior matching summaries: emit \`First <mode>-mode run for this change.\` or omit the iteration note entirely.

### 9. Emit the final assessment

(Change modes only — architecture mode has NO gate; its final assessment is specified in the \`Architecture mode — NO gate\` subsection below and never runs the gate computation.)

**Single-voiced + engine-sourced (C1).** The final assessment renders the ENGINE-computed gate state (one of the convergence states below) plus ONE canonical next command — never a bare "Ready to apply" / "Ready to archive" and never an advertised skip path. Compute the gate verdict from \`orbit status --change <name> --json\` (fields \`gates[]\`, \`position\`, \`next_command\`) — the engine reads the \`.orbit-runs/\` trail. **As-of-completion**: evaluate the gate as-of THIS pass's completion — fold in a synthetic pass for the run you are finishing (its mode, reviewer_class, a now-token, the about-to-be-written \`review-<mode>-<TS>.json\`, and this run's findings) so a current \`--fresh\`/\`in-context\` pass counts toward its cadence slot. If this pass has findings, the address-reviews command targets the just-written \`review-<mode>-<TS>.json\`.

#### Proposal mode

| Gate state | Phrasing |
|---|---|
| ≥1 CRITICAL | \`X critical issue(s) found. Fix before /orbit:apply.\` |
| A gate-relevant pass has unresolved findings | \`No critical issues. Y warning(s) to consider. A prior gate-relevant pass has unresolved findings; gate review-proposal UNPASSED. Ready when you are: /orbit:address-reviews <change> --from-file <unresolved-path>.\` |
| No fresh independent pass (leading slot uncovered) | \`... gate review-proposal UNPASSED — the cadence's independent slot is uncovered. Ready when you are: /orbit:review --as proposal --fresh <change> — independent cross-check required by the review cadence before apply (per orbit-conventions Review mode decision framework).\` |
| Independent pass yielded new findings (no-new-findings not met) | \`... gate review-proposal UNPASSED until an independent pass yields none. Ready when you are: /orbit:review --as proposal --fresh <change>.\` |
| Independent converged, trailing in-context slot uncovered | \`... Independent review converged; gate review-proposal needs its closing in-context confirm. Ready when you are: /orbit:review --as proposal <change>.\` |
| Gate passed | \`All checks passed. gate review-proposal PASSED. Ready when you are: /orbit:apply <change> — user-invoked.\` (Only-W/S opener: \`No critical issues. Y warning(s) to consider.\` + \`... Ready when you are: /orbit:apply <change> (with noted improvements) — user-invoked.\`) |

(Openers: \`All checks passed.\` when this pass is clean, else \`No critical issues. Y warning(s) to consider.\` The unresolved-pass branch takes precedence over all other no-CRITICAL branches. v1: a proposal pass never goes stale — no stale state. Labels are eligibility-framed per \`orbit-engine-gates\` (D1): \`Ready when you are:\` — never an imperative next-step label — with \` — user-invoked\` appended when the recommended command enters a consent-marked phase (\`/orbit:apply\`, \`/orbit:archive\`).)

#### System mode

| Gate state | Phrasing |
|---|---|
| ≥1 CRITICAL | \`X critical issue(s) found. Fix before /orbit:archive.\` |
| No prior external (leading in-context covered) | \`All checks passed (in-context pass). Ready when you are: /orbit:review-external --as system <change> — external cross-check required by the review cadence before archive (per orbit-conventions Review mode decision framework; in an early dogfooding cycle, in-context system review missed 3 of 3 real implementation bugs — all caught by external review).\` |
| Path A — external clean, gate PASSED | \`All checks passed. External system review (clean) converged; gate review-system PASSED. Ready when you are: /orbit:archive <change> — user-invoked.\` |
| Path B — external resolved, 0 CRITICAL, gate PASSED | \`All checks passed. External system review findings resolved via /orbit:address-reviews; gate review-system PASSED. Ready when you are: /orbit:archive <change> — user-invoked.\` |
| External converged but an ordered slot uncovered | \`... gate review-system is UNPASSED — the cadence's leading in-context slot is uncovered. Ready when you are: /orbit:review --as system <change>.\` |
| External resolved but carried a CRITICAL (confirm unmet) | \`... the prior /orbit:review-external found and resolved a CRITICAL, so gate review-system is UNPASSED until a fresh external yields none. Ready when you are: /orbit:review-external --as system <change>.\` |
| External present with unresolved findings | \`... the prior /orbit:review-external has unresolved findings. Ready when you are: /orbit:address-reviews <change> --from-file <external-path>.\` |
| External stale (apply landed after it) | \`... the prior /orbit:review-external is older than the most recent apply step; gate review-system STALE. Ready when you are: /orbit:review-external --as system <change> — re-validate against current product state.\` |

(Precedence when a gate is unpassed for more than one reason: stale > unresolved > a missing ordered slot (→ in-context) > a failed confirm predicate (→ fresh external). Path A/B render \`PASSED\` ONLY when the engine reports full ordered-slot coverage AND the confirm predicate; otherwise defer to the engine-computed state above. A \`--fresh\` system run does NOT satisfy an \`in-context\` slot.)

#### Iteration-aware logic (system mode, no CRITICAL)

To determine which of States 1–5 applies, inspect \`orbit/changes/<name>/.orbit-runs/\` and resolve in this order:

1. **Presence check** — does any \`external-system-*.md\` exist? If not, return **State 1**.

2. **Stale check (highest precedence)** — for the most recent \`external-system-*.md\`, compare its filename \`<TS>\` token against the most recent \`apply-*.json\` filename \`<TS>\` token (per orbit-conventions \`Internal-run JSON summary format\`; tokens are \`YYYY-MM-DDTHH-MM-SSZ\` — ISO-8601 with colons replaced — and sort lexically). If an \`apply-*.json\` token is later than the external's token, return **State 5** regardless of external content. Per-external scoping: only \`apply-*.json\` triggers stale — unrelated \`address-reviews-*.json\` files (for other inputs) do NOT.

3. **Path A content-clean check** — read the most recent \`external-system-*.md\`. Parse it for findings under \`## CRITICAL\`, \`## WARNING\`, \`## SUGGESTION\` headings. Path A clean = each section contains only the empty-severity sentinel (\`None.\` or one of the accepted equivalents — \`None\`, \`none.\`, \`(none)\` — per \`orbit-address-reviews/references/external-findings-format.md\`) with zero \`### <title>\` entries beneath. If clean and not stale, return **State 2**.

4. **Path B resolution check** — find the most recent \`address-reviews-*.json\` whose \`source_path\` field (canonicalized to repo-relative form before comparison; absolute paths are accepted only after the same normalization) references the external markdown file. If such a JSON exists AND \`resolution_summary.deferred == 0\` AND \`resolution_summary.escalated == 0\`, the external's findings were walked to completion — return **State 3**. Per-external scoping: address-reviews-*.json files for OTHER inputs do NOT affect this external's convergence.

5. **Unresolved findings** — external is present with \`### <title>\` entries beneath at least one severity AND no Path B resolution applies (no matching address-reviews OR most recent matching one has \`deferred > 0\` or \`escalated > 0\`). Return **State 4**.

**Edge-case assumptions for v1** (per the spec's \`Edge-case assumptions for the iteration-aware logic\` scenario):
- Multiple matching files of same type → most-recent filename \`<TS>\` token wins (lexical sort).
- Unparseable filename token → treated as absent for comparison purposes.
- External markdown parse failure → treated as NOT-clean (defaults to State 4 or 5).
- \`address-reviews-*.json\` parse failure → treated as if no address-reviews ran for that external (defaults to State 4).
- Dangling \`source_path\` (references non-existent file) → ignored for convergence detection.

**Precedence rules** (when multiple states could match):
1. State 5 (stale) > all others — artifacts changed; external's evaluation no longer trusted.
2. State 4 (unresolved) > State 2/3 — unresolved findings beat a stale-but-resolved external.
3. States 2 and 3 are mutually exclusive (Path A clean and Path B resolved cannot both apply to the same external).

**Iteration-aware logic does NOT block archive**: the recommendation is advisory, not a gate. The user retains the choice to skip; orbit surfaces the recommendation but does not enforce. (Decision to NOT add a pre-archive external-review-presence check is intentional — orbit's role is to surface, not gate.)

#### Architecture mode — NO gate

No gate exists over architecture docs (review standing without a gate — D-arc D-d2-5), so the architecture-mode final assessment NEVER says PASSED/UNPASSED of a gate and never references a lifecycle command. It renders findings counts plus ONE canonical next command:

| State | Phrasing |
|---|---|
| Findings present | \`X critical / Y warning(s). Ready when you are: /orbit:address-reviews --from-file <the just-written review-architecture emit>.\` |
| All clear | \`No findings. The architecture trail records this pass.\` |

Labels follow D1's eligibility phrasing; the findings are ingestible by \`/orbit:address-reviews\` exactly like other internal review JSON (including \`recommendation_options\` on disjunctive findings). On all-clear, no command is recommended — the trail records the pass and the turn ends at the readout.

### 10. Persist the run summary

Write JSON per mode: to \`orbit/changes/<name>/.orbit-runs/review-<mode>-<TS>.json\` for \`proposal\` and \`system\` modes, and to \`orbit/architecture/.orbit-runs/review-architecture-<TS>.json\` for \`architecture\` mode (the architecture trail — the fourth persistence location; never moved by change archiving). ISO-8601 timestamp (e.g., \`review-proposal-2026-05-18T14-35-23Z.json\`). The full schema (fields, types, semantics) lives at \`references/run-summary-schema.md\` — read that file when composing the summary. Architecture-mode emits carry \`change: null\`, a \`doc\` field naming the reviewed doc, and — per arc ruling R-d-9(b) — the structured \`handoff\` section (\`boot_sequence\` pointers / \`next_command\` / \`model_hint\` / \`seam\`; shape owned by \`orbit-architect\`). Create the trail directory if it doesn't exist; commit-worthy (do not gitignore).

### 11. (Optional) \`--mark\` writer (proposal mode only)

If \`--mark\` is set and the mode is \`proposal\`:

For each finding with severity CRITICAL or WARNING (skip SUGGESTION by default):
- Locate the finding's \`file:line\`.
- Insert a \`@review: <finding title — recommendation>\` marker at that line.
  - In markdown: append after existing content on the line, or as a sibling line if structure prevents inline insertion.
  - In code: wrap in the file's comment syntax (e.g., \`// @review: …\`, \`# @review: …\`).
- After insertion, sweep the modified artifacts for double-insertion or content overwrites; the change-completeness discipline applies.

In system mode, \`--mark\` is accepted but ignored with the note \`--mark writes to source files is v2; ignored for v1 system-mode runs.\`

### 12. \`--parallel\` execution

If \`--parallel\` is set:

- Proposal mode: spawn subagents for Passes 2 (Internal Coherence), 4 (Archive Consistency), 6 (Gap Hunt). Run Passes 1, 3, 5, 7, 8, 9 in the main context.
- System mode: spawn subagents for Passes 2 (Cohesion), 3 (Surface Walk), 4 (Perspectives), 5 (Critical Paths). Run Passes 0, 1, 6 in the main context.

Each subagent gets a focused brief (the pass description + the relevant context files). Merge findings into the unified report. Subagents inherit the four execution disciplines.

### 13. \`--focus\` lens

Lens-specific emphasis (additive — does NOT skip other passes):

| Lens | Mode | Passes emphasized | Why |
|---|---|---|---|
| \`rename\` | proposal | 7 (Drift), 3 (Cross-Doc), 4 (Archive) | renames leak old names |
| \`flip\` | proposal | 2 (Internal Coherence on direction), 5 (Codegen Readiness) | direction must be unambiguous |
| \`refactor\` | both | proposal: 4, 7, 3; system: 2, 6 | old shape ripples into callers/docs |
| \`extension\` | proposal | 6 (Gap Hunt) | coverage must match existing depth |
| \`hotpath\` | system | 5 (Critical-Path Scan) | landed work touched perf/race-sensitive paths |

When \`--focus <lens>\` is set, run all passes but apply elevated rigor (more probes, longer cite chains) to the listed ones.

## Special cases

### Graceful degradation

- **Proposal mode, no \`orbit/specs/\` baseline** → Pass 4 skipped (\`no baseline to check against\`); other passes proceed normally.
- **Proposal mode, no \`*_convention.md\` and no \`project.md\`** → Pass 3 lens-driven cross-checks skipped; rest of Pass 3 (\`CLAUDE.md\` checks) still runs.
- **System mode, empty \`orbit/lenses/\`** → Passes 4 and 5 skipped; Pass 3 still runs against capabilities derived from \`orbit/specs/\`.
- **System mode, \`verify-change\` unavailable** → Pass 0 fails with a note; continue with Passes 1–6 and downgrade the assessment to \`unable to delegate Pass 0; partial review\`.
- **Missing \`tasks.md\`** → use \`AskUserQuestion\` for mode rather than inferring.

### Pushback bias

When uncertain, prefer the lower severity. SUGGESTION beats WARNING beats CRITICAL. Pushback against the bias to over-flag — the goal is signal, not volume.

### Read-before-reference enforcement

Every finding that cites a specific file:line must be backed by an actual read of that line. If the citation is inferred (e.g., "I think this is around line 50 of design.md"), either read first or downgrade to a less specific finding ("design.md mentions <topic> but does not specify <X>" — searchable, but no false-precision line number).

## Output format

Header (\`## Review: <name> --as <mode>\` + mode/iteration/depth lines + optional iteration note) → \`### Summary\` scorecard table → \`### Findings\` grouped by severity (CRITICAL/WARNING/SUGGESTION; each finding \`**[Pass N] file:line** — title\` then \`Recommendation: ...\`) → \`### Stale findings suppressed\` (when applicable) → \`### Final assessment\` (stock phrasing) → \`Run summary: <path>\` line. See the worked example below for the canonical shape.

## Worked example (proposal mode, partial)

\`\`\`markdown
## Review: add-review-workflows --as proposal

Mode: proposal (inferred from 102 unchecked tasks)
Iteration: 6 (continuing proposal-mode run)
Depth: full
Note: 3 of these findings appeared in the last run on 2026-05-18. 6 new this run.

### Summary

| Dimension    | Critical | Warning | Suggestion |
|--------------|----------|---------|------------|
| Completeness | 0        | 1       | 2          |
| Correctness  | 0        | 1       | 1          |
| Coherence    | 0        | 2       | 2          |

### Findings

#### CRITICAL
None.

#### WARNING
- **[Pass 2] proposal.md:41** — "five new SKILL.md + command body pairs" — count should be four after iter-4 merge.
  Recommendation: change "five" to "four" and list the four pairs explicitly.

- **[Pass 7] sketches/review.md:3** — corrupted filenames "proposal-mode review.md" + "system-mode review.md" (sed residue).
  Recommendation: restore \`sketches/review-proposal.md\` + \`sketches/review-system.md\`.

- **[Pass 4] design.md:159** — "9 capability specs" — should be 8 after merge.
  Recommendation: change "9" to "8" and add the merge context parenthetically.

- **[Pass 3] proposal.md:33** — orbit-conventions capability bullet omits the three disciplines.
  Recommendation: extend the bullet to mention pushback / change-completeness / read-before-reference.

#### SUGGESTION
- **[Pass 9] explore.md:189** — scenario count "5" should be "6" for change-completeness discipline.
- **[Pass 9] explore.md:204** — scenario count "8" should be "9" for read-before-reference discipline.
- **[Pass 5] orbit-review-external/spec.md** — "Recommended-session note" requirement is filed under the wrong parent requirement.
  Recommendation: move it past the prompt-content scenarios.
- (4 more) …

### Stale findings suppressed
None.

### Final assessment

No critical issues. 4 warning(s) to consider. A prior gate-relevant pass has unresolved findings; gate review-proposal UNPASSED. Ready when you are: /orbit:address-reviews add-review-workflows --from-file orbit/changes/add-review-workflows/.orbit-runs/review-proposal-2026-05-18T14-43-41Z.json.

Run summary: orbit/changes/add-review-workflows/.orbit-runs/review-proposal-2026-05-18T14-43-41Z.json
\`\`\`

## Worked example (system mode, all clear, no prior external)

Short illustration showing the State 1 "all clear" phrasing — the system-mode default that nudges toward external review before archive:

\`\`\`markdown
## Review: example-change --as system

Mode: system (inferred from all tasks checked + git diff non-empty)
Iteration: 1 (first system-mode run for this change)
Depth: full

### Summary

| Dimension    | Critical | Warning | Suggestion |
|--------------|----------|---------|------------|
| Completeness | 0        | 0       | 0          |
| Correctness  | 0        | 0       | 0          |
| Coherence    | 0        | 0       | 0          |

### Findings

None.

### Final assessment

All checks passed (in-context pass). Ready when you are: /orbit:review-external --as system example-change — external cross-check required by the review cadence before archive (per orbit-conventions Review mode decision framework; in an early dogfooding cycle, in-context system review missed 3 of 3 real implementation bugs — all caught by external review).

Run summary: orbit/changes/example-change/.orbit-runs/review-system-2026-05-26T15-12-08Z.json
\`\`\`

Once the external converges — Path A (clean) or Path B (findings resolved, 0 CRITICAL) with full ordered-slot coverage — the engine reports \`gate review-system PASSED\` and the phrasing becomes \`Ready when you are: /orbit:archive <change> — user-invoked\`. Single-voiced throughout: one canonical command, no advertised skip path; entry into the archive phase is the user's call.

`,
    references: [
      {
        name: 'run-summary-schema.md',
        content: REVIEW_RUN_SUMMARY_SCHEMA_REFERENCE,
      },
    ],
    license: 'MIT',
    compatibility: "Requires orbit CLI. System-mode Pass 0 invokes the `orbit-verify-change` skill. System-mode Pass 6 invokes the `orbit-audit-drift` skill.",
    metadata: { author: 'openspec', version: '0.1', capability: 'orbit-review' },
  };
}

export function getOrbitReviewCommandTemplate(): CommandTemplate {
  return {
    name: 'ORBIT: Review',
    description: 'Editorial review of a change (proposal/system mode) or an architecture doc (architecture mode)',
    category: 'Workflow',
    tags: ["workflow","review","orbit"],
    content: `Run an editorial review of a change — proposal mode (pre-apply, 9 passes) or system mode (post-apply, verify-change + 6 system-wide passes) — or of an architecture doc (--as architecture: 6 passes, no gate).

This command is a thin launcher: invoke the \`orbit-review\` skill, passing along any arguments given with the command (e.g., \`/orbit:review [<change-name-or-doc-name>] [--as proposal|system|architecture] [flags]\`). The skill carries the complete workflow instructions — upstream openspec behavior plus orbit's additions. Do not improvise the workflow from this file; load the skill.`
  };
}
