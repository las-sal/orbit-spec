import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fsp } from 'fs';
import * as fs from 'fs';
import path from 'path';
import os from 'os';
import {
  validateSkillTemplates,
  reconcileSkillReferences,
  skillReferencesDrifted,
  generateSkillContent,
  type SkillTemplateEntry,
} from '../../../src/core/shared/skill-generation.js';
import type { SkillTemplate } from '../../../src/core/templates/types.js';

function entry(template: Partial<SkillTemplate>, dirName = 'orbit-test'): SkillTemplateEntry {
  return {
    template: {
      name: 'orbit-test',
      description: 'test',
      instructions: 'test',
      ...template,
    },
    dirName,
    workflowId: 'test',
  };
}

describe('validateSkillTemplates (preflight, orbit-skill-generation)', () => {
  it('accepts bare unique reference names and plain metadata keys', () => {
    expect(() =>
      validateSkillTemplates([
        entry({
          metadata: { author: 'orbit', capability: 'orbit-test' },
          references: [{ name: 'schema.md', content: 'x' }],
        }),
      ])
    ).not.toThrow();
  });

  it.each([
    ['path separator', '../evil.md'],
    ['nested path', 'refs/inner.md'],
    ['dot', '.'],
    ['dot-dot', '..'],
    ['absolute', '/etc/passwd'],
    ['NUL byte', 'evil\u0000.md'],
    ['control char', 'evil\n.md'],
    ['Windows reserved', 'CON.md'],
    ['trailing dot', 'bad.'],
    ['space', 'a b.md'],
  ])('rejects %s reference names, naming the template', (_label, bad) => {
    expect(() =>
      validateSkillTemplates([entry({ references: [{ name: bad, content: 'x' }] })])
    ).toThrow(/orbit-test/);
  });

  it('rejects duplicate reference names', () => {
    expect(() =>
      validateSkillTemplates([
        entry({
          references: [
            { name: 'a.md', content: '1' },
            { name: 'a.md', content: '2' },
          ],
        }),
      ])
    ).toThrow(/Duplicate reference name/);
  });

  it.each([
    ['integer-like', '1'],
    ['YAML-significant', 'a: b'],
    ['leading digit', '0key'],
  ])('rejects %s metadata keys', (_label, badKey) => {
    expect(() =>
      validateSkillTemplates([entry({ metadata: { [badKey]: 'v' } })])
    ).toThrow(/metadata key/);
  });
});

