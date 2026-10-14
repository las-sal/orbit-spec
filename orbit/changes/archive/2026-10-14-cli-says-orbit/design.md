## Context

orbit is a fork that kept upstream's voice in its CLI. `orbit init` ends with "OpenSpec Setup Complete", six `--help`
descriptions call the commands OpenSpec's, and five skill descriptions say "an OpenSpec change". R-ugd-3 held the
code rename out of the docs program. R-rda-3 now scopes it and keeps four protections: `.openspec.yaml`, data-format
tags, the global config directory and legacy-OpenSpec detection.

The exploration measured the surface (explore.md, Premise): 60 non-comment lines in `src/` name `OpenSpec`, and one
more is in the shipped `schemas/`. A throwaway probe at propose ran the scan D-cso-2 describes: the TypeScript AST,
string literals and template parts only. It found 55 occurrences. That is the 60 less the five identifier lines, so it
matches the exploration's classification line for line. Help text and `orbit init --tools claude` in a scratch
project were probed too. Help names OpenSpec in six descriptions and in `OPENSPEC_CONCURRENCY`; `init` prints three
lines with "OpenSpec".

## Goals / Non-Goals

**Goals:**
- G2 (R-rda-4): no user-visible string in the shipped package says OpenSpec outside R-ugd-3's protections, and a test
  that fails on one.
- The stage's init exit: `orbit init` in a scratch project prints no OpenSpec.
- The skills a Claude user sees describe orbit (D-cso-1).

**Non-Goals:**
- The docs (stage `docs-refinement`). No user doc quotes any string this change edits.
- R-rda-3's protections, the two `OPENSPEC_*` environment variables (D-cso-5), and code identifiers and comments.
- Test fixtures that use "Initialize OpenSpec" as an input description (the completion generator tests). They are
  not shipped, and the scan reads only what ships.
- `orbit-review-external`'s quoted prompt. Its requirement keeps only the named sections and the output block
  verbatim and lets the implementer adjust phrasing, so the template's "an orbit change" leaves it true.

## Decisions

**1. The renamed strings.** These are the source-scan rows the exploration classified as rename. The house style is
lower-case `orbit`, even at the start of a line, as the README writes it. Headings are the exception: they are title
case, as the bodies' existing `# Orbit additions` sections are, so explore's heading becomes `## Orbit Awareness`.

| where | today | becomes |
|---|---|---|
| `src/ui/welcome-screen.ts` | Welcome to OpenSpec | Welcome to orbit |
| `src/core/init.ts` | Creating OpenSpec structure... / OpenSpec structure created / OpenSpec configured: … / OpenSpec Setup Complete | Creating orbit structure... / orbit structure created / orbit configured: … / orbit Setup Complete |
| `src/core/view.ts` | OpenSpec Dashboard | orbit Dashboard |
| `src/core/update.ts` | No OpenSpec directory found. | No orbit/ directory found. (D-cso-4) |
| `src/core/archive.ts`, `src/core/list.ts` | No OpenSpec changes directory found. | No orbit/changes/ directory found. (D-cso-4) |
| `src/cli/program.ts` and `command-registry.ts` | Initialize OpenSpec in your project / Update OpenSpec instruction files / Manage OpenSpec change proposals / Manage shell completions for OpenSpec CLI | Initialize orbit in your project / Update orbit instruction files / Manage orbit change proposals / Manage shell completions for the orbit CLI |
| `src/commands/spec.ts`, `command-registry.ts` | Manage and view OpenSpec specifications / Manage OpenSpec specifications | Manage and view orbit specifications / Manage orbit specifications |
| `src/commands/config.ts`, `command-registry.ts` | View and modify global OpenSpec configuration / Guided onboarding flow for OpenSpec | View and modify global orbit configuration / Guided onboarding flow for orbit |
| the completion generators | # Bash/Zsh/Fish completion script for OpenSpec CLI | … for the orbit CLI |
| bash and zsh installers | # OpenSpec shell completions configuration / # Source OpenSpec completions / Removed OpenSpec configuration from ~/.zshrc | # Orbit shell completions configuration (PowerShell's, D-cso-3) / # Source orbit completions / Removed orbit configuration from ~/.zshrc |
| `src/commands/completion.ts` | Remove OpenSpec configuration from … | Remove orbit configuration from … |
| `src/commands/feedback.ts` | Submitted via OpenSpec CLI | Submitted via the orbit CLI |
| `src/core/legacy-cleanup.ts` | Upgrading to the new OpenSpec / OpenSpec now uses agent skills … / included in every OpenSpec request | Upgrading to orbit / orbit uses agent skills … / included in every orbit request |
| `schemas/spec-driven/schema.yaml` | Default OpenSpec workflow - … | Default orbit workflow - … |
| `build.js` (run by `prepare` in a git install) | 🔨 Building OpenSpec... | 🔨 Building orbit... |
| the six templates | per the requirement's named-edit table, and `review.ts`' four "an OpenSpec change" | "an orbit change" |
| the 13 launcher commands (system walk, Sal: C) | upstream openspec behavior plus orbit's additions | upstream behavior plus orbit's additions |

