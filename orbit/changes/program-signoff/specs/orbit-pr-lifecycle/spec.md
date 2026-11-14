## MODIFIED Requirements

### Requirement: Program PR (Shape A) semantics

A program branch SHALL have exactly ONE PR — draft `<program-branch> → <default-branch>` —
born when the branch is born, or on the FIRST configured touch of a pre-existing
(mid-flight) program branch. Its body is APPENDED with a stage entry at each citing
change's archive (adapted from the arc status-log entry written at that same seam — the
narrative is written once and published twice); the accumulated entries ARE the program's
landmark, written incrementally, so no terminal rewrite is required. Stage archives NEVER
flip the program PR; per-change PRs are never opened for cited changes (stacked PRs are out).

The program PR's READY flip is a HUMAN ACT — orbit never performs it. ARC-DONE (every
declared stage archived AND the closing architecture review recorded, per R-d-3) is by
construction later than the last stage's archive, so no orbit body is present at the moment
it becomes true: the archive tail runs too early, and the closing review and completion
ratification are read-only over the PR. Instead the readout is OBSERVATION-DRIVEN and
IDEMPOTENT: ANY architect invocation that observes arc-done SHALL surface the remaining
human acts — not only a completion ratification. This matters because arc-done can become
true when no ratifiable stage remains: the natural order final-stage archive → final-stage
ratification → closing architecture review makes the condition true at the LAST step, after
the ratification interaction the baseline architect flow offers for a quiescent unratified
stage has already passed. Tying the readout to that interaction would mean the required
surfacing never appears. Because the readout is idempotent and derived from observed state
(never from a stored "already surfaced" flag), it appears at whichever invocation first
observes arc-done and re-appears on every later one until the PR is no longer draft — which
also makes it safe under either ordering. The DRAFT STATE IS READ LIVE, not from the located
record: `pr_attachment.state` is a POINT-IN-TIME OBSERVATION recorded at the attaching invocation
and never updated afterward, so it goes stale the moment anything touches the PR — whatever
its initial value was. (It is USUALLY `"draft"`, but not necessarily: an ADOPTED program PR
can be recorded already `"ready"`, which is why the schema admits both.) A readout gated on
the recorded value would therefore either nag forever after the human flips READY, or fall
silent against a PR that has since been reopened as a draft. The architect flow resolves the CURRENT state with a READ-ONLY `gh pr view --json
isDraft` query against the located URL — permitted here because it is an observation, not an
outward write, and the zero-engine-git rule constrains the ENGINE, not a body's reads. Validation has THREE outcomes here, and the readout is NEVER SUPPRESSED by any of them —
that invariant matters more than which one obtains, because arc-done is surfaced once per
program and a silent readout is indistinguishable from a program that is not finished:

- **Valid** — surface the PR, its live draft state, and the commands.
- **Query FAILED** (auth, network, `gh` unavailable) — surface anyway with a one-line
  `state unverified` note. Nothing is known, so nothing is claimed.
