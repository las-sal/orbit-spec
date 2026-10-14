## MODIFIED Requirements

### Requirement: Canonical-flow walkthrough section

Section 3 of the body SHALL present orbit's canonical workflow as a diagram followed by one paragraph per phase. The workflow is architect-first: the architect phase comes before the per-change flow, which runs once per stage, and the paragraph for it states that an architect session is never required — explore and new remain the path for a one-off fix.

#### Scenario: Flow diagram

- **WHEN** the Canonical-flow section is read
- **THEN** a diagram (ASCII or equivalent markdown) shows the architect phase first and then the per-change phases in order: explore → propose → review → address-reviews → apply → verify → review --as system → address-reviews → archive

#### Scenario: One paragraph per phase

- **WHEN** the Canonical-flow section is read
- **THEN** each phase has one paragraph describing its purpose, the primary `/orbit:*` command that drives it, and the typical output the user sees

#### Scenario: Lenses introduced contextually

- **WHEN** the Canonical-flow section is read
- **THEN** lenses (`perspectives.md` + `critical-paths.md`) are introduced in the explore-phase paragraph (where they are captured) and re-referenced in the review-phase paragraphs (where system-mode review consults them)

#### Scenario: External-review named, not demoed

- **WHEN** the review / address-reviews phase paragraphs are read
- **THEN** the external-review loop is named (`/orbit:review --reviewer external`) with a one-paragraph description and a pointer to the review skill's `references/external-handoff.md` for details; no bundled sample prompt and no simulated cross-AI exchange is rendered in the body

#### Scenario: PR lifecycle taught where it happens

- **WHEN** the Canonical-flow section is read in a project where the PR layer is available (per `orbit-pr-lifecycle`)
- **THEN** the PROPOSE-phase paragraph names the draft PR that opens there and the ARCHIVE-phase paragraph names the tail (commit → push → landmark description → READY) — the lifecycle is taught at the two seams where it acts, not as a separate feature tour; the teaching is UNCONDITIONAL on the reading project's own `pr:` value (the body is a generated constant, identical in every project, so it describes the capability and names `never` as the default rather than branching on config)

#### Scenario: Config vocabulary and the human boundary stated once

- **WHEN** the PR-lifecycle teaching is read
- **THEN** it states, in the propose-phase paragraph or an adjacent one: the three `pr:` values (`never` — the default and today's behavior — `per-proposal`, `per-architecture`) and where the key lives (`orbit/config.yaml`); that under `per-architecture` a change's `architecture:` citation selects its target, with uncited changes falling back to their own PR; that READY is orbit's terminus and MERGING IS THE USER'S ACT; and that the layer degrades to `never` with one note when there is no remote or no `gh`

### Requirement: Try-it nudge section

Section 5 of the body SHALL conclude with two closing recommendations covering both audiences: users with a concrete project idea AND users orienting without one yet.

#### Scenario: Named-mode recommendation for concrete-idea users

- **WHEN** the Try-it nudge section is read
- **THEN** one recommendation is "If you have a concrete project idea, run `/orbit:architect <name>`"; it does not use "for practice" / "try a demo" framing (no synthetic-change creation)

#### Scenario: Bare-mode recommendation for orientation-only users

- **WHEN** the Try-it nudge section is read
- **THEN** a second recommendation is "If you're just orienting, run `/orbit:explore` (no name)" — bare-mode explore as a no-commitment entry, preserving the no-demo-change discipline
