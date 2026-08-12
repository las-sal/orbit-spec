# Design: d6-pr-lifecycle

## Context

Stage D6 of `orbit/architecture/d-arc-arbitered-flow.md` (Depends-on: d1, SHIPPED). The
consent vocabulary (D1), the engine emit surface + gates (C1/D5), and the archive flow's
prompt architecture (consent → gate → fingerprints → audit) all exist; every git/GitHub
action in current practice (review-handoff commit+push, the external preflight) is already
workflow-body choreography. The full decision record is `explore.md` (11 decisions, 5
rejections, 2 promotion-resolved questions); this design restates only what generation
needs, citing explore.md rather than re-deriving.

## Goals / Non-Goals

**Goals:**

- The PR as a designed lifecycle step: draft window from propose, agent-written landmark
  description, READY at the governing unit's merge-eligible condition (see explore.md,
  generalized READY rule).
- Both granularities first-class, selected by the change's `architecture:` citation —
  program branch + ONE program PR (Shape A) for cited changes; per-change branch + PR for
  uncited ones.
- Provenance-invariant behavior: identical PR outcomes however propose was reached — the
  step never silently skips or degrades (see explore.md (f)); propose itself stays outside
  the consent-scoped set (D-d6-6).
- Graceful degradation everywhere: `pr: never`, no remote, or no `gh` → today's behavior,
  reported once, never an error (exit criterion 2).

**Non-Goals:**

- Merging. READY is the terminus; merging stays a human act (charter line, confirmed).
- Auto-merge-on-green (`gh pr merge --auto`) — Considered & out; named return condition.
- Stacked per-change PRs in per-architect mode (Shape B) — Considered & out.
- Engine git. The engine never shells to git/gh (explore.md (g)).
- CI bootstrap — the dogfood project owns its workflow file; orbit only surfaces absence.
- Multi-repo changes — explicitly deferred (carried from D1).
- Engine-rendered PR bodies — rejected; the description is narrative (landmark genre).

## Decisions

(Ratified in explore.md; D-numbers for citation.)

- **D-d6-1 — One key, three modes: config selects the regime, citation selects the target.**
  `pr: never | per-proposal | per-architecture` in `orbit/config.yaml` — a single scalar,
  mutually exclusive values, so no key combination can be undefined (superseded the earlier
  two-key `{open, program-branches}` sketch, whose `open: never` + `program-branches: true`
  combination had two defensible readings; Sal, 2026-08-11). `never` (and absent) = today's
  behavior. `per-proposal` = every change gets its own branch + PR. `per-architecture` =
  changes CITING an architecture doc ride that doc's program branch under Shape A; changes
  with NO citation FALL BACK to the per-proposal path (own branch, own PR) — a standalone
  change never loses its outward window (Sal: "agree fallback"). Timing is not configurable:
  PRs always open as drafts at propose (the `at-archive` born-READY mode is retired with the
  two-key sketch). A repo-level granularity key was separately rejected as wrong-grained —
  within `per-architecture` the citation is what picks a change's target.
- **D-d6-2 — Shape A program PR; arc-done flip is the HUMAN's.** (Flip ownership revised
  2026-08-12, Sal — the first review pass showed arc-done has no observing body: the archive
  tail runs before the closing review, and no task could ever trigger it.) One draft PR
  `<program-branch> → main`, born with the
  branch (or on first configured touch mid-flight), stage entry APPENDED at each stage
  archive (adapted from the just-written arc status-log entry — write once, publish
  twice). The accumulated stage entries ARE the program's landmark — written incrementally,
  so no terminal rewrite is required (a whole-program rewrite is optional polish on
  request). At ARC-DONE (all stages archived + closing architecture review, checked from
  `orbit architecture status --json` + the architecture trail) the architect flow's
  completion-ratification readout SURFACES the human acts — the program PR's URL, its DRAFT
  state, and `gh pr ready <n>` / `gh pr merge <n>` — recommending, never invoking. Rationale
  for human ownership: arc-done is a once-per-program ceremonial moment with the user
  already present at the ratification, and teaching the most restrained body in the surface
  (architect, "never a gatekeeper") to make outward writes buys little.
- **D-d6-3 — Generalized READY.** The CONDITION is uniform — the branch's governing unit is
  merge-eligible: change → archive; program → arc-done. WHO flips is deliberately not:
  per-change flips are PERFORMED by the archive tail (constant; a body is present when the
  condition turns true), program flips are SURFACED for the human (once per program; no body
  is present). Per-change flips fire on `gate_overridden` archives too (the recorded
  override IS the ratification). "Flip" = `gh pr ready` — reversible GitHub metadata, no
  merge/push/code effect.
