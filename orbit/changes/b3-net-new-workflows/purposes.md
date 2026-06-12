# Purpose paragraphs for baseline restoration

Collected at propose time (source: overlay specs, rebranded). Two uses:
1. Apply-time (D-b3-3 rider): restore `orbit/specs/orbit-run-summary-emit/spec.md`'s `Purpose:` TBD stub — see the emit-spec section at the bottom.
2. Archive-time: when archiving this change creates the four new baseline specs, their `Purpose:` sections are stubbed `TBD` by the archive flow; replace each stub with its paragraph below.

## orbit-review

The unified `/orbit:review` command — editorial review of an OpenSpec change in either proposal mode (pre-apply, 9 passes over artifacts) or system mode (post-apply, `verify-change` as Pass 0 + 6 system-wide passes). Both modes share the 3-dimension scorecard (Completeness / Correctness / Coherence), the severity ladder (CRITICAL / WARNING / SUGGESTION), pushback discipline, and `.orbit-runs/` persistence. Generates findings but does not resolve them; resolution flows through `/orbit:address-reviews`.

## orbit-review-external

The `/orbit:review-external` command — packages a review request for an external AI (codex, fresh Claude, GPT, etc.) to perform a second-opinion review. Writes a self-contained markdown prompt to `.orbit-runs/external-prompt-<as>-<TS>.md` and emits a short chat invocation snippet. Does NOT run the review or ingest findings; ingestion is `/orbit:address-reviews --from-file`. Includes mode inference, iteration counting per mode, cycle-context population from prior runs, and a recommended-session note tailored to iteration history.

## orbit-address-reviews

The `/orbit:address-reviews` command — resolves `@review:` markers anywhere in the repo (or review findings ingested via `--from-file` external markdown / internal JSON, or auto-discovered from a change's `.orbit-runs/`) by walking each through pushback → classify → fix → ripple-cascade → remove-marker. Walk-mode is the default (`--batch` opts in); cascade-by-default auto-applies ripple edits to IN-set files (`--no-cascade` opts out). Pushback is the primary discipline: verify against current state before fixing, suppress stale findings with evidence. Output is a resolution log (NOT a scorecard) with ✓ Resolved / ⚠ Stale / ⏸ Deferred / ✗ Escalated counts. Marker-removal invariant ensures markers don't leak into canonical artifacts.

## orbit-audit-drift

The `/orbit:audit-drift` command — project-wide scan for drift between captured knowledge and reality across four categories: (1) vocabulary residue (renamed/removed terms in non-delta'd docs), (2) lens staleness (perspectives/critical-paths referencing missing capabilities), (3) cross-doc consistency (`CLAUDE.md` / `project.md` / `*_convention.md` claims vs current state), (4) archive coherence (sync-specs propagation failures). Three invocation paths: standalone (user runs when "something feels off"), library call (system-mode review Pass 6), pre-archive (auto-invoked by `/orbit:archive`). Findings roll into the 3-dimension scorecard; final-assessment phrasing varies by invocation context.

## orbit-run-summary-emit (apply-time rider)

Defines the emit-layer that writes per-command `.orbit-runs/<command>-<TS>.json` run-summary JSONs for orbit workflow commands (`explore`, `propose`, `new`, `continue`, `ff`, `apply`, `verify`) plus `/orbit:review-external` at T0 — alongside the existing editorial and lifecycle emit-producing commands. Specifies emit scope (which commands emit, which don't), the workflow-kind JSON shape (extends the universal spine from `orbit-conventions`), emit timing semantics (one-shot vs. multi-turn-phase-boundary vs. conversation-boundary), the wrapper architecture (upstream skill bodies are NOT modified), per-command recommendation logic (propose-shaped vs. artifact-completion-aware; explore maturity grid; apply per-chunk-end with chunk preamble parsing; verify pass/fail mode classification; review-external T0 multi-step prose; audit-drift standalone change-scoped vs. project-wide), and the no-forward-look discipline that keeps emit text scoped to today's behavior.
