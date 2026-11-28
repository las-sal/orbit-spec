import { describe, expect, it } from 'vitest';
import { getArchiveChangeSkillTemplate } from '../../../src/core/templates/skill-templates.js';

/**
 * cut-propose-archive (task 5.3): the scenarios of `orbit-archive-modifications`' `Fingerprint-divergence inflection
 * prompt`, and `orbit-base-fingerprints`' agent-driven path, carried by the archive's Step 3.45: its basic content in the
 * body and its procedure in `references/fingerprint-divergence.md` (moved there at `conditional-steps`).
 */
const archive = getArchiveChangeSkillTemplate();
const body = archive.instructions;
const step345 = body.slice(body.indexOf('## Step 3.45'), body.indexOf('## Step 3.5 '));
const ref = archive.references!.find((r) => r.name === 'fingerprint-divergence.md')!.content;
const tableRow = (start: string): string => {
  const line = ref.split('\n').find((l) => l.startsWith(start));
  expect(line, start).toBeDefined();
  return line!;
};

describe('archive Step 3.45: the base-fingerprint divergence check', () => {
  // @scenario text orbit-archive-modifications :: Fingerprint-divergence inflection prompt :: Divergence prompt fires with the diff
  it('a diverged requirement fires the three-option prompt showing what the write would drop', () => {
    expect(step345).toContain('On `diverged`, `unverified` or `missing`, or a non-zero exit, read `references/fingerprint-divergence.md`');
    expect(tableRow('| any `diverged` |')).toContain('Fire the divergence inflection prompt (below).');
    expect(ref).toContain('### Divergence inflection prompt (`AskUserQuestion`) (chain: decision)');
    expect(ref).toContain('Present each diverged requirement (capability / requirement / `base_hash` → `live_hash`)');
    expect(ref).toContain('show what the sync would overwrite — content present live but\nabsent from the delta is exactly what would be destroyed');
    expect(ref).toContain('Exactly three\noptions:');
    for (const option of ['- **Reconcile** — halt the archive.', '- **Proceed anyway** — continue the archive flow past the check', '- **Abort** — cancel the archive; no move, no sync-specs, no summary.']) {
      expect(ref, option).toContain(option);
    }
  });

  // @scenario text orbit-archive-modifications :: Fingerprint-divergence inflection prompt :: Proceed-anyway is recorded
  it('proceed-anyway records fingerprint_overridden for every diverged requirement, at decision time', () => {
    expect(ref).toContain('Record `fingerprint_overridden: [{capability, requirement, base_hash, live_hash}]` in\n  the archive run summary, captured at decision time.');
  });

  // @scenario text orbit-archive-modifications :: Fingerprint-divergence inflection prompt :: Unverified-only proceed is recorded
  it('unverified with none diverged prompts proceed / abort, and proceeding records fingerprints_unverified', () => {
    const row = tableRow('| `unverified` present, none `diverged` |');
    expect(row).toContain('Prompt via `AskUserQuestion` (chain: decision): proceed / abort');
    expect(row).toContain('Proceeding records `fingerprints_unverified: [{capability, requirement}]` in the run summary.');
  });

  // @scenario text orbit-archive-modifications :: Fingerprint-divergence inflection prompt :: Clean check is silent
  it('all verified goes on silently, with no summary field', () => {
    expect(step345).toContain('When every requirement is `verified` (or none is touched), go on silently.');
    expect(tableRow('| all `verified`')).toContain('Proceed silently; no prompt, no summary fields.');
  });

  // @scenario text orbit-base-fingerprints :: Archive-time divergence guard in the spec-apply engine :: Agent-driven archive path is covered by the check step
  it('the agent-driven path runs the check before the sync and the move, as its only guard', () => {
    expect(step345).toContain('run `orbit fingerprint "<change-name>" --check --json` — this path\'s ONLY guard against a parallel change\'s spec loss');
    expect(ref).toContain("**This check is the\nworkflow path's ONLY guard layer**");
    // The step runs before the audit sweep, the brief save and the sync (upstream Step 4), and the move (Step 5).
    const at = ['## Step 3.45', '## Step 3.5 ', '## Step 3.6', '## Step 4.9'].map((h) => body.indexOf(h));
    expect(at.every((i) => i > -1)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(ref).toContain('Include it in the divergence prompt if one fires; otherwise halt and show the check output');
  });
});
