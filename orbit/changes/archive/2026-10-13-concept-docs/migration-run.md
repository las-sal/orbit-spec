# The migration guide, run on an OpenSpec 1.14.1 project

Exit (3) of the stage `update-gh-documentation › concept-docs`, per design D6 and task 4.1: `docs/migration-guide.md`'s
steps run once, as written, on a fresh upstream 1.14.1 project carrying one fixture per checklist hazard.

- **When:** 2026-10-13T02:09:04Z, on macOS (BSD `find`, `grep`, `sed`), git version 2.50.1 (Apple Git-155), node v25.9.0.
- **Upstream:** `npx @fission-ai/openspec@1.14.1` (`--version` prints `1.14.1`), run through a wrapper named `openspec`.
- **orbit:** this repository's build at `c27c9baf` plus the system walk's working tree (the init warning included),
  run through a wrapper named `orbit`.
- **Isolation:** `HOME` is a scratch directory, so `~/.config/openspec/config.json` and `~/.codex` are the run's,
  never the machine's. Paths under it print as `<run>`.
- **The checklist's commands are read out of the guide's bash fences** under "Before you move" by the run script,
  never retyped; the move and stamp commands are the guide's, typed in its order.

## The fixtures

The project was made by `openspec init --tools claude` and `openspec new change add-login`, then given:

| Checklist check | Fixture |
|---|---|
| 1. Task lines | change `task-forms`: `+ [ ]`, `* [ ]`, `- [~]`, `- [ x]`, `1. [ ]` and an indented sub-task, beside two canonical lines |
| 2. Dropped metadata | change `skip-docs` (`skip_specs: true`); change `meta-goal` (`goal`, `affected_areas`, `initiative`) |
| 3. Nested paths | baseline `openspec/specs/billing/invoices/spec.md`; delta `openspec/changes/nested-delta/specs/billing/payments/spec.md` |
| 4. Delta Purpose | change `delta-purpose`, whose delta carries `## Purpose` |
| 5. Stores | `store: team-specs` in `openspec/config.yaml`; `defaultStore` in the global `config.json` |
| 6. Change names | changes `001-numbered` and `2026-01-05-dated` |
| 7. Newer syntax | baseline requirement `### Requirement: Keyword search ###`; change `rename-search` with `*` bullets under RENAMED |
| 8. Ignored config | `operations` and `githubCopilot` in `openspec/config.yaml`; change `unknown-key` (`owner:`) |

`retire_capabilities` has no fixture of its own: check 2 matches it by the same alternation as `skip_specs`.

## What the run showed

- **Every check reported its fixture** (section 1), and after the fixes every check but 4 and 8 printed nothing
  (section 3): 4 is kept until after the orbit archive, as its fix says, and 8's keys are ignored, not fixed.
- **Both move states read the project** (4A: no `orbit/`; 4B: after an `orbit init` that printed the OpenSpec-project
  warning and created `orbit/` holding no file, so `find orbit -type f` printed nothing): `orbit list` showed the eight active changes, `orbit validate --all` passed 12
  of 12, `orbit status --change add-login` rendered the spec-driven gates, and `find orbit -path 'orbit/openspec*'`
  printed nothing.
- **The third state is refused a move** (4C: after an `orbit init`, with an exploration written in `orbit/`):
  `find orbit -type f` printed the exploration, which the guide's table sends to merge by hand, with no move command.
- **Archive** (section 5, on a copy of 4A): every fixture change archived; the flattened and renamed capabilities and
  the de-suffixed heading read as plain requirement headings; the delta's Purpose became the TBD placeholder, which
  check 4's fix then replaced, and `orbit validate --all` passed.

Two guide lines were falsified by an earlier run of this same script and fixed before this one (task 4.2):

1. **Check 8's metadata grep printed the indented lines of known keys** (`- checkout`, `store: team-specs`,
   `id: q4-checkout` under `affected_areas` and `initiative`). Its pattern now also excludes lines that begin with
   whitespace.
2. **Archiving `rename-search` warned "can't verify — no base recorded"**: a change made with OpenSpec carries no base
   fingerprints. The guide gained step 4, "Stamp your active changes" (`orbit fingerprint <change>`); in this run the
   stamp precedes the archive and the warning is gone.

A third was found by the system review's external half, not by the run: the empty-`orbit/` test read only
`orbit/specs/` and `orbit/changes/`, so it would have sent an `orbit/` holding an exploration or an architecture doc
to `rm -rf orbit`. The guide now tests the whole directory (`find orbit -type f`, nothing or only
`orbit/config.yaml`), and section 4C was added to observe the refused state; this transcript is the rerun with both.

## Transcript

## 1. The checklist, before any fix

```text
$ git log --oneline
6facdc3 OpenSpec 1.14.1 project with one fixture per checklist hazard
[exit 0]
```

