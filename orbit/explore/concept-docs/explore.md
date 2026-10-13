> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: concept-docs

## Premise

The stage `update-gh-documentation › concept-docs` rewrites five pages for orbit: `docs/concepts.md`,
`docs/customization.md`, `docs/supported-tools.md`, `docs/multi-language.md` and `docs/migration-guide.md`. Concepts
covers what orbit adds over OpenSpec (reviewed gates and the cadence, the blind pair and walks, emits and trails, the
architect tier, `orbit pr`), and the migration guide is rewritten for an adopter arriving FROM OpenSpec (goals G2,
G3). Exits: (1) the five pages pass docs-under-test's checks with no recorded exception; (2) every concept page claim
about orbit's behaviour names the capability that carries it; (3) the migration guide's steps are run once on a real
OpenSpec project and the run is recorded.

Measured 2026-10-12 (this session):

- **Size.** The five pages are 1,788 lines and about 59 KB: `concepts` 628 lines / 24.7 KB, `migration-guide` 595 /
  18.9 KB, `customization` 342 / 8.0 KB, `supported-tools` 108 / 5.7 KB, `multi-language` 115 / 2.2 KB. None mentions
  `orbit`. All five are what remains on `test/core/user-docs/pending-rewrite.json`.
- **Old names.** `openspec` occurs 21 / 28 / 55 / 3 / 73 times and `opsx` 6 / 0 / 26 / 0 / 43 times (concepts,
  customization, supported-tools, multi-language, migration-guide). The residue check admits the WHOLE of
  `docs/migration-guide.md` (`orbit-user-docs`' `The old name appears in the user docs only in four admitted
  places`), so nothing mechanical grades that page's names.
- **The migration guide is the wrong migration.** Today it is upstream's "Migrating to OPSX": legacy OpenSpec
  (`AGENTS.md`, `project.md`, phase-locked commands) to upstream's own 1.x workflow. Nothing in it covers moving from
  OpenSpec to orbit.
- **What an OpenSpec project looks like, measured.** Real projects made by `@fission-ai/openspec` 1.3.1 and 1.14.1
  (upstream's latest, `npm view`) with `init --tools claude` have the same layout: `openspec/{specs,changes,config.yaml}`
  (1.3.1 writes no `config.yaml`), `.claude/skills/openspec-*/` (10 skills on 1.3.1, 11 on 1.14.1, which adds
  `openspec-sync-specs`) and `.claude/commands/opsx/`. A change's `.openspec.yaml` is `schema: spec-driven` plus
  `created:`.
- **`orbit init` over such a project does not migrate it** (Case 1). Upstream's `openspec/` is left untouched, an empty
  `orbit/` is created beside it, and orbit's 15 skills install BESIDE upstream's (both `opsx/` and `orbit/` command
  dirs). `orbit list` reports no active changes while the user's change sits in `openspec/changes/`. Nothing warns.
  The engine's directory name is one constant, `OPENSPEC_DIR_NAME = 'orbit'` (`src/core/config.ts`), and
  `src/core/legacy-cleanup.ts` detects only PRE-1.0 OpenSpec artifacts (`.claude/commands/openspec/`, `AGENTS.md`,
  `openspec/project.md`), never the 1.x `openspec-*` skills or `opsx/` commands.
- **A manual migration works** (Case 1): delete `.claude/skills/openspec-*` and `.claude/commands/opsx/`, `git mv
  openspec orbit`, run `orbit init --tools claude`. The existing `config.yaml` is kept, `orbit list` shows the change,
  `orbit status --change` renders it under spec-driven's gates, and `orbit validate --all` passes the spec.
- **The global config directory is shared.** orbit still reads and writes `~/.config/openspec/` (the
  `GLOBAL_CONFIG_DIR_NAME` constant), so an adopter who keeps upstream installed shares one global config file between
  the two tools.
- **No capability carries inherited behaviour.** All 28 baseline capabilities are `orbit-*`; the spec format, deltas,
  schemas, `config.yaml`, and archive's merge (all upstream's) have no capability in `orbit/specs/`. The concept and
  customization pages are mostly about exactly that behaviour.
- **Tool breadth.** `orbit init --tools` still accepts upstream's whole tool list (amazon-q … cursor … gemini …), while
  orbit's targets are Claude (primary) and Codex (fork-and-orbify D11 and its Claude-primacy refinement).
  `docs/supported-tools.md` is upstream's table of all of them.

- **Out of stage: the tracked gate and `list` count tasks with different grammars.** The gate's `countCheckboxes`
  (`src/core/artifact-graph/gates.ts`) matches `- [x]` / `- [ ]` by regex, while `list` reads tasks through its own
  parser; Case 2 shows them disagreeing on indented sub-tasks. Not this stage's to fix; noted for whatever change owns
  the task grammar.

## Mechanism

### D-cd-7 — every H2 section of four concept pages declares its owner on a checked `Carried by:` line
Domain: what the CARRIED-BY CHECK meets on `docs/concepts.md`, `docs/customization.md`, `docs/supported-tools.md` and `docs/multi-language.md`, read as the README claims check reads (a markdown-it parse, fences never structure)
| member | covered by |
|---|---|
| an H2 section with exactly one `Carried by:` line whose every item resolves | passes |
| an item that is a whole `orbit-*` name (the claims check's `<name>` production) | resolves when `orbit/specs/<name>/spec.md` exists |
| an item `fork-and-orbify D<n>` | resolves when `orbit/architecture/fork-and-orbify.md` has the heading `### D<n> — ` |
| the item `the 1.3.1 baseline` | resolves always: D-cd-3's inherited row |
| any other item, or a `Carried by:` line with no item | fails, naming the line and the item |
| an H2 section with no `Carried by:` line, or with two | fails, naming the heading's line |
| an H2 section whose body is only list items that are each a single link (Related, See also, Next steps) | exempt: navigation makes no claim |
| content before the first H2 (the page's one prose attribution, D-cd-3) | not read |
| H3 and deeper sections | not read: they belong to their H2 |
| a `Carried by:` line inside a fence | not read |
| `docs/migration-guide.md` | not read: it describes OpenSpec and gives instructions (D-cd-3's last two rows) |
| `README.md` | not read: the improvement-claims check owns it |
Closure: SOURCED — the parse yields the H2 sections; the item grammar is the three forms above and nothing else
Moves:
- READ: applied — the claims check's `<name>` production and markdown-it reading (`orbit-user-docs`); fork-and-orbify's decisions are `### D<n> — ` headings (15 of them, `D12` and `D15` among them)
- ENUMERATE: applied — this table
- COHERE: applied — the three item forms are D-cd-3's first three rows plus its inherited row; `the 1.3.1 baseline` keeps the line clear of the residue check, which would refuse the word OpenSpec on these pages
- EXECUTE: not applied — no code yet; the change's test runs each row, and a probe at propose runs the procedure over a draft page
- FALSIFY: applied — the check reads a DECLARATION, never its truth: a section can name a capability that does not carry it, or claim `the 1.3.1 baseline` for behaviour orbit changed (D-cd-3's residual); the system review owns both, as it owns the README claims (R-crc-11)
- CONFORM: applied — R-crc-11 (the engine observes the line and the names; truth is a record), R-crc-14 (the `<name>` production is named, not restated), D-cd-3
- FEASIBILITY: not applied — four pages, a few dozen sections
- CONSUME: applied — exit (2) is graded by this check passing plus the system review's reading; a new file-local check joins `orbit-user-docs`' list of file-local checks (a MODIFIED or ADDED requirement)
- INVOKE: applied — `npm test`, once the four pages leave the pending-rewrite list

### D-cd-8 — `docs/supported-tools.md` lists every init target in two tiers, held to `AI_TOOLS` by a test
Domain: the 29 entries of `AI_TOOLS` (`src/core/config.ts`)
| member | covered by |
|---|---|
| `claude` | tier 1 — designed for (fork-and-orbify D11 and its Claude-primacy refinement); the generated-surface test runs a real init for it |
| `codex` | tier 1 — the same test; the page states the directories orbit writes (`.codex/`, the global prompts), not upstream 1.14's `.agents/skills/` (Case 2, item 10) |
| the 26 other available tools | tier 2 — generated from the same templates into OpenSpec 1.3.1's directories, never tested by orbit |
| `agents` (`available: false`) | not listed: no init target |
| the 23 tools upstream added after 1.3.1 | not listed here; the migration guide's table (D-cd-5) |
Closure: SOURCED — `AI_TOOLS` is the list `orbit init --tools` accepts
Moves:
- READ: applied — 29 entries, 28 available, `agents` the one unavailable (read from `dist/core/config.js`); `test/core/templates/orbit-generated-surface.test.ts` runs the claude + codex init
- ENUMERATE: applied — this table
- COHERE: applied — tier 1's sections carry `orbit-skill-generation` on D-cd-7's line; tier 2's carry `the 1.3.1 baseline`
- EXECUTE: not applied — no test yet
- FALSIFY: applied — a tool can be generated and still not work in that tool (a path upstream later moved); tier 2 says "untested" rather than "supported" for exactly this reason
- CONFORM: applied — D11 and its refinement (Claude primacy, Codex second); R-crc-14 (the tool list is read from `AI_TOOLS`, never restated in the test); reference-docs' D-rd-1 shape (a coverage test reading the code's own list)
- FEASIBILITY: not applied — 29 lookups on one page
- CONSUME: applied — `docs/commands.md` links this page for Codex (reference-docs' carried-forward note)
- INVOKE: applied — `npm test`; a tool added to `AI_TOOLS` without a row fails the suite

### D-cd-5 — the migration guide carries a "before you move" checklist, one command per hazard
Domain: the hazards Case 2 lists, each disposed of by one checklist line or one row of the "what orbit does not have" table
| member | covered by |
|---|---|
| task markers `+ [ ]`, `* [ ]`, `- [~]`, `- [ x]`, numbered `1. [ ]`, indented sub-tasks (Case 2, item 1) | a `grep -rnE` over `openspec/changes/*/tasks.md`; the fix is to rewrite them as `- [ ]` / `- [x]` |
| `skip_specs`, `retire_capabilities`, `goal`, `affected_areas`, `initiative` in `.openspec.yaml` (item 2) | a `grep -rlE` over the changes' `.openspec.yaml`; finish or archive those changes under upstream first |
| nested capability paths (item 3) | a `find openspec/specs -mindepth 3 -name spec.md`; flatten first |
| a delta `## Purpose` (item 4) | a `grep -l` over `openspec/changes/*/specs/*/spec.md`; after archive, replace the TBD Purpose by hand |
| `store:` / `defaultStore` (item 5) | a `grep` over `openspec/config.yaml`; a store-backed project cannot move without its specs in the repository |
| numeric-prefixed or dated change names (item 6) | an `ls openspec/changes` filter; rename before moving |
| a closing `###` on a requirement heading; `*`/`+` bullets under REMOVED or RENAMED (item 7) | a `grep -rnE` over every `spec.md`; rewrite to 1.3.1's forms |
| the old `openspec-*` skills and `/opsx:` commands (item 8) | the move steps themselves (Case 1), and D-cd-2's warning |
| `operations`, `githubCopilot` keys and unknown metadata keys (item 9) | a `grep -nE` over `config.yaml`; the table says they are ignored |
| tools added after 1.3.1, and newer tool directories (item 10) | the table, pointing at `docs/supported-tools.md` |
| commands, flags and `--json` fields orbit lacks (item 11) | the table |
Closure: BOUNDED — Case 2 is one changelog read and one run against 1.14.1, and upstream keeps releasing
Residual kind: a post-1.3.1 on-disk form Case 2 missed (its four unverified items: brace or extglob `generates`, symlinked schema directories, `.openspec-workspace/`, Copilot cloud-agent files) or one upstream ships after 1.14.1
Residual method: exit (3)'s recorded run on a 1.14.1 project (D-cd-6) for the first; for the second, the guide names the upstream version it was measured against, and a later stage re-reads upstream's changelog from there
Moves:
- READ: applied — the two re-checked claims (Case 2); the rest are the subagent's runs, which exit (3)'s run re-executes
- ENUMERATE: applied — this table, one row per Case 2 item, each with a check or a table row
- COHERE: applied — the checklist runs BEFORE the move steps (Case 1), so it reads `openspec/` paths, and the move steps never undo what it fixed
- EXECUTE: not applied — the commands are not written yet; exit (3)'s run executes each against a fixture (D-cd-6)
- FALSIFY: applied — a grep finds a form, never a meaning: a change whose tasks read correctly under both tools still passes; the checklist proves only that no known hazard form is present
- CONFORM: applied — R-ugd-3 (no code beyond D-cd-1), R-ugd-1 (the guide is the admitted place for `openspec` paths), orbit's purpose (report what breaks; never block)
- FEASIBILITY: not applied — about ten commands
- CONSUME: applied — the docs' tool inventory judges every command head, so `grep`, `find` and `ls` must be declared in `orbit-user-docs`' `docs-inventory` fence (today `utility: npm cd`), a MODIFIED delta of that capability; the residue check admits the whole guide, so its `openspec/` paths pass
- INVOKE: applied — the adopter runs it once, before moving; exit (3) runs it once on record

### D-cd-3 — exit (2) ranges over what orbit adds or changes; inherited behaviour is attributed once per page
Domain: what a sentence on the five pages can describe, by whose behaviour it is
| member | covered by |
|---|---|
| behaviour orbit ADDED (gates and cadence, the blind pair, walks, emits and trails, orientation, the architect tier, `orbit pr`, fingerprints, consent, size, the scenario map …) | names the `orbit-*` capability that carries it |
| inherited behaviour orbit CHANGED, where a capability states the change (archive's divergence guard, the modified explore, propose, verify and archive bodies, apply's tracked gate) | names that capability (`orbit-base-fingerprints`, `orbit-*-modifications`, `orbit-engine-gates`, `orbit-skill-generation`) |
| inherited behaviour orbit CHANGED where no capability states it: telemetry removed (fork-and-orbify D12), the user-facing names (D13), every workflow installed regardless of profile (D15; `orbit-architect` only mentions it in passing) | cites the fork-and-orbify decision by ID; never presented as a capability |
| inherited behaviour orbit did NOT change (the spec and delta format, schemas and their resolution, `config.yaml` context and rules, the archive merge itself) | the page's ONE attribution to the OpenSpec 1.3.1 baseline; no capability owed |
| statements about OpenSpec itself (what an adopter has, what upstream added after 1.3.1) | not orbit's behaviour; R-ugd-1's migration exception |
| instructions (run this, write that) | not a claim about behaviour; the `orbit`, `git`/`gh` and inventory sweeps grade them |
Closure: BOUNDED — which inherited behaviours orbit changed is not a closed list; three uncarried ones are named here, found by grepping the specs for the fork plan's decisions
Residual kind: an orbit change to inherited behaviour that no capability states and that is not D12, D13 or D15, so a page could present it as inherited or as a capability claim
Residual method: diff the page's claim against the upstream `1.3.1` tag (`git diff upstream/v1.3.1 -- <path>`) when the system review reads the page for orbit behaviour
Moves:
- READ: applied — all 28 baseline capabilities are `orbit-*` (`ls orbit/specs`); no spec states telemetry removal, and D15 appears only as one clause in `orbit-architect`
- ENUMERATE: applied — this table, by whose behaviour a sentence describes
- COHERE: applied — the baseline-attribution row and R-ugd-1's admitted places do not overlap: the attribution names OpenSpec only in the comparison and migration exceptions, or calls it "the 1.3.1 baseline"
- EXECUTE: not applied — no page is written yet; the check or the review (Q-cd-2) runs the rows
- FALSIFY: applied — a sentence can describe changed behaviour as inherited (the archive merge is upstream's, its guard is orbit's); hence the second row, and the residual
- CONFORM: applied — the charter's own "what orbit adds over OpenSpec"; R-crc-12 (a reading of the exit's terms, recorded before the test, never a silent narrowing); G2 (claims are carried)
- FEASIBILITY: not applied — one attribution per page
- CONSUME: applied — Q-cd-2's mechanism reads only the first three rows
- INVOKE: applied — when each page is written, and when exit (2) is graded at the stage's archive

### D-cd-2 — `orbit init` warns when an OpenSpec project directory sits beside it
Domain: the project states `orbit init` can start in, by the two directories it can see
| member | covered by |
|---|---|
| no `openspec/` | silent |
| `openspec/` holding `specs/` or `changes/`, no `orbit/` (the first init over an OpenSpec project) | WARN, then proceed |
| `openspec/` holding `specs/` or `changes/`, `orbit/` present (Case 1's side-by-side state) | WARN, then proceed |
| `openspec/` holding neither `specs/` nor `changes/` (a directory that is not an OpenSpec project) | silent |
| a pre-1.0 OpenSpec project (`openspec/AGENTS.md`, `openspec/project.md`) | WARN as above when it holds `specs/` or `changes/`; the existing legacy cleanup still runs beside it |
Closure: SOURCED — upstream's project directory is the fixed constant `OPENSPEC_DIR_NAME = 'openspec'` in 1.3.1 (the root commit) and in every npm release read here (1.3.1, 1.14.1), and `specs/` and `changes/` are the two directories its init creates
Moves:
- READ: applied — the constant read in the root commit's `src/core/config.ts` and in the npx-cached upstream builds; Case 1 shows init's two subdirectories
- ENUMERATE: applied — this table, over the two directories init can observe
- COHERE: applied — the warning is a report beside `handleLegacyCleanup`, which deletes pre-1.0 files; the two never act on the same path
- EXECUTE: not applied — no code exists yet; the change's test runs each row
- FALSIFY: applied — the 1.x `openspec-*` skills and `opsx/` commands are not detected on their own; the message names them for deletion, and a user who moved `openspec/` but kept them gets no warning (the guide's steps cover it)
- CONFORM: applied — R-ugd-3 needs a carve-out for this code, as R-ugd-10 was for `orbit feedback` (D-cd-1); orbit's purpose (report and record, never a hard block) is why it proceeds rather than stopping
- FEASIBILITY: not applied — two directory probes
- CONSUME: applied — a person reads it; the message names the migration guide, which this stage writes, and the guide's steps are exit (3)'s rehearsal
- INVOKE: applied — every `orbit init`, interactive and not, before the directory structure is created

### Case 1 — `orbit init` over real OpenSpec projects (2026-10-12)

In the session scratchpad, `npx @fission-ai/openspec@1.3.1` and `@1.14.1` each ran `init --tools claude` and `new
change add-login` in a fresh git repository, plus a hand-written `openspec/specs/auth/spec.md`, committed. Then
`node bin/orbit.js init --tools claude` from this repo's build: both projects ended with `openspec/` and `orbit/` side by
side, 10 or 11 `openspec-*` skills beside 15 `orbit-*` skills, `opsx/` beside `orbit/` commands, and `orbit list` read
"No active changes found." On the 1.14.1 project, reset, then `rm -rf .claude/skills/openspec-* .claude/commands/opsx`,
`git mv openspec orbit`, `orbit init --tools claude`: config kept ("exists"), `orbit list` shows `add-login`, `orbit
status --change add-login` renders the spec-driven gates, `orbit validate --all` passes `spec/auth`.

### Case 2 — a 1.14.1 project moved into orbit (2026-10-12, subagent run, two claims re-checked)
A subagent built a project with upstream 1.14.1 (`init --tools claude --language Spanish`) plus fixture changes that pass
upstream's `validate --strict`, copied it, renamed `openspec/` to `orbit/`, and ran orbit's `validate --strict`,
`list`, `status`, `instructions`, `archive -y`, `new change` and `init`, beside the 1.4.0–1.14.1 changelog (239
entries; about 175 are fixes with no migration step). Re-checked in this session by reading the code: the tracked gate's
`countCheckboxes` (`src/core/artifact-graph/gates.ts`) matches only `- [x]` and `- [ ]`, and `ChangeMetadataSchema`
(`src/core/artifact-graph/types.ts`) is a plain zod object, which strips unknown keys. What an adopter hits, most
consequential first:
1. **Tasks read as done when they are not.** `+ [ ]`, `- [~]` and indented sub-tasks show complete in `list` or let the
   apply gate pass; numbered `1. [ ]` lists show "No tasks". Silent.
2. **`skip_specs: true` (1.7.0) and `retire_capabilities: true` (1.8.0) are dropped** without a warning: the first change
   fails `validate` ("must have at least one delta"), the second aborts `archive`, writing nothing.
3. **Nested capability paths** (`specs/<area>/<cap>/spec.md`, 1.7.0): a delta reads as "No deltas found"; a baseline is
   skipped by validation.
4. **A delta's `## Purpose`** (1.7.0) passes `validate`, and `archive` writes the TBD placeholder instead.
5. **Store-backed projects** (`store:`, `defaultStore`, 1.5.0+) see no specs; there are no `store` commands.
6. **Numeric-prefixed change names** (`001-x`, 1.7.0) are refused by `status` and `new change`; a dated name is
   archived with the date stacked.
7. **Newer spec syntax**: a closing `###` on a requirement heading (1.13.1) aborts `archive`; `*`/`+` bullets under
   REMOVED or RENAMED (1.13.0) fail `validate`.
8. **The old `openspec-*` skills and `/opsx:*` commands stay installed** beside orbit's and still call `openspec` (Case 1).
9. **Config degraded silently**: `operations.*.guidance` and `githubCopilot.cloudAgent` (1.7.0, 1.8.0) are ignored, and
   unknown metadata keys no longer warn (upstream warns since 1.14.0). `--language` (1.10.0) works, through `context:`.
10. **Tools**: 23 tools added after 1.3.1 have no orbit target; Codex, Antigravity, Devin and Kilo land in 1.3.1's
   directories (orbit writes `.codex/`, not `.agents/skills/`).
11. **Commands and fields scripts may use**: `/opsx:update`, `instructions archive`, `status --all`, `list --archived`,
   `show --diff`, `version`, `doctor`, and newer `--json` fields.
Custom `schema.yaml` files carry over (no new fields since 1.3.1). Not verified: brace or extglob `generates`, symlinked
schema directories, `.openspec-workspace/`, Copilot cloud-agent files.

## Decisions

- **2026-10-12 — D-cd-1: the stage adds an `orbit init` warning for OpenSpec projects** (Sal: b, resolving Q-cd-3).
  Case 1 shows `orbit init` silently builds an empty `orbit/` beside an OpenSpec project. The stage documents the manual
  migration AND adds a warning, rather than documentation alone or a migrate command. It is code, so it needs a carve-out
  from R-ugd-3 recorded as a program ruling in an architect session, as R-ugd-10 was for `orbit feedback`.
  Kind: scope
- **2026-10-12 — D-cd-2: `orbit init` warns when an OpenSpec project directory sits beside it, and proceeds.** The trigger
  is `openspec/` holding `specs/` or `changes/`, whether or not `orbit/` exists. The message names the manual steps
  (delete the `openspec-*` skills and `opsx/` commands, `git mv openspec orbit`, re-run init) and points at the
  migration guide. Never a prompt or a stop. Method settled by the AI under Sal's delegation.
  Kind: rule
- **2026-10-12 — D-cd-3: exit (2)'s "claim about orbit's behaviour" means what orbit adds or changes** (Sal: the
  recommendation, resolving Q-cd-1). Inherited 1.3.1 behaviour orbit leaves alone is attributed once per page to the
  OpenSpec 1.3.1 baseline and owes no capability. An orbit change to inherited behaviour names the capability that
  states it, or, where none does (D12 telemetry, D13 names, D15 full surface), cites the fork-and-orbify decision. This
  is a reading of the exit's terms, recorded now so the exit is graded against it at archive, not narrowed then.
  Kind: rule
- **2026-10-12 — D-cd-4: an OpenSpec 1.4–1.14 project is NOT a drop-in for orbit** (resolving Q-cd-4). Case 2 lists
  eleven ways a 1.14.1 project breaks or degrades in orbit's 1.3.1 engine, five of them silent (task markers, dropped
  metadata keys, the Purpose placeholder, ignored config, unknown keys not warned). A 1.3.1 project moves cleanly
  (Case 1).
  Kind: fact
- **2026-10-12 — D-cd-5: the migration guide carries D-cd-4 as a "before you move" checklist plus a table of what orbit
  lacks** (Sal: the recommendation, resolving Q-cd-6). One command per hazard (a `grep`, `find` or `ls`), run against
  `openspec/` before the move; the guide names the upstream version it was measured against (1.14.1). No code beyond
  D-cd-1's warning.
  Kind: rule
- **2026-10-12 — D-cd-6: exit (3) runs on a fresh upstream 1.14.1 project carrying one fixture per checklist hazard**
  (Sal: the recommendation, resolving Q-cd-7). The run is the checklist, the fixes, the move steps and orbit's
  `validate`/`status`/`list` afterwards, recorded as an observed transcript.
  Kind: scope
- **2026-10-12 — D-cd-7: exit (2) is a CHECK — a `Carried by:` line on every H2 section of four concept pages** (Sal:
  the recommendation, resolving Q-cd-2). Items are an `orbit-*` capability, a `fork-and-orbify D<n>` decision, or
  `the 1.3.1 baseline`, each resolved; navigation-only sections are exempt; the migration guide is not read. The check
  reads the declaration; whether the named owner carries the section stays the system review's record.
  Kind: rule
- **2026-10-12 — D-cd-8: `docs/supported-tools.md` has two tiers, held to `AI_TOOLS` by a test** (Sal: the
  recommendation, resolving Q-cd-5; the recommendation was formed in the resolving turn, not stated earlier). Tier 1:
  Claude and Codex, designed for and tested. Tier 2: the other 26 available tools, generated into OpenSpec 1.3.1's
  directories and untested by orbit. A test fails when an available tool has no row or the unavailable one has one.
  Kind: rule

## Open questions

- **Q-cd-8 — does orbit take selected upstream fixes before the repository goes public?** D-cd-4 shows a 1.14.1 project
  degrades silently in orbit's 1.3.1 engine (task markers, two metadata keys, the Purpose placeholder). A docs page can
  only warn. Cherry-picking upstream fixes is engine work and a program-level scope call, not this stage's.
  Standing recommendation: raise it in an architect session as a program question for update-gh-documentation, before
  public-readiness; this stage ships the checklist (D-cd-5) either way.

## Considered & out

- **2026-10-12 — the same warning in `orbit update`.** `update` would reach a user who ran `init` once before the
  warning shipped and later upgrades. Out (Sal: init only): the warning stays on one command, and the migration guide
  covers a project already in the side-by-side state.

## References

- `orbit/architecture/update-gh-documentation.md` — the program; the concept-docs stage, R-ugd-1..10.
- `orbit/specs/orbit-user-docs/spec.md` — the residue check (four admitted places) and the README improvement-claims check.
- `orbit/changes/archive/2026-10-13-reference-docs/explore.md` — the previous docs stage's exploration (shape, D-rd-1's coverage rule).
- `src/core/config.ts` (`OPENSPEC_DIR_NAME`), `src/core/legacy-cleanup.ts`, `src/core/global-config.ts`.
