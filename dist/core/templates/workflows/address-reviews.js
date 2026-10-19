const ADDRESS_REVIEWS_EXTERNAL_FINDINGS_FORMAT_REFERENCE = `# Reference: external-findings file format (for \`--from-file\` markdown parsing)

This is ONE of two supported \`--from-file\` formats; the other is internal findings JSON (covers both \`command: "review"\` AND \`command: "audit-drift"\` shapes) — see \`internal-findings-format.md\`. The parser auto-detects format via content sniff (leading \`# External Review:\` → this format; leading \`{\` → JSON).

The \`--from-file <path>\` markdown path ingests an external-AI's findings file. The file is produced by the external-handoff branch of \`/orbit:review --as <mode> --reviewer external\` — typically the external AI writes it after pulling the repo and reading the prompt.

This format MUST match what \`/orbit:review --as <mode> --reviewer external\` instructs the external AI to write. Deviations on either side break the cross-AI loop.

## Expected file format

\`\`\`markdown
# External Review: <change-name> (iteration <N>)

**Reviewer**: <model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>
**Reproduction**: <the re-executable case, per \`orbit-conventions\`' Severity ladder; a CRITICAL without one is counted and marked unreproduced, never re-graded>

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <text>

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <text>

## Blocks

<Optional — conditions that must be addressed before apply but are not severities (an \`orbit validate\` failure, an unresolved \`@review:\` marker), one \`- <what>\` line each; \`None.\` if none. Listed FIRST at triage and never walked as findings.>

## Direction

**Disposition**: <forward | hold>

<REQUIRED on every return — the reviewer's forward recommendation (which way and why), per \`orbit-conventions\`' External-review findings markdown format, which owns the section and its opener; the content contract is \`orbit-report-rendering\`'s Direction requirement's. NEVER WALKED: the walk lists no entry for it — the report renders it in its own \`### Direction\` section and marks a return without it \`[no direction]\`, a non-conforming one \`[direction malformed]\`; the counters ignore the section.>

## Notes

<Optional — the Notes body renders VERBATIM into the report's Commentary slot; it carries pattern/probing/risk texture and never finding counts, gate verdicts, or next commands. The format is owned by \`orbit-conventions\`' External-review findings markdown format; the prompt template in the \`orbit-review\` skill (\`references/prompt-template.md\`) is its checked copy.>
\`\`\`

The \`**Reproduction**:\` body follows the \`**Description**:\` body and runs to the next \`###\` or \`##\` heading; a \`**Reproduction**:\` line placed BEFORE \`**Description**:\` is not recognised. Inside any body, a field-shaped line (\`**File**: other.md:9\`) is CONTENT — the finding's file is the \`**File**:\` line read before its Description opened (per \`orbit-conventions\`' External-review findings markdown format, the field-line rule).

## Parser contract

For each finding under each severity section, construct a virtual marker with:

| Virtual marker field | Source |
|---|---|
| \`severity\` | The \`## <SEVERITY>\` section header (CRITICAL / WARNING / SUGGESTION) |
| \`title\` | The \`### <Finding title>\` line |
| \`file:line\` | The \`**File**: <path>:<line>\` field (read BEFORE the Description body opens — a path quoted inside a body never re-files the finding) |
| \`description\` | The \`**Description**: <text>\` body (ended by \`**Reproduction**:\`, the next \`###\`, or the next \`##\`) |
| \`reproduction\` | The \`**Reproduction**: <text>\` body when present; absent otherwise — a CRITICAL marker without one is tagged \`unreproduced\` at triage and in its resolution entry's \`reproduction_rerun\` |
| \`source\` | Always \`external\` (vs \`inline\` for grep-found markers) |

Entries under \`## Blocks\` (\`- <what>\` lines) are NOT virtual markers: they are listed FIRST in the triage table as blocks and never walked (per \`orbit-conventions\`' Severity ladder, a block is a report with a name; nothing stops on it mechanically and the stop is the human's).

Virtual markers walk the same lifecycle as inline markers, with one exception: **the marker-removal step (Step 3e in the SKILL.md walk) is a no-op for virtual markers** — there's no source-file marker text to delete.

## Malformed input handling

If the file is missing required sections, has broken field labels, or otherwise can't be parsed cleanly:

- Report a parse error to the user with the expected format above
- Exit without acting on partial input — do not attempt to walk a half-parsed marker set
- The user fixes the file and re-runs

## Tolerated variations

The parser SHOULD be lenient on:

- Whitespace between sections (blank lines OK)
- \`**Reviewer**:\` and \`**Date**:\` field absence (warn, don't fail; reviewer attribution falls back to "unknown external AI")
- Optional \`## Notes\` section absent (treated as no notes)
- **Empty-severity sentinel**: when a severity section contains the single body line \`None.\` (or equivalent — \`None\`, \`none.\`, \`(none)\`) with no \`### <Title>\` entries underneath, the section parses cleanly to zero findings at that severity. This matches what external reviewers naturally write when there are no findings at a given severity.

The parser MUST be strict on:

- Severity section headers (\`## CRITICAL\`, \`## WARNING\`, \`## SUGGESTION\` — exact case)
- Finding titles use \`### \` prefix
- \`**File**:\`, \`**Description**:\` and \`**Reproduction**:\` field labels (exact)

The reason for the strict/lenient split: the strict items are what the orbit format guarantees and what allows cross-AI loops to work; the lenient items vary across reviewers without breaking semantics.

## Quick worked example of valid input

\`\`\`markdown
# External Review: <change-name> (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-05-18

## CRITICAL

None.

## WARNING

### First finding title
**File**: path/to/file.md:42
**Description**: What's wrong + recommendation.

### Second finding title
**File**: another/path.md:88
**Description**: Detail.

## SUGGESTION

### A suggestion
**File**: README.md:909
**Description**: Detail.

## Notes

Overall impression goes here.
\`\`\`

This example has 0 CRITICAL (using \`None.\` sentinel), 2 WARNING, 1 SUGGESTION. The codex-pushed iter-1 system-mode findings file (\`orbit/changes/add-review-workflows/.orbit-runs/external-system-2026-05-18T17-33-40Z.md\`) is a real-world example produced by GPT-5 Codex.
`;
const ADDRESS_REVIEWS_INTERNAL_FINDINGS_FORMAT_REFERENCE = `# Reference: internal-findings file format (for \`--from-file\` JSON parsing AND discovery)

This parser contract is consumed by BOTH explicit \`--from-file <path>\` invocations AND discovery from \`.orbit-runs/\` when \`/orbit:address-reviews <change-name>\` walks a change's outstanding passes and unwalked audit-drift emits (the DISCOVERY fence in SKILL.md Step 1). The parsing logic and virtual-marker construction are IDENTICAL regardless of how the JSON entered the lifecycle — only the resolution log's \`source\` field differs (\`"from-file"\` vs \`"auto-discovered"\`).

The \`--from-file <path>\` flag accepts TWO format families: (a) external-review markdown (see \`external-findings-format.md\`), (b) internal findings JSON (this file). The parser auto-detects format via content sniff: leading \`{\` routes to JSON; leading \`# External Review:\` routes to markdown; anything else triggers a format-mismatch error.

This format MUST match what \`/orbit:review\` writes to \`orbit/changes/<name>/.orbit-runs/review-<mode>-<TS>.json\` for \`proposal\`/\`system\` modes, what it writes to \`orbit/architecture/.orbit-runs/review-architecture-<TS>.json\` for \`architecture\` mode (D-arc Stage D2 — \`change: null\` plus a \`doc\` field naming the reviewed doc), OR what \`/orbit:audit-drift\` writes to its summary JSON paths (per the audit-drift run-summary-schema). V1 accepts BOTH \`command: "review"\` AND \`command: "audit-drift"\` JSON; other \`command\` values are rejected. The full JSON schemas live in the producer skills' bundled references — the \`orbit-review\` skill's \`references/run-summary-schema.md\` and the \`orbit-audit-drift\` skill's \`references/run-summary-schema.md\` (shipped alongside each generated skill); this file documents the \`--from-file\` parser's subset of those schemas (the fields it reads to construct virtual markers).

## Expected file format

### Review JSON (\`command: "review"\`)

\`\`\`json
{
  "command": "review",
  "timestamp": "<ISO-8601>",
  "change": "<change-name>",              // null in architecture mode (a doc field names the reviewed doc)
  "doc": "<doc-name, architecture mode only>",
  "mode": "proposal" | "system" | "architecture",
  "iteration": <integer>,
  "scorecard": {
    "completeness": { "critical": <int>, "warning": <int>, "suggestion": <int> },
    "correctness": { "critical": <int>, "warning": <int>, "suggestion": <int> },
    "coherence": { "critical": <int>, "warning": <int>, "suggestion": <int> }
  },
  "findings": [
    {
      "pass": "<pass id>",
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "file": "<path>",
      "line": <integer>,
      "title": "<finding title>",
      "recommendation": "<actionable recommendation>",
      "reproduction": "<present on every CRITICAL written since rc02b; optional below; multi-line allowed>",
      "recommendation_options": [
        { "label": "A", "body": "..." },
        { "label": "B", "body": "..." }
      ]
    }
  ],
  "blocks": ["<optional: lifecycle blocks the pass found — listed FIRST at triage, never virtual markers>"]
}
\`\`\`

Review emits written before D-arc Stage D4 carry \`findings_summary\` (flat severity counts) instead of \`scorecard\`; that legacy field is still READ — this parser consumes neither, only \`findings[]\` — but no current review emit writes it.

### Audit-drift JSON (\`command: "audit-drift"\`)

\`\`\`json
{
  "command": "audit-drift",
  "timestamp": "<ISO-8601>",
  "change": "<change-name string OR null for project-wide standalone>",
  "categories_run": ["1", "2", "3", "4", "5", "6"],
  "findings_total": <int>,
  "findings_by_category": { "<category id>": <int> },
  "findings": [
    {
      "category": "1" | "2" | "3" | "4" | "5" | "6",
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "file": "<path>",
      "line": <integer>,
      "title": "<finding title>",
      "recommendation": "<actionable recommendation>",
      "recommendation_options": [
        { "label": "A", "body": "..." },
        { "label": "B", "body": "..." }
      ]
    }
  ]
}
\`\`\`

### Optional \`recommendation_options\` field (BOTH formats)

Both review JSON and audit-drift JSON MAY emit an optional \`recommendation_options: [{label, body}]\` array on a finding when the recommendation is genuinely disjunctive — multiple defensible paths the user must choose between. The address-reviews parser reads this field for the **structured decision-fork detection path** (per \`orbit-address-reviews\` spec's \`Disjunctive recommendation fields surface as decision forks\` requirement). Field shape is identical across the two producer formats; consumer parses both uniformly.

Producer-side contract (enforced by orbit-review and orbit-audit-drift specs):

- MUST contain ≥ 2 entries when emitted (single-option arrays defeat the purpose; the prose \`recommendation\` field carries single recommendations).
- Each entry MUST have non-empty \`label\` (typically \`"A"\`, \`"B"\`, \`"C"\`, … or \`"1"\`, \`"2"\`, …) and non-empty \`body\` (the concrete action the user would take if they pick this option).
- The prose \`recommendation\` field still summarizes the disjunction for human readers; the structured field complements it, doesn't replace.
- OPTIONAL on every finding — single-recommendation findings omit it.

The two shapes are identical at the universal-spine + \`findings[]\` level. They differ only in the provenance slot per finding: review JSON carries \`pass\` (string pass-id), audit-drift JSON carries \`category\` (one of \`"1"\`–\`"6"\`, the audit-drift category ids; the emit's shape is owned by \`orbit-run-summary-emit\`'s \`Audit-drift standalone recommendations\`).

### Universal-spine field requirements (BOTH formats)

The universal-spine fields (\`command\`, \`timestamp\`, \`change\`, \`final_assessment\`, \`next_recommended\`, \`kind\`, \`model\` — \`model\` absent on pre-capability emits) are REQUIRED in every real orbit-emitted JSON per \`orbit-conventions\`'s \`Internal-run JSON summary format\` requirement; downstream tools rely on them being present. The address-reviews \`--from-file\` parser does NOT consume them when constructing virtual markers — it only reads \`command\` (as the discriminator) and \`findings[]\` (for marker construction). Other top-level fields (\`final_assessment\`, \`next_recommended\`, \`kind\`, \`depth\`, \`flags\`, \`passes_run\`, \`passes_skipped\`, \`stale_suppressed\`, \`iteration_note\`, \`categories_run\`, \`findings_total\`, \`findings_by_category\`, etc.) are present in real JSON and IGNORED by this parser — they're consumed by other tooling (e.g., a downstream status reader).

## Parser contract

For each entry in the JSON's \`findings[]\` array, construct a virtual marker with:

| Virtual marker field | Source JSON field |
|---|---|
| \`severity\` | The entry's \`severity\` field (\`CRITICAL\` / \`WARNING\` / \`SUGGESTION\`) |
| \`title\` | The entry's \`title\` field |
| \`file:line\` | The entry's \`file\` + \`line\` fields joined as \`<file>:<line>\` |
| \`description\` | The entry's \`recommendation\` field |
| \`reproduction\` | The entry's \`reproduction\` field when present (review JSON; required on a CRITICAL written since rc02b, absent on prior-generation emits) — a CRITICAL marker without one is tagged \`unreproduced\` at triage and in its resolution entry's \`reproduction_rerun\` |
| \`source\` | \`internal-review\` for \`command: "review"\` JSON; \`audit-drift\` for \`command: "audit-drift"\` JSON (vs \`external\` for markdown, \`inline\` for grep-found) |
| \`provenance_detail\` | The entry's \`pass\` field (for review JSON) OR \`category\` field (for audit-drift JSON) — preserved verbatim in the resolution log |
| \`recommendation_options\` (optional) | The entry's \`recommendation_options[]\` array if present and well-formed. Drives the structured decision-fork detection path in Step 3b.5 of the SKILL.md walk. Malformed input (< 2 entries, missing label/body) triggers heuristic fallback with a stderr warning + \`structured_path_skipped_reason\` field in the resolution log. |

The review JSON's optional top-level \`blocks[]\` entries are listed FIRST in the triage table as blocks and never become virtual markers (the same rule as the markdown format's \`## Blocks\` section).

Virtual markers walk the same lifecycle as inline markers, with one exception: **the marker-removal step (Step 3e in the SKILL.md walk) is a no-op** — there's no source-file marker text to delete. (Same behavior as external-markdown virtual markers; the no-op is shared across all virtual-marker provenance.)

### Command field discriminator

The parser MUST check the top-level \`command\` field after JSON parse succeeds:

- \`command: "review"\` → proceed with \`findings[]\` extraction; tag virtual markers \`source: "internal-review"\`.
- \`command: "audit-drift"\` → proceed with \`findings[]\` extraction; tag virtual markers \`source: "audit-drift"\`; use the per-finding \`category\` field as the provenance-detail slot (rather than \`pass\`).
- Any other \`command\` value (e.g., \`"address-reviews"\`, \`"apply"\`, \`"archive"\`, \`"propose"\`, \`"explore"\`, \`"new"\`, \`"continue"\`, \`"ff"\`, \`"review-external"\`) → emit a clean error message naming the supported \`command\` values (\`"review"\`, \`"audit-drift"\`) and the observed value, then exit without acting on any findings.

V1 supports \`review-<mode>-*.json\` AND \`audit-drift-*.json\` (standalone audit-drift only — library/pre-archive contexts write no separate audit-drift JSON; their findings travel inside the caller's emit). Other internal JSONs are rejected explicitly rather than silently mis-parsed. **\`command: "address-reviews"\` is rejected on purpose**: address-reviews ingest of its own resolution log would loop (the lifecycle would feed itself recursively); cycle prevention requires explicit rejection.

### Fresh pushback applies to JSON virtual markers (both review and audit-drift)

The source JSON's own \`stale_suppressed[]\` array already filtered stale findings at source-run time. **Fresh pushback against current state IS still applied** when address-reviews ingests the JSON: state may have changed between the source run and the resolve (e.g., user fixed an issue ad-hoc; another commit landed). The SKILL.md walk step (3a — Apply pushback) executes for each JSON-virtual marker the same way it would for an inline marker or external-markdown virtual marker, regardless of whether the source was \`/orbit:review\` or \`/orbit:audit-drift\`.

This is intentional double-pushback: the JSON-side filter is a subset of staleness; the lifecycle-side check is a superset.

## Malformed input handling

If the file is JSON but malformed in any of these ways, the parser MUST refuse to act on partial input:

- **JSON parse failure** (file looks like JSON but invalid syntax) → emit a parse-error message naming the file + the JSON parse-error position (best-effort), then exit. User fixes the file and re-runs.
- **Missing \`command\` field** OR \`command\` value other than \`"review"\` / \`"audit-drift"\` → emit the unsupported-command error (see "Command field discriminator" above).
- **Missing \`findings[]\` field** OR \`findings\` present but not an array → emit a clean error naming the missing/malformed \`findings[]\` requirement; reference this file for the expected shape; exit.
- **Empty \`findings: []\`** → NOT an error. Succeed with zero virtual markers; the resolution log reports a clean empty walk (\`✓ Resolved: 0, ⚠ Stale: 0, ⏸ Deferred: 0, ✗ Escalated: 0\`) with a one-line note \`Source JSON had no findings to walk; resolution log is informational.\` A clean review OR clean audit-drift run with \`findings: []\` is the expected state for an all-clear pass — feeding it through \`--from-file\` is a valid no-op invocation.

## Tolerated variations

The parser SHOULD be lenient on:

- **Missing optional \`line\` field** on a finding → construct the virtual marker with \`file\` only (no line component); resolution log shows the file path without \`:line\`. Some findings are file-scoped rather than line-scoped (e.g., "this file needs a top-level section added").
- **Missing optional \`pass\` field** → virtual marker's \`pass\` provenance is reported as \`unknown\` in the resolution log; lifecycle proceeds normally.
- **Extra top-level JSON fields** (e.g., \`dogfood_note\`, \`convergence_state\`, \`flags\`, \`iteration_note\`) → ignored; not consumed by the parser. These exist for other tooling and don't affect virtual-marker construction.
- **Mixed-case \`severity\`** values (\`Critical\`, \`warning\`, etc.) → normalize to upper-case before comparison.

The parser MUST be strict on:

- **Top-level \`command\` field** — must be exactly \`"review"\` OR \`"audit-drift"\` (case-sensitive). Other values rejected per the unsupported-command path.
- **Per-finding \`severity\` field** — must be one of \`CRITICAL\`, \`WARNING\`, \`SUGGESTION\` after case normalization.
- **Per-finding \`title\` field** — must be a non-empty string.
- **Per-finding \`file\` field** — must be a non-empty string (the file path).
- **Per-finding \`recommendation\` field** — must be a non-empty string (becomes the virtual marker's description).

The reason for the strict/lenient split: the strict items are what the orbit run-summary schema guarantees by spec (per \`orbit-conventions\`'s \`Internal-run JSON summary format\` requirement + \`orbit-review\`'s per-command extensions); the lenient items are best-effort fields that downstream tools handle but the parser doesn't strictly require.

**On optional structured fields** — the strict/lenient split does NOT assert the absence of optional fields. \`recommendation_options[]\` is OPTIONAL on every finding; presence triggers the structured decision-fork detection path (Step 3b.5 of SKILL.md), absence triggers heuristic fallback. Malformed presence (< 2 entries, missing fields) triggers heuristic fallback with a stderr warning + \`structured_path_skipped_reason\` field in the resolution log. Parser MUST gracefully handle both presence and absence without erroring.

## Quick worked example of valid input

\`\`\`json
{
  "command": "review",
  "timestamp": "2026-05-26T20:01:08Z",
  "change": "harden-review-mode-recommendations",
  "mode": "system",
  "iteration": 2,
  "findings_summary": {
    "critical": 0,
    "warning": 0,
    "suggestion": 1
  },
  "findings": [
    {
      "pass": "2",
      "severity": "SUGGESTION",
      "file": "<skills-dir>/orbit-review/references/run-summary-schema.md",
      "line": 22,
      "title": "Schema reference does not document new convergence fields emitted by iteration-aware logic",
      "recommendation": "Out of scope for this change. Track as a follow-up: future change touching the run-summary contract should add convergence_state / convergence_state_label / convergence_inputs (plus skip_reasons and dogfood_note) to references/run-summary-schema.md."
    }
  ]
}
\`\`\`

This example has 0 CRITICAL, 0 WARNING, 1 SUGGESTION. Ingesting it via \`--from-file\` produces one virtual marker:

- \`severity\`: \`SUGGESTION\`
- \`title\`: \`Schema reference does not document new convergence fields emitted by iteration-aware logic\`
- \`file:line\`: \`<skills-dir>/orbit-review/references/run-summary-schema.md:22\`
- \`description\`: (the \`recommendation\` text)
- \`source\`: \`internal-review\`

The lifecycle walks this marker: pushback verifies the gap still applies → classify as \`decision required\` (out-of-scope/defer or include-in-current-change) → user makes the call → log entry written. Marker removal is no-op (no source file to delete from).
`;
const ADDRESS_REVIEWS_RESOLUTION_DETAIL_REFERENCE = `# Reference: resolution detail — discovery, batch triggers, fork detection, worked examples, degradation

Moved from the body verbatim (D5 body-economy pass). The body carries the compact protocol; this file carries the full rules, tables, examples, and error shapes.

## Scope resolution and discovery (Step 1 detail)

**Positional \`<scope>\` argument** — resolve in this order:

1. **Active change**: \`orbit/changes/<scope>/\` exists → treat \`<scope>\` as a change name; the marker grep is restricted to that directory, and trail discovery applies (the body's DISCOVERY rows 4 and 5).
2. **Archived change**: no active match, but \`orbit/changes/archive/\` contains one or more entries matching the regex \`^\\d{4}-\\d{2}-\\d{2}-<scope>$\` → treat as a change name resolving to the archive directory. If multiple archive entries match the same \`<scope>\` suffix (rare; same change name archived on different dates), the lexicographically-latest date wins (most-recent archive). Its markers and its unwalked audit-drift emits are discovered (row 6); \`orbit status\` cannot address an archived change, so its review passes are reached by \`--from-file\`, and the triage header says so.
3. **Path/pattern fallback**: no active or archive match → treat as a path/pattern scope; grep restricted to that path; no trail is read (row 7).

**Discovery is the DISCOVERY fence in the body's Step 1**, a checked mirror of \`orbit-address-reviews\`' \`Address-reviews command available\`; this file does not restate it. The outstanding passes come from the engine's \`unresolvedPasses\` and \`unwalkedPasses\` on each reviewed gate's status row, so the walk and the gate read one list. The single-newest-by-\`<TS>\` rule that this section used to carry is retired: it walked one pass when the gate held two, and it never reached an external return.

**Each discovered source is fed to the \`--from-file\` ingest path** (content-sniff routes JSON to the parser per \`references/internal-findings-format.md\` and \`# External Review:\` markdown per \`references/external-findings-format.md\`; identical lifecycle and virtual-marker construction to an explicit \`--from-file\` invocation). The only difference is the log's provenance fields (\`source: "auto-discovered"\` — see the schema reference).

**\`--mark\` is optional, not prerequisite**: historically, \`/orbit:review --as proposal --mark\` was the way to produce markers that address-reviews would later walk. Discovery makes \`--mark\` purely a stylistic choice (do you want findings annotated in source for diff-readability?). A marker that restates a discovered finding is walked AS that finding, in its pass's log, so nothing is walked twice. A pass whose findings are all SUGGESTION-grade holds nothing on the gate, but it is still discovered while no walk record references it, through the gate's \`unwalkedPasses\`: severity ranks a finding and does not decide whether one is read.

## Batch-mode trigger table (Step 3)

| Trigger | Detection | \`walk_mode_source\` |
|---|---|---|
| **\`--batch\` flag** | Present in the invocation argv. Canonical signal. | \`"flag"\` |
| **Verbal \`--batch\` in invocation message** | The user's invocation message (the message that triggered the command) contains one of these batch-intent phrases: \`"fix them all"\`, \`"batch them"\`, \`"go ahead with all"\`, \`"address all at once"\`, or another clearly equivalent phrase conveying batch-resolution intent. The phrase MUST be in the invocation message — phrases inside subsequent walk-step responses do NOT shift mode (see next row). | \`"verbal"\` |
| **Mid-walk command-shape interruption** | During an active walk, the user sends a bare, unambiguous mode-switch message: \`"go batch"\`, \`"switch to batch"\`, \`"batch the rest"\`. The message must be command-shaped (typically 2-4 words, no conversational filler) — ambiguous phrases like \`"yeah let's just keep going"\` or \`"fine, fix them all"\` mid-walk do NOT shift mode. Record the 1-indexed finding number at which the shift occurred in the resolution log's \`walk_mode_shifted_at_finding\` field. | \`"command-shape-interruption"\` |

## Fork detection machinery, recording shape, and trace (Step 3b.5)

**Hybrid detection** (supplies the BRIEFING's option set; structured first, heuristic fallback):

1. **Structured path** — if the finding came from a JSON-virtual marker (internal-review or audit-drift JSON via \`--from-file\` or discovery) AND the source JSON's finding entry includes a \`recommendation_options: [{label, body}]\` array with ≥ 2 entries AND every entry has non-empty \`label\` AND non-empty \`body\`: use that array DIRECTLY as the briefing's options. Skip heuristic. Record \`recommendation_fork.source: "structured"\` in the resolution log.

2. **Heuristic fallback** — if structured path was unavailable (missing field, malformed entry — see malformed-handling below) OR the marker is markdown-sourced (external markdown, inline markers): scan the finding's recommendation text for STRICT disjunctive signals. Triggers (all are non-fuzzy):
   - **Numbered alternatives**: \`(A) … (B)\`, \`1. … 2.\`, \`[A] … [B]\`
   - **"Either … or …"** with clause-level branches (each clause is a recognizable recommendation)
   - **"Options:" prefix** (accepting both bold variants: \`**Options**:\` colon-outside-bold, \`**Options:**\` colon-inside-bold; normalize markdown emphasis before pattern-matching) followed by a list or numbered enumeration

   **NOT triggers** — do NOT fire on loose "or" in prose: \`"fix it now or later"\`, \`"X or Y could happen"\`, \`"the issue is A or B and we should address one of them"\`. False-negative bias intentional.

   On heuristic match, parse the recommendation text into options (each option becomes \`{label, body}\`; labels typically \`"A"\`, \`"B"\`, …). Record \`recommendation_fork.source: "heuristic"\` in the resolution log.

3. **No detection** — neither structured nor heuristic triggered: the finding STILL gets its full-prose briefing, with 2–4 concrete options the AI derives from context surfaced IN PROSE; resolution proceeds per the same protocol. No \`recommendation_fork\` object is recorded (absence IS the no-fork representation).

**Malformed structured input** (zero entries, single entry, missing \`label\` or empty \`label\`, missing \`body\` or empty \`body\`): emit a stderr warning naming the finding + reason (\`"only 1 entry in array"\`, \`"missing label on entry index 2"\`, \`"empty body on entry index 0"\`); FALL BACK to heuristic detection over the prose \`recommendation\`. Record \`recommendation_fork.source: "heuristic"\` AND \`recommendation_fork.structured_path_skipped_reason: "<reason>"\` in the resolution log. Malformed input never aborts the walk.

**Ratification recording** — EVERY decision-lane resolution records, at the ENTRY level (forked or not): \`ratified_via: "chat" | "prompt"\` and — when no fork was detected, or the ratified direction is off-menu — a verbatim \`resolution\` string. The \`recommendation_fork\` object (present only when detection fired) carries the DETECTION data:

\`\`\`json
"ratified_via": "chat",
"resolution": "<the ratified direction verbatim — required for non-fork and off-menu cases>",
"recommendation_fork": {
  "detected": true,
  "source": "structured" | "heuristic",
  "options_presented": [{ "label": "A", "body": "..." }, { "label": "B", "body": "..." }],
  "chosen": "A" | "off-menu",
  "structured_path_skipped_reason": "<optional; only when structured was attempted then skipped>"
}
\`\`\`

(The \`[discuss]\` escape-hatch option is RETIRED — discussion is the medium, not an escape; \`discuss_invoked\` is no longer emitted. Pre-D4 logs carry it; readers tolerate both generations.)

**Decision-lane behavior in batch-mode**: decision-lane findings STILL receive their per-finding briefing and ratification in batch-mode — batch never merges decisions into one prompt; it only suppresses per-finding pacing for obvious-fix and stale findings.

**Mini decision-lane trace**:

\`\`\`
Walking finding W1 (WARNING, decision lane):
  Title: Test suite covers ~30 of ~45 spec scenarios
  Recommendation: "Either (A) file a follow-up issue tracking the v2 polish, or
                  (B) add Group 19 to tasks.md extending this change's scope."

Detection fired via heuristic → the BRIEFING presents both paths in prose:
  what the coverage gap means, what each option costs, which the reviewer leaned toward.

User types: "file the issue — A". That chat directive IS the ratification.
Resolution-log entry records:
  ratified_via: "chat",
  recommendation_fork: {
    detected: true, source: "heuristic",
    options_presented: [{label: "A", body: "..."}, {label: "B", body: "..."}],
    chosen: "A"
  }

(Had the discussion trailed off without a directive, an AskUserQuestion would fire
carrying the discussed conclusion as its default — and a dismissed prompt would
simply re-present the finding, losing nothing.)
\`\`\`

## Worked example (\`--from-file\` markdown ingest, iter 5 of add-review-workflows)

\`\`\`
## Address-reviews report

Source: --from-file orbit/changes/add-review-workflows/.orbit-runs/external-proposal-2026-05-18T14-35-23Z.md
External reviewer: Claude Opus 4.7 (fresh-context in-session subagent — iter 5)
Input findings: 0 CRITICAL / 4 WARNING / 5 SUGGESTION
Markers walked: 9 (all)
Walk mode: per_finding (default)
Pushback verification: all 9 verified against current state; 0 stale suppressions.
Cascade summary: 14 IN files cascaded across 9 resolutions; 3 OUT files flagged_not_applied (2 baseline specs, 1 cross-change archive ref).

### Summary

| Status        | Count |
|---------------|-------|
| ✓ Resolved    | 9     |
| ⚠ Stale       | 0     |
| ⏸ Deferred    | 0     |
| ✗ Escalated   | 0     |

### ✓ Resolved
- **proposal.md:41** — [WARNING] "five new SKILL.md + command body pairs" should be four.
  Action: trivial fix — changed "five" to "four" + added explicit list.
  Ripple: design.md, README.md flagged.

- **design.md:159** — [WARNING] "9 capability specs" should be 8 after merge.
  Action: trivial fix — changed 9 to 8 with parenthetical merge context.

- **sketches/review.md:3** — [WARNING] corrupted filenames (sed residue from rename).
  Action: trivial fix — restored proper filenames.

- (6 more, all trivial fix or applied decision)

### Final assessment

0 unresolved external findings.
Suggested next: re-run /orbit:review --as proposal to confirm convergence.

Run summary: orbit/changes/add-review-workflows/.orbit-runs/address-reviews-2026-05-18T14-43-41Z.json
\`\`\`

## Worked example (\`--from-file\` JSON ingest, single SUGGESTION from a system-mode review)

\`\`\`
## Address-reviews report

Source: --from-file orbit/changes/harden-export-validation/.orbit-runs/review-system-2026-05-26T20-01-08Z.json
Source format: internal review JSON (command: "review", mode: system, iteration: 2)
Input findings: 0 CRITICAL / 0 WARNING / 1 SUGGESTION
Markers walked: 1 (all)
Pushback verification: 1 verified against current state; 0 stale suppressions.

### Summary

| Status        | Count |
|---------------|-------|
| ✓ Resolved    | 1     |
| ⚠ Stale       | 0     |
| ⏸ Deferred    | 0     |
| ✗ Escalated   | 0     |

### ✓ Resolved
- **<skills-dir>/orbit-review/references/run-summary-schema.md:22** — [SUGGESTION] Schema reference does not document new convergence fields emitted by iteration-aware logic.
  Source: internal-review
  Action: classified as \`decision required\` (out-of-scope deferral vs include-in-current-change). User chose to defer to a future change; filed as task in \`tasks.md\` referencing the schema-doc gap; original JSON unchanged (marker-removal no-op for virtual markers).
  Ripple: orbit-review/SKILL.md flagged (consumer of the schema doc).

### Final assessment

0 unresolved findings.
Suggested next: continue with current change's archive flow; the schema-doc gap is filed as a follow-up task and will be addressed in a future change.

Run summary: orbit/changes/harden-export-validation/.orbit-runs/address-reviews-2026-05-26T20-XX-XXZ.json
\`\`\`

This example demonstrates the JSON path: the input is an internal \`review-system-*.json\` produced by \`/orbit:review --as system\`; auto-detect routes to the JSON parser (leading \`{\`); the single \`findings[]\` entry becomes a virtual marker; the lifecycle walks it (pushback verifies the schema gap still exists → classify as \`decision required\` → user defers → file as task → marker-removal no-op since virtual). Identical lifecycle to the markdown example above, different parser routing.

## Graceful degradation

- **Nothing discovered, by any row** (a whole-repo or path scan finding no marker; or a change with no markers, every reviewed gate reporting \`unresolvedPasses: []\` and \`unwalkedPasses: []\`, every audit-drift emit already named by a log) → emit \`No @review: markers and no outstanding passes in scope. Nothing to walk.\`, list each audit-drift emit a log already names as \`walked before; reach by --from-file <path>\`, and exit clean (the DISCOVERY fence's AFTER line).
- **A half-landed pair** (a reviewed gate reports \`openPair\`) → NOT a degradation case: before triage the walk warns, naming the missing member and the gate's canonical next command. When the landed half is listed, it offers to stop (walk nothing, write no log, so the missing review can run) or to walk now, which ends the pair; when the landed half carries no finding, nothing can be walked to end it, so the walk names the routes that can and stops (row 4). The landed half is the pass of the class \`openPair\` does not name: an external return is listed with \`source: "external"\`, a fresh pass is an \`internal-review\` entry whose record's \`reviewer_class\` is \`fresh\`.
- **\`--from-file\` path missing** → fail clearly with usage; don't fall back to repo scan.
- **\`--from-file\` neither-format-detected** → emit a clean format-mismatch error naming both supported formats (referencing \`references/external-findings-format.md\` and \`references/internal-findings-format.md\`) plus the observed leading-content snippet; refuse to act on partial parse. Concrete error shape:

  \`\`\`
  \`--from-file <path>\`: unrecognized format.

  Supported formats:
  - External-review markdown — see references/external-findings-format.md
  - Internal review JSON (review-<mode>-*.json) — see references/internal-findings-format.md

  Detected: <observed first-line snippet>
  \`\`\`
- **\`--from-file\` JSON parse failure** (leading \`{\` but invalid JSON) → emit a clean parse-error message naming the file and the JSON parse-error position (best-effort); exit without acting. User fixes the file and re-runs.
- **\`--from-file\` unsupported JSON \`command\` field** (valid JSON but \`command\` is neither \`"review"\` nor \`"audit-drift"\`) → emit a clean error naming the supported values (\`"review"\`, \`"audit-drift"\`) and the unsupported value detected; reference both format docs for self-diagnosis; exit without acting. V1 supports \`review-<mode>-*.json\` and \`audit-drift-*.json\` only. \`command: "address-reviews"\` is rejected on purpose (cycle prevention).
- **\`--from-file\` markdown malformed** (leading \`# External Review:\` but missing required sections / broken field labels) → emit a markdown-parse-error message with format guidance from \`references/external-findings-format.md\`; exit without acting.
- **\`--from-file\` JSON missing \`findings[]\`** → treat as malformed input; emit a clean error naming the missing/malformed field; reference \`internal-findings-format.md\`; exit.
- **\`--from-file\` JSON with empty \`findings: []\`** → NOT an error. Succeed with zero virtual markers; resolution log reports a clean empty walk with note \`Source JSON had no findings to walk; resolution log is informational.\` A clean review with \`findings: []\` is the expected state for an all-clear pass.
- **No \`tasks.md\` in change context** → unresolvable-default-file-as-task falls back to creating a root-level \`TODO.md\` entry with a note.
- **Marker found in a baseline spec** (\`orbit/specs/<capability>/\`) → warn that this is unusual; baseline specs should not carry markers; still walk it per user choice but flag in the log.
`;
const ADDRESS_REVIEWS_RUN_SUMMARY_SCHEMA_REFERENCE = `# Reference: address-reviews run-summary schema

Each \`/orbit:address-reviews\` invocation persists a JSON summary. Path varies:

- **Change-scoped** (when scope is a single change directory or \`--from-file\` points into a change's \`.orbit-runs/\`): \`orbit/changes/<change-name>/.orbit-runs/address-reviews-<TS>.json\`
- **Archived-change** (the positional resolved an archived change — the engine's \`--change\` fallback): \`orbit/changes/archive/<YYYY-MM-DD>-<name>/.orbit-runs/address-reviews-<TS>.json\`
- **Architecture-scoped** (\`--from-file\` into \`orbit/architecture/.orbit-runs/\`): \`orbit/architecture/.orbit-runs/address-reviews-<TS>.json\` (\`change: null\`; \`doc\` carried from the source emit)
- **Whole-repo / cross-change** (bare \`orbit emit address-reviews\`): \`orbit/.orbit-runs/address-reviews-<TS>.json\`

Every location is written by the emit surface — no scope hand-writes its log.

## Universal spine inheritance

The spine every emit carries is owned by \`orbit-conventions\`' \`Internal-run JSON summary format\` requirement, and is not restated here; the write gate refuses every field the engine composes (\`next_recommended\` and the \`iteration\` ordinal among them). For address-reviews, \`final_assessment\` is the payload's own narrative of the resolution outcome, and \`change\` is \`null\` for whole-repo / cross-change and architecture scope, where an architecture-scoped log carries a \`doc\` field instead.

The schema below documents per-command extensions ADDED to that spine (\`source\`, \`source_path\`, \`source_command\`, \`source_token\`, \`latest_apply_token\`, \`external_reviewer\`, \`walk_mode\`, \`walk_mode_source\`, \`walk_mode_shifted_at_finding\`, \`input_findings_summary\`, \`pushback_verification\`, \`resolution_summary\`, \`delegation_directive\`, \`resolutions\` with entry-level \`ratified_via\`/\`resolution\` plus \`recommendation_fork\`, \`ripple_cascade\`, \`sweep\` and \`ripple_miss_of\` sub-objects and the per-entry \`remedy\`, \`routed_to\` and \`disagreement\`, \`remaining_markers_in_scope\`, \`persisted_escalations\`) and the engine-computed \`ripple_misses\`. Per-command extensions are address-reviews-specific state.

## Schema (v2)

\`\`\`json
{
  "command": "address-reviews",
  "timestamp": "<ISO-8601>",
  "change": "<change-name string for change-scoped; null for whole-repo / cross-change AND architecture scope>",
  "doc": "<architecture scope only: the doc carried from the source review-architecture emit; absent otherwise>",
  "final_assessment": "<short narrative of the resolution outcome>",
  "next_recommended": "<suggested next command, e.g., 're-run /orbit:review --as proposal to confirm convergence'>",
  "kind": "editorial",
  "source": "whole-repo" | "scope" | "from-file" | "auto-discovered",
  "source_path": "<scope path, --from-file path, or the ONE discovered file this log walks; null for whole-repo>",
  "source_command": "<for auto-discovered source: the discovered file's top-level command — 'review' or 'audit-drift' — or null for an external return, which carries none; null otherwise>",
  "source_token": "<for auto-discovered source: the discovered file's filename <TS> token; null otherwise>",
  "latest_apply_token": "<for auto-discovered source: most-recent apply-*.json filename token in the same .orbit-runs/, or null if no apply JSON exists; null for other sources>",
  "external_reviewer": "<from --from-file's Reviewer field, if applicable, else null>",
  "walk_mode": "per_finding" | "batch",
  "walk_mode_source": "flag" | "verbal" | "command-shape-interruption",
  "walk_mode_shifted_at_finding": "<1-indexed finding number when mode shifted mid-walk; present only when walk_mode_source == 'command-shape-interruption'>",
  "input_findings_summary": {
    "critical": 0,
    "warning": 0,
    "suggestion": 0
  },
  "pushback_verification": "<short note: how many findings verified against current state; how many stale>",
  "resolution_summary": {
    "resolved": 0,
    "stale_suppressed": 0,
    "deferred": 0,
    "escalated": 0
  },
  "resolutions": [
    {
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "title": "<finding title>",
      "marker_source": "inline" | "external" | "internal-review" | "audit-drift",
      "file": "<path>",
      "line": 41,
      "classification": "trivial_fix" | "decision_required" | "stale" | "unresolvable",
      "action": "<what was done — applied edit, filed as task, converted to @todo:, escalated, etc.>",
      "reproduction_rerun": "reproduced" | "not-reproduced" | "cannot-run" | "unreproduced",
      "ratified_via": "chat" | "prompt",
      "resolution": "<the ratified direction verbatim — required when no fork was detected or the direction is off-menu>",
      "recommendation_fork": {
        "detected": true,
        "source": "structured" | "heuristic",
        "options_presented": [{ "label": "A", "body": "..." }, { "label": "B", "body": "..." }],
        "chosen": "A" | "off-menu",
        "structured_path_skipped_reason": "<optional; e.g., 'only 1 entry in array', 'missing label on entry index 2'>"
      },
      "ripple_cascade": {
        "applied": ["<paths edited as part of the cascade>"],
        "flagged_not_applied": [{ "path": "...", "reason": "<OUT-category reason OR \`--no-cascade suppressed\`>" }]
      },
      "sweep": {
        "retired": ["<wording the fix made false>"],
        "introduced": [{ "path": "<path>", "text": "<text the fix added>" }],
        "searched": ["<what was searched for>"],
        "scope": ["<paths examined beyond file and ripple_cascade.applied>"],
        "kept": [{ "path": "<path>", "why": "<why it keeps a retired string>" }]
      },
      "ripple_miss_of": { "walk": "<earlier walk's filename token>", "title": "<that entry's title>", "file": "<that entry's file>", "kind": "scope" | "query" | "judgement" },
      "remedy": "repair" | "descope" | "redesign",
      "routed_to": "<a REDESIGN's route: orbit/explore/<new-name>/, or orbit/changes/<name>/explore.md on an active change>",
      "disagreement": { "with": { "pass": "<the other pass's filename token>", "title": "<its finding's title>", "file": "<its finding's file>" }, "test": "<the test as run>", "observed": "<its output or derivation>" },
      "outcome": "resolved" | "stale" | "deferred" | "escalated"
    }
  ],
  "ripple_misses": "<engine-computed: the count of resolutions carrying ripple_miss_of; refused in the payload>",
  "delegation_directive": "<optional: the user's verbatim mid-walk delegation, when one was issued>",
  "remaining_markers_in_scope": 0,
  "persisted_escalations": [
    { "file": "...", "line": 0, "title": "...", "reason": "..." }
  ]
}
\`\`\`

## Example payloads

Five payload files the walk writes, ONE PER PROVENANCE, because the fields that record where the findings came from cannot appear together: a discovered internal review pass on an active change, walked in a mode that switched to batch mid-walk; a discovered external return on an active change (a converged finding, a disagreement, an essential redesign — an active change only, because that route returns the change to exploration); a discovered audit-drift emit (an active change, or an archived one through the archived fallback); a bare whole-repo marker walk; and a \`--from-file\` walk of an architecture review. The five are independent: each illustrates its own provenance, and no two are written as halves of one walk. Each is real JSON carrying no engine-owned key, and each is tagged with the scopes its own values describe — a bare whole-repo walk must carry \`remaining_markers_in_scope\`, which drives its recommendation. A test submits each block, unchanged, through the write gate in every scope its tag names, and checks that together they carry every key the schema documents (\`orbit-emit-composition\`'s \`Payload schema references are proven by execution\`). The worked-example snippets further down are ILLUSTRATIONS of single fields, not payloads: they omit \`command\` so the test never reads them as schema blocks.

\`\`\`json example change
{
  "final_assessment": "Two of two resolved: the CRITICAL by a reordered step, the WARNING by the ratified direction B.",
  "source": "auto-discovered",
  "source_path": "orbit/changes/add-detail-flag/.orbit-runs/review-proposal-2026-10-02T09-00-00Z.json",
  "source_command": "review",
  "source_token": "2026-10-02T09-00-00Z",
  "latest_apply_token": null,
  "external_reviewer": null,
  "walk_mode": "batch",
  "walk_mode_source": "command-shape-interruption",
  "walk_mode_shifted_at_finding": 2,
  "input_findings_summary": { "critical": 1, "warning": 1, "suggestion": 0 },
  "pushback_verification": "Both findings verified against current state; none stale.",
  "resolution_summary": { "resolved": 2, "stale_suppressed": 0, "deferred": 0, "escalated": 0 },
  "resolutions": [
    {
      "severity": "CRITICAL",
      "title": "Archive step deletes the staging directory before the copy is verified",
      "marker_source": "internal-review",
      "file": "design.md",
      "line": 40,
      "classification": "trivial_fix",
      "action": "reordered design.md step 3 after step 4's copy check",
      "reproduction_rerun": "reproduced",
      "evidence": "re-read design.md steps 3-4: the delete preceded the check",
      "ripple_cascade": { "applied": ["orbit/changes/add-detail-flag/tasks.md"], "flagged_not_applied": [] },
      "sweep": { "retired": ["delete the staging directory, then verify the copy"], "introduced": [], "searched": ["staging directory", "verify the copy"], "scope": [], "kept": [] },
      "remedy": "repair",
      "outcome": "resolved"
    },
    {
      "severity": "WARNING",
      "title": "No task updates the generated surface after the template edit",
      "marker_source": "internal-review",
      "file": "tasks.md",
      "line": 12,
      "classification": "decision_required",
      "action": "applied the ratified direction B — folded the update into task 2.3",
      "ratified_via": "chat",
      "recommendation_fork": {
        "detected": true,
        "source": "structured",
        "options_presented": [{ "label": "A", "body": "Add the task to group 5." }, { "label": "B", "body": "Fold it into task 2.3." }],
        "chosen": "B"
      },
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": [], "introduced": [], "searched": ["generated surface", "update --force"], "scope": [], "kept": [] },
      "remedy": "repair",
      "outcome": "resolved"
    }
  ],
  "delegation_directive": "batch the rest",
  "remaining_markers_in_scope": 0,
  "persisted_escalations": [],
  "model": "claude-opus-5-5"
}
\`\`\`

\`\`\`json example change
{
  "final_assessment": "One stale as converged with the fresh half's log, one repaired after a disagreement test, one escalated as an essential redesign; this pass stays outstanding.",
  "source": "auto-discovered",
  "source_path": "orbit/changes/add-detail-flag/.orbit-runs/external-system-2026-10-02T10-00-00Z.md",
  "source_command": null,
  "source_token": "2026-10-02T10-00-00Z",
  "latest_apply_token": "2026-10-02T08-00-00Z",
  "external_reviewer": "GPT-6 Codex",
  "walk_mode": "per_finding",
  "input_findings_summary": { "critical": 1, "warning": 2, "suggestion": 0 },
  "pushback_verification": "All three verified; one converged with the fresh half, one settled by a test.",
  "resolution_summary": { "resolved": 1, "stale_suppressed": 1, "deferred": 0, "escalated": 1 },
  "resolutions": [
    {
      "severity": "WARNING",
      "title": "The detail flag is not documented in the command help",
      "marker_source": "external",
      "file": "src/cli/detail.ts",
      "line": 12,
      "classification": "stale",
      "action": "converged with the fresh half's finding, walked in its log",
      "evidence": "resolved in address-reviews-2026-10-02T11-00-00Z (the earlier pass's log)",
      "outcome": "stale"
    },
    {
      "severity": "WARNING",
      "title": "The parser accepts an empty detail value",
      "marker_source": "external",
      "file": "src/cli/detail.ts",
      "line": 30,
      "classification": "trivial_fix",
      "action": "refused the empty value",
      "disagreement": {
        "with": { "pass": "2026-10-02T09-30-00Z", "title": "The parser refuses an empty detail value", "file": "src/cli/detail.ts" },
        "test": "node bin/cli.js --detail ''",
        "observed": "exit 0 with an empty detail, so the external claim holds and the fresh claim is stale"
      },
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": [], "introduced": [], "searched": ["--detail", "empty value"], "scope": [], "kept": [] },
      "remedy": "repair",
      "outcome": "resolved"
    },
    {
      "severity": "CRITICAL",
      "title": "The cache the flag reads has no invalidation rule",
      "marker_source": "external",
      "file": "design.md",
      "line": 55,
      "classification": "unresolvable",
      "action": "escalated: invalidation is mechanism nobody has reviewed, and the change cannot ship without it",
      "reproduction_rerun": "unreproduced",
      "remedy": "redesign",
      "routed_to": "orbit/changes/add-detail-flag/explore.md",
      "outcome": "escalated"
    }
  ],
  "remaining_markers_in_scope": 0,
  "persisted_escalations": [],
  "model": "claude-opus-5-5"
}
\`\`\`

\`\`\`json example change archived
{
  "final_assessment": "Three drifts resolved: one stale vocabulary line repaired, one requirement the change should not carry descoped, one mechanism routed to a new exploration.",
  "source": "auto-discovered",
  "source_path": "orbit/changes/add-detail-flag/.orbit-runs/audit-drift-2026-10-02T12-00-00Z.json",
  "source_command": "audit-drift",
  "source_token": "2026-10-02T12-00-00Z",
  "latest_apply_token": null,
  "external_reviewer": null,
  "walk_mode": "per_finding",
  "input_findings_summary": { "critical": 0, "warning": 3, "suggestion": 0 },
  "pushback_verification": "All three drifts verified against current state; none stale.",
  "resolution_summary": { "resolved": 3, "stale_suppressed": 0, "deferred": 0, "escalated": 0 },
  "resolutions": [
    {
      "severity": "WARNING",
      "title": "README still names the retired summary flag",
      "marker_source": "audit-drift",
      "file": "README.md",
      "line": 8,
      "classification": "trivial_fix",
      "action": "renamed the flag",
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": ["--summary-only"], "introduced": [], "searched": ["summary-only"], "scope": [], "kept": [] },
      "remedy": "repair",
      "outcome": "resolved"
    },
    {
      "severity": "WARNING",
      "title": "The change specifies a color theme no stage asked for",
      "marker_source": "audit-drift",
      "file": "proposal.md",
      "line": 20,
      "classification": "decision_required",
      "action": "removed the color-theme requirement, as ratified",
      "ratified_via": "chat",
      "resolution": "drop the theme; it is not this change's",
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": ["detail output uses the color theme"], "introduced": [], "searched": ["color theme"], "scope": [], "kept": [] },
      "remedy": "descope",
      "outcome": "resolved"
    },
    {
      "severity": "WARNING",
      "title": "The flag's cache warm-up is specified without a review",
      "marker_source": "audit-drift",
      "file": "design.md",
      "line": 70,
      "classification": "decision_required",
      "action": "removed the warm-up from the change and routed it to a new exploration, as ratified",
      "ratified_via": "chat",
      "resolution": "the flag works without warm-up; explore it on its own",
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": ["warm the cache before the first detail read"], "introduced": [], "searched": ["warm-up", "warm the cache"], "scope": [], "kept": [] },
      "remedy": "redesign",
      "routed_to": "orbit/explore/detail-cache-warmup/",
      "outcome": "resolved"
    }
  ],
  "remaining_markers_in_scope": 0,
  "persisted_escalations": [],
  "model": "claude-opus-5-5"
}
\`\`\`

\`\`\`json example project
{
  "final_assessment": "One inline marker resolved; none remain in the repo.",
  "source": "whole-repo",
  "source_path": null,
  "source_command": null,
  "source_token": null,
  "latest_apply_token": null,
  "external_reviewer": null,
  "walk_mode": "per_finding",
  "input_findings_summary": { "critical": 0, "warning": 0, "suggestion": 1 },
  "pushback_verification": "The one marker verified against current state; not stale.",
  "resolution_summary": { "resolved": 1, "stale_suppressed": 0, "deferred": 0, "escalated": 0 },
  "resolutions": [
    {
      "severity": "SUGGESTION",
      "title": "should this be five or four?",
      "marker_source": "inline",
      "file": "README.md",
      "line": 41,
      "classification": "trivial_fix",
      "action": "five → four, with the explicit list added",
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": ["the five supported formats"], "introduced": [], "searched": ["five", "formats"], "scope": [], "kept": [] },
      "remedy": "repair",
      "outcome": "resolved"
    }
  ],
  "remaining_markers_in_scope": 0,
  "persisted_escalations": [],
  "model": "claude-opus-5-5"
}
\`\`\`

\`\`\`json example doc
{
  "final_assessment": "One of one resolved: the dependency cycle broken by dropping s5's edge.",
  "source": "from-file",
  "source_path": "orbit/architecture/.orbit-runs/review-architecture-2026-10-02T11-00-00Z.json",
  "source_command": null,
  "source_token": null,
  "latest_apply_token": null,
  "external_reviewer": null,
  "walk_mode": "per_finding",
  "input_findings_summary": { "critical": 0, "warning": 1, "suggestion": 0 },
  "pushback_verification": "The finding verified against the doc's current Depends-on slots.",
  "resolution_summary": { "resolved": 1, "stale_suppressed": 0, "deferred": 0, "escalated": 0 },
  "resolutions": [
    {
      "severity": "WARNING",
      "title": "Stage s4 depends on s5, which depends on s4",
      "marker_source": "internal-review",
      "file": "program.md",
      "line": 88,
      "classification": "decision_required",
      "action": "dropped s5's Depends-on edge, as ratified",
      "ratified_via": "chat",
      "resolution": "s5 does not need s4; drop its edge",
      "ripple_cascade": { "applied": [], "flagged_not_applied": [] },
      "sweep": { "retired": [], "introduced": [], "searched": ["Depends-on", "s4"], "scope": [], "kept": [] },
      "remedy": "repair",
      "outcome": "resolved"
    }
  ],
  "remaining_markers_in_scope": 0,
  "persisted_escalations": [],
  "model": "claude-opus-5-5"
}
\`\`\`

## v1 → v2 format migration (reader guidance)

The v2 shape is a **structural change** from v1, not a rename. Readers handling archived JSONs from both eras MUST detect which version they're reading:

- **v2 detection**: presence of \`walk_mode\` (top-level) OR \`ripple_cascade\` (per-resolution) indicates v2. v2 emits these fields on every walk.
- **v1 detection**: presence of \`ripple_flagged_files_aggregate\` (top-level flat array of strings) indicates v1. v1 did NOT emit \`walk_mode\` or per-resolution \`ripple_cascade\`.

**Why NOT a rename**: v1 aggregated ripple-flagged paths in a single top-level array across ALL resolutions, with no per-resolution attribution. v2 splits per-resolution into \`ripple_cascade.applied[]\` + \`ripple_cascade.flagged_not_applied[]\`. The shapes are NOT bijective — v1 archived JSONs cannot be losslessly upconverted to v2 (per-resolution attribution is lost in v1). Treat v1's aggregate as the union of all per-resolution ripple sets across the run; attribution to specific findings is unavailable.

**v2 fields not present in v1**: \`walk_mode\`, \`walk_mode_source\`, \`walk_mode_shifted_at_finding\`, per-resolution \`recommendation_fork\`, per-resolution \`ripple_cascade\`. Downstream consumers (e.g., a downstream status reader's tier-1 best-effort parse) handle absence as v1 and proceed gracefully.

## Field notes

- **\`source\`** distinguishes invocation paths: \`whole-repo\` for default scan, \`scope\` for positional \`<scope>\` argument (and the markers' log of a discovering walk), \`from-file\` for \`--from-file <path>\`, \`auto-discovered\` for a source the walk's discovery found (an outstanding pass or an unwalked audit-drift emit). Discovery's rule: \`orbit-address-reviews\`' \`Address-reviews command available\`.
- **\`source_path\`** carries the scope, the \`--from-file\` path, OR the ONE discovered file this log walks; \`null\` for \`whole-repo\`. A walk that discovered several sources writes one log per source, each naming its own (\`orbit-address-reviews\`' \`One invocation writes one log per discovered source\`).
- **\`source_command\`**, **\`source_token\`**, **\`latest_apply_token\`** — the discovery audit-trail fields. Emitted ONLY when \`source: "auto-discovered"\`; \`null\` for other sources. \`source_command\` = the discovered file's top-level \`command\` value (\`"review"\` or \`"audit-drift"\`), or \`null\` for an external return, which carries none; \`source_token\` = its filename \`<TS>\` token; \`latest_apply_token\` = the most-recent \`apply-*.json\` filename token in the same \`.orbit-runs/\` (orbit doesn't refuse to walk a pass older than the latest apply, but the log records both timestamps so downstream auditors can assess staleness). The retired recency rule's tie-break field is no longer written; the payload table still accepts it, and logs written before rc08b carry it.
- **\`external_reviewer\`** parsed from the \`**Reviewer**:\` field in the \`--from-file\` input; lets downstream tools track which AI's findings have been ingested. Only populated when \`marker_source\` is \`external\` (external-review markdown input); set to \`null\` for inline / internal-review / audit-drift sources (those have no human-readable reviewer-name field).
- **\`input_findings_summary\`** counts findings by severity at the input boundary (before pushback suppression). Total findings always = sum of \`resolved\` + \`stale_suppressed\` + \`deferred\` + \`escalated\` in \`resolution_summary\`.
- **\`pushback_verification\`** is a short prose note (1-2 sentences) summarizing pushback work — "all 9 findings verified against current state; 0 stale suppressions" or "9 findings; 3 stale-suppressed with commit evidence."
- **\`marker_source\`** distinguishes virtual-marker provenance: \`inline\` (grep-found \`@review:\` markers), \`external\` (external-review markdown parsed from \`--from-file\`), \`internal-review\` (internal \`review-<mode>-*.json\` JSON parsed from \`--from-file\`), \`audit-drift\` (\`audit-drift-*.json\` JSON parsed from \`--from-file\`).
- **\`classification\`** is the pushback-and-classify outcome before action.
- **\`outcome\`** is the final disposition; aligns with the ✓ Resolved / ⚠ Stale / ⏸ Deferred / ✗ Escalated counts in the resolution log.
- **\`persisted_escalations\`** captures \`@review(escalated):\` markers deliberately left in place; mirrors the resolution log's escalated section so downstream queries don't re-parse the log.
- **\`next_recommended\`** is the closing suggestion shown in the final-assessment line.
- **\`walk_mode\`** records the lifecycle mode the run used (per #11): \`per_finding\` (default — each marker walked sequentially with its own pushback → classify → fix → cascade → remove cycle) or \`batch\` (all markers complete pushback + classify + fix in one pass, then cascade as a single aggregated step).
- **\`walk_mode_source\`** distinguishes how batch-mode was entered: \`flag\` (\`--batch\` argv), \`verbal\` (recognized batch-intent phrase in the invocation message — "fix them all", "batch them", "go ahead with all", or equivalent), \`command-shape-interruption\` (bare unambiguous mid-walk mode-switch message — "go batch", "switch to batch", "batch the rest"). Omitted when \`walk_mode == "per_finding"\`.
- **\`walk_mode_shifted_at_finding\`** is the 1-indexed finding number at which the mode shifted; present ONLY when \`walk_mode_source == "command-shape-interruption"\`; omitted otherwise.
- **\`reproduction_rerun\`** (per-resolution, REQUIRED on every CRITICAL entry, absent below CRITICAL — rc02b): the Step 3a step-(0) result, one of the CLOSED values \`reproduced\` / \`not-reproduced\` / \`cannot-run\` (the marker carried a reproduction and it was re-run) or \`unreproduced\` (the marker carried none); the output or derivation rides \`evidence\`. A reader that does not know the field ignores it (the \`recommendation_options\` precedent). Owned by \`orbit-address-reviews\`' resolution-log shape requirement.
- **\`ratified_via\`** (per-resolution, REQUIRED for every decision-lane resolution — forked or not): \`"chat"\` (a user-typed directive ratified the resolution) or \`"prompt"\` (the optional closure \`AskUserQuestion\` did). Absent on non-decision-lane resolutions.
- **\`resolution\`** (per-resolution, conditionally required): the ratified direction verbatim — required when no fork was detected (AI-derived prose options) OR when the direction is off-menu; optional when \`recommendation_fork.chosen\` names a presented option.
- **\`delegation_directive\`** (top-level, optional): the user's verbatim mid-walk delegation, present when one was issued.
- **\`recommendation_fork\`** (per-resolution, OPTIONAL) — present only when detection fired in Step 3b.5; carries the DETECTION data (the ratification channel lives at the entry level): \`detected\` (always true when present — absence IS the no-fork representation; a \`detected: false\` variant is never emitted), \`source\` (\`"structured"\` | \`"heuristic"\`), \`options_presented\`, \`chosen\` (a presented label, or \`"off-menu"\` with the entry-level \`resolution\` carrying the direction), \`structured_path_skipped_reason\` (optional, malformed-structured-input cases). The retired \`discuss_invoked\` appears only in pre-D4 logs; readers tolerate both generations.
- **\`ripple_cascade\`** (per-resolution) — replaces v1's top-level \`ripple_flagged_files_aggregate\`. Object splits each resolution's ripples into \`applied\` (paths cascade-edited consistent with the primary fix; recorded for audit) AND \`flagged_not_applied\` (paths identified as ripple targets but NOT edited, with \`{path, reason}\` entries). Reasons fall into TWO source categories:
  - **Structural OUT-category reasons** (4 codes): \`audit-trail file; cascade skipped by policy\` / \`baseline spec; add a delta to your current change's specs/<capability>/spec.md to capture this ripple\` / \`cross-change ripple; cascade scope is current change only\` / \`safe-exclusion path; never edited\`. Fire when cascade was ON and the file matched an OUT prefix.
  - **Mode-suppression reason** (1 code): \`--no-cascade suppressed\`. Fires uniformly for ALL ripple-flagged files when \`--no-cascade\` was set, regardless of IN/OUT classification.
- **\`sweep\`** (per-resolution, on \`resolved\` entries — rc08a): the five arrays \`retired\` / \`introduced\` / \`searched\` / \`scope\` / \`kept\` composed at Step 3d.5. Shape owned by \`orbit-address-reviews\`' \`A resolved walk entry records its sweep evidence\`; checks owned by \`orbit-emit-composition\`'s \`The walk write gate checks sweep evidence\`. A log written before rc08a carries none.
- **\`ripple_miss_of\`** (per-resolution, optional — rc08a): \`{walk, title, file, kind}\` naming the earlier walk entry that missed this finding, written at triage (Step 2). Shape owned by \`orbit-address-reviews\`' \`A ripple miss is attributed by the walk that finds it\`; the pointer check by \`orbit-emit-composition\`'s \`A ripple-miss pointer resolves and is counted\`.
- **\`remedy\`**, **\`routed_to\`** (per-resolution — rc08b): R-crc-6's lane — what the resolution DID, beside the process \`lane\` — and a REDESIGN's route. Values, dispositions and routes owned by \`orbit-address-reviews\`' \`A walk entry records its remedy, and a REDESIGN leaves the walk\`; recorded, never checked at the write gate. A log written before rc08b carries neither.
- **\`disagreement\`** (per-resolution, optional — rc08b): \`{with: {pass, title, file}, test, observed}\` on the entry in the LATER pass's log, when the halves of a pair contradicted each other and one test settled it. Shape and rule owned by \`orbit-address-reviews\`' \`A disagreement between the halves of a pair is settled by one test\`; recorded, never checked.
- **\`ripple_misses\`** (top-level, engine-computed — rc08a): the count of this walk's resolutions carrying \`ripple_miss_of\`; never supplied, per \`orbit-emit-composition\`'s \`A ripple-miss pointer resolves and is counted\`.

## Worked-example JSON snippets

### (a) Walk-mode clean run (per_finding default, all IN, no fork)

\`\`\`json
{
  "walk_mode": "per_finding",
  "resolutions": [
    {
      "title": "<finding>",
      "classification": "trivial_fix",
      "action": "applied edit at design.md:14",
      "ripple_cascade": {
        "applied": ["orbit/changes/foo/design.md", "orbit/changes/foo/tasks.md"],
        "flagged_not_applied": []
      },
      "sweep": { "retired": ["<old wording>"], "introduced": [], "searched": ["<old wording>"], "scope": [], "kept": [] },
      "outcome": "resolved"
    }
  ]
}
\`\`\`

### (b) Batch-mode with verbal source

\`\`\`json
{
  "walk_mode": "batch",
  "walk_mode_source": "verbal",
  "resolutions": [/* ... */]
}
\`\`\`

### (c) Decision-fork ratified by chat directive

\`\`\`json
{
  "resolutions": [
    {
      "title": "Test coverage gap — file follow-up or extend scope?",
      "classification": "decision_required",
      "recommendation_fork": {
        "detected": true,
        "source": "structured",
        "options_presented": [
          { "label": "A", "body": "file a follow-up issue tracking the v2 polish" },
          { "label": "B", "body": "extend scope to tasks.md" }
        ],
        "chosen": "B"
      },
      "ratified_via": "chat",
      "action": "applied the ratified direction B — added Group 19 to tasks.md",
      "ripple_cascade": { "applied": ["orbit/changes/foo/tasks.md"], "flagged_not_applied": [] },
      "sweep": { "retired": [], "introduced": [{ "path": "orbit/changes/foo/tasks.md", "text": "## 19." }], "searched": ["Group 19"], "scope": [], "kept": [] },
      "outcome": "resolved"
    }
  ]
}
\`\`\`

### (d) \`--no-cascade\` — all ripples flagged-not-applied

\`\`\`json
{
  "walk_mode": "per_finding",
  "resolutions": [
    {
      "title": "<finding>",
      "ripple_cascade": {
        "applied": [],
        "flagged_not_applied": [
          { "path": "orbit/changes/foo/design.md", "reason": "--no-cascade suppressed" },
          { "path": "orbit/changes/foo/tasks.md", "reason": "--no-cascade suppressed" }
        ]
      }
    }
  ]
}
\`\`\`
`;
export function getAddressReviewsSkillTemplate() {
    return {
        name: 'orbit-address-reviews',
        description: "Resolve `@review:` markers anywhere in the repo (or review findings via `--from-file` markdown / JSON, or, aimed at a change, every outstanding pass its reviewed gates report — internal JSON and external returns alike — plus its unwalked audit-drift emits) by walking each through pushback → classify → resolve-per-lane → ripple-cascade → remove-marker (obvious-fix findings previewed at triage and applied without prompts; decision-lane findings briefed in prose and ratified by chat directive or an optional closure prompt). Walk-mode (per-finding) is the default; `--batch` opts in. Cascade-by-default auto-applies ripple edits to IN-set files (everything outside the four lifecycle-invariant OUT categories: audit trail, baseline specs, cross-change/archive dirs, safe-exclusions); `--no-cascade` opts out. Use after `/orbit:review` writes findings to `.orbit-runs/` (discovered from the gate's outstanding passes; no `--mark` pre-step needed), after `/orbit:review --as <mode> --reviewer external` returns external findings, after `/orbit:audit-drift` writes drift findings, or any time the repo has accumulated `@review:` annotations.",
        instructions: `Resolve \`@review:\` markers across the repo (or external-review findings from a file) with pushback discipline. The lifecycle: **discover → triage → walk → report**, where each walked finding completes its inner cycle (pushback → classify → fix → ripple-cascade → remove-marker) in walk-mode by default. Cascade-by-default auto-applies parallel edits to ripple-flagged IN-set files. Markers are removed from their source files on resolution (the marker-removal invariant) so they don't leak into canonical artifacts.

**Generates resolutions; does not generate findings.** This is the counterpart to \`/orbit:review\`. Primary use case: close the cross-AI review cycle by ingesting external-AI findings via \`--from-file\`. Secondary use case: walk repo-scanned inline \`@review:\` markers with structured pushback.

**Input**: Optional scope (path or pattern) and optional flags. Default: whole-repo scan with safe exclusions.

## Four execution disciplines (epitome)

The four disciplines from \`orbit-conventions\`, embedded per body; detail lives in the step where each fires.

- **Pushback (review-time) — primary here**: verify every claim against current state before acting (procedure in Step 3a); stale findings are suppressed with evidence, never re-fixed.
- **Read-before-reference (authoring-time)**: read a file's actual current content before editing or citing it; re-read after edits to confirm they landed.
- **Change completeness (modification-time)**: apply resolutions across ALL affected artifacts — the Step 3d ripple cascade is this discipline mechanized; sweep just-touched files for residue after mechanical edits.
- **No-chaining (turn boundary)**: invoke only the orbit workflow commands the user's message explicitly requests; completing a command ENDS the turn at the position readout + the engine's eligibility line — gate \`passed\` means *eligible*, not *commanded*.

## Steps

### 1. Discover (or ingest)

**Discovery** decides which sources this invocation walks. The fence below is a CHECKED MIRROR of \`orbit-address-reviews\`' \`Address-reviews command available\`, its owner. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here.

\`\`\`
DISCOVERY — rows tested in order, first match wins:
1 --from-file <path>, with or without a positional: the file ONLY; no marker grep, no trail discovery, no openPair warning; the positional, if any, resolves only where the log lands.
2 no positional, exactly one active change (per orbit list --json): say "resolved to the single active change <name>; markers outside it are not scanned", then re-enter these rows as a positional naming that change.
3 no positional, zero or several active changes: the whole-repo @review: marker scan; several are named in the header so the user can aim the walk.
4 active change, a reviewed gate neither blocked nor superseded reports openPair: before triage, warn that the pair is half-landed, naming the missing member and the gate's canonical next command. When the landed half is listed in that gate's unresolvedPasses or unwalkedPasses, offer two choices — stop (walk nothing, write no log, so the missing review can run) or walk now. Walking now ends the pair: on an invoked slot the walked half then covers alone; on a blind-pair slot no pair can form on this state. On walk, continue at row 5. When the landed half is listed in neither (it carries no finding), no walk can end the pair: say so, name the routes that can — a further review of the landed half's class, which on an invoked slot lands as a single and covers, or a continuation/proceed judgement at the gate's seam — then walk nothing and write no log.
5 active change: the UNION of @review: markers in the change directory, every unresolvedPasses and unwalkedPasses entry of each reviewed gate neither blocked nor superseded (internal review-<mode>-*.json and external external-<mode>-*.md alike), and every audit-drift-*.json in its .orbit-runs/ whose basename no address-reviews-*.json there names in source_path.
6 archived change: markers in the archived directory + its unwalked audit-drift-*.json by the same basename rule; its review passes are reached by --from-file, and the header says so.
7 a positional resolving to no change (a path or pattern): markers in that scope only.
AFTER the matched row: when it discovered nothing, print "No @review: markers and no outstanding passes in scope. Nothing to walk.", then list each audit-drift-*.json in scope that a log already names as "walked before; reach by --from-file <path>", and exit clean.
\`\`\`

**The outstanding set is the gate's, never a second rule here.** On an active change, read \`orbit status --change <name> --json\`. From each \`gates[]\` row with \`kind: "reviewed"\` whose \`state\` is not \`blocked\` and that does not carry \`superseded: true\`, take its \`unresolvedPasses\` and its \`unwalkedPasses\` (each entry \`{token, file, mode, source}\`, \`file\` repo-relative, oldest first) and its \`openPair\` (\`{missing}\`, present only when a pair is half-landed). Row 4 reads \`openPair\`, and row 5 reads the union of the two lists. \`unresolvedPasses\` holds the passes the gate holds on; \`unwalkedPasses\` holds every other pass carrying a finding of any severity that no walk record references, so a suggestion-only pass is discovered and walked like any other — the walk holds nothing on the gate, though, like any walk, it raises the following cadence slot's ordering bar. audit-drift is not a gate pass, so row 5 finds it by the basename rule.

**A marker that restates a discovered finding** — at that finding's \`file\`, its text beginning with the finding's title (the form \`/orbit:review --mark\` writes) — is walked AS that finding, in its pass's log, and removed at Step 3e. The markers' log omits it, so no finding is walked twice. \`--mark\` stays a stylistic choice, never a prerequisite.

**Default — whole-repo scan** (row 3): \`grep -rn "@review:"\` with the safe exclusions \`.git/\`, \`node_modules/\`, \`dist/\`, \`build/\`. No trail is read.

**Positional \`<scope>\`** resolves active change → archived change (lexicographically-latest date on collision) → path/pattern fallback. (Details: \`references/resolution-detail.md\`.)

**Every discovered pass and audit-drift emit walks the \`--from-file\` ingest path below**, exactly as if its path had been passed, and gets its own log (Step 6).

**\`--from-file\` ingest** auto-detects format by content sniff (content only — never extension): leading \`{\` → internal JSON, accepting \`command: "review"\` or \`"audit-drift"\` only (\`"address-reviews"\` rejected on purpose — cycle prevention; contract at \`references/internal-findings-format.md\`); leading \`# External Review:\` → external markdown (\`references/external-findings-format.md\`); neither → clean format-mismatch error naming both. Each finding becomes a virtual marker (\`severity\` / \`title\` / \`file:line\` / \`description\` / \`reproduction\` when present / \`source\` tagged \`external\` / \`internal-review\` / \`audit-drift\`) walking the same lifecycle as inline markers, except Step 3e marker-removal is a no-op — the source file is an audit artifact that travels with the change into archive.

**Fresh pushback applies to every virtual marker**: the source's own \`stale_suppressed[]\` filtered at source-run time, but state may have changed since; Step 3a runs regardless of provenance.

### 2. Triage

Present discovered markers (or parsed virtual markers) as a numbered list:

\`\`\`
Found 12 markers in scope:

  1. orbit/changes/foo/proposal.md:41 — "@review: should this be five or four?"
  2. orbit/changes/foo/design.md:159  — "@review: 9 vs 8 after merge"
  3. src/api/auth.ts:88                   — "// @review: token TTL configurable per env?"
  ...
 12. (external) proposal.md:33            — [CRITICAL] orbit-conventions bullet omits three disciplines
\`\`\`

Mark external-sourced entries explicitly (\`(external)\` prefix). **Blocks come first**: when the source carries lifecycle blocks (markdown \`## Blocks\` items; the review JSON's \`blocks[]\`), list them at the TOP of the triage table under a \`Blocks (not walked)\` heading — one line each, verbatim — before any numbered finding; they are never virtual markers, never walked, and never counted (per \`orbit-conventions\`' Severity ladder; the stop is the human's). A CRITICAL marker that carries no reproduction is tagged \`unreproduced\` in its triage line. The triage OPENS with the **obvious-fix lane preview** (D-arc Stage D4): every finding provisionally headed for the obvious-fix lane is listed compactly — finding + its one-line resolution — BEFORE any fix lands, so the user can pull any item into the decision lane with a word ("discuss the import one"). The preview derives from a PROVISIONAL classification (per-finding pushback has not yet run); walk-time pushback may reclassify, and a reclassified item is announced before its fix lands. Scoping (walk all — the default — / a subset / only-critical / cancel) is settled by the user's response to the preview; an \`AskUserQuestion\` is optional closure when the response doesn't settle it.

**Ripple-miss attribution** (a change-scoped walk): read the change's EARLIER walk logs (\`address-reviews-*.json\` on its trail) against each finding. Where a finding sits at a site an earlier \`resolved\` entry's fix should have reached, that finding's resolution — once it resolves — carries \`ripple_miss_of: {walk, title, file, kind}\`, naming the earlier entry with \`title\` and \`file\` copied from that log, never retyped, and \`kind\` one of: \`scope\` (the site lay outside that entry's check scope), \`query\` (inside it, but matched by none of its \`retired\` or \`searched\` strings), or \`judgement\` (matched, and judged unaffected). An entry written before sweep records existed has no \`retired\`/\`searched\`; read its scope as the change directory (on a change-scoped walk), its \`file\` and its \`ripple_cascade.applied\`. Attribution is your judgement and optional: a finding no earlier entry touched carries none. Shape and rule: \`orbit-address-reviews\`' \`A ripple miss is attributed by the walk that finds it\`.

**Several sources, one triage.** When discovery yields more than one source, triage runs ONCE across all of them, grouped by source: passes in the engine's token order, oldest first, then the markers. Mark each finding that converges with a finding of another discovered pass (same site, same claim) as found by both. The split (found by both / one pass only / contradictory) is a triage rendering and is never stored as a merged record. A converged finding is walked in the log of the EARLIER pass. In each later pass's log it takes the earlier entry's disposition: \`stale\` with evidence naming the earlier log's token when the earlier entry is \`resolved\` or \`stale\`, and the same \`deferred\` or \`escalated\` disposition (and \`routed_to\`, when present) when the earlier entry stays open. A later pass is never closed by a finding that has not closed. Shape and rule: \`orbit-address-reviews\`' \`One invocation writes one log per discovered source\`.

**A rediscovered pass** — discovery lists it although a log already names it: its latest log left an entry \`deferred\` or \`escalated\`, names only some of its substantive findings, or is unreadable with summary counts that leave an entry open or carry none — is presented with that log's dispositions, where it has any; a substantive finding that log does not name is walked. Its new log must name every substantive finding of the pass, because the gate reads only the latest log. So each finding the earlier log closed is re-checked by pushback against current state: still fixed, it is recorded \`stale\`, with evidence naming the earlier log's token; reproduced — the fix regressed — it is walked again like any finding, with a fresh \`sweep\`. The open findings are walked again, except one the earlier log escalated with \`remedy: "redesign"\` and a \`routed_to\`: re-record it \`escalated\` with the same \`routed_to\`, do not walk it, and name its route again in the report. Nothing is copied forward: a copied \`resolved\` entry would owe a fresh \`sweep\` the write gate checks against today's files.

**A disagreement** — two discovered passes of one blind pair making CONTRADICTORY claims about one site, or about two sites whose premises contradict — is settled by ONE cheap empirical test (a command run, or a constructed case derived against the current artifact), run AT TRIAGE before either pass's log is written. Record it on the entry in the LATER pass's log as \`disagreement: {with, test, observed}\`: \`with\` is \`{pass, title, file}\` naming the other pass's token and its finding, \`test\` the test as run, \`observed\` its output or derivation. A claim the test refutes is \`stale\` with the test's output as its evidence, in its OWN pass's log; a claim it upholds is walked like any finding. When the test cannot be run, \`observed\` says so and the finding enters the decision lane, so the user decides. A claim pushback finds stale at HEAD is not a disagreement, and neither is a difference in the two passes' forward \`direction\` (that is the readiness record's). Rule: \`orbit-address-reviews\`' \`A disagreement between the halves of a pair is settled by one test\`.

### 3. Walk each marker

**Walk-mode is the default**: each marker receives its own complete inner cycle — pushback → classify → resolve per LANE → ripple-cascade → remove-marker — before the next marker's pushback begins. Obvious-fix findings (previewed at triage) apply with no prompt and no discussion; decision-lane findings follow the present → discuss → ratify protocol (3b.5). There is NO mandatory per-finding \`AskUserQuestion\`. The user can interrupt between markers; the resolution log captures partial completion if interrupted.

**Batch-mode is opt-in** via one of three mutually-exclusive triggers (first match wins; recorded in \`walk_mode_source\`): the \`--batch\` flag (\`"flag"\`), a batch-intent phrase in the INVOCATION message itself — never in a later walk response (\`"fix them all"\`, \`"batch them"\`, … → \`"verbal"\`), or a bare command-shaped mid-walk switch (\`"go batch"\` → \`"command-shape-interruption"\`, recording the 1-indexed \`walk_mode_shifted_at_finding\`). Ambiguous mid-walk phrases (\`"fine, fix them all"\`) never shift mode; the full trigger table lives in \`references/resolution-detail.md\`. In batch-mode, all markers complete pushback + classify + resolve before ripples apply once as a single aggregated step — and decision-lane findings STILL get their per-finding briefing and ratification; batch never merges decisions into one prompt, it only suppresses per-finding pacing for obvious-fix and stale findings.

For every marker in the chosen scope, execute the lifecycle below sequentially.

#### 3a. Apply pushback (primary discipline)

Run the verification procedure:

0. For a CRITICAL marker that carries a \`reproduction\`, RE-RUN it FIRST — execute the command, or re-derive the constructed case against the current artifact — and record the result as the entry's first evidence: \`reproduction_rerun\` is \`reproduced\` / \`not-reproduced\` / \`cannot-run\`, with the output or derivation in \`evidence\`. A CRITICAL carrying none is noted \`unreproduced\` and pushback proceeds on the claim alone — never re-grading it (per \`orbit-conventions\`' Severity ladder, severity is the author's). When the re-run's observed result now matches the expected one, the marker is **stale-with-evidence** (the re-run's output IS the evidence) and no further edit is made. Below CRITICAL the field is absent.
1. Identify the marker's referenced symbol, name, or concept.
2. \`grep -rn\` for current presence in expected locations (the marker's file, related files, baseline specs).
3. If the symbol is absent where the marker expects it, \`git log -S "<symbol>" --since=<window>\` (default: since the marker file's last modification) to confirm intentional removal.
4. Read the relevant file's current content and compare to the marker's claim.
5. Decide: **still applies** / **already fixed** / **partially applies**.
6. On already-fixed, record the commit hash or current-content evidence as part of suppression — the marker is removed without further edit; never re-edit already-fixed state.

#### 3b. Classify

Apply heuristics in order:

1. **stale** — pushback determined the issue is already resolved at HEAD. Skip directly to Step 3e (marker removal no-op for virtual markers; log as ⚠ Stale). Step 3b.5 (decision-fork detection) and Step 3d (ripple cascade) do NOT fire for stale findings — no fix was applied so no ripples to derive.
2. **trivial fix** — single-line edit or a few-line localized edit with one obvious correct answer (no design implication, no scope question, no ambiguity in intent). Proceed to 3c without \`AskUserQuestion\`. Step 3b.5 does NOT fire (no decision needed); Step 3d ripple cascade DOES fire after the fix lands.
3. **decision required** — resolution requires ambiguity resolution, a design choice between defensible alternatives, a scope decision, or has implications beyond the immediate location. Hand off to Step 3b.5 (the decision lane): construct 2–4 concrete options FOR THE PROSE BRIEFING (detection supplies them when the recommendation is disjunctive; otherwise derive them from context) — no prompt fires here; the \`AskUserQuestion\` exists only as post-discussion closure per 3b.5. Step 3d cascade fires after the ratified fix.
4. **unresolvable** — resolution needs information not currently available (deferred decision, future capability, blocked on external input). Default: file as a task in \`tasks.md\` in Step 3c (action "filed as task"); Step 3d cascade does NOT fire (no fix was applied; no ripples); Step 3e marker-removal proceeds normally. Alternatives via **AskUserQuestion**: convert to \`@todo: <content>\` or escalate to \`@review(escalated): <content with explanation>\` — in both alternative cases, the marker is **transformed** in place (Step 3e) rather than removed; cascade still does not fire.

**Then the remedy** — R-crc-6's three lanes, recorded per entry as \`remedy\`, a field separate from the process \`lane\` above (which says how a finding was CONDUCTED; \`remedy\` says what its resolution DID). Decide it by one test — does closing the finding require mechanism nobody has reviewed? — never by the finding's size. \`repair\`: the right thing is local, fixed here. \`descope\`: the change was doing something it should not, so it is removed (the removal's sweep rides \`sweep\`). \`redesign\`: closing it needs unreviewed mechanism. The values, dispositions and routes are \`orbit-address-reviews\`' \`A walk entry records its remedy, and a REDESIGN leaves the walk\` (a four-row table). Every \`resolved\` entry carries \`remedy\`, and so does every \`escalated\` entry routed out; a \`stale\` entry, and an unrouted \`deferred\` or \`escalated\` one, carries no \`remedy\`.

**A REDESIGN is never closed in place.** If the unreviewed mechanism can leave the change (separable), remove it from the change, record the entry \`resolved\` with \`routed_to: "orbit/explore/<new-name>/"\`, and sweep the removal. If it cannot (essential), the entry is \`escalated\`. It holds the gate only where the gate reads it: on a CRITICAL or WARNING of a reviewed-gate pass, that pass stays unresolved; an escalated SUGGESTION, or an entry from an audit-drift emit or from markers, records the route and holds nothing. While the hold stands, the eligibility line stays on the walk; that walk carries the routed entry forward unwalked (Step 2) — a named limit until the explored repair lands. \`routed_to\` is \`orbit/changes/<name>/explore.md\` on an ACTIVE change, and on any other scope (an archived change, a project-wide or architecture walk) a new exploration, \`orbit/explore/<new-name>/\`. The report names the route — \`/orbit:explore <new-name>\`, or \`/orbit:explore <name>\` on an active change — and the walk invokes nothing (no-chaining). Where that command lands is the explore re-entry table's to decide; promise no resume.

#### 3b.5. The decision lane: present → discuss → ratify (classify == "decision required")

**Fires only when classify == "decision required"**. Skip this sub-step entirely for \`stale\` / \`trivial fix\` / \`unresolvable\` classifications — they short-circuit straight to 3c.

The lane's protocol (D-arc Stage D4): (1) **PRESENT** — a FULL-PROSE briefing in chat: what the finding means, why it matters, terminology level-setting where concepts are novel, and the concrete options with real tradeoffs. The briefing is the presentation — option content is never confined to prompt labels. (2) **DISCUSS** — genuine back-and-forth for as many exchanges as the finding needs (zero exchanges is legitimate for crisp cases). (3) **RATIFY** — a direction the user types in chat IS ratification (user-typed provenance, the consent model's strongest signal); the \`AskUserQuestion\` is an OPTIONAL CLOSURE DEVICE, fired only AFTER the finding's discussion concludes without a crisp user directive (never before the briefing, never mid-discussion), carrying the discussed conclusion as its default option. A dismissed or inconclusive prompt RE-PRESENTS the finding — the walk position and briefing context are never lost. The prompt NEVER precedes the briefing, and one prompt NEVER spans multiple findings (batch prompts are prohibited). **Batch DELEGATION** — an explicit user directive compressing the lane ("handle the rest, only brief me on real decisions") — remains the user's prerogative and is recorded verbatim in the resolution log's top-level \`delegation_directive\`.

**Hybrid detection** supplies the briefing's option set — structured first: a well-formed \`recommendation_options: [{label, body}]\` array with ≥ 2 complete entries is used DIRECTLY (\`recommendation_fork.source: "structured"\`); otherwise a STRICT-disjunctive heuristic over the prose recommendation (numbered alternatives / clause-level "Either … or …" / an "Options:" prefix — never loose "or"; \`source: "heuristic"\`). Malformed structured input warns on stderr and falls back to heuristic with \`structured_path_skipped_reason\` recorded; it never aborts the walk. No detection at all: the finding STILL gets its full-prose briefing with 2–4 AI-derived options, and NO \`recommendation_fork\` object is recorded (absence IS the no-fork representation).

**Ratification recording** — every decision-lane resolution records \`ratified_via: "chat" | "prompt"\` at the ENTRY level, plus a verbatim \`resolution\` string when no fork was detected or the ratified direction is off-menu; the \`recommendation_fork\` object (when detection fired) carries the detection data. Exact trigger rules, malformed-input handling, the recording shape, and a mini decision-lane trace: \`references/resolution-detail.md\`. (The \`[discuss]\` escape hatch is RETIRED — discussion is the medium; pre-D4 logs carry it, readers tolerate both generations.)

#### 3c. Apply the fix

- **trivial fix**: apply the edit. Re-read the file after to confirm.
- **decision required**: apply the RATIFIED resolution (the user's chat directive, or the closure prompt's outcome) per the decision-lane protocol in 3b.5.
- **unresolvable (default)**: append a task to \`orbit/changes/<change>/tasks.md\` (or repo-level \`TODO.md\` if no change context); task text is the marker's content + ripple-flag context.
- **unresolvable (\`@todo:\` or \`@review(escalated):\`)**: replace the marker text in place (do NOT remove — the new form persists as future signal).

#### 3d. Ripple cascade (auto-apply by default; \`--no-cascade\` opts out)

If the resolution edited a normative artifact, compute the ripple-flag set — files that need parallel edits to stay consistent with the primary fix. Then split each ripple into **IN** (auto-applied) and **OUT** (recorded in \`flagged_not_applied[]\`).

**OUT — the four lifecycle-invariant exclusion categories** (these are the ONLY structural exclusions; any other file is IN):

| OUT category | Path prefix | Reason recorded in \`flagged_not_applied\` |
|---|---|---|
| Audit trail (all four locations) | \`orbit/changes/<name>/.orbit-runs/*\`, \`orbit/.orbit-runs/*\`, \`orbit/explore/<name>/.orbit-runs/*\`, AND \`orbit/architecture/.orbit-runs/*\` (D-arc Stage D2) | \`audit-trail file; cascade skipped by policy\` |
| Baseline specs | \`orbit/specs/<capability>/spec.md\` | \`baseline spec; add a delta to your current change's specs/<capability>/spec.md to capture this ripple\` |
| Cross-change (active + archived) | \`orbit/changes/<other-name>/*\` AND \`orbit/changes/archive/*\` | \`cross-change ripple; cascade scope is current change only\` |
| Safe-exclusions (exact set) | \`.git/\`, \`node_modules/\`, \`dist/\`, \`build/\` | \`safe-exclusion path; never edited\` |

**The safe-exclusion prefix set is EXACT** — do NOT extend ad-hoc to other paths during application. Expanding the set requires a spec change.

**IN — everything else.** File extension is NOT a discriminator: \`.py\`, \`.swift\`, \`.c\`, \`.sh\`, \`.md\`, dotfiles, configs — all eligible if ripple-flagged and not matching an OUT prefix. For each IN file, apply the parallel edit consistent with the primary fix (run pushback against the file's current state first; classify as decision-required if ambiguous and surface a fork prompt). Record the path in \`ripple_cascade.applied[]\`.

**\`--no-cascade\` flag** (opt-out): when set, NO ripples are edited regardless of IN/OUT classification. ALL ripple-flagged files are recorded under \`ripple_cascade.flagged_not_applied[]\` with reason \`--no-cascade suppressed\`. Use case: user wants to inspect the ripple set before allowing edits.

**Cascade trusts the ripple-flag analysis** — no independent "should this file be touched?" judgments beyond the four-category OUT check; if analysis didn't surface a file, cascade doesn't touch it. \`--no-cascade suppressed\` is a mode-suppression reason that fires uniformly when the flag is set — NOT a fifth OUT category (structural OUT reasons fire only when cascade was ON).

#### 3d.5. Record the sweep (\`resolved\` entries only)

As the entry's last step before marker removal — in batch mode, for every entry after the one aggregated cascade — compose its \`sweep\`: five arrays, any of them empty, an empty array being the WRITTEN answer that there is nothing of that kind (shape: \`orbit-address-reviews\`' \`A resolved walk entry records its sweep evidence\`). A \`stale\`, \`deferred\` or \`escalated\` entry edited nothing and carries none.

- \`retired\` — wording the fix made FALSE, which must no longer appear anywhere the gate looks.
- \`introduced\` — \`{path, text}\`: text the fix added, which must appear in \`path\` (name text specific to this edit).
- \`searched\` — what you searched for to find the fix's other sites (a phrase, an identifier, a grep pattern); a record, never checked.
- \`scope\` — files or directories you examined beyond the entry's \`file\` and \`ripple_cascade.applied\`.
- \`kept\` — \`{path, why}\`: a file that must keep a retired string (history quoting the old wording, a test asserting its absence); the WHOLE file leaves that entry's retired check, so when it also carries live prose, retire a string specific to the live site. Under \`--keep-resolved-markers\`, a file whose retained marker quotes a retired string is listed here with the flag as its \`why\`.

The scope the gate checks and the rule every path you write resolves by are below — a CHECKED MIRROR of \`orbit-emit-composition\`'s \`The walk write gate checks sweep evidence\`, its owner. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here.

\`\`\`
CHECK SCOPE — the union of: on a change-scoped walk, every file under the change directory except its .orbit-runs/ trail; the entry's file; its ripple_cascade.applied paths; its sweep.scope paths, a directory contributing the regular files under it (a symlink met inside a directory is not followed; a path named explicitly is read at its target). Files under .git/, node_modules/, dist/ and build/ are never read, however the path entered the scope; for the change directory's own files those names are read below the change directory.
PATH — strip a trailing :<line> or :<line>:<column> (digits only, at the very end; a path carrying anything after the suffix, such as "design.md:40 (section)", is not stripped, and resolves to nothing); a path beginning orbit/changes/<name>/ for the walk's own change resolves under the change directory, archived or active; otherwise it resolves against the project root, then, on a change-scoped walk and only when nothing exists there, against the change directory.
\`\`\`

\`orbit emit address-reviews\` checks the record against the files as they stand at emit time. A refusal names the string, the path and the line: fix that file, or list it under \`kept\` with its \`why\` — never trim \`retired\` to get past it.

#### 3e. Remove the marker (invariant)

Unless \`--keep-resolved-markers\` is set, delete the original \`@review: <text>\` from its source file:

- **Markdown**: remove the marker text. If it was the only content on a line, remove the line.
- **Source code (C-style)**: remove just the marker text. If the comment now contains only whitespace or the comment delimiters (\`//\`, \`/* */\`), remove the whole comment.
- **Source code (hash)**: same as C-style for \`# @review:\` comments.
- **Virtual marker (external markdown, internal-review JSON, or audit-drift JSON)**: no-op — there's no source text to remove (the source file is an audit artifact). Log as resolved with the appropriate \`source\` tag (\`external\`, \`internal-review\`, or \`audit-drift\`).

For \`unresolvable\` conversions (\`@todo:\` / \`@review(escalated):\`), the marker is **transformed** in place rather than removed; this is still considered "resolution" for log purposes.

\`--keep-resolved-markers\` flag: skip the removal step entirely. Debug use only — markers persist after resolution.

### 4. (Internal — Step 3 runs inside this loop)

Iteration. After all markers in scope have walked Step 3, proceed to reporting.

### 5. Report — emit the resolution log

Resolution log is NOT a 3-dimension scorecard. Output structure:

\`\`\`
## Address-reviews report

Source: <whole-repo | scope <path> | --from-file <path> | auto-discovered <path> — one report section per log when the walk wrote several>
Markers found: <N>
Markers walked: <M> (subset specified: <yes/no>)

### Summary

| Status        | Count |
|---------------|-------|
| ✓ Resolved    | 5     |
| ⚠ Stale       | 2     |
| ⏸ Deferred    | 1     |
| ✗ Escalated   | 1     |

### ✓ Resolved
- **orbit/changes/foo/proposal.md:41** — \`@review: five or four?\`
  Action: applied trivial fix (\`five\` → \`four\` + added explicit list).
  Ripple: design.md, README.md flagged for sibling consistency.

- **src/api/auth.ts:88** — \`// @review: token TTL configurable per env?\`
  Action: applied user-selected option B (env-var override with default).
  Ripple: src/api/auth.test.ts flagged.

### ⚠ Stale
- **orbit/changes/foo/design.md:159** — \`@review: 9 vs 8 after merge\`
  Evidence: already corrected in commit abc1234. Marker removed without edit.

### ⏸ Deferred (filed as tasks / converted)
- **orbit/changes/foo/proposal.md:88** — \`@review: caching scope\`
  Action: filed as task \`tasks.md\` 10.5; marker removed.

### ✗ Escalated
- **orbit/changes/foo/design.md:204** — \`@review: blocking on legal decision re: data retention\`
  Action: converted to \`@review(escalated): blocking on legal decision re: data retention (escalated 2026-05-18 — see explore.md)\`.

### Final assessment

0 unresolved inline markers remaining in scope.
1 escalated marker deliberately persisted.
Suggested next: re-run /orbit:review --as proposal to confirm clean baseline.
\`\`\`

The final-assessment line summarizes remaining-in-scope markers (0 if clean) plus any deliberately persisted escalations, and names any REDESIGN's route (\`/orbit:explore <name>\`) without invoking it. What runs next is the engine's eligibility line, read from \`orbit status --change <name> --json\`.

### 6. Persist the run summary

**ONE resolution log PER SOURCE.** A walk that discovered more than one source writes one log per discovered pass, one per discovered audit-drift emit, and one for the markers when any were found. Each carries its own single \`source_path\` (the markers' log carries the scope, \`source: "scope"\`), so the gate's per-pass match reads every log unchanged. The logs go in token order, oldest first, then the markers. In walk mode, write each source's log when that source's findings are walked, before the next source begins. In batch mode the invocation resolves every source's findings, runs its ONE aggregated cascade, then writes every source's log, in the same order; an interrupted batch writes no log for a source whose log was not yet written, and a mid-walk switch to batch applies only to the sources whose logs are not yet written. An interrupted walk leaves the logs it completed on the trail; the sources whose logs were not written stay outstanding, and the next invocation discovers them again. A discovered source's log carries \`source: "auto-discovered"\`, \`source_path\` (that one file), \`source_command\` (its top-level \`command\`, or \`null\` for an external return), \`source_token\` and \`latest_apply_token\`; no \`tie_break_rationale\` is written, because nothing is selected by recency.

Compose each payload — narrative + per-command extension fields ONLY; \`references/run-summary-schema.md\` lists what the AI supplies. The ENGINE owns the spine, the iteration ordinal, \`next_recommended\` composition, filename + collision handling, and the write gate. Write the payload to a temp file and invoke:

\`\`\`bash
orbit emit address-reviews --change <name> --payload <payload-file>
\`\`\`

Architecture-scoped ingest (the source was a \`review-architecture-*.json\` emit): \`--doc <doc-name>\` instead of \`--change\` — the log lands on \`orbit/architecture/.orbit-runs/\` with \`change: null\`, keeping the architecture evidence chain whole. Whole-repo / cross-change walks with no change anchor: invoke BARE — \`orbit emit address-reviews --payload <payload-file>\` — and the engine writes \`orbit/.orbit-runs/address-reviews-<TS>.json\` with \`change: null\`. An ARCHIVED change name resolves through the same \`--change <name>\` invocation (the engine falls back to the archived trail). Every walk persists through the emit surface — never hand-compose the JSON.

## Marker syntax across file types

The command recognizes these marker forms uniformly:

| Context | Form |
|---|---|
| Markdown | \`@review: <text>\` (bare) |
| C-style code (TS/JS/Go/Rust/C/C++/Java) | \`// @review: <text>\` or \`/* @review: <text> */\` |
| Hash-comment files (Python/Ruby/shell/YAML/TOML) | \`# @review: <text>\` |

Adjacent forms (same discovery grep, different semantics):

| Marker | Meaning | Handled by this command? |
|---|---|---|
| \`@review: <text>\` | Needs review/decision | Yes — full lifecycle |
| \`@review(escalated): <text>\` | Escalated, awaiting human | Yes — listed in resolution log; NOT auto-walked unless explicitly scoped |
| \`@todo: <text>\` | Known follow-up work, NOT a review item | No — out of scope |

## Constraints

- **Never write new \`@review:\` markers.** Only \`/orbit:review --as proposal --mark\` does that. address-reviews can transform markers (e.g., to \`@todo:\` or \`@review(escalated):\`) but never creates fresh \`@review:\` markers.
- **Cascade by default; \`--no-cascade\` opts out.** Ripple-flagged files in the IN set (everything outside the four lifecycle-invariant OUT categories — audit trail, baseline specs, cross-change/archive dirs, safe-exclusions) are auto-edited per Step 3d. File extension is NOT a discriminator.
- **Walk-mode by default; \`--batch\` opts in.** Each marker gets its own complete pushback → classify → fix → cascade → remove cycle. Batch-mode triggers via \`--batch\` flag, verbal phrase in the invocation message, or a bare command-shape interruption mid-walk (per Step 3 trigger table).

## Worked examples

Two full ingest walkthroughs — a \`--from-file\` external-markdown nine-finding walk and a single-SUGGESTION internal-JSON walk — live in \`references/resolution-detail.md\`.

## Graceful degradation

Every no-input, malformed-input, and unsupported-format case exits clean with a named error; the exact messages and error shapes live in \`references/resolution-detail.md\`. Two worth knowing at triage: an empty \`findings: []\` JSON is NOT an error (a clean informational walk report), and a marker found in a baseline spec (\`orbit/specs/<capability>/\`) is flagged as unusual but walked per user choice.
`,
        references: [
            {
                name: 'external-findings-format.md',
                content: ADDRESS_REVIEWS_EXTERNAL_FINDINGS_FORMAT_REFERENCE,
            },
            {
                name: 'internal-findings-format.md',
                content: ADDRESS_REVIEWS_INTERNAL_FINDINGS_FORMAT_REFERENCE,
            },
            {
                name: 'resolution-detail.md',
                content: ADDRESS_REVIEWS_RESOLUTION_DETAIL_REFERENCE,
            },
            {
                name: 'run-summary-schema.md',
                content: ADDRESS_REVIEWS_RUN_SUMMARY_SCHEMA_REFERENCE,
            },
        ],
        license: 'MIT',
        compatibility: "Requires orbit CLI. Ingests findings via `--from-file` (external-review markdown OR internal `review-<mode>-*.json` OR `audit-drift-*.json`) OR via discovery on a change: its inline markers, every outstanding pass `orbit status --change <name> --json` lists on its reviewed gates, and its unwalked audit-drift emits, one log per source. Default behaviors: walk-mode (per-finding); cascade-on (auto-applies ripples to IN-set files). `--batch` opts INTO batch-mode; `--no-cascade` opts OUT of cascade. `--mark` is optional, not prerequisite.",
        metadata: { author: 'openspec', version: '0.1', capability: 'orbit-address-reviews' },
    };
}
export function getOrbitAddressReviewsCommandTemplate() {
    return {
        name: 'ORBIT: Address Reviews',
        description: 'Resolve @review: markers or review findings with pushback discipline',
        category: 'Workflow',
        tags: ["workflow", "review", "orbit"],
        content: `Resolve \`@review:\` markers or review findings (via \`--from-file\`, or discovered from a change's outstanding passes) by walking each through pushback → classify → fix → ripple-cascade → remove-marker.

This command is a thin launcher: invoke the \`orbit-address-reviews\` skill, passing along any arguments given with the command (e.g., \`/orbit:address-reviews [<change-or-scope>] [--from-file <path>] [--batch] [--no-cascade]\`). The skill carries the complete workflow instructions — upstream behavior plus orbit's additions. Do not improvise the workflow from this file; load the skill.`
    };
}
//# sourceMappingURL=address-reviews.js.map