The registry keeps its "(deprecated)" suffix on `change`. `orbit-cli-grammar`'s registry check does not compare
descriptions (prose), and syncing the suffix is outside this change.

**2. The source scan reads the TypeScript AST, not lines (D-cso-2).** `ts.createSourceFile` reads each `src/**/*.ts`
file. The scan reads `StringLiteral`, `NoSubstitutionTemplateLiteral` and the head and spans of a
`TemplateExpression`, and maps each line of their text back to its source line. A line grep cannot tell a comment
from a markdown `*` bullet inside a template body; the exploration's first count lost `explore.ts:76` that way. The
non-TS files (`schemas/`, `bin/`, `scripts/postinstall.js`, and `build.js`, which a git install runs) are read line
by line, since everything in them can reach a user. npm always ships `README.md`, `LICENSE` and `package.json`.
The scan does not read them, and the requirement's table says who holds each: the docs residue check, the MIT notice
and the fork-base description. The pattern is case-sensitive `OpenSpec|Openspec`. Lowercase `openspec` is overwhelmingly the
protected names, and the runtime check catches the rest (the named limit).

**3. The admitted list is exact, keyed by file and line substring, with a reason from a closed set.** Today it has
six entries, admitting seven occurrences:
- `legacy-cleanup.ts`, three entries: "Removed OpenSpec markers", "removing OpenSpec markers" and "OpenSpec markers
  will be removed". Reason: OpenSpec's own artefact.
- `init.ts`, "an OpenSpec project directory". Reason: OpenSpec's own artefact (R-ugd-11's warning).
- `onboard.ts`, "upstream OpenSpec". Reason: the fork base.
- `feedback.ts` (template), "feedback about OpenSpec". Reason: never generated; it admits both lines.

