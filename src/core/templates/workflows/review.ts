/**
 * Skill Template Workflow Modules
 *
 * orbit editorial workflow (B3, merged D5): the single review surface. D-arc Stage D5
 * absorbed the standalone review-external workflow as the --reviewer external branch
 * (references/external-handoff.md; record vocabulary frozen) and split the per-mode pass
 * definitions into lazy references (passes-{proposal,system,architecture}.md).
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

The schema below documents per-command extensions ADDED to that spine (\`mode\`, \`iteration\`, \`depth\`, \`reviewer_class\`, \`flags\`, \`passes_run\`, \`passes_skipped\`, \`scorecard\`, \`findings\`, \`blocks\`, \`stale_suppressed\`, \`commentary\`, \`direction\`, \`verification\`, and the engine-computed \`pass_genre\` and \`verified_walks\`). The former \`findings_summary\` and \`iteration_note\` fields are RETIRED in CHANGE MODES (D-arc Stage D4): \`scorecard\` supersedes the counts (readers tolerate both generations), and the iteration note is RENDERER-computed from the trail — a stored copy would be a second stale voice. (Architecture-mode emits carry the same \`scorecard\` shape; the interim hand-rendered report path documented below reads it — no render surface covers the architecture trail yet.) Per-command extensions are review-specific state; they supplement, not replace, the spine.

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
  "pass_genre": "REVIEW" | "VERIFICATION",        // engine-computed; refused in the payload
  "verified_walks": ["<address-reviews TS token>"], // engine-computed; [] on every REVIEW-genre pass
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
      "reproduction": "<the finding's reproduction, as orbit-conventions' Severity ladder defines one — REQUIRED non-empty on CRITICAL, optional otherwise; multi-line allowed>",
      "recommendation_options": [
        { "label": "A", "body": "<option A body>" },
        { "label": "B", "body": "<option B body>" }
      ],
      "walk_entry": { "title": "<a walk entry's title>", "file": "<its file>" }
    }
  ],
  "blocks": ["<optional: one single-line entry per lifecycle block with its location — a validate failure, an unresolved @review: marker; absent when none>"],
  "stale_suppressed": [
    {
      "pass": "<pass id>",
      "title": "<original finding title>",
      "evidence": "<grep output or commit hash showing why it's stale>"
    }
  ],
  "commentary": "<optional — the reviewer's color commentary, rendered verbatim into the report's delimited Commentary slot>",
  "direction": {
    "disposition": "forward" | "hold",
    "reasoning": "<the reviewer's forward recommendation — WHICH WAY and WHY; multi-line allowed. OWED when reviewer_class is fresh or external, optional in-context>"
  },
  "verification": [
    { "title": "<owed walk entry's title>", "file": "<its file>", "verdict": "landed" | "regressed" }
  ]
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
- **\`reproduction\`** (rc02b) is a string on each finding — multi-line allowed, never a single-line slot — REQUIRED non-empty when \`severity\` is \`CRITICAL\` and optional otherwise, per \`orbit-conventions\`' Severity ladder — which also defines what a reproduction IS; this note defines nothing. \`orbit emit review\` REFUSES a CRITICAL without one in every mode, naming the finding, and refuses a present non-string one at any severity (per \`orbit-emit-composition\`); the engine checks presence, never truth — whether it reproduces is the walk's call. Prior-generation emits lack the field and remain valid; the report renders such a CRITICAL \`[unreproduced]\`.
- **\`blocks\`** (rc02b) is an OPTIONAL array of single-line strings, one per lifecycle BLOCK the pass found — a condition that must be addressed before apply and is not a severity, per \`orbit-conventions\`' Severity ladder (by pointer; this reference defines no block of its own) — each naming the condition and its location. Never counted in the scorecard, never a finding, never a gate input; the report renders them above the findings. The surface refuses a non-array or a multi-line entry naming \`blocks[<i>]\`.
- **\`direction\`** (rc04b) is the pass's FORWARD RECOMMENDATION, the object the block above shows: OWED when \`reviewer_class\` is \`fresh\` or \`external\` and OPTIONAL in-context — \`orbit emit review\` refuses the payload otherwise, in every mode. Its SHAPE is owned by \`orbit-emit-composition\`'s **The review payload carries \`direction\`** and its CONTENT contract by \`orbit-report-rendering\`'s **Direction renders as its own section and its absence is marked on independent passes** (which also renders it as \`### Direction\` and marks a prior-generation independent pass \`[no direction]\`); the authoring instruction is Step 8 of the body. The vocabulary is \`orbit-run-summary-emit\`'s judgement record's (\`disposition\` + \`reasoning\`) — adopted, not invented. This note names the owners and re-lists nothing.
- **\`pass_genre\` / \`verified_walks\`** (rc03c) are ENGINE-COMPUTED on every review emit, in every mode, and REFUSED in the payload: the pass genre by the table \`orbit-conventions\`' **Review mode decision framework** owns, and the qualifying walks it read, by \`orbit-emit-composition\`'s **The review emit records its pass genre and the walks it verifies**. Never supply either; a refusal naming the owed record is how a body learns the engine computed VERIFICATION.
- **\`verification\` / \`walk_entry\`** (rc03c) are the VERIFICATION RECORD and a finding's link to it: \`verification\` is OWED when the computed \`pass_genre\` is \`VERIFICATION\` (\`[]\` when nothing is owed) and REFUSED in any form on a REVIEW-genre pass; \`walk_entry\` is optional on each finding. Their shapes, the owed set and the meaning of \`landed\` / \`regressed\` are owned by \`orbit-emit-composition\`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record**; the render (\`### Verification\`, the \`walk entry:\` line, \`[outside the walk record]\`, \`[no verification record]\`) by \`orbit-report-rendering\`'s **Verification renders as its own section and its absence is marked**; the grading procedure is Step 5's VERIFICATION branch. This note names the owners and re-lists nothing.
- **\`recommendation_options\`** is OPTIONAL on each finding. Present only when the finding's recommendation is genuinely disjunctive — multiple defensible paths the user must choose between. Producer-side contract (per \`orbit-review\` spec's \`Optional recommendation_options field on finding entries\`): MUST contain ≥ 2 entries; each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, … or \`"1"\`, \`"2"\`, …) and non-empty \`body\`. The prose \`recommendation\` field still summarizes the disjunction for human readers. Consumer (address-reviews) uses this for the structured decision-fork detection path; absence triggers heuristic fallback. Omit the field for single-recommendation findings.

## Architecture-mode extensions (D-arc Stage D2)

Architecture-mode emits (\`review-architecture-<TS>.json\` in the architecture trail) use the same spine and per-command extensions with these differences:

- \`change: null\` and a REQUIRED \`doc\` field (the reviewed doc's filename stem — iteration counting anchors to matching-\`doc\` emits only).
- \`mode: "architecture"\`; \`iteration\` is per-doc (not per-change).
- \`scorecard\` is the same 3-dimension × 3-severity shape as change modes — the engine runs the scorecard rollup check in architecture mode too (corrected 2026-09-11 by the schema-table parity test; \`findings_summary\` was never accepted by the review payload table); findings cite \`<doc>.md:line\`.
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
  "scorecard": { "completeness": { "critical": 0, "warning": 0, "suggestion": 0 }, "correctness": { "critical": 0, "warning": 0, "suggestion": 0 }, "coherence": { "critical": 0, "warning": 0, "suggestion": 0 } },
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

const REVIEW_PASSES_PROPOSAL_REFERENCE = `# Reference: proposal-mode passes (9)

Loaded by Step 6 when the resolved mode is \`proposal\`. Pass CONTENT is unchanged by the reference split (an organizational move only).

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
                                       (a BLOCK — must address before apply)
9. Pre-Handoff Sweep                  small things missed on first read
\`\`\`

**Pass 1 — Structure & Delta Integrity**. Run \`orbit validate "<name>"\`; confirm required artifacts present; check delta sections (ADDED/MODIFIED/REMOVED/RENAMED Requirements) follow the delta-spec format. A validate failure is a BLOCK, per \`orbit-conventions\`' Severity ladder — it stops apply whatever it would cost a user, so it is composed into the emit's \`blocks\` array, never into \`findings[]\` and never a scorecard cell; a delta-section anomaly: WARNING, per the ladder — an implementation built to a malformed delta would diverge; a cosmetic issue: SUGGESTION.

**Pass 2 — Internal Coherence**. Compare proposal / design / specs / tasks: scope alignment, design-to-requirement mapping, requirement-to-task coverage, count consistency, no scope creep. A spec requirement with no task: WARNING, per \`orbit-conventions\`' Severity ladder — an implementation built to the artifact would omit it (it gates; it buys no further independent pass); count/label disagreement: WARNING, per the ladder — the same divergence risk.

**Pass 3 — Cross-Doc Coherence**. Will \`CLAUDE.md\`, \`orbit/project.md\`, \`*_convention.md\` files still be accurate post-apply? Look for renamed concepts referenced under old names, new capabilities missing from project context, conventions contradicting deltas. Stale post-apply context: WARNING, per \`orbit-conventions\`' Severity ladder — a reader built to the stale doc would diverge; enrichment: SUGGESTION.

**Pass 4 — Archive Consistency**. ADDED requirements don't conflict with archived baseline; RENAMED FROM names exist in archive; REMOVED requirements aren't still referenced. A direct contradiction of baseline: CRITICAL only with a reproduction naming the baseline behaviour that breaks, per \`orbit-conventions\`' Severity ladder — else WARNING; a dangling reference: WARNING, per the ladder.

**Pass 5 — Codegen Readiness**. Per requirement: precise enough that two implementers produce the same code? Inputs/outputs/side effects stated? Hidden assumptions ("the obvious path", "the usual default") made explicit? Ambiguity that could split implementations: WARNING, per \`orbit-conventions\`' Severity ladder — this is the ladder's WARNING definition itself.

**Pass 6 — Gap Hunt (generative completeness)**. Per requirement in spec deltas, probe: (a) unstated assumptions an implementer would have to invent? (b) error/edge-case paths specified, not just happy paths? (c) state transitions explicit, including invalid ones? (d) "X SHALL do Y" — Y precise enough? Cite file:line + the specific gap; suggest concrete spec additions.

**Pass 7 — Drift Hunt**. Search artifacts for old vocabulary the change is replacing. Grep change directory AND project docs (\`*_convention.md\`, \`project.md\`, \`CLAUDE.md\`). Old vocabulary in a delta itself: WARNING, per \`orbit-conventions\`' Severity ladder — an implementation built to the delta would carry the old name; old vocabulary in project docs: WARNING, per the ladder — the same divergence, one layer out.

**Pass 8 — Inline Review Marker Residue**. Grep change directory for \`@review:\` markers. **Actual unresolved markers** in artifact content → a BLOCK, per \`orbit-conventions\`' Severity ladder (must address before applying): composed into the emit's \`blocks\` array — one single-line entry naming the marker and its file:line — never into \`findings[]\`, never a scorecard cell; nothing stops on it mechanically (the ladder's known limit), so the report's Blocks section is what the human reads before apply. **Documentation appearances** inside fenced code blocks, inline-code spans, or explicit "example" prose contexts → NOT findings. When ambiguous, list the marker as a block and grade nothing — the user decides during \`/orbit:address-reviews\`.

**Pass 9 — Pre-Handoff Sweep**. Final read asking "what would I be embarrassed to ship?" — awkward wording, stale TODO/FIXMEs in artifacts, inconsistent capitalization, examples that don't match prose. Almost always SUGGESTION, per \`orbit-conventions\`' Severity ladder — nothing here breaks a path or splits an implementation.

##### \`--fast\` subset (proposal mode)

When \`--fast\` is set, run only Passes 1, 7, 8. Report remaining passes as \`skipped per --fast\`.


#### Proposal-mode mapping

| Dimension | Passes contributing |
|---|---|
| **Completeness** | 1 (Structure & Delta), 5 (Codegen Readiness), 6 (Gap Hunt) |
| **Correctness** | 2 (Internal Coherence), 4 (Archive Consistency) |
| **Coherence** | 3 (Cross-Doc), 7 (Drift Hunt), 8 (Inline Marker Residue), 9 (Pre-Handoff) |

`;

const REVIEW_PASSES_SYSTEM_REFERENCE = `# Reference: system-mode passes (0–6)

Loaded by Step 6 when the resolved mode is \`system\`.

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

**Pass 0 — verify-change delegation**. Invoke the \`orbit-verify-change\` skill via \`/orbit:verify <change-name>\`. Fold its findings into the scorecard: task-completion + spec-coverage → Completeness; requirement-implementation-mapping + scenario-coverage → Correctness; design-adherence + code-pattern-consistency → Coherence. GRADE the folded findings per \`orbit-conventions\`' Severity ladder as this body's own (the composing body is their AUTHOR here — not a reader re-grading verify-change, whose own emit is untouched): an incomplete task or an uncovered scenario is WARNING — an implementation built to the artifact would diverge; a violated requirement is CRITICAL ONLY when the violation breaks a user path or loses data, with the requirement and the observed behaviour as its \`reproduction\` — a violated formatting or documentation requirement with neither consequence is WARNING; a CRITICAL this body cannot reproduce folds as WARNING. If \`--skip-verify\` set, omit Pass 0 with note \`Pass 0: skipped per --skip-verify\`.

**Pass 1 — Baseline Compliance**. Read every requirement in archived \`orbit/specs/*/spec.md\` (not just deltas). Does the change break any baseline behavior? A violated baseline requirement: CRITICAL, per \`orbit-conventions\`' Severity ladder, ONLY when the violation breaks a user path or loses data — with the violated requirement and the observed behaviour as the reproduction; a violation with neither consequence (a formatting or documentation rule): WARNING, per the ladder — the artifact and the product diverge; a regressed-looking scenario: WARNING, per the ladder — regression RISK is a divergence an implementation could make.

**Pass 2 — Cohesion**. Files the change touched (from \`git diff\` + tasks list). Walk callers/dependents not in the change's tasks for signature drift, semantic shifts, new side effects. A downstream clearly broken: CRITICAL, per \`orbit-conventions\`' Severity ladder — a reproducible user path, with the break as the reproduction; caller-side contract drift: WARNING, per the ladder — divergence risk.

**Pass 3 — Surface Walk**. Enumerate surfaces from \`orbit/specs/<capability>/spec.md\` — **capabilities ARE surfaces**; do not redefine them in lenses. Check each (CLI flags / subcommand names, HTTP routes, MCP tool names, public function signatures) remains coherent after the change. A surface removed unintentionally: CRITICAL only with the removal shown as the reproduction, per \`orbit-conventions\`' Severity ladder — else WARNING; an inconsistency: WARNING, per the ladder.

**Pass 4 — Perspective Reviews**. If \`orbit/lenses/perspectives.md\` exists and is non-empty: for each named perspective, simulate typical call patterns from that caller's POV. Awkward, inconsistent, or surprising interactions from that POV: WARNING, per \`orbit-conventions\`' Severity ladder — a caller built against the artifact would diverge; SUGGESTION below that. If the file is empty or absent, skip Pass 4 with the note \`no perspectives defined; skip Pass 4\`.

**Pass 5 — Critical-Path Scan**. If \`orbit/lenses/critical-paths.md\` exists and is non-empty: for each named flow, walk the code end-to-end checking for breakage, regression, or drift. Path breakage: CRITICAL, per \`orbit-conventions\`' Severity ladder — with the walk that breaks as the reproduction; regression risk: WARNING, per the ladder — the ladder's own two definitions. If absent, skip with \`no critical paths defined; skip Pass 5\`.

**Pass 6 — Drift / Residue**. Invoke \`/orbit:audit-drift\` as a library function (via the orbit-audit-drift skill). Fold its findings into the report under the Coherence dimension. Audit-drift handles its own scorecard and severity assignment; preserve those (a statement site the Severity ladder names as a known limit — not this body's to re-grade).

##### \`--fast\` subset (system mode)

When \`--fast\` is set, run Passes 0, 1, 6. Report remaining as \`skipped per --fast\`. Combining \`--fast --skip-verify\` runs only Passes 1 and 6.


#### System-mode mapping

| Dimension | Passes contributing |
|---|---|
| **Completeness** | Pass 0 (verify-change completeness portion: task-completion + spec-coverage), Pass 5 (critical-paths existence) |
| **Correctness** | Pass 0 (verify-change correctness portion: requirement-implementation-mapping + scenario-coverage), Pass 1 (Baseline), Pass 2 (Cohesion), Pass 5 (critical-paths working) |
| **Coherence** | Pass 0 (verify-change coherence portion: design-adherence + code-pattern-consistency), Pass 3 (Surface Walk), Pass 4 (Perspective Reviews), Pass 6 (Drift/Residue from audit-drift) |

`;

