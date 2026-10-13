# orbit-release Specification

## Purpose
How orbit is released. A release tag points at a built release tree on a commit of its own, so that npm installs
the tag globally from git without building it on the user's machine.
## Requirements
### Requirement: A release ships a built release tree

A release of orbit SHALL be cut by `scripts/release-tree.mjs` (`npm run release:tree`) from the commit checked out, the
commit RELEASED, as a BUILT RELEASE TREE: a RELEASE COMMIT whose only parent is the commit released, carrying that
commit's tree built, with the annotated tag `v<version>` on it, so that `npm install -g <git spec>#v<version>` installs
the tagged tree unchanged. npm prepares a git dependency that names a prepare trigger by running a nested `npm install`
that inherits the user's `-g` and installs nothing locally, so a tree that must build at install cannot install
globally from git; the release tree is built before it is tagged, and names no trigger. The release commit is never
merged back: the commit released keeps its scripts, so a development `npm install` still builds through `prepare`.

| member | covered by |
|---|---|
| no prepare trigger in the release `package.json`: `prepare`, `build`, `postinstall`, `install`, `preinstall`, `prepack` | the script removes all six from `scripts` and changes nothing else in the file |
| a `workspaces` field (npm's seventh trigger) | the script refuses the release, writing nothing |
| `dist/` built from the commit released | the script builds that commit's own tree in a detached worktree, with the checkout's toolchain, and force-adds `dist/` past `.gitignore`; a build output already in the checkout never reaches the release tree |
| the installed file set | npm packs a git dependency by `files`, as `npm pack` does: the release tree packs the same files as a built checkout of the commit released |
| the version `orbit --version` prints | `package.json` `version`, unchanged by the script |
| the tag | `v<version>`, annotated, on the release commit; an existing tag of that name is refused, writing nothing |
| the push | none: the script prints `git push origin v<version>` for the release act, which pushes the tag by name, never `--tags` |

Named limit (the release tree). Residual kind: an npm or pacote version whose prepare trigger set or git packing rule differs from pacote 21.5.0's, so a release tree that installs under one npm fails under another. Residual method: install the release tree under each npm major the supported Node versions ship (10 and 11 today), in the rehearsal and in a test that runs the release script into a scratch clone and installs its tag.

#### Scenario: The release commit is a child of the commit released, and the tag is on it

- **WHEN** the release script runs in a clone checked out at the commit to release
- **THEN** the annotated tag `v<version>` points at a new commit whose only parent is the commit released, and the commit released and its branch are unchanged

#### Scenario: The release package.json loses exactly the prepare triggers

- **WHEN** the release script runs
- **THEN** the release commit's `package.json` equals the released commit's with the six prepare triggers removed from `scripts`, and the release commit changes no file outside `package.json` and `dist/`

#### Scenario: A stale build output never reaches the release tree

- **WHEN** the checkout's ignored `dist/` holds a file the commit released does not build
- **THEN** the release commit's `dist/` does not carry it

#### Scenario: The release tree packs what a built checkout packs

- **WHEN** `npm pack --dry-run` reads the release tree and a built checkout of the commit released
- **THEN** both list the same files

#### Scenario: The release tag installs globally from git

- **WHEN** `npm install -g` installs `git+file://<clone>#v<version>` into an empty prefix
- **THEN** it exits 0, installs a copy rather than a link, and the installed `orbit --version` prints `<version>`

#### Scenario: A workspaces field is refused

- **WHEN** the commit to release declares `workspaces` in its `package.json`
- **THEN** the script exits non-zero naming `workspaces`, and cuts no commit and no tag

#### Scenario: An existing tag is refused, and nothing is pushed

- **WHEN** the release script runs where `v<version>` already exists, after a run that cut it
- **THEN** the script exits non-zero naming the tag; and no run pushes anything to the clone's remote

### Requirement: The release tree is orbit's only release path

The repository SHALL carry no release path other than `npm run release:tree`: no `package.json` script runs
`npm publish`, `changeset publish` or `changeset version`, and no workflow under `.github/workflows/` publishes a
package or opens a version pull request. orbit installs from a release tag on GitHub (R-ugd-4), and publishing to a
registry stays its maintainer's separate act outside orbit. A second path would publish a tree the release script
never built.

#### Scenario: No package script publishes

- **WHEN** `package.json`'s `scripts` are read
- **THEN** no script's command contains `npm publish` or `changeset`, no script is named `release`, `release:ci` or
  `changeset`, and `release:tree` is present

#### Scenario: No workflow publishes

- **WHEN** the workflow files (`.github/workflows/*.yml` and `*.yaml`) are read
- **THEN** none names `npm publish`, `changeset` or `changesets/action`, and none requests the `id-token: write`
  permission that npm's trusted publishing uses

