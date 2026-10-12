> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: landing-page

## Premise

The `update-gh-documentation` program's `landing-page` stage (charter: `orbit architecture show
update-gh-documentation landing-page`): rewrite `README.md` as orbit's landing page — what orbit is (a hard fork of
OpenSpec 1.3.1, attributed), how it improves on OpenSpec (each claim naming the capability that carries it), the
pinned GitHub install (R-ugd-4) at `1.0.0` per the charter (R-ugd-6) — now `2.0.0` by D-lp-1 — with `package.json` bumped and the tag cut on `main`, a
quickstart through the core loop, links into `docs/`. Upstream's logo, badges and Discord leave. Exits: (1) the README
passes docs-under-test's checks with no recorded exception — so `README.md` leaves `pending-rewrite.json`; (2) every
improvement claimed names a capability that exists in `orbit/specs/`; (3) a clean-machine run of install + quickstart,
observed, rehearsed from a `git+file://` clone before the flip and re-run against the public URL after.

Measured 2026-10-12 at the start of this exploration:

- **A local `v1.0.0` tag already exists, and it is UPSTREAM's** — `0e6f42c` ("Version Packages (#579)", 2026-01-25),
  not an ancestor of `main`. The `upstream` remote fetches tags by default; 56 upstream tags sit in the local repo
  (`v0.1.0`…`v1.9.0`, `@fission-ai/openspec@1.12.0`…`1.14.0`) beside `upstream/v1.3.1`. `origin` carries only
  `upstream/v1.3.1`. So `git tag v1.0.0` fails as written, `git tag -f` silently replaces upstream's, and a
  `git push --tags` would publish all 56 upstream tags to `origin`.
- **A version change is safe for update detection in either direction**: `tool-detection.ts` compares `generatedBy` with `!==`,
  never by order, so an existing surface stamped `1.3.1` is simply stale and refreshed.
- **One generated sentence turns misleading on the bump**: the onboard body says "run `orbit --version` … the pinned
  engine version is 1.3.1" — after the bump `--version` prints `2.0.0`, which the reader will take as contradicting it.
  `orbit-onboard`'s scenarios state "engine pinned at 1.3.1" (still true: that is the upstream baseline, owned by
  `orbit-conventions`' version-declaration requirement); the body conflates tool version with engine baseline.
- The README's two admitted ATX sections are already fixed by `orbit-user-docs`: `Built on OpenSpec` and
  `How orbit improves on OpenSpec` (exact titles, ATX only — a setext heading neither opens nor ends one).
