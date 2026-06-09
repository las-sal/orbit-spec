# CLAUDE.md — orbit-spec

orbit-spec is a **self-contained hard fork of `@fission-ai/openspec@1.3.1`**. The vendored upstream
source is the repo's root commit (`d665f12`, tagged `upstream/v1.3.1`, tree byte-identical to the
upstream tag); orbit's own work lands as ordinary commits on top. This is the successor to the old
`openspec-orbit` **overlay** model — orbit no longer overlays a separately-installed CLI; **this repo
IS the complete tool** (upstream's engine + orbit's editorial/judgment layer, in one place).

Upstream is registered as a **read-only git remote** (`upstream`, push disabled) for deliberate,
surgical cherry-picks only — there is no auto-ingest. A version bump is its own deliberate decision.

## Current state (as of A2)

The fork bootstrap (phase **A1**) is complete:
- Vendored pristine v1.3.1 baseline (`upstream/v1.3.1` tag), fresh detached history.
- **Telemetry removed** (no PostHog; `src/telemetry/` gone; `cli/index.ts` keeps only `--no-color`).
- Upstream's own `openspec/` dogfooding dir stripped.
- Rebranded to `orbit-spec`. **The user-facing rename is complete (D13):** the CLI bin is **`orbit`**,
  the project working dir is **`orbit/`** (where `specs/`, `changes/`, `config.yaml` live), skill dirs
  are **`orbit-*`** (e.g. `.claude/skills/orbit-explore/`), and the command namespace is **`/orbit:*`**
  (`.claude/commands/orbit/<id>.md`). Deferred to a later Tier-C scrub (kept as-is for now): `OpenSpec`
  branding prose, `.openspec.yaml`, data-format tags (`openspec-change`), the global config/data dir,
  and legacy-openspec detection. See the dogfooded changes
  `orbit/changes/archive/2026-06-08-rename-user-facing-to-orbit/` (A2) and
  `orbit/changes/rename-command-namespace-to-orbit/` (namespace).
- **Toolchain is npm, not pnpm.** `npm install` works end-to-end. Build = `npm run build`
  (`node build.js` → `tsc`); tests = `npm test` (vitest). Baseline: ~1369 tests passing.

**B1 (relocate)** is underway on branch `b1-relocate-workflows`, dogfooded as
`orbit/changes/relocate-modified-upstream-workflows/`. Done: orbit's editorial content relocated into
all 11 workflow modules (inline-TS per **D13**; `sync-specs` was a no-op — orbit never modified it) +
6 spec deltas (`orbit-conventions`, `orbit-run-summary-emit`, `orbit-{explore,propose,archive}-modifications`,
`orbit-onboard`) relocated as ADDED capabilities. Change validates `--strict`; ~1391 tests green;
generation-fidelity tests assert the orbit layer per workflow. Per D13, B-arc keeps prose as **inline
TS template literals** (markdown-as-source/D6 deferred). **Deferred follow-ups:** onboard content-
accuracy + D11 genericization (issue #2), `archive-change` `references/` file (B2), broader user-docs
rewrite (issue #1). The full plan and design decisions live in the docs below — **read them before B-arc work.**

## Source of truth for the plan

- `orbit/explore/fork-and-orbify/explore.md` — the live design exploration. Decisions **D1–D12**
  (incl. the ratified **6-phase program** D9, new-repo/baseline strategy D10, tool-breadth D11, rip
  telemetry D12) and open questions Q1–Q10 (Q1/Q6/Q7/Q10 resolved). **This is the working spec for
  the fork.**
- `orbit/architecture/openspec-1.3.1-architecture.md` — verified deep-dive of the v1.3.1 codebase
  (the three-layer model, schema/artifact-graph engine, the template→generation→adapter pipeline that
  B-arc edits, init/update lifecycle, and the archive merge bug).
- `openspec-parallel-merge-plan.md` (repo root, inherited from upstream) — documents the archive
  parallel-merge data-loss bug (explore.md Q8 / phase C2).

The companion repo `../openspec-orbit` holds orbit's existing overlay content; it is the **migration
source-of-truth** for B-arc (the prose to relocate) and **retires after parity (B3)**.

## The plan in one glance (explore.md D9)

```
A1 ✅ fork bootstrap          → B1 relocate content → B2 grow generator → B3 net-new workflows
(done; +A2 rename)              (inline-TS, D13)      (refs + metadata)   ══ PARITY ══
                                                                          → C1 engine gates/freshness
                                                                          → C2 archive merge fix
```

Before parity (B-arc) is *relocation* (mechanical/testable); after (C-arc) is *net-new capability*
(novel/design-heavy). Targets are **Claude (primary) + Codex** — both consume the same
`SKILL.md` + `references/` artifact, so bodies must stay **mechanism-neutral** (D11).

## Execution disciplines (apply whether or not a workflow command is active)

- **Read-before-reference** — before naming a specific construct (function, type, file path, flag,
  capability, spec requirement), read its actual definition (`Read`/`grep`/`orbit instructions`).
  Never invent a plausible reference. Conceptual reasoning doesn't require this; naming a concrete
  construct does.
- **Change completeness** — substantive modifications must be applied fully across ALL affected
  artifacts before being called done; sweep for residue AND new bugs after mechanical edits.
- **Pushback** — verify each flagged issue against current state before acting; report and suppress
  stale findings with evidence rather than re-fixing already-fixed state.

## When in doubt

- The fork plan and its decisions are normative — `orbit/explore/fork-and-orbify/explore.md`.
- Engine behavior is defined in the vendored TypeScript under `src/` (the architecture doc maps it).
- Keep tests green: run `npm test` before and after substantive changes; the green baseline is the
  contract.
