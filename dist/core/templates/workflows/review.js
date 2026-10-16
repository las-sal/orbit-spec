const REVIEW_RUN_SUMMARY_SCHEMA_REFERENCE = `# Reference: review run-summary schema

Each \`/orbit:review\` invocation persists a JSON summary. The location is PER MODE (D-arc Stage D2): \`orbit/changes/<change-name>/.orbit-runs/review-<mode>-<TS>.json\` for \`proposal\` and \`system\` modes, and \`orbit/architecture/.orbit-runs/review-architecture-<TS>.json\` for \`architecture\` mode (the architecture trail — shared by all docs, never moved by change archiving). \`<TS>\` is ISO-8601 with hyphens (e.g., \`review-proposal-2026-05-18T14-35-23Z.json\`).

Create the trail directory if it doesn't exist. The file is **committed** (not gitignored) so iteration history travels with the change into archive (change modes) or persists in the architecture trail (architecture mode).

## Universal spine inheritance

The spine every emit carries is owned by \`orbit-conventions\`' \`Internal-run JSON summary format\` requirement, and is not restated here. For review the engine composes every spine field and the payload supplies only \`model\`: \`final_assessment\` is the DETERMINISTIC severity-counts sentence computed from the emit's own scorecard (\`"X critical, Y warning, Z suggestion."\` / \`"No findings."\`, never a verdict), and in change modes \`next_recommended\` is the DETERMINISTIC pointer \`orbit-emit-composition\`'s \`Deterministic facts are engine-composed per command\` composes — the change-scoped walk when the pass has findings, the report render when clean; that requirement owns the values, and this body does not restate them (the engine-computed canonical next rides the rendered tail, never the emit). \`change\` is \`null\` in architecture mode, where a \`doc\` field names the reviewed doc instead.

The schema below documents per-command extensions ADDED to that spine (\`mode\`, \`iteration\`, \`depth\`, \`reviewer_class\`, \`flags\`, \`passes_run\`, \`passes_skipped\`, \`scorecard\`, \`findings\`, \`blocks\`, \`stale_suppressed\`, \`commentary\`, \`direction\`, \`verification\`, and the engine-computed \`pass_genre\` and \`verified_walks\`). The former \`findings_summary\` and \`iteration_note\` fields are RETIRED in CHANGE MODES (D-arc Stage D4): \`scorecard\` supersedes the counts (readers tolerate both generations), and the iteration note is RENDERER-computed from the trail — a stored copy would be a second stale voice. (Architecture-mode emits carry the same \`scorecard\` shape; the interim hand-rendered report path documented below reads it — no render surface covers the architecture trail yet.) Per-command extensions are review-specific state; they supplement, not replace, the spine.

## Schema

\`\`\`json
{
  "command": "review",
  "timestamp": "<ISO-8601>",
  "change": "<change-name>",         // null in architecture mode
  "final_assessment": "<counts sentence, e.g. \"0 critical, 1 warning, 3 suggestion.\">",
  "next_recommended": "<engine-composed — the pointer orbit-emit-composition's 'Deterministic facts are engine-composed per command' owns>",
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

### Example payload (change modes)

A payload file the body writes for a fresh proposal-mode pass — real JSON, accepted by \`orbit emit review --change <name>\`, carrying no engine-owned key. It omits \`verification\`, which the write gate owes only on a VERIFICATION-genre pass and refuses on this one (the genre is computed from the trail; see the field note). A test submits this block, unchanged, through the write gate (\`orbit-emit-composition\`'s \`Payload schema references are proven by execution\`).

\`\`\`json example change
{
  "mode": "proposal",
  "reviewer_class": "fresh",
  "depth": "full",
  "flags": { "parallel": false, "focus": null, "strict": false, "fresh": true, "mark": false, "skip_verify": false },
  "passes_run": ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
  "passes_skipped": [],
  "scorecard": {
    "completeness": { "critical": 0, "warning": 1, "suggestion": 0 },
    "correctness": { "critical": 1, "warning": 0, "suggestion": 0 },
    "coherence": { "critical": 0, "warning": 0, "suggestion": 1 }
  },
  "findings": [
    {
      "pass": "4",
      "severity": "CRITICAL",
      "dimension": "correctness",
      "file": "design.md",
      "line": 40,
      "title": "Archive step deletes the staging directory before the copy is verified",
      "recommendation": "Verify the copy before deleting the source.",
      "reproduction": "Run the archive flow on a change whose copy fails (read-only target): design.md step 3 deletes orbit/changes/<name>/ before step 4 checks the copy, so the change is lost."
    },
    {
      "pass": "2",
      "severity": "WARNING",
      "dimension": "completeness",
      "file": "tasks.md",
      "line": 12,
      "title": "No task updates the generated surface after the template edit",
      "recommendation": "Add a task running orbit update --force after the template change.",
      "recommendation_options": [
        { "label": "A", "body": "Add the task to group 5." },
        { "label": "B", "body": "Fold it into task 2.3." }
      ]
    },
    {
      "pass": "7",
      "severity": "SUGGESTION",
      "dimension": "coherence",
      "file": "proposal.md",
      "line": 3,
      "title": "Why section names the capability by an older title",
      "recommendation": "Use the capability's current name."
    }
  ],
  "blocks": ["orbit validate <name> --strict fails: specs/cap/spec.md has a requirement with no scenario"],
  "stale_suppressed": [
    { "pass": "3", "title": "Touchpoints omit the parser", "evidence": "design.md:88 lists src/core/parsers/explore-rules.ts since 4f3e2d1c" }
  ],
  "commentary": "The design is sound; the one CRITICAL is an ordering slip in the archive step, not a structural problem.",
  "direction": {
    "disposition": "hold",
    "reasoning": "Walk the CRITICAL before apply: the ordering defect loses a change on the first failed copy, and the fix is one reordered step."
  },
  "model": "claude-opus-5-5"
}
\`\`\`

## Field notes

- **\`reviewer_class\`** (C1) is the first-class execution-context field the engine's reviewed-gate convergence reads for cadence class coverage: \`"fresh"\` when the pass ran in a clean context (\`--fresh\`), else \`"in-context"\` (externally-sourced findings in \`external-<as>-<TS>.md\` are structurally \`"external"\`). For emits predating this field the engine infers (\`flags.fresh: true\` → \`fresh\`; \`external-*.md\` provenance → \`external\`; otherwise \`in-context\`), so absence never breaks gate computation.
- **\`iteration\`** is per-mode: proposal-mode and system-mode iterations count separately on the same change.
- **\`passes_run\` / \`passes_skipped\`** are strings (pass IDs); skip reasons go in the report body but not the summary array.
- **\`scorecard\`** is the REQUIRED counts shape (3 dimensions × 3 severities, non-negative integers): each cell SHALL equal the count of ACTIVE findings with that \`dimension\` + severity (suppressed excluded) — the renderer validates the equality and fails the render on mismatch.
- **\`dimension\`** on each finding names the owning scorecard cell (\`completeness\` | \`correctness\` | \`coherence\`).
- **\`stale_suppressed\`** captures findings that pushback removed; they are excluded from the scorecard and active findings, and render in the report's dedicated Suppressed section (first-class, with evidence).
- **\`final_assessment\` / \`next_recommended\`** carry the deterministic facts stated under Universal spine inheritance — no verdicts, no eligibility judgments (the engine-rendered tail owns those).
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

### Example payload (architecture mode)

A payload file the body writes for an in-context architecture-mode pass — real JSON, accepted by \`orbit emit review --doc <doc-name>\`, carrying no engine-owned key. A test submits this block, unchanged, through the write gate.

\`\`\`json example doc
{
  "mode": "architecture",
  "reviewer_class": "in-context",
  "scorecard": {
    "completeness": { "critical": 0, "warning": 0, "suggestion": 0 },
    "correctness": { "critical": 0, "warning": 1, "suggestion": 0 },
    "coherence": { "critical": 0, "warning": 0, "suggestion": 0 }
  },
  "findings": [
    {
      "pass": "3",
      "severity": "WARNING",
      "dimension": "correctness",
      "file": "program.md",
      "line": 88,
      "title": "Stage s4 depends on s5, which depends on s4",
      "recommendation": "Drop one Depends-on edge; the cycle leaves both stages premised forever."
    }
  ],
  "handoff": {
    "boot_sequence": ["orbit/architecture/program.md — the stages and their exit criteria"],
    "next_command": "/orbit:address-reviews --from-file <this emit's path>",
    "model_hint": null,
    "seam": "architecture review → walk"
  },
  "model": "claude-opus-5-5"
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

This branch packages a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review of an orbit change — the behavior formerly invoked as the standalone \`/orbit:review-external\` command (RETIRED at D-arc Stage D5; the RECORD VOCABULARY IS FROZEN: the T0 emit keeps \`command: "review-external"\` and its \`review-external-<TS>.json\` filename, prompts keep \`external-prompt-<as>-<TS>.md\`, findings keep \`external-<as>-<TS>.md\` — gates, orientation WAITING arithmetic, the report ordinal, and the address-reviews parser all key on those names). The branch writes a self-contained markdown prompt to \`orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\` (committed; the external AI reads it from the repo), then takes ONE of two routes. **With no runner launched** (none recorded, or the recorded one not on \`PATH\`) it emits a short invocation snippet to chat that tells the user what to paste into the external AI's session — the handoff exactly as it was before runners existed. **With the user's recorded runner reachable** it launches that runner on the prompt itself, in a throwaway worktree at the handoff commit, and saves and commits the return — no paste (Step 9).

**Runs the review ONLY through the user's recorded runner, and NEVER ingests findings.** The runner is the one the user recorded in their per-user global config (\`orbit-external-runner\`; read through \`orbit external runner --json\`); a runner merely present on \`PATH\` is never launched. With none, the external AI is the user's to run. Either way, ingestion is the change-scoped \`/orbit:address-reviews <change-name>\`, which discovers the saved return as an outstanding pass, or an explicit \`--from-file <path>\` aim — invoked separately, never by this branch.

**Input**: the change name and \`--as proposal|system\` resolved by the review trunk before this reference loads (\`--reviewer external\` requires \`--as proposal|system\`; architecture mode never reaches this branch). Compose the T0 emit via \`orbit emit review-external --change <name>\` — the engine owns the spine, the recommendation \`orbit-run-summary-emit\`'s \`Review-external T0 multi-step recommendation\` owns, and \`awaiting_findings\`.

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

Emit a one-line inference note in chat output when \`--as\` was omitted: \`\` Generating external-review prompt as \`<as>\` (inferred from tasks state). \`\`

### 3. Handoff preflight — committed-and-pushed state

The pull-based handoff only works if the external AI can actually see the reviewed state. Record two facts (used by Step 8):

1. **Working tree**: \`git status --porcelain\` — any output means the reviewed state is not fully committed (and the prompt file written in Step 7 will itself be uncommitted).
2. **Remote sync**: \`git rev-list @{u}..HEAD --count\` (skip if no upstream) — a non-zero count means local commits aren't pushed.

(The external AI pulls the repo, so it only sees what's committed AND pushed. A pull-based invocation emitted against dirty or unpushed state hands the external AI a repo without the change — the handoff silently reviews stale state or fails.)

If the repo has no remote at all, the preflight is satisfied by the local-path handoff route (see Graceful degradation).

**3a. The runner.** At this step, read the user's runner:

\`\`\`bash
orbit external runner --json
\`\`\`

It prints ONE object: \`{"runner": null}\`, or \`{"runner": {"form", "name", "argv", "reachable"}}\` with \`{worktree}\` and \`{output}\` placeholders in \`argv\` (any warning goes to standard error and the object is still \`null\`). The engine resolves the record and executes nothing; this branch holds no preset knowledge — use \`argv\` exactly as printed.

- \`{"runner": null}\` → the branch is UNCHANGED: Steps 4–8, then the T0 emit.
- \`reachable: false\` → UNCHANGED but for one extra item in Step 8 (item 6) naming the unresolved command.
- \`reachable: true\` → the LAUNCH route. Fact 1 above now DECIDES: a dirty working tree, read BEFORE the prompt file is written, means the reviewed state is not committed — do NOT launch and write NOTHING (no prompt file, no T0); print \`Not launched: <name> reviews the committed state, and the working tree has uncommitted changes. Commit the pending work, then re-run the review.\` and stop. Never auto-commit the user's pending work. A clean tree continues to Step 4; unpushed commits do not block — they go with the handoff push in Step 9.

**3b. A blind pair's half.** Decide whether this run is a HALF of a blind pair. Every half of a pair reviews the state the pair was launched on — the rule, its BASE and REVIEWED COMMIT, and its named limit are \`orbit-review-external\`'s \`A pair's external half reads the pair's reviewed state\`; this step is its procedure. Outside a pair, nothing in this step applies and every later step reads as written.

- **The pair's first run** — this reference was loaded by \`references/blind-pair.md\`. The pair reference owns the ORDER: its Step 1 is this branch's runner read (do not read the runner again here) and its dirty-tree preflight; its Step 3 makes the handoff commit, which IS the pair's BASE, and pushes it on both routes. This reference supplies the packaging (Steps 4–7), the T0 with \`pair: true\`, the launch (9b–9c), the save command and the commit message (9d), and the failed-run paragraph. The REVIEWED COMMIT is \`git rev-parse HEAD\` read BEFORE the handoff commit.
- **A RE-RUN of the pair's missing external half** — read \`orbit status --change <name> --json\`. When the mode's reviewed gate row carries \`openPair: {missing: "external"}\`, the run is a RE-RUN: find the OPEN launch L — the latest \`review-external-<TS>.json\` of this mode carrying \`pair: true\`, reading only its \`mode\` and \`pair\` fields — and list the trail's \`apply-*.json\` tokens. The re-run packages as usual — its own prompt, its own T0 WITHOUT \`pair\` (so it refills the open pair rather than launching another), its own handoff commit — and decides its WORKTREE COMMIT and SAVE TOKEN by whether an apply token is later than L:
  - **No apply later than L**: BASE is \`git log --diff-filter=A --format=%H -- <L's T0 path> | tail -1\` (a hash-only read) and the REVIEWED COMMIT is \`git rev-parse <BASE>^1\`. The worktree commit is BASE; the save token is L, so supersession is measured from the state the re-run reviews.
  - **An apply later than L**: the landed fresh member was emitted after that apply (one emitted before it would be stale, and the gate would report no \`openPair\`), so it reviewed the post-apply state, and the engine counts this run as the pair's missing member — never a single. The REVIEWED COMMIT is the state that member reviewed: \`git rev-parse <M>^1\`, where M is \`git log --diff-filter=A --format=%H -- <member path> | tail -1\` (the same hash-only read; the member is the earliest \`review-<mode>-*.json\` later than L whose \`reviewer_class\` field is \`fresh\`, read from that field alone). The worktree commit is that REVIEWED COMMIT; the save token is this run's OWN T0 token, which is later than the apply. When M is empty — the member's file is not committed — stop and print \`The pair's fresh member <path> is not committed; commit it alone, then re-run the review.\`
  On the launch route: 9b adds the worktree at the WORKTREE COMMIT, never at the re-run's own handoff commit (which holds the committed fresh partner); 9c feeds the prompt from the LIVE CHECKOUT's copy of the re-run's committed prompt file, since the worktree commit does not contain it; 9d saves with \`--launch <SAVE TOKEN>\`.
- **No \`openPair\`, and the latest launch's one landed member is STALE** — read from the trail, never from the gate's reason, whose text names the first failing clause, not the pair: the latest \`pair: true\` launch L of this mode has exactly ONE landed member (its earliest \`review-<mode>-*.json\` with \`reviewer_class\` \`fresh\`, or earliest \`external-<mode>-*.md\`, later than L — and none of the other class), no \`address-reviews-*.json\` names that member in its \`source_path\`, and an \`apply-*.json\` token is later than the member's token — a single. Print \`The pair launched at <L> reviewed a superseded state (an apply landed after its <class> member); this run is an ordinary single on the current state — a <class> review lands as a single and covers, and a run of the other class becomes that pair's missing member and covers nothing.\` and continue as a single.
- **Any other state** — no \`openPair\` for the mode, or one missing \`fresh\` — a single; nothing here applies.

**A pair half's reviewed commit.** For a pair half — first run or re-run — printed for PASTE, the prompt's \`## Repo\` line (Step 7) reads \`<repo URL or path> — read the repository at commit <REVIEWED COMMIT>\`, and in system mode the read list's commit range ends at that commit, not \`HEAD\` (\`git diff <change-start>..<REVIEWED COMMIT>\`), with the change's files read at it (\`git show <REVIEWED COMMIT>:<path>\`); and when a LAUNCHED pair half fails, the paste fallback's commit line (9d) names the REVIEWED COMMIT in place of \`<handoff-sha>\`. The re-run test is this body's reading of the trail; the gate's computation is authoritative.

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

**On the launch route**, first fix the run's scratch directory OUTSIDE the repository: \`<run-dir>\` = \`<absolute system temp dir>/orbit-external-<change-name>-<TS>\` (the prompt's \`<TS>\`; resolve the temp dir with \`node -p "require('os').tmpdir()"\`). The worktree will be \`<run-dir>/worktree\`, the runner's \`{output}\` \`<run-dir>/return.md\`, its log \`<run-dir>/runner.log\`. The prompt's \`## Repo\` line names \`<run-dir>/worktree\` — the runner's working directory, a checkout of the handoff commit — NEVER the live checkout's path. (A pair's re-run: a checkout of BASE, Step 3b.) **On the paste route**, a pair half's \`## Repo\` line names the repository and the pair's REVIEWED COMMIT (Step 3b); a single's is the repository as before.

Mode-specific content:

- **"What to read for THIS review"** lists files appropriate to the mode (proposal mode emphasizes the change directory artifacts; system mode adds \`git diff\`, codebase paths, lens files).
- **"What to look for"** enumerates the 9 proposal-mode passes or the 7 system-mode passes (see below).

The **"Output format"** block inside the prompt MUST appear verbatim — the section headers (\`## CRITICAL\` / \`## WARNING\` / \`## SUGGESTION\` / \`## Blocks\` / \`## Direction\`) and the field labels (\`**File**:\`, \`**Description**:\`, \`**Reproduction**:\`, \`**Disposition**:\`) are what \`/orbit:address-reviews --from-file\` and the report renderer parse. Deviating breaks ingestion. The \`## Severity\` paragraph before it is \`orbit-conventions\`' Severity ladder, mirrored byte-equal (a parity test holds it) — carry it as written.

### 8. Emit the chat invocation snippet (no runner launched)

On the launch route, skip this step: Step 9 owns the chat output. Otherwise print to chat, in this exact order:

1. **(optional)** Mode-inference note when \`--as\` was omitted: \`\` Generating external-review prompt as \`<as>\` (inferred from tasks state). \`\`
2. **(required)** Recommended-session note: \`Recommended session: <phrasing from Step 6>\`
3. **(required)** The prompt file path: \`Prompt: orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md\`
4. **(conditional — preflight gate)** ONE of:
   - **Preflight satisfied** (clean tree, no unpushed commits — or local-path route): FIRST affirmatively state the prompt's committed-and-pushed state with evidence — \`Prompt committed (<short-sha>) and pushed to <remote>/<branch>\` (or, on the local-path route, the equivalent naming the path) — NEVER implied by the mere absence of a warning; THEN the copy-paste-ready invocation: \`Pull <repo URL> and read <prompt-file-path>. Follow its instructions; write findings to the path specified inside.\` (Get \`<short-sha>\` from \`git rev-parse --short HEAD\` and \`<remote>/<branch>\` from \`git rev-parse --abbrev-ref --symbolic-full-name @{u}\` after the push.)
   - **Preflight failed** (dirty tree and/or unpushed commits): the pull invocation is WITHHELD. Emit instead: \`Handoff blocked: <dirty tree | N unpushed commit(s)>. Commit the pending work (including the prompt file above) and push, then hand off: Pull <repo URL> and read <prompt-file-path>. ...\` — the commit+push action leads; the pull text is framed as the after-push step, never as an immediately-usable instruction.
5. **(required)** The eventual findings path: \`When findings come back: /orbit:address-reviews --from-file orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md (TS will be set by the external AI when it writes).\`
6. **(conditional — a recorded runner with \`reachable: false\`)** \`Recorded runner <argv[0]> not found on PATH — printing the prompt for paste.\`

No other items. Required items always appear in the specified order. With nothing recorded, item 6 never appears and the output is the handoff's before runners existed. (The T0 emit's \`next_recommended\` mirrors the gate: when the preflight failed, it leads with the commit+push action before the paste step.)

### 9. Launch the recorded runner (launch route only)

Reached only with \`reachable: true\` and a clean tree (Step 3a). The engine never runs a process and reads no git state here; every git act and the launch are this body's steps.

**9a. The handoff commit.** Emit the T0 now (see Run-summary emit) with \`target\` set to the runner's \`name\`. Then commit the prompt file and the T0 emit — and nothing else — and push:

\`\`\`bash
git add <prompt-path> <t0-path>
git commit --only <prompt-path> <t0-path> -m "External review handoff (<as>, iter <N>): <change-name>"
git push
\`\`\`

A failed push, or no remote, is REPORTED and the launch PROCEEDS — the runner reads a local worktree and needs no remote. Record whether the push landed: every later attestation says "pushed" only when it did.

**9b. The worktree.** Add a detached worktree at the handoff commit, outside the repository:

\`\`\`bash
git worktree add --detach <run-dir>/worktree <handoff-sha>
\`\`\`

On a RE-RUN of a pair's missing external half (Step 3b), its WORKTREE COMMIT replaces \`<handoff-sha>\`: the worktree holds no fresh pass file of the pair.

**9c. The launch.** Substitute \`{worktree}\` → \`<run-dir>/worktree\` and \`{output}\` → \`<run-dir>/return.md\` into \`argv\` FIRST. Then build ONE command line that keeps every element exactly one argument: single-quote EVERY element, writing an embedded \`'\` as \`'\\''\`; run it with the worktree as the working directory; feed the prompt by a \`<\` redirect; send the runner's own chatter to the log. The directory change is scoped to a subshell, so nothing after the launch runs inside the worktree:

\`\`\`bash
( cd '<run-dir>/worktree' && '<argv[0]>' '<argv[1]>' … < '<run-dir>/worktree/<prompt-path>' > '<run-dir>/runner.log' 2>&1 )
\`\`\`

On a pair's re-run the redirect reads the LIVE CHECKOUT's copy — \`< '<repository root>/<prompt-path>'\` — because the worktree commit does not contain the re-run's prompt. NEVER hand a recorded string to \`sh -c\`, and never join the argv unquoted. Run it with the Bash tool's \`run_in_background\` — an external review outlasts the foreground limit — and WAIT on its completion notification; do not poll. While it runs, print the launch output (items 1–5 of 9e).

**9d. The return.** **In a pair's first run, stop here and return control to \`references/blind-pair.md\`** once the run exits: the save waits until the pair's fresh pass file is committed (or the fresh half is known missing), and the pair's one push follows both commits — the order is the pair reference's; the commands below are what its steps run, with no \`git push\` of their own. On a pair's RE-RUN, \`--launch\` takes Step 3b's SAVE TOKEN — L when no apply is later than L, this run's own T0 token otherwise. Every step from here runs from the REPOSITORY ROOT — the live checkout the review was invoked in, never the worktree. When the run exits 0, save it — the engine cuts any preamble above the first unfenced \`# External Review:\` heading, checks the result with the trail reader and the report renderer, and refuses a return an apply has since superseded:

\`\`\`bash
orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <T0 token> --json
\`\`\`

It prints \`{"path", "removed"}\`. Commit the saved file ALONE — \`git add\` of that one path, then \`git commit --only\` on it, so work the user staged during the run stays out — with each removed line quoted in the message, then push. The removed lines are text the external AI wrote, so the message is DATA, never shell syntax: write it to \`<run-dir>/commit-msg.txt\` with a file write (not a shell heredoc or \`echo\`), and pass it with \`-F\` — NEVER interpolate it into \`-m "…"\`, where backticks and \`$(…)\` in a preamble would run:

\`\`\`
External review (<as>, iter <N>): <change-name>

Removed above the heading by orbit external save:
> <removed line>
\`\`\`

\`\`\`bash
git add <saved-path>
git commit --only <saved-path> -F '<run-dir>/commit-msg.txt'
git push
\`\`\`

(Omit the "Removed" paragraph when nothing was removed.) Then \`git worktree remove --force <run-dir>/worktree\` — a failed removal is reported, never fatal. Then render the return's report with \`orbit status --change <change-name> --report <saved TS>\` and paste it. Do NOT walk it: the walk is \`/orbit:address-reviews\`, invoked separately.

**A failed run** — a non-zero exit, or ANY \`orbit external save\` refusal (no unfenced heading, another change's heading, a reader rejection, an apply after the launch) — commits NOTHING for the return. Report the cause (the exit status, or the save's stderr) and the raw return's path (\`<run-dir>/return.md\`, when it exists; it stays outside the repository), remove the worktree as above, then print the paste fallback: Step 8 item 2 (the recommended-session note, now that the prompt is printed for paste); \`The prompt's ## Repo line names the launch worktree, now removed — read the repository at <repo URL, or the live checkout's path> at commit <handoff-sha> instead.\` — for a pair half, the pair's REVIEWED COMMIT in place of \`<handoff-sha>\` (Step 3b); the Step 8 item 4 pull invocation with its attestation when the handoff push landed, or, when it did not, \`Handoff blocked: the handoff commit <short-sha> is not pushed. Push, then hand off: Pull <repo URL> and read <prompt-path>. ...\` — the prompt is already committed, so only the push leads (never Step 8's commit-the-pending-work text); then Step 8 item 5. The T0 stands, so the gate keeps presenting the external half. An apply after the launch is the one failure with NO paste fallback: the prompt reviews a superseded state, so say so and that the review should be re-run, which packages a new prompt.

**Named limits.** A writable own runner may follow the prompt's write/commit/push steps inside the worktree; the saved return is the only record, and the worktree is removed with \`--force\`. A return that opens with the heading and parses yet is truncated is not detected here — read its \`**Reviewer**:\` line at each runner's first use. The T0's \`next_recommended\` keeps the paste/save prose the emit surface requires even when a runner launched; the launch is reported in chat.

**9e. Chat output (launch route)**, in this order:

1. **(optional)** The mode-inference note, as in Step 8.
2. **(required)** \`Launching <name> — your recorded external runner; no paste needed\` (in place of the recommended-session note).
3. **(required)** \`Prompt: <prompt-path>\`
4. **(required)** \`Prompt committed (<short-sha>); launched <name> at that commit\` — on a pair's RE-RUN, \`launched <name> at <worktree-commit short-sha>, the pair's reviewed state\` in place of \`at that commit\` — followed by \`, pushed to <remote>/<branch>\` ONLY when the push landed — otherwise the push failure, or the local-path note.
5. **(required)** \`Raw output: <run-dir>/return.md — if this session ends before the run does, save it with: orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <T0 token>, commit the saved file alone, and run git worktree remove --force <run-dir>/worktree\` — on a pair's RE-RUN, Step 3b's SAVE TOKEN in place of \`<T0 token>\` — then \`Findings will be saved as orbit/changes/<change-name>/.orbit-runs/external-<as>-<TS>.md (TS set when the return is saved).\`

When the run ends, add: \`Saved <saved-path>\`; \`Findings committed (<short-sha>)\` followed by \` and pushed\` ONLY when that push landed; \`Removed <k> line(s) above the heading\`; then the rendered report. A failed run adds instead the failure and the paste fallback above.

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

The command runs the review only through the recorded runner and never ingests findings:

- **Running the review**: with a reachable recorded runner, Step 9 launches it; otherwise the external AI is the user's to run. A runner on \`PATH\` that the user has not recorded is never launched.
- **Ingesting findings**: \`/orbit:address-reviews <change-name>\` discovers the saved return; \`--from-file <path>\` aims at it explicitly. This command emits (or, on the launch route, commits) the path the return is saved to.

## Graceful degradation

- **No \`.orbit-runs/\`** → create it as part of writing the prompt file; iteration is 1.
- **No prior external review** → recommended-session note uses iter 1 phrasing; cycle context reads \`- Iteration: 1\`.
- **No lenses files** → "Project context (read first)" line for those still appears (the \`(if present)\` qualifier handles the absence); external AI will see they're absent when it pulls the repo.
- **No git remote / repo URL unknown** → emit the local path instead of a URL and add a note: \`If you don't have access to this repo, copy it to a shared location and update the invocation.\`

## Run-summary emit (T0 — when prompt is packaged, before findings return)

(Per \`orbit-run-summary-emit\` capability)

The external-handoff branch writes TWO artifacts during a single invocation:

1. **The prompt file**: \`external-prompt-<as>-<TS>.md\` written per Step 7.
2. **The T0 run-summary JSON**: emitted at command completion (after Step 8's chat invocation snippet), recording that the external pass was packaged and is awaiting findings. On the launch route it is emitted at Step 9a instead, BEFORE the handoff commit (it is one of that commit's two files), with \`target\` set to the runner's \`name\`; its token is the \`--launch\` token Step 9d passes.

The T0 emit goes to:

\`\`\`
orbit/changes/<name>/.orbit-runs/review-external-<TS>.json
\`\`\`

Where \`<TS>\` is ISO-8601 UTC with hyphens. Create \`.orbit-runs/\` if it doesn't exist. Use a FRESH timestamp distinct from the prompt file's \`<TS>\` (one ISO-second resolution may make them identical; bump by one second if so).

This is the T0 emit. T1 (findings returned and walked, by discovery or by \`--from-file\`) is the EXISTING \`address-reviews-<TS>.json\` emit and is unaffected.

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
  "pair": true,
  "awaiting_findings": true,
  "judgements": [ { "kind": "continuation", "disposition": "spend", "formed_against": ["<independent pass TS>"], "reasoning": "<why a further pass was bought>", "ratified_by": "ai|user" } ]
}
\`\`\`

**Example payload.** A payload file this branch writes when the handoff is a spend bought past a passed gate — real JSON, accepted by \`orbit emit review-external --change <name>\`, carrying no engine-owned key (\`awaiting_findings\` is composed). A handoff that is not a spend OMITS \`judgements\`. A test submits this block, unchanged, through the write gate, with the trail seeded with the pass its \`formed_against\` names (\`orbit-emit-composition\`'s \`Payload schema references are proven by execution\`).

\`\`\`json example change
{
  "mode": "system",
  "prompt_path": "orbit/changes/add-detail-flag/.orbit-runs/external-prompt-system-2026-10-02T09-15-00Z.md",
  "target": "GPT-6 Codex",
  "final_assessment": "External review prompt packaged for add-detail-flag (iter 3, mode system); awaiting findings from GPT-6 Codex.",
  "judgements": [
    {
      "kind": "continuation",
      "disposition": "spend",
      "formed_against": ["2026-10-01T16-40-00Z"],
      "reasoning": "The gate passed on the blind pair, but the walk rewrote the parser's input domain; one more external pass on the walked tree is worth its cost.",
      "ratified_by": "user"
    }
  ],
  "model": "claude-opus-5-5"
}
\`\`\`

**THE PAIR LAUNCH (rc17a).** \`pair\` is OPTIONAL. A T0 carrying \`pair: true\` is a blind pair's LAUNCH: its meaning is \`orbit-engine-gates\`' \`A pair's membership is computed from its launch\`, and the field's checks are \`orbit-emit-composition\`'s \`The review-external payload carries pair\` (a boolean; \`pair: true\` needs an explicit \`mode\` of \`proposal\` or \`system\`; \`pair: false\` writes the ordinary T0). No step of this branch writes it on its own: it is written only when \`references/blind-pair.md\` runs this packaging as a blind pair's external half (\`--reviewer blind-pair\`). A re-run of a missing external half re-packages WITHOUT it, so the re-run refills the open pair rather than launching a new one. The payload below is a launch's:

\`\`\`json example change
{
  "mode": "system",
  "pair": true,
  "prompt_path": "orbit/changes/add-detail-flag/.orbit-runs/external-prompt-system-2026-10-02T09-15-00Z.md",
  "target": "GPT-6 Codex",
  "final_assessment": "External review prompt packaged for add-detail-flag (iter 1, mode system) as the external half of a launched blind pair; awaiting findings from GPT-6 Codex.",
  "model": "claude-opus-5-5"
}
\`\`\`

**THE SPEND RECORD (rc04a).** When this handoff is a FURTHER independent pass bought past a gate that has ALREADY passed — a decision the cadence has no other home for — the payload SHALL carry a \`judgements\` entry with \`kind: "continuation"\` and \`disposition: "spend"\`, written at exactly the moment the decision is taken rather than reconstructed later. \`formed_against\` names the passes already returned; \`reasoning\` says why another was worth buying. The token source is the TRAIL ITSELF, not \`orbit status\`: the change-tier status payload reports gate spend COUNTS and reason strings, never pass tokens. List \`orbit/changes/<change-name>/.orbit-runs/\` and take the \`<TS>\` of each \`review-<mode>-<TS>.json\` whose \`reviewer_class\` is \`fresh\` or \`external\`, plus each \`external-<mode>-<TS>.md\` the trail reader ACCEPTED as a pass — a return the gate's \`reason\` names as REJECTED is not citable, and enumerating filenames alone over-counts by exactly those. Which passes count is \`orbit-run-summary-emit\`'s rule (the trail reader's pass set); this body names it and does not restate it — the write gate enforces it and names the pass it refuses on. This emit admits \`continuation\` ONLY — a \`readiness\` here is refused, since the T0 handoff record has no reader for one. A handoff that merely covers a DECLARED, still-uncovered cadence slot is not a spend decision and carries no record.

\`awaiting_findings: true\` is always set at T0. Future tooling may flip this when findings land; for now it's a flag that downstream consumers can use to identify "T0 emit, not yet completed cycle." \`reviewer_class: "external"\` (C1) describes the intended handoff class for audit readability — but per \`orbit-run-summary-emit\`, a T0 emit is a PACKAGING record, NOT a completed pass: whichever cadence slot an external return would satisfy — a bare \`external\` slot, an \`independent\` slot, the external half of a \`blind-pair\`, or an \`invoked\` slot (as a single, or as a launched pair's external member) — is satisfied ONLY when an \`external-<as>-<TS>.md\` findings file exists, so a packaged-but-unreturned external never counts as class coverage.

### \`next_recommended\` — multi-step prose

Per \`orbit-run-summary-emit\`'s \`Review-external T0 multi-step recommendation\` requirement, the recommendation is multi-step prose describing the user action ONLY, ending at the save step — it names no walk command; what follows the save is the gate's canonical next, read from \`orbit status --change <name> --json\`:

\`\`\`
"Paste orbit/changes/<name>/.orbit-runs/external-prompt-<as>-<TS>.md
 into the target AI, and save the response as
 orbit/changes/<name>/.orbit-runs/external-<as>-<TS>.md"
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

0. **verify-change-style structural check** — tasks done, spec coverage, design adhered (the external AI runs its own equivalent of upstream verify-change). Take scenario test coverage from \`orbit status --change <change-name> --scenarios --json\` (the scenario map), never by searching test files; an external reviewer who cannot run it reports the check as not run.
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

You are reviewing an orbit change as a second pair of eyes. Your value is
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
const REVIEW_BLIND_PAIR_REFERENCE = `# Reference: the blind pair (\`--reviewer blind-pair\`)

