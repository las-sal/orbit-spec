## MODIFIED Requirements

### Requirement: Single-session operating assumption and v1 limits

The PR layer SHALL be specified for orbit's actual operating model — SINGLE USER, SINGLE
SESSION, one lifecycle command at a time (every lifecycle command runs in the user's own session —
typed, prompted, or granted by the user's own `chain` setting per `orbit-lifecycle-consent` — and the
no-chaining contract runs the next one only after the current one ends). CONCURRENT operation is therefore an explicit NON-GOAL of
this capability: two changes archiving onto one program branch simultaneously, racing
PR-body appends, and multi-session branch contention are UNDEFINED and unsupported in v1.
The layer SHALL NOT carry serialization, locking, optimistic-retry, or conflict-merge
machinery for them.

What the layer DOES carry instead is honest DETECTION at the one point where a stale view
becomes visible: the remote-tip comparison before reusing a branch (per
`orbit-propose-modifications`' branch preconditions) and the push-rejection degradation on
both the propose choreography and the archive tail. A diverged or rejected state SKIPS with
a one-line note naming it — the user, whose session it is, resolves it; a chained archive's
tail that skips this way ends the archive with that note, and nothing retries it. This is
detection without a protocol: the failure is surfaced, never silently merged or retried.

#### Scenario: Concurrency is out of scope, divergence is still detected

- **WHEN** a program branch's remote tip has moved for any reason (another session, a manual push, a teammate)
- **THEN** the choreography detects the divergence at its remote-tip check and skips with a one-line note; no lock is taken, no retry loop runs, and no automatic merge or rebase is attempted

#### Scenario: A granted archive's rejected push skips like a typed one

- **WHEN** an archive granted by `chain.archive` reaches its tail and the push is rejected because the remote tip moved
- **THEN** the tail skips with the same one-line note as on a typed archive, the archive itself stays landed, and no
  retry, merge or rebase runs
