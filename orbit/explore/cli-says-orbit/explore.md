> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: cli-says-orbit

## Premise

Stage `cli-says-orbit` of `refine-documentation-and-architect`: the CLI's user-visible strings say orbit (G2),
leaving R-rda-3's protections (`.openspec.yaml`, data-format tags, the global config directory, legacy-OpenSpec
detection) as they are. Issue #24 §1 estimates about 27 strings. Exit criteria: a test over the CLI's user-visible
strings fails on an unprotected `OpenSpec`; `orbit init` in a scratch project prints no OpenSpec; the change is
archived.

Measured 2026-10-14 (`grep -rn OpenSpec src --include='*.ts'`: 106 lines, 46 of them comment lines): 60 non-comment
lines. (A first count gave 59 because its comment filter also dropped `explore.ts:76`, a body line that starts with `**`.)
Sorted by surface:

| class | where | count | proposed disposition |
|---|---|---|---|
| console / spinner output | `src/ui/welcome-screen.ts:20`, `src/core/init.ts:370,515,530,717`, `src/core/view.ts:16` | 6 | rename |
| errors naming the project dir | `src/core/archive.ts:64`, `src/core/list.ts:88`, `src/core/update.ts:104` | 3 | rename (D-cso-4) |
| `--help` descriptions | `src/cli/program.ts:77,140,191,491`, `src/commands/spec.ts:115`, `src/commands/config.ts:89,215` | 7 | rename |
| completion-registry descriptions (a second copy of `--help`) | `src/core/completions/command-registry.ts:38,61,202,249,302,341` | 6 | rename, alongside `--help` |
| completion script headers | `src/core/completions/generators/{bash,zsh,fish}-generator.ts` | 3 | rename (a comment in a generated file) |
| comment lines written into, or printed for, the user's rc files | `bash-installer.ts:104,317`, `zsh-installer.ts:108` | 3 | rename (D-cso-3) |
| rc-file block markers `# OPENSPEC:START/END` | bash and zsh installers, lines 18-19 | (uppercase, not in the 60) | keep: removal detection reads them |
| completion prompts and messages | `src/commands/completion.ts:227`, `zsh-installer.ts:441` | 2 | rename |
| feedback footer | `src/commands/feedback.ts:68` "Submitted via OpenSpec CLI" | 1 | rename |
| legacy-upgrade banner | `src/core/legacy-cleanup.ts:549,551,646` "Upgrading to the new OpenSpec" | 3 | rename: the user is upgrading TO orbit |
| legacy-upgrade, naming OpenSpec's own artefacts | `legacy-cleanup.ts:454,524,569` "OpenSpec markers" | 3 | keep: the markers are OpenSpec's |
| the init warning about an `openspec/` dir | `src/core/init.ts:103` (R-ugd-11) | 1 | keep: legacy detection |
| identifiers, not strings | `hasOpenSpecMarkers`, `isOnlyOpenSpecContent`, `OpenSpecConfig`, `OPENSPEC_NO_AUTO_CONFIG` | 5 | out: not user-visible (the env var is open: Q-cso-4) |
| generated skill descriptions and bodies | `src/core/templates/workflows/*.ts` (17 lines, 8 files) | 17 | 14 rename, 3 keep (D-cso-1) |

Outside `src/`, the package ships `schemas/`, `bin/` and `scripts/postinstall.js` (package.json `files`). One more
string is there: `schemas/spec-driven/schema.yaml:3`, "Default OpenSpec workflow - proposal → specs → design → tasks",
the schema's description. `bin/` and `postinstall.js` have none. `scripts/test-postinstall.sh:9` has one, but that file
is not shipped.

The PowerShell installer already says "Orbit shell completions configuration": one installer was renamed at the fork
and the other two were not.

Tests quoting the strings: `test/cli-e2e/basic.test.ts` (3x "OpenSpec Setup Complete"), `test/core/archive.test.ts`,
`test/core/list.test.ts`, `test/core/update.test.ts` (the three errors), and the completion generator and installer
tests (the fixture description 'Initialize OpenSpec'). No user doc quotes any of these strings (grep over `README.md`
and `docs/`).

## Mechanism