```text
$ grep -rnE --include=tasks.md --exclude-dir=archive '^([[:space:]]+[-*+]|[*+]|[0-9]+[.)])[[:space:]]+\[|^- \[([^] xX]|[^]]{2,})\]' openspec/changes
openspec/changes/task-forms/tasks.md:4:+ [ ] 1.2 A plus bullet
openspec/changes/task-forms/tasks.md:5:* [ ] 1.3 A star bullet
openspec/changes/task-forms/tasks.md:6:- [~] 1.4 A tilde box
openspec/changes/task-forms/tasks.md:7:- [ x] 1.5 A spaced box
openspec/changes/task-forms/tasks.md:8:1. [ ] 1.6 A numbered task
openspec/changes/task-forms/tasks.md:10:  - [ ] 1.7.1 An indented sub-task
[exit 0]
```

```text
$ grep -rnE --include=.openspec.yaml --exclude-dir=archive '^(skip_specs|retire_capabilities|goal|affected_areas|initiative):' openspec/changes
openspec/changes/meta-goal/.openspec.yaml:3:goal: Faster checkout
openspec/changes/meta-goal/.openspec.yaml:4:affected_areas:
openspec/changes/meta-goal/.openspec.yaml:6:initiative:
openspec/changes/skip-docs/.openspec.yaml:3:skip_specs: true
[exit 0]
```

```text
$ find openspec -path '*/specs/*/*/spec.md' -not -path 'openspec/changes/archive/*'
openspec/specs/billing/invoices/spec.md
openspec/changes/nested-delta/specs/billing/payments/spec.md
[exit 0]
```

```text
$ grep -rlE --include=spec.md --exclude-dir=archive '^## Purpose' openspec/changes
openspec/changes/delta-purpose/specs/notifications/spec.md
[exit 0]
```

```text
$ grep -snE '^store:|defaultStore' openspec/config.yaml ~/.config/openspec/config.json
openspec/config.yaml:34:store: team-specs
<run>/home/.config/openspec/config.json:2:  "defaultStore": "team-specs"
[exit 0]
```

```text
$ find openspec/changes -mindepth 1 -maxdepth 1 -type d -name '[0-9]*'
openspec/changes/2026-01-05-dated
openspec/changes/001-numbered
[exit 0]
```

```text
$ grep -rnE --include=spec.md --exclude-dir=archive '^#+ Requirement:.*#[[:space:]]*$|^[[:space:]]*[*+] ' openspec
openspec/specs/search/spec.md:7:### Requirement: Keyword search ###
openspec/changes/rename-search/specs/auth/spec.md:3:* FROM: `### Requirement: Login`
openspec/changes/rename-search/specs/auth/spec.md:4:* TO: `### Requirement: Sign in`
[exit 0]
```

```text
$ grep -nE '^(operations|githubCopilot):' openspec/config.yaml
35:operations:
38:githubCopilot:
[exit 0]
```

```text
$ grep -rnvE --include=.openspec.yaml --exclude-dir=archive '^(schema|created|skip_specs|retire_capabilities|goal|affected_areas|initiative):|^[[:space:]]|^$' openspec/changes
openspec/changes/unknown-key/.openspec.yaml:3:owner: payments-team
[exit 0]
```

## 2. The fixes the checklist names

Check 5 first: the store, because OpenSpec's own commands resolve it.

```text
$ sed -i '' '/^store: team-specs$/d' openspec/config.yaml
[exit 0]
```

```text
$ printf '{}\n' > ~/.config/openspec/config.json
[exit 0]
```

Check 1: rewrite each printed line as an unindented `- [ ]` or `- [x]`.

```text
$ sed -i '' -E -e 's/^[+*] \[ \]/- [ ]/' -e 's/^- \[~\]/- [ ]/' -e 's/^- \[ x\]/- [x]/' -e 's/^1\. \[ \]/- [ ]/' -e 's/^  - \[ \] 1\.7\.1/- [ ] 1.8/' openspec/changes/task-forms/tasks.md
[exit 0]
```

```text
$ cat openspec/changes/task-forms/tasks.md
## 1. Forms

