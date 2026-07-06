# External Review: c1-engine-gates (iteration 3)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

## Repo

https://github.com/las-sal/orbit-spec.git

**Check out the `c1-engine-gates` branch** — this change lives there, not on
`main`. After cloning/pulling: `git checkout c1-engine-gates`.

## Project context (read first)

- `CLAUDE.md` — handoff orientation (read this first; it explains the fork, the
  6-phase plan, and that C1 is the first net-new C-arc change)
- `orbit/project.md` — project goals + stack (NOT present in this repo; skip)
- `*_convention.md` at repo root — naming, error handling, etc. (if present)
- `orbit/lenses/perspectives.md` / `orbit/lenses/critical-paths.md` — (NOT
  present; skip)
- `orbit/changes/c1-engine-gates/.orbit-runs/` — iteration history; see what's
  already been addressed in prior cycles (one internal proposal review + one
  internal in-context proposal review + three address-reviews resolution runs +
  two prior external proposal reviews so far)

## Background you need (this is a fork)

orbit-spec is a self-contained hard fork of `@fission-ai/openspec@1.3.1`. The
engine lives in `src/core/artifact-graph/` (~1,150 lines); today completion is
monotonic file-existence and the only non-artifact phase is `apply`. **C1 makes
the engine review-aware**: it generalizes the singular `apply` phase into N
**gates** with a closed two-kind set (`tracked` = checkbox arithmetic;
`reviewed` = a computed review-convergence criterion), a prescribed review
cadence living in the schema YAML, gate state as a pure function of the
`.orbit-runs/` audit trail (no new state files), single-voiced recommendations,
position readouts, and external-handoff attestations. The design decisions
(D-c1-1..D-c1-9) are in `orbit/changes/c1-engine-gates/explore.md` and are
authoritative EXCEPT where a `> **Superseded ...**` note redirects to the
normative spec (D-c1-5 and D-c1-7 carry such notes — the later spec wins for
codegen). The deep architecture map is
`orbit/architecture/openspec-1.3.1-architecture.md`.

This is a **proposal-mode** review: the change has NOT been implemented yet
(`tasks.md` is all unchecked). Review the artifacts for internal coherence and
codegen-readiness, not code-vs-spec.

## Cycle context

- Iteration: 3 (third external proposal review; iters 1 AND 2 were both GPT-5
  Codex — see the "what to focus on" note below about model diversity)
- Prior internal findings still open: **0**. Internal proposal review iter 1
  (`review-proposal-2026-06-13T00-38-15Z.json`, fresh) found 2 CRITICAL / 7
  WARNING / 2 SUGGESTION — all resolved (`address-reviews-2026-06-16T16-24-44Z`).
  Internal proposal review iter 2 (`review-proposal-2026-06-30T15-52-41Z.json`,
  in-context) found 0 CRITICAL / 2 WARNING / 1 SUGGESTION — all resolved
  (`address-reviews-2026-06-30T15-57-54Z`, 0 deferred, 0 escalated).
- Prior external findings still open: **0**. External iter 1 (GPT-5 Codex,
  `external-proposal-2026-06-17T13-41-06Z.md`): 0 CRITICAL / 2 WARNING — resolved.
  External iter 2 (GPT-5 Codex, `external-proposal-2026-06-30T13-41-49Z.md`):
  0 CRITICAL / 2 WARNING — resolved (`address-reviews-2026-06-30T15-43-32Z`).

- **Resolved since the last external review (iter 2) — verify these actually
  landed cleanly and introduced no new inconsistencies. This is the freshest,
  least-externally-vetted material; concentrate here:**
  - **(iter-2 external W1)** `explore.md` D-c1-5 / D-c1-7 still stated the
    pre-remediation convergence rule (class-SET coverage; `cadence: [reviewer
    classes]` with no per-gate `confirm`). Resolution: appended
    `> **Superseded (proposal-review remediation)**` notes pointing to the
    normative `orbit-engine-gates` spec; the dated 2026-06-12 decision text was
    PRESERVED (not rewritten). Check: do the superseded notes accurately
    describe the normative rule, and is the preserved-but-stale decision text
    now unambiguously non-authoritative?
  - **(iter-2 external W2)** the proposal-mode final-assessment phrasings were
    not gate-aware (`Ready to apply` with no gate state / no canonical command),
    contradicting the requirement's single-voiced promise. Resolution:
    `specs/orbit-review/spec.md` replaced the two bare proposal scenarios with
    **FIVE `review-proposal` convergence-state scenarios** (no independent pass
    / unresolved findings / new-findings loop / trailing in-context confirm /
    gate passed), each rendering the gate state + one canonical command,
    paralleling system mode; `proposal.md` and `tasks.md` rippled to match.
  - **(internal iter-2, on the W2 material)** three follow-on coherence fixes:
    (a) `orbit-engine-gates` "Single-voiced canonical-next computation" now PINS
    that an uncovered `independent` meta-class slot resolves to the fresh-context
    review (`/orbit:review --as <mode> --fresh <change>`), anchoring orbit-review's
    `--fresh` phrasings; (b) `orbit-review` gained an "as-of-completion" scenario
    so the current in-context pass counts toward the trailing `in-context` slot
    for its OWN final assessment (the P4↔P5 boundary) while `status`/`instructions`
    stay a pure function of the on-disk trail; (c) the duplicated cadence literal
    `[independent, in-context]` was removed from the orbit-review intro (pointer
    to the spec-driven schema instead).

Do not push back on stale findings — pushback discipline is enforced on
resolution, not review. Just flag what you observe.

## What to read for THIS review (--as proposal)

