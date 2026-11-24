## MODIFIED Requirements

### Requirement: A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record

The `review` command's payload table SHALL admit `verification` — an array of objects `{title, file, verdict}`, `title` and `file` non-empty single-line strings, `verdict` exactly one of `landed` | `regressed`, no other key — and each `findings[]` entry SHALL admit an optional `walk_entry` — an object `{title, file}`, both non-empty single-line strings, no other key. THIS requirement owns both shapes and the meaning of the two verdicts; every other spec names it and re-lists nothing.

**The owed set.** An entry of a READABLE address-reviews record named in the emit's computed `verified_walks` OWES a verdict exactly when its disposition is `resolved`, at every severity — `stale`, `deferred` and `escalated` claim no edit and owe nothing. An owed entry is KEYED by the tuple the gate uses for resolution (trimmed, case-sensitive title + repo-relative file, any `:line` suffix stripped — per `orbit-engine-gates`' reviewed-gate resolution), and the payload's `verification[]` and `walk_entry` keys are normalized by the SAME rule before every check below (every refusal prints the normalized form); a key carried `resolved` by ANY walk of `verified_walks` is ONE owed entry, judged against the LATEST walk that carries it `resolved` — a later walk carrying the same key at another disposition (a `stale` call naming the earlier fix) does not lift the obligation, since that earlier edit is exactly what a verification checks; an UNREADABLE record owes nothing (it stays listed in `verified_walks`) — and for this record a walk the trail reader reads is ALSO unreadable when any of its entries normalizes to an empty title or an empty file, because no well-shaped verdict could name that key. `orbit-conventions`' pass-genre table says a verification answers "per resolution"; by this requirement that reads as per OWED (`resolved`) entry.

**The verdicts**, stated once here as a fenced production. An adopter's installed review skill has none of our specs, so the review skill carries this fence as a CHECKED MIRROR in its `references/verification.md`, which a VERIFICATION-genre pass reads, held byte-equal by a parity test (R-crc-14's mirror corollary, as `reduce-orbit-phase1`'s R-rop-14 amends it: the copy carries no note saying it is a mirror or naming this requirement); no other surface restates it:

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

### Requirement: The walk write gate checks sweep evidence

`orbit emit address-reviews` SHALL refuse, writing nothing, a payload whose `resolutions[]` holds an entry with `outcome: "resolved"` and no `sweep` object, or a `sweep` that does not have exactly the five keys and element shapes `orbit-address-reviews`' `A resolved walk entry records its sweep evidence` owns, or a `sweep` on an entry whose `outcome` is not `resolved`, or an entry that carries the legacy key `status` and no `outcome`: the trail reader's fallback to `status` (`normalizeDisposition` in `src/core/artifact-graph/trail.ts`) exists for logs already on disk, and a new log names its disposition only by `outcome`, so no entry the gate counts as resolved can skip this check. For every resolved entry it SHALL then check the evidence against the files as they are at emit time, the walk's last act:

| check | refused when | the refusal names |
|---|---|---|
| retired | a `retired` string occurs in a file of the entry's CHECK SCOPE that is not a `kept` path | the entry index and title, the string, the path, the 1-based line |
| introduced | an `introduced.text` does not occur in its `path`, or the path resolves to no file | the entry index and title, the path, the text |
| scope | a `sweep.scope` path resolves to no file or directory | the entry index and title, the path |

An entry's CHECK SCOPE, and the one rule by which a PATH from any of these fields resolves, are stated in this fence (an installed skill cannot open this spec, so the review skill's `references/verification.md` and the walk skill's `references/sweep-record.md` carry it as a CHECKED MIRROR held byte-equal by a parity test):

