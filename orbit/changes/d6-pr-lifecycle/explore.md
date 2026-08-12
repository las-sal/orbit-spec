> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: d6-pr-lifecycle

## Premise

PRs as a DESIGNED lifecycle step, not a policed ad-hoc action (D-arc Stage D6 charter — the
ratified direction from D1's D-elc-6, split out 2026-07-08; full rationale in D1's explore.md
tombstone; charter: `orbit architecture show d-arc-arbitered-flow d6-pr-lifecycle`): propose
opens a DRAFT PR on the change's branch after artifacts are committed + pushed; archive flips
it DRAFT → READY; merging stays a human act outside orbit. The early draft makes the PR the
human-facing window onto the change for its whole life (artifacts, `.orbit-runs/` trail, and
review iterations visible as they happen; CI from day one; the pushed-branch requirement
shared with review-external's handoff preflight). Optional via config with graceful
no-remote/no-GitHub degradation. The residual outward-actions rule (off-script merges,
releases, issue-filing) shrinks to a short conventions requirement echoed into
lifecycle-completion outputs, plus a CLAUDE.md line per project for non-orbit sessions.

Exit criteria (arc doc, R-d-3): (1) one change dogfoods the full arc — draft PR at propose,
CI from day one, READY at archive, merged by the user; (2) `pr: never` yields zero PR
behavior and a remote-less repo degrades gracefully (tested, not assumed); (3) no
PR/merge/release action occurs outside the config+provenance rules across the dogfood.

## Decisions

- **2026-08-10 — Branch granularity is CONFIG, two first-class modes**: per-proposal
  (a branch per change, the charter's original assumption) AND per-architect (a long-lived
  branch per architecture doc/program — the shape this repo's own `d-arc` branch already
  practices). Both are useful; the config chooses. Rationale: the per-architect mode
  legitimizes the lived workflow instead of treating it as deviation, and the per-proposal
  mode serves standalone changes and small repos. (Sal)
- **2026-08-10 — Per-architect mode = ONE program PR (Shape A)**: a single draft PR
  `<program-branch> → main`, opened when the branch is born (or on first configured touch
  for a mid-flight branch), body refreshed at each stage archive (agent-written per the
  landmark decision below), flipped READY at
  ARC-DONE. The READY rule GENERALIZES across both modes: READY = the branch's governing
  unit reaches its merge-eligible condition — per-proposal branch → archive (gates passed,
  baseline synced); per-architect branch → arc-done (all stages archived + closing
  architecture review, R-d-3's existing falsifiable condition). One rule, two granularities,
  both engine-checkable; PR refresh points coincide with the arc doc's status-log updates.
  (Sal: "b seems too complicated. i think A is right")
- **2026-08-10 — PR body refresh: SEAMS ONLY (v1)**: per-proposal — propose (create) and
  archive (final update + READY flip); per-architect — branch birth and each stage archive.
  No per-emit or per-gate-transition refreshes: the PR body's job is orientation and
  retrospection, not live telemetry — anyone wanting live position clones and runs
  `orbit status`. (Sal)
- **2026-08-10 — PR description is AGENT-WRITTEN, descriptive, a LANDMARK**: narrative
  prose recording what the PR achieved — something to come back to later and understand
  the work — NOT an engine status render. Genre precedent: the arc doc's status-log
  entries and this repo's commit messages (judgment-dense narrative). The voice boundary
  stands as everywhere else: narrative is the AI's designed voice; any deterministic claim
  inside it (gate verdicts, counts, positions) is READ from the engine at authoring time
  per the standing discipline, never hand-invented. (Sal: "a landmark to go back and look
  at and understand what we achieved with that pr")
- **2026-08-10 — PR-attached archive ABSORBS commit+push as its designed tail (resolves
  the core of (e))** — "the final step to end the effort [= the propose/apply cycle the
  PR is attached to]" (Sal): when a PR is attached to the change, the archive flow, after
  the emit, continues commit → push → description rewrite (intent → achievement
  landmark) → `gh pr ready`, one continuous seam — the PR-attached effort ends complete,
  with no separate user-directed "commit and push" pause. SCOPE: this is a property of
  the PR lifecycle, NOT a change to base archive — with `pr: never` or no remote, archive
  behaves exactly as today (ends at the readout; commits stay the user's affair).
  Consent: user-typed `/orbit:archive` + `pr:` config = standing consent for the tail's
  outward writes (the same provenance logic as (f)'s leaning). Ordering invariant: the
  flip fires only AFTER the archive commit is pushed — the PR must contain its own
  archive commit before READY is honest. Degradation within PR mode: `gh`/push failures
  skip the remaining tail gracefully with a clear note; the archive itself never blocks
  on them (apply-parity flavor). (Sal)

- **2026-08-10 — READY is the terminus; MERGING STAYS HUMAN (both modes)**: the
  per-proposal tail ends at the READY flip — the human merges whenever satisfied (CI,
  landmark glance); the per-architect program PR flips READY only at arc-done and the
  human merges the program. The charter's D1-carried line ("merging stays a human act
  outside orbit") is confirmed, not superseded, by the absorbed tail. (Sal: "READY is
  good.")

- **2026-08-10 — (e-residual) RESOLVED: READY flips on gate-overridden archives too** —
  the recorded `gate_overridden` IS the user's ratification; a draft PR disagreeing with
  the user's explicit proceed-anyway would be the worse record; the achievement narrative
  records the override honestly. "Flip" defined precisely: `gh pr ready` — a reversible
  GitHub metadata state change (Draft → Ready for review), no merge, no push, no code
  effect. (Sal: "e: yes")
- **2026-08-10 — (g) RESOLVED: zero engine git** — branch creation, commit, push, and
  every `gh pr` call live as WORKFLOW-BODY steps (the same choreography class as the
  existing review-handoff commit+push); the engine never shells to git. Propose offers to
  create `<change-name>` off the default branch (or the program branch in per-architect
  mode); no `openspec branch`-style scaffolding; multi-repo changes explicitly deferred.
  Keeps D6's engine surface near zero: config vocabulary + body choreography. (Sal)
- **2026-08-10 — (f) RESOLVED: PR behavior is PROVENANCE-INVARIANT** — an AI-mediated
  propose acts EXACTLY like a typed one once entry is consented; the PR step never
  silently skips (divergent behavior confuses: "AI: should I kick off this propose?" /
  "me: yes" must yield the same PR as typing it — and that exchange already classifies
  as chat ratification = user-invoked under D1's provenance rules, zero prompts). With
  `pr:` config active, propose acquires an outward write, so it joins the D1 entry-gating
  pattern: typed or chat-ratified → full behavior, no prompts; genuinely unratified
  AI-mediated arrival → ONE consent prompt at entry (Proceed/Abort) covering propose AND
  its PR as a unit — after entry, behavior is identical on every path. Supersedes the
  D1-carried skip-not-prompt leaning. (Sal)

- **2026-08-11 — Config vocabulary: CITATION is the granularity selector; config enables
  and times** (refines the 2026-08-10 branch-granularity decision — the granularity is a
  PER-CHANGE property, not a repo mode): a change citing an `architecture: {doc, stage}`
  doc rides that doc's program branch (commits land directly on it, ONE program PR per
  Shape A, READY at arc-done — timing fixed, not configurable); an uncited change gets its
  own `<change-name>` branch with a PR per `pr.open`. The vocabulary:
  `pr: { open: at-propose | at-archive | never, program-branches: true | false }` —
  `open` governs uncited changes only (`at-archive` = a PR born READY at the tail, the
  landmark-only mode; `never` = today's behavior); `program-branches: false` is the
  repo-wide escape hatch back to every-change-its-own-branch. No-remote/no-`gh` degrades
  to `never` regardless of setting, reported once, never an error. Branch naming:
  `<change-name>` standalone; the doc's filename stem for program branches (optional
  per-doc override waits for a real need). (Sal)

- **2026-08-11 — (i) RESOLVED at promotion: CI bootstrap is OUT of D6 scope** — CI is
  project-specific (test command, language, runner); a generator drags orbit into template
  maintenance. The dogfood project brings its own workflow file; D6 keeps only the
  one-line surfacing nicety: when opening a first PR on a repo with no
  `.github/workflows/`, the propose body notes "no CI configured" — reporting, never
  scaffolding, never prompting. (Sal, ratified at propose)
- **2026-08-11 — (j) RESOLVED at promotion: append-per-stage, adapted from the status
  log** — at each stage archive the program PR body gains an APPENDED stage entry,
  adapted from the just-written arc status-log entry for the outward audience (write the
  narrative once, publish twice); the arc-done rewrite composes the whole-program
  landmark. (Sal, ratified at propose)

## Open questions

(none — all resolved to Decisions)
## Considered & out

- **2026-08-10 — Stacked per-change PRs in per-architect mode (Shape B)**: per-change
  branches off the program branch, each with its own draft PR targeting it, plus the
  program PR. Rejected: too complicated — the extra branch+PR+merge ceremony per change
  duplicates what the archive gate already does (the in-repo trail, not GitHub reviews, is
  the review record). Could return as a future config extension if GitHub-visible
  per-change review units are ever wanted. (Sal)
- **2026-08-10 — Engine-composed PR body**: rendering the PR description from the status/
  boot surfaces (a `pr-render`). Rejected in favor of agent-written narrative: the PR is a
  retrospective landmark, and live state already has in-repo surfaces; an engine mirror
  would optimize the wrong job. (Sal)
- **2026-08-11 — A repo-level `pr.branch: per-change | per-architecture` config key**:
  rejected — wrong-grained: a repo holds program-cited AND standalone changes side by side
  (this repo is the proof), and the key would duplicate — and could contradict — what the
  change's `architecture:` citation already declares. The citation selects; config only
  enables and times. (Sal)
- **2026-08-10 — Skip-the-PR-step on AI-mediated propose (the D1-carried (f) leaning)**:
  rejected — provenance-varying BEHAVIOR (silent skip + catch-up rule) confuses; D1's own
  pattern gates ENTRY, never degrades behavior after it. Superseded by the
  provenance-invariant decision. (Sal: "will get confused if it doesn't")
- **2026-08-10 — Absorbing the merge / auto-merge-on-green (`gh pr merge --auto`)**:
  considered as the tail's final step for per-proposal PRs. Rejected — READY is the
  terminus; merge is the most irreversible outward act and stays the human's, per the
  charter. Auto-merge could return as an opt-in config value if the manual merge ever
  proves to be a pause that buys nothing. (Sal)

## References

- `orbit/architecture/d-arc-arbitered-flow.md` — Stage d6-pr-lifecycle section (the charter; Depends-on: d1-explicit-lifecycle-consent, SHIPPED)
- `orbit/changes/archive/2026-07-13-explicit-lifecycle-consent/explore.md` — D-elc-6 tombstone (the full PR-direction rationale)
- `openspec-parallel-merge-plan.md` — Phase 3.3 (prior art for branch/PR mechanics)
- `orbit/specs/orbit-review-external/spec.md` — the committed-and-pushed handoff preflight (the shared pushed-branch requirement)
- `orbit/specs/orbit-lifecycle-consent/spec.md` — the provenance vocabulary question (f) builds on
