## ADDED Requirements

### Requirement: The walk write gate checks sweep evidence

`orbit emit address-reviews` SHALL refuse, writing nothing, a payload whose `resolutions[]` holds an entry with `outcome: "resolved"` and no `sweep` object, or a `sweep` that does not have exactly the five keys and element shapes `orbit-address-reviews`' `A resolved walk entry records its sweep evidence` owns, or a `sweep` on an entry whose `outcome` is not `resolved`, or an entry that carries the legacy key `status` and no `outcome`: the trail reader's fallback to `status` (`normalizeDisposition` in `src/core/artifact-graph/trail.ts`) exists for logs already on disk, and a new log names its disposition only by `outcome`, so no entry the gate counts as resolved can skip this check. For every resolved entry it SHALL then check the evidence against the files as they are at emit time, the walk's last act:

| check | refused when | the refusal names |
|---|---|---|
| retired | a `retired` string occurs in a file of the entry's CHECK SCOPE that is not a `kept` path | the entry index and title, the string, the path, the 1-based line |
| introduced | an `introduced.text` does not occur in its `path`, or the path resolves to no file | the entry index and title, the path, the text |
| scope | a `sweep.scope` path resolves to no file or directory | the entry index and title, the path |

An entry's CHECK SCOPE, and the one rule by which a PATH from any of these fields resolves, are stated in this fence (system walk 1, Sal: B — an installed skill cannot open this spec, so the review and walk bodies carry it as a CHECKED MIRROR held byte-equal by a parity test):

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

### Requirement: A ripple-miss pointer resolves and is counted

`orbit emit address-reviews` SHALL refuse, writing nothing, a resolution whose `ripple_miss_of` is not an object of exactly the four keys and values `orbit-address-reviews`' `A ripple miss is attributed by the walk that finds it` owns, or that sits on an entry whose `outcome` is not `resolved`, or whose pointer does not resolve: `walk` must be the filename token of an `address-reviews-<token>.json` already in the same trail, earlier than this emit's token, whose `resolutions[]` holds an entry the trail reader reads as resolved (its `outcome`, or the legacy key `status` when `outcome` is absent: the refusal of a `status`-only entry binds the payload being written, never a record already on disk) whose title and file equal the pointer's, both sides compared after the same normalization: the title trimmed, the file through `stripLineSuffix`. The refusal names the entry and the pointer.

The surface SHALL compute `ripple_misses`, the number of this payload's resolutions carrying `ripple_miss_of`, as a computed extension on every address-reviews emit. It is engine-owned: a payload that supplies `ripple_misses` is refused as an unknown key. No reader branches on the count; it is recorded, never targeted (R-crc-11(h)).

#### Scenario: A pointer to a resolved entry of an earlier walk writes

- **WHEN** a payload's resolution carries `ripple_miss_of: {walk: "2026-10-05T01-00-00Z", title: "T", file: "design.md", kind: "scope"}` and `address-reviews-2026-10-05T01-00-00Z.json` in the same trail holds a resolved entry titled `T` on `design.md:40`
- **THEN** the emit writes, carrying `ripple_misses: 1`

#### Scenario: A pointer to a legacy resolved entry writes

- **WHEN** the named earlier walk log's entry carries `status: "resolved"` and no `outcome`, and the pointer's title and file match it
- **THEN** the emit writes: the earlier record is read as the trail reader reads it

#### Scenario: A pointer to nothing is refused

- **WHEN** the named walk log does not exist, or holds no resolved entry with that title and file
- **THEN** the surface exits non-zero naming the entry and the pointer; no file is written

#### Scenario: A pointer on an unresolved entry is refused

- **WHEN** an entry with `outcome: "stale"` carries `ripple_miss_of`
- **THEN** the surface exits non-zero naming the entry; no file is written

#### Scenario: An unknown kind is refused

- **WHEN** `ripple_miss_of.kind` is `"wording"`
- **THEN** the surface exits non-zero naming the three accepted values; no file is written

#### Scenario: A walk with no attribution counts zero

- **WHEN** no resolution carries `ripple_miss_of`
- **THEN** the emit carries `ripple_misses: 0`