An entry admits only the occurrences inside a match of its substring, so a second
`OpenSpec` on the same line is still residue (the external pass's same-line case). An entry that admits nothing fails as stale, as the docs' pending-rewrite list does. This keeps the list from
carrying admissions for strings that have already gone.

**4. The runtime check reads help from the builder and `init` from the e2e harness.** Help:
- Recurse over `buildProgram()`'s visible commands and render each with commander's `helpInformation()`.
- Hidden commands are skipped. `orbit-cli-grammar` excludes them from completion for the same reason.
- This reads every subcommand in-process, without spawning a process per command. A wrapped help column never splits
  the word.

Init:
- `test/cli-e2e/basic.test.ts`'s three init cases assert "orbit Setup Complete".
- The `--tools claude` case also asserts no case-insensitive `openspec` in stdout.
- The welcome screen runs only interactively, so the source scan holds it alone.

**5. The helper and the test.** `test/helpers/cli-name.ts` exports the admitted list and the scan as pure functions.
The tests call the scan both over fixtures, to show it can fail, and over the real package, which must pass empty.
`test/core/cli-name.test.ts` carries the scenarios. This is the shape of `test/helpers/user-docs.ts` and
`test/core/user-docs/residue.test.ts`.

**6. `orbit-review`'s Purpose is edited in place at apply.** It reads "editorial review of an OpenSpec change". No
delta carries a Purpose.

### Alternatives considered

- **A runtime check alone.** It reads only the paths it runs: no error branch, no legacy upgrade, no interactive
  welcome screen. Rejected in the exploration (D-cso-2).
- **A scan of `src/` alone.** It passes with the schema description still saying OpenSpec, which `orbit schemas`
  prints (D-cso-2, Case 1).
- **Renaming the `OPENSPEC_*` environment variables.** That silently breaks anyone who set them (D-cso-5).
- **Renaming the rc-file markers.** Detection keys on them, so existing blocks would be orphaned (D-cso-3).
- **Leaving the generated skills as upstream wrote them.** Sal ruled them in (D-cso-1).

## Mechanism → artifacts

The proposing AI's reading of the file; no engine record.

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-cso-1 | — | scope | not carried |
| D-cso-2 | BOUNDED | live rule | `orbit-cli-name` / `The old name appears in what the package ships only for an admitted reason`, as a normative TABLE (the shipped-file members, and the admitted reasons); residual named in the requirement |
| D-cso-3 | — | scope | not carried |
| D-cso-4 | — | scope | not carried |
| D-cso-5 | — | scope | not carried |

## Risks / Trade-offs

- **D-cso-2's residual** → its named limit lives in `orbit-cli-name`'s `The old name appears in what the package ships
  only for an admitted reason`.
- **Existing rc-file blocks keep the old comment** until the next `orbit completion install`. That rewrites the block
  between the unchanged markers, so nothing is orphaned. The cost is cosmetic.
- **Adopters' generated skills change on their next `orbit update`.** The descriptions change and the behaviour does
  not.
- **Pinned template hashes move** (`skill-templates-parity`). This is expected, and apply re-pins them as the
  deliberate act the pin exists for.
- **The orbit-modified bodies' upstream portions gain edits.** A future upstream cherry-pick into these sentences
  conflicts on the word. The requirement's named-edit table is where a cherry-pick finds them.

## Touchpoints

- `src/ui/welcome-screen.ts` — the title.
- `src/core/init.ts` — spinners and the closing banner.
- `src/core/view.ts` — the dashboard title.
- `src/core/update.ts` + `src/core/archive.ts` + `src/core/list.ts` — the directory errors.
- `src/cli/program.ts` + `src/commands/spec.ts` + `src/commands/config.ts` — help descriptions.
- `src/core/completions/command-registry.ts` — the registry's copy of the descriptions.
- `src/core/completions/generators/` — script headers.
- `src/core/completions/installers/` — the rc-file comment and messages.
- `src/commands/completion.ts` + `src/commands/feedback.ts` — the uninstall prompt and the feedback footer.
- `src/core/legacy-cleanup.ts` — the upgrade banner.
- `src/core/templates/workflows/*.ts` — the six templates' sentences, and the 13 launchers' shared sentence.
- `schemas/spec-driven/schema.yaml` — the description.
- `build.js` — the build banner a git install prints.
- `test/helpers/cli-name.ts` + `test/core/cli-name.test.ts` — the scan, the admitted list, the runtime help check.
- `test/cli-e2e/basic.test.ts` — the init asserts.
- `test/core/` — the error, installer and pinned-hash tests that quote old strings.
- `orbit/specs/orbit-review/spec.md` — the Purpose, edited in place at apply.
- `CLAUDE.md` — line 17's Tier-C list, which still keeps branding prose.