- [ ] 1.1 A canonical open task
- [ ] 1.2 A plus bullet
- [ ] 1.3 A star bullet
- [ ] 1.4 A tilde box
- [x] 1.5 A spaced box
- [ ] 1.6 A numbered task
- [x] 1.7 A canonical done task
- [ ] 1.8 An indented sub-task
[exit 0]
```

Check 2: finish and archive those changes with OpenSpec before moving.

```text
$ openspec archive skip-docs -y
Note: OpenSpec collects anonymous usage stats. Opt out: OPENSPEC_TELEMETRY=0 or openspec config set telemetry.enabled false

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: 0/1 tasks
Warning: 1 incomplete task(s) found. Continuing due to --yes flag.
Change 'skip-docs' archived as '2026-10-12-skip-docs'.
[exit 0]
```

```text
$ openspec archive meta-goal -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  checkout: create
Applying changes to openspec/specs/checkout/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'meta-goal' archived as '2026-10-12-meta-goal'.
[exit 0]
```

Check 3: flatten the nested paths.

```text
$ git mv openspec/specs/billing/invoices openspec/specs/billing-invoices
[exit 0]
```

```text
$ git mv openspec/changes/nested-delta/specs/billing/payments openspec/changes/nested-delta/specs/billing-payments
[exit 0]
```

Check 4: keep a copy of the Purpose, replaced after the orbit archive (section 5).

```text
$ grep -A1 '^## Purpose' openspec/changes/delta-purpose/specs/notifications/spec.md
## Purpose
Notify users of account events.
[exit 0]
```

Check 6: rename the changes.

```text
$ git mv openspec/changes/001-numbered openspec/changes/numbered-change
[exit 0]
```

```text
$ git mv openspec/changes/2026-01-05-dated openspec/changes/dated-change
[exit 0]
```

Check 7: remove the closing #s and rewrite the * bullets.

```text
$ sed -i '' -E 's/^(### Requirement: .*[^ #]) *#+ *$/\1/' openspec/specs/search/spec.md
[exit 0]
```

```text
$ sed -i '' -E 's/^\* /- /' openspec/changes/rename-search/specs/auth/spec.md
[exit 0]
```

Check 8: nothing to fix; the keys stay and are ignored.

```text
$ git add -A && git commit -qm 'Fix the checklist hazards' && git log --oneline -1
e190a55 Fix the checklist hazards
[exit 0]
```

## 3. The checklist again, after the fixes

```text
$ grep -rnE --include=tasks.md --exclude-dir=archive '^([[:space:]]+[-*+]|[*+]|[0-9]+[.)])[[:space:]]+\[|^- \[([^] xX]|[^]]{2,})\]' openspec/changes
[exit 1]
```

```text
$ grep -rnE --include=.openspec.yaml --exclude-dir=archive '^(skip_specs|retire_capabilities|goal|affected_areas|initiative):' openspec/changes
[exit 1]
```

```text
$ find openspec -path '*/specs/*/*/spec.md' -not -path 'openspec/changes/archive/*'
[exit 0]
```

```text
$ grep -rlE --include=spec.md --exclude-dir=archive '^## Purpose' openspec/changes
openspec/changes/delta-purpose/specs/notifications/spec.md
[exit 0]
```

```text
$ grep -snE '^store:|defaultStore' openspec/config.yaml ~/.config/openspec/config.json
[exit 1]
```

```text
$ find openspec/changes -mindepth 1 -maxdepth 1 -type d -name '[0-9]*'
[exit 0]
```

```text
$ grep -rnE --include=spec.md --exclude-dir=archive '^#+ Requirement:.*#[[:space:]]*$|^[[:space:]]*[*+] ' openspec
[exit 1]
```

```text
$ grep -nE '^(operations|githubCopilot):' openspec/config.yaml
34:operations:
37:githubCopilot:
[exit 0]
```

```text
$ grep -rnvE --include=.openspec.yaml --exclude-dir=archive '^(schema|created|skip_specs|retire_capabilities|goal|affected_areas|initiative):|^[[:space:]]|^$' openspec/changes
openspec/changes/unknown-key/.openspec.yaml:3:owner: payments-team
[exit 0]
```

## 4A. The move, before any orbit init

```text
$ rm -rf .claude/skills/openspec-* .claude/commands/opsx
[exit 0]
```

```text
$ ls -d orbit
ls: orbit: No such file or directory
[exit 1]
```

```text
$ find orbit -type f
find: orbit: No such file or directory
[exit 1]
```

```text
$ git mv openspec orbit
[exit 0]
```

```text
$ orbit init --tools claude
- Setting up Claude Code...
✔ Setup complete for Claude Code
Generated 21 reference files

OpenSpec Setup Complete

Created: Claude Code
15 skills and 15 commands in .claude/
Config: orbit/config.yaml (exists)

Getting started:
  Start your first change: /orbit:propose "your idea"

Learn more: https://github.com/Fission-AI/OpenSpec
Feedback:   https://github.com/Fission-AI/OpenSpec/issues

Restart your IDE for slash commands to take effect.
[exit 0]
```

```text
$ orbit list
Changes:
  rename-search       No tasks      just now
  task-forms          2/8 tasks     just now
  add-login           1/2 tasks     just now
  numbered-change     No tasks      just now
  unknown-key         No tasks      just now
  dated-change        No tasks      just now
  delta-purpose       No tasks      just now
  nested-delta        No tasks      just now
[exit 0]
```

```text
$ orbit validate --all
- Validating...
✓ change/add-login
✓ spec/auth
✓ spec/billing-invoices
✓ spec/checkout
✓ change/dated-change
✓ change/delta-purpose
✓ change/nested-delta
✓ change/numbered-change
✓ change/rename-search
✓ spec/search
✓ change/task-forms
✓ change/unknown-key
Totals: 12 passed, 0 failed (12 items)
[exit 0]
```

```text
$ orbit status --change add-login
- Loading change status...
Change: add-login
Schema: spec-driven
Progress: 3/4 artifacts complete

[x] proposal
[ ] design
[x] specs
[x] tasks

Gates:
  ✗ review-proposal: blocked (blocked by incomplete requires: design) [spend 0]
  • apply: ready (1/2)
  ✗ review-system: blocked (blocked by incomplete requires: apply) [spend 0]

Position: propose … → review(proposal) blocked-by-gate → apply ready → review(system) blocked-by-gate → archive blocked-by-gate
Ready when you are: /orbit:apply add-login — user-invoked
[exit 0]
```

```text
$ find orbit -path 'orbit/openspec*'
[exit 0]
```

```text
$ ls .claude/skills .claude/commands
.claude/commands:
orbit