- **Positively INVALID** (the query succeeded and reports the recorded PR closed, merged,
  retargeted to another base, or belonging to a different repository) — FALL THROUGH to the
  SAME four-axis constrained query the archive tail uses (per
  `orbit-archive-modifications`' discovery rule — resolved repository, `--head
  <program-branch>`, `--state open`, base filtered to the resolved default branch), and
  surface whatever it finds. Its three outcomes are all REPORTED, never suppressed: exactly
  one survivor → surface it; ZERO → surface the readout stating the recorded PR is closed or
  merged and NO open replacement exists, so the human learns the program has no open PR
  rather than being handed a dead link; MORE THAN ONE → surface the readout naming ALL
  candidates. Listing candidates is correct HERE precisely because this seam only reports —
  the tail's ambiguity skip exists to avoid writing to the wrong PR, and there is no write
  to misdirect.

Under the sign-off setting's `program` value (`orbit-program-brief`'s `The sign-off setting holds a change's archive or a program's completion for the user's sign-off`), ARC-DONE further requires the user's sign-off over the program's latest saved
brief (D-ps-5 in `program-signoff`'s `explore.md`): an architect invocation observes it only once
`orbit brief <doc> --hold` reports the program signed — `why: "signed"`, or a `re-sign` the session asks nothing about
(`orbit-architect`'s `The architect session saves the program brief and asks for the program's sign-off`) — and until then the session asks for
the sign-off and surfaces no READY flip. The hold reads the two conditions above from the trail: every declared stage
finished, and the doc's closing review recorded after the last citing change's archive (`orbit-program-brief`'s
`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`). Under every other value arc-done is the two
conditions alone, observed as before.

The fall-through is deliberately the OPPOSITE of the archive tail's rule, where a positively
invalid record is ANSWERED rather than retried. The seams differ in risk, not in vocabulary:
the tail WRITES, so a second chance there could rewrite and flip the wrong pull request,
while this readout only REPORTS — the worst a fall-through can do is name a better URL. The readout names
the program PR's URL — located by scanning the change trails (active AND archived) for
`pr_attachment` objects whose `granularity` is `per-architecture` and whose `doc` MATCHES
this architecture doc, taking the most recent URL-BEARING record (never merely the most
recent match: `url` is deliberately optional after a failed query or failed PR creation, so
a later citing change can emit a `{branch, granularity, doc}` record with no URL, and
most-recent-wins would let that record permanently MASK the still-valid program PR the
program depends on surfacing), then validating it live; when no URL-bearing record exists,
fall back to the constrained query of `Remote and default-branch resolution`'s repository
with `--head <program-branch>`; the `doc` key is what makes this lookup
possible after the birth change has been archived, and what keeps two programs in one repo
distinguishable — its current DRAFT
state, and the exact commands (`gh pr ready <n>`, and `gh pr merge <n>` when satisfied) —
recommending, never invoking, per the residual outward-actions rule. A whole-program body
rewrite is OPTIONAL polish available on request, never a required transition step.

#### Scenario: A closed recorded PR falls through to the query, never suppressing the readout

- **WHEN** the arc-done readout validates the most recent URL-bearing record and finds that PR closed, merged, retargeted, or in another repository
- **THEN** it falls through to the constrained `--head <program-branch>` query and surfaces whatever that finds; if nothing is open, it still surfaces — stating the recorded PR is closed or merged and no open replacement exists — because the readout is never suppressed by a validation outcome

#### Scenario: Arc-done observed with no ratifiable stage remaining

- **WHEN** an architect invocation runs in the ordering final-stage archive → final-stage ratification → closing architecture review, so arc-done becomes true at the LAST step and no stage awaits ratification at the moment it is observed
- **THEN** the readout STILL surfaces the program PR's URL, its live draft state, and the `gh pr ready` / `gh pr merge` commands — this is the ordering a ratification-gated readout would miss entirely, and it is surfaced because the check is unconditional on every invocation

#### Scenario: Arc-done surfaces the human acts, orbit flips nothing

- **WHEN** the architect flow ratifies the final stage complete and `orbit architecture status` plus the architecture trail show every stage archived and the closing review recorded
- **THEN** the readout names the program PR's URL, its DRAFT state, and the `gh pr ready` / `gh pr merge` commands as the user's — and no orbit surface invokes either

#### Scenario: Under `program`, an unsigned program surfaces no READY flip

- **WHEN** under `signoff: program` every declared stage is archived, the closing review is recorded, and the program
  brief's latest saved copy carries no signature
- **THEN** the architect invocation asks the user to sign off or decline, and surfaces no `gh pr ready` until a
  `signoff` record says `signed`

#### Scenario: Stage archive appends, never flips

- **WHEN** a citing change archives while other declared stages remain unarchived
- **THEN** the program PR body gains an appended stage entry and remains DRAFT

#### Scenario: Mid-flight adoption

- **WHEN** `pr:` config is first enabled on a repo whose program branch already carries
  archived stages
- **THEN** the first configured touch opens the program PR as draft with its appended
  history starting at the current stage — no retroactive back-fill is required
