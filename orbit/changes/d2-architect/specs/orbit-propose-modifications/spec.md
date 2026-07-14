## MODIFIED Requirements

### Requirement: Move staging directory to changes

The system SHALL move `orbit/explore/<name>/` to `orbit/changes/<name>/` after generating the artifacts, with the staged metadata MERGED — never bulk-moved: `orbit new change` has already written the change's `.openspec.yaml` (schema, created, schema_version), so the staged `orbit/explore/<name>/.openspec.yaml` (when present, per `orbit-explore-modifications`) is handled explicitly BEFORE the content move — its `architecture:` citation (and any other explore-side fields future capabilities add) carries forward into the change's metadata via the read/write helpers; the change's fresh `schema`/`created`/`schema_version` win; the staged metadata file itself is then discarded so the bulk move can never clobber the change's metadata (precedent: `.orbit-runs/` is already moved explicitly for the same dotfile-glob reason).

#### Scenario: Standard move

- **WHEN** consume mode completes artifact generation successfully
- **THEN** the contents of `orbit/explore/<name>/` (including `explore.md` and any sibling files like `sketches/`) are moved into `orbit/changes/<name>/`; the source staging directory no longer exists

#### Scenario: Citation carries forward by merge

- **WHEN** the staged `.openspec.yaml` carries `architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}` and consume-mode propose completes
- **THEN** the change's `.openspec.yaml` contains that citation alongside its fresh `schema`/`created`/`schema_version`, written through the metadata helpers (never by file overwrite)

#### Scenario: Conflicting citations — staged metadata is authoritative

- **WHEN** the freshly-created change metadata already carries an `architecture:` value (manual edit or future scaffold behavior) that differs from the staged metadata's citation
- **THEN** the staged citation wins (the exploration's citation is the captured decision; the merge is deterministic and loss-free) and the merge step notes the override in chat

#### Scenario: No staged metadata, no merge step

- **WHEN** the staging directory has no `.openspec.yaml` (a pre-D2 exploration)
- **THEN** the move proceeds exactly as before this capability; the change's metadata is untouched

#### Scenario: Generated artifacts coexist with moved content

- **WHEN** the move completes
- **THEN** `orbit/changes/<name>/` contains both the moved exploration files (`explore.md`, `sketches/`, etc.) AND the generated artifacts (`proposal.md`, `design.md`, `specs/`, `tasks.md`)
