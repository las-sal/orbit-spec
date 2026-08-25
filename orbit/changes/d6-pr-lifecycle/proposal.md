# Proposal: d6-pr-lifecycle

## Why

PRs today are an ad-hoc outward action orbit polices by convention (the C2 incident — an
AI-driven unrequested PR — is Stage D1's origin story); meanwhile every real orbit effort
already produces exactly what a PR window wants to show (artifacts, trail, review
iterations) with no outward surface showing it. D6 makes the PR a DESIGNED lifecycle step
(the ratified D-elc-6 direction, staged as d6-pr-lifecycle of `d-arc-arbitered-flow`): the
change's PR exists from propose as the human-facing window onto the work, flips to READY
when the effort completes, and becomes the durable landmark of what was achieved — while
merging stays a human act. SCOPE OF "window", narrowed from the charter's aspiration: the PR
shows whatever has been PUSHED, and D6 guarantees pushes at exactly two seams (the propose
choreography and the archive tail). It does NOT add pushes at review, apply, or resolution
seams — that would contradict the seams-only refresh decision and grow the change
substantially. Intermediate visibility is whatever the user pushes in between. See `explore.md` (10 decisions + 2
promotion-resolved questions from one session, 2026-08-10/11, plus 6 post-promotion
revisions dated 2026-08-12/2026-08-20 recording what the review cadence overturned).

## What Changes

- **One config key, three modes**: `pr: never | per-proposal | per-architecture`. `never`
  (the default when absent) is today's behavior; `per-proposal` gives every change its own
  branch + PR; `per-architecture` puts changes citing an `architecture:` doc on that doc's
  long-lived program branch, with UNCITED changes falling back to the per-proposal path so a
  standalone change never loses its outward window. Mutually exclusive values — no key
  combination can be undefined.
- **ONE program PR per architecture doc (Shape A)**: draft `<program-branch> → main` born
  with the branch (or on first configured touch mid-flight), body APPENDED with a stage
  entry at each stage archive (adapted from the arc status-log entry — the accumulated
  entries ARE the landmark). At ARC-DONE the architect readout SURFACES the flip and merge
  as the human's acts, naming the PR and the exact commands; orbit never flips a program PR
  (no body is present when arc-done becomes true). Stacked per-change PRs rejected
  (Considered & out).
- **Per-change draft PRs**: on the per-proposal path, propose creates the branch, commits
  artifacts, pushes, and opens a draft PR — no "pr" word in any invocation; the config is
  the standing declaration. PRs always open as DRAFTS at propose; there is no deferred-open
  timing mode.
- **Generalized READY rule**: the CONDITION is uniform — the branch's governing unit reaches
  its merge-eligible condition — change → archive (gates passed, baseline synced); program →
  arc-done (all stages archived + closing architecture review, R-d-3). WHO flips is not:
  per-change flips are performed by the archive tail (a body is present when the condition
  turns true); program flips are surfaced for the human (no body is present, and it happens
  once). Per-change flips fire even on a recorded `gate_overridden` archive (the override IS
  the ratification). MERGING STAYS HUMAN in both modes.
- **PR-attached archive absorbs commit+push as its designed tail**: after the archive emit —
  commit → push → description rewrite (intent → achievement landmark) → `gh pr ready`, one
  continuous seam. Scope: PR-attached changes only; `pr: never`/no-remote archive behaves
  exactly as today.
- **PR description is agent-written narrative** (landmark genre — the status-log entries'
  outward sibling): intent at propose, achievement at archive; deterministic claims read
  from the engine at authoring time. Engine-rendered body rejected (Considered & out).
- **Propose stays OUTSIDE the consent-scoped set; PR behavior is provenance-invariant**:
  moving from explore to propose is a pure user decision, and the no-chaining contract
  already bars the AI from invoking propose unbidden — every propose is typed or
  chat-ratified (both user-invoked), so there is no unratified arrival to backstop, and the
  outward write is a reversible DRAFT PR rather than an irreversible seam. No consent
  prompt, no schema gate, no version bump; D1's closed set is untouched. The PR step never
  silently skips or degrades by provenance (the D1-carried skip leaning stays superseded).
- **Zero engine git**: branch/commit/push/`gh pr` live as workflow-body steps (the existing
  review-handoff choreography class); the engine gains only the `pr:` config reader, the
  optional structured `pr_attachment` object on the propose/ff emit payloads, and the
  optional flat `pr_url`/`pr_state` pass-through fields on the archive emit payload.
- **Residual outward-actions rule**: the off-script outward-action conventions requirement
  (merges, releases, issue-filing) shrinks to a short `orbit-conventions` requirement echoed
  into lifecycle-completion outputs.
- **CI bootstrap OUT of scope**: the dogfood project brings its own workflow file; propose
  surfaces a one-line "no CI configured" note when opening a first PR on a workflow-less
  repo — reporting, never scaffolding.

## Capabilities

### New Capabilities

- `orbit-pr-lifecycle`: the PR as a designed lifecycle step — config vocabulary
  (the three-valued `pr:` key), config-selected regime with citation-selected target, draft/READY
  semantics with the generalized merge-eligible rule, the agent-written landmark
  description contract, the absorbed archive tail with its ordering invariant (flip only
  after the archive commit is pushed), provenance-invariant behavior, and graceful
  degradation (no remote / no `gh` / `pr: never`).

### Modified Capabilities

- `orbit-propose-modifications`: propose gains the branch + draft-PR choreography (config-
  gated), its branch preconditions, and the no-CI surfacing note. Propose is explicitly NOT
  promoted to the consent-scoped set — `orbit-lifecycle-consent` is untouched by this change.
- `orbit-archive-modifications`: the PR-attached archive tail (commit → push → landmark
  rewrite → READY flip) with PR discovery, commit scope, ordering, and degradation rules;
  plus a MODIFIED `Archive run summary written` recording the emit-time PR fields, and a
  MODIFIED `Consent prompt on AI-mediated archive entry` extending the write preview to name
  the tail's outward writes (branch, push, READY flip) for attached changes — the tail rides
  that same entry consent and fires no prompt of its own.
- `orbit-run-summary-emit`: `PR attachment record on the propose and ff emits` — the OWNING
  definition of the structured `pr_attachment` object (the emit-composition table mirrors it,
  per that capability's own precedence rule), including the attachment-record role the
  archive tail reads back.
- `orbit-onboard`: the canonical-flow walkthrough teaches the PR lifecycle AT THE TWO SEAMS
  where it acts — the propose-phase paragraph names the draft PR that opens there, the
  archive-phase paragraph names the tail — plus the `pr:` config vocabulary, the
  citation-selected granularity with its uncited fallback, the no-remote/no-`gh` degradation,
  and the boundary that MERGING IS THE USER'S ACT. Unconditional on the reading project's own
  config, since the body is a generated constant.
- `orbit-conventions`: the residual outward-actions rule (off-script merges/releases/
  issue-filing) as a short requirement echoed into lifecycle-completion outputs.
- `orbit-emit-composition`: the propose and ff emit payload tables gain the optional
  structured `pr_attachment` object; the archive table gains the optional flat `pr_url` /
  `pr_state` pass-through fields (the trail records the outward artifact).

## Impact

- **Templates**: `src/core/templates/workflows/propose.ts` and `ff-change.ts` (the shared
  branch/PR/no-CI choreography — `ff` is propose-in-one-breath; `new`/`continue` explicitly out),
  `archive-change.ts` (the absorbed tail), `onboard.ts` (teach the PR lifecycle),
  conventions echo sites in lifecycle-completion outputs.
- **Engine (minimal per the zero-engine-git decision)**: `src/core/project-config.ts`
  (`pr:` scalar reader), `src/core/emit-composition.ts` (three payload-field table rows:
  propose, ff, archive).
- **Docs (at archive)**: the CLAUDE.md D6 entry (at-archive note 5.9; the outward-actions
  note is apply task 5.4, not at-archive work); the arc doc's D6
  stage section retired to the ratified vocabulary with its carried (e)/(f)/(g) leanings
  marked resolved (charter prose, exit criteria untouched); the arc doc status-log entry.
- **Dogfood**: exit criterion 1 requires one change running the full arc (draft at propose,
  CI from day one, READY at archive, human merge). This repo already satisfies the
  CI-from-day-one half — `.github/workflows/` carries `ci.yml` and `release-prepare.yml` — so
  the natural candidate is this repo's next standalone (uncited) change. Consequence:
  D-d6-8's no-CI note cannot be exercised here; task 6.2's scratch-repo smoke covers it.
- **No breaking changes**: `pr:` unset = `never` = today's behavior everywhere.
