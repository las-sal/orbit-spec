## Why

This repository goes public when `update-gh-documentation` ends, and its `README.md` and eleven `docs/` pages still
teach upstream OpenSpec: the wrong package, the wrong command, upstream's slash commands and links. They are also the
one surface no test reads. The shipped sweeps (`orbit` grammar, `git`/`gh` contracts, the tool inventory) check the
generated skills only, and pointed at today's docs the two parse sweeps find ZERO snippets and pass vacuously, because
the docs invoke `openspec` (see explore.md). This is the program's first stage (`docs-under-test`, goal G4): put the
docs under machine checks BEFORE the rewrite stages run, so the rewrite is graded by a machine rather than by review.

## What Changes

- A new `orbit-user-docs` capability owns the checks that are specific to the user docs (`README.md` and
  `docs/*.md`):
  - **a residue check** (D-dut-1): every case-insensitive `openspec`, `opsx` or `fission` is residue unless it sits
    in one of four admitted places: the README sections headed `Built on OpenSpec` and `How orbit improves on
    OpenSpec`, anywhere in `docs/migration-guide.md`, or inside the identifiers `.openspec.yaml` and
    the tool's global configuration and data directories (`~/.config/openspec`, `~/.local/share/openspec` and their
    XDG and Windows forms), names the tool still writes on disk;
  - **a pending-rewrite list** (D-dut-2): a listed file is skipped, an unlisted file must pass every check, and the
    list is exact both ways, so a listed file that already passes fails the suite; each rewrite stage removes the
    files it ships;
  - **the docs' own declared-heads fence** (D-dut-4), exact for the docs alone, starting empty;
  - **non-vacuity floors** (D-dut-7) for the docs sweeps, over unlisted files, active once the list is empty and
    set by the edit that empties it.
- `orbit-cli-grammar`'s `orbit` sweep, `git`/`gh` sweep and tool inventory widen their domain from the generated
  surface to it plus the unlisted user docs (D-dut-5). The inventory judges each surface against its own fence
  (D-dut-4), and its existing continuation rule (write a command on one line) now applies to the docs too (D-dut-6). The
  `git` capture reads every user doc, so a rewrite stage can record a command its page writes.
- All twelve docs files start listed: on today's tree every one fails at least one check (measured; see explore.md),
  so the suite stays green while the docs are still upstream's (D-dut-3: the program is run atomically and validated
  by use at its end, so interim states need no protection).

## Capabilities

### New Capabilities

- `orbit-user-docs`: the user docs (`README.md` and `docs/*.md`) as a checked surface — what the old name may appear
  in, which files are still pending their rewrite, the docs' declared command heads, and the docs sweeps' floors.

### Modified Capabilities

- `orbit-cli-grammar`: the `orbit` snippet sweep, the `git`/`gh` recorded-contract sweep and the tool inventory read
  the unlisted user docs as well as the generated surface; the inventory judges each surface against its own declared
  set.

## Impact

- Tests and the `git` capture script only, no engine code: a docs-surface helper beside `generatedSurfaces()` in `test/helpers/surface-snippets.ts`,
  new tests for the residue check and the pending-rewrite list, and the three existing sweep suites extended to the
  docs.
- The docs themselves are not edited: today's failures are carried by the pending-rewrite list, and the program's
  later stages (`landing-page`, `reference-docs`, `concept-docs`) empty it.
- The stage's exit (3) reads "the recorded list of today's failures is exact"; D-dut-2 records those failures as a
  FILE list rather than a per-line one, a term the archive will record as revised (R-crc-12's first case).