.claude/skills:
orbit-address-reviews
orbit-apply-change
orbit-architect
orbit-archive-change
orbit-audit-drift
orbit-bulk-archive-change
orbit-continue-change
orbit-explore
orbit-ff-change
orbit-new-change
orbit-onboard
orbit-propose
orbit-review
orbit-sync-specs
orbit-verify-change
[exit 0]
```

```text
$ orbit fingerprint add-login
No MODIFIED/REMOVED/RENAMED requirements in add-login's delta specs — nothing to fingerprint (ADDED requirements have no base).
[exit 0]
```

```text
$ orbit fingerprint rename-search
✓ auth / "Login" — stamped sha256:bc1013dea3117d20cfddd7f1a977efef6b0e9ea2988d8d64e0946d688429cc12
[exit 0]
```

```text
$ orbit fingerprint task-forms
No MODIFIED/REMOVED/RENAMED requirements in task-forms's delta specs — nothing to fingerprint (ADDED requirements have no base).
[exit 0]
```

## 4B. The move, after an orbit init created orbit/

```text
$ orbit init --tools claude

Warning: this project has an OpenSpec project directory, openspec/.
orbit keeps its project in orbit/, separate from openspec/, and reads nothing in openspec/specs/ or
openspec/changes/. To move the project to orbit, first delete the openspec-* skills and opsx commands, then:
  - no orbit/ yet: git mv openspec orbit, then orbit init
  - orbit/ created by orbit init and holding no file but orbit/config.yaml: delete orbit/ (keep a copy
    of orbit/config.yaml if you edited it), then git mv openspec orbit, then orbit init
  - orbit/ holding any other file (specs, changes, an architecture doc, an exploration): merge by hand;
    a git mv into an existing orbit/ nests the project at orbit/openspec/, where orbit reads nothing
Run the migration guide's before-you-move checklist first: https://github.com/las-sal/orbit-spec/blob/main/docs/migration-guide.md
Continuing with init.

- Creating OpenSpec structure...
▌ OpenSpec structure created
- Setting up Claude Code...
✔ Setup complete for Claude Code
Generated 21 reference files

OpenSpec Setup Complete

Created: Claude Code
15 skills and 15 commands in .claude/
Config: skipped (non-interactive mode)

Getting started:
  Start your first change: /orbit:propose "your idea"

Learn more: https://github.com/Fission-AI/OpenSpec
Feedback:   https://github.com/Fission-AI/OpenSpec/issues

Restart your IDE for slash commands to take effect.
[exit 0]
```

```text
$ rm -rf .claude/skills/openspec-* .claude/commands/opsx
[exit 0]
```

```text
$ ls -d orbit
orbit
[exit 0]
```

```text
$ find orbit -type f
[exit 0]
```

```text
$ rm -rf orbit
[exit 0]
```

```text
$ git mv openspec orbit
[exit 0]
```

```text
$ orbit init --tools claude
Migrated: custom profile with 15 workflows
New in this version: /orbit:propose. Try 'orbit config profile core' for the streamlined experience.
- Setting up Claude Code...
✔ Setup complete for Claude Code
Generated 21 reference files

OpenSpec Setup Complete

Refreshed: Claude Code
15 skills and 15 commands in .claude/
Config: orbit/config.yaml (exists)

Getting started:
  Start your first change: /orbit:propose "your idea"

Learn more: https://github.com/Fission-AI/OpenSpec
Feedback:   https://github.com/Fission-AI/OpenSpec/issues

Restart your IDE for slash commands to take effect.
[exit 0]
```

```text
$ orbit list
Changes:
  add-login           1/2 tasks     just now
  unknown-key         No tasks      just now
  task-forms          2/8 tasks     just now
  dated-change        No tasks      just now
  numbered-change     No tasks      just now
  rename-search       No tasks      just now
  delta-purpose       No tasks      just now
  nested-delta        No tasks      just now
[exit 0]
```

```text
$ orbit validate --all
- Validating...
✓ change/add-login
✓ spec/auth
✓ spec/billing-invoices
✓ spec/checkout
✓ change/dated-change
✓ change/delta-purpose
✓ change/nested-delta
✓ change/numbered-change
✓ change/rename-search
✓ spec/search
✓ change/task-forms
✓ change/unknown-key
Totals: 12 passed, 0 failed (12 items)
[exit 0]
```

```text
$ orbit status --change add-login
- Loading change status...
Change: add-login
Schema: spec-driven
Progress: 3/4 artifacts complete

[x] proposal
[ ] design
[x] specs
[x] tasks

Gates:
  ✗ review-proposal: blocked (blocked by incomplete requires: design) [spend 0]
  • apply: ready (1/2)
  ✗ review-system: blocked (blocked by incomplete requires: apply) [spend 0]

