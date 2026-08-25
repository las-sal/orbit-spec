# orbit-emit-composition Delta

## MODIFIED Requirements

### Requirement: Generic emit surface with a narrative-only payload contract

The system SHALL expose `orbit emit <command> --change <name>` — ONE generic surface for
composing and writing run-summary emits (naming precedent: the verb-first `orbit fingerprint`).
The payload arrives as JSON on stdin or via `--payload <file>` — when `--payload` is present
stdin is not consulted (no both-channels ambiguity exists), and an absent payload (no flag,
empty or terminal stdin) is a clean non-zero error naming both channels with no file
written — and carries ONLY the
narrative/authored fields for that command per an AUTHORITATIVE engine-owned per-command
payload-field table (the fields the emitting AI genuinely authors — review: `mode`,
`reviewer_class`, `depth`, `flags`, `scorecard`, `findings`, `stale_suppressed`, `commentary`,
`passes_run`, `passes_skipped`; address-reviews: the `source*` fields, `walk_mode`,
`resolutions`, the narrative `final_assessment` — its `iteration` is ENGINE-computed, the
count of prior address-reviews emits on the resolved trail plus one, ANCHORED PER DOC on the
shared architecture trail (a doc-scoped walk counts only logs whose `doc` matches — the same
per-doc rule as the review-architecture ordinal; doc B's walk never counts doc A's logs),
rejected when payload-supplied; propose and ff additionally accept an OPTIONAL structured
`pr_attachment` object (`{branch, granularity, url?, state?, doc?}` — the composite ATTACHMENT
record whose owning definition and key semantics live in `orbit-run-summary-emit`), and
archive additionally accepts OPTIONAL `pr_url` and `pr_state` narrative pass-through fields
(archive RESOLVES no attachment — it reads the one propose/ff recorded and reports the PR
state it observed) (per `orbit-pr-lifecycle` — the trail records
the outward PR artifact's URL and state AS OBSERVED AT EMIT TIME, never a forward-looking
claim: `pr_state` is exactly one of the two lowercase strings `"draft"` or `"ready"` (a
closed or merged PR is NOT representable — the field records the draft/ready axis only, and
a body that cannot observe the state elides the field). The archive emit is written after the
tail's READ-ONLY PREFLIGHT and before its mutations, so it records what the preflight
OBSERVED — normally `"draft"`, and truthfully `"ready"` when the PR was already flipped (by
the USER at an earlier point, including at a prior program's arc-done for a program PR
adopted afterward — never by a stage);
the READY transition that the tail performs afterward is evidenced by the PR itself and the
completion readout, NOT by a field asserting a state that has not happened. Both fields are
elided when absent, never computed by the engine); the table's per-command rows derive from the
owning capability's emit definitions, and these inline lists are EXCERPTS of that derivation —
the owning capability's definition governs when they diverge). Fields the engine owns (`command`, `timestamp`,
`change`, `kind`, the filename token, every deterministic fact per the deterministic-facts
requirement, and every computed extension) SHALL be REJECTED when present in the payload with
a clean error naming the field — a second voice on a computable fact is refused at the seam,
never silently overwritten. Keys in NEITHER the command's payload table nor the engine-owned
set SHALL likewise be REJECTED naming the key — a typo'd narrative key (`pases_run`) fails
loudly at the seam, never passes silently into the record. The per-skill
`references/run-summary-schema.md` payload lists MIRROR the engine table, never define it. An
unknown `<command>` fails with a clean error naming the emittable command set. The payload SHALL include a `model` key (nullable — the emitting AI's model
identity, or explicit `null` when unknown); a payload missing the key is rejected naming it,
so provenance is always a conscious act.

#### Scenario: Payload carries only authored fields

- **WHEN** `orbit emit review --change foo` receives a payload with `mode`, `reviewer_class`, `depth`, `scorecard`, `findings: []`, and `model`
- **THEN** the engine composes the full emit around those fields and writes it to `orbit/changes/foo/.orbit-runs/review-<mode>-<TS>.json`

#### Scenario: Engine-owned field in the payload is rejected

- **WHEN** a payload includes `timestamp` or `next_recommended`
- **THEN** the surface exits non-zero with a clean error naming the engine-owned field; no file is written

#### Scenario: Unknown payload key is rejected

- **WHEN** a review payload includes `pases_run` — a key in neither the review payload table nor the engine-owned set
- **THEN** the surface exits non-zero with a clean error naming the unknown key; no file is written

#### Scenario: Missing model key is rejected

- **WHEN** a payload omits the `model` key entirely
- **THEN** the surface exits non-zero naming `model` (explicit `null` is accepted); no file is written

#### Scenario: Unknown command

- **WHEN** `orbit emit frobnicate --change foo` is invoked
- **THEN** the surface exits non-zero with a clean error naming the supported command set; no file is written

#### Scenario: PR pass-through fields record emit-time truth

- **WHEN** an archive payload includes `pr_url` and `pr_state` carrying the value the read-only preflight observed — `"draft"` ordinarily, or `"ready"` for a PR already flipped before this archive
- **THEN** the written emit carries both fields verbatim; the engine enforces the enum and the observed-not-predicted contract, not a particular value (a body composing a state it did NOT observe is the false record — including asserting `"ready"` on the strength of a flip the tail has yet to perform); the same fields on a review payload are rejected as unknown keys
