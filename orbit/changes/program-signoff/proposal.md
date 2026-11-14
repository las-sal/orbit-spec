## Why

Stage `program-brief` of `automate-dev-flow` owes its second sign-off: once per program, over the program brief, holding
the program's completion under every `pr:` mode and, under `pr: per-architecture`, the program PR's READY flip
(R-adf-2 as amended). The stage's third change, `program-brief`, shipped the per-change sign-off and left `program` read
as an unrecognized value with a warning; this, its fourth change, divided from it (see `explore.md`, D-ps-4), builds the
per-program one. A program's brief is also not yet saved anywhere, though R-adf-7 has it written in every mode and the
first-run stage's closing review grades G5 from saved copies.

## What Changes

- **The setting's `program` value.** `signoff: program` makes the user sign off once per program, over the program
  brief; nothing waits at any change's archive (D-ps-1). The reading step takes each change's account under `program`
  as it does under `change`, so the accounts in the brief the user signs have been checked by a reader (D-ps-1's
  account row). `program` stops being read as unrecognized; any other value still is.
- **The program brief is saved.** `orbit brief <doc> --save` saves a program's brief once every stage the doc declares
  is finished, and again only when a fresh render differs from the latest saved copy, to
  `orbit/architecture/.orbit-runs/brief/<doc>/brief-<TS>.md` (D-ps-3, D-ps-6). The architect session runs it under
  every setting and, at the defaults, shows nothing about it.
- **A program sign-off.** `orbit emit signoff --doc <doc>` records the user's answer over the latest saved program
  brief, in `orbit/architecture/.orbit-runs/signoff/<doc>/`, with orbit adding the copy's SHA-256, as the change record
  does (D-ps-6). A sign-off for a change is refused under `program`, and one for a doc under any value but `program`.
- **The program hold.** `orbit brief <doc> --hold` reports whether the program waits: under `program`, the program is
  done only when every declared stage is finished, the closing architecture review is recorded after the last archive,
  and the user has signed the latest copy (D-ps-5). A copy saved after a signature asks again only under
  `pr: per-architecture` while the program PR is still a draft or its state cannot be read (D-ps-7).
- **The architect session holds arc-done.** Under `program`, the architect session that finds the program otherwise
  done shows the latest copy whole and asks the user to sign off or decline; the program PR's READY flip is surfaced
  only once it is signed. No stage's ratification waits (D-ps-5, superseding D-ps-2).
- **Docs**: `docs/customization.md`'s `signoff` row gains `program`; `docs/cli.md` gains `orbit brief <doc> --save`,
  `--hold` with a doc and `orbit emit signoff --doc`; `docs/commands.md`'s architect section and `docs/concepts.md`
  name the program sign-off.

At the defaults nothing the user sees or is asked changes: the architect session saves the program brief only for a
finished program and says nothing about it, the hold reads `off`, and the arc-done readout is as today (R-adf-1, G0).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orbit-program-brief`: the setting gains `program` (its requirement renamed for what it now holds); `orbit brief <doc>
  --save` saves the program brief; `orbit brief <doc> --hold` and the program sign-off; the change brief's
  records-no-reader-checked row and the change save's doc refusal move with them.
- `orbit-architect`: a new requirement for the architect session's save and, under `program`, its sign-off at arc-done.
- `orbit-pr-lifecycle`: under `program`, arc-done waits for the sign-off, and the readout asks for it before it surfaces
  the READY flip.
- `orbit-emit-composition`: the sign-off write gate takes `--doc` under `program`; the recorded selection takes the
  account under `program` as under `change`.
- `orbit-decision-records`: the reader takes the account under `program` too, so its requirement is renamed and the
  reading brief's and the account's lifecycle rows widen with it.
- `orbit-review`: the reading step's account path holds under `program`, and points at the renamed requirement.
- `orbit-archive-modifications`: the hold's "unrecognized value" scenario no longer uses `program`, and an archive under
  `program` asks nothing.

## Impact

- Code: `src/core/project-config.ts` (the `program` value), `src/core/signoff.ts` (the doc's gate and hold),
  `src/core/program-brief.ts` (the program save; the unread-account line), `src/core/decision-records.ts` (the
  selection under `program`), `src/core/emit-composition.ts` (`signoff --doc`), `src/commands/brief.ts` and
  `src/cli/program.ts` (`--save` and `--hold` with a doc), `src/core/account.ts` (its header), the architect and review
  templates.
- Generated surface: the architect skill changes, so its function and generated-skill hash pins move (R-adf-9);
  `rc03b`'s `emit-composition.ts` pin moves.
- Tests whose scenario tags name the two renamed requirements are re-tagged to the new titles.
- Docs: `docs/customization.md`, `docs/cli.md`, `docs/commands.md`, `docs/concepts.md`.
- No new dependency; no outward act.

## Size

- capabilities: the program sign-off reaches seven owners. "Only under `change`" is restated in five specs (the setting,
  the reader's rule, the recorded selection, the reading step and the archive's scenario), and arc-done is defined in
  `orbit-pr-lifecycle`; a split leaves neither half under three, since both touch the setting and the sign-off's gate.
  The user chose to declare it rather than split it.
- requirements: fifteen, three past the maximum: two new requirements for the program's save and hold, one for the
  architect session, and twelve carried blocks, each changed only where the `program` value or a renamed title makes it
  false; declared with the capabilities, as the user chose.
