## ADDED Requirements

### Requirement: Payload schema references are proven by execution

Every payload schema block in a shipped skill reference — today six blocks across five references: the review skill's `run-summary-schema.md` (change modes; architecture mode) and `external-handoff.md` (the review-external T0 payload), and the address-reviews, audit-drift and archive schema references — SHALL be accompanied, in the same reference, by its example payloads — normally ONE, and more only where the block documents fields that cannot appear in one payload together: each a fenced block whose info string is `json example` followed by one or more scope words, holding real JSON that is EXACTLY a payload file the skill's body tells the AI to write. An example carries NO ENGINE-OWNED field — no spine field the engine composes and no engine-computed extension; `model` is always present, and `final_assessment` is present wherever the command's payload table carries it. A block's examples JOINTLY carry every AI-supplied key the block documents: the union of their top-level keys equals the block's top-level keys minus the engine-owned list the field-set test subtracts, so a documented field is EXECUTED, never only compared, and an optional field appears in an example rather than being left out of it. The example is taken from the reference's own text, verbatim: never by instantiating the schema block's documentation dialect (`"<placeholder>"` strings, `"a" | "b"` unions) and never from a fixture written in a test — those are the three places a payload can come from, and only the first is the reference.

A test SHALL submit each example, unchanged, through the engine's real write gate (`composeAndWriteEmit`) in a disposable project, once per scope word on its info string, and SHALL assert that the gate ACCEPTS it and writes the emit. No engine-owned key is stripped before submission: an example that supplies one is refused, as it would be in use, and the test fails carrying the gate's own error text. The scope words are a closed set, decided by this table:

| scope word | target the test submits to |
|---|---|
| `change` | an active change directory created in the disposable project |
| `archived` | an archived change directory (`orbit/changes/archive/<date>-<name>/`) created in the disposable project — the archive command's only target, and address-reviews' archived fallback |
| `project` | no target (the bare project-scoped invocation) |
| `doc` | an architecture doc created in the disposable project |
| any other word, or none | the test fails naming the block's opening line |

**Trail seeding.** Where a write-gate check reads the change's trail — today the `judgements` ordering check, which refuses a `formed_against` token that names no accepted independent pass — the test SHALL seed the disposable project's trail, before submission, with ONE minimal independent pass file at every token an example names in a `formed_against` array, and nothing else. Seeding never edits the example; a check that reads trail state no example names is outside what seeding supplies and is named in the residual below.

The schema block remains documentation and may show spine and engine-computed keys, marked as such; the field-set test of `Payload tables agree with their schema references` continues to check that block.

**Named limit.** The round trip is exactly as strong as the write gate's validators. Residual kind: a documented field type or value the write gate does not validate (today most fields of every command; audit-drift's `categories_run`, `findings` and finding `category` are checked by `Audit-drift counts are engine-computed`), and a write-gate check reading trail state that no example's `formed_against` names. Residual method: read each command's validators in `emit-composition.ts`; a documented constraint with no validator is outside the round trip and stays a reviewer's claim.

**Outside this requirement, by name.** The findings formats a reference documents (`external-findings-format.md`, `internal-findings-format.md`) and the review prompt template's output format — whose surfaces are the external-findings readers, not the write gate — and `orbit …` invocations written inside references. Neither is proven by this test.

#### Scenario: A refused example fails by execution

- **WHEN** a schema reference's example supplies a key its command's payload table does not accept
- **THEN** the round-trip test fails, and its message carries the write gate's `unknown payload key` error naming the key

#### Scenario: An engine-owned key in the example is refused, not stripped

- **WHEN** the audit-drift reference's example supplies `next_recommended`
- **THEN** the write gate refuses the payload naming the field as engine-owned and the round-trip test fails — the test removes nothing before submission

#### Scenario: Each scope word is exercised

- **WHEN** the audit-drift example's info string is `json example change project`
- **THEN** the test submits the example twice — once to a change in the disposable project, once with no target — and both submissions must be accepted

#### Scenario: A documented field missing from every example fails

- **WHEN** a schema block documents an AI-supplied key that none of its examples carries
- **THEN** the round-trip test fails naming the key and the block — the field would otherwise be compared and never executed

#### Scenario: The archive example runs against an archived target with a seeded trail

- **WHEN** the archive reference's example (info string `json example archived`) carries a `readiness` judgement whose `formed_against` names one pass token
- **THEN** the test creates the archived change directory, writes one minimal independent pass file at that token in its trail, submits the example unchanged, and asserts acceptance

