> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc08a-sweep-evidence

## Premise

A walk fixes the finding and misses the other places the same claim lives. The confirm pass, or the next
review, then finds the leftover, and every stage since rc13a has paid for at least one such pass. The
stage charter (`clean-up-review-cycle.md`, Stage rc08; this directory is the rc08a child per D-rc08-1) names six jobs: (1) a `sweep_set` per resolution
plus ripple-miss detection from the trail; (2) walk DISCOVERY (bare invocation resolves the single active
change; every outstanding pass is walked, through the gate's `passResolved`); (3) walk EXECUTION
(all-or-nothing application, each edit verified against the artifact before the log records it); (4)
R-crc-6's three lanes, with REDESIGN routed back to explore; (5) the DISAGREEMENT handling rule
(D-rc03-6); (6) the review-external T0 `next_recommended` (Q-rc03-5). Those six jobs touch at least
`orbit-address-reviews`, `orbit-emit-composition` and `orbit-run-summary-emit` (three capabilities,
R-crc-1's ceiling) before any engine reader is counted, so a split under R-crc-9 is expected and is
this exploration's first question.

Measured 2026-10-05 over `orbit/changes/archive/*/.orbit-runs/`: 205 walk logs, 1404 resolutions,
1139 carrying `ripple_cascade` (1820 files applied, 201 flagged-not-applied). Since rc03c, 40
verification verdicts: 37 `landed` and 3 `regressed`. A regex over review finding titles and descriptions
from 2026-09-12 onward (walk / cascade / ripple / residue / "still says") matches 94 of 649
findings. That figure is a noisy upper bound and is not a count of misses.

## Mechanism

### D-rc08-2 — a resolved walk entry carries its sweep evidence
Domain: every walk-log resolution entry, by outcome and generation
| member | covered by |
|---|---|
| `outcome: resolved`, written after rc08a ships | `sweep` REQUIRED: `retired[]`, `introduced[]`, `searched[]`, `scope[]`, `kept[]`; any may be empty, so an empty array is the written opt-out |
| a stale / suppressed / deferred / escalated outcome | `sweep` absent; nothing was edited, so there is nothing to sweep |
| a resolution in a prior-generation walk log | exempt by absence, never by date (the rc02b `[unreproduced]` precedent) |
| a virtual marker (review JSON, external file) and an inline `@review:` marker | the same entry shape; the walk log does not distinguish them at this field |
Closure: SOURCED — the outcome set is the walk log's closed `outcome` vocabulary in `orbit-address-reviews`' resolution-log shape; generation is present or absent
Moves:
- READ: applied — `ripple_cascade` records `applied` / `flagged_not_applied` files only (rc06b walk log read 2026-10-05); the spec's `Ripple cascade by default` says cascade trusts the ripple-flag analysis and records nothing of how it was done
- ENUMERATE: applied — this table; the outcome vocabulary is read at propose from the shape requirement, and any outcome found there that edits files joins the first row
- COHERE: applied — `retired` and `introduced` are the two checkable halves (D-rc08-3); `searched` and `scope` are the record half; `kept` is the one exemption, so no field serves two roles
- EXECUTE: not applied — no walk has run under it; the first walk after rc08a's apply is its exercise
- FALSIFY: applied — a walk that names no retired string escapes the check with empty arrays; that residual is visible, because the arrays are written, and is counted by D-rc08-4's attribution when it costs a later pass
- CONFORM: applied — R-crc-10 (the strings are observable, so the check is a CHECK; the search is judgement, so `searched`/`scope` are a RECORD); R-crc-14 (the field shape is stated once, in `orbit-address-reviews`)
- FEASIBILITY: not applied — a handful of short strings per resolution
- CONSUME: applied — the write gate (D-rc08-3) reads `retired`/`introduced`/`scope`/`kept`; the VERIFICATION pass reads `scope` as part of an entry's sweep scope (`orbit-review`, the verification requirement's "sweep scope", widened from `file` ∪ `ripple_cascade.applied`)
- INVOKE: applied — written at every walk's `orbit emit address-reviews`, the walk's last act

### D-rc08-3 — the write gate checks the evidence, never the search
Domain: what the gate checks per resolved entry
| member | covered by |
|---|---|
| each `retired` string | ABSENT from the check scope, else REFUSED naming string, path and line |
| each `introduced` `{path, text}` | PRESENT in `path`, else REFUSED naming both |
| the check scope | the change directory's files with `.orbit-runs/` excluded, plus the entry's `file`, `ripple_cascade.applied` and `sweep.scope`; a non-change walk (project, doc) uses only the last three |
| a `kept` `{path, why}` | that path is excluded from that entry's `retired` check: history that quotes the old wording (explore.md Decisions, Considered & out) |
| matching | literal and case-sensitive, after collapsing every whitespace run, newlines included, to one space on both sides, so a phrase wrapped across lines still matches |
| `searched` and the judgement behind it | NOT checked: a record for the confirm pass and for D-rc08-4's attribution |
Closure: DERIVED — the check is generated by the two checkable fields over one computed scope; every other field is named as record-only
Moves:
- READ: applied — the walk emit is the walk's last act (`orbit emit address-reviews`, after every edit), so the files the gate reads are the ones the log describes
- ENUMERATE: applied — this table; markdown constructs that split a phrase other than whitespace (a blockquote `>` or list marker at a wrapped line's start, emphasis markers inside the phrase) are not normalised and are a named limit of the matching row
- COHERE: applied — a later resolution in the same walk that reintroduces an earlier entry's retired string is refused, which is correct: the walk's final tree is what the log claims
- EXECUTE: applied — on the record: rc02b's "'seventeen' survives at three places" would have been refused at walk 1's emit naming all three; rc03b's "Step 1 still runs `git log --oneline`" would have been refused had walk 1 retired the string from the body file in its scope
- FALSIFY: applied — about a third of the leftover findings on the record are behavioural ("walk 2 made verify run validate, falsifying three premises") and no string catches them; D-rc08-4 makes those visible without pretending to check them
- CONFORM: applied — R-crc-13 is about gate passage, and this refuses a log that states something false, the same class as rc02b's refusal of a CRITICAL without a reproduction; R-crc-10 (only literal strings are checked)
- FEASIBILITY: applied — a change directory is tens of files; reading them once per emit is negligible
- CONSUME: applied — the walker reads the refusal and fixes or `kept`-lists, then emits again (the rc03c reconcile-through-refusal pattern)
- INVOKE: applied — the gate runs on every `orbit emit address-reviews`

### D-rc08-4 — a ripple miss is attributed at the walk that finds it
Domain: who can say a later finding is a miss of an earlier walk entry
| member | covered by |
|---|---|
| a VERIFICATION-genre pass | already: `regressed` verdicts and `walk_entry` links (rc03c); counted as ripple misses unchanged |
| a REVIEW-genre pass (fresh, external, first in-context) | cannot: blind to the trail by the brief rule (rc03b) |
| the walker of that REVIEW-genre finding | optional `ripple_miss_of: {walk, title, file, kind}` on the resolution, `kind` one of `query` \| `scope` \| `judgement`; the gate checks that the pointer resolves to a resolved entry of an earlier walk of the same change |
| the count | engine-computed on the walk emit as `ripple_misses`, never supplied by the payload; rc08's exit (3) is measured on it plus the verification `regressed` count |
Closure: SOURCED — the pass classes are the gate model's three, split by pass genre per `orbit-conventions`' table; the walker is the only other actor that sees both the finding and the trail
Moves:
- READ: applied — rc03c's `walk_entry` and `regressed` (`orbit-review`'s verification requirement); rc03b's brief rule forbids a REVIEW-genre brief to name a prior pass
- ENUMERATE: applied — this table
- COHERE: applied — `kind` reads against D-rc08-2's record: `scope` = the site was outside the entry's check scope; `query` = inside, but no retired or searched string matched it; `judgement` = matched and was judged unaffected
- EXECUTE: not applied — no walk has attributed one yet
- FALSIFY: applied — attribution is the walker's judgement and can be skipped; the residual is an unattributed miss, and the gate cannot see whether a finding was a miss
- CONFORM: applied — R-crc-10 (attribution is judgement, so it is a RECORD, with only the pointer's form checked); R-crc-11(h) (the count is recorded, never targeted)
- FEASIBILITY: not applied — one optional object per resolution
- CONSUME: applied — exit (3) of rc08a reads `ripple_misses`; the `kind` split tells a later stage whether to widen queries or scopes
- INVOKE: applied — at every walk, during triage of each finding

## Decisions

- **2026-10-05 — D-rc08-1: split rc08 into rc08a (sweep evidence) and rc08b (walk routing)**
  Kind: scope
  Sal delegated the method ("resolve in the best most efficient way", 2026-10-05). rc08a takes charter
  jobs (1) sweep set + ripple-miss detection and (3) walk execution. Job (3) folds into job (1)'s
  mechanism: an edit that did not land leaves its `introduced` text absent or its `retired` string
  present, and the gate refuses the log (D-rc08-3), so "verified against the artifact before the log
  records it" becomes a check instead of a discipline. Capabilities: `orbit-address-reviews` (the
  field), `orbit-emit-composition` (the gate), `orbit-review` (the verification sweep scope gains
  `sweep.scope`), which is three, at R-crc-1's ceiling. rc08b takes (2) discovery, (4) three lanes and
  redesign→explore, (5) the disagreement rule and (6) the T0 next line. Its capabilities are counted at
  its own exploration. This staging directory proceeds as rc08a; the split is declared in an architect
  session before propose.
- **2026-10-05 — D-rc08-2: a resolved walk entry carries its sweep evidence**
  Kind: rule
  `sweep: {retired, introduced, searched, scope, kept}` on every `resolved` entry. The walk log today
  says which files were edited and nothing about how they were found, so a missed site and a
  site judged fine look the same.
- **2026-10-05 — D-rc08-3: the write gate checks the evidence, never the search**
  Kind: rule
  Retired strings absent and introduced text present, over a computed scope, whitespace-normalised,
  refused naming path and line; `kept` is the one exemption. The search itself is a record.
- **2026-10-05 — D-rc08-4: a ripple miss is attributed at the walk that finds it**
  Kind: rule
  Optional `ripple_miss_of` with a closed `kind` (`query` | `scope` | `judgement`), pointer-checked;
  `ripple_misses` engine-computed. VERIFICATION passes keep their existing `regressed`/`walk_entry`
  channel.
- **2026-10-05 — D-rc08-5: most leftover findings on the record are stale wording**
  Kind: fact
  By a read of the recent regex matches (not an executed classifier), about two-thirds are wording
  that survived a walk ("'seventeen' survives at three places", "still says 'pristine upstream
  body'"); about one-third are behavioural. The figure motivates D-rc08-3 and does not grade anything.

## Open questions

## Considered & out

- **Engine infers the miss kind from file membership alone** (2026-10-05). `scope` is computable, but
  `query` versus `judgement` is not, so a partial inference would put two voices on one field. Out:
  the walker states `kind`.
- **Report survivors instead of refusing** (2026-10-05). A walk log claiming `resolved` over wording
  still on disk is a false record, and the refusal costs one re-emit. Reporting would recreate today's
  leftover-finding pass one step later.

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc08 charter (six jobs, four exits)
- `orbit/specs/orbit-address-reviews/spec.md` — `Ripple cascade by default`, `Resolution-log JSON shape extensions …`
- `orbit/specs/orbit-review/spec.md` — the VERIFICATION requirement's sweep scope (line ~501)
- `src/core/emit-composition.ts` — the `address-reviews` payload table; the write gate
- `orbit/changes/archive/2026-10-05-rc06b-map-readers/.orbit-runs/` — a recent walk log (resolution shape read 2026-10-05)
