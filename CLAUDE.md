# CLAUDE.md — orbit-spec

orbit-spec is a **self-contained hard fork of `@fission-ai/openspec@1.3.1`**. The vendored upstream
source is the repo's root commit (`d665f12`, tagged `upstream/v1.3.1`, tree byte-identical to the
upstream tag); orbit's own work lands as ordinary commits on top. This is the successor to the old
`openspec-orbit` **overlay** model — orbit no longer overlays a separately-installed CLI; **this repo
IS the complete tool** (upstream's engine + orbit's editorial/judgment layer, in one place).

Upstream is registered as a **read-only git remote** (`upstream`, push disabled) for deliberate,
surgical cherry-picks only — there is no auto-ingest. A version bump is its own deliberate decision.

## What this repository is

- **The renames are made.** The CLI bin is **`orbit`**, a project's working directory is **`orbit/`** (where
  `specs/`, `changes/` and `config.yaml` live), skill directories are **`orbit-*`** (e.g.
  `.claude/skills/orbit-explore/`), and the command namespace is **`/orbit:*`** (`.claude/commands/orbit/<id>.md`).
  Kept as-is until a later Tier-C scrub: `OpenSpec` branding prose, `.openspec.yaml`, data-format tags
  (`openspec-change`), the global config/data dir, and legacy-openspec detection.
