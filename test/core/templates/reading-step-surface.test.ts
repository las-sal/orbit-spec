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
    expect(step).toMatch(/Run `orbit decisions brief <change-name> --json` ONCE and keep its output: its `markdown` is the brief you dispatch and its `selected` is the read list you record, both from that one run/);
    expect(step).toMatch(/Spawn a clean-context subagent[^\n]*never a fork/);
    expect(step).toContain('`pass: "reading"`');
    expect(step).toContain('`dimension: "coherence"`');
    expect(step).toMatch(/List `reading` in `passes_run` and every filename of that same run's `selected` list in `decision_records_read` — never from a second run of the command/);
    // The four reader rows and the severity rule, as the engine's constants word them.
    for (const row of READER_ROWS) expect(step).toContain(row.replace(/^a /, ''));
    expect(step).toContain(READER_SEVERITY_RULE.replace(/^A record/, 'a record'));
    // The body's pass step and its payload list name the step too.
    expect(review.body).toMatch(/system \(0–6, plus the reading step on the in-context pass whenever `orbit decisions brief <name>` selects records\)/);
    expect(review.body).toContain('`decision_records_read` (in-context system pass only');
  });

  // @scenario text orbit-review :: The reading step checks decision records in system review :: The reader's brief carries no path
  it("the reader's prompt is the brief verbatim and nothing else", () => {
    expect(step).toMatch(/whose prompt is that run's `markdown` VERBATIM and nothing else: no file to open, no finding title, no pass token, no word of your own/);
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

  // @scenario text orbit-decision-records :: A record is fixed by a replacement, never edited :: Several fixes to one record make a chain
  it('the walk writes one replacement per resolved finding, of the latest in the chain, records it in its sweep, and defers a brief gap', () => {
    expect(walk).toMatch(/Each finding you resolve writes its OWN replacement, of the LATEST record in the record's chain/);
    expect(walk).toMatch(/its `sweep` records the replacement's path and a phrase of its new wording under `introduced` — a phrase free of double quotes, backslashes and line breaks[^\n]* — and the record the replacement replaces under `kept`/);
    expect(walk).toMatch(/its `replaces` naming the LATEST record of the chain — the record the finding named, until a replacement of it exists —/);
    expect(walk).toMatch(/The entry's `file` stays the record the finding named, and its/);
    expect(walk).toMatch(/gap in the BRIEF[^\n]*resolved `deferred` against `orbit-decision-records`' `The reading step's brief is rendered by orbit`/);
    expect(walk).toMatch(/cites the wrong thing[^\n]*escalate it/);
  });

  it('the shared reference documents replaces on all three records, and the fixing rule', () => {
    expect(DECISION_RECORDS_REFERENCE.match(/^- `replaces` — optional; the filename/gm)).toHaveLength(3);
    expect(DECISION_RECORDS_REFERENCE).toContain('## Fixing a record');
    expect(DECISION_RECORDS_REFERENCE).toMatch(/Replace the LATEST record of a chain/);
    expect(DECISION_RECORDS_REFERENCE).toMatch(/carries the old record's link fields unchanged \(a ledger entry's `area`, `relies_on` and `raised_stop`; a stop's `condition`; a resolution's `stop`\)/);
  });
});