const REVIEW_PASSES_ARCHITECTURE_REFERENCE = `# Reference: architecture-mode passes (6)

Loaded by Step 6 when the resolved mode is \`architecture\`.

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


#### Architecture-mode mapping

| Dimension | Passes contributing |
|---|---|
| **Correctness** | 1 (Cohesion / traceability), 2 (Completeness / exit-criteria), 3 (Dependencies / sequencing) |
| **Completeness** | 2 (Completeness / exit-criteria) |
| **Coherence** | 4 (Layer-fit), 5 (Route-level alternatives), 6 (Economy self-audit) |

`;

const REVIEW_EXTERNAL_HANDOFF_REFERENCE = `# Reference: the external-handoff branch (\`--reviewer external\`)

This branch packages a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review of an OpenSpec change — the behavior formerly invoked as the standalone \`/orbit:review-external\` command (RETIRED at D-arc Stage D5; the RECORD VOCABULARY IS FROZEN: the T0 emit keeps \`command: "review-external"\` and its \`review-external-<TS>.json\` filename, prompts keep \`external-prompt-<as>-<TS>.md\`, findings keep \`external-<as>-<TS>.md\` — gates, orientation WAITING arithmetic, the report ordinal, and the address-reviews parser all key on those names). The branch emits **two things**: (a) a self-contained markdown prompt written to \`orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\` (committed; the external AI reads it from the repo), and (b) a short invocation snippet to chat that tells the user what to paste into the external AI's session.

**Does NOT run the review and does NOT ingest findings.** The external AI does the review work. Ingestion is \`/orbit:address-reviews --from-file <path>\`. This command's job is solely to package the handoff.

**Input**: the change name and \`--as proposal|system\` resolved by the review trunk before this reference loads (\`--reviewer external\` requires \`--as proposal|system\`; architecture mode never reaches this branch). Compose the T0 emit via \`orbit emit review-external --change <name>\` — the engine owns the spine, the paste/save/ingest recommendation, and \`awaiting_findings\`.

## Disciplines

The four execution disciplines travel with the review body that loaded this reference; the one branch-specific note: the prompt instructs the external AI **not** to apply pushback (\`Do not push back on stale findings\`) — pushback is enforced at resolution, in \`/orbit:address-reviews\`.

## Steps

### 1. Resolve the change

If a change name is provided, use it. Otherwise:
- Run \`orbit list --json\` to get available changes.
- Use **AskUserQuestion** to let the user select.

State \`Using change: <name>\` at the top of the chat output.

### 2. Resolve the mode

Mode comes from \`--as proposal|system\` if specified. If omitted:

1. Read \`orbit/changes/<name>/tasks.md\`.
2. **All unchecked** → infer \`proposal\`.
3. **All checked + code changes visible** (heuristic: \`git log\` shows commits after the change directory was created) → infer \`system\`.
4. **Ambiguous** → use **AskUserQuestion** to let the user pick.

Emit a one-line inference note in chat output when \`--as\` was omitted: \`Generating external-review prompt as \\\`<as>\\\` (inferred from tasks state).\`

### 3. Handoff preflight — committed-and-pushed state

The pull-based handoff only works if the external AI can actually see the reviewed state. Record two facts (used by Step 8):

1. **Working tree**: \`git status --porcelain\` — any output means the reviewed state is not fully committed (and the prompt file written in Step 7 will itself be uncommitted).
2. **Remote sync**: \`git rev-list @{u}..HEAD --count\` (skip if no upstream) — a non-zero count means local commits aren't pushed.

(The external AI pulls the repo, so it only sees what's committed AND pushed. A pull-based invocation emitted against dirty or unpushed state hands the external AI a repo without the change — the handoff silently reviews stale state or fails.)

If the repo has no remote at all, the preflight is satisfied by the local-path handoff route (see Graceful degradation).

### 4. Count iterations (per mode)

In \`orbit/changes/<name>/.orbit-runs/\`, count files matching \`external-<as>-*.md\` (findings files from prior external reviews in this mode — distinct from \`external-prompt-<as>-*.md\` which are prompt files).

- N matching files → this is iteration N+1.
- 0 matching files → iteration 1; note \`first external review for this change in <as> mode\`.

### 5. Load cycle context

The "Cycle context" section of the prompt carries the **iteration number ONLY** (Step 4) — no finding, open or resolved, internal or external, and no pointer at the trail for the reviewer to read. An external pass is REVIEW pass genre, and what a REVIEW-genre brief may carry is \`orbit-conventions\`' \`Review mode decision framework\`'s rule, stated there once. This branch still READS the trail to count iterations (Step 4) and to pick the recommended session (Step 6); the reviewer never does.

If \`.orbit-runs/\` is absent or holds no prior external file for this mode: iteration 1.

### 6. Compute the recommended-session note

Read the \`**Reviewer**:\` field from existing \`external-<as>-*.md\` files in \`.orbit-runs/\` (these record which AI did each prior review). Pick the phrasing:

- **Iteration 1**: \`Fresh session recommended — first external pass; sets independent baseline. Pick any AI (codex / fresh Claude / GPT / etc.).\`
- **Iteration 2**: \`Fresh session in a DIFFERENT AI than iter 1's reviewer recommended (model diversity catches different blind spots). If iter 1 was <prior reviewer>, try <suggest different model>.\`
- **Iteration 3+**: \`Fresh session in a previously-unused AI recommended (maximum independence); when every available AI has reviewed this change in this mode, a fresh session of the least-recently-used.\`

Least-recently-used is decided by ONE ordering input: each reviewer's latest \`external-<as>-*.md\` token in this mode; the reviewer whose latest token is oldest is least-recently-used. A continued same-AI session is never recommended: it would carry its prior findings in its own head into a REVIEW-genre pass (the owner's brief rule, above).

### 7. Write the prompt file

Compose the full self-contained prompt (per the reference template below) and write to:

\`\`\`
orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md
\`\`\`

\`<TS>\` is ISO-8601 with hyphens (e.g., \`2026-05-18T14-35-23Z\`). Create \`.orbit-runs/\` if it doesn't exist. The file is **committed**, not gitignored.

Mode-specific content:

- **"What to read for THIS review"** lists files appropriate to the mode (proposal mode emphasizes the change directory artifacts; system mode adds \`git diff\`, codebase paths, lens files).
- **"What to look for"** enumerates the 9 proposal-mode passes or the 7 system-mode passes (see below).

The **"Output format"** block inside the prompt MUST appear verbatim — the section headers (\`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\` / \`## Blocks\` / \`## Direction\`) and the field labels (\`**File**:\`, \`**Description**:\`, \`**Reproduction**:\`, \`**Disposition**:\`) are what \`/orbit:address-reviews --from-file\` and the report renderer parse. Deviating breaks ingestion. The \`## Severity\` paragraph before it is \`orbit-conventions\`' Severity ladder, mirrored byte-equal (a parity test holds it) — carry it as written.

### 8. Emit the chat invocation snippet

Print to chat, in this exact order:

1. **(optional)** Mode-inference note when \`--as\` was omitted: \`Generating external-review prompt as \\\`<as>\\\` (inferred from tasks state).\`
2. **(required)** Recommended-session note: \`Recommended session: <phrasing from Step 6>\`
3. **(required)** The prompt file path: \`Prompt: orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\`
4. **(conditional — preflight gate)** ONE of:
   - **Preflight satisfied** (clean tree, no unpushed commits — or local-path route): FIRST affirmatively state the prompt's committed-and-pushed state with evidence — \`Prompt committed (<short-sha>) and pushed to <remote>/<branch>\` (or, on the local-path route, the equivalent naming the path) — NEVER implied by the mere absence of a warning; THEN the copy-paste-ready invocation: \`Pull <repo URL> and read <prompt-file-path>. Follow its instructions; write findings to the path specified inside.\` (Get \`<short-sha>\` from \`git rev-parse --short HEAD\` and \`<remote>/<branch>\` from \`git rev-parse --abbrev-ref --symbolic-full-name @{u}\` after the push.)
   - **Preflight failed** (dirty tree and/or unpushed commits): the pull invocation is WITHHELD. Emit instead: \`Handoff blocked: <dirty tree | N unpushed commit(s)>. Commit the pending work (including the prompt file above) and push, then hand off: Pull <repo URL> and read <prompt-file-path>. ...\` — the commit+push action leads; the pull text is framed as the after-push step, never as an immediately-usable instruction.
5. **(required)** The eventual findings path: \`When findings come back: /orbit:address-reviews --from-file orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md (TS will be set by the external AI when it writes).\`

No other items. Required items always appear in the specified order. (The T0 emit's \`next_recommended\` mirrors the gate: when the preflight failed, it leads with the commit+push action before the paste step.)

## Reference prompt template

The template's \`## Notes\` instruction carries the Commentary content contract (D-arc Stage
D4): the Notes body renders VERBATIM into the report's delimited Commentary slot, so the
external reviewer must carry pattern/probing/risk texture and
do NOT state finding counts, gate verdicts, or next commands — those exist only in the
report's engine-computed sections. The template's \`## Direction\` instruction carries the
direction's content contract the same way (rc04b): the section is REQUIRED on every return,
owned by \`orbit-conventions\`' External-review findings markdown format, its content contract by
\`orbit-report-rendering\`'s Direction requirement; a return without it is still a pass and renders
marked \`[no direction]\`.

The full template for the file written in Step 7 lives at \`references/prompt-template.md\`. Read that file when composing the prompt. The template is verbatim — preserve named sections and especially the "Output format" block (the \`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\` / \`## Blocks\` / \`## Direction\` headers + \`**File**:\` / \`**Description**:\` / \`**Reproduction**:\` / \`**Disposition**:\` field labels) so \`/orbit:address-reviews --from-file\` parses cleanly.

## Mode-specific sections

Mode-specific content (the "What to read for THIS review" file list and the "What to look for" pass list) lives at \`references/mode-sections.md\`. Read that file and substitute the appropriate block (proposal: 9 passes / system: 7 passes) into the template.

## Worked example (chat output, iter 5 proposal-mode review of \`add-review-workflows\`)

\`\`\`
Generating external-review prompt as \`proposal\` (inferred from tasks state).

Recommended session: Iter 5 — Fresh session in a previously-unused AI recommended
(maximum independence); iters 1–4 were codex and Claude, so try GPT.

Prompt: orbit/changes/add-review-workflows/.orbit-runs/external-prompt-proposal-2026-05-18T14-35-23Z.md

To run (handoff preflight satisfied — tree clean, remote in sync): Pull <repo URL> and read
orbit/changes/add-review-workflows/.orbit-runs/external-prompt-proposal-2026-05-18T14-35-23Z.md.
Follow its instructions; write findings to the path specified inside.

When findings come back: /orbit:address-reviews --from-file
orbit/changes/add-review-workflows/.orbit-runs/external-proposal-<TS>.md
(<TS> will be set by the external AI when it writes.)
\`\`\`

## Out of scope

The command does not run the review and does not ingest findings:

- **Running the review**: the external AI does it. This command is packaging.
- **Ingesting findings**: \`/orbit:address-reviews --from-file <path>\` ingests; this command emits the path the user will pass to that command later.

## Graceful degradation

- **No \`.orbit-runs/\`** → create it as part of writing the prompt file; iteration is 1.
- **No prior external review** → recommended-session note uses iter 1 phrasing; cycle context reads \`- Iteration: 1\`.
- **No lenses files** → "Project context (read first)" line for those still appears (the \`(if present)\` qualifier handles the absence); external AI will see they're absent when it pulls the repo.
- **No git remote / repo URL unknown** → emit the local path instead of a URL and add a note: \`If you don't have access to this repo, copy it to a shared location and update the invocation.\`

## Run-summary emit (T0 — when prompt is packaged, before findings return)

(Per \`orbit-run-summary-emit\` capability)

The external-handoff branch writes TWO artifacts during a single invocation:

1. **The prompt file**: \`external-prompt-<as>-<TS>.md\` written per Step 7.
2. **The T0 run-summary JSON**: emitted at command completion (after Step 8's chat invocation snippet), recording that the external pass was packaged and is awaiting findings.

The T0 emit goes to:

\`\`\`
orbit/changes/<name>/.orbit-runs/review-external-<TS>.json
\`\`\`

Where \`<TS>\` is ISO-8601 UTC with hyphens. Create \`.orbit-runs/\` if it doesn't exist. Use a FRESH timestamp distinct from the prompt file's \`<TS>\` (one ISO-second resolution may make them identical; bump by one second if so).

This is the T0 emit. T1 (findings returned and ingested via \`/orbit:address-reviews --from-file\`) is the EXISTING \`address-reviews-<TS>.json\` emit and is unaffected.

### JSON shape

Per the universal spine in \`orbit-conventions\`'s \`Internal-run JSON summary format\` + per-command extensions:

\`\`\`json
{
  "command": "review-external",
  "timestamp": "<ISO-8601 UTC>",
  "change": "<name>",
  "final_assessment": "<narrative, e.g., 'External review prompt packaged for <name> (iter <N>, mode <as>); awaiting findings from <target>.'>",
  "next_recommended": "<multi-step prose; see below>",
  "kind": "editorial",
  "mode": "proposal" | "system",
  "prompt_path": "orbit/changes/<name>/.orbit-runs/external-prompt-<as>-<TS>.md",
  "target": "<named external AI if user specified; null otherwise>",
  "awaiting_findings": true,
  "judgements": [ { "kind": "continuation", "disposition": "spend", "formed_against": ["<independent pass TS>"], "reasoning": "<why a further pass was bought>", "ratified_by": "ai|user" } ]
}
\`\`\`

**THE SPEND RECORD (rc04a).** When this handoff is a FURTHER independent pass bought past a gate that has ALREADY passed — a decision the cadence has no other home for — the payload SHALL carry a \`judgements\` entry with \`kind: "continuation"\` and \`disposition: "spend"\`, written at exactly the moment the decision is taken rather than reconstructed later. \`formed_against\` names the passes already returned; \`reasoning\` says why another was worth buying. The token source is the TRAIL ITSELF, not \`orbit status\`: the change-tier status payload reports gate spend COUNTS and reason strings, never pass tokens. List \`orbit/changes/<change-name>/.orbit-runs/\` and take the \`<TS>\` of each \`review-<mode>-<TS>.json\` whose \`reviewer_class\` is \`fresh\` or \`external\`, plus each \`external-<mode>-<TS>.md\` the trail reader ACCEPTED as a pass — a return the gate's \`reason\` names as REJECTED is not citable, and enumerating filenames alone over-counts by exactly those. Which passes count is \`orbit-run-summary-emit\`'s rule (the trail reader's pass set); this body names it and does not restate it — the write gate enforces it and names the pass it refuses on. This emit admits \`continuation\` ONLY — a \`readiness\` here is refused, since the T0 handoff record has no reader for one. A handoff that merely covers a DECLARED, still-uncovered cadence slot is not a spend decision and carries no record.

\`awaiting_findings: true\` is always set at T0. Future tooling may flip this when findings land; for now it's a flag that downstream consumers can use to identify "T0 emit, not yet completed cycle." \`reviewer_class: "external"\` (C1) describes the intended handoff class for audit readability — but per \`orbit-run-summary-emit\`, a T0 emit is a PACKAGING record, NOT a completed pass: whichever cadence slot an external return would satisfy — a bare \`external\` slot, an \`independent\` slot, or the external half of a \`blind-pair\` — is satisfied ONLY when an \`external-<as>-<TS>.md\` findings file exists, so a packaged-but-unreturned external never counts as class coverage.

### \`next_recommended\` — multi-step prose

Per \`orbit-run-summary-emit\`'s \`Review-external T0 multi-step recommendation\` requirement, the recommendation is multi-step prose describing the user action plus the follow-up command (per D14):

\`\`\`
"Paste orbit/changes/<name>/.orbit-runs/external-prompt-<as>-<TS>.md
 into the target AI, save the response as
 orbit/changes/<name>/.orbit-runs/external-<as>-<TS>.md,
 then /orbit:address-reviews <name> --from-file <path>"
\`\`\`

A downstream status reader's tier-1 best-effort parse SHALL find no leading \`/orbit:<verb>\` (because the string leads with "Paste"); \`command\` and \`args\` are left null, and the full verbatim string is surfaced in \`reason\`. This is the expected behavior — multi-step user actions are accurately represented as prose, not collapsed into a single command.
`;

const REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE = `# Reference: mode-specific sections

Substitute these into the \`## What to read for THIS review\` and \`## What to look for\` sections of the prompt template (\`references/prompt-template.md\`) based on the resolved \`--as\` mode.

## Proposal mode — "What to read for THIS review"

\`\`\`
- orbit/changes/<change-name>/proposal.md
- orbit/changes/<change-name>/design.md
- orbit/changes/<change-name>/tasks.md
- orbit/changes/<change-name>/specs/<capability>/spec.md (every spec under specs/)
- orbit/changes/<change-name>/explore.md (if present)
- orbit/specs/<capability>/spec.md (archived baselines — for delta consistency checks)
\`\`\`

## Proposal mode — "What to look for" (9 passes)

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; \`orbit validate\` would pass.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks. Count/label consistency. No scope creep.
3. **Cross-Doc Coherence** — \`CLAUDE.md\`, \`project.md\`, \`*_convention.md\` still accurate after this change.
4. **Archive Consistency** — ADDED don't contradict baseline; RENAMED FROM names exist; REMOVED not still referenced.
5. **Codegen Readiness** — no implicit requirements; no decisions left to codegen; no ambiguity.
6. **Gap Hunt** — could a fresh AI implement this from these specs alone? Unstated assumptions? Error paths? State transitions?
7. **Drift Hunt** — old vocabulary lingering; consistency with \`*_convention.md\`.
8. **Inline Review Marker Residue** — any \`@review:\` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

## System mode — "What to read for THIS review"

\`\`\`
- orbit/changes/<change-name>/proposal.md, design.md, tasks.md, specs/
- The change's commit range: git diff <change-start>..HEAD -- . ':!orbit/changes/<change-name>/.orbit-runs' (<change-start> is the commit that first added the change's proposal.md — find it by hash alone: git log --diff-filter=A --format=%h -- orbit/changes/<change-name>/proposal.md | tail -1; commit subjects can carry prior passes' counts, so do not read them)
- orbit/specs/<capability>/spec.md (archived baselines — for baseline-compliance check)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md (judgment layer)
- Code paths touched by the change (cohesion + surface walk)
\`\`\`

## System mode — "What to look for" (7 passes)

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change).
1. **Baseline Compliance** — does this change break any archived \`orbit/specs/\` requirement?
2. **Cohesion** — callers/dependents outside the tasks list. Signature drift, ripple effects, side-effect additions.
3. **Surface Walk** — every CLI / MCP / HTTP / public-function surface in \`orbit/specs/\` still coherent? Capabilities ARE surfaces; don't redefine them.
4. **Perspective Reviews** — for each named perspective in \`orbit/lenses/perspectives.md\`, simulate the caller's POV.
5. **Critical-Path Scan** — for each flow in \`orbit/lenses/critical-paths.md\`, walk end-to-end.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence misses.
`;

