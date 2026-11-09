> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: seam-chaining

## Premise

Stage `seam-chaining` of `automate-dev-flow` (depends on decision-layer). Today every lifecycle transition is
typed by the user: `orbit-conventions`' `No-chaining contract` ends each command at the eligibility line, and
`orbit-lifecycle-consent`'s `Invocation-provenance rule` fires a consent prompt when apply or archive is reached any
other way. The charter: the settings R-adf-1 and R-adf-6 name (chaining, sign-off, each outward act, concurrency),
each its own key defaulting to today's behaviour; D1's no-chaining contract, the single-session model and D6's
outward-actions rule amended to hold conditionally on them; with chaining on, a command that ends on a passed gate
runs the engine's next command itself and stops at a configured seam or on a stop record; consent provenance gains a
value for a transition taken by setting. Exit: each amended requirement names its setting with a default test; a
fixture shows a passed gate followed by the next command, and a stop record halting it; G0 holds.

What this exploration must settle: where the settings live, which of them this stage owns, what the chaining
setting's shape is, who decides that a chain may proceed, how a chained arrival records consent, and how G0's
body clause meets a stage whose purpose is to change what the AI does at a seam.

## Mechanism

### D-sc-12 — a chain treats each prompt by its kind
Domain: every prompt the five chained skills (propose, apply, review, address-reviews, archive) can put to the user, with the skill each reaches by delegation
| member | covered by |
|---|---|
| propose: what to build, when invoked with no input | target: does not fire, the next command names the change |
| propose: offer the single live exploration as the name | target: does not fire, as above |
| propose: clarify when context is critically unclear | decision: stops |
| propose: an exploration and a change claim one name | decision: stops |
| propose: `explore.md` lacks a section (default: proceed) | routine: proceeds, recorded |
| propose: each open question, and the bulk offer over many | decision: stops |
| propose: an undeclared size breach (split or declare) | decision: stops |
| apply: consent for an arrival not typed by the user | consent: granted, no prompt (D-sc-7); not granted, fires and stops |
| apply: select the change | target |
| apply: gate inflection, review-proposal unpassed | cannot fire on a chained arrival: the engine names apply only once that gate passes (D-sc-15); a decision on any other arrival |
| apply: pause on an unclear task, a design issue, an error or a blocker | decision: stops |
| review: select the change; the mode when `tasks.md` is missing; the external handoff's change selection | target |
| review: an external return the user pastes back | not a prompt but a wait: the `chain` object refuses with needs-user before the review runs (D-sc-14) |
| address-reviews: triage scoping the user's reply leaves unsettled (default: walk all) | routine: walks all, recorded |
| address-reviews: a half-landed pair, stop or walk now | decision: stops |
| address-reviews: a decision-lane finding (briefing, ratification, closure prompt) | decision: stops |
| archive: select the change, and sync-specs' own selection | target |
| archive: consent for an arrival not typed by the user | consent: as apply's |
| archive: incomplete artifacts | decision: stops |
| archive: incomplete tasks | decision: stops (G2) |
| archive: sync now (recommended) or archive without syncing | routine: syncs, recorded |
| archive: unresolved `@review:` markers | decision: stops (G2) |
| archive: gate inflection | cannot fire on a chained arrival: the engine names archive only once its gates pass (D-sc-15); a decision on any other arrival |
| archive: fingerprints unverified, proceed or abort (no default) | decision: stops |
| archive: fingerprint divergence | decision: stops |
| archive: a CRITICAL audit finding | decision: stops |
Closure: BOUNDED — the AskUserQuestion sites are sourced by grep over every generated skill file, but a body can ask in prose ("ask for clarification", "wait for guidance"), and only a second pattern found apply's pause list
Residual kind: a question a chained body asks in prose that matches neither pattern of Case 1
Residual method: D-sc-13's test over the generated bodies, and a fixture chain run through each granted command, any turn that ends awaiting the user without a listed prompt being the missed member
Moves:
- READ: applied — each row read from the generated bodies, Case 1; the next commands name change and mode (`nextAfterPass` and the review routes in `src/core/artifact-graph/gates.ts`)
- ENUMERATE: applied — this table, from two patterns over `.claude/skills` (Case 1)
- COHERE: applied — the consent rows agree with D-sc-7; the gate-inflection rows cannot fire on a chained arrival (D-sc-15); the pasted return is D-sc-14's needs-user
- EXECUTE: not applied — no chain runs yet; the stage's fixture chain is the first execution
- FALSIFY: applied — a default that hides unfinished work would satisfy every routine row and still let a run go past it; hence `@review:` markers and open tasks at archive are decisions (G2)
- CONFORM: applied — R-adf-6 (a default is taken only inside a command granted on its own key), G2, G0 (a user-typed arrival fires every prompt as today); R-adf-3 closes the stop set for an autonomous run, which regime 2 is not, so the driver must reconcile the extra stops
- FEASIBILITY: not applied — twenty-six rows; a classification line per prompt in five bodies
- CONSUME: applied — the run summary of each command that took a default needs a field naming it, which `orbit-emit-composition`'s payload table must accept; the body reads the kind from its own text (D-sc-13)
- INVOKE: applied — fires only on an arrival with `consent: "setting"` (D-sc-7); every other arrival asks every prompt as today

