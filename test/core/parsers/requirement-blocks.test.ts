import { describe, it, expect } from 'vitest';
import {
  computeFenceMask,
  extractRequirementsSection,
  parseDeltaSpec,
} from '../../../src/core/parsers/requirement-blocks.js';

describe('requirement-blocks — fence-aware parsing', () => {
  it('computeFenceMask masks lines inside nested same-length fences', () => {
    const lines = [
      'outside',        // 0
      '```markdown',    // 1 open (info)
      '## Repo',        // 2 inside
      '```markdown',    // 3 nested open (info)
      '## CRITICAL',    // 4 inside (nested)
      '```',            // 5 close nested
      '## still-in',    // 6 inside (outer)
      '```',            // 7 close outer
      'outside-again',  // 8
    ];
    const mask = computeFenceMask(lines);
    expect(mask[0]).toBe(false);
    expect(mask[2]).toBe(true);
    expect(mask[4]).toBe(true);
    expect(mask[6]).toBe(true);
    expect(mask[8]).toBe(false);
  });

  it('extractRequirementsSection includes requirements AFTER a fenced ## in a prior requirement body', () => {
    const spec = [
      '# Cap Specification',
      '',
      '## Purpose',
      'x',
      '',
      '## Requirements',
      '',
      '### Requirement: First',
      'Body with an embedded prompt template:',
      '',
      '```markdown',
      '## Repo',
      '## CRITICAL',
      '### Requirement: NOT a real requirement (inside fence)',
      '```',
      '',
      '#### Scenario: s',
      '- **WHEN** x',
      '- **THEN** y',
      '',
      '### Requirement: Second',
      'Body two.',
      '',
      '#### Scenario: s2',
      '- **WHEN** a',
      '- **THEN** b',
      '',
    ].join('\n');
    const parts = extractRequirementsSection(spec);
    const names = parts.bodyBlocks.map(b => b.name);
    expect(names).toEqual(['First', 'Second']); // the fenced "### Requirement:" is NOT a block
  });

  it('parseDeltaSpec parses a MODIFIED requirement whose body contains a fenced ## without truncating', () => {
    const delta = [
      '## MODIFIED Requirements',
      '',
      '### Requirement: Alpha',
      'Alpha body with a fenced template:',
      '',
      '```markdown',
      '## CRITICAL',
      '## WARNING',
      '```',
      '',
      '#### Scenario: a',
      '- **WHEN** x',
      '- **THEN** y',
      '',
      '### Requirement: Beta',
      'Beta body.',
      '',
      '#### Scenario: b',
      '- **WHEN** x',
      '- **THEN** y',
      '',
    ].join('\n');
    const plan = parseDeltaSpec(delta);
    const names = plan.modified.map(m => m.name);
    expect(names).toEqual(['Alpha', 'Beta']);
    // Alpha's raw must retain the full fenced body (not truncated at the in-fence '## ')
    const alpha = plan.modified.find(m => m.name === 'Alpha')!;
    expect(alpha.raw).toContain('## WARNING');
    expect(alpha.raw).toContain('#### Scenario: a');
  });
});