### D-cso-2 — an `OpenSpec` in a user-visible string is residue unless admitted
Domain: every path by which shipped text reaches a user's screen or files
| member | covered by |
|---|---|
| console and spinner output (`init`, `view`, the welcome screen, legacy upgrade) | source scan over `src/` |
| thrown errors | source scan over `src/` |
| `--help` descriptions (commander, `program.ts` and `src/commands/*`) | source scan; runtime `--help` check |
| completion-registry descriptions (the second copy of `--help`) | source scan over `src/core/completions/` |
| generated completion scripts and rc-file text | source scan over the generators and installers |
| generated skill and command bodies | source scan over `src/core/templates/`, admitted list for the fork base |
| schema text shown by the CLI | source scan over `schemas/` (Case 1) |
| the feedback issue body | source scan over `src/commands/feedback.ts` |
| `bin/` and `scripts/postinstall.js` | source scan (none today) |
Closure: BOUNDED — the scan is SOURCED over the package's `files` list, but text can reach the screen without appearing in any shipped file as the literal word
Residual kind: user-visible text that is not a literal `OpenSpec` in a shipped file: a string assembled from parts, output of a dependency, or lowercase prose "openspec" (the scan matches the product-name forms `OpenSpec`/`Openspec`; lowercase is overwhelmingly the protected paths, tags and identifiers)
Residual method: the runtime check (`orbit init` in a scratch dir, `--help` for every command) asserting stdout free of the word in any case; and a lowercase grep for command-form prose (`openspec <verb>`), which returned nothing on 2026-10-14
Moves:
- READ: applied — every member read at a cited line in the Premise table; the two removers read for D-cso-3; `files` read from package.json
- ENUMERATE: applied — this table; package.json `files` named the members outside `src/` (Case 1)
- COHERE: applied — the admitted reasons (OpenSpec's own artefact, the fork base, an identifier) are disjoint from the rename rows, and the same list serves both the scan and D-cso-1's three kept template lines
- EXECUTE: applied — the grep the scan formalizes ran over `src/` (60 non-comment lines, each classified) and over `schemas`/`bin`/`scripts`
- FALSIFY: applied — a scan of `src/` alone passes with the schema description still saying OpenSpec (Case 1), so the domain is the shipped package, not `src/`
- CONFORM: applied — R-rda-3's protections are admitted reasons, not exceptions coded ad hoc; D14's named-delta rule governs the orbit-modified bodies (D-cso-1)
- FEASIBILITY: not applied — one scan over about 300 files, the shape of the docs residue check
- CONSUME: applied — the e2e asserts, three error tests, the installer tests and the generator fixtures quote the old strings and must follow (Premise); `test/core/templates/skill-templates-parity.test.ts` hash-pins the edited bodies
- INVOKE: applied — runs in `npm test`, so CI fires it on every push
### Case 1 — the schema description sits outside `src/`
`schemas/spec-driven/schema.yaml:3` says "Default OpenSpec workflow". `schemas/` is in package.json `files`, so it ships, and `orbit schemas` prints the line (run 2026-10-14).
A scan of `src/**/*.ts` alone would pass with it in place. This was found by enumerating `files`, not by the first grep.

## Decisions

- **2026-10-14 — D-cso-1: generated skill descriptions and the body sentences that name the tool are in scope** (Sal,
  settling Q-cso-1). A user sees skill descriptions in Claude's skill listing, so G2 reaches them. The stage charter
  widens from "the CLI's strings" to "what orbit says to users". 14 lines are renamed:
  `new-change.ts:12`, `ff-change.ts:13`, `continue-change.ts:12`, `apply-change.ts:12,13,224`,
  `explore.ts:76,140,142,343`, `review.ts:398,791,1079,1080`. Three are kept: `onboard.ts:46` names the
  `@fission-ai/openspec@1.3.1` fork base on purpose, and `feedback.ts:12,13` belong to a template that is never
  generated (`orbit-conventions`' `Generated-file disposition`, "Not generated"; no feedback skill installs).
  Of the edited bodies, review is orbit-authored and edited freely. Explore, apply-change, new-change, ff-change and
  continue-change are orbit-modified, so each edit to their upstream portion lands in place and is NAMED in the
  change's delta spec, per the same requirement's orbit-modified scenario.
  Kind: scope
- **2026-10-14 — D-cso-2: an `OpenSpec` in a user-visible string is residue unless an admitted entry names its reason**
  (method, settling Q-cso-2). Two checks enforce it. The G2 test is a SOURCE scan over what the package ships:
  the string literals of `src/**/*.ts` (which build to `dist/`) with comments excluded, plus `schemas/`, `bin/` and
  `scripts/postinstall.js`. It checks them against an admitted list keyed by file and reason. It catches error and legacy
  branches no e2e test runs. The init exit criterion is a RUNTIME check: `orbit init` in a scratch dir and
  `--help` for every command, stdout free of OpenSpec. `test/cli-e2e/basic.test.ts`'s three "OpenSpec Setup
  Complete" asserts become that check. The admitted reasons: the occurrence names OpenSpec's own artefact (the legacy
  markers, an `openspec/` directory); it names the fork base; or it is an identifier, not a string.
  Kind: rule
- **2026-10-14 — D-cso-3: the rc-file comment is renamed and the markers are kept** (method, settling Q-cso-3). bash
  and zsh write "# OpenSpec shell completions configuration" and print "# Source OpenSpec completions". Both become
  "Orbit", matching `powershell-installer.ts:154`. Read before deciding: both removers key only on
  `# OPENSPEC:START`/`END`. That is zsh's `hasZshrcConfig` and bash's `removeBashrcConfig`, the latter by
  `line.trim() ===` the marker. So a block written under the old comment is still found and replaced.
  Kind: scope
- **2026-10-14 — D-cso-4: the three directory errors name the directory they looked for** (method, settling Q-cso-5).
  `update.ts:104` → "No orbit/ directory found. Run 'orbit init' first."; `archive.ts:64` and `list.ts:88` →
  "No orbit/changes/ directory found. Run 'orbit init' first." The tests at `archive.test.ts:781`,
  `list.test.ts:38` and `update.test.ts:80` follow.
  Kind: scope

## Open questions

- **Q-cso-4 — `OPENSPEC_NO_AUTO_CONFIG`.** A user sets this env var, and the name is documented nowhere in orbit's
  docs. Renaming it would break anyone who set it.
  Standing recommendation: out. It is an identifier the user types, so it sits in R-ugd-3's protected class.

## Considered & out

## References

- Issue #24 (las-sal/orbit-spec), §1: the original list and suggested scope.
- `orbit/architecture/refine-documentation-and-architect.md`: R-rda-3 (protections), G2, the stage charter.
- `test/helpers/user-docs.ts` (`ADMITTED_IDENTIFIERS`, `residueFailures`): the docs residue check, a model for the
  G2 source scan.
- `test/core/start-surfaces.test.ts`: the architect-first stage's surface test, the sibling instrument.
- `src/core/completions/installers/powershell-installer.ts:154`: the one installer already renamed.
