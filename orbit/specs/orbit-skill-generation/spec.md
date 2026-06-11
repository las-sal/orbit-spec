# orbit-skill-generation Specification

## Purpose
TBD - created by archiving change b2-grow-generator. Update Purpose after archive.
## Requirements
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

### Requirement: Reference names validate at generation time

The generator SHALL validate reference names before writing: a valid `name` matches
`[A-Za-z0-9][A-Za-z0-9._-]*` (bare filename — which excludes path separators, dot-segments,
NUL/control bytes, and spaces by construction), is not a Windows-reserved device basename
(`CON`/`PRN`/`AUX`/`NUL`/`COM1-9`/`LPT1-9`), does not end with a dot, and is unique within the
skill's declared set.
Validation SHALL run as a PREFLIGHT over every skill in the generation operation, as the
command's FIRST step — before any mutating operation, including permission probes, config
migration, legacy cleanup, workspace scaffolding, and every file write (`SKILL.md` included): an invalid or duplicate name fails the operation with an error
naming the offending template and reference, with no file written or modified anywhere in the
operation — never silently skipped, never written outside `references/`.

#### Scenario: Path-escaping name rejected

- **WHEN** a template declares a reference named `../evil.md` (or any name containing a path
  separator, `.`/`..` segment, or absolute path)
- **THEN** the operation fails preflight with an error identifying the template and the invalid
  name; no file has been written or modified — not even other skills' `SKILL.md`

#### Scenario: Duplicate names rejected

- **WHEN** a template declares two references with the same `name`
- **THEN** generation fails with an error identifying the duplicate; no partial write occurs

### Requirement: Generated references directories converge on init and update

The shared skill-writer SHALL reconcile each generated skill's `references/` directory to the
template's declared set whenever the skill is (re)generated — by `orbit init` (including
extend-mode re-runs) and by `orbit update` (including its legacy-upgrade path): write every
declared reference and remove undeclared entries, so the regenerated surface is byte-identical
to a fresh install at the current version. Smart update detection guarantees DECLARED-SET and
ROOT-SHAPE convergence on current-stamps projects; content of a same-name, user-edited declared
reference is restored only when regeneration actually runs (detected drift, `--force`, or a
version bump) — content tamper is deliberately outside detection scope. Reconciliation SHALL be scoped to entries within
`<skill-dir>/references/` only, SHALL treat every entry type uniformly (files, directories,
symlinks — an undeclared symlink is removed as an entry; its target is never touched and links
are never followed), and SHALL complete all declared writes successfully before any removal
begins.

#### Scenario: Declared references refreshed on update

- **WHEN** a template's reference content changes between CLI versions and `orbit update` runs
- **THEN** the on-disk reference file is overwritten with the current content

#### Scenario: Undeclared entries removed on update

- **WHEN** a generated skill's `references/` dir contains an entry the current template does not
  declare (a file, directory, or symlink — e.g., a reference renamed in a newer CLI version, or a
  user-parked file)
- **THEN** `orbit update` removes that entry (a symlink is removed as a link; its target is
  untouched), and reports the removal in its output; when the `references/` ROOT itself is
  removed or replaced, the report names the `references` path once (no malformed
  `references/references` double-suffix), and init additionally reports its written-reference
  count

#### Scenario: Re-run init reconciles too

- **WHEN** `orbit init` re-runs for an already-configured tool (extend mode) and a generated
  skill's `references/` contains an undeclared entry
- **THEN** the entry is removed and reported — reconciliation is a property of the shared
  skill-writer, identical for init and update

#### Scenario: Reference drift defeats smart update detection

- **WHEN** `orbit update` runs on a project whose version and config stamps are current, but a
  generated skill's `references/` is missing a declared file, contains an undeclared entry,
  exists at all for a reference-less skill, or is not a real directory (e.g., a symlinked root)
- **THEN** smart update detection treats this as drift and proceeds to generation/reconciliation
  rather than short-circuiting; declared-set and root-shape convergence hold without `--force`

#### Scenario: Symlinked skill directory is replaced before generation

- **WHEN** the skill-dir path itself is a symlink (or a stray regular file)
- **THEN** the writer replaces it with a real directory before writing `SKILL.md` or reconciling
  references — neither writes nor deletions ever route through the link; the link target keeps
  all of its content

#### Scenario: Declared-path collisions are replaced, never followed

- **WHEN** an existing entry at a DECLARED reference name is a symlink or a directory
- **THEN** the writer replaces it with the declared regular file without ever following the link
  (the symlink's target is untouched); replacing a non-regular declared entry is part of the WRITE
  phase — the write-before-prune ordering governs UNDECLARED-entry pruning only

#### Scenario: Write failure aborts pruning (staged commit)

- **WHEN** a declared-reference write fails partway through reconciliation
- **THEN** no pruning occurs, and every declared regular file retains either its prior content
  or its complete new content — never partial (declared content is staged to temp names and
  swapped in by rename; staging failures clean up their temp files and leave the surface
  untouched). Replacement of non-regular declared entries and of an invalid root is committed
  only at swap time

#### Scenario: Dropping all references removes the directory

- **WHEN** a newer CLI version's template declares no references for a skill that previously
  shipped some, and `orbit update` runs
- **THEN** the skill's `references/` directory is removed entirely (not left empty) — matching the
  fresh-init surface, which creates no `references/` dir for reference-less skills

#### Scenario: Reconciliation never escapes references/

- **WHEN** `orbit update` reconciles a skill's references
- **THEN** it deletes nothing outside `<skill-dir>/references/` — not the skill dir, not
  `SKILL.md`, not project files; containment is physical (symlinks are never followed), and if
  `references/` itself is a symlink it is replaced with a real directory before writing

### Requirement: Frontmatter metadata pass-through

`generateSkillContent()` SHALL emit every key of the template's `metadata` record into the
generated `SKILL.md` frontmatter `metadata:` block, in template-declared order. The generator
SHALL append `generatedBy: <CLI version>`; `generatedBy` is generator-owned: a template-declared
`generatedBy` is dropped from its declared position and the generator's value appears exactly
once, appended last. Metadata keys SHALL match `[A-Za-z][A-Za-z0-9_-]*` (rejecting integer-like
and YAML-significant keys preflight, like reference names — this also makes "declared order" and
JavaScript property-enumeration order identical). Values SHALL be emitted YAML-safe (quoted
whenever required) such that the parsed value is string-equal to the declared value.

#### Scenario: Arbitrary metadata keys survive generation

- **WHEN** a template declares `metadata: { author, version, capability: "orbit-review" }`
- **THEN** the generated frontmatter contains `author`, `version`, AND `capability: orbit-review`
  (no key is silently dropped)

#### Scenario: No fallback defaults — templates are the source of truth

- **WHEN** a template's `metadata` omits a key the legacy generator defaulted (e.g., `author`,
  `version`) or declares no `metadata` at all
- **THEN** the generated frontmatter `metadata:` block contains only the declared keys plus the
  generator-injected `generatedBy`; the generator emits NO fallback values (every current
  template declares `author` and `version` explicitly, so no generated output changes)

#### Scenario: Invalid metadata key fails preflight

- **WHEN** a template declares a metadata key that is integer-like (e.g., `"1"`) or contains
  YAML-significant characters (e.g., `a: b`)
- **THEN** the operation fails preflight with an error naming the template and key; no file is
  written

#### Scenario: generatedBy is generator-owned

- **WHEN** a template declares its own `generatedBy` metadata key
- **THEN** the generated frontmatter carries the generator-injected CLI version for `generatedBy`,
  not the template's value — exactly once, in the final position (the template's declared
  position is dropped)