Position: propose … → review(proposal) blocked-by-gate → apply ready → review(system) blocked-by-gate → archive blocked-by-gate
Ready when you are: /orbit:apply add-login — user-invoked
[exit 0]
```

```text
$ find orbit -path 'orbit/openspec*'
[exit 0]
```

```text
$ orbit fingerprint add-login
No MODIFIED/REMOVED/RENAMED requirements in add-login's delta specs — nothing to fingerprint (ADDED requirements have no base).
[exit 0]
```

```text
$ orbit fingerprint rename-search
✓ auth / "Login" — stamped sha256:bc1013dea3117d20cfddd7f1a977efef6b0e9ea2988d8d64e0946d688429cc12
[exit 0]
```

```text
$ orbit fingerprint task-forms
No MODIFIED/REMOVED/RENAMED requirements in task-forms's delta specs — nothing to fingerprint (ADDED requirements have no base).
[exit 0]
```

```text
$ true
[exit 0]
```

## 4C. After an orbit init, with an exploration written in orbit/: the merge-by-hand row

```text
$ orbit init --tools claude

Warning: this project has an OpenSpec project directory, openspec/.
orbit keeps its project in orbit/, separate from openspec/, and reads nothing in openspec/specs/ or
openspec/changes/. To move the project to orbit, first delete the openspec-* skills and opsx commands, then:
  - no orbit/ yet: git mv openspec orbit, then orbit init
  - orbit/ created by orbit init and holding no file but orbit/config.yaml: delete orbit/ (keep a copy
    of orbit/config.yaml if you edited it), then git mv openspec orbit, then orbit init
  - orbit/ holding any other file (specs, changes, an architecture doc, an exploration): merge by hand;
    a git mv into an existing orbit/ nests the project at orbit/openspec/, where orbit reads nothing
Run the migration guide's before-you-move checklist first: https://github.com/las-sal/orbit-spec/blob/main/docs/migration-guide.md
Continuing with init.

- Creating OpenSpec structure...
▌ OpenSpec structure created
- Setting up Claude Code...
✔ Setup complete for Claude Code
Generated 21 reference files

OpenSpec Setup Complete

Created: Claude Code
15 skills and 15 commands in .claude/
Config: skipped (non-interactive mode)

Getting started:
  Start your first change: /orbit:propose "your idea"

Learn more: https://github.com/Fission-AI/OpenSpec
Feedback:   https://github.com/Fission-AI/OpenSpec/issues

Restart your IDE for slash commands to take effect.
[exit 0]
```

```text
$ mkdir -p orbit/explore/checkout-speed && printf '# Exploration: checkout-speed\n' > orbit/explore/checkout-speed/explore.md
[exit 0]
```

```text
$ ls -d orbit
orbit
[exit 0]
```

```text
$ find orbit -type f
orbit/explore/checkout-speed/explore.md
[exit 0]
```

The second command prints a file other than orbit/config.yaml, so the guide's table gives no move command: merge by hand.

## 5. Archive a copy of each fixture change (a copy of 4A)

```text
$ orbit archive add-login -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: 1/2 tasks
Warning: 1 incomplete task(s) found. Continuing due to --yes flag.

Specs to update:
  auth: update
Applying changes to orbit/specs/auth/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'add-login' archived as '2026-10-13-add-login'.
[exit 0]
```

```text
$ orbit archive task-forms -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: 2/8 tasks
Warning: 6 incomplete task(s) found. Continuing due to --yes flag.

Specs to update:
  tasks-demo: create
Applying changes to orbit/specs/tasks-demo/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'task-forms' archived as '2026-10-13-task-forms'.
[exit 0]
```

```text
$ orbit archive nested-delta -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  billing-payments: create
Applying changes to orbit/specs/billing-payments/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'nested-delta' archived as '2026-10-13-nested-delta'.
[exit 0]
```

```text
$ orbit archive delta-purpose -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  notifications: create
Applying changes to orbit/specs/notifications/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'delta-purpose' archived as '2026-10-13-delta-purpose'.
[exit 0]
```

```text
$ orbit archive numbered-change -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  numbered: create
Applying changes to orbit/specs/numbered/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'numbered-change' archived as '2026-10-13-numbered-change'.
[exit 0]
```

```text
$ orbit archive dated-change -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  dated: create
Applying changes to orbit/specs/dated/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'dated-change' archived as '2026-10-13-dated-change'.
[exit 0]
```

```text
$ orbit archive rename-search -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  auth: update
Applying changes to orbit/specs/auth/spec.md:
  → 1 renamed
Totals: + 0, ~ 0, - 0, → 1
Specs updated successfully.
Change 'rename-search' archived as '2026-10-13-rename-search'.
[exit 0]
```

```text
$ orbit archive unknown-key -y

Proposal warnings in proposal.md (non-blocking):
  ⚠ Why section must be at least 50 characters
Task status: No tasks

Specs to update:
  refunds: create
Applying changes to orbit/specs/refunds/spec.md:
  + 1 added