#### Scenario: An unknown scope word fails the test

- **WHEN** an example's info string is `json example archive-dir`
- **THEN** the test fails naming that block's opening line; the example is not submitted

#### Scenario: A schema block without an example fails

- **WHEN** a payload schema reference carries a schema block and no `json example` block
- **THEN** the round-trip test fails naming the reference

### Requirement: Audit-drift counts are engine-computed

The surface SHALL compute audit-drift's two count fields from the payload's `findings` array and SHALL refuse either one in the payload as engine-owned. Because the computation reads them, the write gate SHALL first refuse, naming the field, a payload whose `categories_run` is present and not an array of strings, whose `findings` is present and not an array, or whose finding carries a `category` that is not a non-empty string — a malformed input to the count is refused, never coerced. Then: `findings_total` is the length of `findings` (absent `findings` counts as empty), and `findings_by_category` is an object keyed by category id whose value is the number of findings carrying that `category` — one key for every id in `categories_run` (zero when no finding carries it) and one for every category a finding carries. `stale_suppressed` entries are not findings and are not counted. The `next_recommended` composition `orbit-run-summary-emit`'s `Audit-drift standalone recommendations` owns reads the COMPUTED total, so the findings-versus-clean branch can no longer disagree with the findings the emit records.

#### Scenario: A supplied count is refused

- **WHEN** `orbit emit audit-drift` receives a payload carrying `findings_total`
- **THEN** the write gate refuses it naming the field as engine-owned; no file is written

#### Scenario: Counts computed from findings

- **WHEN** an audit-drift payload carries `categories_run: ["1", "3", "4"]` and two findings, both `category: "3"`
- **THEN** the written emit carries `findings_total: 2` and `findings_by_category: {"1": 0, "3": 2, "4": 0}`, and `next_recommended` takes the findings branch

#### Scenario: A malformed count input is refused, never coerced

- **WHEN** an audit-drift payload carries `categories_run: {"1": true, "3": true}` (the object shape an earlier spec prescribed), or `categories_run: [1, 3]`, or a finding with no `category`
- **THEN** the write gate refuses it naming the field; no file is written

#### Scenario: A finding outside the categories run is still counted

- **WHEN** an audit-drift payload carries `categories_run: ["1"]` and one finding with `category: "4"`
- **THEN** `findings_by_category` is `{"1": 0, "4": 1}` and `findings_total` is `1` — the two counts agree by construction

## MODIFIED Requirements

### Requirement: Payload tables agree with their schema references

For every emit command whose per-command schema is documented in a `references/*schema*.md` file (review, address-reviews, audit-drift, archive), a test SHALL derive the AI-supplied field set from that reference — the top-level keys of its schema block minus one explicit, asserted-non-empty list of engine-owned spine and computed fields — and assert that the command's `payloadFields` table accepts every derived field. A field the reference documents as AI-supplied but the table rejects is a failing test, never an archive-time discovery. The engine table remains the definition and the reference remains its mirror; the test makes them agree without changing which is authoritative. The test admits NO exemption: there is no list of tolerated divergences, so a reference that documents a field the table refuses is reconciled before it ships, never pinned. Commands whose payload fields are documented only inline in bodies are outside this requirement. That a documented payload is ACCEPTED is proven by execution, per `Payload schema references are proven by execution` below; this test checks only that the schema block names no field the table refuses.

#### Scenario: A documented conditional field is accepted by the table

- **WHEN** the archive schema reference documents `fingerprint_overridden`, `fingerprints_unverified`, and `audit_skipped_via_flag`
- **THEN** the parity test asserts each is in the archive command's `payloadFields`, and removing any one from the table fails the test naming the field and the reference

#### Scenario: Every full-record block is read

- **WHEN** a schema reference carries more than one JSON block whose top-level keys include `command` (the review reference documents change modes and architecture mode separately)
- **THEN** the parity test unions the blocks' keys before subtraction, so a field documented only in a later block (architecture mode's) is checked against the table like any other

#### Scenario: A new engine-owned key must be declared

- **WHEN** a schema reference gains a top-level key that is engine-composed rather than AI-supplied
- **THEN** the test fails until the key is added to the explicit engine-owned list — a visible edit, never a silent pass

#### Scenario: No divergence is tolerated

- **WHEN** a schema reference documents an AI-supplied field the command's `payloadFields` table does not contain
- **THEN** the parity test fails naming the field and the reference — there is no exemption list through which the field could pass, and adding one is itself a change to this requirement
