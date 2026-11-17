## Why

orbit's skill bodies total 434,449 characters, and a body a session invokes stays in its context on every turn. Seven
steps carry their whole procedure in the body although an orbit command's result says whether that procedure is needed,
and at the defaults (or on the usual result) it never is. This is the first stage of `reduce-orbit-phase1`
(`conditional-steps`, R-rop-2 as amended): each of those steps keeps its basic content in the body and moves its
procedure to a reference file, Anthropic's conditional-details pattern, without changing what any workflow does (RG0),
and a per-body budget test starts holding the bodies' size (R-rop-8, RG3). See `explore.md` for the exploration
(D-cs-1 to D-cs-10).

## What Changes

- **Seven steps split into basic content and a reference file** (the sign-off hold, in archive and architect, counted
  once). The basic content (when the step runs, the command, the
  usual result, and the link to its reference file, R-rop-3) stays in each carrying body; the full step, byte-equal to
  today's text and composed once in code, moves to a reference file the basic content tells the agent to read on any
  other result or a non-zero exit and to follow from the result it already has (R-rop-4). Every body stays the same under every configuration (R-rop-5).
  - the commit step (propose, ff, apply, review, address-reviews, archive) → `references/commit-step.md`;
  - the chain end step (propose, ff, apply, review, address-reviews) → `references/chain-end-step.md`; the meaning of the
    prompt tags and what a chained command records stay in each body (R-rop-6);
  - archive's sign-off hold (Step 3.7) → `references/signoff-hold.md`; the brief save (Step 3.6) stays;
  - architect's program sign-off hold (5.4) → `references/program-signoff.md`; the program brief save stays;
  - archive's gate inflection prompt (Step 3.4) → `references/gate-inflection.md`;
  - archive's base-fingerprint divergence check (Step 3.45) → `references/fingerprint-divergence.md`;
  - propose's size brief → `references/size-brief.md`;
  - the PR sections: propose's and ff's phase positions join `references/pr-choreography.md`, and architect's arc-done
    act (5.5) joins `references/pr-resolution.md`.
- **Bulk-archive is not touched** (D-cs-3): its hold, PR section and divergence check stay inline as today.
- **A per-body budget test** in the suite: each generated body has a character ceiling at its post-stage size plus 5%,
  and fails over 500 lines, except explore, held by a line ceiling at 664 (R-rop-8). Its failure message states how to
  fix a failure (D-cs-5, D-cs-10).
- **A size report** (`npm run size:report`), run in CI after the suite and never failing: each skill's body and
  reference sizes, and each body's estimated tokens against the 5,000 Claude Code keeps after a compaction (R-rop-12).
- **The rule for new steps** in a new root convention file, `skill_body_convention.md`, which CLAUDE.md and the budget
  test point at (D-cs-10).
- **Stale doc figure fixed**: README and `docs/supported-tools.md` say eight workflows hold a `references/` directory;
  fourteen do (every workflow but onboard has carried `decision-records.md` since decision-writing).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `The commit step closes each carrying body` pins the basic content in each carrying body and the
  full step in its reference file; `No-chaining contract` says what of the closing step the body carries.
- `orbit-archive-modifications`: `The archive holds for a per-change sign-off` pins the archive body's basic content and
  its reference file, while bulk-archive keeps the step whole.
- `orbit-architect`: `The architect session saves the program brief and asks for the program's sign-off` pins the save
  and the hold's basic content in the body and the table and sign-off in its reference file.
- `orbit-propose-modifications`: `Size brief after generation` moves the declaration's checked mirror to the reference
  file the body points at.

## Impact

- `src/core/disciplines.ts` and `src/core/templates/workflows/{propose,ff-change,apply-change,review,address-reviews,archive-change,architect,pr-choreography}.ts`:
  the basic-content constants and the new reference files.
- Tests that pin the moved text retarget to its new home (R-adf-15, RG0); a new hash test holds each moved block
  byte-equal to its pre-change text; the closed per-skill reference lists grow; `skill-templates-parity` hashes move.
- New: `test/core/templates/skill-body-budget.test.ts`, `scripts/skill-size-report.mjs`, the `size:report` npm script,
  a CI step, `skill_body_convention.md`.
- No engine command, payload, emit or config changes; no behaviour changes under any setting.

## Size
- capabilities: One stage, one change (R-rop-2, D-cs-1): the four capabilities each pin one moved step's text, and splitting would separate the steps from the budget test that holds them.