Totals: + 1, ~ 0, - 0, → 0
Specs updated successfully.
Change 'unknown-key' archived as '2026-10-13-unknown-key'.
[exit 0]
```

```text
$ ls orbit/changes/archive
2026-10-12-meta-goal
2026-10-12-skip-docs
2026-10-13-add-login
2026-10-13-dated-change
2026-10-13-delta-purpose
2026-10-13-nested-delta
2026-10-13-numbered-change
2026-10-13-rename-search
2026-10-13-task-forms
2026-10-13-unknown-key
[exit 0]
```

```text
$ grep -rnE '^## Purpose|^### Requirement:' orbit/specs
orbit/specs/auth/spec.md:3:## Purpose
orbit/specs/auth/spec.md:6:### Requirement: Logout
orbit/specs/auth/spec.md:13:### Requirement: Sign in
orbit/specs/tasks-demo/spec.md:3:## Purpose
orbit/specs/tasks-demo/spec.md:6:### Requirement: Task forms
orbit/specs/checkout/spec.md:3:## Purpose
orbit/specs/checkout/spec.md:8:### Requirement: Checkout
orbit/specs/search/spec.md:3:## Purpose
orbit/specs/search/spec.md:7:### Requirement: Keyword search
orbit/specs/dated/spec.md:3:## Purpose
orbit/specs/dated/spec.md:6:### Requirement: Dated
orbit/specs/billing-payments/spec.md:3:## Purpose
orbit/specs/billing-payments/spec.md:6:### Requirement: Card payments
orbit/specs/numbered/spec.md:3:## Purpose
orbit/specs/numbered/spec.md:6:### Requirement: Numbered
orbit/specs/billing-invoices/spec.md:3:## Purpose
orbit/specs/billing-invoices/spec.md:7:### Requirement: Invoice numbering
orbit/specs/refunds/spec.md:3:## Purpose
orbit/specs/refunds/spec.md:6:### Requirement: Refunds
orbit/specs/notifications/spec.md:3:## Purpose
orbit/specs/notifications/spec.md:6:### Requirement: Email notice
[exit 0]
```

```text
$ sed -n '1,6p' orbit/specs/notifications/spec.md
# notifications Specification

## Purpose
TBD - created by archiving change delta-purpose. Update Purpose after archive.
## Requirements
### Requirement: Email notice
[exit 0]
```

Check 4's fix: replace the placeholder with the kept Purpose.

```text
$ sed -i '' 's/^TBD - created by archiving change delta-purpose. Update Purpose after archive.$/Notify users of account events./' orbit/specs/notifications/spec.md
[exit 0]
```

```text
$ sed -n '1,6p' orbit/specs/notifications/spec.md
# notifications Specification

