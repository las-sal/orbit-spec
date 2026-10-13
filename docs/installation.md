# Installation

This page extends the README's [Install](../README.md#install) section: what the install line does, how to check it,
how to set up a project, and how to upgrade.

## Prerequisites

- **Node.js 20.19.0 or higher.** This is the `engines` range in orbit's `package.json`; npm warns on an older Node.
- **Git.** npm fetches orbit from GitHub with it.

## Install the CLI

```bash
npm install -g github:las-sal/orbit-spec#v2.0.0
```

The `#v2.0.0` tag names a **release tree**: a commit that carries orbit's built output alongside its source. npm
installs it as it stands, so nothing is compiled on your machine and no build tools are needed. A branch or an
untagged commit is not a release tree; install from a tag.

This is the one supported install route. orbit is not published to the npm registry, and no other package manager
route has been run against a release tree.

## Verify

```bash
orbit --version
```

It prints the version of the tag you installed, `2.0.0` for the line above.

## Set up a project

In your project's root:

```bash
cd your-project
orbit init --tools claude
```

`orbit init` creates the `orbit/` directory (`orbit/specs/`, `orbit/changes/`, `orbit/changes/archive/`) and
installs orbit's 15 workflows for the tools you name, as skills and commands. The README's
[What you should see after install](../README.md#what-you-should-see-after-install) lists them.

For Codex, name it instead, or name both:

```bash
orbit init --tools codex
orbit init --tools claude,codex
```

Run with no `--tools`, `orbit init` asks which tools to set up. The [CLI reference](cli.md#orbit-init) lists every
option.

## Upgrade

Upgrading is two steps.

1. **Upgrade the CLI.** Run the install line again, naming the release tag you are moving to:

   ```bash
   npm install -g github:las-sal/orbit-spec#<tag>
   ```

2. **Refresh each project.** In every project you initialized, run:

   ```bash
   orbit update
   ```

   `orbit update` regenerates the project's skills and commands from the CLI you now have installed. It downloads
   nothing: the new workflow text arrives with step 1, and step 2 writes it into the project. A project you do not
   update keeps the skills and commands of the version that last wrote them.

`orbit update --force` regenerates even when the installed files already match the CLI's version.

## From source

To run orbit from a clone of the repository, follow the README's [Development](../README.md#development) section.
The global `orbit` is then a link into the clone, rebuilt with `npm run build`.

## Next

[Getting started](getting-started.md) walks one change from idea to archive.
