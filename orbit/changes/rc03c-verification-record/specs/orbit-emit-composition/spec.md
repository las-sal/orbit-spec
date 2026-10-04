## ADDED Requirements

### Requirement: The review emit records its pass genre and the walks it verifies

The surface SHALL compute, for every `review` emit in every mode, two COMPUTED EXTENSIONS — `pass_genre`, exactly one of the strings `REVIEW` | `VERIFICATION`, and `verified_walks`, an array of address-reviews record tokens — by ONE exported function implementing the pass-genre table that `orbit-conventions`' `Review mode decision framework` OWNS (this requirement names the table and restates none of its rows). The function's inputs are the trail reader's ACCEPTED pass set, its address-reviews records, and the pass's own `reviewer_class`, `mode` and filename token; it reads only records whose tokens precede that token. `verified_walks` is the table's QUALIFYING-WALK set for the pass, in token order — the SAME computation that decides the genre, so for an `in-context` pass in proposal or system mode `verified_walks` is non-empty exactly when `pass_genre` is `VERIFICATION`, and for every other pass `pass_genre` is `REVIEW` and `verified_walks` is `[]`. The set is UNNARROWED: a prior in-context pass does not move the qualifying-walk lower bound, so a second VERIFICATION-genre pass re-lists the walks an earlier one verified, which is how a later walk undoing an earlier fix is caught. A walk's MODE resolves through the accepted pass set: an address-reviews record whose `source_path` names an accepted pass of mode M is a walk of mode M; one whose source names a REJECTED external return, names no pass on the trail, or is null is MODE-LESS and qualifies for no mode. The function lives outside `src/core/artifact-graph/gates.ts`, which carries no diff for it, and the gate graph reads neither field (R-crc-13); `orbit-report-rendering` recomputes the genre at render time through the same function. Both fields are engine-owned and REJECTED when present in the payload, naming the field. Prior-generation emits lack both and stay valid on the trail; the computation runs at write time only.

#### Scenario: The worked trail computes VERIFICATION over two walks

- **WHEN** a system-mode trail holds a `fresh` pass at `03-55-35Z`, an accepted `external` return at `03-57-21Z`, a walk at `04-08-51Z` whose source is the fresh pass, and a walk at `04-12-35Z` whose source is the external return, and an `in-context` system-mode review is emitted after them
- **THEN** the emit carries `pass_genre: "VERIFICATION"` and `verified_walks` naming the two walk tokens in token order

#### Scenario: Independent classes and architecture mode compute REVIEW

- **WHEN** a `fresh` or `external` pass is emitted at any trail position, or any pass is emitted under `--as architecture`
- **THEN** the emit carries `pass_genre: "REVIEW"` and `verified_walks: []`

#### Scenario: A walk of a rejected external return is mode-less

- **WHEN** the only walk after the latest accepted independent pass names, as its `source_path`, an external findings file the trail reader rejected
- **THEN** that walk qualifies for no mode, and an in-context pass after it computes `REVIEW` with `verified_walks: []`

#### Scenario: A second VERIFICATION-genre pass re-lists earlier walks

- **WHEN** an in-context pass has verified walks W1 and W2, a walk W3 resolves its findings, and a further in-context pass of the same mode is emitted with no independent pass in between
- **THEN** the further pass carries `verified_walks` naming W1, W2 and W3

#### Scenario: Payload-supplied genre fields are refused

- **WHEN** a review payload supplies `pass_genre` or `verified_walks`
- **THEN** the surface exits non-zero naming the field as engine-owned; no file is written

### Requirement: A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record

The `review` command's payload table SHALL admit `verification` — an array of objects `{title, file, verdict}`, `title` and `file` non-empty single-line strings, `verdict` exactly one of `landed` | `regressed`, no other key — and each `findings[]` entry SHALL admit an optional `walk_entry` — an object `{title, file}`, both non-empty single-line strings, no other key. THIS requirement owns both shapes and the meaning of the two verdicts; every other spec names it and re-lists nothing.

**The owed set.** An entry of a READABLE address-reviews record named in the emit's computed `verified_walks` OWES a verdict exactly when its disposition is `resolved`, at every severity — `stale`, `deferred` and `escalated` claim no edit and owe nothing. An owed entry is KEYED by the tuple the gate uses for resolution (trimmed, case-sensitive title + repo-relative file, any `:line` suffix stripped — per `orbit-engine-gates`' reviewed-gate resolution), and the payload's `verification[]` and `walk_entry` keys are normalized by the SAME rule before every check below (every refusal prints the normalized form); a key carried `resolved` by ANY walk of `verified_walks` is ONE owed entry, judged against the LATEST walk that carries it `resolved` — a later walk carrying the same key at another disposition (a `stale` call naming the earlier fix) does not lift the obligation, since that earlier edit is exactly what a verification checks; an UNREADABLE record owes nothing (it stays listed in `verified_walks`). `orbit-conventions`' pass-genre table says a verification answers "per resolution"; by this requirement that reads as per OWED (`resolved`) entry.

**The verdicts**, stated once here: `landed` — the resolution's edit is PRESENT, COMPLETE across every site the resolution claims, CLEAN (it introduced no defect), and NOT UNDONE by a later edit; `regressed` — any of those fails, or the verifying pass cannot decide (an undecidable claim is not a held one). A `regressed` verdict's cause is stated by the finding that names it.

