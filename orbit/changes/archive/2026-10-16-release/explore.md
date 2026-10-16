> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: release

## Premise

Stage `release` of `refine-documentation-and-architect`, the program's last: cut `v2.0.1` with `npm run release:tree`
and a CHANGELOG entry, so that the installed CLI matches the docs. Exit (G4): an install from the tag prints `2.0.1`
and its `orbit init` says orbit, and issue #24 is closed or what remains of it is re-filed. Pushing the tag is Sal's act.

Measured at the start of this session (2026-10-15): `package.json` is at `2.0.0`, and there are 58 commits on `main`
since `v2.0.0`. The release mechanism (`scripts/release-tree.mjs`, owned by `orbit-release`) needs no change. It cuts
`v<package.json version>` from HEAD and prints the push. What the stage has to settle is everything around the
mechanism: the version bump, the CHANGELOG entry, the docs' install pins, the order of the steps, and issue #24.

## Mechanism

### D-rel-1 — the user docs state the current version only as package.json's
Domain: every semver token in the user docs (`README.md` and each `docs/*.md`, the set `allDocSurfaces` reads), as measured 2026-10-15
| member | covered by |
|---|---|
| README.md:52 `npm install -g github:las-sal/orbit-spec#v2.0.0` | current: must equal `v<package.json version>` |
| README.md:56 `` `orbit --version` prints `2.0.0` `` | current: must equal package.json's version |
| docs/installation.md:14 the install line's `#v2.0.0` | current |
| docs/installation.md:17 `` The `#v2.0.0` tag names a release tree `` | current |
| docs/installation.md:30 `` `2.0.0` for the line above `` | current |
| README.md:14–15 `orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0` | admitted: historical, true at every later version |
| `1.3.1` (the upstream baseline, several pages) | admitted: the engine's baseline, not orbit's version |
| `1.14.1` (migration-guide's measured upstream version) | admitted: owned by `orbit-user-docs`' migration-checklist requirement |
| `20.19.0` (the Node floor, README.md:48, installation.md:8) | admitted: the `engines` range, not orbit's version |
Closure: SOURCED — a grep for `[0-9]+\.[0-9]+\.[0-9]+` over README.md and docs/*.md, run 2026-10-15; every hit is a row above
Moves:
- READ: applied — the grep was run and each line was read in place; no spec or test holds any of the five current sites (`grep -rn 'install -g' test src orbit/specs` finds only `orbit-release`'s `<git spec>#v<version>`, which is generic)
- ENUMERATE: applied — this table. The check's shape follows from it: any semver token in a user doc either equals package.json's version or sits on an exact admitted list of (file, token, reason). This is `orbit-cli-name`'s scan-plus-admitted-list shape, so a new version mention in a new form is caught rather than missed
- COHERE: applied — "equals package.json's version" and "admitted as historical" do not conflict: README.md:14's `2.0.0` is admitted by its line text, not by its value, so a later `2.0.0` written as an install pin still fails
- EXECUTE: not applied — no check exists yet; the propose probe runs a throwaway over the real docs (probe before planning an instrument)
- FALSIFY: applied — a check that targets only `#v<x>` would miss README.md:56 and installation.md:30, two of the five sites, which state the version in prose
- CONFORM: applied — R-rda-4's G3 (the docs match the tool); the check joins `orbit-user-docs`' file-local set, as docs-refinement's start-sections check did
- FEASIBILITY: not applied — one regex over ten files
- CONSUME: applied — CI's `npm test`. A `package.json` bump without the docs following goes red, which is the point. The admitted list is the one thing an author edits by hand
- INVOKE: applied — runs on every `npm test`, and so fires at the next version bump, the one moment it guards

## Decisions

- **2026-10-15 — D-rel-1: the user docs state orbit's current version only as package.json's, held by a check** (Sal,
  choosing "bump and add a check" over "bump by hand only"). Every semver token in `README.md` and `docs/*.md` equals
  `package.json`'s `version` or is on an exact admitted list of (file, token, reason); the requirement lives in
  `orbit-user-docs`. No spec or test holds the install pins today, so the next bump would repeat this stage's hand
  edit with nothing to catch a miss.
  Kind: rule
- **2026-10-15 — D-rel-2: five sites state the current version; the rest are admitted** (measured). README.md:52 and :56,
  and docs/installation.md:14, :17 and :30 move to `2.0.1`. README.md:14–15's "orbit 2.0.0 is orbit's first release"
  stays, because it remains true. `1.3.1`, `1.14.1` and `20.19.0` are not orbit's version.
  Kind: fact
- **2026-10-15 — D-rel-3: one change carries the bump, CHANGELOG, doc sites and check; the tag is cut after archive**
  (Sal, resolving Q-rel-1 at propose). The change carries the version bump (`package.json`, `package-lock.json`),
  the 2.0.1 CHANGELOG entry, the five doc sites (D-rel-2) and the D-rel-1 check. It is reviewed, merged and archived.
  Then `npm run release:tree` runs on `main`'s merge commit, Sal pushes `v2.0.1` by name, and the G4 install is
  observed at ratification. Cutting the tag is ratification evidence, not a task in the change: the tag must come from
  the merge commit, which exists only after archive, and a task written for archive blocks the apply gate. design.md's
  Risks names the window between merge and tag push.
  Kind: scope
- **2026-10-15 — D-rel-4: the 2.0.1 CHANGELOG entry has three user-facing bullets and links issue #24** (Sal, resolving
  Q-rel-2 at propose). One bullet per prior stage: where orbit suggests starting new work, it names `/orbit:architect`
  first; the CLI's user-visible strings say orbit, with `.openspec.yaml`, the data-format tags, the global config
  directory and the `OPENSPEC_*` variables kept as named; the user docs lead with architect. The D-rel-1 check is
  internal and is left out.
  Kind: scope
- **2026-10-15 — D-rel-5: issue #24 is closed by Sal at ratification** (Sal, resolving Q-rel-3 at propose). §1 shipped as
  `cli-says-orbit`, §2 as `architect-first` and `docs-refinement`, and §3 has no items. Sal closes it after the G4
  install is observed, with a comment naming the three archived changes and `v2.0.1`. Nothing is re-filed, and the
  change carries no task for it.
  Kind: scope

## Open questions

(None open. Q-rel-1, Q-rel-2 and Q-rel-3 were resolved at propose on 2026-10-15 as D-rel-3, D-rel-4 and D-rel-5.)

## Considered & out

- **2026-10-15 — bump the four install lines by hand, no check** (Sal chose the check, D-rel-1). It is a smaller
  change, but it leaves the next release to repeat the miss.
- **2026-10-15 — a check over `#v<x>` tags only.** It misses the prose sites README.md:56 and installation.md:30
  (D-rel-1's FALSIFY).

## References

- `orbit/architecture/refine-documentation-and-architect.md` — the stage's charter, G4, R-rda-3 (`v2.0.1`)
- `orbit/specs/orbit-release/spec.md` — the release-tree mechanism, unchanged by this stage
- `scripts/release-tree.mjs` — cuts `v<package.json version>` from HEAD and prints `git push origin v<version>`
- `orbit/architecture/update-gh-documentation.md` — R-ugd-9 and the `v2.0.0` cut (release commit `8a498600`, parent `9f2de9c4`)
- `orbit/specs/orbit-cli-name/spec.md` — the scan-plus-admitted-list precedent D-rel-1 follows
- `test/helpers/surface-snippets.ts` — `allDocSurfaces`, the doc set the check reads
- Issue #24 (las-sal/orbit-spec), "Refine Documentation"