This reference runs a BLIND PAIR — one \`fresh\` pass and one \`external\` pass of the mode, blind to each other — in ONE invocation. Its step order is \`orbit-review\`'s \`The blind-pair reviewer runs both halves in one invocation\`; what the launch record means is \`orbit-engine-gates\`' \`A pair's membership is computed from its launch\`. The external half's packaging, launch, save and commit are \`references/external-handoff.md\`'s (loaded with this one) and are NAMED below, never restated; the fresh half is the trunk's **Dispatching a fresh pass**, also named, not restated.

**Input**: the change name and \`--as proposal|system\`, resolved by the review trunk before this reference loads (architecture mode never reaches it).

**This session orchestrates; it is neither half.** It runs no pass work, writes no pass file, and reads neither half's return before both are committed — beyond the trail listing Step 6 needs (filenames and the \`reviewer_class\` field). Every git act is a body step (zero engine git), and every commit adds NAMED paths only — \`git add <paths>\` then \`git commit --only <paths>\` — so work the user stages during the run stays out.

**Other flags.** Every other flag of the command applies to each half exactly as it applies to that half's single run — the fresh half as under \`--reviewer fresh\`, the external half as under \`--reviewer external\`.

## Steps

### 1. Preflight and the runner

Run \`git status --porcelain\`. ANY output refuses the pair: write NOTHING — no prompt file, no T0 — dispatch no subagent, launch no runner, and print \`Not run: a blind pair reviews the committed state, and the working tree has uncommitted changes:\` followed by each uncommitted path, then \`Commit the pending work, then re-run the review.\` Never auto-commit the user's pending work. Unpushed commits are allowed: they ride Step 3's push.

Then read the runner ONCE — this IS the handoff reference's Step 3a read, which is not repeated:

\`\`\`bash
orbit external runner --json
\`\`\`

Record the ROUTE: \`reachable: true\` → LAUNCHED; \`{"runner": null}\` or \`reachable: false\` → PASTED. The route decides what the packaging writes (the prompt's \`## Repo\` line, the T0's \`target\`) and Step 4; the runner is never read again in this run.

### 2. The launch

Read the REVIEWED COMMIT now: \`git rev-parse HEAD\`. Run the handoff reference's Steps 4–7 for the route — the iteration count, the cycle context, the recommended-session note, and the prompt file (on the launched route, Step 7's \`<run-dir>\` and worktree \`## Repo\` line; on the pasted route, the pair-half \`## Repo\` line of its Step 3b, naming the REVIEWED COMMIT). Then emit the T0 with \`pair: true\` — the payload shape is the handoff reference's pair-launch example (\`target\` the runner's \`name\` on the launched route, \`null\` otherwise):

\`\`\`bash
orbit emit review-external --change <change-name> --payload <payload-file>
\`\`\`

The prompt file and this T0 are ONE act, the LAUNCH. Its token is L.

### 3. BASE

Commit the prompt file and the T0 — and nothing else — as the HANDOFF COMMIT, on BOTH routes, and push:

\`\`\`bash
git add <prompt-path> <t0-path>
git commit --only <prompt-path> <t0-path> -m "External review handoff (<as>, iter <N>): <change-name> — blind pair launch"
git push
\`\`\`

That commit is the pair's BASE. A failed push, or no remote, is REPORTED and the run goes on; record whether the push landed — every later attestation says "pushed" only when it did.

### 4. The route

Step 1's reading decides: LAUNCHED takes Step 5a, PASTED takes Step 5b. Step 5c runs on both, after Step 3.

### 5a. The external half, launched

Run the handoff reference's 9b (the worktree at BASE, which is the handoff commit) and 9c (the launch, in the background, with \`run_in_background\`). Print its 9e items 1–4, then, in place of item 5, the recovery line under **Session end** below. Its return stays at \`<run-dir>/return.md\`, OUTSIDE the repository, and is NOT saved yet (the handoff reference's 9d hands control back here).

### 5b. The external half, pasted

Print the handoff reference's Step 8 items in order, with item 4 the output Step 3's push left selected: when the push landed, the attestation \`Prompt committed (<short-sha>) and pushed to <remote>/<branch>\` and the pull invocation; when it did not, \`Handoff blocked: the handoff commit <short-sha> is not pushed. Push, then hand off: Pull <repo URL> and read <prompt-path>. ...\` — the prompt is already committed, so only the push leads.

### 5c. The fresh half

Dispatch the fresh half per the trunk's **Dispatching a fresh pass** — a clean-context subagent with that section's brief, unchanged — in the background (the **Task tool** with \`run_in_background\`). It reads the live checkout at BASE and persists through \`orbit emit review\` with \`reviewer_class: "fresh"\` like any fresh pass; it carries no launch token.

### 6. Wait

Wait on both background completions — on the pasted route, the fresh half's only. A half ends when its process exits or the user stops it; invent no timeout, and do not poll.

Whether the fresh half LANDED is read from the TRAIL, never from the worker's exit: list \`orbit/changes/<change-name>/.orbit-runs/review-<as>-*.json\` and read each one's \`reviewer_class\` field only. The earliest one with \`reviewer_class: "fresh"\` and a token later than L IS the landed member, however the worker ended (a worker stopped after its emit landed); with none, the fresh half is MISSING. The external half is MISSING when its run exits non-zero or Step 8's save refuses it. Nothing is committed for a missing half.

### 7. The fresh pass file

Commit the landed fresh pass file ALONE, BEFORE Step 8:

\`\`\`bash
git add <fresh-path>
git commit --only <fresh-path> -m "Fresh review (<as>): <change-name> — blind pair, fresh half"
\`\`\`

### 8. The external return

LAUNCHED route only, and only after Step 7 — or once the fresh half is known MISSING: save the return with the handoff reference's 9d command, \`--launch\` taking L:

\`\`\`bash
orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <L> --json
\`\`\`

A non-zero run exit or a save refusal is the handoff reference's **A failed run** paragraph: nothing committed for the return, its cause and raw path reported, its paste fallback printed with the commit line naming the REVIEWED COMMIT — except after an apply later than the launch, which has no fallback.

### 9. The saved return

Commit the saved file ALONE exactly as the handoff reference's 9d does — the message written to \`<run-dir>/commit-msg.txt\` with the removed lines quoted, passed with \`-F\` — but WITHOUT 9d's \`git push\`:

\`\`\`bash
git add <saved-path>
git commit --only <saved-path> -F '<run-dir>/commit-msg.txt'
\`\`\`

### 10. Push

ONCE, after Steps 7 and 9 (whichever committed): \`git push\`. A failed push is reported; the commits stand; no retry.

### 11. The worktree

LAUNCHED route only: \`git worktree remove --force <run-dir>/worktree\`, after the return was read. A failed removal is reported, never fatal.

### 12. Reports

For each LANDED pass — the fresh pass, then the saved external return — render \`orbit status --change <change-name> --report <TS>\` and paste it.

### 13. End

Render the position readout and the engine's eligibility line from \`orbit status --change <change-name> --json\` — \`Ready when you are: <next_command>\`. The walk is NEVER invoked: \`/orbit:address-reviews\` is the user's to run (no-chaining). When a half is missing — after Step 5b, or a run that failed or wrote nothing — the pair ends OPEN and no half covers alone; read what the gate reports from that same status JSON, never from this text. With one half landed it carries \`openPair\` naming the missing class (after Step 5b, \`{missing: "external"}\`: the pasted return completes the pair when it is saved); with BOTH missing it carries no \`openPair\` and its reason says neither member has landed.

## Session end

A session that ends mid-pair leaves work outside the record. On the LAUNCHED route print, in place of the handoff reference's 9e item 5:

\`Raw output: <run-dir>/return.md — if this session ends before the pair does: first, IF a fresh pass file landed (the review-<as>-*.json with reviewer_class "fresh" later than <L>), commit it alone (git add <path>, then git commit --only <path>) — with none, the pair stays open missing its fresh half — then save the return with: orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <L>, commit the saved file alone, push, and run git worktree remove --force <run-dir>/worktree\`

On the PASTED route print: \`If this session ends before the fresh half does: IF a fresh pass file landed (the review-<as>-*.json with reviewer_class "fresh" later than <L>), commit it alone (git add <path>, then git commit --only <path>) and push; with none, the pair stays open missing its fresh half.\`
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
export function getReviewSkillTemplate() {
    return {
        name: 'orbit-review',
        description: "Editorial review of an orbit change or an architecture doc: proposal mode (pre-apply, 9 passes over artifacts), system mode (post-apply, verify-change + 6 system-wide passes), or architecture mode (a doc under orbit/architecture/, 6 passes, no gate). Use when the user wants a second-pair-of-eyes pass before applying or archiving, or a graded pass over a program architecture doc.",
        instructions: `Run an editorial review of an orbit change or an architecture doc. Three modes: \`--as proposal\` reviews a change's pre-implementation artifacts (9 passes); \`--as system\` reviews the whole product state after apply (verify-change as Pass 0 + 6 system-wide passes); \`--as architecture\` reviews an architecture DOC under \`orbit/architecture/\` (6 passes, NO gate — D-arc Stage D2). All modes share the 3-dimension scorecard (Completeness / Correctness / Coherence), the severity ladder (CRITICAL / WARNING / SUGGESTION — defined ONCE, by consequence, in \`orbit-conventions\`' Severity ladder; every pass rule NAMES it and defines nothing of its own), pushback discipline, and \`.orbit-runs/\` persistence. They differ on which passes run, what the final-assessment references (the \`review-proposal\` / \`review-system\` gates for the change modes; NO gate in architecture mode), and a few mode-specific flags (\`--mark\` for proposal, \`--skip-verify\` for system). The command additionally carries the REVIEWER axis (D-arc Stage D5): \`--reviewer in-context|fresh|external|blind-pair\` (default \`in-context\`). The first three are the reviewer classes; \`blind-pair\` is not a class but an INVOCATION of both independent classes at once — one fresh pass and one external pass, blind to each other. Each value has ONE shorthand that is exactly \`--reviewer <value>\`: \`--in-context\`, \`--fresh\`, \`--external\`, \`--blind-pair\`; an invocation carries AT MOST ONE reviewer selector (the selector table under Step 3). \`--reviewer external\` and \`--reviewer blind-pair\`, by either spelling, REQUIRE \`--as proposal|system\` (architecture mode supports in-context and fresh only; the combination is a clean usage error naming the constraint, and writes no prompt file and no T0 emit). \`external\` dispatches to the EXTERNAL-HANDOFF BRANCH: load \`references/external-handoff.md\` and follow it — it packages the prompt file and the T0 emit, then either prints the chat invocation snippet for paste or, with a reachable recorded runner, launches that runner and saves its return; no pass of the internal classes runs in that invocation. \`blind-pair\` loads \`references/blind-pair.md\` AND \`references/external-handoff.md\` and follows the pair reference, which runs both halves. The in-context and fresh branches load neither reference.

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
| \`--reviewer <value>\` | \`in-context\` | Reviewer: \`in-context\` (this session — the reacting class) / \`fresh\` (same model, clean context — a clean-context subagent; see Dispatching a fresh pass) / \`external\` (a different AI in a separate session — the handoff branch, \`references/external-handoff.md\`) / \`blind-pair\` (one fresh and one external pass in one invocation — \`references/blind-pair.md\`). |
| \`--in-context\` | off | Exactly \`--reviewer in-context\`. |
| \`--fresh\` | off | Exactly \`--reviewer fresh\` (same model, clean context). |
| \`--external\` | off, proposal/system only | Exactly \`--reviewer external\`. |
| \`--blind-pair\` | off, proposal/system only | Exactly \`--reviewer blind-pair\`. |
| \`--mark\` | off, proposal only | After report, write \`@review: <text>\` markers at each finding's file:line. See \`references/flags-detail.md\`. |
| \`--skip-verify\` | off, system only | Skip Pass 0 (verify-change). Use when verify-change was run separately. |

**Reviewer selectors.** Resolve the reviewer BEFORE anything is read or written, by this table; every error row is a clean usage error that runs no pass and writes no file:

| selectors given | resolves to |
|---|---|
| none | \`--reviewer in-context\`, the default |
| exactly one shorthand | exactly \`--reviewer <its value>\` |
| \`--reviewer <value>\` alone | that value |
| two shorthands, or a shorthand with an explicit \`--reviewer\` — even when they agree | usage error naming the shorthand equivalence: \`--<value> is exactly --reviewer <value>; give one reviewer selector\` |
| \`external\` or \`blind-pair\`, by either spelling, with \`--as architecture\` | usage error: \`--reviewer <value> requires --as proposal|system; architecture mode supports in-context and fresh only\` |
| a \`--reviewer\` value outside the four | usage error naming the four: \`in-context\`, \`fresh\`, \`external\`, \`blind-pair\` |

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
  - **(a) Genre.** The probe above is this body's reading; the ENGINE's computation, by \`orbit-conventions\`' table, is authoritative. When \`orbit emit review\` refuses the payload — an owed \`verification\` missing, a key omitted, a verdict not owed — the refusal names each key as \`walk <token>: (<title>, <file>)\`: read those entries, grade or drop them, and emit again. The refusal is the reconciling channel, in BOTH directions — never a second probe, never a hand-computed walk set: when it says \`verification\` is refused on a REVIEW-genre pass, the engine computed REVIEW, so drop \`verification\` and every \`walk_entry\`, run this pass as a REVIEW-genre pass over the whole artifact, and emit again.
  - **(b) Read the walks.** Open the address-reviews records of this mode after the latest accepted independent pass — the walks the probe found — and each entry's disposition.
  - **(c) Grade.** Every OWED entry — the \`resolved\` ones, at every severity — gets one verdict, \`landed\` or \`regressed\`, by the definition under **Verdicts** below and the owed set \`orbit-emit-composition\`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record** owns. Read each entry's SWEEP SCOPE: its \`file\`, every path in its \`ripple_cascade.applied\` (the cascade record \`orbit-address-reviews\` specifies), and, on an entry that carries one, every path in its \`sweep.scope\` (the sweep record \`orbit-address-reviews\`' \`A resolved walk entry records its sweep evidence\` owns; a directory contributes its files, and every path resolves by the rule under **Sweep scope and paths** below). A \`stale\`, \`deferred\` or \`escalated\` entry owes nothing, but a wrong call there is still a finding.
  - **(d) Review the scope, then the residual check.** Run this mode's FILE-SET passes over the union of the sweep scopes — every proposal-mode pass; system-mode Passes 1–5. A pass whose subject is the whole change or the whole project — system-mode Pass 0 (verify-change) and Pass 6 (audit-drift) — is NOT run: list it in \`passes_skipped\` naming that reason. Then list \`git diff --name-only <C> -- . ':!orbit/changes/<name>/.orbit-runs'\` plus \`git ls-files --others --exclude-standard -- . ':!orbit/changes/<name>/.orbit-runs'\`, where \`<C>\` is \`git log --diff-filter=A --format=%h -- <base file> | tail -1\` (a hash-only read), or \`HEAD\` when that file is not yet committed — the BASE FILE is the latest accepted independent pass's file, or, when this mode has no accepted independent pass, the file of the pass the earliest walk you verify walked. Name each listed file outside every entry's EDIT RECORD — its \`file\` plus its \`ripple_cascade.applied\`; \`sweep.scope\` names paths examined, not edited, so it never exempts a file here — as a SUGGESTION without \`walk_entry\` — a record gap, not a defect; a defect you find in such a file is its own finding, graded by \`orbit-conventions\`' Severity ladder. KNOWN LIMIT: an edit committed in \`<C>\` itself — the commit that added the base file — is outside the diff's reach; never claim the scope was checked against that commit. It is the ORDINARY case, not an edge, when the base file was committed together with the walks' edits — commit the pass file BEFORE the walks' edits so they stay in range.
  - **(e) Compose.** \`verification\` — one \`{title, file, verdict}\` per owed entry, \`[]\` when nothing is owed — and, on each finding about a walk entry, \`walk_entry: {title, file}\`: a defect in a \`resolved\` entry's edit names that entry and grades it \`regressed\` (every \`regressed\` verdict needs a finding naming it); a finding about a \`stale\`, \`deferred\` or \`escalated\` entry names that entry; a finding about no entry carries no link, and the report marks it \`[outside the walk record]\` per \`orbit-report-rendering\`'s **Verification renders as its own section and its absence is marked**. Never supply \`pass_genre\` or \`verified_walks\` — the engine computes both.

#### Verdicts

The definition below is a CHECKED MIRROR of \`orbit-emit-composition\`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record** — its owner. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here.

\`\`\`
landed — the resolution's edit is PRESENT, COMPLETE across every site the resolution claims, CLEAN (it introduced no defect), and NOT UNDONE by a later edit.
regressed — any of those fails, or the verifying pass cannot decide (an undecidable claim is not a held one); its cause is stated by the finding that names it.
\`\`\`

#### Sweep scope and paths

The rule below is a CHECKED MIRROR of \`orbit-emit-composition\`'s **The walk write gate checks sweep evidence** — its owner, which the walk's write gate enforces. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here. Grade over the paths it resolves, so you read the file the gate read.

\`\`\`
CHECK SCOPE — the union of: on a change-scoped walk, every file under the change directory except its .orbit-runs/ trail; the entry's file; its ripple_cascade.applied paths; its sweep.scope paths, a directory contributing the regular files under it (a symlink met inside a directory is not followed; a path named explicitly is read at its target). Files under .git/, node_modules/, dist/ and build/ are never read, however the path entered the scope; for the change directory's own files those names are read below the change directory.
PATH — strip a trailing :<line> or :<line>:<column> (digits only, at the very end; a path carrying anything after the suffix, such as "design.md:40 (section)", is not stripped, and resolves to nothing); a path beginning orbit/changes/<name>/ for the walk's own change resolves under the change directory, archived or active; otherwise it resolves against the project root, then, on a change-scoped walk and only when nothing exists there, against the change directory.
\`\`\`

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

**A re-run of a blind pair's missing fresh half.** Before dispatching, read \`orbit status --change <name> --json\`. When the mode's reviewed gate row carries \`openPair: {missing: "fresh"}\`, the run is a RE-RUN: find the pair's open launch L — the latest \`review-external-<TS>.json\` of this mode carrying \`pair: true\`, reading only its \`mode\` and \`pair\` fields — and list the trail's \`apply-*.json\` tokens. With NO apply token later than L, BASE is \`git log --diff-filter=A --format=%H -- <L's T0 path> | tail -1\` (a hash-only read) and the REVIEWED COMMIT is \`git rev-parse <BASE>^1\`. With an apply token later than L, the landed external member was emitted after it and reviewed the post-apply state, and the engine counts this run as the pair's missing member: the REVIEWED COMMIT is \`git rev-parse <M>^1\`, M being \`git log --diff-filter=A --format=%H -- <member path> | tail -1\` for the earliest \`external-<mode>-*.md\` later than L (when M is empty, stop and say to commit that file alone first). Either way the brief gains these lines after its last: \`Review the repository as it stands at commit <REVIEWED COMMIT>, not the live checkout: read the change's files and, in system mode, the code and the commit range ending at that commit (git show <commit>:<path>; git diff <change-start>..<commit>). Where the skill's steps read state through the orbit CLI — orbit status, orbit instructions, the scenario map, Pass 0's structural check — that output describes the live checkout, not the reviewed commit: take the artifacts you review from the commit, use the CLI only for what the emit needs, and say in the pass which readings came from the live checkout. Run orbit emit review from the repository root as usual.\` The isolation is instructed, not physical — the rule and its named limit are \`orbit-review-external\`'s \`A pair's external half reads the pair's reviewed state\`. When the mode has no \`openPair\` and the latest launch's one landed member is STALE — read from the trail: exactly one landed member later than L (an earliest fresh \`review-<mode>-*.json\` or earliest \`external-<mode>-*.md\`, and none of the other class), no \`address-reviews-*.json\` naming it in its \`source_path\`, and an \`apply-*.json\` token later than it — never from the gate's reason — say \`The pair launched at <L> reviewed a superseded state (an apply landed after its <class> member); this run is an ordinary single on the current state.\` and dispatch the brief unchanged. The re-run test is this body's reading of the trail; the gate's computation is authoritative.

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
Gate review-system: unpassed — pass 2026-05-26T15-12-08Z has unresolved substantive findings
Position: propose ✓ → review(proposal) (past) → apply ✓ → review(system) unpassed → archive blocked-by-gate
Ready when you are: /orbit:address-reviews example-change]

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
                name: 'blind-pair.md',
                content: REVIEW_BLIND_PAIR_REFERENCE,
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
export function getOrbitReviewCommandTemplate() {
    return {
        name: 'ORBIT: Review',
        description: 'Editorial review of a change (proposal/system mode) or an architecture doc (architecture mode)',
        category: 'Workflow',
        tags: ["workflow", "review", "orbit"],
        content: `Run an editorial review of a change — proposal mode (pre-apply, 9 passes) or system mode (post-apply, verify-change + 6 system-wide passes) — or of an architecture doc (--as architecture: 6 passes, no gate).

This command is a thin launcher: invoke the \`orbit-review\` skill, passing along any arguments given with the command (e.g., \`/orbit:review [<change-name-or-doc-name>] [--as proposal|system|architecture] [flags]\`). The skill carries the complete workflow instructions — upstream behavior plus orbit's additions. Do not improvise the workflow from this file; load the skill.`
    };
}
//# sourceMappingURL=review.js.map