- `.github/workflows/release-prepare.yml` (upstream's changesets/npm-OIDC release) runs on every push to `main`.
  Not this stage's (public-readiness sweeps upstream assets and links outside the docs) — noted so it is not lost.

## Mechanism

### D-lp-5 — every improvement claim names capabilities that exist
Domain: the content of the `README.md` section `How orbit improves on OpenSpec` (the ATX section as `orbit-user-docs` bounds it)
| member | covered by |
|---|---|
| a top-level list item naming at least one `orbit-*` capability in backticks, every one resolving to `orbit/specs/<name>/spec.md` | passes |
| a top-level list item naming no capability | fails, naming the line |
| a top-level list item naming a backticked `orbit-*` token that resolves to no capability (a skill name such as `orbit-explore`, a typo, a retired name) | fails, naming the line and the token |
| a nested list item | read as part of its top-level item; it neither needs nor supplies a name of its own |
| a capability name inside a fenced block in the section | not read — fences are never structure |
| the section absent, or holding no top-level list item | fails — an empty comparison passes nothing |
| a non-list block in the section (an intro paragraph, a table, a sub-heading's prose) | not read; the residual |
Closure: BOUNDED — the check reads list items; a claim can be written in any block
Residual kind: an improvement claim written outside a top-level list item of the section — in its prose, a table, or anywhere else on the page
Residual method: review reads the page for claims of improvement; the same review owns whether each named capability actually carries its claim (truth is a record, R-crc-11)
Moves:
- READ: applied — `orbit-user-docs`' residue requirement bounds a README section from an ATX heading to the next ATX heading of level at most its own, read from a markdown-it parse; the new check reuses that bound
- ENUMERATE: applied — this table; the skill-name row exists because `orbit-*` names skills too (`orbit-explore` is a skill, `orbit-explore-modifications` the capability)
- COHERE: applied — the residue check ADMITS this section and this check READS it; one section bound, two readers, no conflict
- EXECUTE: not applied — no README carries the section yet; the change's test cases execute it
- FALSIFY: applied — an existing capability named beside a claim it does not carry passes; that miss is the residual's second half, assigned to review
- CONFORM: applied — R-crc-11 (check what the engine observes, record the rest), R-crc-14 (stated once, in `orbit-user-docs`), G2 (the program's goal this measures)
- FEASIBILITY: not applied — one section, a directory listing
- CONSUME: applied — the suite consumes it; once `README.md` leaves `pending-rewrite.json` every check runs on it, and a pending README is skipped like every other check
- INVOKE: applied — `npm test`, on every run

### D-lp-16 — a release ships a built release tree
Domain: every condition under which `npm install -g <git spec>#<tag>` installs a working orbit from the tagged tree
| member | covered by |
|---|---|
| no pacote prepare trigger in the release `package.json` (`prepare`, `build`, `postinstall`, `install`, `preinstall`, `prepack`) | the release script removes all six (pacote 21.5.0 `lib/git.js` `#prepareDir`) |
| no `workspaces` field (pacote's seventh trigger) | the package declares none; the release script refuses one |
| `dist/` built from the release commit's own parent | the release script runs the build on the parent's tree, then force-adds `dist/` |
| `bin/orbit.js` resolves into `dist/` | the built-tree spike: `orbit --version` prints 2.0.0 |
| the installed file set | npm's git path packs by `files`, as `npm pack` does: the built-tree install and the tarball install hold the same eight entries |
| runtime `dependencies` | installed by npm from the release `package.json` (the spike's `node_modules`) |
| the version `orbit --version` prints | `package.json` `version`, unchanged by the release script |
| the completion tip `postinstall` printed | dropped from the release tree with the trigger; `orbit completion install` is unaffected |
| where the tag points | the release commit, child of `main`'s merge commit, pushed by name, never `--tags` |
Closure: BOUNDED — the trigger set and the packing rule are read from one npm (11.12.1, pacote 21.5.0) and the failure measured under two (10.9.2, 11.12.1); other versions are not read
Residual kind: an npm or pacote version whose prepare trigger set or git packing rule differs from pacote 21.5.0's, so a release tree that installs under one npm fails under another
Residual method: install the release tree under each npm major the supported Node versions ship (10 and 11 today), in the rehearsal and in a test that runs the release script into a scratch clone and installs its tag
Moves:
- READ: applied — `@npmcli/config` `set-envs.js`, pacote `lib/git.js` `#prepareDir` and `#clone`, `lib/fetcher.js` `npmCliConfig`, all in npm 11.12.1's installed source (D-lp-13, D-lp-15)
- ENUMERATE: applied — this table; the trigger names are copied from the source, not recalled
- COHERE: applied — the release `package.json` differs from `main`'s by the removed scripts only, and the two never meet: the release commit is never merged back, so `npm install` on `main` still builds through `prepare`
- EXECUTE: applied — the built-tree spike: exit 0, 2.0.0, `orbit init --tools claude` writes 51 files, and the installed set equals the tarball install's
- FALSIFY: applied — a tree that installs but carries a `dist/` stale against its source would pass every row; the build runs on the parent's tree in the same script that commits it, and the test rebuilds and compares
- CONFORM: applied — R-ugd-4's line kept letter for letter; R-ugd-7's "tag on `main`" amended (architect); the outward-actions rule: the tag push is already this stage's act and no Release is required
- FEASIBILITY: applied — about 600 KB of built output enters history per release (the packed tarball is 604 KB)
- CONSUME: applied — npm's git path (measured), `orbit --version` (version unchanged), update detection compares `generatedBy` by `!==` and is unaffected
- INVOKE: applied — fires at the post-merge release act (task 5.3's successor), on Sal's word, and in the pre-flip rehearsal, which installs the script's output from a local clone

## Decisions


- **2026-10-12 — D-lp-1: orbit's first version is `2.0.0`, not `1.0.0`** (Sal, in this exploration: "a clean break
  from upstream"). It supersedes R-ugd-6's number; the bump (`package.json` from `1.3.1`) and the `v2.0.0` tag on `main`
  stay this stage's acts. Measured the same day: upstream's highest release is `1.14.1` (tags and npm), so `2.0.0` sits
  above every number upstream has shipped, where `1.0.0` sat inside upstream's range and collided with upstream's own
  local `v1.0.0` tag. Upstream's FUTURE numbers do not matter (Sal): orbit's engine is frozen at the `1.3.1` baseline and
  moves only by deliberate cherry-pick, and npm keeps the packages apart by name. The one mechanical overlap is the
  git tag namespace in a clone that fetches upstream's tags (both use `vX.Y.Z`) — closed by Q-lp-1's `--no-tags` —
  and the one human one, a reader pairing "orbit 2.0.0" with an "OpenSpec 2.0.0", is the README attribution's to
  answer ("forked from 1.3.1, frozen there"). Captured in the program doc as R-ugd-7 (architect session,
  2026-10-12), superseding R-ugd-6's number; the landing-page charter now names `2.0.0`.
  Kind: scope
- **2026-10-12 — D-lp-2: the upstream tags leave this clone and stay out** (Sal: as recommended; was Q-lp-1). Delete the
  fetched upstream tags locally, keeping `upstream/v1.3.1`; set `remote.upstream.tagOpt --no-tags`; cut an annotated
  `v2.0.0` on `main`; push that one tag by name, never `--tags`. The tags are upstream's history; `--no-tags` makes
  "frozen at 1.3.1" true of the tag namespace as well as the code.
  Kind: scope
- **2026-10-12 — D-lp-3: the tag is cut in this stage, as chartered** (as recommended; was Q-lp-2). The tagged tree
  predates the later docs stages and public-readiness's `LICENSE` edit; the install needs only code, the docs are read
  at `main`, and R-ugd-5 accepts interim states. Moving a published tag later would be worse.
  Kind: scope
- **2026-10-12 — D-lp-4: the page outline** (as recommended; was Q-lp-3). `# orbit` + one paragraph (what it is, for
  whom) · `## Built on OpenSpec` (attribution, upstream link, the `upstream/v1.3.1` baseline, "forked from 1.3.1,
  frozen there", telemetry removed) · `## How orbit improves on OpenSpec` · `## Install` (Node ≥ 20.19,
  `npm install -g github:las-sal/orbit-spec#v2.0.0`, `orbit --version`) · `## Quickstart` (`orbit init --tools claude`,
  then explore → propose → review → apply → review → archive, `orbit status`) · `## Docs` · `## Development` (npm) ·
  `## Contributing` (D-lp-8) · `## License`. Upstream's philosophy block, dashboard image, Spec Kit/Kiro comparison, usage
  notes, telemetry and maintainers sections leave. The two admitted titles are ATX, exactly as `orbit-user-docs` names them.
  Kind: scope
- **2026-10-12 — D-lp-5: exit (2) is a CHECK of what is observable** (as recommended; was Q-lp-4). Every top-level list
  item in `How orbit improves on OpenSpec` names at least one `orbit-*` capability in backticks, and every backticked
  `orbit-*` token in those items resolves to `orbit/specs/<name>/spec.md`; stated once, as a new `orbit-user-docs`
  requirement. Whether a claim is TRUE stays review's — a record (R-crc-11).
  Kind: rule
- **2026-10-12 — D-lp-6: the improvements claimed** (as recommended; was Q-lp-5). Claim → capabilities: reviewed gates
  with a computed cadence (`orbit-engine-gates`, `orbit-review`); the blind pair and the external runner
  (`orbit-review-external`, `orbit-external-runner`); walks with pushback (`orbit-address-reviews`); orientation
  (`orbit-orientation`); engine-composed emits, trails and rendered reports (`orbit-emit-composition`,
  `orbit-run-summary-emit`, `orbit-report-rendering`); the architect tier (`orbit-architect`,
  `orbit-architecture-engine`); safe parallel archive (`orbit-base-fingerprints`); user-invoked lifecycle
  (`orbit-lifecycle-consent`); the PR lifecycle (`orbit-pr-lifecycle`); drift audit (`orbit-audit-drift`) — six to nine
  bullets at authoring. "Telemetry removed" is carried by no capability, so it sits in `Built on OpenSpec` as a fact
  about the fork, never as a claimed improvement.
  Kind: scope
- **2026-10-12 — D-lp-7: the page names Claude Code and Codex** (as recommended; was Q-lp-6). The generator's other
  inherited adapters are mentioned as inherited and untested, linking to `docs/supported-tools.md`.
  Kind: scope
- **2026-10-12 — D-lp-8: Contributing is two lines** (Sal: as recommended; was Q-lp-8). Issues welcome on
  `las-sal/orbit-spec`; larger changes start as an orbit change proposal. No `MAINTAINERS.md` link (that file is
  public-readiness's).
  Kind: scope
- **2026-10-12 — D-lp-9: the onboard version sentence is fixed in this stage** (as recommended; was Q-lp-7). The body
  separates orbit's version (`orbit --version`, `2.0.0`) from the upstream baseline (1.3.1); a named edit under
  `orbit-onboard`. With D-lp-5 the stage touches two capabilities, `orbit-user-docs` and `orbit-onboard`.
  Kind: scope
- **2026-10-12 — D-lp-10: what exit (3)'s run observes** (as recommended; was Q-lp-9). Every shell step of the
  README's install and quickstart, observed on a clean machine, plus one `/orbit:propose` in Claude Code there,
  producing a change `orbit status` then shows — not the whole loop.
  Kind: scope
- **2026-10-12 — D-lp-11: R-ugd-4's install line does not install orbit** (measured at the system walk's rehearsal and
  re-entry spikes, 2026-10-12). `npm install -g <git url>#v2.0.0` exits 1 ("git dep preparation failed … Build
  failed!") on npm 11.12.1 and on npm 10.9.2, with the prefix from the environment or from a user `.npmrc`: npm's nested
  `npm install --include=dev` in its temporary clone inherits `npm_config_global=true`, installs nothing into the
  clone, and `build.js` cannot resolve `typescript/bin/tsc`. The same tree builds under a plain local `npm install`.
  Kind: fact
- **2026-10-12 — D-lp-12: no change inside the package can repair it** (measured, the self-healing spike). A `build.js`
  that installs its own toolchain with the global flag cleared builds, and the install still exits 1: under the leaked
  flag npm's nested install has already installed the temporary clone GLOBALLY as a link into that clone, which npm then
  deletes, so `postinstall` runs through a dangling link. The damage precedes `prepare`.
  Kind: fact
- **2026-10-12 — D-lp-13: the root cause is npm's, in pacote** (read in npm 11.12.1's installed source).
  `@npmcli/config`'s `setEnvs` exports every non-default CLI setting to child processes, so `-g` becomes
  `npm_config_global=true`; pacote's git fetcher (`lib/git.js` `#prepareDir`) fires when `package.json` carries any of
  `prepare`, `build`, `postinstall`, `install`, `preinstall`, `prepack`, and spawns `npm install` with
  `{ ...process.env }` and flags (`lib/fetcher.js`) that override the inherited `omit` setting but never `global`. The
  upstream fix is one flag in pacote; filing it is Sal's outward act, and users on npm 10 and 11 stay affected.
  Kind: fact
- **2026-10-12 — D-lp-14: a release tree that is already built installs by R-ugd-4's literal line** (measured, the
  built-tree spike). A tag on a commit carrying a built `dist/` and none of pacote's six trigger script names: `npm
  install -g git+file://<clone>#<tag>` exits 0, `orbit --version` prints 2.0.0, the global install is a real copy, and
  `orbit init --tools claude` writes the same 51 files.
  Kind: fact
- **2026-10-12 — D-lp-15: GitHub's source tarball is not a route of its own** (read in pacote's `lib/git.js` `#clone`,
  and measured). For a `github:` spec npm already downloads the hosted tarball of the tag (`h.tarball()` through
  `RemoteFetcher`) and then runs `#prepareDir` on it, so R-ugd-4's line IS the git tarball plus a build. Installing the
  source archive URL directly skips the build: today's tree installs with exit 0, `orbit --version` crashes for want of
  `dist/`, and the whole repository is installed (a raw tarball ignores `files`); the archive of a built release tree
  installs and prints 2.0.0. The variable is whether the tagged tree is built, which is route D.
  Kind: fact
- **2026-10-12 — D-lp-16: a release ships a BUILT RELEASE TREE, and R-ugd-4's install line stays exact** (Sal: "ok to
  go with your rec"; was Q-lp-10). Each release tag sits on a RELEASE COMMIT whose parent is `main`'s merge commit: a
  release script builds, force-adds `dist/` past `.gitignore`, and removes pacote's prepare triggers from that commit's
  `package.json`; the tag is cut on it and pushed by name. `npm install -g github:las-sal/orbit-spec#v2.0.0` installs
  that tree unchanged. The from-source route (clone, `npm install`, `npm install -g .`, a symlink into the clone) is
  stated in Development. R-ugd-7's "the tag on `main`" is amended to the release commit in an architect session; the
  upstream npm report (D-lp-13) is Sal's to file.
  Kind: rule

## Open questions

## Considered & out

- **2026-10-12 — route C, an `npm pack` tarball attached to the GitHub Release** (D-lp-16 chose D): installs a trimmed
  copy, but makes a Release upload by Sal part of every version and replaces R-ugd-4's `github:` line with an asset URL.
- **2026-10-12 — route A as the landing-page install** (D-lp-16 chose D): works, but four or five commands and a global
  symlink into a clone the user must keep; kept as the from-source route in Development.

- **2026-10-12 — a `prepare` that survives the global install** (route B; refuted by D-lp-12 and explained by D-lp-13): the failure happens in
  npm's nested install before `prepare` runs, so no build script can repair it. Moving the build toolchain into
  `dependencies` fails for the same reason (the nested install installs nothing locally).

## References

- `orbit architecture show update-gh-documentation landing-page` — the charter and exits
- `orbit/architecture/update-gh-documentation.md` — R-ugd-1 … R-ugd-6, goals G1/G2
- `orbit/specs/orbit-user-docs/spec.md` — the admitted README sections; `test/core/user-docs/pending-rewrite.json`
- `orbit/changes/archive/2026-10-12-docs-under-test/` — the stage this one depends on
- `src/core/shared/tool-detection.ts:197` — `generatedBy` compared with `!==`
- `src/core/templates/workflows/onboard.ts:36` — the version sentence; `orbit/specs/orbit-onboard/spec.md:37`
- `orbit/specs/orbit-conventions/spec.md:770` — upstream version declaration
- `orbit/changes/landing-page/tasks.md` task 5.2 — the failed rehearsal's record; `address-reviews-2026-10-12T18-01-09Z`
  — the escalation that routed the install route here
- `.github/workflows/release-prepare.yml` — upstream's release workflow, for public-readiness
