## MODIFIED Requirements

### Requirement: Frontmatter metadata pass-through

`generateSkillContent()` SHALL emit every key of the template's `metadata` record into the
generated `SKILL.md` frontmatter `metadata:` block, in template-declared order. The generator
SHALL append `generatedBy: <CLI version>`; `generatedBy` is generator-owned: a template-declared
`generatedBy` is dropped from its declared position and the generator's value appears exactly
once, appended last. Metadata keys SHALL match `[A-Za-z][A-Za-z0-9_-]*` (rejecting integer-like
and YAML-significant keys preflight, like reference names — this also makes "declared order" and
JavaScript property-enumeration order identical). Values SHALL be emitted YAML-safe (quoted
whenever required) such that the parsed value is string-equal to the declared value. Every other frontmatter value
SHALL be emitted by the same rule, so the whole frontmatter parses as YAML, and each template's `description` SHALL be
at most 1,024 characters and SHALL say what the skill does and when to use it:

| frontmatter value | how it is written |
|---|---|
| `name` | YAML-safe; a kebab-case name is plain and stays bare |
| `description` | YAML-safe, so a description containing `: ` is quoted rather than read as a mapping; at most 1,024 characters; says what the skill does and when to use it |
| `license` | YAML-safe |
| `compatibility` | YAML-safe |
| each `metadata` value other than `generatedBy` | YAML-safe, as above |
| `metadata.generatedBy` | always quoted |

The table is sourced from the frontmatter `generateSkillContent()` writes: those are every value it emits. Before
`tighten-bodies` (`reduce-orbit-phase1`) the description was written bare, and the three descriptions containing `: `
(address-reviews', architect's and review's) did not parse as YAML; that change also cut address-reviews' description
from 1,140 characters and gave architect's and onboard's a when-clause.

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

#### Scenario: A description containing a colon parses

- **WHEN** a template's `description` contains `: ` (as review's "an orbit change or an architecture doc: proposal
  mode" does)
- **THEN** the generated `SKILL.md` frontmatter parses as YAML, and its parsed `description` is string-equal to the
  declared value

#### Scenario: Every generated frontmatter parses and every description fits

- **WHEN** every skill is generated
- **THEN** each `SKILL.md` frontmatter parses as YAML with a strict parser, each `description` is at most 1,024
  characters, and each says what its skill does and when to use it

#### Scenario: A plain value stays bare

- **WHEN** a frontmatter value is plain (a kebab-case `name` such as `orbit-apply-change`, `license: MIT`)
- **THEN** it is written bare, exactly as before


## ADDED Requirements

### Requirement: Reference files are linked from their skill and long ones open with contents

Every reference file a skill ships SHALL be named by that skill's `SKILL.md` — by its path `references/<name>`, or,
for review's pass files, by the pattern `references/passes-<mode>.md` — so no reference is reached only through
another reference; and every reference file over 100 lines SHALL open, after its `# Reference:` title line, with a
`## Contents` section listing the file's sections, each entry naming a heading the file carries. The list is written
in the reference's source, once for a file several skills ship; it is never generated from the file's headings,
because a file may carry headings that belong to text it holds (`prompt-template.md`'s `## CRITICAL` to `## Notes`
are the prompt's, so its list names the template as one section). The files it covers when `tighten-bodies`
(`reduce-orbit-phase1`) introduced it:

| member | covered by |
|---|---|
| `decision-records.md` (111 lines, all fourteen skills that carry it) | a contents list after its title |
| address-reviews' `external-findings-format.md` (128), `internal-findings-format.md` (191), `resolution-detail.md` (190), `run-summary-schema.md` (476) | the same |
| archive's `archive-summary-schema.md` (138) | the same |
| propose's and ff's `pr-choreography.md` (108) | the same, before its `Where each phase runs` section |
| review's `blind-pair.md` (119), `external-handoff.md` (332), `prompt-template.md` (134), `run-summary-schema.md` (262) | the same; `prompt-template.md`'s list names the template as one section |
| a reference that later grows past 100 lines | the suite fails until it gains a list |
| review's `prompt-template.md` and `mode-sections.md`, reached before only through `external-handoff.md` | named by review's `SKILL.md` in its `--reviewer external` flag row |

The table is sourced from the per-reference line counts of a project generated at `a5ba0f0c`, and the test over
every generated reference covers the files that later cross 100 lines.

#### Scenario: Review's body names its prompt references

- **WHEN** the review skill is generated
- **THEN** its `SKILL.md` names `references/prompt-template.md` and `references/mode-sections.md`, and every other
  skill's `SKILL.md` names every reference file it ships

#### Scenario: A long reference opens with its contents

- **WHEN** a generated reference file runs over 100 lines
- **THEN** its first section after the `# Reference:` title is `## Contents`, and each entry names a heading the file
  carries

#### Scenario: A reference with no contents list fails the suite

- **WHEN** a reference file grows past 100 lines without a `## Contents` section, or its list names a section the file
  lacks
- **THEN** the suite fails naming the file
