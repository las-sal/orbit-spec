> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: openspec-path-fix

## Premise

Issue #30. The artifact instructions orbit serves at propose (`orbit instructions <artifact>`, read from
`schemas/spec-driven/schema.yaml`) point the agent at `openspec/specs/`, a directory an orbit project does not have:
orbit's baseline lives in `orbit/specs/`. Four lines carry it: `schema.yaml:17` (proposal: "Check `openspec/specs/`
for existing spec names"), `schema.yaml:39` and `:55` (specs: the existing folder name, and "Locate the existing
requirement in openspec/specs/<capability>/spec.md"), and `templates/proposal.md:18`. These are the only places the
propose flow tells the agent to read the baseline, so they point it at nothing; #29's transcript scan found 30% of
modified capabilities' specs unread at propose.

Why the existing check missed it: `orbit-cli-name`'s file scan matches `OpenSpec` and `Openspec` case-sensitively, so
a lowercase path passes. cli-says-orbit (2026-10-14) edited `schema.yaml`'s description under that rule and left the
paths.

What this exploration must settle: the fix's reach (the four lines alone, or a rule that keeps lowercase path residue
out of what the package ships), and where that rule's owner is.

## Mechanism

### D-opf-1 — `orbit-cli-name`'s scan reads `schemas/**` case-insensitively
Domain: every file under `schemas/**` the shipped-file walk returns
| member | covered by |
|---|---|
| `schemas/spec-driven/schema.yaml` | the case-insensitive scan; its three `openspec/specs/` paths fixed first |
| `schemas/spec-driven/templates/proposal.md` | the case-insensitive scan; its one path fixed first |
| `schemas/spec-driven/templates/design.md` | the case-insensitive scan; no occurrence today |
| `schemas/spec-driven/templates/spec.md` | the case-insensitive scan; no occurrence today |
| `schemas/spec-driven/templates/tasks.md` | the case-insensitive scan; no occurrence today |
Closure: SOURCED — `find schemas -type f` on 2026-10-17 lists exactly these five, and the scan's own walk over `schemas/**` is the set, so a schema file added later is in the domain without an edit here
Moves:
- READ: applied — `test/helpers/cli-name.ts:14` is `PATTERN = /OpenSpec\|Openspec/g`, and `occurrences` reads every line of a non-`.ts` file; the requirement's table lists `schemas/**` as "the source scan, over every line"
- ENUMERATE: applied — this table; a grep of `schemas/` for lowercase `openspec` finds only the four paths
- COHERE: applied — the admitted list is unchanged and needs no entry: no schema line carries a kept name today, so case-insensitivity and exactness do not collide
- EXECUTE: not applied — no code yet; at apply, the suite run over the unfixed four lines must report four residues, and over the fixed ones none
- FALSIFY: applied — the purpose is that the served instructions never name OpenSpec's directory; a project's FORKED schema (`orbit schema fork` copies into `orbit/schemas/`) is not shipped and keeps the stale paths, a named limit of the requirement, not of the scan
- CONFORM: applied — `orbit-cli-name` owns the residue rule (the scan is one requirement); the kept names stay kept (CLAUDE.md's Tier-C list); "fix what we see now" covers the resolver comments (D-opf-3)
- FEASIBILITY: not applied — five small files
- CONSUME: applied — the failure line keeps its form, `<file>:<line>: residue '<occurrence>'`, now with the occurrence as written (e.g. `openspec`); the suite is its only consumer
- INVOKE: applied — runs on every `npm test`, in the shipped-files test of `test/core/cli-name.test.ts`

## Decisions

- **2026-10-17 — D-opf-1: the scan of `schemas/**` is case-insensitive** (Sal, Q1 option b). Fix the four
  `openspec/specs/` paths to `orbit/specs/`, and make `orbit-cli-name`'s scan read `schemas/**` for any case of
  `openspec`, under the existing admitted list. It closes the class where the agent reads the text, as a MODIFIED of
  one requirement, with no new admission.
  Kind: rule
- **2026-10-17 — D-opf-2: the wording changes only the path** (Sal, Q2). The four lines swap `openspec/specs/` for
  `orbit/specs/` and change nothing else. Whether propose must read the spec of every modified capability is #29's.
  Kind: scope
- **2026-10-17 — D-opf-3: the two stale resolver comments are in scope.** `src/core/artifact-graph/resolver.ts:52`
  and `:97` name `<projectRoot>/openspec/schemas/`, while `getProjectSchemasDir` (`:44-45`) returns `orbit/schemas`.
  Fixed here under Sal's "fix what we see now"; comment-only, and `resolver.ts`'s hash pin in
  `rc03b-untouched-modules.test.ts` moves with the act recorded. The `XDG_DATA_HOME/openspec/` lines beside them
  name the global data directory, a kept name, and stay.
  Kind: scope

## Open questions

## Considered & out

- **2026-10-17 — Q1 (a), the four lines and a one-off test.** Leaves the case-sensitive scan blind to the next
  lowercase path in a schema.
- **2026-10-17 — Q1 (c), case-insensitive over every shipped file.** `src/` string literals carry legitimate legacy
  paths (`legacy-cleanup.ts`, the costrict adapter's `.cospec/openspec/commands`) and the kept names; each would need
  an admission. That is the Tier-C scrub's work.
- **2026-10-17 — Rewording "Research existing specs" into a read obligation.** #29's question; its fix may live in
  the propose skill and the emit, not the schema.

## References

- Issue #30 (this bug); issue #29 and its investigation comment (agents proposing without reading the specs they
  modify).
- `orbit/specs/orbit-cli-name/spec.md` — `The old name appears in what the package ships only for an admitted reason`
  (the case-sensitive file scan; `schemas/**` read over every line).
- `test/core/rc03b-untouched-modules.test.ts` — pins the hashes of `schema.yaml` and `templates/proposal.md`; a fix
  moves both pins and records the act.
- `src/commands/schema.ts` — `orbit schema fork` copies the package schema into a project's `orbit/schemas/`; a
  forked copy keeps the stale paths.
