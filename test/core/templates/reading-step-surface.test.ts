/**
 * decision-reading, task 4.4: the reading step on the generated surface (`orbit-review`'s `The reading
 * step checks decision records in system review`), the walk's replacement rule in the address-reviews
 * body (`orbit-decision-records`' `A record is fixed by a replacement, never edited`), and `replaces` in
 * the shared decision-records reference. Each file is composed exactly as the generator composes it.
 */
import { describe, it, expect } from 'vitest';
import { getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';
import { DECISION_RECORDS_REFERENCE } from '../../../src/core/disciplines.js';
import { READER_ROWS, READER_SEVERITY_RULE } from '../../../src/core/decision-records.js';

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

const review = skill('orbit-review');
const passes = review.ref('passes-system.md');
const step = passes.slice(passes.indexOf('#### The reading step'), passes.indexOf('##### `--fast` subset'));

describe("orbit-review: The reading step checks decision records in system review (generated surface)", () => {
  // @scenario text orbit-review :: The reading step checks decision records in system review :: The reading runs on a change with records
  it('the system-pass reference carries the step: render the brief, dispatch a clean reader, fold, record the read list', () => {
    expect(step.length).toBeGreaterThan(0);
    expect(step).toContain('`orbit decisions brief <change-name>`');
    expect(step).toMatch(/Spawn a clean-context subagent[^\n]*never a fork/);
    expect(step).toContain('`pass: "reading"`');
    expect(step).toContain('`dimension: "coherence"`');
    expect(step).toMatch(/List `reading` in `passes_run` and every filename of the brief's `selected` list in `decision_records_read`/);
    // The four reader rows and the severity rule, as the engine's constants word them.
    for (const row of READER_ROWS) expect(step).toContain(row.replace(/^a /, ''));
    expect(step).toContain(READER_SEVERITY_RULE.replace(/^A record/, 'a record'));
    // The body's pass step and its payload list name the step too.
    expect(review.body).toMatch(/system \(0–6, plus the reading step on the in-context pass whenever `orbit decisions brief <name>` selects records\)/);
    expect(review.body).toContain('`decision_records_read` (in-context system pass only');
  });

  // @scenario text orbit-review :: The reading step checks decision records in system review :: The reader's brief carries no path
  it("the reader's prompt is the brief verbatim and nothing else", () => {
    expect(step).toMatch(/whose prompt is the brief's markdown output VERBATIM and nothing else: no file to open, no finding title, no pass token, no word of your own/);
  });

  // @scenario text orbit-review :: The reading step checks decision records in system review :: The reading runs with no perspectives defined
  it('the step runs regardless of perspectives and under --fast', () => {
    expect(step).toMatch(/not part of Pass 4[^\n]*whether or not `orbit\/lenses\/perspectives\.md` exists and at every depth, `--fast` included/);
    expect(passes).toMatch(/The reading step runs under `--fast` too, on the in-context pass, whenever records are selected\./);
  });

  it('the step is in-context only, skips by listing itself in passes_skipped, and is scored under Coherence', () => {
    expect(step).toMatch(/IN-CONTEXT pass only: never on a fresh pass[^\n]*or an external one/);
    expect(step).toMatch(/list `reading: <reason>` in `passes_skipped`, put the command's error in `commentary`/);
    expect(step).toMatch(/When no subagent can be dispatched, run no reader and skip as above/);
    expect(passes).toMatch(/\| \*\*Coherence\*\* \|[^\n]*the reading step \(`pass: "reading"`\) \|/);
  });
});

describe("orbit-decision-records: A record is fixed by a replacement, never edited (generated surface)", () => {
  const walk = skill('orbit-address-reviews').body;

  // @scenario text orbit-decision-records :: A record is fixed by a replacement, never edited :: Several fixes to one record make one replacement
  it('the walk writes one replacement per record, records it in its sweep, and defers a brief gap', () => {
    expect(walk).toMatch(/Write ONE replacement per record however many findings you resolve on it, holding all of their fixes/);
    expect(walk).toMatch(/its `sweep` records the replacement's path and a phrase of its new wording under `introduced`, and the replaced record under `kept`/);
    expect(walk).toMatch(/gap in the BRIEF[^\n]*resolved `deferred` against `orbit-decision-records`' `The reading step's brief is rendered by orbit`/);
    expect(walk).toMatch(/cites the wrong thing[^\n]*escalate it/);
  });

  it('the shared reference documents replaces on all three records, and the fixing rule', () => {
    expect(DECISION_RECORDS_REFERENCE.match(/^- `replaces` — optional; the filename/gm)).toHaveLength(3);
    expect(DECISION_RECORDS_REFERENCE).toContain('## Fixing a record');
    expect(DECISION_RECORDS_REFERENCE).toMatch(/One replacement carries every fix to one record/);
    expect(DECISION_RECORDS_REFERENCE).toMatch(/carries the old record's link fields unchanged \(a ledger entry's `area`, `relies_on` and `raised_stop`; a stop's `condition`; a resolution's `stop`\)/);
  });
});
