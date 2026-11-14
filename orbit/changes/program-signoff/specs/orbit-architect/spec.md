## ADDED Requirements

### Requirement: The architect session saves the program brief and asks for the program's sign-off

On EVERY invocation on a doc, under every sign-off setting, the architect body SHALL save the program's brief and then
read the program's hold, after it renders the doc's state and BEFORE the arc-done readout (`orbit-pr-lifecycle`'s
`Program PR (Shape A) semantics`), so a sign-off owed under `signoff: program` is asked before the program PR's READY
flip is surfaced (D-ps-3 and D-ps-5 in `program-signoff`'s `explore.md`). It runs:

```bash
orbit brief <doc> --save --json
orbit brief <doc> --hold --json
```

The save (`orbit-program-brief`'s `A program's brief is saved once the program is finished`) writes a copy only for a
finished program whose brief changed since its latest copy. The body says nothing about the save in chat under any
setting but `program`; when it exits non-zero, the body records the failure, as the command reported it, in the
session's run-summary `final_assessment`. Under `program` a failed save is stated in one line, and the body asks no
sign-off in that session, since the latest copy may not be the program's current text.

The hold (`orbit-program-brief`'s `A program's sign-off is recorded against its saved copy, and the hold reads arc-done`)
is acted on by the first row of this table that matches:

| the save and the hold | the architect body |
|---|---|
| the hold command exits non-zero | states the error in one line, asks no sign-off, and shows no arc-done readout: the program is not observed done |
| `why: "off"` | says nothing about the hold and observes arc-done as it did before this requirement; when the hold carries a warning, states it in one line |
| `why: "not-done"` | says nothing about the sign-off and shows no arc-done readout |
| the save exited non-zero, or `why: "no-copy"` | says there is no copy to sign, naming the save's failure when it failed; asks nothing, and shows no arc-done readout |
| `why: "signed"` | states in one line that the latest sign-off covers this copy's text, naming the record, then shows the arc-done readout |
| `why: "re-sign"`, `held: false` | asks nothing and shows the arc-done readout |
| `why: "re-sign"`, `held: true` | runs `orbit pr program <doc> --json`, the arc-done readout's own call: when its `pr.state` is `draft` or `unverified` it acts as on `unsigned`; otherwise — the program PR already ready, or none found — it asks nothing and shows the arc-done readout |
| `why: "unsigned"` | shows the latest saved copy whole, then asks the user to sign off or decline; writes the answer by `orbit emit signoff --doc <doc>` with the copy's filename as `brief`, `answer`, and, on a decline, the user's reason as `reason` (asked for when the answer did not give one); acts on the answer only once that emit has written the record: on `signed` it shows the arc-done readout; on `declined` it says the program is not done and the user's reason is recorded, shows no arc-done readout, and asks nothing further: what happens next is the user's direction. When the emit is refused or fails, it names the refusal and shows no arc-done readout: a signature that is not recorded lifts no hold |

The rows are the hold command's failure, the hold's six `why` values (`re-sign` split by `held`), and the save's own
failure, which joins `no-copy` under `program`. The question is a DECISION prompt: the body asks it on the user's
invocation of the session and never as an interruption elsewhere, and it is the architect body's third prompt, beside
the doc selector and the completion ratification. No stage's ratification waits for it (D-ps-5): the completion
ratification is offered as `Completion-ratification flow` states, before or after a sign-off.

With every setting at its default, nothing the user sees or is asked changes: the save writes a copy only for a finished
program and says nothing, the hold reports `why: "off"` with no warning, and the arc-done readout is as before
(`automate-dev-flow`'s R-adf-1, G0). The body carries the two commands, the table and the `orbit emit signoff --doc`
invocation with its fields, so an installed skill needs no spec to run the step; a test holds the body carrying them.

#### Scenario: A default session saves silently and asks nothing

- **WHEN** an architect session on a finished program runs with every setting at its default
- **THEN** the program's brief is saved when it changed, nothing is said about the save or the hold, and the arc-done
  readout appears exactly as it did before this requirement

#### Scenario: Under `program`, a done program's session shows the copy and asks

- **WHEN** an architect session runs under `signoff: program` and the hold reports `why: "unsigned"`
- **THEN** the latest saved copy is shown whole and the user is asked to sign off or decline before any arc-done readout

#### Scenario: A signature lets the arc-done readout appear

- **WHEN** the user signs off at the program's hold and the record is written
- **THEN** a `signoff` record saying `signed` and naming the copy is written under `signoff/<doc>/`, and the session shows
  the arc-done readout with the program PR's human acts

#### Scenario: A decline holds the program

- **WHEN** the user declines at the program's hold, giving a reason
- **THEN** a `signoff` record saying `declined` with that reason is written, no arc-done readout is shown, and nothing
  further is asked

#### Scenario: A later copy with the program PR still a draft asks again

- **WHEN** under `signoff: program` and `pr: per-architecture` the hold reports `why: "re-sign"` and `held: true`, and
  `orbit pr program` reports the PR's state `draft`
- **THEN** the session shows the latest copy whole and asks the user to sign off or decline

#### Scenario: A later copy after the program PR is ready asks nothing

- **WHEN** under `signoff: program` and `pr: per-architecture` the hold reports `why: "re-sign"` and `held: true`, and
  `orbit pr program` reports the PR's state `ready`
- **THEN** no sign-off is asked for, and the arc-done readout appears

#### Scenario: Under `program`, a failed save asks no sign-off

- **WHEN** an architect session runs under `signoff: program` on a done program and `orbit brief <doc> --save` exits
  non-zero
- **THEN** the session states the failure in one line, asks no sign-off, and shows no arc-done readout