- orbit/changes/c1-engine-gates/proposal.md
- orbit/changes/c1-engine-gates/design.md
- orbit/changes/c1-engine-gates/tasks.md
- orbit/changes/c1-engine-gates/specs/<capability>/spec.md (every spec under specs/ —
  there are 6: orbit-engine-gates, orbit-review, orbit-review-external,
  orbit-run-summary-emit, orbit-conventions, orbit-archive-modifications)
- orbit/changes/c1-engine-gates/explore.md (the D-c1-* decisions — authoritative
  except where a `> **Superseded**` note redirects to the spec)
- orbit/specs/<capability>/spec.md (the archived baselines — for delta consistency
  checks; the MODIFIED deltas must faithfully reproduce + extend their baselines,
  because sync-specs replaces the baseline requirement wholesale)

## What to look for

1. **Structure & Delta Integrity** — required artifacts present; ADDED/MODIFIED/REMOVED/RENAMED valid; `orbit validate c1-engine-gates --strict` would pass. For each MODIFIED requirement, the delta reproduces the FULL baseline requirement body (a partial body silently drops content on sync-specs). **Especially**: `orbit-review`'s `Final assessment phrasings depend on mode` MODIFIED requirement is now much larger than its baseline (5 new proposal scenarios + an as-of-completion scenario + a gate-aware archive scenario) — confirm nothing from the baseline body was dropped in the expansion.
2. **Internal Coherence** — proposal aligns with design aligns with specs aligns with tasks; count/label consistency. **Concentrate on the new proposal-mode convergence machinery**: are the FIVE `review-proposal` states in `specs/orbit-review/spec.md` mutually exclusive and exhaustive for the no-CRITICAL case? Does each state's gate verdict + canonical command match `orbit-engine-gates`' "Reviewed-gate pass condition" (ordered slots, resolution, per-gate `confirm: no-new-findings`)? Does orbit-review's `--fresh` canonical command for the `independent` slot match the engine's newly-pinned rule in "Single-voiced canonical-next computation"?
3. **Cross-Doc Coherence** — `CLAUDE.md` still accurate after this change (baseline capability count goes 11→12; phase status). The post-apply CLAUDE.md refresh is task 7.3 — pre-apply staleness is expected, but check the change's own internal counts agree.
4. **Archive Consistency** — ADDED don't contradict baseline; the MODIFIED deltas faithfully extend (not contradict) the baseline requirements; the baseline `orbit-review` `Final assessment phrasings depend on mode` requirement vs the much-expanded delta — does the delta supersede cleanly?
5. **Codegen Readiness** — could the gate state machine and the proposal/system final-assessment renderer be implemented from the specs alone? In particular: the "as-of-completion" scenario (orbit-review) vs the "pure function of on-disk artifacts" rule (orbit-engine-gates) — is the interaction unambiguous, or could an implementer wire them to disagree? Is the `independent`-slot → `--fresh` resolution the ONLY reading?
6. **Gap Hunt** — unstated assumptions, error paths, edge cases. For the new proposal states: what happens when MULTIPLE independent passes exist with mixed resolution? When an independent pass is external (markdown) vs fresh (internal review JSON) — does the canonical address-reviews command (`--from-file <independent-path>`) resolve correctly for both? Does the freshness rule's "proposal pass never goes stale in v1" claim hold across all five states?
7. **Drift Hunt** — old vocabulary lingering: residual class-SET framing, bare "Ready to apply"/"Ready to archive" placeholders, advertised skip paths, the `[independent, in-context]` cadence literal restated outside its schema source-of-truth (it should appear only in `orbit-engine-gates` spec-driven + design.md's schema example).
8. **Inline Review Marker Residue** — any `@review:` markers still present (must be addressed before apply)?
9. **Pre-Handoff Sweep** — anything else before shipping?

**A note on model diversity**: iters 1 and 2 were both GPT-5 Codex. If you are a
DIFFERENT model (fresh Claude, Gemini, etc.), your highest-value contribution is
net-new issues in the proposal-mode gate-aware phrasing material that landed
after iter 2 — Codex has not seen it in converged form. If you ARE GPT-5 Codex
carrying context from a prior iter, your highest-value contribution is verifying
your iter-1/iter-2 findings actually landed and the remediations introduced no
regressions.

## Output format — write to:

`orbit/changes/c1-engine-gates/.orbit-runs/external-proposal-<TS>.md`

(Where <TS> is today's timestamp in ISO format, hyphenated, e.g.
`2026-06-30T18-15-00Z`. Pick a fresh timestamp so this file doesn't overwrite
prior reviews — in particular do NOT reuse `2026-06-17T13-41-06Z` (iter 1) or
`2026-06-30T13-41-49Z` (iter 2).)

Use this exact markdown structure:

```markdown
# External Review: c1-engine-gates (iteration 3)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` triple. Use `None.` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use `None.` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use `None.` if no findings.)

## Notes

<Optional: overall impression, broader concerns. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section (`## CRITICAL` / `## WARNING` /
   `## SUGGESTION`), every `### Title` entry, every `**File**:` and
   `**Description**:` field. Do NOT abbreviate or summarize — the chat output
   is the immediately-visible read for the user (they should be able to
   evaluate every finding without opening the file). The file remains the
   canonical record for `--from-file` parsing.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/c1-engine-gates/.orbit-runs/external-proposal-<TS>.md
   git commit -m "External review (proposal, iter 3): c1-engine-gates

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed` — or state explicitly that you
   could NOT (chat-only fallback) so the human never has to infer whether they
   reached the repo.

If you don't have git access, just output the findings markdown in this chat
(per the chat-only fallback above), state that you could not commit/push, and
the user will commit it manually.
