# Supported tools

`orbit init` installs orbit's workflows into the AI coding assistants you name. orbit is built for Claude Code first,
with Codex second; the generator also carries adapters for 26 more assistants, inherited from orbit's 1.3.1 baseline
(see [Built on](../README.md)). This page lists every tool `orbit init` accepts, in two tiers, and where each
one's files go.

## What init installs for a tool

For each tool you name, `orbit init` writes every workflow, 15 of them: a skill directory per workflow, holding a
`SKILL.md` and, for eight workflows, a `references/` directory the skill reads; and, where the tool has a command
adapter, a command file per workflow that launches the skill. No profile narrows the set: every install carries all
15 workflows, whatever profile is stored. The global delivery setting (`orbit config profile`) is honored: it can
install skills only, commands only, or both, the default.

`orbit update` rewrites the same files from the installed CLI. The skill and command files are generated, so edit
orbit's templates rather than the files.

Carried by: `orbit-skill-generation`, fork-and-orbify D15, `orbit-conventions`

## Tier 1: designed for and tested

orbit's workflows are written for these two tools, and a real `orbit init --tools claude,codex` is run by orbit's test
suite, which checks every generated skill, reference and command file against its source. Both tools receive the same
skill bodies, byte for byte.

| Tool | Id | Skills | Commands |
|---|---|---|---|
| Claude Code | `claude` | `.claude/skills/orbit-<workflow>/` | `.claude/commands/orbit/<id>.md` |
| Codex | `codex` | `.codex/skills/orbit-<workflow>/` | `$CODEX_HOME/prompts/orbit-<id>.md` |

### Claude Code

orbit writes into the project: 15 skill directories under `.claude/skills/` and 15 commands under
`.claude/commands/orbit/`. In Claude Code, run a workflow as `/orbit:<id>`, for example `/orbit:propose add-dark-mode`.
Each command is a short launcher that loads the matching skill, which carries the workflow. The
[README](../README.md) lists every command, command file and skill directory.

### Codex

orbit writes two places, and only the first is in the project:

- Skills under `.codex/skills/orbit-<workflow>/`, one per workflow, the same bodies Claude Code gets. Later releases
  of the tool orbit was forked from moved Codex skills to `.agents/skills/`; orbit still writes `.codex/skills/`.
- Commands as prompts in the global Codex home: `$CODEX_HOME/prompts/orbit-<id>.md`, which is
  `~/.codex/prompts/orbit-<id>.md` when `CODEX_HOME` is unset. They are shared by every project on the machine, so
  `orbit update` in any project rewrites them. Later releases of the tool orbit was forked from stopped writing these
  prompts; orbit still writes them.

In Codex, run a workflow as the prompt `/prompts:orbit-<id>`, for example `/prompts:orbit-propose add-dark-mode`. The
prompt is the same launcher as Claude Code's command: it tells Codex to load the `orbit-<workflow>` skill.

Carried by: `orbit-skill-generation`, fork-and-orbify D11

## Tier 2: generated, untested

These tools are init targets because the generator orbit inherited carries an adapter for each. orbit generates the
same skills for them, and command files where the tool has a command adapter, into the directories its 1.3.1 baseline
used. orbit does not test them: a tool can move its directories after 1.3.1, so a file generated into the old place
may never be read. Treat these as untested, not as supported.

| Tool | Id | Skills | Commands |
|---|---|---|---|
| Amazon Q Developer | `amazon-q` | `.amazonq/skills/` | `.amazonq/prompts/orbit-<id>.md` |
| Antigravity | `antigravity` | `.agent/skills/` | `.agent/workflows/orbit-<id>.md` |
| Auggie (Augment CLI) | `auggie` | `.augment/skills/` | `.augment/commands/orbit-<id>.md` |
| Bob Shell | `bob` | `.bob/skills/` | `.bob/commands/orbit-<id>.md` |
| Cline | `cline` | `.cline/skills/` | `.clinerules/workflows/orbit-<id>.md` |
| CodeBuddy Code (CLI) | `codebuddy` | `.codebuddy/skills/` | `.codebuddy/commands/orbit/<id>.md` |
| Continue | `continue` | `.continue/skills/` | `.continue/prompts/orbit-<id>.prompt` |
| CoStrict | `costrict` | `.cospec/skills/` | `.cospec/openspec/commands/orbit-<id>.md` |
| Crush | `crush` | `.crush/skills/` | `.crush/commands/orbit/<id>.md` |
| Cursor | `cursor` | `.cursor/skills/` | `.cursor/commands/orbit-<id>.md` |
| Factory Droid | `factory` | `.factory/skills/` | `.factory/commands/orbit-<id>.md` |
| ForgeCode | `forgecode` | `.forge/skills/` | none: invoke the skills |
| Gemini CLI | `gemini` | `.gemini/skills/` | `.gemini/commands/orbit/<id>.toml` |
| GitHub Copilot | `github-copilot` | `.github/skills/` | `.github/prompts/orbit-<id>.prompt.md` |
| iFlow | `iflow` | `.iflow/skills/` | `.iflow/commands/orbit-<id>.md` |
| Junie | `junie` | `.junie/skills/` | `.junie/commands/orbit-<id>.md` |
| Kilo Code | `kilocode` | `.kilocode/skills/` | `.kilocode/workflows/orbit-<id>.md` |
| Kiro | `kiro` | `.kiro/skills/` | `.kiro/prompts/orbit-<id>.prompt.md` |
| Lingma | `lingma` | `.lingma/skills/` | `.lingma/commands/orbit/<id>.md` |
| OpenCode | `opencode` | `.opencode/skills/` | `.opencode/commands/orbit-<id>.md` |
| Pi | `pi` | `.pi/skills/` | `.pi/prompts/orbit-<id>.md` |
| Qoder | `qoder` | `.qoder/skills/` | `.qoder/commands/orbit/<id>.md` |
| Qwen Code | `qwen` | `.qwen/skills/` | `.qwen/commands/orbit-<id>.toml` |
| RooCode | `roocode` | `.roo/skills/` | `.roo/commands/orbit-<id>.md` |
| Trae | `trae` | `.trae/skills/` | none: invoke the skills |
| Windsurf | `windsurf` | `.windsurf/skills/` | `.windsurf/workflows/orbit-<id>.md` |

Each skills directory holds one `orbit-<workflow>/` directory per workflow, as in tier 1. The CoStrict command
directory keeps the name its 1.3.1 adapter gave it, the name of the tool orbit was forked from.

Carried by: the 1.3.1 baseline, `orbit-skill-generation`

## Choosing tools

Run interactively, `orbit init` asks which tools to set up and pre-selects the ones it finds in the project. To choose
without a prompt, name them:

```bash
orbit init --tools claude
orbit init --tools claude,codex
orbit init --tools all
orbit init --tools none
```

`all` installs every tool on this page; `none` sets up the `orbit/` directory and installs no tool. A tool added
later is installed by running `orbit init --tools <id>` again; `orbit update` refreshes the tools already installed.

Carried by: the 1.3.1 baseline

## Related

- [Installation](installation.md)
- [Commands](commands.md)
- [CLI](cli.md)
