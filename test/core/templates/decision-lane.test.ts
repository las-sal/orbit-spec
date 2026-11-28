import { describe, it, expect } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';

/**
 * cut-review-walk (task 5.2): the decision lane's scenarios, as the walk skill instructs them. Each scenario's THEN is
 * what a walking session does, so each is declared `text`: the test asserts the instruction that THEN follows from, in
 * the body's Step 3b / 3b.5 and in `references/resolution-detail.md`, which the lane reads (M5).
 */

const t = getSkillTemplates().find((s) => s.dirName === 'orbit-address-reviews')!.template;
const body = t.instructions;
const detail = t.references!.find((r) => r.name === 'resolution-detail.md')!.content;
const classify = body.split('#### 3b. Classify')[1].split('#### 3b.5.')[0];
const lane = body.split('#### 3b.5.')[1].split('#### 3c.')[0];
const step3 = body.split('### 3. Walk each marker')[1].split('#### 3a.')[0];
const detection = detail.split("## The decision lane's detection and recording")[1].split('## Worked example (')[0];
const schema = t.references!.find((r) => r.name === 'run-summary-schema.md')!.content;
const R = 'orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: ';
void R;

describe('the decision lane, as the walk skill instructs it', () => {
  it('the lane reads resolution-detail.md for its detection and recording', () => {
    expect(lane).toContain("read `references/resolution-detail.md` and follow its decision-lane section");
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Numbered-alternative finding briefs with parsed options
  it('a numbered-alternative recommendation is detected heuristically and briefed in prose before any prompt', () => {
    expect(detection).toContain('**Numbered alternatives**: `(A) … (B)`');
    expect(detection).toContain('Record `recommendation_fork.source: "heuristic"`');
    expect(lane).toContain('a FULL-PROSE briefing in chat');
    expect(lane).toContain('The prompt NEVER precedes the briefing');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Structured recommendation_options drive the briefing
  it('a well-formed recommendation_options array is the option set, skipping the heuristic, recorded structured', () => {
    expect(detection).toMatch(/use that array DIRECTLY as the briefing's options\. Skip heuristic\. Record `recommendation_fork\.source: "structured"`/);
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Chat directive ratifies without a prompt
  it('a typed chat direction is the ratification, recorded ratified_via chat', () => {
    expect(lane).toContain('a direction the user types in chat IS ratification');
    expect(detection).toContain('`ratified_via: "chat" | "prompt"` at the ENTRY level');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Closure prompt when the discussion trails off
  it('the closure prompt fires only after a discussion with no crisp directive, defaulting to the conclusion', () => {
    expect(lane).toContain("fired only AFTER the finding's discussion concludes without a crisp user directive (never before the briefing, never mid-discussion), carrying the discussed conclusion as its default option");
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Dismissed prompt re-presents, losing nothing
  it('a dismissed or inconclusive prompt re-presents the finding, losing nothing', () => {
    expect(lane).toContain('A dismissed or inconclusive prompt RE-PRESENTS the finding — the walk position and briefing context are never lost');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Loose "or" in prose does NOT trigger fork
  it('a loose "or" in prose is not a trigger; the finding is still briefed', () => {
    expect(detection).toContain('**NOT triggers** — do NOT fire on loose "or" in prose');
    expect(detection).toContain('the finding STILL gets its full-prose briefing');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Non-disjunctive decision-lane finding briefs without a fork record
  it('with no detection the briefing surfaces 2–4 options in prose, and no recommendation_fork is recorded', () => {
    expect(detection).toContain('with 2–4 concrete options the AI derives from context surfaced IN PROSE');
    expect(detection).toContain('No `recommendation_fork` object is recorded (absence IS the no-fork representation)');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Stale classification short-circuits before the decision lane
  it('a stale finding skips the lane: no briefing, no prompt', () => {
    expect(lane).toContain('Skip this sub-step entirely for `stale` / `trivial fix` / `unresolvable` classifications');
    expect(classify).toContain('**stale** — pushback found the issue already resolved at HEAD: go straight to Step 3e');
    expect(classify).toContain('Neither Step 3b.5 nor the Step 3d cascade fires');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Trivial fix classification short-circuits before the decision lane
  it('a trivial fix skips the lane and applies without a prompt', () => {
    expect(classify).toContain('proceed to 3c without `AskUserQuestion` (chain: not a prompt). Step 3b.5 does NOT fire');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Unresolvable classification short-circuits before the decision lane
  it('an unresolvable finding skips the lane for its own alternatives', () => {
    expect(lane).toContain('they short-circuit straight to 3c');
    expect(classify).toContain('**unresolvable** — it needs information not available now');
    expect(classify).toContain('Alternatives via **AskUserQuestion** (chain: decision)');
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: A delegation compresses the lane; multi-finding prompts never fire
  it('a mid-walk delegation compresses the lane and is recorded; one prompt never spans several findings', () => {
    expect(lane).toContain('one prompt NEVER spans multiple findings (a prompt spanning several findings is prohibited)');
    expect(lane).toContain('**A mid-walk DELEGATION** — an explicit user directive compressing the lane');
    expect(lane).toContain("recorded verbatim in the resolution log's top-level `delegation_directive`");
  });

  // @scenario text orbit-address-reviews :: Disjunctive recommendation fields surface as decision forks :: Malformed `recommendation_options` array falls back to heuristic detection
  it('a malformed array warns on stderr and falls back to the heuristic, recording why', () => {
    expect(detection).toContain('**Malformed structured input** (zero entries, single entry, missing `label` or empty `label`, missing `body` or empty `body`): emit a stderr warning');
    expect(detection).toContain('FALL BACK to heuristic detection over the prose `recommendation`');
    expect(detection).toContain('`recommendation_fork.structured_path_skipped_reason: "<reason>"`');
    expect(detection).toContain('Malformed input never aborts the walk');
  });

  // @scenario text orbit-address-reviews :: Every walk runs finding by finding :: Default invocation walks finding by finding
  it('every walk runs finding by finding, and the log records walk_mode per_finding', () => {
    expect(step3).toContain("**Every walk runs finding by finding**: each marker receives its own complete inner cycle — pushback → classify → resolve per LANE → ripple-cascade → remove-marker — before the next marker's pushback begins");
    expect(schema).toContain('"walk_mode": "per_finding",');
  });
});
