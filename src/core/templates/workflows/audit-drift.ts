/**
 * Skill Template Workflow Modules
 *
 * orbit editorial workflow (B3): relocated from the overlay's openspec-audit-drift skill,
 * orbit-named and scrubbed of overlay-era citations (D-b3-1); persistence prose aligned
 * to the orbit-run-summary-emit baseline where the change's iter-1 review corrected it.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const AUDIT_DRIFT_RUN_SUMMARY_SCHEMA_REFERENCE = `# Reference: audit-drift run-summary schema

Each \`/orbit:audit-drift\` invocation persists a JSON summary. Path varies by invocation mode (three modes, per \`orbit-run-summary-emit\`'s \`Audit-drift standalone recommendations\` requirement):

- **Change-scoped standalone** (\`/orbit:audit-drift <name>\` — user invokes with a change name; no caller signal): \`orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json\`
- **Project-wide standalone** (\`/orbit:audit-drift\` — no positional; no caller signal): \`orbit/.orbit-runs/audit-drift-<TS>.json\` (create \`orbit/.orbit-runs/\` if needed)
- **Library / pre-archive** (caller signal present — invoked by \`/orbit:review --as system\` Pass 6 or \`/orbit:archive\` pre-archive sweep): no separate audit-drift JSON — findings fold into the caller's emit (the review's \`review-system-<TS>.json\`, or the archive's \`archive-<TS>.json\` \`audit.*\` fields).

## Universal spine inheritance

This schema inherits the 6-field **universal spine** from \`orbit-conventions\`'s \`Internal-run JSON summary format\` requirement (see \`orbit/specs/orbit-conventions/spec.md\`):

- \`command\` (here: \`"audit-drift"\`)
- \`timestamp\` (ISO-8601 UTC; JSON field \`YYYY-MM-DDTHH:MM:SSZ\`; filename \`<TS>\` token \`YYYY-MM-DDTHH-MM-SSZ\` with colons replaced by hyphens for filesystem safety)
- \`change\` (change name string for change-scoped standalone; \`null\` for project-wide standalone)
- \`final_assessment\` (narrative)
- \`next_recommended\` (verbatim recommendation; varies by findings-vs-clean per \`orbit-run-summary-emit\`'s \`Audit-drift standalone recommendations\` requirement)
- \`kind: "editorial"\` (audit-drift is an editorial command per the kind taxonomy)

The schema below documents per-command extensions ADDED to that spine (\`context\`, \`caller\`, \`depth\`, \`flags\`, \`categories_run\`, \`categories_skipped\`, \`findings_summary\`, \`findings\`, \`stale_suppressed\`). Per-command extensions are audit-drift-specific state.

## Schema

\`\`\`json
{
  "command": "audit-drift",
  "timestamp": "<ISO-8601>",
  "change": "<change-name string for change-scoped standalone; null for project-wide standalone>",
  "final_assessment": "<stock phrasing per invocation mode>",
  "next_recommended": "<on findings — change-scoped: '/orbit:address-reviews <name>' WITHOUT --from-file (auto-discovery selects this just-written JSON); project-wide: '/orbit:address-reviews --from-file <this-json>' (no change-directory anchor, so --from-file IS required). On clean — change-scoped: verbatim copy from the prior latest JSON; project-wide: the periodic-re-run phrasing. Per orbit-run-summary-emit's Audit-drift standalone recommendations.>",
  "kind": "editorial",
  "context": "standalone",
  "caller": null,
  "depth": "fast" | "full" | "thorough",
  "flags": {
    "parallel": false,
    "focus": null,
    "since": null,
    "strict": false
  },
  "categories_run": ["1", "2", "3", "4"],
  "categories_skipped": [],
  "findings_summary": {
    "critical": 0,
    "warning": 0,
    "suggestion": 0,
    "by_category": {
      "1": { "critical": 0, "warning": 0, "suggestion": 0 },
      "2": { "critical": 0, "warning": 0, "suggestion": 0 },
      "3": { "critical": 0, "warning": 0, "suggestion": 0 },
      "4": { "critical": 0, "warning": 0, "suggestion": 0 }
    }
  },
  "findings": [
    {
      "category": "1",
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "file": "orbit/specs/foo/spec.md",
      "line": 42,
      "title": "Stale 'BridgeServer' reference (renamed to HostLifecycle in 2026-03)",
      "recommendation": "Delta the file in a future change or apply a hotfix commit.",
      "recommendation_options": [
        { "label": "A", "body": "<option A body>" },
        { "label": "B", "body": "<option B body>" }
      ]
    }
  ],
  "stale_suppressed": [
    { "category": "<category id>", "title": "...", "evidence": "..." }
  ]
}
\`\`\`

## Field notes

- **\`context\`** is \`"standalone"\` in every audit-drift-<TS>.json — library and pre-archive contexts write no separate file (their findings travel in the caller's emit), so the \`"library"\` / \`"pre-archive"\` values appear only when a caller chooses to embed this shape inside its own emit. Project-wide vs change-scoped standalone is distinguished by the \`change\` field (\`null\` = project-wide; \`<name>\` = change-scoped).
- **\`caller\`** is \`null\` for standalone emits (the only contexts that write this file).
- **\`categories_run\` / \`categories_skipped\`** are strings (category IDs); skip reasons in the report body, not the array.
- **\`findings_summary.by_category\`** keys are category IDs \`"1"\` through \`"4"\`.
- **\`recommendation_options\`** is OPTIONAL on each finding. Present only when the finding's recommendation is genuinely disjunctive — multiple defensible remediation paths the user must choose between. Producer-side contract (per \`orbit-audit-drift\` spec's \`Optional recommendation_options field on audit-drift finding entries\`): MUST contain ≥ 2 entries; each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, …) and non-empty \`body\`. Per-category emit guidance: Category 1 (vocabulary residue) typically single-recommendation; Category 2 (lens staleness) often disjunctive (rename-vs-remove); Category 3 (cross-doc consistency) often disjunctive (which side is canonical); Category 4 (archive coherence) typically single. The prose \`recommendation\` field still summarizes the disjunction for human readers. Field shape is identical to \`orbit-review\`'s \`recommendation_options\`; consumer (address-reviews) parses both producers uniformly. Omit for single-recommendation findings.
`;

export function getAuditDriftSkillTemplate(): SkillTemplate {
  return {
    name: 'orbit-audit-drift',
    description: "Project-wide scan for drift between captured knowledge and reality across four categories (vocabulary residue, lens staleness, cross-doc consistency, archive coherence). Use standalone when something feels off; auto-invoked as Pass 6 of system-mode review and as a pre-archive sweep.",
    instructions: `Scan the project for drift between captured knowledge (specs, lenses, governing docs) and current reality across four categories: (1) Vocabulary residue, (2) Lens staleness, (3) Cross-doc consistency, (4) Archive coherence. Three invocation paths: **standalone** (user runs when "something feels off"), **library call** (system-mode review Pass 6 invokes internally), **pre-archive** (auto-invoked by \`/orbit:archive\` before completing).

Findings roll into the standard 3-dimension scorecard. The final-assessment phrasing varies by invocation context.

**Input**: Optional \`<change-name>\` positional + optional flags. Three invocation modes (detected via positional + caller signal):

- **Change-scoped standalone** — \`/orbit:audit-drift <change-name>\`: user invokes with a change name; no caller signal. Operates on the named change; emits to \`orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json\`.
- **Project-wide standalone** — \`/orbit:audit-drift\` (no positional): user invokes with no args; no caller signal. Operates project-wide; emits to \`orbit/.orbit-runs/audit-drift-<TS>.json\`.
- **Library / pre-archive** — caller signal present (set by \`/orbit:review --as system\` Pass 6 or \`/orbit:archive\` pre-archive sweep): invocation context comes from the caller; positional args ignored.

## Four execution disciplines (apply throughout this command)

**Read-before-reference (authoring-time)**. Findings cite file:line. Before reporting that \`BridgeServer\` appears at \`orbit/specs/foo/spec.md:42\`, read that line. Don't grep-and-cite without verifying — false-positive vocabulary residue (e.g., the term appears in a code block discussing the rename itself) is the most common audit-drift mistake. Distinguishing "actual residue" from "documentation of the residue pattern" requires reading.

**Change completeness (modification-time)**. **Not applicable to this command in the conventional sense.** Audit-drift is scan-only; it does not modify artifacts. But: when an audit run discovers that a prior \`.orbit-runs/audit-drift-*.json\` summary is malformed or partial, treat the new summary as a clean rewrite — do not merge with broken prior state. The discipline is documented here for cross-command consistency.

**Pushback (review-time)**. Verify each potential finding against current state before reporting:
- **Vocabulary residue (Cat 1)**: confirm the term still appears in the file at the cited line (grep + read). Don't report a finding based on a stale grep cache.
- **Lens staleness (Cat 2)**: confirm the referenced capability is genuinely missing under \`orbit/specs/\` — not just under a different name.
- **Cross-doc consistency (Cat 3)**: confirm both sides of the disagreement still exist; if one side was already corrected, suppress the finding.
- **Archive coherence (Cat 4)**: confirm the ADDED requirement really is absent from baseline — not just present under a renamed name.

Suppress stale findings with an evidence note (\`stale finding suppressed: <evidence>\`); show in summary's \`stale_suppressed\` array but not in the user-facing report.

**No-chaining (turn boundary)**. Invoke at most the orbit workflow commands the user's message explicitly requests — one command per explicit user request; recommend, never invoke. Completing a command ENDS the turn at the position readout and the engine's eligibility line; blanket delegation ("take it through review") covers work WITHIN the requested command, never the next command — gate \`passed\` means *eligible*, not *commanded*.

**Bias toward lower severity when uncertain.** SUGGESTION beats WARNING beats CRITICAL. The goal is signal, not volume — same false-positive bias as \`/orbit:review\`.

## Steps

### 1. Resolve invocation context

Detect how audit-drift was invoked:

- **Standalone** — no caller signal; emit full report with own final-assessment line.
- **Library call** — caller is \`/orbit:review --as system\` (Pass 6); detect via explicit caller flag or by being run as a subagent with an audit-drift-only brief. Return findings to the caller; do NOT emit a standalone final-assessment.
- **Pre-archive** — caller is \`/orbit:archive\`; detect via explicit caller flag. Emit findings with the pre-archive prompt phrasing.

State the resolved context at the start of internal logging (not user-facing chat for library calls): \`Context: <standalone|library|pre-archive>\`.

### 2. Resolve flags

| Flag | Default | Effect |
|---|---|---|
| \`--fast\` / \`--full\` / \`--thorough\` | \`--full\` | Depth. Mutually exclusive. |
| \`--parallel\` | off | Spawn subagents for heavy categories (esp. C3 and C4 on large repos). |
| \`--focus <area>\` | none | Run only one category. \`vocabulary\` (C1), \`lenses\` (C2), \`docs\` (C3), \`archive\` (C4). |
| \`--since <ref>\` | last 5 archived changes | Window for Category 4 archive coherence scan. Accepts git ref or \`<N>\` to mean last N. |
| \`--strict\` | off | Fail-fast on first CRITICAL. |

\`--fast\` runs only Categories 1 and 2; reports 3 and 4 as \`skipped per --fast\`.
\`--focus <area>\` runs only the named category; reports others as \`skipped per --focus <area>\`.

### 3. Load context

Read what each category needs:

- **Category 1 inputs**: archived changes' deltas at \`orbit/changes/archive/*/specs/<capability>/spec.md\` for RENAMED FROM and REMOVED. Target docs: non-delta'd \`orbit/specs/<capability>/spec.md\`, \`CLAUDE.md\`, \`orbit/project.md\`, root \`*_convention.md\`.
- **Category 2 inputs**: \`orbit/lenses/perspectives.md\`, \`orbit/lenses/critical-paths.md\`. Resolve against \`orbit/specs/<capability>/spec.md\`.
- **Category 3 inputs**: \`CLAUDE.md\`, \`orbit/project.md\`, root \`*_convention.md\`. Cross-reference against \`orbit/specs/\`.
- **Category 4 inputs**: archived changes within window (\`--since\` controls window). For each, its \`specs/<capability>/spec.md\` deltas vs the live \`orbit/specs/<capability>/spec.md\`.

Use the orbit CLI for change/archive listings: \`orbit list --json\` and direct filesystem reads under \`orbit/changes/archive/\`.

### 4. Category 1 — Vocabulary residue

**Build the residue pattern set.** For each archived change:

- **RENAMED requirements**: extract the FROM and TO names. The FROM name is a residue pattern (term that should no longer appear).
- **REMOVED requirements**: extract the requirement name. The name is a residue pattern.

**Grep target docs** for each residue pattern:

- \`orbit/specs/<capability>/spec.md\` (non-delta'd files — the ones not in the archived change's \`specs/\`)
- \`CLAUDE.md\`, \`orbit/project.md\`
- Root \`*_convention.md\`

**For each match**: read the line to confirm it's actual residue (not a code-block citation of the rename). Distinguish:

- **Genuine residue** in spec body → WARNING (file:line + rename context + recommendation to delta the file in a future change OR apply a hotfix commit).
- **Residue in governing doc** (\`CLAUDE.md\`, \`project.md\`) → CRITICAL (governing docs are followed by future implementers).
- **Documentation of the rename** in a code block or "for example" prose → NOT a finding.

### 5. Category 2 — Lens staleness

**Parse \`orbit/lenses/perspectives.md\`** for entries. Each perspective references a \`<capability>\` surface (the system area the perspective applies to).

- For each perspective's surface refs: check \`orbit/specs/<capability>/\` exists.
- Missing → WARNING (file:line of the perspective entry + recommendation to update or remove).

**Parse \`orbit/lenses/critical-paths.md\`** for flows. Each flow lists touchpoints (capabilities or tools).

- For each touchpoint: check the corresponding capability/tool exists.
- Missing → WARNING.

Empty or absent lens files → skip Category 2 with the note \`lenses empty or absent; skip Category 2\`.

### 6. Category 3 — Cross-doc consistency

**Extract structured claims** from \`CLAUDE.md\`, \`orbit/project.md\`, and \`*_convention.md\`. At minimum:

- **Named entities** — capability names, surface names, tool names, file paths mentioned
- **Quantitative claims** — port numbers, counts, version pins, size limits
- **Architectural assertions** — "X talks to Y", "X is the server, Y is the client", "X must be in place before Y"
- **Rules / conventions** — naming patterns, error formats, file-location conventions referenced in non-convention docs

**Pairwise compare** claims across docs AND against current specs (\`orbit/specs/\`).

- Two docs disagree on the same fact → WARNING (both file:line refs + recommendation to reconcile).
- A governing doc materially disagrees with a current spec → CRITICAL.

### 7. Category 4 — Archive coherence

**Walk archived changes within window** (default last 5; \`--since <ref>\` overrides):

- List archived changes at \`orbit/changes/archive/<YYYY-MM-DD>-<name>/\` (upstream's dated archive form) ordered by archive date.
- Take the first N (or all since \`<ref>\`).

**For each archived change**, compare its spec deltas to live baseline:

- **ADDED requirement** in archived delta but **not present** in \`orbit/specs/<capability>/spec.md\` → CRITICAL (\`sync-specs\` propagation failure).
- **REMOVED requirement** in archived delta but **still present** in baseline → CRITICAL.
- **RENAMED FROM** name still appearing in baseline (the rename didn't propagate) → WARNING.

### 8. Apply scorecard rollup

| Dimension | Categories contributing |
|---|---|
| **Completeness** | Category 4 (Archive coherence) |
| **Correctness** | Category 1 (Vocabulary residue), Category 2 (Lens staleness) |
| **Coherence** | Category 3 (Cross-doc consistency) |

### 9. Emit the final assessment

Stock phrasings, context-specific:

| Context | State | Phrasing |
|---|---|---|
| standalone | ≥1 CRITICAL | \`X critical issue(s) found.\` (no gate mentioned) |
| standalone | Only WARNING/SUGGESTION | \`No critical issues. Y warning(s) to consider.\` |
| standalone | All clear | \`No drift detected.\` |
| pre-archive | ≥1 CRITICAL | \`X critical issue(s) found. Address before /orbit:archive?\` (prompt, not gate) |
| pre-archive | Only WARNING/SUGGESTION | \`No critical drift. Y warning(s) to consider (noted drift).\` |
| pre-archive | All clear | \`No drift detected.\` |
| library | any | No standalone final-assessment emitted; findings handed to caller (folded into review report's Coherence dimension). |

### 10. Persist the run summary

Write JSON for **standalone** invocations only:

- **Change-scoped standalone** (\`/orbit:audit-drift <change-name>\`): \`orbit/changes/<change-name>/.orbit-runs/audit-drift-<TS>.json\`
- **Project-wide standalone** (no positional): \`orbit/.orbit-runs/audit-drift-<TS>.json\` (create \`orbit/.orbit-runs/\` if needed)
- **Library / pre-archive**: no separate JSON — findings fold into the caller’s emit (the review’s \`review-system-<TS>.json\`, or the archive’s \`archive-<TS>.json\` \`audit.*\` fields)

Full schema (fields, types, semantics) lives at \`references/run-summary-schema.md\` — read that file when composing the summary.

## Output format

Header (\`## Audit-drift report\` + \`Context: <standalone|library|pre-archive>\` + depth + flags) → \`### Summary\` scorecard table grouped by Category and Dimension → \`### Findings\` grouped by severity (CRITICAL/WARNING/SUGGESTION; each finding \`**[Category N] file:line** — title\` then \`Recommendation: ...\`) → \`### Stale findings suppressed\` (when applicable) → \`### Final assessment\` (context-specific phrasing; omitted when library context) → \`Run summary: <path>\` line.

### Disjunctive recommendations: emit structured \`recommendation_options\`

When an audit-drift finding's recommendation is genuinely disjunctive — multiple defensible remediation paths the user must choose between — emit an optional structured field alongside the prose \`recommendation\` (same shape as \`orbit-review\`'s; consumed by \`/orbit:address-reviews\` for the decision-fork prompt):

\`\`\`json
{
  "category": "2",
  "severity": "WARNING",
  "file": "orbit/lenses/perspectives.md",
  "line": 8,
  "title": "Perspective references missing capability <name>",
  "recommendation": "Either (A) rename the surface ref to match the current capability name, or (B) remove the perspective if it's obsolete.",
  "recommendation_options": [
    { "label": "A", "body": "rename the surface ref to match the current capability name <current-name>" },
    { "label": "B", "body": "remove the perspective if it's obsolete" }
  ]
}
\`\`\`

**Per-category emit guidance** (not strict — emit when genuinely disjunctive):

- **Category 1 (Vocabulary residue)**: typically single-recommendation (\`delta the file\` or \`apply a hotfix commit\`). Emit \`recommendation_options\` only when BOTH paths are equally defensible and the user's context decides (e.g., "delta this file in a future change vs. apply a hotfix commit now").
- **Category 2 (Lens staleness)**: typically disjunctive (rename surface ref vs. remove obsolete perspective). Emit \`recommendation_options\` when the choice is genuinely the user's to make.
- **Category 3 (Cross-doc consistency)**: often disjunctive when two docs disagree (update X to match Y vs. update Y to match X). Emit \`recommendation_options\` for these.
- **Category 4 (Archive coherence)**: typically requires \`sync-specs\` or a hotfix; usually single-recommendation. Emit only when multiple resolution paths are equally defensible.

**Producer-side contract** (per \`orbit-audit-drift\` spec):

- MUST contain ≥ 2 entries when emitted. Single-option arrays are a producer bug.
- Each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, …) and non-empty \`body\`.
- The prose \`recommendation\` field still summarizes the disjunction for human readers — the structured field complements it, doesn't replace.
- Field is OPTIONAL on every finding. Omit for single-recommendation findings.

Field shape is identical to \`orbit-review\`'s; consumer (\`/orbit:address-reviews\`) parses both producers uniformly. See \`references/run-summary-schema.md\` for the canonical shape.

## Worked example (standalone, full depth)

\`\`\`
## Audit-drift report

Context: standalone
Depth: full
Flags: none

### Summary

| Category | Critical | Warning | Suggestion |
|----------|----------|---------|------------|
| 1 — Vocabulary residue | 0 | 2 | 0 |
| 2 — Lens staleness     | 0 | 1 | 0 |
| 3 — Cross-doc          | 1 | 0 | 0 |
| 4 — Archive coherence  | 0 | 0 | 0 |

Scorecard rollup:

| Dimension    | Critical | Warning | Suggestion |
|--------------|----------|---------|------------|
| Completeness | 0        | 0       | 0          |
| Correctness  | 0        | 3       | 0          |
| Coherence    | 1        | 0       | 0          |

### Findings

#### CRITICAL
- **[Category 3] CLAUDE.md:14** — Claims "all surface tools live under \`tools/\`"; current spec \`orbit/specs/surface-tools/spec.md:8\` says they live under \`surface/\`.
  Recommendation: update CLAUDE.md to match the spec (the spec is canonical).

#### WARNING
- **[Category 1] orbit/specs/host-lifecycle/spec.md:23** — Stale \`BridgeServer\` reference (renamed to \`HostLifecycle\` in 2026-03 archived change \`rename-bridge-server\`).
  Recommendation: delta this file in a future change OR apply a hotfix commit replacing the term.
- **[Category 1] orbit/specs/host-lifecycle/spec.md:71** — Same stale \`BridgeServer\` reference.
  Recommendation: same as above; both occurrences in this spec.
- **[Category 2] orbit/lenses/perspectives.md:8** — Perspective "API client" references \`<api-server>\` capability; no \`orbit/specs/api-server/\` exists.
  Recommendation: rename the surface ref to match the current capability name OR remove the perspective if obsolete.

### Final assessment

1 critical issue(s) found.

Run summary: orbit/.orbit-runs/audit-drift-2026-05-18T15-04-11Z.json
\`\`\`

## Graceful degradation

- **No \`orbit/changes/archive/\`** → Category 4 skipped with \`no archived changes; skip Category 4\`.
- **Empty lenses files** → Category 2 skipped with note.
- **No project/governance docs** (\`CLAUDE.md\`, \`project.md\` absent) → Category 3 doc-vs-doc skipped; spec-only checks remain.
- **\`--focus <area>\` with non-existent target** (e.g., \`--focus lenses\` but lenses absent) → command exits gracefully with \`<focus area> unavailable; nothing to scan\`.

## Run-summary emit (standalone modes — change-scoped + project-wide)

(Per \`orbit-run-summary-emit\` capability)

\`/orbit:audit-drift\` emits run summaries for its two **standalone** variants (change-scoped and project-wide) per \`references/run-summary-schema.md\`, with the universal spine + per-mode recommendation logic below. Library and pre-archive contexts write no separate audit-drift JSON: findings are captured inside the caller’s emit (\`review-system-<TS>.json\` or \`archive-<TS>.json\`) per the existing convention.

The two standalone variants emit to different paths:

\`\`\`
# Change-scoped standalone (/orbit:audit-drift <name>)
orbit/changes/<name>/.orbit-runs/audit-drift-<TS>.json

# Project-wide standalone (/orbit:audit-drift with no argument)
orbit/.orbit-runs/audit-drift-<TS>.json     # create the directory if needed
\`\`\`

### JSON shape

Per the universal spine in \`orbit-conventions\`'s \`Internal-run JSON summary format\` + per-command extensions:

\`\`\`json
{
  "command": "audit-drift",
  "timestamp": "<ISO-8601 UTC>",
  "change": "<name>" | null,
  "final_assessment": "<narrative — varies by mode and findings>",
  "next_recommended": "<per recommendation logic below>",
  "kind": "editorial",
  "context": "standalone",
  "categories_run": ["1", "2", "3", "4"],
  "findings_by_category": { "1": 0, "2": 0, "3": 0, "4": 0 },
  "findings_total": <int>
}
\`\`\`

\`change\` is set to the change name for change-scoped standalone (\`/orbit:audit-drift <name>\`); \`null\` for project-wide standalone.

### \`next_recommended\` — mode + findings combinations

Per \`orbit-run-summary-emit\`'s \`Audit-drift standalone recommendations\` requirement, four cases:

**Change-scoped + findings produced**:
\`\`\`
next_recommended: "/orbit:address-reviews <name> — N drift(s) detected; resolve before next workflow step"
\`\`\`

(The \`--from-file <this-json>\` argument is NOT required for change-scoped invocations: \`/orbit:address-reviews\` auto-discovers the most-recent \`audit-drift-*.json\` in the change's \`.orbit-runs/\` per the \`Address-reviews command available\` requirement in \`orbit-address-reviews\`. The just-written \`audit-drift-<TS>.json\` will be the most recent at recommendation-emit time, so auto-discovery resolves cleanly. Project-wide invocations still require explicit \`--from-file\` — see below — because they have no change-directory anchor.)

**Change-scoped + clean (zero findings)** — defer to prior workflow narrative:
- Read the most recent prior \`.orbit-runs/*.json\` for the same change (excluding the just-written audit-drift JSON itself).
- Copy that JSON's \`next_recommended\` verbatim into the new emit's \`next_recommended\`.
- Set \`final_assessment\` to: \`"drift check clean; deferring to prior workflow state."\`
- Rationale: a clean drift check shouldn't reset the workflow's narrative; if the user was mid-apply, the recommendation should still be "keep applying."

**Project-wide + findings produced**:
\`\`\`
next_recommended: "/orbit:address-reviews --from-file <this-json> — N drift(s) detected project-wide; resolve before next workflow step"
\`\`\`

(No \`<change-name>\` arg; address-reviews handles project-wide markers from \`--from-file\`.)

**Project-wide + clean (zero findings)** — no prior per-change workflow to defer to:
\`\`\`
next_recommended: "No project-wide drifts detected. Run /orbit:audit-drift periodically to catch new drift."
final_assessment: "project-wide drift check clean."
\`\`\`

### Inline mode unchanged

When \`/orbit:audit-drift\` is called by \`/orbit:archive\` (library / pre-archive context), findings are captured inside \`archive-<TS>.json\` per the existing convention. The inline-mode emit is owned by the archive flow.
`,
    references: [
      {
        name: 'run-summary-schema.md',
        content: AUDIT_DRIFT_RUN_SUMMARY_SCHEMA_REFERENCE,
      },
    ],
    license: 'MIT',
    compatibility: "Requires orbit CLI. Composes with `/orbit:review --as system` (Pass 6) and `/orbit:archive` (pre-archive sweep).",
    metadata: { author: 'openspec', version: '0.1', capability: 'orbit-audit-drift' },
  };
}

export function getOrbitAuditDriftCommandTemplate(): CommandTemplate {
  return {
    name: 'ORBIT: Audit Drift',
    description: 'Project-wide scan for drift between captured knowledge and reality',
    category: 'Workflow',
    tags: ["workflow","audit","orbit"],
    content: `Scan the project for drift between captured knowledge and reality across four categories: vocabulary residue, lens staleness, cross-doc consistency, archive coherence.

This command is a thin launcher: invoke the \`orbit-audit-drift\` skill, passing along any arguments given with the command (e.g., \`/orbit:audit-drift [<change-name>] [--fast|--full] [--focus <area>] [--since <ref>]\`). The skill carries the complete workflow instructions — upstream openspec behavior plus orbit's additions. Do not improvise the workflow from this file; load the skill.`
  };
}
