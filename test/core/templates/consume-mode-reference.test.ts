import { describe, expect, it } from 'vitest';
import { getOrbitProposeSkillTemplate } from '../../../src/core/templates/skill-templates.js';

/**
 * cut-propose-archive (P1, task 5.3): propose's consume mode is its `references/consume-mode.md`, read when mode detection
 * resolves consume. The scenarios of `orbit-propose-modifications`' `Validate explore.md structure before consuming` and
 * `Mechanism section consumption` are carried out by the session reading that reference, so each is declared here by the
 * text it reads: the clause of Step 0a, the row of Step 0c.6's table, or the record sentence that states the THEN.
 * (The table's byte-equality with the owner's is `orbit-content-fidelity`'s rc13c block.)
 */
const consume = getOrbitProposeSkillTemplate().references!.find((r) => r.name === 'consume-mode.md')!.content;
const step = (heading: string, next: string): string => consume.slice(consume.indexOf(heading), consume.indexOf(next));
const step0a = step('### Step 0a', '### Step 0b');
const step0c6 = step('### Step 0c.6', '### Step 0d');
/** The row of Step 0c.6's table numbered `n`. */
const row = (n: number): string => {
  const line = step0c6.split('\n').find((l) => l.startsWith(`| ${n} |`));
  expect(line, `row ${n}`).toBeDefined();
  return line!;
};
const record = step0c6.slice(step0c6.indexOf('**The record.**'), step0c6.indexOf('**Before Step 0d**'));

describe('consume mode: the structure check (Step 0a)', () => {
  // @scenario text orbit-propose-modifications :: Validate explore.md structure before consuming :: All listed sections present
  it('every listed section present: proceed normally', () => {
    expect(step0a).toContain('- **All listed sections present** → proceed normally.');
  });

  // @scenario text orbit-propose-modifications :: Validate explore.md structure before consuming :: Missing section warning
  it('a missing section warns and prompts proceed-anyway, proceeding by default', () => {
    expect(step0a).toContain('- **Missing one or more sections** → warn the user naming the missing sections; prompt via `AskUserQuestion` to confirm proceed-anyway (default: proceed).');
  });

  // @scenario text orbit-propose-modifications :: Validate explore.md structure before consuming :: Mechanism section absent
  it('an absent Mechanism section warns like any other and makes every live rule UNACCOUNTED, state absent', () => {
    expect(step0a).toContain('An absent `## Mechanism` section is a format note like any other — and on proceed, every live rule is UNACCOUNTED (state `absent`) in the record Step 0c.6 writes.');
  });

  // @scenario text orbit-propose-modifications :: Validate explore.md structure before consuming :: Malformed file
  it('a file that cannot be read or parsed halts with a clear error', () => {
    expect(step0a).toContain('- **Cannot read or parse** → halt with a clear error; user fixes and re-invokes.');
  });
});

