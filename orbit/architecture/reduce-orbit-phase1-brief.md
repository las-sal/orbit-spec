# orbit: Skill Structural Cleanup

Nov 16, 2026 · Sal · Brief for the architect session

Measured on orbit-spec at commit `b5dac0dd`, with skills installed by `orbit init --tools claude`. "Body" means a skill's `SKILL.md`, which loads whenever the workflow runs. "Reference" means a file under the skill's `references/`, which loads only when the body tells the agent to read it.

## 1. The proposal

Cut skill bodies by moving text that a session rarely needs out of the body and into references, without changing what any workflow does. No rewording of instructions and no change to the engine's behaviour.

- **Now:** 15 skill bodies, 434,449 characters. Up 14% in five days.
- **After the structural moves in section 4 (stages A to C):** about 345,000 characters, a 21% cut.
- **With stage D, which needs evidence first:** about 295,000, a 32% cut.

This returns the bodies to roughly where they were in early November. It does not reach the 283,000 of 30 July or the 225,000 of 12 September. Getting below that means moving mechanical steps into the engine, which is program P2 and not this work.

## 2. Where the size is

**Shared blocks.** 19% of all body text (83,435 characters) is lines copied verbatim between skills. Four shared blocks were added between 8 and 13 November by the automate-dev-flow program, each composed once in `src/core/disciplines.ts` and interpolated into every carrying body.

| Block | Bodies | Each | Total | Share | Runs when |
| --- | --- | --- | --- | --- | --- |
| Execution disciplines | 14 | 3,918 | 54,852 | 12.6% | Always. The decision-writing bullet alone is 2,837 |
| Sign-off hold and brief | 3 | varies | 23,904 | 5.5% | Hold only when `signoff` is set; the brief save always runs |
| Run-summary emit detail | 11 | varies | 21,634 | 5.0% | Once, at the session's close |
| Commit step | 6 | 3,504 | 21,024 | 4.8% | Only when `commit: true`; `action: off` at defaults |
| Chain end step | 5 | 3,696 | 18,480 | 4.3% | Only when `chain` is set; `configured: false` at defaults |
| Account step | 2 | 4,036 and 4,656 | 8,692 | 2.0% | Once per change, when apply completes |
| PR lifecycle | 4 | varies | 7,734 | 1.8% | Only when the `pr:` regime is on |
| Guardrails | 8 | varies | 3,885 | 0.9% | Restates the steps above it |

**Per skill, now and after stages A to C.**

| Skill | Now | After | Cut |
| --- | --- | --- | --- |
| address-reviews | 56,518 | 43,933 | 22% |
| explore | 49,935 | 47,823 | 4% |
| review | 48,241 | 41,381 | 14% |
| archive-change | 47,379 | 36,616 | 23% |
| propose | 43,926 | 34,199 | 22% |
| apply-change | 31,793 | 16,923 | 47% |
| bulk-archive-change | 26,687 | 19,900 | 25% |
| architect | 24,599 | 14,188 | 42% |
| onboard | 22,444 | 22,444 | 0% |
| audit-drift | 21,546 | 20,400 | 5% |
| ff-change | 19,562 | 10,358 | 47% |
| verify-change | 15,307 | 14,041 | 8% |
| continue-change | 10,649 | 8,979 | 16% |
| sync-specs | 8,637 | 7,674 | 11% |
| new-change | 7,226 | 6,072 | 16% |
| **Total** | **434,449** | **344,931** | **21%** |

Apply matters most. Its body is re-read on every model call, and an apply session makes 57 to 203 calls. Halving it removes roughly 3,700 tokens from each of those calls (estimated at four characters per token).

Explore and onboard barely move. Their text is their own, not shared, so they need a section-by-section inventory (spike S12) and are outside this cleanup.

## 3. Rules for what stays in a body

1. **The trigger stays; the procedure moves.** The body keeps when a step runs, who never runs it, the command to call, and what to do on the default result. Everything else goes to a reference.
2. **The engine's output picks the branch.** A step moves out only when a command's result tells the agent whether the detail is needed. The agent then never has to judge whether to read the reference.
3. **One home for each text.** A reference carries the full text byte-equal to today's wording, composed once in code as now.
4. **No rewording in this work.** Shortening sentences is a separate change that waits for the replay set (S15).

orbit's own rules already allow this. The no-chaining requirement in `orbit-conventions` permits "an epitome of one bullet per discipline with procedural detail moved to the step that uses it", with the full text keeping one home. The PR layer already works this way (`pr-choreography.md`, `pr-archive-tail.md`, `pr-resolution.md`), and so does the run-summary schema in review, address-reviews and audit-drift.

## 4. The moves

