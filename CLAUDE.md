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
  The CLI's user-visible strings say orbit, held by `orbit-cli-name`. Kept as-is until a later Tier-C scrub:
  `.openspec.yaml`, data-format tags (`openspec-change`), the global config/data dir, legacy-openspec detection,
  the `OPENSPEC_*` environment variables and the `OPENSPEC:START/END` rc-file markers.
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
- `orbit/specs/` holds <!-- src:capabilities -->35<!-- /src:capabilities --> baseline capabilities. Every marked
  figure in this file is checked against `orbit/sources.yaml` by `orbit validate --sources`; an UNMARKED figure is
  invisible to that check.

## Decisions to read before touching templates

Three decisions were ratified during C1 remediation:

- **D14 — thin launcher commands**: each skill `instructions` literal is the single behavioral source
  (upstream body — edited only by named deltas, in place, per `orbit-conventions`' `Generated-file disposition` — + `# Orbit additions`); each command `content` literal is a ~3-line launcher
  invoking the skill. Do NOT regrow workflow bodies in command literals.
- **D15 — full surface always**: `getProfileWorkflows` (src/core/profiles.ts) always returns ALL
  workflows (14 since bulk-archive left, R-rop2-11); profile gating is deliberately inert (`delivery` still honored). Do NOT
  reintroduce profile-filtered installs.
- **D11 refinement — Claude primacy**: never trade Claude efficacy for cross-tool neutrality; upstream's
  named-tool idiom (`AskUserQuestion`, `Task tool`) stays in bodies by design.

A new or grown step follows **`skill_body_convention.md`**: a step whose procedure an orbit command's result calls for
keeps its basic content in the body and moves its procedure to a reference file, and a block acted on once, at a moment
the body names (the session's first run-summary emit, the end of apply or of a walk), keeps that moment and its command in the body
and reads its reference there; `skill-body-budget.test.ts` holds each body's size.

## Programs: one live

**`orbit/architecture/reduce-orbit-phase2.md`** (from 2026-11-20) is live: the second reduction phase, opened the day
phase 1 merged, at Sal's direction ahead of `automate-dev-flow` (R-rop2-1). It takes up what phase 1 left (its R-rop-15,
R-rop-18, R-rop-19): every body fitting the 5,000 tokens kept after a compaction, the cuts graded by a replay set, the
rewording held back, and explore's and onboard's own text. Its first stage, `replay-set`, shipped on 2026-11-23: the
replay set under `replay/` (`npm run replay`, every run Sal-started and billed; `npm run replay:compare` against the
baseline record in `replay/results/`), and `npm run validate:skills` in CI. Its `inventory`, a named exploration
(`orbit/explore/inventory/`), concluded the same day with a cut list per over-budget body; Sal's rulings from it replay
only a cut postulated to change what a session does (R-rop2-10) and remove bulk-archive, address-reviews' batch mode and
disagreement test, and explore's illustrative upstream text (R-rop2-11 to R-rop2-13). The first cut stage,
`cut-review-walk`, shipped on 2026-11-25: review and address-reviews each under 5,000 estimated tokens, batch mode and
the disagreement test removed, and every body edit named in a cut ledger (`test/core/templates/cut-ledger.test.ts`).
The second, `cut-propose-archive`, shipped the same day: propose and archive each under 5,000 estimated tokens, propose's
consume mode in a reference read when an exploration is consumed, and bulk-archive removed. `cut-explore-onboard` is next.

**`orbit/architecture/reduce-orbit-phase1.md`** (2026-11-17 to 2026-11-20, merged as PR #46) is complete. It restructured the skill bodies to be
slimmer and in line with Anthropic's guidance for building skills, without changing what any workflow does. Text a
session rarely needs moves to reference files, each body keeping the step's basic content, and a per-body budget test
keeps the bodies from growing back. Its source is Sal's brief beside it (`reduce-orbit-phase1-brief.md`); its stages run
conditional-steps, once-per-session-detail, tighten-bodies and an evaluation, whose decisions (R-rop-15 to R-rop-19) add
one last stage, records-by-setting: decision records written only when a setting reads them, RG0's one named exception;
a phase 2 that starts with a replay set was to follow `automate-dev-flow` (R-rop-15, amended 2026-11-20 by phase 2's
R-rop2-1 to run first). Say "basic
content" and "reference file" (Anthropic's terms), not "stub" (R-rop-3). This repo sets `pr: per-architecture` for it
(R-rop-13): from its first propose on, the program's work, between stages too, was done on the branch
`reduce-orbit-phase1`, which carried one draft PR against main until arc-done.

**`orbit/architecture/automate-dev-flow.md`** (from 2026-11-07) is paused until `reduce-orbit-phase2` is done (R-adf-16 as
amended again 2026-11-20): no change of its remaining stages is proposed meanwhile, its three tripwire explorations stay as
they are, and when it resumes it first goes back to an architect session that rescopes it (phase 2's R-rop2-3), which also
decides whether `pr: per-architecture` stays for it (R-rop-13). It makes
orbit able to run a whole program with Sal present only where Sal adds value, seam-chained or autonomous, with every
permission an explicit setting that defaults to today's behaviour (R-adf-1, R-adf-6). It is built here under today's
supervised flow and first proven on a big, non-critical project (R-adf-5: never dogfooded in orbit-spec). Its G0 now
allows restructuring that leaves what the AI does unchanged (R-adf-15).

**`orbit/architecture/propose-reads-specs.md`** (2026-10-17 to 2026-11-07, issue #29, closed) is complete: it made
the propose and ff bodies tell the agent to read the baseline spec of every capability it modifies, released as
`v2.0.2`. Its `measure` stage ended from its exploration because the fix had reached no measured project; grading
the effect (only in Sal's other projects, R-prs-1) moved to issue #32.

**`orbit/architecture/refine-documentation-and-architect.md`** (2026-10-13 to 2026-10-16, from issue #24) is complete:
it made orbit architect-first in what it suggests (R-rda-1/R-rda-2: `/orbit:architect <name>` for new work; an
architect session stays optional), made the CLI's user-visible strings say orbit, refined the docs to match, and
released `v2.0.1`. The program before it, **`orbit/architecture/update-gh-documentation.md`** (2026-10-12 to
2026-10-13, from issue #1), is complete: it rewrote `README.md` and the `docs/` pages under machine checks, released
`v2.0.0`, and made the repository public. Issue #23 (a Windows CI leg) stays outside any program. New work starts at
`/orbit:architect <name>`.

## Orientation

Position is COMPUTED, never stated here. Orientation: run `orbit status` — bare for the current sprint,
`--full` for the whole arc (answers position / last / next per workstream with no artifact reads);
`orbit architecture status` gives each program's stage states. Every lifecycle transition is USER-invoked: recommend, never invoke (this repo sets no `chain` key, R-adf-5).

Each stage's narrative lives in its `Shipped as` paragraph in its architecture doc; this file no longer carries one
per stage. The narrative it carried until 2026-10-13 — the fork program, the D-arc and clean-up-review-cycle — is in
`orbit/architecture/program-history.md`, a record whose figures were true when written.

## Source of truth for the plan

- `orbit/architecture/reduce-orbit-phase2.md` — the live program (above: the second reduction phase).
- `orbit/architecture/reduce-orbit-phase1.md` — the previous program (complete, PR #46; above: slimmer skill bodies), with
  its brief `reduce-orbit-phase1-brief.md`.
- `orbit/architecture/automate-dev-flow.md` — the paused program (above: settings, seam-chaining, the driver, a trial elsewhere).
- `orbit/architecture/propose-reads-specs.md` — the previous program (complete; above: the propose read instruction, `v2.0.2`, its measurement moved to #32).
- `orbit/architecture/refine-documentation-and-architect.md` — the architect-first program (complete; above: architect-first, CLI says orbit, docs, `v2.0.1`).
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
  message explicitly requests; recommend, never invoke. The contract yields only to a project `chain` setting, and
  this repo sets no `chain` key (R-adf-5). Completing a command ENDS the turn at the
  position readout + the engine's eligibility line (`Ready when you are:`); blanket delegation covers
  work WITHIN the requested command, never the next one — gate `passed` means *eligible*, not
  *commanded*.
- **Decision-writing** (`orbit-conventions`, stages `decision-writing` and `records-by-setting`) — decision records
  (`orbit-decision-records`) are written when `orbit decisions status` says so (`write: true`: a granted `chain` key,
  `signoff: change` or `program`, or a tripwire at `on_fire: halt`); run it as `node bin/orbit.js decisions status`
  until a release carrying it is installed. This repository sets no `chain`, `signoff` or `tripwires` key, so a
  session here writes no NEW ledger entry or stop record, while a resolution answering a stop already in a trail, or a
  replacement fixing a record already there, is still written. Every workflow body with a disciplines epitome carries
  the basic content (when to run the command) as its fifth epitome bullet; the rule and what a record holds are each
  skill's `references/decision-records.md`. Until a release carrying decision records is installed, the
  installed `orbit` refuses these commands here: write such a record with `node bin/orbit.js emit stop|resolution|ledger …`.
  Likewise the commit step's `orbit pr commit` (chained-review-commit): until a release carrying it is installed, run it
  as `node bin/orbit.js pr commit "<name>" --json` (here it returns `off`: this repo sets neither `commit` nor `push`).
  And the archive's brief save, `orbit brief` (brief-render): until a release carrying it is installed, run it as
  `node bin/orbit.js brief --change "<name>" --save` (the installed `orbit` has no `brief`, and its failure would go
  silently into the archive's `warnings`). The archive's sign-off hold (program-brief) likewise: run
  `node bin/orbit.js brief --change "<name>" --hold --json` and `node bin/orbit.js emit signoff …` until a release carrying
  `orbit brief --hold` and `orbit emit signoff` is installed (this repo sets no `signoff` key, so the hold reads `off`).
  The architect session's program save and hold (program-signoff) likewise: run `node bin/orbit.js brief <doc> --save`,
  `node bin/orbit.js brief <doc> --hold --json` and `node bin/orbit.js emit signoff --doc <doc> …` until a release carrying
  the doc forms is installed (the hold reads `off` here too).
- **Outward actions stay the human's** (D6, `orbit-conventions`) — merging any PR, publishing
  releases, and filing issues on external trackers are invoked outside orbit workflows, in
  non-orbit sessions on this repo as much as in orbit ones. Recommend them; never perform them.
  Where orbit *has* designed the path (the draft PR at propose, the archive tail's READY flip)
  the workflow owns it; everything else remains off-script by design.

## When in doubt

- The fork plan's decisions remain citable — `orbit/architecture/fork-and-orbify.md` (program complete); the D-arc that followed it is `orbit/architecture/d-arc-arbitered-flow.md` (also complete — historical record). The previous program is `orbit/architecture/clean-up-review-cycle.md`, its stages all closed; read its Premise, Goals, Rulings index and "Carried at close" table, never the whole doc. The docs program that followed is `orbit/architecture/update-gh-documentation.md` (complete). The program after it, `orbit/architecture/refine-documentation-and-architect.md`, is complete too. The latest, `orbit/architecture/propose-reads-specs.md`, is complete as well (its measurement moved to issue #32). `orbit/architecture/reduce-orbit-phase1.md` is complete (PR #46). The live program is `orbit/architecture/reduce-orbit-phase2.md`; `orbit/architecture/automate-dev-flow.md` is paused until it is done. `orbit architecture status` gives every doc's position.
- Engine behavior is defined in the vendored TypeScript under `src/` (the architecture doc maps it).
- Keep tests green: run `npm test` before and after substantive changes; the green baseline is the
  contract.
