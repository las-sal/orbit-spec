> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc12-body-adoption

## Premise

rc12's second change (clean-up-review-cycle, Stage rc12-engine-owned-choreography). Change 1
(`orbit/changes/archive/2026-10-12-rc12-engine-owned-choreography/`, PR #16, merged `cbb0780d`)
shipped `orbit pr` — `select`, `publish`, `preflight`, `tail`, `program` — which observes with
read-only `git`/`gh` and PRINTS every write as argv segments. No body calls it yet: the propose,
ff, archive and architect bodies still carry D6's hand-run runbook. This change moves them onto
`orbit pr`. It owns the stage's exit (2) — the three PR references shrink by more than half —
and must keep exit (3) — user-invoked, draft-only, merge never — unchanged. Per D-rc12-3, if
resolve-only does not meet exit (2) when measured at apply, `switch -c` and `commit --only` move
into the engine (option B); outward writes never do.

Named `rc12-body-adoption`, not the stage id: the stage id is change 1's name, so a change of
that name would reuse a merged remote branch at propose under `pr: per-proposal` and could
collide with change 1's archive directory on the same UTC date.

Measured at scaffold (2026-10-12, generated surface on `main` at `cbb0780d`), the exit (2)
baseline:

| reference | bytes | more-than-half target |
|---|---|---|
| `orbit-propose` / `orbit-ff-change` `references/pr-choreography.md` (one file, two copies) | 18,458 | < 9,229 |
| `orbit-archive-change` `references/pr-archive-tail.md` | 12,900 | < 6,450 |
| `orbit-architect` `references/pr-resolution.md` | 4,613 | < 2,307 |

One source: `src/core/templates/workflows/pr-choreography.ts`.

Carried in from change 1's archive (architect record 2026-10-12): `orbit pr preflight` reported a
FALSE citation divergence on a change cited since creation. `src/core/pr/preflight.ts` sets
`diverged: recorded !== current`, with `recorded = att.doc ?? null` — and a `per-proposal`
attachment records no `doc`, so every cited per-proposal change reads as diverged. The body
must not render that note until the check is right.

## Mechanism

### D-rba-1 — a citation note fires exactly when the current inputs would select a different target than the frozen attachment
Domain: every (frozen attachment, current `pr:` regime, current citation) a preflight can read
| member | covered by |
|---|---|
| attachment `per-architecture` doc X; current would-select program X | no note — same target |
| attachment `per-architecture` doc X; current would-select program Y | note — citation re-pointed; the frozen program PR governs |
| attachment `per-architecture` doc X; current would-select per-change (citation removed, or regime no longer `per-architecture`) | note — the frozen program PR governs |
| attachment `per-proposal`; current would-select per-change (regime `per-proposal`, `never` or inert, or no citation) | no note — the citation is irrelevant to the PR layer (the rc12 change-1 false positive is this row) |
| attachment `per-proposal`; current would-select program X (regime `per-architecture` AND a citation) | note — the spec's "Citation edited after propose is a no-op" row, or a regime flipped after propose; the frozen per-change PR governs |
| no attachment on the trail | preflight returns off-record before any citation read (`preflight.ts:87`); no note |
Closure: DERIVED — would-select is two-valued (per-change, or program of one doc) by `publish.ts:62`'s predicate, and the attachment is two-valued by `granularity` plus `doc`; the table is their product with equal and unequal docs split
Moves:
- READ: applied — `preflight.ts:90-95` compares `att.doc ?? null` to the current citation; `publish.ts:62` is the targeting predicate (`regime === 'per-architecture' && citation !== null`); `select.ts:44` records `per-proposal` for an uncited change under `per-architecture`; `readRegime` exists in `inputs.ts:12`
- ENUMERATE: applied — this table; the regime's inert values resolve to `never` through `resolvePrMode`, so they fall in the per-change row
- COHERE: applied — preflight must compute would-select through the SAME predicate publish uses (one function, extracted), or the note and the target can disagree; that is R-crc-14 at the code level
- EXECUTE: not applied — no code yet; the six rows become preflight test cases at apply, the change-1 false positive among them
- FALSIFY: applied — the note reads the live regime, so a regime edited after propose also produces a note; that is truthful (the target WOULD differ now) and the frozen attachment still governs, so nothing re-targets
- CONFORM: applied — the freeze rule in `orbit-pr-lifecycle`'s "Config selects the regime; citation selects the target" holds: the regime is read only to decide whether a note is written; R-crc-13 (the engine reports, the body writes the note, per D-rc12-13)
- FEASIBILITY: not applied — one config read and one metadata read, both already done elsewhere in `orbit pr`
- CONSUME: applied — the archive body renders the note from `observations.citation`; change 2's body is that consumer, and it is why the defect must be fixed before the body renders anything
- INVOKE: applied — fires on every `orbit pr preflight` that finds an attachment, which the archive body runs before its emit

### D-rba-2 — a per-change PR title is the change name plus a one-line summary the AI writes from the proposal's Why
Domain: every PR title an orbit seam writes
| member | covered by |
|---|---|
| per-change PR created at propose or ff | `<change-name>: <one-line summary of proposal.md's Why>` — judgment, written once |
| program PR ADOPTED by the four-axis query (`publish.ts:94-106`; the only adopt path — a per-change PR is only ever created) | not written — titles are set once at birth; the adopted PR keeps its title |
| program PR created at propose or ff | unchanged — `<doc stem>: <the architecture doc's title line>`; all four docs on disk open with a `# ` line |
| archive tail landmark rewrite, stage-entry append | not a title writer — they touch the body only |
Closure: SOURCED — the title writers are the `gh pr create` steps `orbit pr publish` prints (`publish.ts:126`, one argv carrying `--title <title>`); `gh pr edit` in the tail carries `--body-file` only
Moves:
- READ: applied — the schema's `proposal.md` template opens at `## Why`, no `# ` line; the rule is stated at `orbit-pr-lifecycle/spec.md:359` and restated at `pr-choreography.ts:212`; the architecture docs' first lines checked
- ENUMERATE: applied — this table; the adopt row corrected on reading `publish.ts` (adoption is the program path's alone)
- COHERE: applied — the spec owns the rule; the rewritten reference names it and points (R-crc-14), so the two sites become one
- EXECUTE: not applied — judgment; no computation to run
- FALSIFY: applied — the bug this fixes is a rule naming an input that does not exist; the new rule names `proposal.md`'s Why, which the schema always scaffolds
- CONFORM: applied — the charter keeps titles the body's judgment; `orbit pr publish` already takes `<title>` as a body-supplied input (`publish.ts:123`)
- FEASIBILITY: not applied — one line
- CONSUME: applied — `gh pr create --title` takes any string; the title is passed explicitly, so no prompt fires
- INVOKE: applied — fires at every propose or ff that creates a per-change PR

### D-rba-4 — a body consumes an `orbit pr` record by its fields alone, and never re-derives a step the record decided
Domain: every shape an `orbit pr` call can return to a body (`src/core/pr/record.ts`)
| member | covered by |
|---|---|
| non-zero exit (`PrUsageError`, the only one) | a body bug or a missing change dir: stop the PR layer, report the error verbatim, the lifecycle continues unattached |
| `action: off` | the PR layer is not engaged (regime `never`, or no attachment at archive); no note, no write |
| `action: skip` | render ONE line from `reason.code` + `reason.detail`; run nothing; the flow continues unattached |
| `action: proceed`, `degraded: null` | run `segments` in order; before each segment author its `inputs` (closed set `SEGMENT_INPUTS`: `<message-file>`, `<title>`, `<body-file>`, `<emit-path>`); run each step's `argv` exactly, substituting only argv elements equal to an input token, each element shell-quoted |
| `action: proceed`, `degraded: pr` | the same, plus one line for the PR-half degradation from `reason` |
| a step fails mid-segment | stop; one line naming the completed and skipped steps (the record's `step` names); nothing after it runs |
| a segment needing `<emit-path>` (publish's second, the attachment record) | the body writes the emit between segments and passes its path |
| `human_acts` non-empty | shown to the user verbatim, labelled as theirs; never run by a body |
| `observations` | read only for what the emit or the note needs (`emit.pr_url`, `emit.pr_state`, `outcome`, `citation`), never to re-decide a step |
Closure: DERIVED — `PrRecord` is a closed type: `action` three values, `degraded` two, `segments` and `human_acts` lists, one non-zero exit; every combination has a row
Moves:
- READ: applied — `record.ts` (the type, `SEGMENT_INPUTS`, `PrUsageError` the only non-zero exit, "every other outcome exits 0"); `publish.ts:121-134` (the two segments and their inputs)
- ENUMERATE: applied — this table; the step-failure and between-segment rows are not record fields but are the two places a body acts between fields
- COHERE: applied — D-rc12-13 (the engine decides skips, the body writes every note) and this table agree: every note row reads `reason`; no row computes a skip
- EXECUTE: not applied — no body yet; change 1's suite already executes every printed segment against real repositories
- FALSIFY: applied — a body that shell-joins argv unquoted would break on a title with a quote or a space; the quoting clause is in the proceed row for that reason
- CONFORM: applied — exit (3): `human_acts` are never run (merge stays the user's); the record never prints a merge, and draft-only is in `publish`'s argv; R-crc-14: the reference names this rule's owner (`orbit-pr-lifecycle`) instead of restating the record
- FEASIBILITY: not applied — one CLI call per seam step
- CONSUME: applied — the consumers are the propose/ff Phase 1 (`select`) and Phase 3 (`publish`), archive before its emit (`preflight`) and after it (`tail --outcome`), and the architect arc-done readout (`program`)
- INVOKE: applied — each consumer row above names the body step that calls it; a body that keeps the old runbook beside the call would run both, so the old text is DELETED, not kept as fallback

## Decisions

- **2026-10-12 — D-rba-1: preflight's citation note compares what the current regime and citation would select against the frozen attachment** (Q-rba-1, Sal: A.) The would-select computation is the predicate `orbit pr publish` already uses; the frozen attachment still governs every seam. No change to `pr_attachment`'s shape. See Mechanism.
  Kind: rule
- **2026-10-12 — D-rba-2: the per-change PR title is `<change-name>: <a one-line summary written from proposal.md's Why>`** (Q-rba-2, Sal: A.) D-rc12-6's fix never landed; change 2 rewrites the sentence anyway, and the spec states it once. See Mechanism.
  Kind: rule
- **2026-10-12 — D-rba-3: the archive tail's final handoff says what to do after the user merges** (Q-rba-3, Sal: A.) One line — after you merge, `git switch <default> && git pull` — closing dogfood seam 3's silence. No new seam, no engine work; the merge stays the user's.
  Kind: scope

- **2026-10-12 — D-rba-4: a body consumes an `orbit pr` record by its fields alone** The bodies call `select`, `publish`, `preflight`, `tail` and `program` at their seams and act on `action`, `degraded`, `reason`, `segments` and `human_acts` only; the hand-run runbook is deleted, not kept as a fallback. See Mechanism.
  Kind: rule
- **2026-10-12 — D-rba-5: two capabilities — `orbit-pr-lifecycle` and `orbit-archive-modifications`** Read 2026-10-12: `orbit-propose-modifications`' `Branch preconditions at propose` and `orbit-archive-modifications`' `PR-attached archive tail` state WHAT the flow does (fetch, check, isolated commit), which stays true when `orbit pr` computes it — change 1 left them true. `orbit-pr-lifecycle` takes D-rba-1, D-rba-2 and D-rba-4's consumption sentence; `orbit-archive-modifications` takes D-rba-3's handoff line. No spec names the reference files. Within R-crc-1's ceiling of three.
  Kind: fact
  Disposition: superseded D-rba-7
- **2026-10-12 — D-rba-6: exit (2) is measured at apply against the scaffold baseline, resolve-only first** (Q-rba-4, Sal: resolve now.) The bodies run what `orbit pr` prints (D-rc12-2); at apply each reference is measured against 18,458 / 12,900 / 4,613 bytes, and only a reference that does not shrink by more than half triggers D-rc12-3's fallback (the engine performs `switch -c` and `commit --only`; outward writes never).
  Kind: scope
- **2026-10-12 — D-rba-7: one capability — `orbit-pr-lifecycle`; D-rba-3 is already mechanized** Read at propose: `orbit pr tail` already prints the post-merge return as `human_acts` (`return-fetch`, `return-switch`, `return-fast-forward`; `tail.ts:189-193`), specified in `orbit-pr-lifecycle`'s `\`orbit pr tail\` computes the archive tail`. D-rba-3's line is delivered by D-rba-4's `human_acts` row (shown verbatim, labelled as the user's), so `orbit-archive-modifications` takes nothing. Those three commands are already in the recorded git contract; D-rba-3's `git pull` wording is superseded by them.
  Kind: fact

## Open questions


## Considered & out

- **2026-10-12 — record the citation in `pr_attachment` at propose (Q-rba-1 option B).** Out: a record-shape change owned by `orbit-run-summary-emit` (a capability beyond rc12's), and every existing attachment lacks the field; D-rba-1 needs neither.

## References

- `orbit/changes/archive/2026-10-12-rc12-engine-owned-choreography/` — change 1: `explore.md`
  (D-rc12-1..14; D-rc12-3 the measured fallback; D-rc12-7 the cleanliness conflicts left out),
  `sketches/dogfood-log.md` (27 deterministic, 4 judgment, 7 wrong across four seams).
- `orbit/architecture/clean-up-review-cycle.md` — Stage rc12 charter (line 3118); R-crc-5;
  status-log entries of 2026-10-12.
- `src/core/pr/` — the engine command (10 modules, 1,397 lines).
- `src/core/templates/workflows/pr-choreography.ts` — the one source of the three references.
- `orbit/specs/orbit-pr-lifecycle/spec.md` — "Config selects the regime; citation selects the
  target" (the freeze rule, the citation no-op note) and the `orbit pr` requirements.
