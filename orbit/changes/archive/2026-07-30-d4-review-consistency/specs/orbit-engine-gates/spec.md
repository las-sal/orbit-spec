## MODIFIED Requirements

### Requirement: v1 freshness rule — timestamp-token ordering

A pass SHALL be marked STALE when an artifact-changing event exists whose `.orbit-runs/` filename
`<TS>` token is lexically later than the pass's token. v1 artifact-changing events are
`apply-*.json` emits (an apply is the one v1 event that rewrites the artifacts a review pass
judged, so any pass predating it no longer describes current state — D-arc Stage D4 collapsed
the prose formerly restating this in `orbit-review`; the semantics live here alone). Tokens are `YYYY-MM-DDTHH-MM-SSZ` and compare lexically. Files with unparseable
tokens are treated as absent. **v1 scope limitation**: because the only v1 artifact-changing event
is `apply-*.json` and no apply emit can exist before the `apply` gate runs, v1 freshness detects
POST-APPLY staleness only — a `review-proposal` pass never goes stale under v1 (artifact edits
during the proposal phase — address-reviews fixes, regeneration, hand edits — are not v1
artifact-changing events). The `inputs` freshness scope is declared for this upgrade path but is
not consulted by v1. Content-hash freshness is an explicit future upgrade: emits may later add
normalized input hashes keyed by `inputs` and the freshness function gains a clause — the
pure-function architecture is unchanged.

#### Scenario: Apply after pass marks the pass stale

- **WHEN** a review pass token precedes the latest `apply-*.json` token
- **THEN** the gate reports that pass STALE with the reason naming both tokens

#### Scenario: Resolution traffic does not trigger staleness

- **WHEN** only `address-reviews-*.json` or `review-*-*.json` files are newer than a pass
- **THEN** the pass is NOT stale (per-external scoping: resolution and re-review traffic are not
  artifact-changing events)
