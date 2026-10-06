## ADDED Requirements

### Requirement: The external runner is recorded in the per-user global config

The system SHALL store the user's external runner as an optional `externalRunner` field of the per-user global
config (`getGlobalConfigPath()`, the XDG config directory's `config.json`, beside `profile` and `delivery`), registered
among the config schema's known top-level keys so `orbit config` reads and writes it without `--allow-unknown`. The
config key-path rule SHALL admit exactly one nested path under it, `externalRunner.preset` (an own argv is an array,
which `config set` cannot write); every other nested path under it is refused as today. The record's shape (per `The
runner record is a preset name or an argv array, never a shell string`) SHALL be part of the whole-config validation
`orbit config set` already runs before writing, so a `set` whose result is a refused shape — `externalRunner.preset`
set over a recorded `{argv}`, which the merge would leave holding both keys — is refused with a message naming
`orbit config unset externalRunner` as the step before switching forms. A record that a hand edit has already made
malformed fails that validation the same way on any later `set`, until it is unset or edited.

The engine SHALL read the record and SHALL NEVER execute it: `orbit external runner` prints the RESOLVED record, and
`--json` prints it as ONE object on standard output, every warning going to standard error. The object is exactly one
of these shapes (`name` is the preset's name, or the basename of `argv[0]` for an own argv; `reachable` says whether
`argv[0]` resolves on `PATH`):

```json
{"runner": null}
{"runner": {"form": "preset", "name": "codex", "argv": ["codex", "exec", "-C", "{worktree}", "-s", "read-only", "-o", "{output}", "-"], "reachable": true}}
{"runner": {"form": "argv", "name": "my-reviewer", "argv": ["/opt/tools/my-reviewer", "--out", "{output}"], "reachable": false}}
```

`{"runner": null}` is `none`. Resolution never fails the command: every missing or bad state resolves to `none`, with
a warning naming the cause where there is one.

The record's surfaces and its fallback states are this table:

| member | covered by |
|---|---|
| where it is stored | the optional `externalRunner` field in the per-user global config, registered as a known top-level key |
| who writes it | `orbit init` and `orbit config` (per `The runner record is written by init and edited by orbit config`) |
| who reads it | the engine, printing the resolved form through `orbit external runner [--json]` |
| who executes it | the review body's external branch, under the user's `--reviewer external` (per `orbit-review-external`); never the engine |
| the field absent | `none` |
| the field malformed (the refused shapes of `The runner record is a preset name or an argv array, never a shell string`) | a warning naming the field and the reason; resolves to `none`, as the `pr:` scalar's inert values do |
| the global file is invalid JSON | `getGlobalConfig()`'s existing fallback to defaults, with its warning; `none` |

Closure: the record's path is store, write, read and execute, each a row, plus the three ways the record can be
missing or bad (D-rc17d-3). The record is read through its own command rather than `orbit status --json`, whose bare
and `--full` key sets `orbit-orientation` enumerates.

#### Scenario: A preset record resolves to its argv

- **WHEN** the global config holds `"externalRunner": {"preset": "codex"}` and `codex` resolves on `PATH`
- **THEN** `orbit external runner --json` prints `{"runner": {"form": "preset", "name": "codex", "argv": […], "reachable": true}}`, the argv carrying its `{worktree}` and `{output}` placeholders, and executes nothing

#### Scenario: No record resolves to none

- **WHEN** the global config has no `externalRunner` field
- **THEN** `orbit external runner --json` prints `{"runner": null}` and no warning

#### Scenario: A malformed record warns and resolves to none

- **WHEN** the field is a string, or an object carrying both `preset` and `argv`
- **THEN** the command warns on standard error, naming the field and the reason, and prints `{"runner": null}` on standard output

#### Scenario: orbit config accepts the key

- **WHEN** the user runs `orbit config set externalRunner.preset codex`
- **THEN** the value is written without `--allow-unknown`, because `externalRunner` is a known top-level key and `externalRunner.preset` its one admitted nested path

#### Scenario: Switching from an own argv to the preset needs an unset first

- **WHEN** the record is `{"argv": ["my-reviewer", "{output}"]}` and the user runs `orbit config set externalRunner.preset codex`
- **THEN** the set is refused, because the merged record would carry both keys, and the message names `orbit config unset externalRunner`; the record is unchanged

### Requirement: A runner is used only through the user's record

The system SHALL launch an external runner ONLY through the user's `externalRunner` record. A runner present on
`PATH` with nothing recorded SHALL NOT be launched by anything; `PATH` is read in exactly two places — `orbit init`'s
setup step, to decide whether to OFFER the Codex preset, and the `reachable` field of the resolved record — and
neither reads it to decide what runs. A runner named in any committed per-repository file is never read, because
cloning a repository must not make the cloner's AI run the repository's command.

| member | covered by |
|---|---|
| the user records the Codex preset | the engine resolves it to the argv in orbit's source |
| the user records an argv of their own | used as recorded, under the shape requirement's contract |
| the user records nothing | no runner: the review's external branch is today's handoff |
| a runner binary is on `PATH` with nothing recorded | NOT a record: nothing launches; init may OFFER the preset because it is present |
| a recorded runner later removed or broken | `reachable: false`, or a failed run (per `orbit-review-external`) |
| a runner named in a committed per-repository file | never read |

Closure: a runner is used only through the record, so the members are the record's three states plus the three
unrecorded-world states (D-rc17d-2).

#### Scenario: A runner on PATH is never launched without a record

- **WHEN** `codex` resolves on `PATH`, the global config has no `externalRunner` field, and the user runs `/orbit:review <change> --as system --reviewer external`
- **THEN** nothing is launched; `orbit external runner --json` prints `none`, and the external branch prints the prompt for paste as it does today

### Requirement: The runner record is a preset name or an argv array, never a shell string

The `externalRunner` value SHALL be exactly one of `{preset: <name>}` or `{argv: [<string>, …]}`. The prompt SHALL
always reach the runner on its standard input, byte for byte; the runner's return SHALL be written to the path
substituted for `{output}`; `{worktree}`, when present, is substituted with the launch's worktree path. The record is
never parsed by a shell: it is an array, each element becomes exactly one argument, and how the launch keeps it so is
`orbit-review-external`'s `A recorded runner launches the external review`. The only preset is `codex`, resolved to `codex exec -C {worktree} -s read-only -o {output} -`, the
argv held in orbit's source; it passes no model flag, so the user's own Codex configuration chooses the model.

| member | covered by |
|---|---|
| `{preset: "codex"}` | resolved to the preset argv above |
| `{argv: [...]}` containing `{output}` as an element or within one | used as recorded, `{worktree}` and `{output}` substituted |
| `{argv: [...]}` without `{output}` | malformed: the return would have nowhere to land |
| `{argv: []}`, or an element that is not a string | malformed |
| a string (a shell command line) | malformed: the record is never parsed by a shell |
| an unknown preset name, both keys, neither key, or a key beside them | malformed |

Closure: the field's type is `{preset}` or `{argv}`, and every value is one of these rows (D-rc17d-5).

#### Scenario: An own argv without an output placeholder is refused

- **WHEN** the record is `{"argv": ["my-reviewer", "--read-only"]}`
- **THEN** `orbit external runner` warns that the argv carries no `{output}` and resolves to `none`

#### Scenario: The Codex preset passes no model flag

- **WHEN** the record is `{"preset": "codex"}`
- **THEN** the resolved argv carries no `-m` or model-configuration argument

### Requirement: The runner record is written by init and edited by orbit config

The system SHALL let the user write the record in two places. `orbit init`, when interactive (the same predicate
init uses for its other prompts), SHALL carry ONE setup step that explains, in its own output, what an external
runner is (another AI that reviews a change from a packaged prompt, launched by orbit only because the user recorded
it) and offers three choices — the Codex preset (offered only when `codex` resolves on `PATH`), an own argv, or none.
An own argv is entered as ONE JSON array typed at a single prompt (never a command line orbit would split), checked
against the shape table before it is written; a refused value names the reason and asks again. When a well-formed
record is present the step shows it and the default answer keeps it; when a malformed one is present the step shows
it with its warning and offers the same three choices, none of which keeps it. `orbit config` edits it afterwards.

| member | covered by |
|---|---|
| `orbit init`, interactive, no record | the setup step; the chosen answer is written, `none` writes nothing |
| `orbit init`, interactive, a well-formed record present | shows the current record; the default keeps it |
| `orbit init`, interactive, a malformed record present | shows it with its warning; the three choices, none keeping it |
| an own argv typed at init | one JSON array, checked against the shape table; a refused value asks again |
| `orbit init`, not interactive | no prompt; the record is untouched |
| `orbit config set externalRunner.preset codex` | records the preset (`config set` coerces scalars only); refused over a recorded argv, naming the unset |
| an own argv | init's step, or `orbit config edit`; `config set` cannot write an array |
| `orbit config unset externalRunner` | back to `none` |

Closure: two writers (init, config) by their modes; every mode is a row (D-rc17d-4). The setup note lives in init's
output, so the onboarding body carries no copy of it.

#### Scenario: Interactive init offers the preset when codex is present

- **WHEN** `orbit init` runs interactively, no record exists, and `codex` resolves on `PATH`
- **THEN** the setup step explains the runner and offers the Codex preset, an own argv, or none; choosing the preset writes `{"preset": "codex"}`

#### Scenario: Non-interactive init leaves the record alone

- **WHEN** `orbit init --tools claude` runs non-interactively with a record present
- **THEN** no setup prompt is shown and the record is unchanged

### Requirement: The engine saves an external return into the trail

The system SHALL provide `orbit external save <change> --as <proposal|system> --from <path> [--launch <token>]
[--json]`, which writes an external AI's raw return into the change's trail. The trail file must OPEN with its
`# External Review:` heading because the walk routes a `--from-file` source by its leading token
(`orbit-address-reviews`); the trail reader and the renderer would tolerate text above it, the walk would not. The
command SHALL, in order:

1. read `--from` — a missing or unreadable file is refused;
2. drop a leading byte-order mark;
3. find the first line OUTSIDE every fenced block, by the engine's shared CommonMark fence tracker, that begins with
   `# External Review:` — none is refused, so a preamble that leaves a fence open never cuts inside it;
4. refuse that heading when it does not name `<change>` (`# External Review: <change> (`);
5. remove only the lines before it and keep every byte from that line on unchanged;
6. check the result with the trail reader that decides whether a return is an accepted pass, and refuse a result it
   rejects;
7. with `--launch <token>` (the launch's T0 token), refuse when any `apply-*.json` on the trail carries a later
   token — the return reviewed a state an apply has since changed, and the freshness rule would otherwise count it as
   current; without `--launch` no such check runs;
8. write `orbit/changes/<change>/.orbit-runs/external-<mode>-<TS>.md`, `<TS>` the current UTC token bumped by a second
   until it collides with no file on the trail.

It SHALL print the written path and the removed lines; `--json` prints ONE object on standard output,
`{"path": "<repo-relative path>", "removed": ["<line>", …]}`. Every refusal names its cause and the source path on
standard error, exits non-zero, and writes nothing. `--as architecture` and a change that does not exist are refused
the same way. The command reads no git state and runs no process (D-rc17d-8, an open domain in the proposal's record).

| member | covered by |
|---|---|
| the return opens with the heading | written unchanged |
| a preamble above the first unfenced heading | removed and reported |
| a heading inside a fence in the preamble (a quoted template) | not a cut point; the cut is at the first unfenced heading |
| a fence the preamble opens and never closes | no unfenced heading: refused |
| a leading byte-order mark | dropped before the search |
| no unfenced heading | refused |
| a heading naming another change | refused |
| a result the trail reader rejects (a heading with no severity sections, a missing `**Reviewer**:`) | refused |
| an apply token later than `--launch` | refused |
| `--from` missing or unreadable, `--as architecture`, no such change | refused |
| text AFTER the review (a "could not commit" note) | kept byte for byte |

**Named limit.** Text after the review is kept, so it renders inside the review's last section (`## Notes` or the
`## Direction` reasoning); the command never cuts below the heading.

#### Scenario: A preamble is removed and reported

- **WHEN** the raw return's first line is `I could not save, commit, or push the findings file.` and its second is `# External Review: my-change (iteration 1)`, followed by a well-formed review
- **THEN** the saved file begins with `# External Review: my-change (iteration 1)`, the rest unchanged, and the command reports the one removed line

#### Scenario: A heading quoted inside a fence is not the cut point

- **WHEN** the raw return opens with prose, then a fenced block holding a complete clean review, then a second complete review whose CRITICAL section carries a finding
- **THEN** the saved file begins at the second review's heading, and the trail reader counts its CRITICAL finding

#### Scenario: A return without an unfenced heading is refused

- **WHEN** the raw return carries no line beginning with `# External Review:` outside a fence
- **THEN** the command exits non-zero naming the source path, and nothing is written to the trail

#### Scenario: A heading-bearing return the reader rejects is refused

- **WHEN** the raw return is the single line `# External Review: my-change (iteration 1)`
- **THEN** the command exits non-zero, because the trail reader rejects the result, and nothing is written

#### Scenario: A return older than an apply is refused

- **WHEN** `--launch 2026-10-06T10-00-00Z` is passed and the trail carries `apply-2026-10-06T10-05-00Z.json`
- **THEN** the command exits non-zero naming the apply token, and nothing is written

#### Scenario: The saved token clears the trail

- **WHEN** a trail file already carries the current second's token
- **THEN** the saved file's token is bumped until it collides with no file on the trail
