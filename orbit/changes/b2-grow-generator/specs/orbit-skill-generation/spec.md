## ADDED Requirements

### Requirement: Multi-file skill emission

The skill generator SHALL support multi-file skills: a `SkillTemplate` MAY declare
`references` — an array of `{ name, content }` entries — and the skill-writer SHALL emit each
entry as `<skill-dir>/references/<name>` alongside `SKILL.md`, for every skill-capable tool
configured (e.g., Claude `.claude/skills/`, Codex `.codex/skills/`).

#### Scenario: Reference files emitted on init

- **WHEN** `orbit init` generates a skill whose template declares
  `references: [{ name: "archive-summary-schema.md", content: <markdown> }]`
- **THEN** the file `<skills-dir>/<skill-dir>/references/archive-summary-schema.md` is written
  with exactly the declared content, next to the skill's `SKILL.md`

#### Scenario: Skills without references are unchanged

- **WHEN** a skill's template declares no `references` (or an empty array)
- **THEN** the generated skill dir contains `SKILL.md` only; no `references/` directory is created

#### Scenario: Identical bytes for every tool

- **WHEN** the same skill is generated for two skill-capable tools (e.g., claude and codex)
- **THEN** each tool's copy of every reference file is byte-identical (the writer applies no
  per-tool transformation to reference content)

#### Scenario: Reference name is a bare filename

- **WHEN** a template declares a reference entry
- **THEN** its `name` is a bare filename (e.g., `archive-summary-schema.md`); the writer owns the
  `references/` path segment — templates do not embed directory separators in `name`

### Requirement: Update converges generated references directories

`orbit update` SHALL reconcile each generated skill's `references/` directory to the template's
declared set: write every declared reference and remove undeclared files, so that after update
the generated surface is indistinguishable from a fresh `orbit init` at the current version.
Reconciliation SHALL be scoped to files within `<skill-dir>/references/` only.

#### Scenario: Declared references refreshed on update

- **WHEN** a template's reference content changes between CLI versions and `orbit update` runs
- **THEN** the on-disk reference file is overwritten with the current content

#### Scenario: Undeclared files removed on update

- **WHEN** a generated skill's `references/` dir contains a file the current template does not
  declare (e.g., a reference renamed or removed in a newer CLI version, or a user-parked file)
- **THEN** `orbit update` removes that file, and reports the removal in its output

#### Scenario: Reconciliation never escapes references/

- **WHEN** `orbit update` reconciles a skill's references
- **THEN** it deletes nothing outside `<skill-dir>/references/` — not the skill dir, not
  `SKILL.md`, not project files

### Requirement: Frontmatter metadata pass-through

`generateSkillContent()` SHALL emit every key of the template's `metadata` record into the
generated `SKILL.md` frontmatter `metadata:` block, in template-declared order. The generator
SHALL append `generatedBy: <CLI version>`; `generatedBy` is generator-owned and overrides any
template-declared key of the same name.

#### Scenario: Arbitrary metadata keys survive generation

- **WHEN** a template declares `metadata: { author, version, capability: "orbit-review" }`
- **THEN** the generated frontmatter contains `author`, `version`, AND `capability: orbit-review`
  (no key is silently dropped)

#### Scenario: generatedBy is generator-owned

- **WHEN** a template declares its own `generatedBy` metadata key
- **THEN** the generated frontmatter carries the generator-injected CLI version for `generatedBy`,
  not the template's value
