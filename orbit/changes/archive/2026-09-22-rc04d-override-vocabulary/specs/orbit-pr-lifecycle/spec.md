## MODIFIED Requirements

### Requirement: Generalized READY rule

READY SHALL mean: the branch's governing unit has reached its merge-eligible condition —
for a per-change branch, its change ARCHIVED (gates passed, baseline synced); for a program
branch, ARC-DONE. The flip is `gh pr ready` — a reversible GitHub metadata transition
(Draft → Ready for review) with no merge, push, or code effect. The CONDITION is uniform
across both granularities; WHO performs the flip is not, and deliberately so: a per-change
flip is PERFORMED by the archive tail (it happens constantly, and a body is present at the
exact moment the condition becomes true), while a program flip is SURFACED for the human
(it happens once per program, no body is present when arc-done becomes true, and the user is
standing at the ratification anyway). A change archived via a
recorded proceed-anyway override at the `review-system` gate SHALL still flip READY — the
recorded override IS
the user's ratification, and a draft PR contradicting the user's explicit decision would be
the falser record; the landmark narrative records the override. MERGING IS NEVER an orbit
action in either mode — READY is the terminus for per-change PRs; for program PRs both the
flip and the merge are the human's.

#### Scenario: Override still flips

- **WHEN** the user archives through the gate inflection prompt's Proceed-anyway with
  the override recorded
- **THEN** the tail still flips the PR to READY, and the achievement description names the
  override

#### Scenario: Orbit never merges

- **WHEN** any lifecycle command completes against a READY PR
- **THEN** no `gh pr merge` (or equivalent) is ever invoked by any orbit workflow or engine
  path