- **Telemetry is removed.** orbit collects nothing.
- **Toolchain is npm, not pnpm.** `npm install` works end-to-end. Build = `npm run build` (`node build.js` → `tsc`);
  tests = `npm test` (vitest). CI runs `npm ci`, `npm run build` and `npm test` on Linux and macOS
  (Windows is not checked: issue #23).
- **The `.claude/` surface is generated and gitignored.** This repo's own skills and launcher commands are generated
  by its own engine — `node bin/orbit.js init --tools claude`, once per machine. After changing workflow templates,
  refresh with `npm run build && node bin/orbit.js update --force` (template edits don't bump the version, so plain
  update's smart detection may skip) so your local surface doesn't lag the source.
- **Releases** are cut by `npm run release:tree` (the `orbit-release` capability), the only release path; pushing the
  tag is the maintainer's act.
- `orbit/specs/` holds <!-- src:capabilities -->30<!-- /src:capabilities --> baseline capabilities. Every marked
  figure in this file is checked against `orbit/sources.yaml` by `orbit validate --sources`; an UNMARKED figure is
  invisible to that check.

## Decisions to read before touching templates

Three decisions were ratified during C1 remediation:

- **D14 — thin launcher commands**: each skill `instructions` literal is the single behavioral source
  (upstream body — edited only by named deltas, in place, per `orbit-conventions`' `Generated-file disposition` — + `# Orbit additions`); each command `content` literal is a ~3-line launcher
  invoking the skill. Do NOT regrow workflow bodies in command literals.
- **D15 — full surface always**: `getProfileWorkflows` (src/core/profiles.ts) always returns ALL
  workflows (15 as of D5); profile gating is deliberately inert (`delivery` still honored). Do NOT
  reintroduce profile-filtered installs.
- **D11 refinement — Claude primacy**: never trade Claude efficacy for cross-tool neutrality; upstream's
  named-tool idiom (`AskUserQuestion`, `Task tool`) stays in bodies by design.

## Programs: none live

The last program, **`orbit/architecture/update-gh-documentation.md`** (2026-10-12 to 2026-10-13, from issue #1),
is complete: every stage ratified. It rewrote `README.md` and the `docs/` pages for orbit, put them under machine
checks (`orbit-user-docs`' requirements; `test/core/user-docs/pending-rewrite.json` is empty), released `v2.0.0`,
and ended with the repository public. Follow-on work is tracked as GitHub issues, not a program: #24 "Refine
Documentation" (the CLI's remaining user-visible OpenSpec strings, an architect-first Quickstart) and #23 (a Windows
CI leg). A new program starts with `/orbit:architect <name>`; position is COMPUTED by `orbit architecture status`.

## Orientation

Position is COMPUTED, never stated here. Orientation: run `orbit status` — bare for the current sprint,
`--full` for the whole arc (answers position / last / next per workstream with no artifact reads);
`orbit architecture status` gives each program's stage states. Every lifecycle transition is USER-invoked: recommend, never invoke.

Each stage's narrative lives in its `Shipped as` paragraph in its architecture doc; this file no longer carries one
per stage. The narrative it carried until 2026-10-13 — the fork program, the D-arc and clean-up-review-cycle — is in
`orbit/architecture/program-history.md`, a record whose figures were true when written.

## Source of truth for the plan

- `orbit/architecture/update-gh-documentation.md` — the docs program (complete; above).
- `orbit/architecture/clean-up-review-cycle.md` — the previous program, its stages all closed; read its Premise,
  Goals, Rulings index and "Carried at close" table, and slice a stage with
  `orbit architecture show clean-up-review-cycle <stage>`.
- `orbit/architecture/d-arc-arbitered-flow.md` — the D-arc (complete, historical).
- `orbit/architecture/fork-and-orbify.md` — the COMPLETED fork-program architecture. Decisions **D1–D15** (incl. the
  6-phase program D9, tool-breadth D11 + its Claude-primacy refinement, rip telemetry D12, inline-TS D13,
  thin-launcher commands D14, full-surface installs D15).
- `orbit/architecture/openspec-1.3.1-architecture.md` — verified deep-dive of the v1.3.1 codebase (the three-layer
  model, schema/artifact-graph engine, the template→generation→adapter pipeline, init/update lifecycle, and the
  archive merge bug).
- `orbit/architecture/openspec-parallel-merge-plan.md` (inherited from upstream) — documents the archive
  parallel-merge data-loss bug that C2's base fingerprints guard against.
- `orbit/architecture/program-history.md` — the per-stage narrative this file used to carry.

Targets are **Claude (primary) + Codex** — both consume the same `SKILL.md` + `references/` artifact from one source
body.

## Execution disciplines (apply whether or not a workflow command is active)

- **Read-before-reference** — before naming a specific construct (function, type, file path, flag,
  capability, spec requirement), read its actual definition (`Read`/`grep`/`orbit instructions`).
  Never invent a plausible reference. Conceptual reasoning doesn't require this; naming a concrete
  construct does.
- **Change completeness** — substantive modifications must be applied fully across ALL affected
  artifacts before being called done; sweep for residue AND new bugs after mechanical edits.
- **Pushback** — verify each flagged issue against current state before acting; report and suppress
  stale findings with evidence rather than re-fixing already-fixed state.
- **No-chaining** (D1, `orbit-conventions`) — invoke at most the orbit workflow commands the user's
  message explicitly requests; recommend, never invoke. Completing a command ENDS the turn at the
  position readout + the engine's eligibility line (`Ready when you are:`); blanket delegation covers
  work WITHIN the requested command, never the next one — gate `passed` means *eligible*, not
  *commanded*.
- **Outward actions stay the human's** (D6, `orbit-conventions`) — merging any PR, publishing
  releases, and filing issues on external trackers are invoked outside orbit workflows, in
  non-orbit sessions on this repo as much as in orbit ones. Recommend them; never perform them.
  Where orbit *has* designed the path (the draft PR at propose, the archive tail's READY flip)
  the workflow owns it; everything else remains off-script by design.

## When in doubt

- The fork plan's decisions remain citable — `orbit/architecture/fork-and-orbify.md` (program complete); the D-arc that followed it is `orbit/architecture/d-arc-arbitered-flow.md` (also complete — historical record). The previous program is `orbit/architecture/clean-up-review-cycle.md`, its stages all closed; read its Premise, Goals, Rulings index and "Carried at close" table, never the whole doc. The docs program that followed is `orbit/architecture/update-gh-documentation.md` (complete). No program is live; `orbit architecture status` gives every doc's position.
- Engine behavior is defined in the vendored TypeScript under `src/` (the architecture doc maps it).
- Keep tests green: run `npm test` before and after substantive changes; the green baseline is the
  contract.
