# Program: update-gh-documentation

> Position is COMPUTED — run `orbit architecture status`. This doc declares; the engine renders.

## Premise

This repository goes PUBLIC when this program ends, and its GitHub landing page still describes upstream
OpenSpec. Measured 2026-10-12: `README.md` and the eleven pages under `docs/` total about 168 KB, and eleven of the
twelve never mention `orbit`. They name the old surface throughout (`openspec` 374 times, `/opsx` 280, `OpenSpec`
90), the install instructions point at `@fission-ai/openspec`, and the README carries upstream's logo, badges and
Discord. An adopter following them installs the wrong package and runs commands that do not exist. Nor do the docs
describe anything orbit added: the review cadence and gates, blind pairs and walks, `orbit status` orientation,
emits and trails, the architect tier, `orbit pr`.

The docs are also the one surface no test reads: rc05 and rc05b's sweeps check the generated skills only, so a
rewritten page could drift again the next day. Issue #1 ("Docs: comprehensive rewrite of README + docs/ for
orbit-spec") is this program's origin.

What the program must produce: a landing page that says what orbit is, how it improves on OpenSpec, and how to use
it; all eleven `docs/` pages rewritten in orbit's names; those pages under machine checks; and a repository fit to
be seen. Flipping visibility to public is Sal's act at arc-done, never an orbit step.

## Goals

- **G1 — the landing page is correct.** A newcomer following the README installs orbit and runs its core loop.
  Falsified by any README instruction or link that installs or invokes upstream (`@fission-ai/openspec`, the
  `openspec` command, `/opsx:`, upstream's Discord, CI or npm badges).
- **G2 — "why orbit" is true.** Every improvement the README claims over OpenSpec is carried by a shipped baseline
  capability. Falsified by a claim that no `orbit/specs/` capability carries.
- **G3 — the docs are orbit's.** All eleven `docs/` pages are rewritten for orbit, cover the core loop (install,
  init, explore → propose → review → apply → review → archive, the architect tier, `orbit status`), and follow
  R-ugd-1. Falsified by a page that still teaches upstream's commands, or an "OpenSpec" mention R-ugd-1 does not
  admit.
- **G4 — the docs are checked.** README and `docs/` command snippets run through the existing recorded-contract and
  `orbit` grammar sweeps, and an old-name residue check runs over them. Falsified by a doc snippet that fails to
  parse, or residue the check misses.

## Rulings index

- **R-ugd-1** (Sal, 2026-10-12) — remove as much "openspec" nomenclature as reasonable and use orbit's names
  instead. The docs say `orbit`, `orbit/`, `orbit-*` and `/orbit:`. "OpenSpec" stays only where it is the honest word:
  the attribution, the "how orbit improves on OpenSpec" comparison, and migration guidance for adopters coming from
  it. Names the tool still writes on disk (`.openspec.yaml`, the global config directory) are documented as they
  are, because a doc that renamed them would be wrong.
- **R-ugd-2** (Sal, 2026-10-12) — all eleven `docs/` pages are rewritten; none is removed or left labelled as
  upstream reference.
- **R-ugd-3** (Sal, 2026-10-12) — the Tier-C code scrub (`OpenSpec` in CLI help text and messages) is OUT of this
  program: it is code, and the landing page does not depend on it.
- **R-ugd-4** (Sal, 2026-10-12; resolves Q-ugd-1) — the install path at launch is a GitHub install PINNED to a
  release tag, `npm install -g github:las-sal/orbit-spec#<tag>`. The page makes no promise about npm: npm appears
  in the docs only if and when it is published, which stays Sal's separate outward act.
