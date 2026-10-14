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

The spine every emit carries — its fields, their types and which of them the engine composes — is owned by \`orbit-conventions\`' \`Internal-run JSON summary format\` requirement, and is not restated here; the write gate refuses every field the engine composes. The example below carries exactly what a payload supplies, \`model\` included.

The payload this command writes is OWNED by \`orbit-run-summary-emit\`'s \`Audit-drift standalone recommendations\` requirement, which this reference MIRRORS and never defines: the per-command extensions are \`categories_run\`, \`findings\` and \`stale_suppressed\`, plus \`final_assessment\`. The two counts — \`findings_total\` and \`findings_by_category\` — are ENGINE-COMPUTED from \`findings\` and refused in the payload, per \`orbit-emit-composition\`'s \`Audit-drift counts are engine-computed\`. The write gate refuses any other key.

## Schema

\`\`\`json
{
  "command": "audit-drift",
  "timestamp": "<ISO-8601>",
  "change": "<change-name string for change-scoped standalone; null for project-wide standalone>",
  "final_assessment": "<stock phrasing per invocation mode>",
  "next_recommended": "<engine-composed, per orbit-run-summary-emit's Audit-drift standalone recommendations — never supplied>",
  "kind": "editorial",
  "model": "<the emitting AI's model identity, or null>",
  "categories_run": ["1", "2", "3", "4", "5", "6"],
  "findings_total": <integer>,                     // engine-computed; refused in the payload
  "findings_by_category": { "<category id>": <integer> }, // engine-computed; refused in the payload
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

## Example payload

The payload file Step 10 writes — real JSON, accepted by \`orbit emit audit-drift\` with \`--change <name>\` and bare. It carries no engine-owned key. A test submits this block, unchanged, through the write gate in both scopes (\`orbit-emit-composition\`'s \`Payload schema references are proven by execution\`).

\`\`\`json example change project
{
  "final_assessment": "No critical issues. 1 warning(s) to consider.",
  "categories_run": ["1", "2", "3", "4", "5", "6"],
  "findings": [
    {
      "category": "1",
      "severity": "WARNING",
      "file": "orbit/specs/orbit-status/spec.md",
      "line": 42,
      "title": "Stale 'BridgeServer' reference (renamed to HostLifecycle)",
      "recommendation": "Replace the name in the next change that touches orbit-status."
    },
    {
      "category": "3",
      "severity": "SUGGESTION",
      "file": "README.md",
      "line": 12,
      "title": "README and orbit-onboard disagree on the command count",
      "recommendation": "Make one side canonical and point the other at it.",
      "recommendation_options": [
        { "label": "A", "body": "README is canonical; orbit-onboard points at it." },
        { "label": "B", "body": "orbit-onboard is canonical; README points at it." }
      ]
    }
  ],
  "stale_suppressed": [
    { "category": "2", "title": "Lens 'verify-first' names a retired command", "evidence": "grep finds no 'verify-first' in orbit/ since 1a2b3c4d" }
  ],
  "model": "claude-opus-5-5"
}
\`\`\`

## Field notes

- **\`categories_run\`** is an array of category-id strings, \`"1"\` through \`"6"\` (5 = Touchpoints divergence, 6 = Emit attestation cross-check — D-arc Stage D5) — the categories that ran; skip reasons belong in the report body, not the array. The write gate refuses any other shape (an object of booleans, numbers), never coerces it — and checks the TYPE only: an id outside \`"1"\`–\`"6"\` is accepted and counted like any other, so the range is this body's to keep.
- **\`category\`** on each finding is REQUIRED, a non-empty category-id string — \`findings_by_category\` counts it.
- **\`findings_total\` / \`findings_by_category\`** are ENGINE-COMPUTED and refused in the payload: the length of \`findings\`, and one key per id in \`categories_run\` plus one per category a finding carries, each the number of findings carrying it — per \`orbit-emit-composition\`'s \`Audit-drift counts are engine-computed\`. \`stale_suppressed\` entries are not counted.
- **\`recommendation_options\`** is OPTIONAL on each finding. Present only when the finding's recommendation is genuinely disjunctive — multiple defensible remediation paths the user must choose between. Producer-side contract (per \`orbit-audit-drift\` spec's \`Optional recommendation_options field on audit-drift finding entries\`): MUST contain ≥ 2 entries; each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, …) and non-empty \`body\`. Per-category emit guidance: Category 1 (vocabulary residue) typically single-recommendation; Category 2 (lens staleness) often disjunctive (rename-vs-remove); Category 3 (cross-doc consistency) often disjunctive (which side is canonical); Category 4 (archive coherence) typically single. The prose \`recommendation\` field still summarizes the disjunction for human readers. Field shape is identical to \`orbit-review\`'s \`recommendation_options\`; consumer (address-reviews) parses both producers uniformly. Omit for single-recommendation findings.
`;

