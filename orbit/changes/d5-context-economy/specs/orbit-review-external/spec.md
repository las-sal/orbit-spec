## MODIFIED Requirements

### Requirement: Review-external command available

The system SHALL provide the external-review packaging capability — preparing a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review — invoked as `/orbit:review --as <mode> --reviewer external <change-name>` (D-arc Stage D5: the reviewer-class axis on the review command; the standalone `/orbit:review-external` launcher and skill are RETIRED from the generated surface, 16 → 15). The packaging behavior itself is UNCHANGED by the merge, and the RECORD VOCABULARY IS FROZEN: the T0 packaging emit keeps `command: "review-external"` and its `review-external-<TS>.json` filename, prompt files keep `external-prompt-<as>-<TS>.md`, and findings files keep `external-<as>-<TS>.md` — the gate reader's cadence slots, the orientation surface's WAITING arithmetic, the report ordinal's shared pass axis, and the address-reviews parser all key on those names and are untouched. Archived trails and historical emits citing the retired invocation form are records, never rewritten.

#### Scenario: Invoke with change name and mode

- **WHEN** the user invokes `/orbit:review <change-name> --as proposal --reviewer external` (or `--as system`)
- **THEN** the command writes a self-contained markdown prompt to `orbit/changes/<change-name>/.orbit-runs/external-prompt-<as>-<TS>.md` and emits a short invocation snippet to chat (file path + paste-ready instruction for the external AI + the eventual findings path); the file is intended to be committed

#### Scenario: Invoke without change name

- **WHEN** the user invokes `/orbit:review --reviewer external` with no positional
- **THEN** the command runs `orbit list --json` and prompts via `AskUserQuestion` to pick a change

#### Scenario: Record vocabulary frozen across the merge

- **WHEN** the external-handoff branch packages a prompt and emits T0
- **THEN** the emit carries `command: "review-external"` in a `review-external-<TS>.json` file — byte-compatible with pre-merge records — and every downstream consumer (gates, orientation, report ordinal, ingest parser) behaves identically to pre-merge behavior

### Requirement: Mode flag with state-based inference default

The external-review packaging branch SHALL accept a `--as proposal|system` flag; when omitted, mode inference is OWNED by `orbit-review`'s `Mode inference when --as omitted` requirement (one voice on one behavior — D-arc Stage D5's merge onto the single `/orbit:review` surface; that requirement additionally covers architecture-never-inferred). The scenarios below record the packaging branch's observable behavior under that shared inference, not a second inference definition.

#### Scenario: All tasks unchecked → infer proposal mode

- **WHEN** `--as` is omitted and ALL task boxes in the change's `tasks.md` are unchecked
- **THEN** the command proceeds as `--as proposal` and the chat output includes "Generating external-review prompt as `proposal` (inferred from tasks state)."

#### Scenario: All tasks checked + code exists → infer system mode

- **WHEN** `--as` is omitted, all tasks in `tasks.md` are checked, and the codebase shows changes consistent with apply having run
- **THEN** the command proceeds as `--as system` with an analogous inference note

#### Scenario: Ambiguous state → prompt user

- **WHEN** the inference cannot determine mode unambiguously — mixed checked/unchecked task boxes (partial implementation), or all boxes checked without visible code changes
- **THEN** the command prompts the user via `AskUserQuestion` to choose proposal or system (mixed state never silently infers either mode)
