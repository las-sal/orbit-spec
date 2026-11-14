/**
 * program-brief, task 3.4: a reading finding against the ACCOUNT on the generated surface — the review's fold step
 * gives it the account's path (`orbit-review`'s `The reading step checks decision records in system review`), and the
 * walk resolves it by a replacement of the latest account, one per finding, written in a walk that reopens tasks too
 * (`orbit-decision-records`' `Each change carries one account, written when apply is complete` and `The reader takes the
 * account only when sign-off is per change`). Each file is composed exactly as the generator composes it.
 */
import { describe, it, expect } from 'vitest';
import { getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { ACCOUNT_WALK_STEP } from '../../../src/core/disciplines.js';

function skill(dirName: string): { body: string; ref: (name: string) => string } {
  const entry = getSkillTemplates().find(s => s.dirName === dirName);
  if (!entry) throw new Error(`no skill ${dirName}`);
  return {
    body: generateSkillContent(entry.template, 'test'),
    ref: (name: string) => {
      const r = (entry.template.references ?? []).find(x => x.name === name);
      if (!r) throw new Error(`${dirName} ships no references/${name}`);
      return r.content;
    },
  };
}

const passes = skill('orbit-review').ref('passes-system.md');
const step = passes.slice(passes.indexOf('#### The reading step'), passes.indexOf('##### `--fast` subset'));
const walk = skill('orbit-address-reviews').body;

describe('the review fold step names the account path', () => {
  // @scenario text orbit-review :: The reading step checks decision records in system review :: An account alone is read under `change`
  it("a reader finding's file is the record's path under decisions/ for a decision record, under account/ for an account", () => {
    expect(step).toContain(
      "its `file` the path of the record the reader named — that filename in the change trail's `decisions/` folder for a decision record, or in its `account/` folder for an account (`account-<TS>.json`, which the selection takes only under `signoff: change`)"
    );
    expect(step).toContain("its latest account, which the user reads before signing off");
  });
});

describe('the walk resolves a reading finding against the account by a replacement', () => {
  // @scenario text orbit-decision-records :: Each change carries one account, written when apply is complete :: A reading finding against the account writes its own replacement
  it('the reading-finding rule writes one replacement of the latest account per resolved finding, rewording only', () => {
    const at = walk.indexOf('**A reading finding against the ACCOUNT**');
    expect(at).toBeGreaterThan(-1);
    const rule = walk.slice(at, walk.indexOf('\n\n', at));
    expect(rule).toContain('its `file` an account under `.orbit-runs/account/`');
    expect(rule).toContain('`orbit emit account --change <name>` with `replaces` naming the latest account');
    expect(rule).toContain('carrying every field of the latest account with only the wording the finding named changed');
    expect(rule).toContain("Each finding you resolve writes its OWN replacement, of the latest account — the second finding's replacement replaces the first's");
    expect(rule).toContain('it is written even in a walk that resolves another finding by reopening tasks');
    expect(rule).toContain("resolved `deferred` against `orbit-decision-records`' `The reading step's brief is rendered by orbit`");
  });

  it('step 7 carries the exception and the order of a fact-changing replacement after reading replacements', () => {
    expect(walk).toContain(ACCOUNT_WALK_STEP);
    expect(ACCOUNT_WALK_STEP).toContain('The one exception is a reading finding against the account, below: its replacement rewords and states no new fact.');
    expect(ACCOUNT_WALK_STEP).toContain(
      '- **A reading finding against the account resolved** (its `file` under the change\'s account folder, read when the project\'s `signoff` setting is `change`) → write a replacement of the latest account for EACH such finding, at its resolution'
    );
    expect(ACCOUNT_WALK_STEP).toContain('the replacement for that comes after them and replaces the latest');
  });
});