- **D-d6-4 — The PR-attached archive tail.** After the archive emit: commit → push →
  description rewrite (achievement landmark) → `gh pr ready`. Ordering invariant: the flip
  fires only after the archive commit is pushed (the PR must contain its own archive
  commit). Scope: PR-attached changes only — `pr: never`/no-remote archive is unchanged.
  Tail failures (push/`gh`) skip the remainder gracefully with a note; the archive itself
  never blocks (apply-parity flavor).
- **D-d6-5 — Landmark descriptions, agent-written.** Intent at propose (adapted from
  proposal.md's Why/What), achievement at archive; per-architect stage entries appended per
  D-d6-2. Deterministic claims inside the narrative are READ from the engine at authoring
  time (standing discipline), never hand-invented. Seams-only refresh — no per-emit or
  per-gate-transition PR edits.
- **D-d6-6 — Provenance-invariant behavior; propose NOT consent-scoped.** (Revised
  2026-08-12, Sal — supersedes the conditional-consent-scope reading that the first review
  pass flagged as contradicting D1's closed set.) Propose does not need gating: moving from
  explore to propose is a pure user decision, and in practice the AI drives the exploration
  to readiness and the USER says go — which is chat ratification, i.e. user-invoked
  provenance with zero prompts due. The no-chaining contract already bars the AI from
  invoking propose unbidden, so no unratified AI-mediated propose exists to backstop; if one
  occurs it is a no-chaining violation, not a missing gate. The outward write is a DRAFT PR
  on a NEW branch — reversible in two commands, unlike the irreversible `→ apply` and
  `→ archive` seams D1 marks. Therefore: NO schema gate, NO third gate kind, NO
  `spec-driven` version bump, and D1's consent-scoped set stays closed and untouched.
  **Named re-entry trigger** (Sal: "if it gives me problems, we will add some machinery
  then"): an unrequested PR appearing from an unbidden propose is the empirical signal to
  revisit — the same deferral-with-a-tripwire shape as R-d-2. What SURVIVES from the original
  decision is the provenance-INVARIANCE half: the PR step never silently skips or degrades
  based on how propose was reached (the D1-carried skip-the-PR-step leaning stays superseded
  — divergent behavior by provenance confuses; see explore.md (f)).
- **D-d6-7 — Zero engine git.** All git/gh actions are workflow-body steps (the existing
  review-handoff choreography class). Engine surface: the `pr:` config reader
  (`project-config.ts`) + optional `pr_url`/`pr_state` narrative pass-through fields on the
  propose/archive emit payload tables. Branch naming: `<change-name>` standalone; the doc's
  filename stem for program branches (per-doc override waits for a real need).
- **D-d6-8 — No-CI surfacing.** When opening a change's first PR on a repo with no
  `.github/workflows/`, the propose body notes "no CI configured; the PR's checks section
  will be empty" — one line, reporting, never scaffolding or prompting.

## Risks / Trade-offs

- **The tail moves outward writes inside archive** — mitigated by scope (PR-attached only),
  the archive flow's own D1 entry consent, the ordering invariant, and READY's reversibility
  (`gh pr ready --undo`); merge — the only irreversible act — stays human.
- **Program PR bodies grow long** over a many-stage arc — accepted: appended stage entries
  are the landmark's value; GitHub renders long bodies fine; the arc-done rewrite can
  restructure.
- **Mid-flight adoption** (this repo: `d-arc` is 5 stages deep, unpushed-PR) — covered by
  "first configured touch" birth; the retroactive program PR simply starts its appended
  history at the current stage.
- **`gh` availability assumption** — the tail requires the GitHub CLI; degradation reports
  and skips, and exit criterion 2 tests the no-remote path explicitly.
- **Detached-work drift**: work committed to a program branch by non-orbit sessions won't
  refresh the PR — accepted; seams-only refresh means the body describes seams, not every
  commit.

## Touchpoints

- `src/core/templates/workflows/propose.ts` + `src/core/templates/workflows/ff-change.ts` —
  the shared branch + draft-PR choreography, branch preconditions, intent description
  authoring, no-CI note (`ff` is propose-in-one-breath; `new`/`continue` explicitly out).
- `src/core/templates/workflows/archive-change.ts` — the PR-attached tail (commit → push →
  landmark → flip), program-mode stage-entry append.
- `src/core/templates/workflows/onboard.ts` — teach the PR lifecycle + config vocabulary.
- `src/core/templates/workflows/architect.ts` — arc-done human-acts readout (PR URL, draft
  state, `gh pr ready`/`gh pr merge`) at the completion-ratification seam; no outward write.
- `src/core/project-config.ts` — the `pr:` block reader.
- `src/core/emit-composition.ts` — `pr_url`/`pr_state` payload-field rows for propose, ff,
  and archive.
- `orbit/config.yaml` — commented `pr:` example.
- `test/core/` — config reader + payload-field + template fidelity tests.
- `test/core/templates/` — generated-surface assertions for the new body steps.
