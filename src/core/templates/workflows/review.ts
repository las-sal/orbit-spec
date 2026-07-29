/**
 * Skill Template Workflow Modules
 *
 * orbit editorial workflow (B3): relocated from the overlay's openspec-review skill,
 * orbit-named and scrubbed of overlay-era citations (D-b3-1); persistence prose aligned
 * to the orbit-run-summary-emit baseline where the change's iter-1 review corrected it.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const REVIEW_RUN_SUMMARY_SCHEMA_REFERENCE = `# Reference: review run-summary schema

Each \`/orbit:review\` invocation persists a JSON summary. The location is PER MODE (D-arc Stage D2): \`orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json\` for \`proposal\` and \`system\` modes, and \`orbit/architecture/.orbit-runs/review-architecture-<TS>.json\` for \`architecture\` mode (the architecture trail — shared by all docs, never moved by change archiving). \`<TS>\` is ISO-8601 with hyphens (e.g., \`review-proposal-2026-05-18T14-35-23Z.json\`).

Create the trail directory if it doesn't exist. The file is **committed** (not gitignored) so iteration history travels with the change into archive (change modes) or persists in the architecture trail (architecture mode).

## Universal spine inheritance

This schema inherits the 6-field **universal spine** from \`orbit-conventions\`'s \`Internal-run JSON summary format\` requirement (see \`orbit/specs/orbit-conventions/spec.md\`):

- \`command\` (matches filename prefix; here: \`"review"\`)
- \`timestamp\` (ISO-8601 UTC; JSON field \`YYYY-MM-DDTHH:MM:SSZ\`; filename \`<TS>\` token \`YYYY-MM-DDTHH-MM-SSZ\` with colons replaced by hyphens for filesystem safety)
- \`change\` (change name string; \`null\` in architecture mode — a \`doc\` extension names the reviewed doc instead)
- \`final_assessment\` (DETERMINISTIC facts for change modes — the severity-counts sentence \`"X critical, Y warning, Z suggestion."\` / \`"No findings."\` computed from the emit's own scorecard, never a verdict; narrative gate-less line in architecture mode)
- \`next_recommended\` (the DETERMINISTIC pointer for change modes: the \`/orbit:address-reviews <name> --from-file <this emit's own path>\` invocation when the pass has findings, the \`orbit status --change <name> --report\` render pointer when clean — the engine-computed canonical next rides the rendered tail, never the emit)
- \`kind: "editorial"\` (review is an editorial command per the kind taxonomy)

The schema below documents per-command extensions ADDED to that spine (\`mode\`, \`iteration\`, \`depth\`, \`reviewer_class\`, \`flags\`, \`passes_run\`, \`passes_skipped\`, \`scorecard\`, \`findings\`, \`stale_suppressed\`, \`commentary\`). The former \`findings_summary\` and \`iteration_note\` fields are RETIRED (D-arc Stage D4): \`scorecard\` supersedes the counts (readers tolerate both generations), and the iteration note is RENDERER-computed from the trail — a stored copy would be a second stale voice.. Per-command extensions are review-specific state; they supplement, not replace, the spine.

## Schema

\`\`\`json
{
  "command": "review",
  "timestamp": "<ISO-8601>",
  "change": "<change-name>",         // null in architecture mode
  "final_assessment": "<counts sentence, e.g. \"0 critical, 1 warning, 3 suggestion.\">",
  "next_recommended": "<findings → '/orbit:address-reviews <name> --from-file <own path>'; clean → 'orbit status --change <name> --report'>",
  "kind": "editorial",
  "mode": "proposal" | "system" | "architecture",
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
  "scorecard": {
    "completeness": { "critical": 0, "warning": 0, "suggestion": 0 },
    "correctness": { "critical": 0, "warning": 0, "suggestion": 0 },
    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }
  },
  "findings": [
    {
      "pass": "1",
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "dimension": "completeness" | "correctness" | "coherence",
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
  "commentary": "<optional — the reviewer's color commentary, rendered verbatim into the report's delimited Commentary slot>"
}
\`\`\`

## Field notes

- **\`reviewer_class\`** (C1) is the first-class execution-context field the engine's reviewed-gate convergence reads for cadence class coverage: \`"fresh"\` when the pass ran in a clean context (\`--fresh\`), else \`"in-context"\` (externally-sourced findings in \`external-<as>-<TS>.md\` are structurally \`"external"\`). For emits predating this field the engine infers (\`flags.fresh: true\` → \`fresh\`; \`external-*.md\` provenance → \`external\`; otherwise \`in-context\`), so absence never breaks gate computation.
- **\`iteration\`** is per-mode: proposal-mode and system-mode iterations count separately on the same change.
- **\`passes_run\` / \`passes_skipped\`** are strings (pass IDs); skip reasons go in the report body but not the summary array.
- **\`scorecard\`** is the REQUIRED counts shape (3 dimensions × 3 severities, non-negative integers): each cell SHALL equal the count of ACTIVE findings with that \`dimension\` + severity (suppressed excluded) — the renderer validates the equality and fails the render on mismatch.
- **\`dimension\`** on each finding names the owning scorecard cell (\`completeness\` | \`correctness\` | \`coherence\`).
- **\`stale_suppressed\`** captures findings that pushback removed; they are excluded from the scorecard and active findings, and render in the report's dedicated Suppressed section (first-class, with evidence).
- **\`final_assessment\` / \`next_recommended\`** carry the deterministic facts contract above — no verdicts, no eligibility judgments (the engine-rendered tail owns those).
- **\`commentary\`** is OPTIONAL: the reviewer's voice for the report's delimited Commentary slot — the pattern behind the findings, what was probed, risk texture; NEVER finding counts, gate verdicts, or next commands (those exist only in the report's engine-computed sections).
- **\`recommendation_options\`** is OPTIONAL on each finding. Present only when the finding's recommendation is genuinely disjunctive — multiple defensible paths the user must choose between. Producer-side contract (per \`orbit-review\` spec's \`Optional recommendation_options field on finding entries\`): MUST contain ≥ 2 entries; each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, … or \`"1"\`, \`"2"\`, …) and non-empty \`body\`. The prose \`recommendation\` field still summarizes the disjunction for human readers. Consumer (address-reviews) uses this for the structured decision-fork detection path; absence triggers heuristic fallback. Omit the field for single-recommendation findings.

## Architecture-mode extensions (D-arc Stage D2)

Architecture-mode emits (\`review-architecture-<TS>.json\` in the architecture trail) use the same spine and per-command extensions with these differences:

- \`change: null\` and a REQUIRED \`doc\` field (the reviewed doc's filename stem — iteration counting anchors to matching-\`doc\` emits only).
- \`mode: "architecture"\`; \`iteration\` is per-doc (not per-change).
- \`findings_summary\` uses \`by_pass\` keys \`"1"\`–\`"6"\` (the six architecture passes); findings cite \`<doc>.md:line\`.
- \`flags.mark\` / \`flags.skip_verify\` are absent (change-mode-only flags); \`parallel\`/\`fast\`/\`focus\` record their no-op values.
- \`final_assessment\` / \`next_recommended\` are GATE-LESS: with findings, address-reviews targeting this emit; all-clear, \`"No findings. The architecture trail records this pass."\` — never a lifecycle command.
- A REQUIRED \`handoff\` section per arc ruling R-d-9(b) (shape owned by \`orbit-architect\`): \`boot_sequence\` (ordered POINTERS into existing artifacts, never duplicated substance), \`next_command\`, \`model_hint\` (nullable), \`seam\`.

\`\`\`json
{
  "command": "review",
  "timestamp": "<ISO-8601>",
  "change": null,
  "doc": "<doc-name>",
  "mode": "architecture",
  "reviewer_class": "in-context" | "fresh" | "external",
  "iteration": <integer, per-doc>,
  "findings_summary": { "critical": 0, "warning": 0, "suggestion": 0, "by_pass": { "1": { "critical": 0, "warning": 0, "suggestion": 0 } } },
  "findings": [ ... same finding shape ... ],
  "final_assessment": "<gate-less phrasing>",
  "next_recommended": "<address-reviews targeting this emit, or the all-clear sentence>",
  "kind": "editorial",
  "handoff": {
    "boot_sequence": ["<pointer + one-line why>", "..."],
    "next_command": "<the one command a cold session runs first>",
    "model_hint": null,
    "seam": "<which phase seam this boundary is>"
  }
}
\`\`\`
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

### 8. (Change modes) Author the commentary

The reviewer's insight travels as the emit's OPTIONAL \`commentary\` field — the pattern behind
the findings, what was probed and how hard, risk texture: everything the structured sections
can't say. Commentary NEVER states finding counts, gate verdicts, or next commands (those
exist only in the report's engine-computed sections; the contract is enforced at this source).
The iteration note is NOT authored — the renderer computes it from the trail (D-arc Stage D4).
Architecture mode keeps its hand-computed iteration note (matching mode AND \`doc\`, per Step 5
— never cross-doc): \`Note: N of these findings appeared in the last run on <date>. M new this
run.\` / \`First architecture review for this doc.\`

### 9. Persist the run summary FIRST

(Persist-first ordering — D-arc Stage D4: the emit lands on disk BEFORE the report renders, so
the engine's gate computation naturally includes this pass; no synthetic-pass machinery, and
no window where \`orbit status\` and the report disagree.)

Write JSON per mode: to \`orbit/changes/<name>/.orbit-runs/review-<mode>-<TS>.json\` for
\`proposal\` and \`system\` modes, and to \`orbit/architecture/.orbit-runs/review-architecture-<TS>.json\`
for \`architecture\` mode (the architecture trail — the fourth persistence location; never moved
by change archiving). ISO-8601 timestamp (e.g., \`review-proposal-2026-05-18T14-35-23Z.json\`).
The full schema lives at \`references/run-summary-schema.md\` — read it when composing (including
\`reviewer_class\`: \`"fresh"\` when the pass ran in a clean context under \`--fresh\`, else
\`"in-context"\` — the field the engine's cadence coverage reads). Change-mode
spine fields carry DETERMINISTIC FACTS, never verdicts: \`final_assessment\` is the severity-counts
sentence from the emit's own scorecard (\`"X critical, Y warning, Z suggestion."\` / \`"No findings."\`),
and \`next_recommended\` is the deterministic pointer (findings → the \`/orbit:address-reviews <name>
--from-file <this emit's own path>\` invocation; clean → the \`orbit status --change <name> --report\`
render pointer). Every finding carries its owning \`dimension\`; the \`scorecard\` cells MUST equal the
active findings' dimension × severity rollup (suppressed excluded) — the renderer validates this and
fails the render on mismatch. Architecture-mode emits carry \`change: null\`, a \`doc\` field, and — per
arc ruling R-d-9(b) — the structured \`handoff\` section (shape owned by \`orbit-architect\`). Create the
trail directory if needed; commit-worthy (do not gitignore).

### 10. Render and paste the report (change modes)

Run \`orbit status --change <name> --report\` and paste its output VERBATIM as the report. The
body NEVER hand-renders the structured report sections — header, trend, scorecard table,
findings, Suppressed, or the gate/position/eligibility tail; hand-rendering them is PROHIBITED
in change modes (architecture mode is EXEMPT — it has no render surface yet and keeps its
hand-rendered gate-less shape below). The engine-rendered tail IS the assessment: the gate
verdict, position, and canonical next command come from the gate graph at render time — the
reviewing AI authors none of them. The chat turn is LOOSE FORM: the pasted report grounds it,
and free conversational engagement follows (the report is the anchor, not the whole voice);
the conversation may not contradict the tail's engine-computed lines. Skipped-pass notes (the
emit's \`passes_run\`/\`passes_skipped\` record) surface in this loose-form conversation when
worth mentioning — never as hand-rendered structured sections.

#### Architecture mode — NO gate (interim hand-rendered shape)

No gate exists over architecture docs (review standing without a gate — D-arc D-d2-5), so the
architecture-mode final assessment NEVER says PASSED/UNPASSED of a gate and never references a
lifecycle command. Until the render surface covers the architecture trail, this mode keeps the
shared hand-rendered scorecard shape, ending:

| State | Phrasing |
|---|---|
| Findings present | \`X critical / Y warning(s). Ready when you are: /orbit:address-reviews --from-file <the just-written review-architecture emit>.\` |
| All clear | \`No findings. The architecture trail records this pass.\` |

Labels follow D1's eligibility phrasing; the findings are ingestible by \`/orbit:address-reviews\`
exactly like other internal review JSON (including \`recommendation_options\` on disjunctive
findings). On all-clear, no command is recommended — the trail records the pass and the turn
ends at the readout.


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

## Output format (change modes)

The report IS the engine render: run \`orbit status --change <name> --report\` after persisting
the emit and paste the output verbatim — header, trend, scorecard table, findings (blockquote-
contained recommendations, labeled options), Suppressed, the delimited Commentary slot, and
the engine tail (gate / position / eligibility) last. Never hand-render those sections in
change modes; free conversational engagement follows the pasted report (loose form).
Architecture mode keeps its hand-rendered gate-less shape (Step 10) until the render surface
covers the architecture trail.

## Worked example (the change-mode turn shape)

\`\`\`
[persist orbit/changes/example-change/.orbit-runs/review-system-2026-05-26T15-12-08Z.json]
[run: orbit status --change example-change --report]
[paste the rendered report verbatim — it ends with the engine tail, e.g.:
---
Gate review-system: unpassed — cadence class 'external' has no pass
Position: propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate
Ready when you are: /orbit:review-external --as system example-change]

[then loose-form conversation: what the pattern behind the findings means, what to probe
next, anything the structure can't say — never contradicting the tail's engine lines]
\`\`\`


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