- **R-ugd-5** (Sal, 2026-10-12; from docs-under-test's D-dut-3) — interim states between this program's stages need no
  protection: the program runs as one sequence and is validated by installing and using the result at its end. A
  check may leave a file it has not yet graded unprotected while that file awaits its rewrite stage.
- **R-ugd-6** (Sal, 2026-10-12; resolves Q-ugd-2) — orbit's first version is `1.0.0`. The landing-page stage bumps
  `package.json` from upstream's `1.3.1` and cuts the `v1.0.0` tag on `main` that R-ugd-4's install pins; a GitHub
  Release page, if wanted, stays Sal's.
  *Its number is superseded by R-ugd-7; the rest of it stands.*
- **R-ugd-7** (Sal, 2026-10-12; from the landing-page exploration's D-lp-1; supersedes R-ugd-6's number) — orbit's
  first version is `2.0.0`, "a clean break from upstream". The landing-page stage bumps `package.json` from `1.3.1` and
  cuts the `v2.0.0` tag on `main` that R-ugd-4's install pins. `2.0.0` sits above every release upstream has shipped
  (`1.14.1`, measured 2026-10-12), where `1.0.0` sat inside upstream's range and collided with upstream's `v1.0.0` tag
  fetched into the local clone. Upstream's future numbers do not matter: the engine is frozen at the `1.3.1` baseline
  and moves only by deliberate cherry-pick, npm keeps the packages apart by name, and the stage stops the clone fetching
  upstream's tags (the exploration's D-lp-2).
  *Where its tag sits is superseded by R-ugd-8, and which stage cuts it by R-ugd-9; the version and the rest of it stand.*
- **R-ugd-8** (Sal, 2026-10-12; from the landing-page exploration's D-lp-16; supersedes R-ugd-7's "on `main`") — a
  release ships a BUILT RELEASE TREE. The release tag sits on a release commit whose parent is `main`'s merge commit:
  a release script builds, force-adds `dist/`, and removes from that commit's `package.json` the scripts that make npm
  prepare a git dependency (`prepare`, `build`, `postinstall`, `install`, `preinstall`, `prepack`). R-ugd-4's line,
  `npm install -g github:las-sal/orbit-spec#<tag>`, installs that tree unchanged. Measured cause: under `-g`, npm leaks
  its global flag into the nested install it runs to prepare a git dependency, so the build never finds its toolchain
  (npm 10 and 11; the root fix is npm's, and filing it is Sal's outward act). The release commit is never merged
  back; `main` keeps building through `prepare`.