describe('consume mode: the Mechanism carry (Step 0c.6)', () => {
  it('rows are tested in order, first match wins, and the key-defect row is tested first', () => {
    expect(step0c6).toContain('rows tested IN ORDER, first match wins');
    expect(row(1)).toContain('any, or none — tested FIRST');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A BOUNDED entry's residual travels to spec text with a design pointer
  it('row 5: a BOUNDED entry\'s two slot lines go verbatim into the requirement, with one Risks entry pointing at it', () => {
    expect(row(5)).toContain('accounted, `Closure: BOUNDED`');
    expect(row(5)).toContain('`Residual kind:` and `Residual method:` VERBATIM in that requirement\'s text as a named limit');
    expect(row(5)).toContain('ONE `design.md` Risks entry naming the rule ID and POINTING at the requirement, restating nothing');
    expect(record).toContain('its destination as a requirement title');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A CLOSED entry informs the requirement it derives
  it('row 4: a DERIVED or SOURCED entry lands in the requirement it derives, as one of the four shapes, the record saying which', () => {
    expect(row(4)).toContain('accounted, `Closure: DERIVED` or `SOURCED`');
    expect(row(4)).toContain('the domain table as one of the CLOSED shapes below, the `Closure:` justification as the sentence naming the source');
    expect(step0c6).toContain('Which shape fits is your judgement; the record says which was chosen.');
    expect(record).toContain('(plus the shape, for CLOSED entries');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A non-live owner is history
  it('row 2: an entry whose owner is not a live rule is history, not carried, and explore.md travels unchanged', () => {
    expect(row(2)).toContain('NOT a live rule (`Kind: fact` / `scope`, or `Disposition: superseded` / `assigned`)');
    expect(row(2)).toContain('nowhere — permitted history; `explore.md` travels unchanged; the record lists it as not carried');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: An unaccounted live rule is recorded, never blocking
  it('row 3: an open live rule gets one Risks entry with its state word, no spec text, and never blocks', () => {
    expect(row(3)).toContain('OPEN — in `rules_open` (any state that field defines, whatever `Closure:` token the entry carries)');
    expect(row(3)).toContain('UNACCOUNTED: ONE `design.md` Risks entry naming the rule as the readout names it — the ID, or `line N` for an ID-less entry');
    expect(row(3)).toContain('the spec delta carries nothing for it; never blocking');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A BOUNDED entry missing a slot is unaccounted, not a residual
  it('a BOUNDED entry missing a slot fails the grammar, so row 3 applies and row 5 (both slots, by construction) does not', () => {
    expect(step0c6).toContain('the two residual slots present exactly when BOUNDED');
    expect(step0c6).toContain('An entry failing ANY clause, or no entry, is OPEN');
    expect(row(5)).toContain('(both residual slots present, by construction)');
    expect(row(3)).toContain('whatever `Closure:` token the entry carries');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A malformed entry on a non-live owner is history
  it('row 2 applies to a non-live owner whatever its entry\'s form, with no state word', () => {
    expect(row(2)).toContain('any — an entry or none, well-formed or not');
    expect(row(2)).toContain('with NO state word (the engine assigns none to a non-live owner)');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A duplicate-ID entry is a key defect before it is anything else
  it('row 1, tested first: a second entry under a used ID is a key defect, reported, excluded from rules_total, not carried', () => {
    expect(row(1)).toContain('a second entry or heading under an already-used ID');
    expect(row(1)).toContain('no carrier — a key with no owner has nowhere to land, and a duplicate is excluded from `rules_total`');
    expect(row(1)).toContain('reported in chat at the Mechanism read');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: An orphan Mechanism entry has a record row and no carrier
  it('row 1: an orphan gets the record row ID plus line N / orphan / owner none / destination none', () => {
    expect(row(1)).toContain('an orphan entry whose heading ID matches no Decisions entry');
    expect(row(1)).toContain('Its record row: the heading\'s ID plus `line N`, the defect kind (`orphan` / `duplicate`) in the state column, owner `none` (orphan)');
    expect(row(1)).toContain('destination `none`');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: A duplicate Mechanism heading has a record row naming the second claim
  it('row 1: a second heading under a used ID gets owner duplicate, destination none', () => {
    expect(row(1)).toContain('or `duplicate` (a second claim on an owned ID), destination `none`');
    expect(record).toContain('its owner\'s state (`none` for an orphan; `duplicate` for a second claim)');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: Accounted is decidable from the file alone
  it('accounted is decided from the file by the grammar, a table with no member row being OPEN', () => {
    expect(step0c6).toContain('and you decide that from the FILE, by the grammar mirrored under Step 0b');
    expect(step0c6).toContain('a `Domain:` line and a table with at least one member row');
    expect(step0c6).toContain('name the failing clause in the record\'s state column');
  });

  // @scenario text orbit-propose-modifications :: Mechanism section consumption :: No prior emit is read as a cross-check
  it('no prior explore emit is read or fired; the record\'s header names the file reading as its only source', () => {
    const step0b = step('### Step 0b', '### Step 0c —');
    expect(step0b).toContain('Read NO prior explore emit as a source or cross-check');
    expect(step0b).toContain('and fire none');
    expect(record).toContain('a header line reading "the proposing AI\'s reading of the file; no engine record" — always that sentence');
  });
});
