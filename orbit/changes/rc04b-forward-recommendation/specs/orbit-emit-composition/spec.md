## ADDED Requirements

### Requirement: The review payload carries `direction`

The `review` command's payload table SHALL admit a `direction` field — an object `{disposition, reasoning}` carrying the reviewer's FORWARD RECOMMENDATION: `disposition` exactly one of the two strings `forward` | `hold`, `reasoning` a non-empty string (multi-line allowed, never a single-line slot) — the reviewer's reasoning, whose CONTENT contract `orbit-report-rendering`'s `Direction renders as its own section and its absence is marked on independent passes` owns; THIS requirement owns the SHAPE, and every other spec names it and re-lists nothing. The write gate enforces PRESENCE BY CLASS and SHAPE AT EVERY CLASS, in ANY mode (`mode` is never read): a payload whose `reviewer_class` is `fresh` or `external` — the gate model's independent classes, by the ONE predicate `orbit-engine-gates`' cadence vocabulary already defines, exported rather than restated — and which carries no `direction` is refused, exiting non-zero naming `direction` and the class, writing no file, with empty stdout; a payload of ANY class whose present `direction` is not an object, whose `disposition` is outside the closed set, or whose `reasoning` is absent, non-string or blank after trimming is refused the same way naming `direction.<key>`; an `in-context` payload without the field writes; a payload whose `reviewer_class` is not one of `in-context` | `fresh` | `external` is refused by this check naming the three values — in every mode, because the architecture-mode write gate validates the class nowhere else and an unrecognised class would otherwise read as not-owed. The `external` × `architecture` cell cannot reach this gate: `--reviewer external` requires `--as proposal|system` (a clean usage error, per `orbit-review`). The field is pass-through narrative: never counted in the scorecard rollup, never read by the gate graph, rendered by `orbit-report-rendering` in its own section. The engine judges presence and shape only (R-crc-10): whether the direction is RIGHT, and whether its reasoning agrees with its token, is the in-context reaction's and the readiness author's judgement (R-crc-11(f), (g)). The vocabulary is `orbit-run-summary-emit`'s judgement record's (`disposition` + `reasoning`, a kind-specific value set) — adopted, not invented. `references/run-summary-schema.md` names it and the schema-table parity test derives it.

#### Scenario: Independent class without a direction refused

- **WHEN** a review payload carries `"reviewer_class": "fresh"` (or `"external"`) and no `direction` key
- **THEN** the surface exits non-zero with `write gate: review emit of class 'fresh' carries no direction — an independent pass owes its forward recommendation`; no file is written; stdout is empty

#### Scenario: In-context pass without a direction writes

- **WHEN** a review payload carries `"reviewer_class": "in-context"` and no `direction` key
- **THEN** the emit writes exactly as before this requirement — the field is optional on the reacting class

#### Scenario: Well-shaped direction accepted at any class

- **WHEN** a payload of any class carries `"direction": { "disposition": "hold", "reasoning": "the walk-authored mechanism…\n…" }`
- **THEN** the emit writes with the object verbatim; the scorecard rollup check and every gate input are unchanged by it

#### Scenario: Mis-shaped direction refused at any class

- **WHEN** a payload carries `"direction": "forward"`, or `{ "disposition": "ship", "reasoning": "…" }`, or `{ "disposition": "forward" }`, or `{ "disposition": "forward", "reasoning": "" }`, or `{ "disposition": "forward", "reasoning": 42 }`
- **THEN** the surface exits non-zero naming `direction` (or `direction.disposition` / `direction.reasoning`); no file is written — the gate and the renderer's normalizer agree, so no persisted record is unrenderable

#### Scenario: Unrecognised reviewer class refused

- **WHEN** a payload carries `"reviewer_class": "Fresh"` (or `"fressh"`) in any mode
- **THEN** the surface exits non-zero naming `reviewer_class` and the three values; no file is written — the owed check never silently reads a typo as not-owed

#### Scenario: Architecture mode is checked the same way

- **WHEN** `orbit emit review --doc <doc>` composes an architecture-mode summary with `"reviewer_class": "fresh"` and no `direction`
- **THEN** it is refused exactly as a change-mode payload is — the rule keys on class, never on mode

#### Scenario: Prior-generation emits are untouched

- **WHEN** the trail holds a fresh review emit written before this requirement with no `direction`
- **THEN** every reader (trail, render, gate) accepts it as before — the check runs at write time only; the report marks the pass `[no direction]` per `orbit-report-rendering`, by absence, never by date

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
`passes_run`, `passes_skipped`, the optional `blocks`, and `direction` — OPTIONAL on an `in-context` pass and OWED by a `fresh` or `external` one, per `The review payload carries direction`; address-reviews: the `source*` fields, `walk_mode`,
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
closed or merged PR is NOT representable — the field records the draft/ready axis only, so a
body elides the field both when it CANNOT observe the state and when it observes a condition
off that axis; `pr_url` may still accompany an elided `pr_state`, recording which PR was
observed). The archive emit is written after the
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