describe('reconcileSkillReferences (write-before-prune, containment)', () => {
  let skillDir: string;
  let refsDir: string;
  let outsideDir: string;

  beforeEach(async () => {
    skillDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'orbit-refs-test-'));
    refsDir = path.join(skillDir, 'references');
    outsideDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'orbit-refs-outside-'));
  });

  afterEach(async () => {
    await fsp.rm(skillDir, { recursive: true, force: true });
    await fsp.rm(outsideDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('writes declared references and reports counts', async () => {
    const res = await reconcileSkillReferences(skillDir, [{ name: 'a.md', content: 'A' }]);
    expect(res.written).toBe(1);
    expect(res.removed).toEqual([]);
    expect(await fsp.readFile(path.join(refsDir, 'a.md'), 'utf-8')).toBe('A');
  });

  it('refreshes declared content and prunes undeclared files, dirs, and symlinks', async () => {
    await fsp.mkdir(refsDir, { recursive: true });
    await fsp.writeFile(path.join(refsDir, 'a.md'), 'OLD');
    await fsp.writeFile(path.join(refsDir, 'stray.md'), 'stray');
    await fsp.mkdir(path.join(refsDir, 'stray-dir'));
    const linkTarget = path.join(outsideDir, 'target.md');
    await fsp.writeFile(linkTarget, 'TARGET');
    await fsp.symlink(linkTarget, path.join(refsDir, 'stray-link.md'));

    const res = await reconcileSkillReferences(skillDir, [{ name: 'a.md', content: 'NEW' }]);

    expect(await fsp.readFile(path.join(refsDir, 'a.md'), 'utf-8')).toBe('NEW');
    expect(res.removed.sort()).toEqual(['stray-dir', 'stray-link.md', 'stray.md']);
    expect(fs.existsSync(path.join(refsDir, 'stray.md'))).toBe(false);
    expect(fs.existsSync(path.join(refsDir, 'stray-dir'))).toBe(false);
    expect(fs.lstatSync(path.join(refsDir, 'a.md')).isFile()).toBe(true);
    // symlink removed as a link; target untouched
    expect(await fsp.readFile(linkTarget, 'utf-8')).toBe('TARGET');
  });

  it('replaces a symlink at a DECLARED name without following it', async () => {
    await fsp.mkdir(refsDir, { recursive: true });
    const linkTarget = path.join(outsideDir, 'precious.md');
    await fsp.writeFile(linkTarget, 'PRECIOUS');
    await fsp.symlink(linkTarget, path.join(refsDir, 'a.md'));

    await reconcileSkillReferences(skillDir, [{ name: 'a.md', content: 'NEW' }]);

    const stat = fs.lstatSync(path.join(refsDir, 'a.md'));
    expect(stat.isFile()).toBe(true);
    expect(stat.isSymbolicLink()).toBe(false);
    expect(await fsp.readFile(path.join(refsDir, 'a.md'), 'utf-8')).toBe('NEW');
    // the symlink target was never written through
    expect(await fsp.readFile(linkTarget, 'utf-8')).toBe('PRECIOUS');
  });

  it('replaces a directory at a DECLARED name', async () => {
    await fsp.mkdir(path.join(refsDir, 'a.md'), { recursive: true });
    await fsp.writeFile(path.join(refsDir, 'a.md', 'inner.txt'), 'x');

    await reconcileSkillReferences(skillDir, [{ name: 'a.md', content: 'NEW' }]);
    expect(fs.lstatSync(path.join(refsDir, 'a.md')).isFile()).toBe(true);
  });

  it('replaces a symlinked references/ ROOT with a real directory', async () => {
    const realDir = path.join(outsideDir, 'fake-refs');
    await fsp.mkdir(realDir);
    await fsp.writeFile(path.join(realDir, 'a.md'), 'VIA-LINK');
    await fsp.symlink(realDir, refsDir);

    await reconcileSkillReferences(skillDir, [{ name: 'a.md', content: 'NEW' }]);

    expect(fs.lstatSync(refsDir).isSymbolicLink()).toBe(false);
    expect(fs.lstatSync(refsDir).isDirectory()).toBe(true);
    expect(await fsp.readFile(path.join(refsDir, 'a.md'), 'utf-8')).toBe('NEW');
    // the link target dir was not written into
    expect(await fsp.readFile(path.join(realDir, 'a.md'), 'utf-8')).toBe('VIA-LINK');
  });

  it('replaces a symlinked SKILL DIRECTORY before reconciling (physical containment)', async () => {
    // outside target with its own references/ content + a sentinel stray
    const outsideSkill = path.join(outsideDir, 'outside-skill');
    await fsp.mkdir(path.join(outsideSkill, 'references'), { recursive: true });
    await fsp.writeFile(path.join(outsideSkill, 'references', 'sentinel.md'), 'SENTINEL');
    // the skill-dir path is a symlink to the outside target
    const linkedSkillDir = path.join(skillDir, 'linked-skill');
    await fsp.symlink(outsideSkill, linkedSkillDir);

    const res = await reconcileSkillReferences(linkedSkillDir, [{ name: 'a.md', content: 'NEW' }]);

    // the link was replaced with a real directory; declared content landed inside it
    expect(fs.lstatSync(linkedSkillDir).isSymbolicLink()).toBe(false);
    expect(fs.lstatSync(linkedSkillDir).isDirectory()).toBe(true);
    expect(await fsp.readFile(path.join(linkedSkillDir, 'references', 'a.md'), 'utf-8')).toBe('NEW');
    // the outside target was neither written into nor pruned
    expect(await fsp.readFile(path.join(outsideSkill, 'references', 'sentinel.md'), 'utf-8')).toBe('SENTINEL');
    expect(fs.existsSync(path.join(outsideSkill, 'references', 'a.md'))).toBe(false);
    expect(res.written).toBe(1);
  });

  it('removes the references/ dir entirely when the declared set is empty', async () => {
    await fsp.mkdir(refsDir, { recursive: true });
    await fsp.writeFile(path.join(refsDir, 'old.md'), 'old');

    const res = await reconcileSkillReferences(skillDir, []);
    expect(fs.existsSync(refsDir)).toBe(false);
    expect(res.removed).toEqual(['old.md']);
  });

  it('no-ops for a reference-less skill with no references/ dir', async () => {
    const res = await reconcileSkillReferences(skillDir, undefined);
    expect(res).toEqual({ written: 0, removed: [], rootRemoved: false });
    expect(fs.existsSync(refsDir)).toBe(false);
  });

  it('aborts pruning when a declared write fails (write-before-prune)', async () => {
    await fsp.mkdir(refsDir, { recursive: true });
    await fsp.writeFile(path.join(refsDir, 'stray.md'), 'stray');

    const spy = vi.spyOn(fsp, 'writeFile').mockRejectedValueOnce(new Error('disk full'));
    await expect(
      reconcileSkillReferences(skillDir, [{ name: 'a.md', content: 'NEW' }])
    ).rejects.toThrow('disk full');
    spy.mockRestore();

    // failure occurred during the write phase — nothing was pruned
    expect(fs.existsSync(path.join(refsDir, 'stray.md'))).toBe(true);
  });

  it('staged writes: a later staging failure leaves earlier declared content UNCHANGED and prunes nothing', async () => {
    await fsp.mkdir(refsDir, { recursive: true });
    await fsp.writeFile(path.join(refsDir, 'a.md'), 'OLD-A');
    await fsp.writeFile(path.join(refsDir, 'stray.md'), 'stray');

    let call = 0;
    const real = fsp.writeFile.bind(fsp);
    const spy = vi.spyOn(fsp, 'writeFile').mockImplementation(async (...args: Parameters<typeof real>) => {
      call += 1;
      if (call === 2) throw new Error('disk full at b');
      return real(...args);
    });
    await expect(
      reconcileSkillReferences(skillDir, [
        { name: 'a.md', content: 'NEW-A' },
        { name: 'b.md', content: 'NEW-B' },
      ])
    ).rejects.toThrow('disk full at b');
    spy.mockRestore();

    // a.md retains its PRIOR content (staging never committed), stray untouched, no temp litter
    expect(await fsp.readFile(path.join(refsDir, 'a.md'), 'utf-8')).toBe('OLD-A');
    expect(fs.existsSync(path.join(refsDir, 'stray.md'))).toBe(true);
    expect(fs.existsSync(path.join(refsDir, 'b.md'))).toBe(false);
    const leftovers = fs.readdirSync(refsDir).filter((e) => e.startsWith('.orbit-staging-'));
    expect(leftovers).toEqual([]);
  });
});

describe('skillReferencesDrifted (declared-set + root-shape detection)', () => {
  let skillDir: string;
  let refsDir: string;
  let outsideDir: string;
  const declared = [{ name: 'a.md', content: 'A' }];

  beforeEach(async () => {
    skillDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'orbit-drift-test-'));
    refsDir = path.join(skillDir, 'references');
    outsideDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'orbit-drift-outside-'));
  });

  afterEach(async () => {
    await fsp.rm(skillDir, { recursive: true, force: true });
    await fsp.rm(outsideDir, { recursive: true, force: true });
  });

  it('clean states: no drift', async () => {
    expect(skillReferencesDrifted(skillDir, undefined)).toBe(false);
    await fsp.mkdir(refsDir);
    await fsp.writeFile(path.join(refsDir, 'a.md'), 'anything — content is out of scope');
    expect(skillReferencesDrifted(skillDir, declared)).toBe(false);
  });

  it('undesired root on a reference-less skill drifts', async () => {
    await fsp.mkdir(refsDir);
    expect(skillReferencesDrifted(skillDir, undefined)).toBe(true);
    expect(skillReferencesDrifted(skillDir, [])).toBe(true);
  });

  it('missing root or missing declared file drifts', async () => {
    expect(skillReferencesDrifted(skillDir, declared)).toBe(true);
    await fsp.mkdir(refsDir);
    expect(skillReferencesDrifted(skillDir, declared)).toBe(true);
  });

  it('undeclared entry drifts', async () => {
    await fsp.mkdir(refsDir);
    await fsp.writeFile(path.join(refsDir, 'a.md'), 'A');
    await fsp.writeFile(path.join(refsDir, 'stray.md'), 'x');
    expect(skillReferencesDrifted(skillDir, declared)).toBe(true);
  });

  it('symlinked root drifts even when the target contains the declared names', async () => {
    const realDir = path.join(outsideDir, 'fake-refs');
    await fsp.mkdir(realDir);
    await fsp.writeFile(path.join(realDir, 'a.md'), 'A');
    await fsp.symlink(realDir, refsDir);
    expect(skillReferencesDrifted(skillDir, declared)).toBe(true);
  });

  it('symlink at a declared name drifts', async () => {
    await fsp.mkdir(refsDir);
    const target = path.join(outsideDir, 't.md');
    await fsp.writeFile(target, 'A');
    await fsp.symlink(target, path.join(refsDir, 'a.md'));
    expect(skillReferencesDrifted(skillDir, declared)).toBe(true);
  });
});

