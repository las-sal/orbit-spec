import { describe, it, expect } from 'vitest';
import {
  parseTouchpoints,
  targetMatches,
  isPredicted,
  entrySatisfied,
} from '../../../src/core/parsers/touchpoints.js';

const design = `# Design

## D1 — Something

Prose.

## Touchpoints

(The predicted map.)

- \`src/cli/index.ts\` — registration; flags.
- \`src/commands/\` — new emit command module.
- \`src/core/templates/workflows/*.ts\` — the body-economy pass.
- \`src/core/orientation.ts\` + \`src/core/artifact-graph/gates.ts\` — boot render; vocabulary.
- \`src/core/config.ts\` (or the existing config loader) — models map.
- plain prose entry with no code span
- \`test/\` — suites.

## D2 — After

- \`not/an/entry.ts\` outside the section
`;

describe('parseTouchpoints (the entry grammar)', () => {
  it('parses exact / prefix / glob / grouped entries; prose tails are annotation', () => {
    const p = parseTouchpoints(design);
    expect(p.present).toBe(true);
    expect(p.entries.map(e => e.targets)).toEqual([
      ['src/cli/index.ts'],
      ['src/commands/'],
      ['src/core/templates/workflows/*.ts'],
      ['src/core/orientation.ts', 'src/core/artifact-graph/gates.ts'],
      ['src/core/config.ts'],
      ['test/'],
    ]);
  });

  it('a list item with no leading code span is malformed (excluded, line-cited)', () => {
    const p = parseTouchpoints(design);
    expect(p.malformed).toHaveLength(1);
    expect(p.malformed[0].text).toContain('plain prose entry');
  });

  it('entries outside the section never parse; absent section reports present: false', () => {
    const p = parseTouchpoints(design);
    expect(p.entries.some(e => e.targets.includes('not/an/entry.ts'))).toBe(false);
    expect(parseTouchpoints('# D\n\n- `a.ts`\n').present).toBe(false);
  });

  it('non-repo-relative targets are malformed: absolute, parent-resolving, backslash, and ./ forms', () => {
    const bad = [
      '`/abs/path.ts`',
      '`../up.ts`',
      '`src/../sneaky.ts`',
      '`C:\\win\\path.ts`',
      '`./dotted.ts`',
    ];
    const content = '## Touchpoints\n\n' + bad.map(b => `- ${b} — x.`).join('\n') + '\n- `src/ok.ts` — fine.\n';
    const p = parseTouchpoints(content);
    expect(p.entries.map(e => e.targets)).toEqual([['src/ok.ts']]);
    expect(p.malformed).toHaveLength(bad.length);
  });
});

describe('matching semantics', () => {
  it('exact, directory-prefix, and single-segment glob matching', () => {
    expect(targetMatches('src/cli/index.ts', 'src/cli/index.ts')).toBe(true);
    expect(targetMatches('src/cli/index.ts', 'src/cli/other.ts')).toBe(false);
    expect(targetMatches('src/commands/', 'src/commands/emit.ts')).toBe(true);
    expect(targetMatches('src/commands/', 'src/commandsx/emit.ts')).toBe(false);
    expect(targetMatches('src/core/templates/workflows/*.ts', 'src/core/templates/workflows/review.ts')).toBe(true);
    expect(targetMatches('src/core/templates/workflows/*.ts', 'src/core/templates/workflows/sub/x.ts')).toBe(false);
  });

  it('isPredicted and grouped entrySatisfied compose over the canonical map', () => {
    const p = parseTouchpoints(design);
    expect(isPredicted(p.entries, 'src/commands/emit.ts')).toBe(true);
    expect(isPredicted(p.entries, 'unrelated/file.ts')).toBe(false);
    const grouped = p.entries.find(e => e.targets.length === 2)!;
    expect(entrySatisfied(grouped, ['src/core/artifact-graph/gates.ts'])).toBe(true);
    expect(entrySatisfied(grouped, ['nope.ts'])).toBe(false);
  });
});

describe('parseTouchpoints fence grammar (rc10 system walk)', () => {
  it('a three-backtick line inside a four-backtick fence does not close it', () => {
    const design = '# Design\n\n````markdown\n```\n## Touchpoints\n- `fake.ts` — inside the example\n````\n\n## Touchpoints\n\n- `src/real.ts` — the real entry\n- `src/second.ts` — a second\n';
    const p = parseTouchpoints(design);
    expect(p.present).toBe(true);
    expect(p.entries.map(e => e.targets)).toEqual([['src/real.ts'], ['src/second.ts']]);
  });
});
