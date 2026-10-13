/**
 * concept-docs task 3.5 (design D4): two scenarios of `orbit-user-docs`' `The migration guide opens with a
 * before-you-move checklist for an OpenSpec 1.x project`, read from the real `docs/migration-guide.md`. The third,
 * "The guide's steps move a 1.14.1 project", is `observed` in `orbit/scenario-ledger.yaml` (design D6).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import MarkdownIt from 'markdown-it';
import { describe, expect, it } from 'vitest';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));
const GUIDE = fs.readFileSync(path.join(REPO, 'docs', 'migration-guide.md'), 'utf-8');
const tokens = new MarkdownIt().parse(GUIDE, {});

/** The tokens from the H3 whose text begins `title` to the next H2 or H3. */
function section(title: string) {
  const start = tokens.findIndex((t, i) => t.type === 'heading_open' && t.tag === 'h3' && tokens[i + 1].content.startsWith(title));
  expect(start, `no '### ${title}' heading`).toBeGreaterThanOrEqual(0);
  const end = tokens.findIndex((t, i) => i > start && t.type === 'heading_open' && (t.tag === 'h2' || t.tag === 'h3'));
  return tokens.slice(start, end < 0 ? tokens.length : end);
}

describe('the migration guide', () => {
  // @scenario behaviour orbit-user-docs :: The migration guide opens with a before-you-move checklist for an OpenSpec 1.x project :: The guide names its measured version
  it('states the upstream version its checklist was measured against, before the checklist', () => {
    const intro = GUIDE.slice(0, GUIDE.indexOf('## Before you move'));
    expect(intro).toMatch(/measured against \*\*OpenSpec 1\.14\.1\*\*/);
  });

  it('carries the checklist, the move steps and the table of what orbit does not have, in that order', () => {
    const at = ['## Before you move', '## Move the project', '## What orbit does not have'].map((h) => GUIDE.indexOf(`\n${h}\n`));
    expect(at.every((i) => i > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  // @scenario behaviour orbit-user-docs :: The migration guide opens with a before-you-move checklist for an OpenSpec 1.x project :: A move into an existing orbit directory is never offered
  it('gives no move command for an orbit/ holding work, and says the move would nest the project', () => {
    const move = section('2. Move');
    const rows = move.filter((t) => t.type === 'inline' && /holds orbit work/.test(t.content));
    expect(rows).toHaveLength(1);
    const row = move.indexOf(rows[0]);
    const cell = move.slice(row + 1).find((t) => t.type === 'inline');
    expect(cell?.content).toMatch(/^No move command/);
    expect(cell?.content).not.toMatch(/git mv/);

    const from = move.findIndex((t) => t.type === 'inline' && t.content.startsWith('**When `orbit/` already holds work'));
    expect(from).toBeGreaterThan(0);
    const holding = move.slice(from);
    expect(holding.filter((t) => t.type === 'fence')).toEqual([]);
    const prose = holding.filter((t) => t.type === 'inline').map((t) => t.content).join('\n');
    expect(prose).toMatch(/do not run `git mv openspec orbit`/);
    expect(prose).toMatch(/`orbit\/openspec\/`/);
    expect(prose.replace('do not run `git mv openspec orbit`', '')).not.toMatch(/git mv/);
  });
});
