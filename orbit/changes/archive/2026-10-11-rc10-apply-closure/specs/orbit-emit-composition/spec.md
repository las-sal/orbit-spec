## MODIFIED Requirements

### Requirement: Payload schema references are proven by execution

Every payload schema block in a shipped skill reference — today six blocks across five references: the review skill's `run-summary-schema.md` (change modes; architecture mode) and `external-handoff.md` (the review-external T0 payload), and the address-reviews, audit-drift and archive schema references — SHALL be accompanied, in the same reference, by its example payloads — normally ONE, and more only where the block documents fields that cannot appear in one payload together: each a fenced block whose info string is `json example` followed by one or more scope words, holding real JSON that is EXACTLY a payload file the skill's body tells the AI to write. An example carries NO ENGINE-OWNED field — no spine field the engine composes and no engine-computed extension; `model` is always present, and `final_assessment` is present wherever the command's payload table carries it. An example belongs to the NEAREST PRECEDING full-record schema block in the same reference (a JSON block whose top-level keys include `command`); an example preceding every such block belongs to none and fails the test. A worked example a reference shows for illustration is NOT a schema block and SHALL omit `command`, so the definition matches schema blocks only — and a worked example that carries `command` fails loudly, as a schema block with no example, never silently. A block's examples JOINTLY carry every AI-supplied key the block documents: the union of their top-level keys, excluding `model`, equals the block's top-level keys minus the engine-owned list the field-set test subtracts and minus the GENRE-DEPENDENT keys named below; `model` is asserted present in every example separately. So a documented field is EXECUTED, never only compared, and an optional field appears in an example rather than being left out of it. The GENRE-DEPENDENT keys are a closed list — today one, the review payload's `verification`, which the write gate owes on a VERIFICATION-genre pass and refuses on a REVIEW-genre pass, so its acceptance turns on walk records in the trail rather than on the example: such a key is exempt from joint coverage by name, and its acceptance stays proven by the write gate's own tests. The example is taken from the reference's own text, verbatim: never by instantiating the schema block's documentation dialect (`"<placeholder>"` strings, `"a" | "b"` unions) and never from a fixture written in a test — those are the three places a payload can come from, and only the first is the reference.

A test SHALL submit each example, unchanged, through the engine's real write gate (`composeAndWriteEmit`) in a disposable project, once per scope word on its info string, and SHALL assert that the gate ACCEPTS it and writes the emit. No engine-owned key is stripped before submission: an example that supplies one is refused, as it would be in use, and the test fails carrying the gate's own error text. The scope words are a closed set, decided by this table:

| scope word | target the test submits to |
|---|---|
| `change` | an active change directory created in the disposable project |
| `archived` | an archived change directory (`orbit/changes/archive/<date>-<name>/`) created in the disposable project — the archive command's only target, and address-reviews' archived fallback |
| `project` | no target (the bare project-scoped invocation) |
| `doc` | an architecture doc created in the disposable project |
| any other word, or none | the test fails naming the block's opening line |

**Seeding.** Where a write-gate check reads state beside the payload, the test SHALL seed the disposable project, before submission, by exactly two rules, and nothing else:

- **The trail.** The `judgements` ordering check refuses a `formed_against` token that names no accepted independent pass, so the test seeds ONE minimal independent pass file at every token an example names in a `formed_against` array.
- **The tasks file.** The archive write gate refuses an unchecked `(User-validation` task without a deferral and a deferral naming no such task (`orbit-archive-modifications`' `User-validation closure at the archive seam`), so the test seeds the target's `tasks.md` with ONE unchecked task carrying the `(User-validation` marker at every task id an example names in a `deferred_validations` array. An example naming none is submitted against a `tasks.md` carrying no marked task.

Seeding never edits the example; a check that reads state no example names is outside what seeding supplies and is named in the residual below.

The schema block remains documentation and may show spine and engine-computed keys, marked as such; the field-set test of `Payload tables agree with their schema references` continues to check that block.

**Named limit.** The round trip is exactly as strong as the write gate's validators. Residual kind: a documented field type or value the write gate does not validate (today most fields of every command; audit-drift's `categories_run`, `findings` and finding `category` are checked by `Audit-drift counts are engine-computed`), a write-gate check reading trail or tasks-file state that no example's `formed_against` or `deferred_validations` names, and the genre-dependent keys exempted above (today `verification`), which no example executes. Residual method: read each command's validators in `emit-composition.ts`; a documented constraint with no validator is outside the round trip and stays a reviewer's claim.

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

- **WHEN** a schema block documents an AI-supplied key, not on the closed genre-dependent list, that none of its examples carries
- **THEN** the round-trip test fails naming the key and the block — the field would otherwise be compared and never executed

#### Scenario: An example attaches to the nearest preceding schema block

- **WHEN** a field documented in the review reference's architecture-mode block is carried only by the change-mode block's example
- **THEN** the test fails naming the field and the architecture-mode block — coverage is checked per block, by attachment, never pooled across a reference

#### Scenario: A genre-dependent key is exempt by name, and only by name

- **WHEN** the review change-mode block documents `verification` and its example omits it
- **THEN** the joint-coverage check passes for that key — and the same omission of any key not on the closed genre-dependent list fails

#### Scenario: The archive example runs against an archived target with a seeded trail

- **WHEN** the archive reference's example (info string `json example archived`) carries a `readiness` judgement whose `formed_against` names one pass token, and a `deferred_validations` entry naming one task
- **THEN** the test creates the archived change directory, writes one minimal independent pass file at that token in its trail and one unchecked `(User-validation` task at that id in its `tasks.md`, submits the example unchanged, and asserts acceptance

#### Scenario: An unknown scope word fails the test

- **WHEN** an example's info string is `json example archive-dir`
- **THEN** the test fails naming that block's opening line; the example is not submitted

#### Scenario: A schema block without an example fails

- **WHEN** a payload schema reference carries a schema block and no `json example` block
- **THEN** the round-trip test fails naming the reference