## Purpose
Notify users of account events.
## Requirements
### Requirement: Email notice
[exit 0]
```

```text
$ orbit validate --all
- Validating...
✓ spec/auth
✓ spec/billing-invoices
✓ spec/billing-payments
✓ spec/checkout
✓ spec/dated
✓ spec/notifications
✓ spec/numbered
✓ spec/refunds
✓ spec/search
✓ spec/tasks-demo
Totals: 10 passed, 0 failed (10 items)
[exit 0]
```

## The scripts

The fixture and the run, as executed (the scratch directory path is the session's).

### build-fixture.sh

````bash
#!/bin/bash
# Build the OpenSpec 1.14.1 fixture project: one fixture per checklist hazard.
set -e
R=<run>
export HOME=$R/home npm_config_cache=/Users/sal/.npm PATH=$R/bin:$PATH
P=$R/fixture
rm -rf $P && mkdir -p $P && cd $P
git init -q -b main
git config user.name run; git config user.email run@example.invalid
openspec init --tools claude >/dev/null 2>&1
openspec new change add-login >/dev/null 2>&1

w() { mkdir -p "$(dirname "$1")"; cat > "$1"; }
change() { # name, then the .openspec.yaml extra lines on stdin
  mkdir -p openspec/changes/$1
  { printf 'schema: spec-driven\ncreated: 2026-10-12\n'; cat; } > openspec/changes/$1/.openspec.yaml
  printf '## Why\n\nFixture %s.\n\n## What Changes\n\n- Fixture.\n\n## Capabilities\n\n### New Capabilities\n\n### Modified Capabilities\n\n## Impact\n\nNone.\n' "$1" > openspec/changes/$1/proposal.md
}
req() { # name: an ADDED requirement block
  printf '### Requirement: %s\nThe system SHALL support %s.\n\n#### Scenario: %s works\n- **WHEN** a user asks for it\n- **THEN** it happens\n' "$1" "$1" "$1"
}

# A clean baseline and a clean change.
w openspec/specs/auth/spec.md <<'EOF'
# auth Specification

## Purpose
Authentication.

## Requirements
### Requirement: Login
The system SHALL let a user log in.

#### Scenario: Valid credentials
- **WHEN** a user submits valid credentials
- **THEN** a session starts
EOF
{ printf '## ADDED Requirements\n\n'; req 'Logout'; } | w openspec/changes/add-login/specs/auth/spec.md
printf '## Why\n\nUsers need to log out.\n\n## What Changes\n\n- Add logout.\n\n## Capabilities\n\n### New Capabilities\n\n### Modified Capabilities\n- `auth`\n\n## Impact\n\nAuth.\n' > openspec/changes/add-login/proposal.md
printf '## 1. Logout\n\n- [ ] 1.1 Add the logout endpoint\n- [x] 1.2 Write the design\n' > openspec/changes/add-login/tasks.md

# Hazard 1: task lines.
change task-forms </dev/null
{ printf '## ADDED Requirements\n\n'; req 'Task forms'; } | w openspec/changes/task-forms/specs/tasks-demo/spec.md
w openspec/changes/task-forms/tasks.md <<'EOF'
## 1. Forms

- [ ] 1.1 A canonical open task
+ [ ] 1.2 A plus bullet
* [ ] 1.3 A star bullet
- [~] 1.4 A tilde box
- [ x] 1.5 A spaced box
1. [ ] 1.6 A numbered task
- [x] 1.7 A canonical done task
  - [ ] 1.7.1 An indented sub-task
EOF

# Hazard 2: change metadata orbit drops.
printf 'skip_specs: true\n' | change skip-docs
printf -- '- [ ] 1.1 Update the README\n' > openspec/changes/skip-docs/tasks.md
printf 'goal: Faster checkout\naffected_areas:\n  - checkout\ninitiative:\n  store: team-specs\n  id: q4-checkout\n' | change meta-goal
{ printf '## ADDED Requirements\n\n'; req 'Checkout'; } | w openspec/changes/meta-goal/specs/checkout/spec.md

# Hazard 3: nested capability paths, baseline and delta.
w openspec/specs/billing/invoices/spec.md <<'EOF'
# invoices Specification

## Purpose
Invoices.

## Requirements
### Requirement: Invoice numbering
The system SHALL number invoices sequentially.

#### Scenario: Next invoice
- **WHEN** an invoice is issued
- **THEN** it takes the next number
EOF
change nested-delta </dev/null
{ printf '## ADDED Requirements\n\n'; req 'Card payments'; } | w openspec/changes/nested-delta/specs/billing/payments/spec.md

# Hazard 4: a Purpose section in a delta spec.
change delta-purpose </dev/null
{ printf '## Purpose\nNotify users of account events.\n\n## ADDED Requirements\n\n'; req 'Email notice'; } | w openspec/changes/delta-purpose/specs/notifications/spec.md

# Hazard 5: a store, project-level and global.
printf '\nstore: team-specs\n' >> openspec/config.yaml
mkdir -p $HOME/.config/openspec && printf '{\n  "defaultStore": "team-specs"\n}\n' > $HOME/.config/openspec/config.json

# Hazard 6: change names beginning with a digit, and an already dated name.
change 001-numbered </dev/null
{ printf '## ADDED Requirements\n\n'; req 'Numbered'; } | w openspec/changes/001-numbered/specs/numbered/spec.md
change 2026-01-05-dated </dev/null
{ printf '## ADDED Requirements\n\n'; req 'Dated'; } | w openspec/changes/2026-01-05-dated/specs/dated/spec.md

# Hazard 7: newer spec syntax, a closing ### and a * bullet under RENAMED.
w openspec/specs/search/spec.md <<'EOF'
# search Specification

## Purpose
Search.

## Requirements
### Requirement: Keyword search ###
The system SHALL find records by keyword.

#### Scenario: One match
- **WHEN** a keyword matches one record
- **THEN** that record is returned
EOF
change rename-search </dev/null
w openspec/changes/rename-search/specs/auth/spec.md <<'EOF'
## RENAMED Requirements

* FROM: `### Requirement: Login`
* TO: `### Requirement: Sign in`
EOF

# Hazard 8: configuration orbit ignores, and an unknown metadata key.
cat >> openspec/config.yaml <<'EOF'
operations:
  archive:
    guidance: Archive only on Fridays.
githubCopilot:
  cloudAgent: true
EOF
printf 'owner: payments-team\n' | change unknown-key
{ printf '## ADDED Requirements\n\n'; req 'Refunds'; } | w openspec/changes/unknown-key/specs/refunds/spec.md

git add -A && git commit -qm 'OpenSpec 1.14.1 project with one fixture per checklist hazard'
echo "fixture at $P"
````

### run.sh

````bash
#!/bin/bash
# Run docs/migration-guide.md as written on the fixture, twice: before any orbit init (A) and after one (B).
R=<run>
export HOME=$R/home npm_config_cache=/Users/sal/.npm PATH=$R/bin:$PATH
GUIDE=/Users/sal/code/orbit-spec/docs/migration-guide.md
OUT=$R/transcript.md
: > $OUT

say() { printf '\n%s\n' "$*" >> $OUT; }
r() { # run one command line as written, recording it and its output
  printf '\n```text\n$ %s\n' "$1" >> $OUT
  out=$(cd "$PWD" && eval "$1" 2>&1); code=$?
  [ -n "$out" ] && printf '%s\n' "$out" | sed -e "s#$R#<run>#g" >> $OUT
  printf '[exit %s]\n```\n' "$code" >> $OUT
}

