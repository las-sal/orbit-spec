## Why

Stage `seam-chaining` of `automate-dev-flow`: today every lifecycle transition is typed by the user — `orbit-conventions`'
`No-chaining contract` ends each command at the eligibility line, and `orbit-lifecycle-consent` prompts whenever apply or
archive is reached any other way. The program's regime 2 needs the AI to run the engine's next command itself, stopping
only at a seam the user configured or at a decision that is the user's, with that permission an explicit setting that
defaults to today's behaviour (R-adf-1, R-adf-6). See `explore.md`.

## What Changes

This is the first of the stage's two changes, split by grant (D-sc-19): it chains the review-and-walk loop. The second
adds the apply and archive grants and the `consent: "setting"` value.

- **A `chain` setting** in `orbit/config.yaml`: a map keyed by what the AI may run unasked — `review`,
  `review-external`, `address-reviews` — absent meaning not granted (D-sc-3, D-sc-5). `review` grants in-context and
  fresh reviews only; an external review or a blind pair needs `review-external`, because it sends the change to an
  outside service and costs money (D-sc-16). No key grants apply or archive in this change.
- **A `chain` object in `orbit status --change <name> --json`**: the next command, whether it may run unasked, and
  when not, why — `none`, `not-granted`, `open-stop`, `needs-user` or `no-progress` (D-sc-14); on `open-stop` it names
  the stop, whose question the AI then puts to the user. The engine decides; the body only obeys. The human readout is
  unchanged.
- **The no-chaining contract becomes conditional**: at the end of propose, ff, apply, review or address-reviews the AI
  runs the engine's next command itself when the `chain` object says it may, names the key that granted it, and
  otherwise ends the turn exactly as today. Only the session that invoked a command chains; a fresh reviewer it
  dispatched never does. A chained command says so in its run summary.
- **Each prompt has a kind** (D-sc-12, D-sc-13): on a chained review or walk, a target prompt never fires, a routine
  confirmation is answered with its marked default and recorded in `final_assessment` (D-sc-20), and every real
  decision stops the chain. Each such prompt states its kind in the skill's own text, and a test holds the skills to
  the requirement's list.
- **The blind pair's end** runs the walk only when `address-reviews` is granted.
- Not here: the apply and archive grants and their consent value (the stage's second change); merging the stage's PR
  and returning to the default branch (the driver, D-sc-17); bounding what a run spends (a candidate follow-up
  program, D-sc-18).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-conventions`: `No-chaining contract` holds conditionally on the `chain` object; added requirements say how a
  chain treats each prompt by its kind, and that each chained prompt states its kind.
- `orbit-engine-gates`: added requirements for the `chain` setting and the `chain` object in the change status.
- `orbit-review`: the blind pair's end step, and its "does not walk" scenario, hold while `address-reviews` is not
  granted.

## Impact

- `src/core/project-config.ts` (the `chain` key and its resolver), a new `src/core/chain.ts` (the `chain` object),
  `src/commands/workflow/status.ts`, the CLI registration and the completions registry
  (`src/core/completions/command-registry.ts`) (the object and the two `--chain-*` flags).
- The workflow templates of propose, ff, apply, review and address-reviews (the conditional end step) and the review
  and address-reviews bodies and references (the prompt tags, the external-handoff ending, the fresh-reviewer brief).
- The user docs that say the AI never runs the next step unasked (`README.md`, `docs/concepts.md`, `docs/commands.md`,
  `docs/migration-guide.md`), qualified by the setting, and `docs/customization.md` for the key itself.
- No change at the defaults: with no `chain` key every prompt fires, every command ends at the eligibility line, and
  every readout is unchanged (G0, as R-adf-12 words it).