### Stage A: stub the steps that do nothing at default settings

Saves 54,485 characters (12.5%). Behaviour is preserved by construction: at defaults the stub handles the result inline and the reference is never opened; with the setting on, the agent reads the same text it reads today, one file read later.

| Move | Source | Saves |
| --- | --- | --- |
| Commit step → stub + `references/commit-step.md` | `COMMIT_STEP`, `src/core/disciplines.ts` line 121 | 17,652 |
| Chain end step → stub + `references/chain-end-step.md` | `CHAIN_END_STEP`, line 90 | 16,230 |
| Sign-off hold → stub + `references/signoff-hold.md` | architect 5.4; archive 3.7; bulk-archive hold and unsigned row | 15,356 |
| PR lifecycle sections → stubs pointing at the PR references that already exist | propose, ff-change, bulk-archive-change, architect 5.5 | 5,247 |

What a stub looks like, for the commit step (452 characters, against 3,504):

```
## Commit step

Runs in the invoking session only, never in a dispatched worker, after the
run summary and before the position readout; in apply, once at the session's
close. Skip it when there is no change target or this invocation's PR layer
has already stopped. Otherwise run `orbit pr commit "<name>" --json`.
On `action: off`, print nothing and go on. On any other result, read
`references/commit-step.md` and follow it before doing anything else.
```

Two things to settle in design:

- **The brief save is not gated.** It runs under every setting and shares sections with the sign-off hold. The two have to be separated so only the hold moves.
- **A chained arrival must know what the prompt tags mean.** The meaning of `(chain: routine, default: …)` and the other tags lives in the chain end step. If each phase runs in a fresh headless session (R-adf-8), the arriving session has not read it. Either the tag meaning stays in the body as one short paragraph, or the arriving body is told to read the reference when it was started by a chain.

### Stage B: move once-per-session detail to references

Saves about 21,700 characters (5%).

| Move | Source | Saves | Why it is safe |
| --- | --- | --- | --- |
| Run-summary payload detail → `references/run-summary-schema.md` in the nine skills that still carry it inline | Emit sections; apply's is the largest at 5,704, archive's 3,776 | 14,244 | The engine refuses a bad payload and names the field; `orbit-emit-composition` already tests payload tables against schema references |
| Account step → stub + `references/account-step.md` | `ACCOUNT_STEP`, `ACCOUNT_WALK_STEP` | 7,496 | Runs at most once per change, at a moment the body can name exactly |

The account step is the less certain of the two: nothing in the engine prompts for an account, so the body's trigger has to carry it alone. Check whether the apply gate could report "account missing" before moving it.

### Stage C: tighten what stays

Saves about 15,000 characters (3.5%).

| Move | Saves | Note |
| --- | --- | --- |
| Restructure the decision-writing bullet into labelled sub-bullets | 9,408 | Same content, 2,837 to about 2,160 per body |
| Remove Guardrails sections that restate the steps | 3,885 | Keep any line that says something the steps do not |
| Strip provenance from bodies: stage tags, ruling ids, `CHECKED MIRROR` notes, owning-spec citations in headings | about 4,000 after overlap with A and B | The mapping from text to spec lives in tests and `@scenario` tags, not in what the agent reads |
| Trim the address-reviews description from 1,140 to about 200 characters | small | Descriptions load in every session, whether or not the skill runs |

### Stage D: larger cuts that need evidence first

Worth about 50,000 more (11%). Each changes what the agent sees on a path that runs under default settings, so none is safe by construction.

| Move | Saves | Needs |
| --- | --- | --- |
| Mode-only sections → references: review's verification-genre step (5,945), fresh-pass dispatch (4,521) and architecture mode (1,818); archive's consent at entry (4,735), user-validation closure (3,377) and gate inflection prompt (3,689); propose's mechanism section (4,927) and size brief (2,418) | about 26,000 | A crisp trigger for each; the replay set (S15) |
| Decision-writing as a true one-bullet epitome, with the detail in `decision-records.md`, which already ships beside all 14 skills | about 24,000 beyond stage C | S15. This discipline applies on every call, so it is the riskiest move here |
| Fold ff-change into propose and bulk-archive into archive as thin bodies (ff shares 55% of its lines) | not sized | A design decision, not a measurement |
| Have the engine print readouts in place of the 107 fenced output templates (34,145) | not sized | Belongs to P2 |

## 5. What must change in orbit's own specs and tests

The cleanup is not a refactor. Three requirements pin the current text into bodies and need MODIFIED deltas.

