## ADDED Requirements

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
