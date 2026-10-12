/**
 * docs-under-test task 1.1/1.2 (design D1, D2): the user docs and their pending-rewrite list —
 * `orbit-user-docs`' `The user docs are a checked surface, gated by an exact pending-rewrite list`.
 */
import { describe, expect, it } from 'vitest';
import {
  DOCS_WORKFLOW,
  allDocSurfaces,
  describeSurface,
  docSurfaces,
  readPendingRewrite,
  type Surface,
} from '../../helpers/surface-snippets.js';
import { fileLocalFailures, pendingListFailures } from '../../helpers/user-docs.js';

const FENCE = '```';
const doc = (file: string, text: string): Surface => ({ workflowId: DOCS_WORKFLOW, file, text });
const CLEAN = doc('docs/clean.md', `# Clean\n\nList the changes:\n\n${FENCE}bash\norbit list --json\n${FENCE}\n`);

describe('the user docs surface', () => {
  it('is README.md and every docs/*.md, each named by its repository-relative path', () => {
    const files = allDocSurfaces().map((s) => s.file);
    expect(files[0]).toBe('README.md');
    expect(files.slice(1).every((f) => /^docs\/[^/]+\.md$/.test(f))).toBe(true);
    expect(allDocSurfaces().map(describeSurface)).toEqual(files);
  });

  // @scenario behaviour orbit-user-docs :: The user docs are a checked surface, gated by an exact pending-rewrite list :: An unlisted doc is held to every check
  it('an unlisted doc is read, and a failing one fails naming the file, the line and the check', async () => {
    const pending = readPendingRewrite();
    const unlisted = docSurfaces(pending).map(describeSurface);
    expect(docSurfaces(pending.filter((f) => f !== 'docs/cli.md')).map(describeSurface)).toEqual([...unlisted, 'docs/cli.md'].sort());
    const failing = doc('docs/new.md', `# New\n\n${FENCE}bash\norbit list --frobnicate\n${FENCE}\n\nUpstream was OpenSpec.\n`);
    const failures = await fileLocalFailures([failing]);
    expect(failures.some((f) => f.startsWith('[orbit] docs/new.md:4: orbit list --frobnicate'))).toBe(true);
    expect(failures).toContain("[residue] docs/new.md:7: residue 'OpenSpec' (the residue check)");
  });
});

describe('the pending-rewrite list', () => {
  it('is exact on today\'s tree: no stale entry, and every listed file fails at least one file-local check', async () => {
    expect(await pendingListFailures(readPendingRewrite(), allDocSurfaces())).toEqual([]);
  }, 120_000);

  it('every unlisted user doc passes every file-local check', async () => {
    expect(await fileLocalFailures(docSurfaces())).toEqual([]);
  }, 120_000);

  // @scenario behaviour orbit-user-docs :: The user docs are a checked surface, gated by an exact pending-rewrite list :: A finished file cannot stay listed
  it('a listed file that passes every file-local check fails, naming it', async () => {
    expect(await fileLocalFailures([CLEAN])).toEqual([]);
    expect(await pendingListFailures(['docs/clean.md'], [CLEAN])).toEqual([
      'docs/clean.md: passes every file-local check; remove it from the pending-rewrite list',
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs are a checked surface, gated by an exact pending-rewrite list :: A clean listed page is finished whatever the docs fence declares
  it('a clean listed page beside a declared head it does not use is finished, with no unused-declaration failure', async () => {
    const declaring = { exemptions: [{ head: 'jq', kind: 'utility' as const, line: 1 }], failures: [] };
    const failures = await pendingListFailures(['docs/clean.md'], [CLEAN], (surfaces) => fileLocalFailures(surfaces, declaring));
    expect(failures).toEqual(['docs/clean.md: passes every file-local check; remove it from the pending-rewrite list']);
  });

  // @scenario behaviour orbit-user-docs :: The user docs are a checked surface, gated by an exact pending-rewrite list :: A stale entry fails
  it('a listed path that names no user doc fails, naming the entry', async () => {
    expect(await pendingListFailures(['docs/gone.md', 'docs/sub/x.md'], allDocSurfaces())).toEqual([
      'docs/gone.md: listed in the pending-rewrite list but names no user doc (a stale entry)',
      'docs/sub/x.md: listed in the pending-rewrite list but names no user doc (a stale entry)',
    ]);
  });

  it('a listed file that fails a check is skipped', async () => {
    const failing = doc('docs/old.md', 'Install OpenSpec.\n');
    expect(await pendingListFailures(['docs/old.md'], [failing])).toEqual([]);
  });
});