```
CHECK SCOPE — the union of: on a change-scoped walk, every file under the change directory except its .orbit-runs/ trail; the entry's file; its ripple_cascade.applied paths; its sweep.scope paths, a directory contributing the regular files under it (a symlink met inside a directory is not followed; a path named explicitly is read at its target). Files under .git/, node_modules/, dist/ and build/ are never read, however the path entered the scope; for the change directory's own files those names are read below the change directory.
PATH — strip a trailing :<line> or :<line>:<column> (digits only, at the very end; a path carrying anything after the suffix, such as "design.md:40 (section)", is not stripped, and resolves to nothing); a path beginning orbit/changes/<name>/ for the walk's own change resolves under the change directory, archived or active; otherwise it resolves against the project root, then, on a change-scoped walk and only when nothing exists there, against the change directory.
```

A walk resolved through the archived fallback is change-scoped, its change directory the archive directory. A project- or doc-scoped walk has no change directory. The suffix strip is the trail reader's `stripLineSuffix`, reused so a path and a trail key are normalized by one rule. Every resolved path must stay inside the project root (the surface's containment rule). An entry's `file` or `ripple_cascade.applied` path that resolves to nothing is skipped and named in a stderr warning: those fields predate this check and carry free text. A `sweep` path that resolves to nothing is refused, and a `kept` path that resolves to a directory is refused: a kept element is one file, and exempts that file only. A member of the check scope that cannot be listed, examined or read refuses the emit naming its path: an unread file is not evidence of absence. The checks run on the record as frozen for writing (the surface's materialize-first rule), and `ripple_misses` is counted from that same record.

MATCHING is literal and case-sensitive after every run of whitespace, newlines included, is collapsed to one space, in both the string and the file. A phrase wrapped across lines therefore matches. Named limit: markup that splits a phrase other than whitespace (a blockquote `>` or list marker at a wrapped line's start, emphasis inside the phrase) is not normalized, so such an occurrence is not found. `searched` is never checked: it is a record. Named limit of `--keep-resolved-markers` (a debug flag that leaves resolved `@review:` markers in their files, per `orbit-address-reviews`' `Marker removal invariant`): a retained marker quoting retired wording is found like any other text, so such a walk lists that file under `kept` with the flag as its `why`, which takes the file out of that entry's retired check. Named limit of `kept`: a kept path is excluded from that entry's retired check IN FULL, so a live occurrence elsewhere in the same file is not found either; a walker that keeps a file mixing history and live prose retires a string specific to the live site to keep that site checked.

The check runs at write time only. A walk log on disk is never re-validated by any reader.

#### Scenario: A surviving retired string refuses the log

- **WHEN** an entry retires `"seventeen blocks"` and the change's `proposal.md` still says "seventeen\nblocks" on lines 12–13
- **THEN** the surface exits non-zero naming the entry, `seventeen blocks`, the proposal's path and line 12; no file is written; stdout is empty

#### Scenario: A kept path is not searched

- **WHEN** the same string survives only in the change's `explore.md`, and the entry lists `explore.md` under `kept`
- **THEN** the emit writes

#### Scenario: An introduced text that did not land refuses the log

- **WHEN** an entry introduces `{path: "<change>/design.md", text: "sixteen blocks"}` and `design.md` does not contain it
- **THEN** the surface exits non-zero naming the entry, the path and the text; no file is written

#### Scenario: A resolved entry without sweep is refused

- **WHEN** a payload's resolved entry carries no `sweep`
- **THEN** the surface exits non-zero naming `resolutions[<i>].sweep`; no file is written

#### Scenario: A legacy status key without outcome is refused

- **WHEN** a payload's entry carries `status: "resolved"`, no `outcome` and no `sweep`
- **THEN** the surface exits non-zero naming the entry and `outcome`; no file is written

#### Scenario: A stale entry with a sweep is refused

- **WHEN** an entry with `outcome: "stale"` carries a `sweep`
- **THEN** the surface exits non-zero naming the entry; no file is written

#### Scenario: A free-text ripple path is skipped with a warning

- **WHEN** an entry's `ripple_cascade.applied` holds `".openspec.yaml fingerprint (13th stamp)"`, which resolves to no file
- **THEN** the emit writes and stderr names the unresolved path; the entry's other scope members are still checked
