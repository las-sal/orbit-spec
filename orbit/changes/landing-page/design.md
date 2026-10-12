## Context

`README.md` is still upstream's landing page: it installs `@fission-ai/openspec`, runs `openspec init`, teaches
`/opsx:` commands, and shows upstream's logo, badges and Discord. docs-under-test (archived 2026-10-12) put the user
docs under machine checks and listed all twelve files as pending their rewrite. This stage rewrites the README,
removes it from that list, and makes the program's first release (see explore.md for the measurements, ten decisions
and the one rule).

Measured at exploration (2026-10-12): upstream's own `v1.0.0` tag was already in the local clone (the `upstream`
remote fetches tags; 56 upstream tags beside `upstream/v1.3.1`), which is why the first version moved to `2.0.0`
(D-lp-1, captured as R-ugd-7). A version change is safe for update detection in either direction:
`src/core/shared/tool-detection.ts` compares `generatedBy` with `!==`, never by order. The onboard body's version
sentence (`src/core/templates/workflows/onboard.ts:36`) is the one generated sentence the bump makes misleading.

## Goals / Non-Goals

**Goals:**

- A README a newcomer can follow to install orbit at `v2.0.0` and run its core loop (G1), whose every claimed
  improvement names the capabilities that carry it (G2), passing every docs check with no recorded exception.
- `package.json` at `2.0.0` and an annotated `v2.0.0` tag on `main`, with the clone no longer fetching upstream's tags.
- A recorded clean-machine run of the install and quickstart.

**Non-Goals:**