# The checklist's command lines, in order, read from the guide's bash fences under "## Before you move".
CHECKS=$(node -e '
const t=require("fs").readFileSync(process.argv[1],"utf8");
const s=t.slice(t.indexOf("\n## Before you move\n"), t.indexOf("\n## Move the project\n"));
for (const m of s.matchAll(/```bash\n([\s\S]*?)```/g)) for (const l of m[1].split("\n")) if (l.trim()) console.log(l);
' "$GUIDE")

checklist() {
  while IFS= read -r line; do r "$line"; done <<< "$CHECKS"
}

# ── the fixture, fresh ────────────────────────────────────────────
bash $R/build-fixture.sh > /dev/null 2>&1
rm -rf $R/a $R/b && cp -R $R/fixture $R/a
cd $R/a
say "## 1. The checklist, before any fix"
r "git log --oneline"
checklist

say "## 2. The fixes the checklist names"
say "Check 5 first: the store, because OpenSpec's own commands resolve it."
r "sed -i '' '/^store: team-specs\$/d' openspec/config.yaml"
r "printf '{}\n' > ~/.config/openspec/config.json"
say "Check 1: rewrite each printed line as an unindented \`- [ ]\` or \`- [x]\`."
r "sed -i '' -E -e 's/^[+*] \\[ \\]/- [ ]/' -e 's/^- \\[~\\]/- [ ]/' -e 's/^- \\[ x\\]/- [x]/' -e 's/^1\\. \\[ \\]/- [ ]/' -e 's/^  - \\[ \\] 1\\.7\\.1/- [ ] 1.8/' openspec/changes/task-forms/tasks.md"
r "cat openspec/changes/task-forms/tasks.md"
say "Check 2: finish and archive those changes with OpenSpec before moving."
r "openspec archive skip-docs -y"
r "openspec archive meta-goal -y"
say "Check 3: flatten the nested paths."
r "git mv openspec/specs/billing/invoices openspec/specs/billing-invoices"
r "git mv openspec/changes/nested-delta/specs/billing/payments openspec/changes/nested-delta/specs/billing-payments"
say "Check 4: keep a copy of the Purpose, replaced after the orbit archive (section 5)."
r "grep -A1 '^## Purpose' openspec/changes/delta-purpose/specs/notifications/spec.md"
say "Check 6: rename the changes."
r "git mv openspec/changes/001-numbered openspec/changes/numbered-change"
r "git mv openspec/changes/2026-01-05-dated openspec/changes/dated-change"
say "Check 7: remove the closing #s and rewrite the * bullets."
r "sed -i '' -E 's/^(### Requirement: .*[^ #]) *#+ *\$/\\1/' openspec/specs/search/spec.md"
r "sed -i '' -E 's/^\\* /- /' openspec/changes/rename-search/specs/auth/spec.md"
say "Check 8: nothing to fix; the keys stay and are ignored."
r "git add -A && git commit -qm 'Fix the checklist hazards' && git log --oneline -1"

say "## 3. The checklist again, after the fixes"
checklist
cd $R && cp -R $R/a $R/b

stamp() {
  for c in add-login rename-search task-forms; do r "orbit fingerprint $c"; done
}

move_and_check() {
  r "rm -rf .claude/skills/openspec-* .claude/commands/opsx"
  r "ls -d orbit"
  r "find orbit -type f"
}

# ── A: no orbit/ ─────────────────────────────────────────────────
cd $R/a
say "## 4A. The move, before any orbit init"
move_and_check
r "git mv openspec orbit"
r "orbit init --tools claude"
r "orbit list"
r "orbit validate --all"
r "orbit status --change add-login"
r "find orbit -path 'orbit/openspec*'"
r "ls .claude/skills .claude/commands"
stamp

# ── B: orbit init first ──────────────────────────────────────────
cd $R/b
say "## 4B. The move, after an orbit init created orbit/"
r "orbit init --tools claude"
move_and_check
r "rm -rf orbit"
r "git mv openspec orbit"
r "orbit init --tools claude"
r "orbit list"
r "orbit validate --all"
r "orbit status --change add-login"
r "find orbit -path 'orbit/openspec*'"
stamp

# ── C: orbit init, then an exploration written in orbit/ before the move ──
rm -rf $R/c4 && cp -R $R/fixture $R/c4 && cd $R/c4
r "true" >/dev/null
say "## 4C. After an orbit init, with an exploration written in orbit/: the merge-by-hand row"
r "orbit init --tools claude"
r "mkdir -p orbit/explore/checkout-speed && printf '# Exploration: checkout-speed\n' > orbit/explore/checkout-speed/explore.md"
r "ls -d orbit"
r "find orbit -type f"
say "The second command prints a file other than orbit/config.yaml, so the guide's table gives no move command: merge by hand."

# ── archive a copy of each fixture change ─────────────────────────
rm -rf $R/c && cp -R $R/a $R/c && cd $R/c
say "## 5. Archive a copy of each fixture change (a copy of 4A)"
for c in add-login task-forms nested-delta delta-purpose numbered-change dated-change rename-search unknown-key; do
  r "orbit archive $c -y"
done
r "ls orbit/changes/archive"
r "grep -rnE '^## Purpose|^### Requirement:' orbit/specs"
r "sed -n '1,6p' orbit/specs/notifications/spec.md"
say "Check 4's fix: replace the placeholder with the kept Purpose."
r "sed -i '' 's/^TBD - created by archiving change delta-purpose. Update Purpose after archive.\$/Notify users of account events./' orbit/specs/notifications/spec.md"
r "sed -n '1,6p' orbit/specs/notifications/spec.md"
r "orbit validate --all"
echo done
````
