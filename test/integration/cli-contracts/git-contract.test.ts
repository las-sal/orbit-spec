/**
 * rc05b task 2.5: the checked-in `git` contract's freshness. The file parses, records the git
 * version it was captured against, and carries every command key the generated surface uses.
 * Nothing here spawns git: re-capture is `npm run capture:git`, a deliberate, reviewed act.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { keyOf } from '../../helpers/git-capture.js';
import { analyseSurfaces, generatedSurfaces } from '../../helpers/surface-snippets.js';

const here = path.dirname(fileURLToPath(import.meta.url));

interface GitContract {
  git_version: string;
  captured_at: string;
  commands: Record<string, { known: boolean; class?: string; positional_required?: boolean; flags?: unknown[] }>;
  rules: Record<string, unknown>;
}

const contract: GitContract = JSON.parse(fs.readFileSync(path.join(here, 'git-contract.json'), 'utf-8'));

describe('the recorded git contract', () => {
  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: The suite needs no git
  it('parses and records the git version it was captured against', () => {
    expect(contract.git_version).toMatch(/^git version \d+\.\d+/);
    expect(contract.captured_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(contract.rules.rev_parse_recorded_flags_only).toBe(true);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `git` and `gh` snippet on the generated surface validates against its tool's recorded contract :: The suite needs no git
  it('carries every command key the generated surface uses', () => {
    // A group is a first word that heads a two-word key; the surface's keys follow from it.
    const groups = new Set(Object.keys(contract.commands).filter((k) => k.includes(' ')).map((k) => k.split(' ')[0]));
    const used = new Set<string>();
    for (const snippet of analyseSurfaces(generatedSurfaces(), 'git').snippets) {
      const key = keyOf(snippet.tokens.slice(1), groups);
      if (key !== null) used.add(key);
    }
    expect(used.size).toBeGreaterThan(0);
    expect([...used].filter((key) => !(key in contract.commands))).toEqual([]);
  });

  it('records a class and the positional for every known command', () => {
    for (const [key, command] of Object.entries(contract.commands)) {
      if (!command.known) continue;
      expect(['parse-options', 'run', 'rule'], key).toContain(command.class);
      expect(typeof command.positional_required, key).toBe('boolean');
      expect(Array.isArray(command.flags), key).toBe(true);
    }
  });
});
