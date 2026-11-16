> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: tripwire-project-sensors

## Premise

Stage `tripwires` of `automate-dev-flow`, the fourth of its four changes (D-tw-19): sensors a project declares
itself — a linter, a code-structure tool — run by orbit only after the user approves that exact set on the machine. It
writes through the first change's contract (D-tw-1, D-tw-3, D-tw-6) and carries the one security-relevant call of the
stage, answered by the user at a `security-unprecedented` stop (`stop-2026-11-16T20-27-14Z.json` and its resolution, in
the trail of the exploration `tripwires`). Capabilities measured at the division: `orbit-tripwires`. A bare `D-tw-<n>` here names a decision in `orbit/explore/tripwires/explore.md` (once that change is
archived, the `explore.md` in its `orbit/changes/archive/` folder); the decisions below are restated from that
exploration, each naming its source.

## Mechanism

### D-tps-1 — project sensors are declared in the project and run only after the user approves that exact set on this machine
Domain: each state a declared project sensor can be in when a seam would run it
| member | covered by |
|---|---|
| no project sensor declared | nothing runs (G0) |
| declared, never approved on this machine | not run; a "cannot read" reading naming the missing approval |
| declared, approved, and the declaration and every repo file its argv names unchanged since | run: argv only, never a shell string, from the project root, under a timeout |
| declared, changed since its approval | not run; a "cannot read" reading naming what changed, which counts as fired (D-tw-3) |
| approved while the change it watches was under way | run; the reading notes the approval's time inside the change |
| a cloned project whose user never approved | nothing runs: approval is per machine, kept in the user's own config |
Closure: BOUNDED — the approval states are closed, but what a sensor's command reads is not
Residual kind: what a sensor's command reads beyond its declaration and the files its argv names — a script those call, the tool's own configuration (a linter's rule file)
Residual method: the Touchpoints sensor fires on an edit to such a file the plan did not predict only past its tolerances (D-tw-17), so a small edit passes; first-run's closing review reads each change's edits to files its sensors read
Moves:
- READ: applied — the external runner: per-user record, argv only, executed by the review body and never by the engine (`src/core/external-runner.ts`); the engine runs no other process but git
- ENUMERATE: applied — this table
- COHERE: applied — the approval is D-tw-3's freeze for project sensors: an edit stops the sensor running until the user approves again, and "cannot read" counts as fired, so editing a watcher trips it
- EXECUTE: not applied — nothing is built yet
- FALSIFY: applied — an AI holding the user's shell could run the approval itself; orbit cannot prevent that (single user, detection never a lock), so it records each approval's time and the reading notes one given during the change
- CONFORM: applied — the stop `stop-2026-11-16T20-27-14Z.json` and its resolution (the user's answer, A); R-adf-6 (each sensor's halt is its own setting); G0 (nothing declared, nothing runs)
- FEASIBILITY: applied — a command per sensor at each seam it names, under a timeout
- CONSUME: applied — the reading (D-tw-6), the approval record in the user's config
- INVOKE: applied — the seams each sensor names; the user's approval command

### D-tps-2 — a project sensor reports one count on stdout, compared with its reading when the change was proposed
Domain: what a project sensor's run can produce, and its comparison with its reference
| member | covered by |
|---|---|
| stdout is a single integer | the count, whatever the exit code |
| stdout is JSON `{"count": <int>, "items": [<string>…]}` | the count; the items are the reading's evidence, whatever the exit code |
| stdout is anything else, or empty | "cannot read" |
| the command times out or cannot start | "cannot read" |
| no reference reading (the sensor was added after propose, or could not read then) | "cannot read": no reference, no comparison |
| count greater than the reference | fires |
| count at or below the reference | no firing |
Closure: DERIVED — stdout parses as one of two forms or does not; the run finishes or does not; a reference exists or does not; the count exceeds it or does not
Moves:
- READ: applied — D-tw-3's reference model; D-tw-6's readings field
- ENUMERATE: applied — this table
- COHERE: applied — the reference is taken at propose, a seam the readings field did not list, so the propose emit's write takes each project sensor's reference reading and keeps it on the trail (D-tw-6's seams gain propose, for references only)
- EXECUTE: applied — linters exit non-zero when they find problems (a lint run with errors exits 1), so reading the exit code as failure would make every run with findings unreadable; the count is read from stdout whatever the exit code, and only an unparsable output, a timeout or a failure to start is "cannot read"
- FALSIFY: applied — a reference taken by re-running the tool at the base commit needs a checkout whose dependencies may not be installed, so it would often be unreadable; the propose-time reading is taken in the working tree the tool already runs in
- CONFORM: applied — D-tw-3 (deviation from a reference fixed before the run); D-tps-1 (the run itself)
- FEASIBILITY: applied — one extra run per sensor at propose; each sensor names the seams it runs at, so a slow tool runs only where the project wants it
- CONSUME: applied — the reading's count, reference and items, read by the brief and, under a halt setting, the `tripwire` stop
- INVOKE: applied — propose (the reference) and each seam the sensor names

## Decisions

- **2026-11-16 — D-tps-1: project sensors are declared in the project and run only after the user approves that exact
  set on this machine** Restated from D-tw-11 at the division (D-tw-19). The user's answer (A) to the `security-unprecedented` stop `stop-2026-11-16T20-27-14Z.json`, over
  declaring them only in the user's own config (B) or having the AI session run them (C). Argv only; approval by hash of
  the declaration and the repo files its argv names, kept in the user's own config; any edit needs approval again, and
  until then the sensor reads "cannot read". The approval is also D-tw-3's freeze.
  Kind: rule
- **2026-11-16 — D-tps-2: a project sensor reports one count on stdout, compared with its reading when the change was
  proposed** Restated from D-tw-12 at the division (D-tw-19). Method, settled by the AI with the user not objecting. The count is read whatever the exit code, because
  linters exit non-zero when they find problems; the reference is taken at propose in the working tree.
  Kind: rule

## Open questions

- **The approval's shape.** The command, and what the user's config keeps.
  Standing recommendation: one command that approves the project's current sensor set on this machine, keeping the
  project root, the hash and the time in the user's own config, beside `externalRunner`; a second that lists what is
  approved; no command removes another project's approval

## Considered & out

- **2026-11-16 — Project sensors declared only in the user's own config:** out (the user, D-tps-1). Sensors could not
  travel with a project, and each machine would need its own.
- **2026-11-16 — Project sensors run by the AI session:** out (the user, D-tps-1). The watched AI would produce its own
  readings.
- **2026-11-16 — A non-zero exit read as "cannot read":** out (D-tps-2). Linters exit non-zero when they find problems.
- **2026-11-16 — A project sensor's reference taken at the base commit:** out (D-tps-2). The checkout's dependencies may
  not be installed.

## References

- `orbit/explore/tripwires/explore.md` — the parent exploration: the contract, the reference model, the record, and D-tw-19's division
- `orbit/architecture/automate-dev-flow.md` — stage `tripwires`, G0, G3, G6
- `src/core/external-runner.ts` — the precedent: a per-user, argv-only record the engine never executes
- `src/core/global-config.ts` — the user's own config, where the approval is kept
- `orbit/explore/tripwires/.orbit-runs/decisions/stop-2026-11-16T20-27-14Z.json` and its resolution — the user's answer (moves with that exploration at its propose)
