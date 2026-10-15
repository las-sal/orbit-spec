## Context

This is the last stage of `refine-documentation-and-architect`: `release`, which cuts `v2.0.1` (R-rda-3, G4). The
release mechanism is `orbit-release`'s and needs no change. `scripts/release-tree.mjs` cuts `v<package.json version>`
on a built release commit whose parent is HEAD, and prints the push. What this change carries is the version bump, the
CHANGELOG entry, the docs' install pins, and a check that keeps those pins honest (see explore.md).

Measured 2026-10-15: no spec or test holds the docs' install pins. A grep for version tokens over `README.md` and
`docs/*.md` finds five current-version sites and three values that are not orbit's version, plus one historical phrase
(D-rel-2; the table in the new requirement is that measurement). A throwaway probe at propose ran the token rule over
the real docs. It confirmed the table, and it showed that a rule rejecting a trailing `.` misses README.md:15's
"OpenSpec 2.0.0.", which is why the requirement's token definition accepts a sentence-ending period.

## Goals / Non-Goals

**Goals:**
- `package.json` (and the lockfile) say `2.0.1`, and every surface that renders the version follows.
- The user docs pin and state `2.0.1`, and a check fails the suite at any later bump the docs do not follow (D-rel-1).
- `CHANGELOG.md` records what `2.0.1` ships (D-rel-4).

**Non-Goals:**
- Cutting or pushing the tag. That happens after archive, from the merge commit (D-rel-3), and is graded at ratification.
- Closing issue #24. Sal does that at ratification (D-rel-5).
- Any change to `orbit-release`, `scripts/release-tree.mjs`, engine code or generated bodies.
- `CHANGELOG.md` as a checked surface. It is not a user doc (`orbit-user-docs`' set is `README.md` and `docs/*.md`),
  and its `2.0.0` entry is history.

## Decisions

- **D1 — the check is a scan plus an exact admitted list, after `orbit-cli-name`** (D-rel-1, see explore.md). Every
  version token is current or admitted. A check over `#v<x>` alone would miss two of the five sites, which state the
  version in prose (README.md:56, installation.md:30). Admissions come in two kinds. By VALUE (`1.3.1`, `1.14.1`,
  `20.19.0`): these can never be orbit's version, because orbit's versions start at `2.0.0` and only grow. By PHRASE
  (file plus a phrase that contains the token): this admits README.md:14–15's historical `2.0.0` without admitting
  `2.0.0` anywhere else, so a stale install pin at `2.0.0` still fails (explore.md's COHERE move).
- **D2 — the check lives with its siblings.** It goes in `test/helpers/user-docs.ts` beside `startSectionFailures`,
  joins `fileLocalFailures` under the tag `version`, and reads the version from `package.json` as
  `test/helpers/surface-snippets.ts` already does. The two-page pin rule keeps the check from passing empty when every
  pin is dropped. The stale-admission rule runs over the unlisted docs together, as the docs-inventory unused rule does:
  a file-local run over one page alone would find most admissions stale.
- **D3 — the CHANGELOG entry** (D-rel-4): `## 2.0.1` above `## 2.0.0`, with three bullets. Where orbit suggests
  starting new work, it names `/orbit:architect` first. The CLI's user-visible strings say orbit, with the kept names
  listed (`.openspec.yaml`, the data-format tags, the global config directory, the `OPENSPEC_*` variables). The user
  docs lead with architect. Then a link to issue #24. The docs check is internal and is left out.
- **D4 — the order** (D-rel-3): this change, then review, merge and archive. Then `npm run release:tree` runs on `main`
  at the merge commit, Sal pushes `git push origin v2.0.1`, and an install from the tag is observed (`orbit --version`
  prints `2.0.1`, and `orbit init` in a scratch project says orbit) as the stage's G4 evidence at ratification.

### Alternatives considered

- **Bump the install lines by hand, with no check** (from explore.md's Considered & out). Rejected by Sal: the next
  release would repeat the miss.
- **A check over `#v<x>` tags only** (explore.md). Misses the prose sites.
- **Admit by line number.** Any edit above the line moves it, so the list would churn on unrelated docs work. A phrase
  survives edits elsewhere and still pins the admission to its sentence.
- **Cut the tag inside the change as a task.** The tag must come from the merge commit, which exists only after
  archive, and a task written for archive blocks the apply gate.

## Risks / Trade-offs

- **[The window between merge and tag push]** Once the change merges, `main`'s README pins `#v2.0.1`, a tag that does
  not exist until Sal pushes it. An install copied from GitHub in that window fails to resolve the ref. → Run
  `npm run release:tree` and push right after the merge. `v2.0.0` had the same window (R-ugd-9).
- **[A test pins the old version]** The generated skills stamp `generatedBy` from `package.json`, and some fixture may
  carry `2.0.0`. → The full `npm test` after the bump (task 1.2) finds it. A fixture that pins the version should read
  it from `package.json` instead.
- **[The npm residual]** `orbit-release`'s named limit: an npm whose prepare or packing rules differ from pacote
  21.5.0's. → The G4 observation at ratification installs from the pushed tag. The limit stays where `orbit-release`
  states it.
- **[An admission by value that later collides]** `20.19.0` is a version orbit could in principle reach. → That is far
  off, and at that point the check would admit a stale `20.19.0` pin. Named here and not engineered against.

## Touchpoints

- `package.json` + `package-lock.json` — the bump.
- `CHANGELOG.md` — the `2.0.1` entry.
- `README.md` — the install pin and the stated version.
- `docs/installation.md` — the install pin, the tag in prose, and the stated version.
- `test/helpers/user-docs.ts` — the version check, its admitted list, and its place in `fileLocalFailures`.
- `test/core/user-docs/*.test.ts` — the version check's tests, and the whole-docs stale-admission run.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rel-1 | SOURCED | live rule | `The user docs state orbit's current version as package.json's` — a normative TABLE |
| D-rel-2 | not carried | `Kind: fact` | none |
| D-rel-3 | not carried | `Kind: scope` | none |
| D-rel-4 | not carried | `Kind: scope` | none |
| D-rel-5 | not carried | `Kind: scope` | none |