### Case 1 — the prompt sites in the chained skills
Read 2026-11-09 from the generated surface: `grep -c AskUserQuestion` over every `.claude/skills/**/*.md` (sites in address-reviews, apply, architect, archive, bulk-archive, continue, ff, new, propose, review and its external-handoff reference, sync-specs, verify), then `pause|halt|ask the user` over the five chained bodies, which found apply's pause list (unclear task, design issue, error or blocker, user interrupt). Architect, bulk-archive, continue, ff, new and verify are not commands a chain runs. Archive's Step 4 sync prompt fires whenever delta specs exist (D-sc-11).

### D-sc-3 — every setting is a project key read by one resolver, absent meaning today
Domain: every setting this stage adds
| member | covered by |
|---|---|
| `chain`, the map of commands the AI may run unasked | its own resolver; absent, or not a map, grants no command |
| merging the stage's PR | not this stage's: the driver's setting (D-sc-17) |
| returning to the default branch | not this stage's: the driver's setting (D-sc-17) |
| a per-program override | not a setting: a named limit until the driver runs a program |
Closure: DERIVED — the set is D-sc-17's scope, one key per permission (R-adf-6)
Moves:
- READ: applied — `pr`, `review_preference` and `size_ceiling` are each read by one resolver in `src/core/project-config.ts` (`resolvePrMode`, `resolveReviewPreference`, `resolveSizeCeiling`)
- ENUMERATE: applied — this table
- COHERE: applied — the `chain` map is one key whose entries are separate grants, none derived from another, so D-sc-5 and R-adf-6 agree
- EXECUTE: not applied — no resolver exists yet
- FALSIFY: applied — a misspelt key must read as absent, never as granted; `ProjectConfigSchema` is a z.object, so an unknown key reaches no resolver, the safe direction; propose decides whether it also warns
- CONFORM: applied — R-adf-1 (defaults are today's behaviour), R-adf-6 (no umbrella key), D-sc-2's precedent
- FEASIBILITY: not applied — one schema entry and one resolver per key
- CONSUME: applied — only the `chain` object (D-sc-14) reads the resolver
- INVOKE: applied — read whenever `orbit status --change --json` composes the `chain` object

### D-sc-5 — the chaining map is keyed by command, absent meaning not granted
Domain: every command the engine can name as a change's next command
| member | covered by |
|---|---|
| `/orbit:review --as <mode> <change>` (in-context) | key `review` |
| `/orbit:review --as <mode> --fresh <change>` | key `review` |
| `/orbit:review --as <mode> --reviewer external <change>` | key `review-external` (D-sc-16) |
| `/orbit:review --as <mode> --reviewer blind-pair <change>` | key `review-external`: a pair launches an external half (D-sc-16) |
| `/orbit:address-reviews <change>` | key `address-reviews` |
| `/orbit:apply <change>`, with or without the user-invoked marker | key `apply`; the marker is D-sc-7's consent seam |
| `/orbit:archive <change>`, with or without the marker | key `archive`, likewise |
| no next command | nothing to grant: D-sc-14's `none` |
Closure: SOURCED — the change-level next command is set only in `instruction-loader.ts`, from `commandForClass`, `canonicalNextForReviewed` and `nextAfterPass` in `gates.ts` and the tracked-gate apply line; each string they can return is a row (Case 2)
Moves:
- READ: applied — Case 2
- ENUMERATE: applied — this table
- COHERE: applied — the marker on apply and archive is both a command row here and D-sc-7's seam; one key grants the run and its consent together
- EXECUTE: not applied — no map exists yet
- FALSIFY: applied — a new cadence class added to `commandForClass` would name a command no key covers, so it would never be granted: safe, but silent; a test mapping every string the engine can return to a key fails on it
- CONFORM: applied — R-adf-6: granting reviews never grants an external one, which reaches the network and costs money
- FEASIBILITY: not applied — eight rows
- CONSUME: applied — the `chain` object maps the next command to its key; the body reads only the object
- INVOKE: applied — at every command's end, when the body reads status for its eligibility line

### D-sc-14 — the `chain` object refuses for one of five reasons
Domain: every reason a chain must not run the engine's next command
| member | covered by |
|---|---|
| `none`: the engine names no next command | the chain ends; the eligibility line renders as today |
| `not-granted`: the next command's key is absent or false | stops; the eligibility line renders as today |
| `open-stop`: a stop record on the change's trail has no resolution | stops, naming the stop |
| `needs-user`: the next review's route needs the user (no reachable runner, so a pasted handoff) | stops, naming the route |
| `no-progress`: the next command is the one the chain just ran, and the trail gained no record since | stops, naming the repeat |
Closure: BOUNDED — the reasons a chain must not proceed are not a closed structure; these are the ones the five commands' states show
Residual kind: a state where the next command is granted and would run, yet running it unasked is wrong
Residual method: the stage's fixture chain, and each signal the tripwires stage adds, read as a candidate reason
Moves:
- READ: applied — Case 2 (D-sc-15); the pasted route from `orbit-review`'s `references/blind-pair.md` Step 1, where an unreachable runner selects it
- ENUMERATE: applied — this table
- COHERE: applied — `not-granted` agrees with D-sc-12's consent rows; apply's chunks name `/orbit:apply` again, but each writes an emit, so `no-progress` lets them run
- EXECUTE: not applied — no `chain` object exists yet
- FALSIFY: applied — D-sc-6's "gate unpassed" reason would have stopped every chain at its first review, because an unpassed gate is what names the review; dropped here
- CONFORM: applied — gate verdicts stay engine-computed and the body judges no reason; R-adf-3's stop record halts a chain through `open-stop`
- FEASIBILITY: applied — every reason reads state status already loads (gates, trail, runner) except `open-stop`, which reads the decisions folder
- CONSUME: applied — the body reads `may_run` and `why`; at the defaults the readout and eligibility line are unchanged (G0)
- INVOKE: applied — composed on every `orbit status --change --json`

### D-sc-7 — a chained arrival records consent by setting
Domain: every consent-scoped command
| member | covered by |
|---|---|
| apply | granted by `apply`: `consent: "setting"` naming the key, no prompt |
| archive | granted by `archive`, likewise; the sync it runs inherits it |
| bulk-archive | never chained: the engine never names it as a next command; prompts as today |
| sync | not consent-scoped on its own: inherits its caller's consent |
Closure: SOURCED — `orbit-lifecycle-consent`'s Purpose names the set: apply, archive and bulk-archive per change, sync inheriting
Moves:
- READ: applied — that Purpose line and its `Consent prompts at consent-marked seams` requirement
- ENUMERATE: applied — this table
- COHERE: applied — at the defaults the marker stays on the eligibility line and an arrival not typed by the user prompts as today; only a granted arrival records `setting`
- EXECUTE: not applied — no grant exists yet
- FALSIFY: applied — audit-drift's missing-consent tripwire and the emit's write gate read the `consent` field; unless both accept the third value, every chained apply reads as unconsented
- CONFORM: applied — R-adf-1 (D1 amended to hold conditionally), R-adf-6
- FEASIBILITY: not applied — one value and one key name per emit
- CONSUME: applied — the apply and archive emits' `consent` field, and audit-drift's Category 4 tripwire
- INVOKE: applied — at apply or archive entry, when the body ran it because the `chain` object said it may

### D-sc-13 — each prompt states its kind, and a test holds the list
Domain: every place a chained skill asks the user
| member | covered by |
|---|---|
| an AskUserQuestion site in the five chained bodies or their references | a `(chain: <kind>)` tag in the site's sentence, the kind one of target, routine (naming its default), decision, consent |
| a prose ask matching the pause pattern (pause, wait for guidance, ask for clarification) | the same tag |
| a prompt in a skill a chained body delegates to (sync-specs) | the same tag, in the delegated skill |
| a prompt in a skill a chain never runs (architect, bulk-archive, continue, ff, new, verify) | untagged: the test's scope is the chained five and their delegates |
Closure: BOUNDED — the sites are found by two patterns, and a prose ask can match neither (D-sc-12's residual)
Residual kind: a question a chained body asks in prose that neither pattern matches
Residual method: the stage's fixture chain, where a turn ending on the user without a tagged prompt is the missed member
Moves:
- READ: applied — Case 1
- ENUMERATE: applied — this table
- COHERE: applied — one list in three places: the requirement owns it, the tags carry it into the bodies, the test checks the bodies against the requirement
- EXECUTE: not applied — no tag exists yet
- FALSIFY: applied — a tag the AI ignores passes the test; only the fixture chain checks behaviour
- CONFORM: applied — D14 (upstream bodies change only by named deltas, so each tag there is one), R-adf-12 (text inert at the defaults), R-crc-14 (the spec owns the list, the body mirrors it)
- FEASIBILITY: not applied — about twenty-six tags
- CONSUME: applied — the AI reads the tag only on an arrival the `chain` object allowed
- INVOKE: applied — the test runs in `npm test`

### D-sc-16 — the `review` key never grants an external review
Domain: every route a granted review can take
| member | covered by |
|---|---|
| in-context review | key `review` |
| fresh review (a clean-context subagent in this session) | key `review` |
| external review, launched on a reachable runner | key `review-external` |
| external review, pasted (no runner, or one not on PATH) | refused as `needs-user` whatever the keys (D-sc-14) |
| blind pair, launched | key `review-external` |
| blind pair, pasted | refused as `needs-user` (D-sc-14) |
| a launch refused on a dirty working tree | not a route: the review writes nothing, so the next status names it again with no new record, and `no-progress` stops the chain |
Closure: DERIVED — the routes are the reviewer classes (in-context, fresh, external, blind pair) times the external half's two routes (launched, pasted)
Moves:
- READ: applied — the routes from `orbit-review`'s `references/external-handoff.md` (runner reachable or not, the dirty-tree refusal) and `references/blind-pair.md` Step 1
- ENUMERATE: applied — this table
- COHERE: applied — D-sc-5's rows map the two external command forms to `review-external`, and D-sc-14's `needs-user` takes the pasted half of each
- EXECUTE: not applied — no grant exists yet
- FALSIFY: applied — a granted fresh review spends tokens in this session but reaches no outside service; the line drawn is the outside runner, which is where network and money enter
- CONFORM: applied — R-adf-6 (each permission its own key)
- FEASIBILITY: applied — the recorded codex runner works only with the sandbox off, and the harness refused such a launch the user had not invoked (2026-10-14); a chained launch may be refused the same way, writing nothing, and `no-progress` then stops the chain; the first-run trial must show the grant reaches the harness
- CONSUME: applied — the `chain` object's key lookup (D-sc-5)
- INVOKE: applied — whenever the next command is an external or blind-pair review

### Case 2 — what the engine can name as a change's next command
Read 2026-11-09: `src/core/artifact-graph/instruction-loader.ts` walks the gates in order, skips passed and superseded gates (a passed gate holding unwalked passes names `/orbit:address-reviews`), takes the first gate's `nextCommand`, or `/orbit:apply` for a ready tracked gate, and falls back to the latest passed gate's command. In `gates.ts`, `commandForClass` returns the in-context, `--fresh`, `--reviewer external` and `--reviewer blind-pair` review commands; `canonicalNextForReviewed` adds `/orbit:address-reviews`; `nextAfterPass` returns `/orbit:apply` or `/orbit:archive`, each with the user-invoked marker when the gate is consent-marked.

## Decisions

- **2026-11-09 — D-sc-1: the engine never invokes a command; a chained transition is the AI invoking the engine's next command** Every lifecycle command is a skill the AI runs; the engine computes `next_command` and gates, and prompts for nothing (`orbit-lifecycle-consent`'s `The engine never prompts for consent`). So "chaining on" can only mean that the generated body tells the AI to run the next command itself when a permission the engine computes allows it.
  Kind: fact
- **2026-11-09 — D-sc-2: orbit's project settings are single keys in `orbit/config.yaml`, each read by one resolver with absent meaning today's behaviour** `pr` (`resolvePrMode`, absent = `never`), `review_preference` and `size_ceiling` in `src/core/project-config.ts`; the global config (`src/core/global-config.ts`) holds per-machine values such as the external runner.
  Kind: fact
- **2026-11-09 — D-sc-3: every setting this program adds is a project key in `orbit/config.yaml`, read by one resolver, absent meaning today's behaviour** It follows D-sc-2's precedent (`pr`, `review_preference`, `size_ceiling`). The Premise's "per program at architect" choice is a named limit: no per-program override exists until the driver, which runs a program, needs one. User's word, 2026-11-09 ("go with your recommendations").
  Kind: rule
- **2026-11-09 — D-sc-4: this stage owns chaining and the outward acts a chain needs; sign-off moves to program-brief, concurrency and the single-session amendment to parallel-lanes** A setting nothing reads is a key nothing honours: sign-off is read only at program-brief's seam, concurrency only by parallel-lanes' driver. The charters were edited the same day (user's word: "split them out").
  Kind: scope
  Disposition: superseded D-sc-17 (the outward acts moved to the driver, 2026-11-09)
- **2026-11-09 — D-sc-5: the chaining setting is a map keyed by the command the AI may run unasked, absent meaning not granted** For example `chain: { review: true, address-reviews: true, apply: false, archive: false }`. Nothing is granted by omission, so no umbrella key exists (R-adf-6), and the seams are exactly the commands not granted.
  Kind: rule
- **2026-11-09 — D-sc-6: the engine decides whether a chain may proceed; the body only obeys** `orbit status --change <name> --json` carries a `chain` object: the next command, whether it may run unasked, and when not, why (gate unpassed, open stop record, command not granted). The body runs the next command only when that object says so, so the judgement stays engine-computed.
  Kind: rule
  Disposition: superseded D-sc-14 (an unpassed gate is what names the next review, so it cannot be a refusal, 2026-11-09)
- **2026-11-09 — D-sc-7: a chained arrival records `consent: "setting"` with the key that granted it, and fires no consent prompt** A granted command is neither user-invoked nor prompted; an ungranted command reached any other way still prompts as today.
  Kind: rule
- **2026-11-09 — D-sc-8: the conditional chaining text is named as a second ratified G0 exception under R-adf-11, at an architect session before propose** Making no-chaining conditional changes every body's text, though not what it does while no command is granted. Amending G0 is a `ruling-amendment` stop, asked at that session.
  Kind: scope
  Disposition: superseded R-adf-12 (the user reworded G0's body clause in general at that session, 2026-11-09)
- **2026-11-09 — D-sc-9: the merge and the return to the default branch become settings now, each its own key; releases and issue filing stay the user's** A chain crossing stages under a per-proposal PR needs both before the next stage's propose; nothing on that path publishes a release or files an issue.
  Kind: scope
  Disposition: assigned driver
- **2026-11-09 — D-sc-10: a chain stops whenever the AI would ask the user anything, and states why** A decision-lane walk, a consent prompt for an ungranted command, an anomaly prompt (gate, fingerprint, audit) or a stop record each halts it. Context growth over a long chained session is a named limit until the driver (R-adf-8).
  Kind: rule
  Disposition: superseded D-sc-12 (a chain does not stop at a routine confirmation, 2026-11-09)

- **2026-11-09 — D-sc-11: archive asks before every sync, so a chain under D-sc-10 as worded could never pass archive** The archive body's upstream Step 4 prompts "Sync now (recommended)" / "Archive without syncing" whenever a change has delta specs, which every stage of this program has; propose likewise asks to proceed when `explore.md` lacks a section (default: proceed). Read from `.claude/skills/orbit-archive-change/SKILL.md` and `orbit-propose/SKILL.md`, 2026-11-09.
  Kind: fact

- **2026-11-09 — D-sc-12: a chain treats each prompt by its kind: a target prompt never fires, a granted command takes a routine confirmation's marked default and records it, and every real decision stops the chain, stating why** A target prompt asks which change or mode, which the engine's next command always names. A routine confirmation is a prompt whose body marks a default and whose default writes nothing outward. A real decision is every other prompt, and so are `@review:` markers and open tasks at archive, which mean unfinished work would be archived (G2). Context growth over a long chained session stays a named limit until the driver (R-adf-8). User's word, 2026-11-09 ("go with your recommendation, take the defaults").
  Kind: rule
- **2026-11-09 — D-sc-13: each prompt in a chained skill states its kind in the skill's own text, and a test fails on a prompt with no kind or one the owning requirement does not list** A chain is the AI following the body, so the body is where the AI learns a prompt's kind; the requirement listing the prompts is the lasting copy, and the test keeps the two from drifting when a prompt is added (the AI's method call, recorded per R-crc-3).
  Kind: rule

- **2026-11-09 — D-sc-14: the `chain` object refuses for exactly one of five reasons, and otherwise lets the next command run** `orbit status --change <name> --json` carries the next command, whether it may run unasked, and when not, why: `none` (no next command), `not-granted` (its key is absent or false), `open-stop` (a stop record on the change's trail has no resolution), `needs-user` (the next review's route needs the user: no reachable external runner, so a pasted handoff), `no-progress` (the next command is the one the chain just ran and the trail gained no record since). The body runs the next command only when it may.
  Kind: rule
- **2026-11-09 — D-sc-15: the engine's next command never skips an unpassed gate; apply and archive are named only once the gates before them pass** The change-level next command is set in `src/core/artifact-graph/instruction-loader.ts`, walking the gates in order and taking the first unpassed gate's command; apply comes from a passed `review-proposal` or a ready tracked gate, archive from a passed `review-system`. So a chained arrival at apply or archive never meets a gate inflection.
  Kind: fact
- **2026-11-09 — D-sc-16: the `review` key grants in-context and fresh reviews only; an external review or a blind pair needs its own `review-external` key** An external review launches an outside runner, which reaches the network and costs money, so granting reviews must not grant it (R-adf-6). The AI's call, under the user's "go with your recommendations".
  Kind: rule

- **2026-11-09 — D-sc-17: seam-chaining owns chaining alone; merging the stage's PR and returning to the default branch are the driver's settings** A seam-chained run ends at archive: the command after it is not a change command, and the next stage opens at an architect session and propose, which ask the user by design (D-sc-12). Nothing in this stage would read the two keys. Charters for seam-chaining and driver edited the same day. User's word, 2026-11-09 ("yes, move them to the driver").
  Kind: scope
- **2026-11-09 — D-sc-18: bounding what a run spends, in tokens and money, internal and external reviews alike, is out of this stage and a candidate follow-up program** Today nothing bounds it: a reviewed gate counts independent passes (`independentSpend`) and nothing consults the count (`src/core/artifact-graph/gates.ts`). The tripwires stage's "size or walk budgets exceeded" signal is the nearest home inside this program. Raised by the user, 2026-11-09 ("probably a topic for a follow up program").
  Kind: scope

- **2026-11-09 — D-sc-19: the stage lands as two changes split by grant: this one chains review and address-reviews; a second adds the apply and archive grants with `consent: "setting"`** Letting a chain enter apply or archive makes false every requirement listing the consent values as exactly two — in `orbit-lifecycle-consent`, `orbit-conventions`' summary format, `orbit-run-summary-emit` and `orbit-archive-modifications` — which put one change at seven capabilities and about fifteen requirements against ceilings of three and twelve. The review-and-walk loop needs none of them. D-sc-7 and the apply and archive rows of D-sc-5 and D-sc-12 land with the second change. User's word at propose, 2026-11-09 ("Split by grant").
  Kind: scope
- **2026-11-09 — D-sc-20: a default a chain takes is recorded as one sentence in the command's `final_assessment`, not in a new payload field** A new field joins the payload tables, their schema references and executed examples, and the emit-composition requirement that says decision-reading changed the run-summary commands "only" so; the narrative field every emit already carries holds the record with no new owner. The AI's method call, recorded per R-crc-3.
  Kind: scope

## Open questions

## Considered & out

- **A list of transitions, or a list of seams to stop at, as the chaining setting's shape** (2026-11-09) — a seam list grants every command it omits, so an absent entry would grant; a transition list names pairs where only the arriving command matters. Out for D-sc-5's map.
- **The AI reading config and gates itself to decide a chain** (2026-11-09) — it would put a gate-shaped judgement in the body, against the engine computing gate state. Out for D-sc-6.
- **A per-program setting at architect, now** (2026-11-09) — nothing reads it before the driver runs a program. Out for D-sc-3's named limit.
- **A chain stopping at every prompt, routine confirmations included** (2026-11-09) — archive asks before every sync (D-sc-11), so no chain could pass archive. Out for D-sc-12.
- **Treating `@review:` markers and open tasks at archive as routine** (2026-11-09) — each means unfinished work is about to be archived; a chain answering it goes past what a stop should catch (G2). Out: both are real decisions under D-sc-12.
- **An unpassed gate as a reason to stop a chain** (2026-11-09) — an unpassed gate is what names the next review; a chain refusing on it would stop at its first review. Out: D-sc-14 replaces D-sc-6's list.
- **Sign-off and concurrency as this stage's settings** (2026-11-09) — no code in this stage reads either. Moved to program-brief and parallel-lanes (D-sc-4).

## References

- `orbit/architecture/automate-dev-flow.md` — R-adf-1, R-adf-3, R-adf-6, R-adf-8, R-adf-11; stage seam-chaining's charter
- `orbit/specs/orbit-conventions/spec.md` — `No-chaining contract`, `Residual outward-actions rule`
- `orbit/specs/orbit-lifecycle-consent/spec.md` — `Invocation-provenance rule`, `Consent prompts at consent-marked seams`, `Consent recorded in consent-scoped lifecycle emits`
- `src/core/project-config.ts` — the existing settings and their resolvers
- `src/core/artifact-graph/instruction-loader.ts`, `src/core/artifact-graph/gates.ts` — where a change's next command is computed (Case 2)