describe('metadata pass-through serialization (orbit-skill-generation)', () => {
  it('preserves non-alphabetic declared order, drops mid-position generatedBy, appends generator value last', () => {
    const template: SkillTemplate = {
      name: 't',
      description: 'd',
      instructions: 'i',
      metadata: {
        zeta: 'last-declared',
        generatedBy: 'template-lies',
        alpha: 'first-alpha',
        capability: 'orbit-review',
      },
    };
    const content = generateSkillContent(template, '9.9.9');
    const zeta = content.indexOf('zeta: last-declared');
    const alpha = content.indexOf('alpha: first-alpha');
    const cap = content.indexOf('capability: orbit-review');
    const gen = content.indexOf('generatedBy: "9.9.9"');
    expect(zeta).toBeGreaterThan(-1);
    expect(zeta).toBeLessThan(alpha);
    expect(alpha).toBeLessThan(cap);
    expect(cap).toBeLessThan(gen);
    // template generatedBy dropped: generator value appears exactly once, no template value
    expect(content).not.toContain('template-lies');
    expect(content.match(/generatedBy:/g)).toHaveLength(1);
  });

  it('emits YAML-safe values: quotes number-like, reserved, and colon-bearing strings', () => {
    const template: SkillTemplate = {
      name: 't',
      description: 'd',
      instructions: 'i',
      metadata: {
        plain: 'openspec',
        numberish: '1.0',
        reserved: 'true',
        tricky: 'a: b',
      },
    };
    const content = generateSkillContent(template, '1.0.0');
    expect(content).toContain('plain: openspec');
    expect(content).toContain('numberish: "1.0"');
    expect(content).toContain('reserved: "true"');
    expect(content).toContain('tricky: "a: b"');
  });
});