const AUDIT_DRIFT_WORKED_EXAMPLE_REFERENCE = `# Reference: audit-drift worked example (standalone, full depth)

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

## Four execution disciplines (epitome)

The four disciplines from \`orbit-conventions\`, embedded per body; detail lives in the category step where each fires.

- **Read-before-reference (authoring-time)**: findings cite file:line — read the line before reporting it; distinguishing actual residue from documentation OF the residue pattern requires reading, not grep alone.
- **Change completeness (modification-time)**: audit-drift is scan-only; when a prior \`.orbit-runs/audit-drift-*.json\` is malformed or partial, the new summary is a clean rewrite — never merged with broken prior state.
- **Pushback (review-time)**: verify each potential finding against current state per its category (term still present; capability genuinely missing, not renamed; both sides of a disagreement still exist; requirement truly absent from baseline). Suppress stale findings with an evidence note into \`stale_suppressed\` — never the user-facing report.
- **No-chaining (turn boundary)**: invoke only the orbit workflow commands the user's message explicitly requests; completing a command ENDS the turn at the position readout + the engine's eligibility line — gate \`passed\` means *eligible*, not *commanded*.

**Bias toward lower severity when uncertain.** SUGGESTION beats WARNING beats CRITICAL — signal, not volume.

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

**Architecture staleness check (D-arc Stage D2)** — Category 3 additionally checks parseable architecture docs against engine-computed reality ("a stale architecture doc is the most expensive drift there is"). Load \`orbit architecture status --json\` and, per parseable doc:

- **(a) Contradicting prose** — prose in a stage section that contradicts the stage's computed state (e.g. "awaits the user's propose" while a citing change is active) → WARNING.
- **(b) Falsified/unsupported completion mark** — a \`Complete:\` mark — ratified \`[x]\` or ended \`[~]\` — on a stage whose observed state the engine's composition rule renders INCONSISTENT (the table in \`orbit-architecture-engine\`'s \`Computed stage state with completion-as-ratification\`; this check consumes that rule and enumerates none of its observations — read \`rendered\` and the \`inconsistency\` detail from the status JSON) → CRITICAL (the completion claim is falsified or unsupported by observation; the ended claim is contradicted by live work; the finding names the stage, the mark, and the citing artifact when one exists, with the detail's own words — a concluded exploration is named as a conclusion, never as live work).
- **(c) Hand-written state line** — a \`*State:*\`-form line in a parseable doc → WARNING (state is computed, never stored — flag for deletion in favor of the computed readout).
- **(d) Dangling citations** — \`architecture:\` citations in change/explore metadata that dangle at either level → CRITICAL (change citations also fail \`orbit validate <change>\`; explore citations have no validating surface and are caught ONLY here).

Check (d) scans change/explore metadata INDEPENDENTLY of doc presence — a typo'd \`doc:\` name can itself create the no-parseable-docs condition, and must not suppress its own detection. Only the doc-side checks (a)–(c) are skipped when no parseable architecture docs exist, with the note \`no parseable architecture docs; skip architecture staleness (doc-side)\`. Architecture content is NEVER flagged for having originated outside an architect session (flow-entry ruling: \`/orbit:explore\` plus hand-editing is first-class).

### 7. Category 4 — Archive coherence

**Walk archived changes within window** (default last 5; \`--since <ref>\` overrides):

- List archived changes at \`orbit/changes/archive/<YYYY-MM-DD>-<name>/\` (upstream's dated archive form) ordered by archive date.
- Take the first N (or all since \`<ref>\`).

**For each archived change**, compare its spec deltas to live baseline:

- **ADDED requirement** in archived delta but **not present** in \`orbit/specs/<capability>/spec.md\` → CRITICAL (\`sync-specs\` propagation failure).
- **REMOVED requirement** in archived delta but **still present** in baseline → CRITICAL.
- **RENAMED FROM** name still appearing in baseline (the rename didn't propagate) → WARNING.

**Missing consent-record check (D1 tripwire, per \`orbit-lifecycle-consent\`)** — also scan ACTIVE changes, not only archived ones (any change with lifecycle emits is in scope):

For each change in scope, scan its \`.orbit-runs/\` for consent-scoped lifecycle emits (\`apply-*.json\`, \`archive-*.json\`) and apply the **three-tier era rule** from the change's \`.openspec.yaml\` metadata — the metadata markers are the ONLY authority (NOT schema-name resolution, which would misclassify old archives as the current version, and NOT any timestamp constant):

1. **\`schema_version >= 3\`** (born post-capability) → ALL its apply/archive emits are checked.
2. **\`consent_era_from\` present** (a straddler stamped at first post-capability touch) → only emits whose filename \`<TS>\` token is at-or-after the stamp are checked; earlier emits stay exempt.
3. **NEITHER field** → fully pre-capability; every emit exempt (e.g. the C1/C2 archives).

A checked emit **missing the \`consent\` field** → WARNING: \`lifecycle emit lacks consent record — an unconsented or contract-violating transition may have occurred\`, naming the emit path (e.g. \`orbit/changes/<name>/.orbit-runs/apply-<TS>.json\`) and the missing field (\`consent\`). This is the empirical tripwire behind the D-arc's harness-hooks deferral (R-d-2): its firing is the named re-entry trigger for hard enforcement.

### 7.5 Category 5 — Touchpoints divergence (D-arc Stage D5)

For each ACTIVE change whose \`design.md\` carries a \`## Touchpoints\` section AND whose apply has committed work: the divergence arithmetic is ENGINE-COMPUTED — the AI performs NO set arithmetic and NO matching, only severity judgment over the computed lists. Read them from ONE call:

\`\`\`bash
orbit status --change <name> --boot --json   # touchpoints.actual_unpredicted / .predicted_unsatisfied / .malformed
\`\`\`

The engine owns parse + matching per \`orbit-propose-modifications\`' Touchpoints ENTRY GRAMMAR (exact path / directory prefix / glob, \`+\`-grouped alternatives — defined THERE, one voice) and has already excluded the change's own \`orbit/changes/<name>/**\` bookkeeping.

**The category GATE is \`touchpoints.actual !== null\`** — when \`actual\` is null (no committed apply work yet, or no section), skip the change SILENTLY, INCLUDING any \`malformed\` entries (boot surfaces those pre-apply as parse diagnostics for the authoring flow, but pre-capability changes are never category-5 findings). When the gate is open:

- **Each \`actual_unpredicted\` path** → scope-drift finding naming the file and both maps' sources: WARNING for substantive source paths, SUGGESTION for tests/docs riding along.
- **Each \`predicted_unsatisfied\` entry** → SUGGESTION at pre-archive context only (the plan overshot — informational).
- **Each \`malformed\` entry** (\`{line, text}\`) → SUGGESTION naming the line; the engine already excluded it from the arithmetic, never a false drift source.

### 7.6 Category 6 — Explore emit attestation cross-check (D-arc Stage D5)

For each staging exploration (\`orbit/explore/<name>/\`) with explore emits: cross-check the NEWEST emit's engine-computed counts (\`decisions_captured\`, \`open_questions_count\`, \`open_questions_with_recommendation\`) against a FRESH parse of the current \`explore.md\` (count per the five-section convention: Decisions entries; Open-question entries; those whose \`Standing recommendation:\` value is present and not the literal \`none yet\`). This closes leak-hardening layer 3's loop:

- **Any count mismatch** → WARNING naming both values and the file, with the staleness interpretation: either the file changed after the last boundary emit (a session ended without its sweep/emit) or an emit was produced outside the engine surface.
- **Open-question entry missing the \`Standing recommendation:\` slot** → SUGGESTION naming the entry (the explore body corrects it on next touch).
- **No emits on the staging trail** → skip silently.

### 8. Apply scorecard rollup

| Dimension | Categories contributing |
|---|---|
| **Completeness** | Category 4 (Archive coherence) |
| **Correctness** | Category 1 (Vocabulary residue), Category 2 (Lens staleness), Category 6 (Emit attestation) |
| **Coherence** | Category 3 (Cross-doc consistency), Category 5 (Touchpoints divergence) |

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

**Standalone invocations only** — library / pre-archive contexts write no separate JSON (findings fold into the caller's emit: the review's \`review-system-<TS>.json\` or the archive's \`archive-<TS>.json\` \`audit.*\` fields). Compose the payload in the shape of the **Example payload** in \`references/run-summary-schema.md\` — the only keys it may carry are the ones that example carries; the two counts are engine-computed and refused — write it to a temp file, and invoke:

\`\`\`bash
orbit emit audit-drift --change <name> --payload <payload-file>   # change-scoped standalone
orbit emit audit-drift --payload <payload-file>                   # project-wide standalone (bare)
\`\`\`

The ENGINE owns the spine, paths, collision handling, and the WHOLE \`next_recommended\` logic — all four mode × findings combinations, including the clean-run defer-to-prior-narrative rule. Never hand-compose them.

## Output format

Header (\`## Audit-drift report\` + \`Context: <standalone|library|pre-archive>\` + depth + flags) → \`### Summary\` scorecard table grouped by Category and Dimension → \`### Findings\` grouped by severity (CRITICAL/WARNING/SUGGESTION; each finding \`**[Category N] file:line** — title\` then \`Recommendation: ...\`) → \`### Stale findings suppressed\` (when applicable) → \`### Final assessment\` (context-specific phrasing; omitted when library context) → \`Run summary: <path>\` line.

### Disjunctive recommendations: emit structured \`recommendation_options\`

When a finding's recommendation genuinely offers the user a choice between two or more defensible concrete paths (different outcomes, not rewordings), emit \`recommendation_options: [{label, body}]\` alongside the prose \`recommendation\` — each entry a non-empty \`label\` plus the concrete action. Do NOT emit it for single-action recommendations or loose conversational "or" — false-negative bias is intentional. The prose field still summarizes the disjunction; the structured field is the fork affordance address-reviews consumes, OPTIONAL on every finding (canonical shape: \`references/run-summary-schema.md\`).

## Worked example

A full standalone-depth report walkthrough lives in \`references/worked-example.md\`.

## Graceful degradation

- **No \`orbit/changes/archive/\`** → Category 4 skipped with \`no archived changes; skip Category 4\`.
- **Empty lenses files** → Category 2 skipped with note.
- **No project/governance docs** (\`CLAUDE.md\`, \`project.md\` absent) → Category 3 doc-vs-doc skipped; spec-only checks remain.
- **\`--focus <area>\` with non-existent target** (e.g., \`--focus lenses\` but lenses absent) → command exits gracefully with \`<focus area> unavailable; nothing to scan\`.

## Inline mode unchanged

When \`/orbit:audit-drift\` is called by \`/orbit:archive\` (library / pre-archive context), findings are captured inside \`archive-<TS>.json\` per the existing convention. The inline-mode emit is owned by the archive flow.
`,
    references: [
      {
        name: 'run-summary-schema.md',
        content: AUDIT_DRIFT_RUN_SUMMARY_SCHEMA_REFERENCE,
      },
      {
        name: 'worked-example.md',
        content: AUDIT_DRIFT_WORKED_EXAMPLE_REFERENCE,
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

This command is a thin launcher: invoke the \`orbit-audit-drift\` skill, passing along any arguments given with the command (e.g., \`/orbit:audit-drift [<change-name>] [--fast|--full] [--focus <area>] [--since <ref>]\`). The skill carries the complete workflow instructions — upstream behavior plus orbit's additions. Do not improvise the workflow from this file; load the skill.`
  };
}