- **R-ugd-9** (Sal, 2026-10-12; supersedes R-ugd-7's "the landing-page stage … cuts the `v2.0.0` tag") — `v2.0.0` is
  cut by public-readiness, as its last act before the visibility flip, not by landing-page. The installed package
  carries `LICENSE`, `package.json` and `README.md`, and public-readiness still edits them (orbit's notice in `LICENSE`;
  upstream's npm-publish scripts and the fork description in `package.json`), so a tag cut at landing-page would ship
  unfinished copies, and only moving a pushed tag would correct it. Nothing is lost by waiting: the repository is
  private until the flip, so no one can install the tag before then, and the rehearsals cut a local tag in a scratch
  clone. The version (`2.0.0`, R-ugd-7) and the release mechanism (R-ugd-8, `npm run release:tree`) are unchanged.

- **R-ugd-10** (Sal, 2026-10-12; from the reference-docs exploration's D-rd-6; carves out of R-ugd-3) —
  `orbit feedback` is retargeted to orbit's own repository in the reference-docs stage. The command hardcodes
  `Fission-AI/OpenSpec` in its issue URL and its `gh issue create --repo` argv, so a documented `orbit feedback` on a
  public repository would send orbit's bug reports to OpenSpec's maintainers. The page that documents the command and
  the command's target move together. The carve-out covers only `src/commands/feedback.ts` (both targets), the
  command's help description wherever it is defined (`src/cli/program.ts` and the completion registry,
  `src/core/completions/command-registry.ts`), and its test. R-ugd-3 stands for every other `OpenSpec` string in CLI help and messages. The fork has no
  `feedback` label, which the command passes; the stage settles at propose whether it drops the label or Sal creates it.
- **R-ugd-11** (Sal, 2026-10-12; from the concept-docs exploration's D-cd-1 and D-cd-2; carves out of R-ugd-3) —
  `orbit init` warns when `openspec/` holds `specs/` or `changes/`, whether or not `orbit/` exists, names the manual
  migration steps and points at `docs/migration-guide.md`, then proceeds (never a prompt or a stop). Measured cause: run
  over a real OpenSpec 1.3.1 or 1.14.1 project, `orbit init` leaves `openspec/` untouched, creates an empty `orbit/`
  beside it and installs orbit's skills beside upstream's, and `orbit list` reports no changes, with nothing said. The
  carve-out covers the warning, its call site in `src/core/init.ts`, and its test. R-ugd-3 stands for everything else.
- **R-ugd-12** (Sal, 2026-10-13; from the public-readiness proposal walk; carves out of R-ugd-3) — the upstream links
  `orbit init` and `orbit update` print are retargeted to orbit's own repository in the public-readiness stage.
  `src/core/init.ts` prints `Learn more` and `Feedback` links to `https://github.com/Fission-AI/OpenSpec` and its
  `/issues` after every init, and `src/core/update.ts` prints the `Learn more` link, so on a public repository a new
  user's first command would send orbit's bug reports to OpenSpec's tracker: the harm R-ugd-10 carved `orbit feedback`
  out for. The carve-out covers those three lines and a test that holds them. R-ugd-3 stands for everything else.

## Open questions

- **Q-ugd-1 — RESOLVED by R-ugd-4 (Sal, 2026-10-12).** the install path. `orbit-spec` is not on npm (`npm view
  orbit-spec` returns 404, 2026-10-12). Four options were weighed: a GitHub install, an npm publish, a GitHub
  install at launch with npm later, and a release tarball. Sal took the third, with npm left unpromised on the page.
  A git install builds on the user's machine because `package.json`'s `prepare` script runs the build.
- **Q-ugd-2 — RESOLVED by R-ugd-6 (Sal, 2026-10-12).** orbit's first version number. The R-ugd-4 pin needs a tag, and `package.json` still reads `1.3.1`,
  upstream's version, which on a public page reads as upstream's 1.3.1. The recommendation was `0.1.0`, a young
  fork in its own right; Sal took `1.0.0`; the bump and the tag on `main` ride the landing-page stage (a tag is a git act a stage can
  carry; a GitHub Release page, if wanted, is Sal's).

## Program stages

### Stage docs-under-test — the docs are graded by a machine before they are rewritten

Depends-on: (none)
Complete: [x] 2026-10-12 (Sal)

Charter: extend the sweeps that already check the generated surface (rc05's `orbit` grammar sweep, rc05b's
recorded-contract sweep for `git` and `gh`, rc09b's tool inventory) to `README.md` and `docs/*.md`, and add an
old-name residue check that applies R-ugd-1 (its admitted exceptions named, so a check failure is a real residue).
It runs first so every later stage is graded by the check, not by review. Today's docs are expected to FAIL it;
the stage ships the check against a recorded list of today's failures, which the later stages empty. Goal G4.

Exit: (1) a test reads `README.md` and every `docs/*.md` and fails on an unparseable `orbit`, `git` or `gh` snippet,
naming file and line; (2) the residue check fails on an `openspec`, `/opsx` or `@fission-ai` occurrence outside
R-ugd-1's exceptions, naming file and line; (3) the recorded list of today's failures is exact, and a test shows
each check able to fail.

Shipped as (2026-10-12; archived as `orbit/changes/archive/2026-10-12-docs-under-test/`; the charter stands, and exit (3)
is revised in one term): the user docs are a checked surface. `test/core/user-docs/pending-rewrite.json` lists all twelve
docs, exact in both directions: a listed file that passes every file-local check fails the suite, and so does a stale
entry. Each of today's twelve fails at least one check, about 810 failures in all. The residue check reads `openspec`,
`opsx` and `fission` in any case, admitting the README's two titled sections (read from top-level ATX headings of a
markdown-it parse with HTML enabled, after the system pair found a heading hidden in an HTML comment), all of
`docs/migration-guide.md`, `.openspec.yaml` and the global directories. The `orbit`, `git`/`gh` and inventory sweeps read
the unlisted docs; the inventory judges them against their own `docs-inventory` fence, empty today, where `utility` also
admits an installer such as `npm` (Sal: A at the system walk). The docs floors are unset until the list empties and must
then be positive integers. The `git` capture reads every user doc; the docs add nothing to the contract, though a
re-capture shows the checked-in contract still records six keys and six flags rc12 removed from the surface (kept, a
named residual). New capability `orbit-user-docs` (27 baseline capabilities); `orbit-cli-grammar`'s three sweeps
widened. Exit (1) MET: the `orbit` and `git`/`gh` sweeps fail an unparseable snippet in an unlisted doc naming file and
line, and run over each listed doc in the exactness test. Exit (2) MET: `fission` covers `@fission-ai`, and `/opsx` is
matched as `opsx`. Exit (3) MET AS REVISED (R-crc-12's first case): the "recorded list of today's failures" is a FILE list
(D-dut-2), not a per-line one; it is exact, and every check was shown able to fail, including by deliberate mutation. The
system blind pair on `5ef9821a` (fresh 0C/1W/3S forward, external GPT-6 Codex 0C/2W/0S hold) shared no finding; two walk
logs, then an in-context VERIFICATION grading six `landed`; a computed PASSED gate. 3617 tests green.

### Stage landing-page — the README says what orbit is, why, and how to start

Depends-on: docs-under-test
Complete: [ ]

Charter: rewrite `README.md` as orbit's landing page: what orbit is (a hard fork of OpenSpec 1.3.1, attributed),
how it improves on OpenSpec (each claim naming the baseline capability that carries it), install (the pinned
GitHub install of R-ugd-4, at version `2.0.0` per R-ugd-7, with `package.json` bumped; the `v2.0.0` tag itself, on
the release commit R-ugd-8 builds, is public-readiness's per R-ugd-9),
a quickstart through the core loop, and links into `docs/`. Upstream's logo, badges and Discord leave the page.
Goals G1, G2.

Exit: (1) the README passes docs-under-test's checks with no recorded exception; (2) every improvement claimed over
OpenSpec names its capability, and each named capability exists in `orbit/specs/`; (3) a clean-machine run of the
README's install and quickstart is recorded (observed, not inferred), rehearsed from a local `git+file://` clone before the repository is public and
re-run against the public URL after the flip.

Shipped as (2026-10-12; archived as `orbit/changes/archive/2026-10-12-landing-page/`; the charter stands as amended by
R-ugd-8): `README.md` is orbit's landing page and has left the pending-rewrite list. `Built on OpenSpec` names
`@fission-ai/openspec@1.3.1` and the `upstream/v1.3.1` baseline. `How orbit improves on OpenSpec` makes nine claims,
naming sixteen capabilities. Install is R-ugd-4's line at `v2.0.0`, and the Quickstart runs Claude Code's loop with
`--fresh` reviews, the install surface table, and one Codex line. `package.json` is at `2.0.0`, the 56 fetched upstream
tags are gone, and `upstream` is `--no-tags`. The onboard body states orbit's version apart from the 1.3.1 baseline.
`orbit-user-docs` gained the improvement-claims check. The system review's rehearsal found that R-ugd-4's line could not
install a tree that builds at install (npm's git preparation under `-g`; D-lp-11 to D-lp-13). The route went through
explore and an architect ruling (R-ugd-8) and came back as the new capability `orbit-release`:
`scripts/release-tree.mjs` (`npm run release:tree`) tags a built release tree on a commit of its own, and a test installs
its tag globally from git. Baseline capabilities 27 to 28.

Exit (1) MET: the README is unlisted and passes every file-local check. Exit (2) MET: the claims check passes the README,
and each named capability resolves. Exit (3) PENDING, two thirds by design:
- The shell half of the rehearsal is observed from a `git+file://` clone carrying a release-tree `v2.0.0`. Under npm
  11.12.1 and 10.9.9 the install exits 0, `orbit --version` prints `2.0.0`, init writes 51 files, and `orbit status` runs.
- The `/orbit:propose` half in a clean Claude Code (task 5.2) and the post-flip re-run (5.4) are deferred on the archive
  emit, with the tag itself (5.3, after the merge).

The system blind pair (fresh 0C/2W/1S, external GPT-6 Codex 0C/2W/1S) was walked in three logs, one routing the install
to explore and one landing the repair. An in-context VERIFICATION graded four `landed` and one `regressed` (two prose
slips, walked to zero), and the gate computed PASSED. 3642 tests green.

### Stage reference-docs — the command and workflow pages teach orbit

Depends-on: docs-under-test
Complete: [x] 2026-10-12 (Sal)

Charter: rewrite `docs/installation.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/commands.md`,
`docs/workflows.md` and `docs/opsx.md` for orbit (the last renamed to an orbit name, its links repointed). Every
`orbit` CLI command and `/orbit:` workflow is documented. Under R-ugd-10, the stage also retargets `orbit feedback` to
orbit's repository. Goal G3.

Exit: (1) the six pages pass docs-under-test's checks with no recorded exception; (2) every command the completion
registry holds (rc05 keeps it equal to the program) is named by at least one page, checked by a test; (3) no page
teaches an upstream command.

### Stage concept-docs — the concept pages explain what orbit adds

Depends-on: docs-under-test
Complete: [x] 2026-10-13 (Sal)

Charter: rewrite `docs/concepts.md`, `docs/customization.md`, `docs/supported-tools.md`, `docs/multi-language.md` and
`docs/migration-guide.md` for orbit. Concepts covers what orbit adds over OpenSpec (reviewed gates and the cadence,
the blind pair and walks, emits and trails, the architect tier, `orbit pr`); the migration guide is rewritten for an
adopter arriving FROM OpenSpec. Under R-ugd-11, the stage also adds `orbit init`'s warning for an OpenSpec project.
Goals G2, G3.

Exit: (1) the five pages pass docs-under-test's checks with no recorded exception; (2) every concept page claim
about orbit's behaviour names the capability that carries it; (3) the migration guide's steps are run once on a
real OpenSpec project and the run is recorded.

Shipped as (2026-10-13; archived as `orbit/changes/archive/2026-10-13-concept-docs/`; the charter stands): the five
pages are rewritten for orbit and the pending-rewrite list is EMPTY, so the docs floors are set (`orbit` 100 of 142,
`git` 2 of 4, `gh` 1 of 1 — the `gh` line is the user's merge in `docs/concepts.md`, Sal's choice at apply when the
sweep read zero). Every H2 section of the four concept pages ends in a checked `Carried by:` line, and
`docs/supported-tools.md` is held to `AI_TOOLS` in two tiers (Claude and Codex designed for and tested; 26 generated,
untested). The migration guide opens with a before-you-move checklist measured against OpenSpec 1.14.1, then the move
steps by the state of `orbit/` (a delete only when `find orbit -type f` shows nothing but `orbit/config.yaml`), a stamp
step, and what orbit does not have. `orbit init` warns when an `openspec/` project sits beside it, and proceeds
(R-ugd-11). `git mv` entered the git contract by recapture; `.cospec/openspec/` became an admitted residue identifier.
Baseline capabilities 28 to 29 (`orbit-init-openspec-warning` ADDED).

Exit (1) MET: the five pages are unlisted and pass every file-local check. Exit (2) MET: the carried-by check passes
all four concept pages, every item resolving, and the system review's fresh half read each page's owners and its
baseline sections for orbit behaviour (D-cd-3's residual method) and found none misattributed. Exit (3) MET: the guide
was run as written on a fresh 1.14.1 project with one fixture per hazard, before and after an `orbit init`, and with an
exploration in `orbit/` (`migration-run.md`; declared `observed` in the scenario ledger); the run itself falsified two
guide lines, both fixed before the recorded rerun.

The system blind pair (fresh 0C/1W/5S forward, external GPT-6 0C/2W/2S hold) converged on one finding (the CoStrict
path) and the external half found the one with data-loss weight: the empty-`orbit/` test read only two subdirectories.
Walked in two logs (Sal: A on both decisions), an in-context VERIFICATION graded seven `landed` and two `regressed` (two
wordings, walked to zero), and the gate computed PASSED. 3679 tests green.

### Stage public-readiness — the repository is fit to be seen

Depends-on: landing-page, reference-docs, concept-docs
Complete: [ ]

Charter: sweep what should not be public as it stands: root files (`README_OLD.md`, the adopter report,
`openspec-parallel-merge-plan.md`, and anything else at the root a newcomer would trip on), upstream assets and
links outside the docs, `LICENSE` attribution (the upstream notice kept, orbit's added beside it), and a scan for
secrets, tokens and local absolute paths in tracked files. Each root file is kept, moved or deleted by an explicit
decision. Its last act before the flip is the release (R-ugd-9): once its own PR merges, `npm run release:tree` on
`main` cuts the annotated `v2.0.0` on a built release commit (R-ugd-8), pushed by name, never `--tags`, on Sal's word.
The visibility flip, the repository description and its topics are Sal's acts at arc-done.

Exit: (1) every root-level file has a recorded keep / move / delete decision; (2) the secrets-and-paths scan runs
over every tracked file and its findings are resolved or accepted with a reason; (3) `LICENSE` carries the upstream
notice and orbit's; (4) `v2.0.0` is on `origin`, on a release commit whose parent is `main` at or after this stage's
merge, and a release-tree install of it prints `2.0.0`.

## Considered & out

- **2026-10-12 — the Tier-C code scrub.** Folding the `OpenSpec` strings in CLI help and messages into this program
  (issue #1 suggested it). Out by R-ugd-3: it is code, and the landing page does not depend on it.
- **2026-10-12 — removing or labelling the pages not rewritten.** Out by R-ugd-2: all eleven are rewritten.
- **2026-10-12 — installing from source, or from a Release tarball.** Weighed when R-ugd-4's line failed (the
  landing-page exploration's routes A and C): a clone-and-build install leaves a global symlink into a clone the user
  must keep, and an `npm pack` tarball on a Release makes a Release upload by Sal part of every version. Out by R-ugd-8;
  the from-source route stays in the README's Development section.
- **2026-10-12 — cherry-picking upstream fixes before launch.** The concept-docs exploration (its D-cd-4, Q-cd-8)
  measured that an OpenSpec 1.14.1 project degrades in orbit's 1.3.1 engine, five ways silently (task markers outside
  `- [ ]`/`- [x]`, `skip_specs` and `retire_capabilities` dropped, a delta's Purpose replaced by the TBD placeholder,
  ignored config keys, unknown metadata keys not warned). Taking selected upstream fixes into the engine before the
  flip was weighed. Out (Sal: docs only): orbit launches on the 1.3.1 engine, and the migration guide's "before you
  move" checklist (D-cd-5) is the whole answer. A version bump or cherry-pick stays its own deliberate decision.

## Status log

**2026-10-12 — program declared (Sal), in an architect session.** Context from Sal: the repository goes public after
this program, and the GitHub landing page must give proper orbit instructions instead of OpenSpec's, with a summary of
how orbit improves on OpenSpec and basic documentation on how to use it. Rulings R-ugd-1 (nomenclature), R-ugd-2 (all
eleven pages) and R-ugd-3 (the code scrub out) captured; Q-ugd-1 (the install path) left open with its standing
recommendation. Five stages declared, docs-under-test first so the rewrite is graded by a machine.

**2026-10-12 — Q-ugd-1 resolved (Sal): R-ugd-4.** The install path at launch is a GitHub install pinned to a release
tag, with no npm promise on the page. The options weighed are recorded under Q-ugd-1. The version the tag carries
opened as Q-ugd-2 (standing recommendation `0.1.0`). The landing-page stage's charter and exit (3) now point at both,
and its install run is rehearsed from a local clone before the flip and re-run against the public URL after it.

**2026-10-12 — docs-under-test ratified (Sal), in an architect session; R-ugd-5 and R-ugd-6 captured.** The stage
archived the same day (`orbit/changes/archive/2026-10-12-docs-under-test/`, PR #18 merged), its exits graded MET, exit
(3) as revised: the recorded list of today's failures is a FILE list (D-dut-2). D-dut-3 became R-ugd-5 (interim
states need no protection). Q-ugd-2 resolved as R-ugd-6: the first version is `1.0.0`, against the standing
recommendation of `0.1.0`; the landing-page charter now names it. Carried from the stage: the checked-in `git`
contract still records six keys and six flags rc12 removed from the generated surface, an accepted residual left for
its own change.

**2026-10-12 — R-ugd-7 captured (Sal), in an architect session.** The landing-page exploration (cited, `exploring`)
moved orbit's first version from `1.0.0` to `2.0.0` (its D-lp-1): upstream's own `v1.0.0` tag was already in the local
clone, and `2.0.0` makes a clean break. R-ugd-7 supersedes R-ugd-6's number only; the landing-page charter now names
`2.0.0` and `v2.0.0`. Q-ugd-2's resolution and the earlier status-log entries keep `1.0.0` as the record of what was
decided then.

**2026-10-12 — R-ugd-8 captured (Sal), in an architect session.** The landing-page system review's clean-machine
rehearsal found that R-ugd-4's install line does not install orbit: npm's preparation of a git dependency under `-g`
cannot find TypeScript (measured on npm 10 and 11, the cause read in npm's source). The finding was escalated from the
walk to the change's exploration, which measured four routes and settled on a built release tree (D-lp-16). R-ugd-8
supersedes R-ugd-7's tag placement only; the landing-page charter now names the release commit. R-ugd-4 stands
letter for letter.

**2026-10-12 — landing-page archived** (`orbit/changes/archive/2026-10-12-landing-page/`; PR #19 ready for Sal's merge).
Exits (1) and (2) are MET, and exit (3) is pending: its shell half was observed, and its `/orbit:propose` half and
post-flip re-run are deferred, as is the `v2.0.0` release tag (`npm run release:tree` after the merge). Ratification
waits for those observations or for Sal's word.

**2026-10-12 — R-ugd-9 captured (Sal), in an architect session.** After landing-page's archive and merge, Sal asked
whether `v2.0.0` should wait for the last stage. It should: the installed package carries `LICENSE`, `package.json`
and `README.md`, which public-readiness still edits, and the private repository has no one to install the tag before
the flip. R-ugd-9 moves the tag from landing-page to public-readiness's last act; the landing-page charter drops it,
and public-readiness gains the release act and exit (4). landing-page's archived task 5.3 (deferred to "after Sal
merges PR #19") is superseded by this ruling; the archived record stays as written. landing-page completion offered:
not yet (Sal), since exit (3)'s `/orbit:propose` half and post-flip re-run are still to be observed.

**2026-10-12 — R-ugd-10 captured (Sal), in an architect session; landing-page not yet.** The reference-docs
exploration (cited, `exploring`) found that `orbit feedback` files issues on upstream OpenSpec's tracker, and the stage
must document every command in the program. Sal took retargeting over documenting the command without naming upstream
or removing it (D-rd-6). R-ugd-10 carves that one command out of R-ugd-3, and the reference-docs charter names it. The
exploration also settled that `docs/opsx.md` becomes `docs/workflow-engine.md` (D-rd-7, Sal). landing-page completion
offered again: not yet (Sal), since exit (3)'s two observations are still to be recorded.

**2026-10-12 — R-ugd-10's location restated (Sal: A), at reference-docs' proposal walk.** Both halves of the
proposal's blind pair found that `orbit feedback`'s help line is not in `src/commands/feedback.ts`: it is commander's
description in `src/cli/program.ts`, copied in the completion registry. The ruling's carve-out now names the help
description wherever it is defined. The ruling's reach is unchanged: one command's targets, its help text and its test.

**2026-10-13 — reference-docs archived** (`orbit/changes/archive/2026-10-13-reference-docs/`; PR #20 ready for Sal's
merge). All three exits are MET as written. (1) The six pages left the pending-rewrite list, and the full suite holds
them to every file-local check. (2) The new command-coverage check holds `docs/cli.md` to the program's 55 visible
command paths and `docs/commands.md` to the 15 workflow ids, both read from the code. The check is per page, which is
narrower than "at least one page" and so meets it (design D1). (3) No page names an upstream command (the residue
check), and both system reviewers read every page for upstream behaviour taught under orbit's name. `docs/opsx.md`
is now `docs/workflow-engine.md`, and `orbit feedback` files on `las-sal/orbit-spec` (R-ugd-10). The system walk also
repointed one anchor in `docs/customization.md`, a page owed to concept-docs. Carried forward: `orbit init` and
`orbit update` still print upstream's URLs (R-ugd-3; no page teaches them), and `docs/supported-tools.md`, which the
commands page links for Codex, still describes upstream until concept-docs.

**2026-10-12 — reference-docs ratified (Sal), in an architect session; landing-page not yet.** reference-docs' three
exits were graded MET as written on its archived record, and Sal ratified it. landing-page completion was offered
again: not yet (Sal), for the third time on the same ground, since exit (3)'s `/orbit:propose` half and post-flip
re-run are still unobserved.

**2026-10-12 — R-ugd-11 captured (Sal), in an architect session; cherry-picks out; landing-page not yet.** The
concept-docs exploration (cited, `exploring`) ran `orbit init` over real OpenSpec 1.3.1 and 1.14.1 projects and found
it builds an empty `orbit/` beside `openspec/` without a word. Sal took a warning (D-cd-1) over documentation alone or a
migrate command. R-ugd-11 carves the warning out of R-ugd-3, and the concept-docs charter names it. The same
exploration measured that a 1.14.1 project degrades in the 1.3.1 engine; taking upstream fixes before launch went to
Considered & out (Sal: docs only). landing-page completion offered a fourth time: not yet (Sal), on the same ground.

**2026-10-13 — concept-docs ratified (Sal), in an architect session; landing-page not yet.** concept-docs' three exits
were graded MET on its archived record (the Shipped-as paragraph above), and Sal ratified it after PR #21 merged.
landing-page completion was offered a fifth time: not yet (Sal), on the same ground; exit (3)'s remaining halves need
the public repository. public-readiness, the last stage, is now the program's next.
