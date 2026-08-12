# orbit-run-summary-emit Delta

## ADDED Requirements

### Requirement: PR fields on the propose and ff emits

The propose AND ff emits SHALL each carry OPTIONAL `pr_url` and `pr_state` fields when the PR layer
opened or touched a pull request during that invocation (per `orbit-pr-lifecycle`'s config
regimes) — `pr_url` the PR's URL, `pr_state` exactly one of the lowercase strings `"draft"`
or `"ready"` AS OBSERVED at emit time. Both are ELIDED when no PR was opened or touched
(`pr: never`, a degraded no-remote/no-`gh` repo, or a mid-flight choreography failure that
skipped the PR step) — an absent field is the honest record of "no PR at this seam", never
a null placeholder. The fields are NARRATIVE pass-through: the emitting body observes and
supplies them, the engine neither computes nor verifies them (it cannot — the PR lives
outside the repository).

For a CITED change under `pr: per-architecture`, the recorded `pr_url` is the PROGRAM PR's
(the change's outward window is the program's single PR); for the per-proposal path — and
the per-architecture fallback for an uncited change — it is the change's own PR. This
record is what makes the propose (or ff) emit the authoritative ATTACHMENT record the archive tail
reads back when it discovers the PR to act on (per `orbit-archive-modifications`), and what
freezes the change's granularity for its life (per `orbit-pr-lifecycle`).

#### Scenario: Propose or ff emit records the PR it opened

- **WHEN** propose — or `/orbit:ff`, which carries the identical choreography — opens a draft PR under `pr: per-proposal`
- **THEN** that command's emit carries `pr_url` and `pr_state: "draft"`, and the archive tail later reads that `pr_url` as the attachment record

#### Scenario: No PR means no fields

- **WHEN** propose or ff runs under `pr: never`, in a repo with no remote, or after a push failure skipped the PR step
- **THEN** both fields are elided from the emit — never present-and-null