| Requirement (`orbit-conventions`) | Says today | Change |
| --- | --- | --- |
| The commit step closes each carrying body | Each body carries `COMMIT_STEP` byte-equal | Each body carries the stub byte-equal; the reference carries the full text byte-equal |
| No-chaining contract | Chain end step in the body | Same split. The epitome clause already allows it |
| Decision-writing discipline | Carried byte-equal in every body's epitome | Stage C changes the pinned form; stage D moves the detail |

Tests that pin these blocks and will change with them:

- `test/core/templates/commit-step.test.ts`, `test/core/pr/commit-step.test.ts`
- `test/core/templates/chain-prompt-tags.test.ts`
- `test/core/templates/account-step.test.ts`
- `test/core/decision-writing-parity.test.ts`
- `test/core/templates/signoff-hold-step.test.ts`, `program-signoff-step.test.ts`, `brief-save-step.test.ts`
- `test/core/templates/skill-templates-parity.test.ts`, which pins a hash of each body
- `test/core/templates/orbit-content-fidelity.test.ts`, `orbit-generated-surface.test.ts`
- The four parity suites that assert `CHECKED MIRROR` markers (stage C only)

`@scenario text` tags assert that wording appears in a body. Where the wording moves, the assertion must follow it to the reference. The capabilities with the most text scenarios are orbit-address-reviews (49), orbit-archive-modifications (36), orbit-conventions (31), orbit-review-external (27) and orbit-review (26).

No change is needed to `orbit-skill-generation`: multi-file emission, reference-name validation and convergence on update already cover new references.

## 6. Stopping the growth

The cleanup is undone in a month unless something checks size. Nothing does today.

1. **A size report.** A script or `orbit` developer command that prints each skill's body and reference sizes. Run in CI and print the change against main.
2. **A budget test.** Each body has a recorded ceiling, set at its post-cleanup size plus 5%. Raising a ceiling is an edit to the test, in the same spirit as the hash pin in `skill-templates-parity`: a conscious act.
3. **A rule for new steps**, added to `orbit-conventions`: a step that does nothing at default settings ships as a stub and a reference. The automate-dev-flow stages still to come would otherwise add more to every body.

## 7. How to verify

| Stage | Proof |
| --- | --- |
| A | At default config, show each gating command returns the result the stub handles inline (`action: off`, `configured: false`, `why: "off"`). With each setting on, one real run per step, checking the trail shows the reference was read and the step acted as before. References diff byte-equal against today's block text |
| B | Count refused emits before and after over a normal week. One change taken through apply to confirm an account is written |
| C | Tests only; no wording an agent acts on is removed |
| D | The replay set (S15), several runs each, graded by orbit's computed facts |

Also run Claude Code's `/doctor` on the result (S2) and compare its findings with the list here.

## 8. Not in this work

- Rewording instructions or breaking up long sentences (about 6% more; waits for S15).
- Moving mechanical steps into the engine (P2).
- De-duplicating references on disk. `decision-records.md` is copied into 14 skills, but a reference costs nothing until it is read.
- Explore and onboard.

## 9. Questions for the architect session

1. **Scope.** One program with a change per stage, or stage A alone first? Stage A gives 12.5% with the least risk and touches two requirements.
2. **Byte-equal carriage.** Is it acceptable for a requirement that says "carried byte-equal by each body" to be met by a stub in the body and the full text in a reference?
3. **Who directs the read.** Should the stub tell the agent to read the reference, or should the engine's output name it (for example `orbit pr commit --json` returning the reference path when `action` is not `off`)? The second is a sensor; the first is one more instruction.
4. **Stubs or config-matched bodies.** `orbit update` could generate bodies that contain a step only when its setting is on. That costs nothing when off, but makes a body depend on config and adds a regeneration step when config changes.
5. **Chained arrivals.** How does a session started by a chain learn what the prompt tags mean, once that text is in a reference?
6. **Decision-writing.** Restructure only (stage C), or a true epitome with the detail in `decision-records.md` (stage D)?
7. **Budget.** Post-cleanup size plus 5% per body, or a single ceiling for all bodies?
8. **automate-dev-flow.** Should its remaining stages wait until the stub pattern and the budget test are in place?
9. **Reloading.** Does reading the same reference twice in one session add it to context twice (S9)? If so, chained sessions pay for the chain reference at each step.

## Appendix: reproducing the numbers

```
git clone https://github.com/las-sal/orbit-spec && cd orbit-spec && npm ci && npm run build
mkdir /tmp/proj && cd /tmp/proj && node <repo>/bin/orbit.js init --tools claude --force .
wc -c .claude/skills/*/SKILL.md                 # body sizes
wc -c .claude/skills/*/references/*.md          # reference sizes
```

Shared-block sizes come from the string constants exported by `dist/core/disciplines.js`. The "after" column replaces each block with a stub of the size shown in section 4 and leaves everything else untouched.
