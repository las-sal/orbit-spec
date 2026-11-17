## MODIFIED Requirements

### Requirement: A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record

The `review` command's payload table SHALL admit `verification` — an array of objects `{title, file, verdict}`, `title` and `file` non-empty single-line strings, `verdict` exactly one of `landed` | `regressed`, no other key — and each `findings[]` entry SHALL admit an optional `walk_entry` — an object `{title, file}`, both non-empty single-line strings, no other key. THIS requirement owns both shapes and the meaning of the two verdicts; every other spec names it and re-lists nothing.

**The owed set.** An entry of a READABLE address-reviews record named in the emit's computed `verified_walks` OWES a verdict exactly when its disposition is `resolved`, at every severity — `stale`, `deferred` and `escalated` claim no edit and owe nothing. An owed entry is KEYED by the tuple the gate uses for resolution (trimmed, case-sensitive title + repo-relative file, any `:line` suffix stripped — per `orbit-engine-gates`' reviewed-gate resolution), and the payload's `verification[]` and `walk_entry` keys are normalized by the SAME rule before every check below (every refusal prints the normalized form); a key carried `resolved` by ANY walk of `verified_walks` is ONE owed entry, judged against the LATEST walk that carries it `resolved` — a later walk carrying the same key at another disposition (a `stale` call naming the earlier fix) does not lift the obligation, since that earlier edit is exactly what a verification checks; an UNREADABLE record owes nothing (it stays listed in `verified_walks`) — and for this record a walk the trail reader reads is ALSO unreadable when any of its entries normalizes to an empty title or an empty file, because no well-shaped verdict could name that key. `orbit-conventions`' pass-genre table says a verification answers "per resolution"; by this requirement that reads as per OWED (`resolved`) entry.

**The verdicts**, stated once here as a fenced production. An adopter's installed review skill has none of our specs, so the review body carries this fence as a CHECKED MIRROR, held byte-equal by a parity test (R-crc-14's mirror corollary, as `reduce-orbit-phase1`'s R-rop-14 amends it: the body's copy carries no note saying it is a mirror or naming this requirement); no other surface restates it:

```
landed — the resolution's edit is PRESENT, COMPLETE across every site the resolution claims, CLEAN (it introduced no defect), and NOT UNDONE by a later edit.
regressed — any of those fails, or the verifying pass cannot decide (an undecidable claim is not a held one); its cause is stated by the finding that names it.
```

**The write gate** refuses, exiting non-zero with no file written and empty stdout, naming what it refuses: a `verification` or `walk_entry` that is mis-shaped, at ANY genre; a payload whose computed `pass_genre` is `VERIFICATION` and which carries no `verification` (naming the field, the owed count and EACH owed key as `walk <token>: (<title>, <file>)`, exactly as the incomplete-record refusal does — this refusal is the channel through which a review body whose metadata probe read REVIEW learns the owed set) — with ZERO owed entries the field is still owed, as `[]`, so a present empty array records that the pass checked and found nothing to grade; a `verification` that omits an owed key (naming EACH missing key as `walk <token>: (<title>, <file>)`, so the refusal itself tells the author the owed set); a verdict whose key is not owed, or a second verdict for one key; a `verification` field in ANY form, `[]` included, on a `REVIEW`-genre pass; a `walk_entry` naming a key carried by no readable record of `verified_walks` (on a `REVIEW`-genre pass every `walk_entry` names nothing); a `walk_entry` naming an owed key whose verdict is `landed`, WHEN every entry carrying that key in `verified_walks` is `resolved` — when a `stale`, `deferred` or `escalated` entry shares the key, the link may concern that entry, so it is accepted whatever the verdict (a DECLARED gap: in that shared-key case a landed-plus-linked contradiction is not refused, and the link rendered beside the finding is what shows it); and a `regressed` verdict that no finding's `walk_entry` names. A `walk_entry` MAY name an entry of ANY disposition — a finding that a walk dismissed a real finding as `stale` links to that entry. A finding WITHOUT `walk_entry` is never refused: on a pass carrying `verification` it renders marked, per `orbit-report-rendering`'s `Verification renders as its own section and its absence is marked`. The engine judges shape, presence, completeness and existence only (R-crc-10): whether a verdict is TRUE, and whether a `walk_entry` is RELEVANT to its finding, are the verifying pass's recorded judgement and the readiness author's to read; the gate graph reads none of it (R-crc-13). `references/run-summary-schema.md` names both fields and the schema-table parity test derives them. Prior-generation emits are untouched: the checks run at write time only.

#### Scenario: Owed record absent is refused

- **WHEN** an in-context system-mode payload computes `pass_genre: "VERIFICATION"` over walks holding nine `resolved` entries and carries no `verification`
- **THEN** the surface exits non-zero naming `verification` and each of the nine owed entries as `walk <token>: (<title>, <file>)`; no file is written

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

- **WHEN** a finding carries `walk_entry` naming a key whose verdict is `landed`, and every entry carrying that key in `verified_walks` is `resolved`
- **THEN** the surface exits non-zero naming the contradiction; no file is written

#### Scenario: A shared key lets a stale finding link beside a landed verdict

- **WHEN** W1 carries (`T`, `F`) `resolved` and its edit holds, a later walk W2 carries (`T`, `F`) `stale` wrongly, and the verifying pass grades (`T`, `F`) `landed` and files a finding with `walk_entry: {title: "T", file: "F"}` about W2's call
- **THEN** the emit writes — the key is shared with a non-`resolved` entry, so the link is accepted whatever the verdict

#### Scenario: A walk with an entry no verdict can name is unreadable for the record

- **WHEN** a walk in `verified_walks` is readable to the trail reader but one of its `resolved` entries carries no `title`
- **THEN** that walk owes no verdict, stays listed in `verified_walks`, and renders as an unreadable row

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