- The eleven `docs/` pages (reference-docs and concept-docs). The README links to ten of them as they stand (R-ugd-5; `docs/opsx.md` is left unlinked, D1).
- Upstream assets under `assets/`, `MAINTAINERS.md`, `LICENSE`, and `.github/workflows/release-prepare.yml`
  (upstream's release workflow, which runs on every push to `main`): public-readiness's.
- An npm publish or a GitHub Release page: Sal's (R-ugd-4, R-ugd-6).
- `OpenSpec` strings in CLI help and messages: out by R-ugd-3.

## Decisions

### D1 — The README follows D-lp-4's outline

`# orbit` and one paragraph (what it is: a spec-driven workflow for AI coding assistants, built on Claude Code first
and Codex, D-lp-7) · `## Built on OpenSpec` · `## How orbit improves on OpenSpec` · `## Install` · `## Quickstart` ·
`## Docs` · `## Development` · `## Contributing` · `## License`. The two admitted titles are written as ATX headings,
exactly as `orbit-user-docs` names them, because a setext heading neither opens nor ends an admitted section.

- **Built on OpenSpec**: a hard fork of `@fission-ai/openspec@1.3.1`, linked; the vendored baseline is the
  `upstream/v1.3.1` tag; the engine is frozen there and moves only by deliberate cherry-pick; telemetry removed (a fact
  about the fork, never a claimed improvement, because no capability carries it: D-lp-6). The section names
  `@fission-ai/openspec@1.3.1` in full: `orbit-conventions`' `Upstream version pinning` scenario "Pinned baseline
  declared in README" requires the README to name the engine's upstream baseline, and a trim to "OpenSpec 1.3.1" would
  break it.
- **How orbit improves on OpenSpec**: one top-level bullet per claim, each naming its capabilities in backticks
  (D-lp-6): reviewed gates with a computed cadence (`orbit-engine-gates`, `orbit-review`); the blind pair and the
  external runner (`orbit-review-external`, `orbit-external-runner`); walks with pushback (`orbit-address-reviews`);
  orientation (`orbit-orientation`); engine-composed emits, trails and rendered reports (`orbit-emit-composition`,
  `orbit-run-summary-emit`, `orbit-report-rendering`); the architect tier (`orbit-architect`,
  `orbit-architecture-engine`); safe parallel archive (`orbit-base-fingerprints`); user-invoked lifecycle
  (`orbit-lifecycle-consent`); the PR lifecycle (`orbit-pr-lifecycle`); drift audit (`orbit-audit-drift`). Bullets may
  merge at authoring (six to nine, D-lp-6); every name above exists in `orbit/specs/` today.
- **Install**: Node.js 20.19.0 or higher and Git (the GitHub install fetches the repository with it); `npm install -g github:las-sal/orbit-spec#v2.0.0`; `orbit --version`. The
  git install builds on the user's machine through `package.json`'s `prepare` script. No npm-registry promise (R-ugd-4).
- **Quickstart**: Claude Code's (proposal walk, Sal: A). `cd` into a project, `orbit init --tools claude`, then the loop as
  `/orbit:*` slash commands in prose and inline code, with `orbit status` as the orientation command. One line says
  Codex is set up with `orbit init --tools codex`, which installs its skills and prompts, and links to
  `docs/supported-tools.md` for how Codex invokes them; no Codex invocation syntax is written on the page, because
  nothing in this stage runs it.
- **Docs**: links to ten of the eleven pages under their current names; `docs/opsx.md` is NOT linked, because its
  filename is residue outside the admitted sections (proposal walk, Sal: A), and reference-docs, which renames it and
  repoints its links, adds the link then. The linked pages' content is upstream's until the docs stages land; R-ugd-5
  accepts that interim state.
- **Development**: clone the repository (said in prose), then `npm install`, `npm run build`, `npm test`. No `git`
  command is written: `clone` is not a key of the recorded `git` contract, and recording one is not this stage's.
- **Contributing**: two lines (D-lp-8). **License**: says MIT and points at `LICENSE`; the copyright notice stays in
  the `LICENSE` file only, never quoted on the page (its holder's name would be residue there; public-readiness adds
  orbit's notice to the file).
- The other adapters the generator inherits are mentioned once, as inherited and untested, linking to
  `docs/supported-tools.md` (D-lp-7).

### D2 — The improvement-claims check reuses the residue check's section reader

`orbit-user-docs`' new requirement owns the rule (D-lp-5). The implementation lives in `test/helpers/user-docs.ts`
beside `admittedLines`, reading the same markdown-it parse: the section runs from the ATX heading titled exactly `How
orbit improves on OpenSpec` to the next ATX heading of level at most its own. A top-level list item is a
`list_item_open` whose enclosing list sits at nesting level zero within the section; its names are the `code_inline`
tokens anywhere inside the item, nested items included, whose WHOLE content matches the requirement's `<name>`
production (anchored at both ends); a nested item is never judged as an item of its own, and an unresolved name in
it is reported on its own line. Fences are `fence` tokens and are never read. A name resolves when
`orbit/specs/<name>/spec.md` exists. The check gates on nothing itself: it joins `fileLocalFailures`, as a
`README.md`-only check that passes every other file, so the suite runs it over the unlisted docs and the exactness rule
runs it over a listed README alone, and a listed README that would pass it is still reported finished.

Alternative considered: a RECORD only (review grades exit (2)). Rejected: both inputs, the items and the names, are
observable, and R-crc-11 mechanizes what the engine can observe. Truth stays review's.

### D3 — The version moves with npm, not by hand

`npm version 2.0.0 --no-git-tag-version` updates `package.json` and `package-lock.json` together and creates no tag;
the tag is D4's.

### D4 — The tag namespace is cleaned now; `v2.0.0` is cut on `main` after the merge

During apply, delete exactly the local tags that are UPSTREAM's: the intersection of the local tags with
`git ls-remote --tags upstream`, minus `upstream/v1.3.1` (proposal walk) — a local-only tag with no upstream provenance is
kept. The exact deletion set is recorded under task 1.2, not only its count. Then run `git config remote.upstream.tagOpt --no-tags`. A
`git fetch upstream` afterwards brings no tag. This is local configuration: nothing in the tracked tree changes.

The annotated `v2.0.0` is cut on `main`'s merge commit once Sal merges this change's PR, then pushed by name
(`git push origin v2.0.0`), never `--tags`, by the orbit session Sal opens after the merge, on his word (proposal walk): the
tag is this stage's act under R-ugd-7, while merging the PR and any GitHub Release page stay Sal's. Before the merge, "on `main`" cannot be true: a tag on the branch moves
if a walk edits the branch, and points outside `main` if the PR is never merged. So the tag is a post-merge act,
carried as a user-validation task and DEFERRED at archive (archive Step 3.2: state that exists only after the move is
DEFERRED by rule).

### D5 — Exit (3)'s rehearsal runs the README verbatim, swapping only the URL

Before the flip the GitHub URL is private, so the rehearsal clones the branch to a scratch directory, cuts a local
`v2.0.0` there (that clone only), and runs the README's install with `github:las-sal/orbit-spec#v2.0.0` replaced by
`git+file://<clone>#v2.0.0`, then every quickstart shell step, plus one `/orbit:propose` in Claude Code, on a machine
or account with no orbit installed (D-lp-10). Observed, not inferred: the record carries the commands and their
output. The post-flip re-run against the public URL is the second half of exit (3), DEFERRED at archive.

### D6 — The onboard body separates the two numbers

The Orientation bullet becomes: `orbit` is the CLI; `orbit --version` prints orbit's own version; the engine is
pinned at the upstream baseline 1.3.1. The Identity section's "pinned at 1.3.1" sentence stays: it names the
baseline and no version command. Under `orbit-conventions`' `Generated-file disposition` the onboard body is
orbit-authored, so the edit needs no upstream-portion naming. Both onboard hashes in the parity pin move as one
recorded act.

### D7 — The README's command heads are declared in the docs fence

The README writes `npm` and `cd` in shell fences, so the `docs-inventory` fence declares `utility: npm cd` (`utility`
admits an installer, per `orbit-user-docs`). `orbit` needs no declaration: it is recorded, and every `orbit` snippet is
checked by the grammar sweep. The fence is exact both ways, so a head the final README does not use is removed.

## Risks / Trade-offs

- [D-lp-5 is BOUNDED] → the named limit lives in `orbit-user-docs`' `Every improvement the README claims over OpenSpec
  names capabilities that exist`; this entry points at it and restates nothing.
- [`#` inside the install argument] → POSIX shell starts a comment only at the start of a word, so
  `github:las-sal/orbit-spec#v2.0.0` is one word; if the shared extractor read it as a comment, the sweeps would still
  see `npm install -g github:las-sal/orbit-spec` and pass. Apply observes what the extractor does and records it.
- [The git install builds on the user's machine] → `prepare` runs `npm run build`, which needs devDependencies; npm
  installs them for a git dependency. The rehearsal observes it, and a failure there is exit (3)'s to report.
- [The tagged tree predates the later stages] → its `docs/` are upstream's and its `LICENSE` lacks orbit's notice. The
  install needs only code, which those stages do not change (D-lp-3, R-ugd-5).
- [Two numbers a reader may pair] → "orbit 2.0.0" beside a future "OpenSpec 2.0.0". `Built on OpenSpec` states
  "forked from 1.3.1, frozen there"; npm keeps the packages apart by name (D-lp-1).
- [Docs links point at pages still upstream's] → accepted interim state (R-ugd-5); the docs stages rewrite them.
  `docs/opsx.md` is the one page left unlinked (D1) until reference-docs renames it and adds the link.

## Alternatives considered

- **First version `1.0.0`** (R-ugd-6) or **`0.1.0`** (Q-ugd-2's standing recommendation): `1.0.0` sits inside upstream's
  range and collided with upstream's local `v1.0.0` tag; superseded by `2.0.0` (D-lp-1, R-ugd-7).
- **A differently named tag** (`orbit-v1.0.0`): contradicts the program's ruling wording; the collision is closed by
  `--no-tags` instead (D-lp-2).
- **Force-replacing only the local `v1.0.0`**: leaves 55 upstream tags one `git push --tags` from `origin` (D-lp-2).
- **Cutting the tag on the branch before merge**: a walk would move it, or it points outside `main` (D4).
- **Exit (2) as a record only**: rejected in D2.

## Touchpoints

- `README.md` — rewritten (D1).
- `test/core/user-docs/pending-rewrite.json` — `README.md` removed.
- `test/helpers/user-docs.ts` — the improvement-claims check (D2).
- `test/core/user-docs/` — a new claims test; the exactness test's file-local set.
- `orbit/changes/landing-page/specs/orbit-user-docs/spec.md` — the `docs-inventory` fence the docs inventory reads (D7).
- `package.json` + `package-lock.json` — version `2.0.0` (D3).
- `src/core/templates/workflows/onboard.ts` — the Orientation version bullet (D6).
- `test/core/templates/skill-templates-parity.test.ts` — the two onboard hashes.
- `test/core/templates/*.test.ts` — `@scenario` tags for the onboard scenarios.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-lp-5 | BOUNDED | live rule | `orbit-user-docs`' `Every improvement the README claims over OpenSpec names capabilities that exist` (normative TABLE; residual slots verbatim as its named limit) |
| D-lp-1 | — | `Kind: scope` | not carried |
| D-lp-2 | — | `Kind: scope` | not carried |
| D-lp-3 | — | `Kind: scope` | not carried |
| D-lp-4 | — | `Kind: scope` | not carried |
| D-lp-6 | — | `Kind: scope` | not carried |
| D-lp-7 | — | `Kind: scope` | not carried |
| D-lp-8 | — | `Kind: scope` | not carried |
| D-lp-9 | — | `Kind: scope` | not carried |
| D-lp-10 | — | `Kind: scope` | not carried |
