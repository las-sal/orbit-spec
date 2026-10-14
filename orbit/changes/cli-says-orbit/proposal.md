## Why

orbit still introduces itself as OpenSpec. `orbit init` prints "Creating OpenSpec structure...", "OpenSpec structure
created" and "OpenSpec Setup Complete". `orbit --help` describes six commands as OpenSpec's, and Claude's skill list
shows "Start a new OpenSpec change". R-ugd-3 kept the code-level rename out of the docs program, and issue #24 §1
collects what is left. Stage `refine-documentation-and-architect › cli-says-orbit` (G2) makes those strings say orbit
and adds a test so they stay that way. The exploration measured the surface and settled scope on Sal's word: see
explore.md, D-cso-1 to D-cso-5.

## What Changes

- **The CLI's own strings say orbit.** A string-literal scan of `src/` finds 55 user-visible occurrences, and 48 of
  them are renamed:
  - The console and spinner output of `init`, `view` and the welcome screen.
  - The three directory errors. Each now names the directory it looked for (D-cso-4): "No orbit/ directory found."
    and "No orbit/changes/ directory found."
  - The `--help` descriptions in `src/cli/program.ts`, `src/commands/spec.ts` and `src/commands/config.ts`, and
    their second copy in the completion registry.
  - The completion script headers, the bash and zsh rc-file comment, which becomes "Orbit", matching PowerShell
    (D-cso-3), and the completion uninstall messages.
  - The feedback issue footer.
  - The legacy-upgrade banner. A user arriving from old OpenSpec is upgrading to orbit.
- **The generated skills say orbit** (D-cso-1, Sal). The skill descriptions, and the body sentences that name the
  tool, are renamed in 14 lines across six templates: explore, apply-change (its skill and its command launcher),
  new-change, ff-change, continue-change and review.
  - Review is orbit-authored and is edited freely.
  - The other five are orbit-modified. Each edit to their upstream portion is a named edit, listed in the new
    requirement per `orbit-conventions`' `Generated-file disposition`.
  - Three lines stay. One is in the onboard body, which names upstream OpenSpec as the fork base. Two are in the
    feedback template, which is never generated.
- **The schema's description says orbit.** `schemas/spec-driven/schema.yaml` ships, and `orbit schemas` prints
  "Default OpenSpec workflow". The exploration found it by listing package.json's `files`, not by grepping `src/`.
- **Kept, by R-rda-3's protections:**
  - The `OPENSPEC:START/END` rc-file markers, which the completion removers detect.
  - The legacy lines that name OpenSpec's own markers.
  - `orbit init`'s warning about an `openspec/` directory.
  - The `OPENSPEC_NO_AUTO_CONFIG` and `OPENSPEC_CONCURRENCY` environment variables (D-cso-5). The second is named
    in `validate --help` and keeps its name.
- **A test holds it.** A new capability, `orbit-cli-name`, states that the old name appears in what the package
  ships only for an admitted reason. Two checks enforce it (D-cso-2):
  - A source scan over the string literals of `src/`, the shipped `schemas/`, `bin/` and `scripts/postinstall.js`,
    and `build.js`, which a git install runs, against an exact admitted list. Each entry admits only the occurrence
    inside its substring.
  - A runtime check: every command's help, read from the CLI's builder, and `orbit init` in a scratch project.
  `test/cli-e2e/basic.test.ts`'s three "OpenSpec Setup Complete" asserts become orbit's.

Out of scope:
- The docs (stage `docs-refinement`). No user doc quotes any of these strings.
- `.openspec.yaml`, data-format tags, the global config directory and legacy-OpenSpec detection (R-rda-3).
- Code identifiers and comments.

## Capabilities

### New Capabilities

- `orbit-cli-name`: the old upstream name in what the package ships. It is renamed to orbit everywhere a user reads
  it, except for an admitted reason, and held by a source scan and a runtime check. The requirement also names the
  in-place edits to the orbit-modified skill bodies.

### Modified Capabilities

(none). `orbit-review`'s Purpose line, "editorial review of an OpenSpec change", is edited in place at apply. The
external review prompt that `orbit-review-external` quotes says "an OpenSpec change". That requirement lets the
implementer adjust phrasing and keeps only its named sections and output block verbatim, so the template's rename
leaves it true and it is not carried.

## Impact

- `src/`: about 20 files of string edits. One new test file and its admitted list under `test/`.
- `schemas/spec-driven/schema.yaml`: one description line.
- `build.js`: the "Building OpenSpec..." banner that a git install prints when it runs `prepare`.
- `CLAUDE.md`: line 17 no longer lists branding prose as kept.
- Tests that quote old strings follow: `test/cli-e2e/basic.test.ts`, `test/core/{archive,list,update}.test.ts`,
  `test/core/legacy-cleanup.test.ts`, `test/commands/{config,feedback}.test.ts`,
  `test/core/completions/installers/{bash,zsh}-installer.test.ts` and the three generator tests' header asserts. The hash pins in
  `test/core/templates/skill-templates-parity.test.ts` move for the edited bodies.
- The generated `.claude/` surface refreshes with `orbit update --force`. Adopters see the new descriptions on
  their next `orbit update`.
- A completion block already in a user's `~/.zshrc` or `~/.bashrc` keeps its old comment until the next
  `orbit completion install`, which rewrites the block between the unchanged markers.