**The write gate** refuses, exiting non-zero with no file written and empty stdout, naming what it refuses: a `verification` or `walk_entry` that is mis-shaped, at ANY genre; a payload whose computed `pass_genre` is `VERIFICATION` and which carries no `verification` (naming the field and the owed count) — with ZERO owed entries the field is still owed, as `[]`, so a present empty array records that the pass checked and found nothing to grade; a `verification` that omits an owed key (naming EACH missing key as `walk <token>: (<title>, <file>)`, so the refusal itself tells the author the owed set); a verdict whose key is not owed, or a second verdict for one key; a `verification` field in ANY form, `[]` included, on a `REVIEW`-genre pass; a `walk_entry` naming a key carried by no readable record of `verified_walks` (on a `REVIEW`-genre pass every `walk_entry` names nothing); a `walk_entry` naming an owed key whose verdict is `landed`; and a `regressed` verdict that no finding's `walk_entry` names. A `walk_entry` MAY name an entry of ANY disposition — a finding that a walk dismissed a real finding as `stale` links to that entry. A finding WITHOUT `walk_entry` is never refused: on a pass carrying `verification` it renders marked, per `orbit-report-rendering`'s `Verification renders as its own section and its absence is marked`. The engine judges shape, presence, completeness and existence only (R-crc-10): whether a verdict is TRUE, and whether a `walk_entry` is RELEVANT to its finding, are the verifying pass's recorded judgement and the readiness author's to read; the gate graph reads none of it (R-crc-13). `references/run-summary-schema.md` names both fields and the schema-table parity test derives them. Prior-generation emits are untouched: the checks run at write time only.

#### Scenario: Owed record absent is refused

- **WHEN** an in-context system-mode payload computes `pass_genre: "VERIFICATION"` over walks holding nine `resolved` entries and carries no `verification`
- **THEN** the surface exits non-zero naming `verification` and the nine owed entries; no file is written

#### Scenario: A complete record writes

- **WHEN** the same payload carries nine verdicts, one per owed key, each `landed` or `regressed`, and every `regressed` key is named by a finding's `walk_entry`
- **THEN** the emit writes with `verification` verbatim beside the computed `pass_genre` and `verified_walks`

#### Scenario: A missing key is named with its walk

- **WHEN** a VERIFICATION-genre payload's `verification` omits one owed entry
- **THEN** the refusal names that entry as `walk <token>: (<title>, <file>)`; no file is written

#### Scenario: Only resolved entries owe a verdict

- **WHEN** a verified walk holds two `resolved` WARNING entries and one `stale` WARNING entry
- **THEN** two verdicts are owed; a verdict for the `stale` entry's key is refused as not owed

#### Scenario: A key in two walks owes one verdict

- **WHEN** two walks of `verified_walks` both carry a `resolved` entry with the same (title, file)
- **THEN** exactly one verdict is owed for that key, judged against the later walk's `resolved` entry; a second verdict for the key is refused

#### Scenario: An unreadable walk owes nothing

- **WHEN** a walk in `verified_walks` is unreadable to the trail reader
- **THEN** it owes no verdict and remains listed in `verified_walks`

#### Scenario: A regressed verdict needs its finding

- **WHEN** a payload's `verification` carries `{title: "T", file: "F", verdict: "regressed"}` and no finding carries `walk_entry: {title: "T", file: "F"}`
- **THEN** the surface exits non-zero naming the unpaired `regressed` key; no file is written

#### Scenario: A finding against a landed entry is a contradiction

- **WHEN** a finding carries `walk_entry` naming a key whose verdict is `landed`
- **THEN** the surface exits non-zero naming the contradiction; no file is written

#### Scenario: A finding may link to a stale entry

- **WHEN** a verifying pass finds that a walk wrongly dismissed a finding as `stale`, and its finding carries `walk_entry` naming that `stale` entry
- **THEN** the emit writes; the stale entry owes no verdict and the link is accepted

#### Scenario: Records and links on a REVIEW-genre pass are refused

- **WHEN** a payload whose computed `pass_genre` is `REVIEW` carries `verification` — `[]` included — or a finding carrying `walk_entry`
- **THEN** the surface exits non-zero naming the field or the unresolvable link; no file is written

#### Scenario: Zero owed entries still owe an empty record

- **WHEN** a payload computes `VERIFICATION` over walks whose entries are all `stale`, `deferred` or `escalated`
- **THEN** a payload without `verification` is refused naming the field and an owed count of 0, and the same payload with `"verification": []` writes

#### Scenario: Payload keys are normalized before matching

- **WHEN** an owed entry is keyed (`T`, `design.md`) and the payload's verdict names `{"title": " T ", "file": "design.md:42"}`
- **THEN** the verdict matches the owed key; a key that still matches nothing after normalization is refused naming its normalized form

#### Scenario: A later stale call does not lift an earlier resolution

- **WHEN** walk W1 carries (`T`, `F`) `resolved` and a later walk W3 of `verified_walks` carries (`T`, `F`) `stale`
- **THEN** (`T`, `F`) is owed, judged against W1's entry

#### Scenario: Mis-shaped verdicts are refused at any genre

- **WHEN** a payload carries `"verification": [{"title": "T", "file": "F", "verdict": "fixed"}]`, or an entry with an extra key, or a `walk_entry` that is a string
- **THEN** the surface exits non-zero naming `verification[<i>].verdict` (or the extra key, or `findings[<i>].walk_entry`); no file is written

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
`passes_run`, `passes_skipped`, the optional `blocks`, `direction` — OPTIONAL on an `in-context` pass and OWED by a `fresh` or `external` one, per `The review payload carries direction` — and `verification` — OWED when the emit's computed `pass_genre` is `VERIFICATION`, each finding entry optionally carrying `walk_entry`, per `A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record` (the genre and its walk set are computed extensions, per `The review emit records its pass genre and the walks it verifies`); address-reviews: the `source*` fields, `walk_mode`,
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