const REVIEW_EXTERNAL_PROMPT_TEMPLATE_REFERENCE = `# Reference: external-review prompt template

This is the canonical template for the file written to \`orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\` by the external-handoff branch of \`/orbit:review --as <mode> --reviewer external\`.

**The implementer may adjust phrasing for clarity but MUST preserve the named sections and the "Output format" block verbatim** — the section headers (\`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\` / \`## Blocks\` / \`## Direction\`) and the field labels (\`**File**:\`, \`**Description**:\`, \`**Reproduction**:\`, \`**Disposition**:\`) are what \`/orbit:address-reviews --from-file\` and the report renderer parse. Deviating breaks ingestion. The \`## Severity\` paragraph is a CHECKED MIRROR of \`orbit-conventions\`' Severity ladder (its fenced production), held byte-equal by a parity test — an external reviewer has none of our specs, so the copy must exist and must say what it is; never reword it here.

Mode-specific content (the "What to read for THIS review" file list and the "What to look for" pass list) is substituted from \`references/mode-sections.md\`.

## Template

\`\`\`\`markdown
# External Review: <change-name> (iteration <N>)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

<repo URL or path>

## Project context (read first)

- \`CLAUDE.md\` — handoff orientation (if present)
- \`orbit/project.md\` — project goals + stack (if present)
- \`*_convention.md\` at repo root — naming, error handling, etc. (if present)
- \`orbit/lenses/perspectives.md\` — named callers worth validating from (if present)
- \`orbit/lenses/critical-paths.md\` — user flows worth walking end-to-end (if present)

## Cycle context

- Iteration: <N>

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as <proposal|system>)

<mode-specific file list — see references/mode-sections.md>

## What to look for

<mode-specific pass list — see references/mode-sections.md (9 passes for proposal mode, 7 for system mode)>

## Severity

Grade by \`orbit-conventions\`' Severity ladder. CRITICAL: a user path breaks or data is lost, AND the finding carries its reproduction — a case the reader can re-execute: the inputs, the rule or command, the expected result, the observed result (a command in system mode; a constructed case in proposal mode). WARNING: an implementation built to the artifact as written could diverge from what it intends. SUGGESTION: everything else. When unsure, grade lower. A condition that must stop apply regardless of consequence — an \`orbit validate\` failure, an unresolved \`@review:\` marker — is a BLOCK, not a severity: list it under \`## Blocks\`.

## Output format — write to:

\`orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md\`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

\`\`\`markdown
# External Review: <change-name> (iteration <N>)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>
**Reproduction**: <the re-executable case the \`## Severity\` paragraph above defines>

(For each additional CRITICAL finding, repeat the \`### <Title>\` + \`**File**:\` + \`**Description**:\` + \`**Reproduction**:\` quadruple — a CRITICAL without a Reproduction is counted and marked unreproduced. Use \`None.\` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use \`None.\` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use \`None.\` if no findings.)

## Blocks

<Optional — conditions that must be addressed before apply but name no consequence (an \`orbit validate\` failure, an unresolved \`@review:\` marker): one \`- <what>\` line each. Not severities; never counted. Use \`None.\` if none.>

## Direction

**Disposition**: <forward | hold>

<REQUIRED — your own recommendation on moving forward, as \`orbit-conventions\`' External-review findings markdown format defines the section: the first non-blank line is the \`**Disposition**:\` opener with exactly one of the two tokens; the rest of this section is your reasoning — WHICH WAY and WHY. Never state finding counts, the gate's state, or a next command here; those exist only in the report's engine-computed sections. A return without this section is still a pass, but the report renders it \`[no direction]\`; a section whose first non-blank line is not exactly the opener (or that has no reasoning under it) renders \`[direction malformed]\` with no body.>

## Notes

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole \`## Notes\` section if you have nothing to add.>
\`\`\`
If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (\`## CRITICAL\` / \`## WARNING\` /
   \`## SUGGESTION\`), every \`### Title\` entry, every \`**File**:\`, \`**Description**:\` and
   \`**Reproduction**:\` field, every \`## Blocks\` item, and the \`## Direction\` section (its \`**Disposition**:\` opener and body). Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for \`--from-file\` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   \`\`\`bash
   git add orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md
   git commit -m "External review (<as>, iter <N>): <change-name>

   <one-line summary: severity counts + headline finding if any>"
   git push
   \`\`\`

   Then STATE PLAINLY in your chat output that the findings landed —
   \`Findings committed (<short-sha>) and pushed\` — so the human never has to
   infer whether they reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state explicitly that you could NOT
commit/push, and the user will commit it manually.
\`\`\`\`
`;

const REVIEW_FLAGS_DETAIL_REFERENCE = `# Reference: rarely-used review flags — \`--mark\` / \`--parallel\` / \`--focus\`

Loaded only when one of these flags is set (D5 body-economy pass; content moved from the body verbatim).

### 11. (Optional) \`--mark\` writer (proposal mode only)

If \`--mark\` is set and the mode is \`proposal\`:

For each finding with severity CRITICAL or WARNING (skip SUGGESTION by default; a BLOCK is not a finding and gets no marker):
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
`;

export function getReviewSkillTemplate(): SkillTemplate {
  return {
    name: 'orbit-review',
    description: "Editorial review of an OpenSpec change or an architecture doc: proposal mode (pre-apply, 9 passes over artifacts), system mode (post-apply, verify-change + 6 system-wide passes), or architecture mode (a doc under orbit/architecture/, 6 passes, no gate). Use when the user wants a second-pair-of-eyes pass before applying or archiving, or a graded pass over a program architecture doc.",
    instructions: `Run an editorial review of an OpenSpec change or an architecture doc. Three modes: \`--as proposal\` reviews a change's pre-implementation artifacts (9 passes); \`--as system\` reviews the whole product state after apply (verify-change as Pass 0 + 6 system-wide passes); \`--as architecture\` reviews an architecture DOC under \`orbit/architecture/\` (6 passes, NO gate — D-arc Stage D2). All modes share the 3-dimension scorecard (Completeness / Correctness / Coherence), the severity ladder (CRITICAL / WARNING / SUGGESTION — defined ONCE, by consequence, in \`orbit-conventions\`' Severity ladder; every pass rule NAMES it and defines nothing of its own), pushback discipline, and \`.orbit-runs/\` persistence. They differ on which passes run, what the final-assessment references (the \`review-proposal\` / \`review-system\` gates for the change modes; NO gate in architecture mode), and a few mode-specific flags (\`--mark\` for proposal, \`--skip-verify\` for system). The command additionally carries the REVIEWER-CLASS axis (D-arc Stage D5): \`--reviewer in-context|fresh|external\` (default \`in-context\`; \`--fresh\` remains as shorthand for \`--reviewer fresh\` — supplying BOTH \`--fresh\` and an explicit \`--reviewer\` value is a clean usage error naming the shorthand equivalence). \`--reviewer external\` REQUIRES \`--as proposal|system\` (architecture mode supports in-context and fresh only; the combination is a clean usage error) and dispatches to the EXTERNAL-HANDOFF BRANCH: load \`references/external-handoff.md\` and follow it — the packaging flow (prompt file + T0 emit + chat snippet); no review passes run in that invocation, and the internal-class branches never load that reference.

**Generates findings; does not resolve them.** Resolution flows through \`/orbit:address-reviews\` (inline \`@review:\` markers, OR \`--from-file\` ingesting external-review markdown OR internal review JSON OR audit-drift JSON) or by the user replying directly to the report.

**Input**: Optional change name (or, with \`--as architecture\`, a doc name) and optional \`--as proposal|system|architecture\` mode flag plus secondary flags. If change name omitted, prompt via \`AskUserQuestion\` over \`orbit list --json\` (architecture mode prompts over \`orbit architecture status --json\`'s parseable docs instead). If mode omitted, infer from \`tasks.md\` state (see Step 3) — architecture mode is NEVER inferred.

## Four execution disciplines (epitome)

The four disciplines from \`orbit-conventions\`, embedded per body; detail lives in the step where each fires.

- **Pushback (review-time) — primary here**: verify every finding against current state before reporting; suppress a stale finding with an evidence note (\`stale finding suppressed: <evidence>\`) whose evidence is what the current state shows. A VERIFICATION-genre pass additionally reads its walk (Step 5).
- **Read-before-reference (authoring-time)**: every construct a finding names is backed by an actual read (enforcement rule under Special cases); unverifiable → downgrade or omit.
- **Change completeness (modification-time)**: \`--mark\` insertions land fully in one pass, then sweep for residue (Step 11); stale or partial prior \`.orbit-runs/\` files are cleaned before persisting.
- **No-chaining (turn boundary)**: invoke only the orbit workflow commands the user's message explicitly requests; completing a command ENDS the turn at the position readout + the engine's eligibility line — review-cycle COUNT is the user's call; gate \`passed\` means *eligible*, not *commanded*.

## Pass genre

The table below is a CHECKED MIRROR of \`orbit-conventions\`' \`Review mode decision framework\` — the owner of how a pass's genre is determined and of what a REVIEW-genre brief may carry. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here. The pass genre is a record and a header word; the gate reads nothing of it.

\`\`\`
| reviewer class | mode | trail position | pass genre |
|---|---|---|---|
| \`fresh\` or \`external\` | proposal or system | any | REVIEW — reads the whole artifact and the thesis |
| \`in-context\` | proposal or system | a qualifying walk of this mode precedes the pass | VERIFICATION — reads that walk and answers landed / regressed per resolution |
| \`in-context\` | proposal or system | no qualifying walk of this mode precedes it | REVIEW — a reaction with nothing yet to verify; the cadence's slot arithmetic is unchanged by pass genre |
| \`in-context\` | proposal or system | only MODE-LESS walks precede it | REVIEW — a walk whose mode cannot be read is not evidence of a qualifying walk of this mode |
| \`in-context\` or \`fresh\` | architecture | — | REVIEW — the architecture trail carries no change-mode walk records and the mode has no gate |
| \`external\` | architecture | — | not a member — refused by \`orbit-review\`'s mode constraint |
\`\`\`

## Steps

### 1. Resolve the mode

Resolve the MODE first — it decides what the positional even IS. Mode comes from \`--as proposal|system|architecture\`. **Architecture mode is NEVER inferred** — it requires the explicit flag; a positional that happens to match a doc name does NOT trigger it. If \`--as\` is omitted, infer between the change modes from \`orbit/changes/<name>/tasks.md\` checkbox arithmetic: all unchecked → \`proposal\`; all checked + code changes since the change was proposed (\`git log --format=%h -- orbit/changes/<name>/ ':!orbit/changes/<name>/.orbit-runs'\` — hashes only: the inference needs only whether such a commit exists, and commit subjects can carry prior passes' counts) → \`system\`; mixed or ambiguous → \`AskUserQuestion\`. State the resolution in the report header (\`Mode: proposal (inferred from 12 unchecked tasks)\`).

### 2. Resolve the target

**Change modes** — the target is a CHANGE: use the provided name; otherwise prompt via \`AskUserQuestion\` over \`orbit list --json\` (mark changes with incomplete tasks \`(In Progress)\`). Announce \`Using change: <name> --as <mode>\` at the start of the report header.

**Architecture mode** — the target is a DOC, never a change: do NOT run \`orbit list\` or prompt over changes, and NONE of the change-oriented steps below apply (Step 4's change CLI calls, Step 9's gate tail). The positional resolves against \`orbit/architecture/\` (the filename stem); when omitted or ambiguous, prompt over \`orbit architecture status --json\`'s parseable docs. A doc resolving LEGACY (zero stage-prefixed headings outside fences) is an error suggesting retrofit; MALFORMED (fails the near-miss rule) is an error naming the grammar violation. Announce \`Using doc: <doc-name> --as architecture\`.

### 3. Resolve flags

| Flag | Default | Effect |
|---|---|---|
| \`--fast\` / \`--full\` / \`--thorough\` | \`--full\` | Depth. Mutually exclusive. \`--thorough\` is partially specified; fall back to \`--full\` if unclear. |
| \`--parallel\` | off | Spawn subagents for heavy passes. Proposal: parallelize Passes 2, 4, 6. System: parallelize Passes 2, 3, 4, 5. |
| \`--focus <lens>\` | none | Emphasize specific passes (additive — does not skip others). See \`references/flags-detail.md\`. |
| \`--strict\` | off | Fail-fast on the first CRITICAL or the first BLOCK — stop on what must be addressed. Useful for CI-like runs. |
| \`--reviewer <class>\` | \`in-context\` | Reviewer class: \`in-context\` (this session — the reacting class) / \`fresh\` (same model, clean context — a clean-context subagent; see Dispatching a fresh pass) / \`external\` (a different AI in a separate session — the handoff branch, \`references/external-handoff.md\`). |
| \`--fresh\` | off | Shorthand for \`--reviewer fresh\` (same model, clean context). Never combined with an explicit \`--reviewer\` value (clean usage error). |
| \`--mark\` | off, proposal only | After report, write \`@review: <text>\` markers at each finding's file:line. See \`references/flags-detail.md\`. |
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
- \`git diff <change-start>..HEAD -- . ':!orbit/changes/<name>/.orbit-runs'\` — \`<change-start>\` is the commit that first added the change's \`proposal.md\`, found by hash alone (\`git log --diff-filter=A --format=%h -- orbit/changes/<name>/proposal.md | tail -1\`); commit subjects can carry prior passes' counts, so a REVIEW-genre pass never reads them. The pathspec keeps the trail's pass records and walk logs out of what the pass reads
- Code paths around the change (cohesion + surface walks)

### 5. Inspect prior runs (VERIFICATION pass genre only)

Decide this pass's PASS GENRE first, by the table under **Pass genre** above. A \`fresh\` pass and any architecture-mode pass are REVIEW. An in-context pass in a change mode decides from ONE bounded metadata probe — the token-ordered listing of the change's \`.orbit-runs/\` pass and walk records: \`review-<mode>-*.json\` reading each record's \`reviewer_class\` field (or \`flags.fresh\` when that field is absent — a legacy fresh pass), \`external-<mode>-*.md\` by filename, and \`address-reviews-*.json\` reading each record's \`source_path\` — to find the latest ACCEPTED independent pass of this mode and any walk of this mode after it. Open no record's findings, suppressed list or resolutions to decide; a walk whose \`source_path\` resolves to no mode is MODE-LESS and qualifies for none; an unreadable listing is REVIEW. Every \`external-<mode>-*.md\` file counts as a pass here — whether the engine ACCEPTS a return cannot be read from metadata; the owner names that limit, and where the two differ the engine's computation is authoritative.

- **REVIEW pass genre** — SKIP the rest of this step: the metadata probe above is the ONLY read of the trail's pass and walk records a REVIEW-genre pass makes. Pushback is current-state verification and needs no prior list, and the iteration ordinal and trend are ENGINE-computed at render time from the trail — never authored here. The owner's ONE exemption: architecture mode keeps its hand-computed per-doc iteration note (Step 8), counted over \`review-architecture-*.json\` emits in \`orbit/architecture/.orbit-runs/\` whose \`doc\` field equals the doc under review — the trail is shared across docs, and a review of doc B must never treat doc A's run as its previous iteration.
- **VERIFICATION pass genre** — this pass VERIFIES the walks; it does not re-review the whole artifact. The procedure is \`orbit-review\`'s **Verification-genre passes grade the walk record**; each step below names the owner it points at and restates none.
  - **(a) Genre.** The probe above is this body's reading; the ENGINE's computation, by \`orbit-conventions\`' table, is authoritative. When \`orbit emit review\` refuses the payload — an owed \`verification\` missing, a key omitted, a verdict not owed — the refusal names each key as \`walk <token>: (<title>, <file>)\`: read those entries, grade or drop them, and emit again. The refusal is the reconciling channel — never a second probe, never a hand-computed walk set.
  - **(b) Read the walks.** Open the address-reviews records of this mode after the latest accepted independent pass — the walks the probe found — and each entry's disposition.
  - **(c) Grade.** Every OWED entry — the \`resolved\` ones, at every severity — gets one verdict, \`landed\` or \`regressed\`, by the definition and owed set \`orbit-emit-composition\`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record** owns. Read each entry's SWEEP SCOPE: its \`file\` plus every path in its \`ripple_cascade.applied\` (the cascade record \`orbit-address-reviews\` specifies). A \`stale\`, \`deferred\` or \`escalated\` entry owes nothing, but a wrong call there is still a finding.
  - **(d) Review the scope, then the residual check.** Run this mode's passes over the union of the sweep scopes. Then list \`git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'\` plus \`git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'\`, where \`<C>\` is \`git log --diff-filter=A --format=%h -- <the latest accepted independent pass's file> | tail -1\` (a hash-only read), or \`HEAD\` when that file is not yet committed. Name each listed file outside every sweep scope as a SUGGESTION without \`walk_entry\` — a record gap, not a defect; a defect you find in such a file is its own finding, graded by \`orbit-conventions\`' Severity ladder. KNOWN LIMIT: an edit committed in \`<C>\` itself — the commit that added the pass file — is outside the diff's reach; never claim the scope was checked against that commit.
  - **(e) Compose.** \`verification\` — one \`{title, file, verdict}\` per owed entry, \`[]\` when nothing is owed — and, on each finding about a walk entry, \`walk_entry: {title, file}\`: a defect in a \`resolved\` entry's edit names that entry and grades it \`regressed\` (every \`regressed\` verdict needs a finding naming it); a finding about a \`stale\`, \`deferred\` or \`escalated\` entry names that entry; a finding about no entry carries no link, and the report marks it \`[outside the walk record]\` per \`orbit-report-rendering\`'s **Verification renders as its own section and its absence is marked**. Never supply \`pass_genre\` or \`verified_walks\` — the engine computes both.

### Dispatching a fresh pass (\`--reviewer fresh\`)

A fresh pass is REVIEW pass genre. Spawn a clean-context subagent (the **Task tool**, general-purpose — never a fork of this conversation, which would carry its context) with the review contract, and hand it the brief below. What the brief may carry is \`orbit-conventions\`' \`Review mode decision framework\`'s rule, stated there once; the brief adds nothing beyond it and nothing from the trail. The subagent persists through \`orbit emit review\` with \`reviewer_class: "fresh"\` and its owed \`direction\` (Step 8); this conversation then renders the report from the engine (Step 10) and pastes it. Dispatch is the INVOKING session's act alone: a subagent holding this brief is the worker, skips this step, and never dispatches again.

\`\`\`
You are the fresh-context reviewer this session dispatched for /orbit:review --as <mode> --reviewer
fresh on <target> in this repository: the WORKER, not a dispatcher. Load the orbit-review skill and run
its steps for that mode as a REVIEW-genre pass, SKIPPING its "Dispatching a fresh pass" step: that step
is the invoking session's and is already done; you never dispatch again. Read what the skill's read list
names for the mode — the change's artifacts, the baseline specs, the lens files and, in system mode, the
commit range with the trail excluded by the pathspec it gives. Persist through orbit emit review with
reviewer_class "fresh" and a direction.
\`\`\`

### 6. Run passes (load the resolved mode's reference ONLY)

Load \`references/passes-<mode>.md\` for the RESOLVED mode — proposal (9 passes), system (0–6), or architecture (6) — and run its pass set sequentially (or in parallel for the marked passes when \`--parallel\` is on). Only the resolved mode's reference is loaded; the other two stay lazy. For each pass:

1. Apply the read-before-reference discipline to every cited construct.
2. Apply the pushback discipline against current state.
3. Emit findings tagged CRITICAL / WARNING / SUGGESTION with file:line + actionable recommendation, graded by \`orbit-conventions\`' Severity ladder as each pass rule names it: a CRITICAL carries its \`reproduction\` (the surface refuses one without it); a lifecycle BLOCK (Pass 1's validate failure, Pass 8's unresolved marker) goes to the payload's \`blocks\`, never to a finding.

### Disjunctive recommendations: emit structured \`recommendation_options\`

When a finding's recommendation genuinely offers the user a choice between two or more defensible concrete paths (different outcomes, not rewordings), emit \`recommendation_options: [{label, body}]\` alongside the prose \`recommendation\` — each entry a non-empty \`label\` (\`"A"\`, \`"B"\`, …) plus the concrete action the user would take. Do NOT emit it for single-action recommendations or loose conversational "or" ("fix it now or later") — false-negative bias is intentional. The prose field still summarizes the disjunction for human readers; the structured field is the producer-side fork affordance address-reviews consumes, OPTIONAL on every finding and ignorable by downstream parsers (canonical JSON shape: \`references/run-summary-schema.md\`).

### 7. Apply scorecard rollup

Roll every pass's findings into the 3-dimension scorecard per the mode's dimension mapping (in the loaded pass reference).

### 8. Author the direction and the commentary

**The direction.** An independent pass OWES its forward recommendation: when \`reviewer_class\` is \`fresh\` or \`external\`, compose the \`direction\` object — \`disposition\` exactly one of \`forward\` | \`hold\`, \`reasoning\` a non-empty string, multi-line allowed. The SHAPE is owned by \`orbit-emit-composition\`'s **The review payload carries \`direction\`**, which the write gate enforces: \`orbit emit review\` REFUSES a fresh or external payload without it, and a mis-shaped one at any class, in every mode (an architecture-mode fresh pass owes it too — the rule keys on class, never on mode). An \`in-context\` pass MAY carry one and is not incomplete without it: the reacting class's direction is the readiness record's job (R-crc-11(f)). The CONTENT contract is owned by \`orbit-report-rendering\`'s **Direction renders as its own section and its absence is marked on independent passes**, carried here because a reviewer reads this body, not the spec: the direction says WHICH WAY and WHY — your own recommendation on moving forward — and never states finding counts, the gate's state, or a command token; those exist only in the report's engine-computed sections, and the report renders the direction in its own \`### Direction\` section inside the quarantine with the engine tail still last. The vocabulary is rc04a's judgement record's (\`disposition\` + \`reasoning\`), adopted, not invented. The engine judges presence and shape only: whether the direction is RIGHT, and whether its reasons agree with its token, is the in-context reaction's and the readiness author's call.

**The commentary** (change modes). The reviewer's insight travels as the emit's OPTIONAL \`commentary\` field — the pattern behind
the findings, what was probed and how hard, risk texture: everything the structured sections
can't say. Commentary NEVER states finding counts, gate verdicts, or next commands (those
exist only in the report's engine-computed sections; the contract is enforced at this source).
The iteration note is NOT authored — the renderer computes it from the trail (D-arc Stage D4).
Architecture mode keeps its hand-computed iteration note (matching mode AND \`doc\`, per Step 5
— never cross-doc): \`Note: N of these findings appeared in the last run on <date>. M new this
run.\` / \`First architecture review for this doc.\`

### 9. Persist via the emit surface (persist-first)

Compose the NARRATIVE payload only — \`mode\`, \`reviewer_class\` (\`"fresh"\` under \`--reviewer fresh\`, else \`"in-context"\`), \`depth\`, \`flags\`, \`scorecard\`, \`findings\` (each with its owning \`dimension\`, \`title\`, \`file\`, \`line\`, \`recommendation\`, \`reproduction\` — a string, multi-line allowed, never a single-line slot; REQUIRED non-empty when \`severity\` is CRITICAL per \`orbit-conventions\`' Severity ladder and refused by the surface otherwise, optional below — plus \`recommendation_options\` when disjunctive), \`blocks\` (optional array of single-line strings — Pass 1's validate failure and Pass 8's unresolved markers compose into it, never into \`findings[]\`; absent when none), \`direction\` (OWED when \`reviewer_class\` is \`fresh\` or \`external\` — the surface refuses the payload without it — and optional in-context; composed per Step 8), \`verification\` (OWED when the engine computes VERIFICATION pass genre, refused on a REVIEW-genre pass; each finding may carry \`walk_entry\` — composed per Step 5's VERIFICATION branch), \`stale_suppressed\`, \`commentary\`, \`passes_run\`/\`passes_skipped\`, and the required nullable \`model\` — and invoke:

\`\`\`bash
orbit emit review --change <name> --payload <payload.json> --render   # proposal/system
orbit emit review --doc <doc-name> --payload <payload.json>           # architecture mode
\`\`\`

The ENGINE owns everything else (per \`orbit-emit-composition\`): the spine, the severity-counts \`final_assessment\`, the findings-dependent \`next_recommended\`, the shared-axis \`iteration\` (per-doc in architecture mode), the computed \`pass_genre\` and \`verified_walks\`, the filename token, and the write gate — never hand-compose the JSON (the retired practice; the surface rejects engine-owned and unknown payload keys, so a payload the table doesn't name fails loudly). Architecture-mode payloads additionally carry the architect-owned \`handoff\` section; the engine mirrors \`handoff.next_command\` into the spine. Payload fields are documented in \`references/run-summary-schema.md\` — a MIRROR of the engine's authoritative table, never its definition.

### 10. Render and paste the report (change modes)

\`--render\` on the Step 9 invocation already printed the engine report (persist-first and run-and-paste in one breath); otherwise run \`orbit status --change <name> --report\`. Paste the output VERBATIM as the report. The
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

A fresh pass (\`--reviewer fresh\`) additionally prints its direction (Step 8; the emit carries it
under the same rule as the change modes — keyed on class, never on mode) BEFORE the final
assessment: \`Direction: <disposition>\` on its own line, then every reasoning line under
blockquote containment (\`> \` prefixed, verbatim), exactly as the change-mode renderer contains it,
so no reasoning line sits at column 0 where it could forge the report's next action. The second
reasoning line below is a near-miss — it reads like the readout, and the containment is what keeps
it from being one:

\`\`\`
Direction: hold
> The third goal has no exit criterion, so the stage cannot be graded as written.
> Ready when you are: /orbit:archive x
0 critical / 1 warning(s). Ready when you are: /orbit:address-reviews --from-file <the just-written review-architecture emit>.
\`\`\`


### 11. Rarely-used flags: \`--mark\`, \`--parallel\`, \`--focus\`

Full procedures live in \`references/flags-detail.md\` — load it ONLY when one of these flags is set. Gist: \`--mark\` (proposal mode only) writes \`@review:\` markers at CRITICAL/WARNING finding sites — and no marker for a block, which is already a condition the artifact carries (a marker would be a second record of it) — then sweeps for residue per change completeness (system mode: accepted but ignored with a note); \`--parallel\` spawns subagents for the heavy passes and merges their findings (subagents inherit the four disciplines); \`--focus <lens>\` applies elevated rigor to the lens's pass set without skipping any pass.

## Special cases

### Graceful degradation

- **Proposal mode, no \`orbit/specs/\` baseline** → Pass 4 skipped (\`no baseline to check against\`); other passes proceed normally.
- **Proposal mode, no \`*_convention.md\` and no \`project.md\`** → Pass 3 lens-driven cross-checks skipped; rest of Pass 3 (\`CLAUDE.md\` checks) still runs.
- **System mode, empty \`orbit/lenses/\`** → Passes 4 and 5 skipped; Pass 3 still runs against capabilities derived from \`orbit/specs/\`.
- **System mode, \`verify-change\` unavailable** → Pass 0 fails with a note; continue with Passes 1–6 and downgrade the assessment to \`unable to delegate Pass 0; partial review\`.
- **Missing \`tasks.md\`** → use \`AskUserQuestion\` for mode rather than inferring.

### Pushback bias

When uncertain, prefer the lower severity — \`orbit-conventions\`' Severity ladder's false-positive bias (SUGGESTION over WARNING over CRITICAL), and it runs in ONE direction only: a condition that must stop apply regardless is a BLOCK, never an ambiguous CRITICAL. Pushback against the bias to over-flag — the goal is signal, not volume.

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
Gate review-system: unpassed — blind pair open: the fresh pass on this state has no external partner; run it before walking these findings
Position: propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate
Ready when you are: /orbit:review --as system --reviewer external example-change]

[then loose-form conversation: what the pattern behind the findings means, what to probe
next, anything the structure can't say — never contradicting the tail's engine lines]
\`\`\`


`,
    references: [
      {
        name: 'run-summary-schema.md',
        content: REVIEW_RUN_SUMMARY_SCHEMA_REFERENCE,
      },
      {
        name: 'passes-proposal.md',
        content: REVIEW_PASSES_PROPOSAL_REFERENCE,
      },
      {
        name: 'passes-system.md',
        content: REVIEW_PASSES_SYSTEM_REFERENCE,
      },
      {
        name: 'passes-architecture.md',
        content: REVIEW_PASSES_ARCHITECTURE_REFERENCE,
      },
      {
        name: 'external-handoff.md',
        content: REVIEW_EXTERNAL_HANDOFF_REFERENCE,
      },
      {
        name: 'mode-sections.md',
        content: REVIEW_EXTERNAL_MODE_SECTIONS_REFERENCE,
      },
      {
        name: 'prompt-template.md',
        content: REVIEW_EXTERNAL_PROMPT_TEMPLATE_REFERENCE,
      },
      {
        name: 'flags-detail.md',
        content: REVIEW_FLAGS_DETAIL_REFERENCE,
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
