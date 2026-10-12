import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { findArchivedDir } from '../../src/core/archived-change.js';
import { resolvesWithin } from '../../src/core/containment.js';

/**
 * report-archived-change task 1.2: the ONE archived-directory resolver, shared by the emit
 * surface and `orbit status --report`. Symlink cases skip where the platform cannot create one.
 */

let root: string;
let archive: string;

function canSymlink(): boolean {
  const probe = path.join(root, 'symlink-probe');
  try {
    fs.symlinkSync(root, probe, 'dir');
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-archived-change-'));
  archive = path.join(root, 'orbit', 'changes', 'archive');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('findArchivedDir', () => {
  it('returns null when there is no archive root', () => {
    expect(findArchivedDir(root, 'foo')).toBeNull();
  });

  it('returns null when nothing matches', () => {
    fs.mkdirSync(path.join(archive, '2026-01-01-bar'), { recursive: true });
    expect(findArchivedDir(root, 'foo')).toBeNull();
  });

  it('picks the lexically greatest of two dated matches', () => {
    fs.mkdirSync(path.join(archive, '2026-01-01-foo'), { recursive: true });
    fs.mkdirSync(path.join(archive, '2026-02-01-foo'), { recursive: true });
    expect(findArchivedDir(root, 'foo')).toBe(path.join(archive, '2026-02-01-foo'));
  });

  it('matches a name containing regex metacharacters literally', () => {
    fs.mkdirSync(path.join(archive, '2026-01-01-a.b+c'), { recursive: true });
    fs.mkdirSync(path.join(archive, '2026-01-02-aXbbc'), { recursive: true });
    expect(findArchivedDir(root, 'a.b+c')).toBe(path.join(archive, '2026-01-01-a.b+c'));
  });

  it('does not match a sibling that only ends with -<name> after another hyphenated word', () => {
    fs.mkdirSync(path.join(archive, '2026-01-01-other-foo'), { recursive: true });
    expect(findArchivedDir(root, 'foo')).toBeNull();
    expect(findArchivedDir(root, 'other-foo')).toBe(path.join(archive, '2026-01-01-other-foo'));
  });

  it('skips a regular file of a matching name in favour of an earlier directory', () => {
    fs.mkdirSync(path.join(archive, '2026-01-01-foo'), { recursive: true });
    fs.writeFileSync(path.join(archive, '2026-02-01-foo'), 'not a directory');
    expect(findArchivedDir(root, 'foo')).toBe(path.join(archive, '2026-01-01-foo'));
  });

  it('returns null when the only match is a regular file', () => {
    fs.mkdirSync(archive, { recursive: true });
    fs.writeFileSync(path.join(archive, '2026-02-01-foo'), 'not a directory');
    expect(findArchivedDir(root, 'foo')).toBeNull();
  });

  it('returns a symlink to a directory (the caller\'s containment check decides it)', (ctx) => {
    if (!canSymlink()) ctx.skip();
    const outside = path.join(root, 'elsewhere');
    fs.mkdirSync(outside, { recursive: true });
    fs.mkdirSync(archive, { recursive: true });
    fs.symlinkSync(outside, path.join(archive, '2026-01-01-foo'), 'dir');
    expect(findArchivedDir(root, 'foo')).toBe(path.join(archive, '2026-01-01-foo'));
  });
});

describe('resolvesWithin (the one containment test)', () => {
  it('admits the root itself and a path under it; refuses a sibling; passes an unresolvable path', (ctx) => {
    fs.mkdirSync(path.join(archive, '2026-01-01-foo'), { recursive: true });
    fs.mkdirSync(path.join(root, 'elsewhere'), { recursive: true });
    expect(resolvesWithin(archive, archive)).toBe(true);
    expect(resolvesWithin(path.join(archive, '2026-01-01-foo'), archive)).toBe(true);
    expect(resolvesWithin(path.join(root, 'elsewhere'), archive)).toBe(false);
    // A prefix that is not a path boundary is not containment.
    fs.mkdirSync(path.join(root, 'orbit', 'changes', 'archive-x'), { recursive: true });
    expect(resolvesWithin(path.join(root, 'orbit', 'changes', 'archive-x'), archive)).toBe(false);
    expect(resolvesWithin(path.join(archive, 'missing'), archive)).toBe(true);
    if (!canSymlink()) ctx.skip();
    fs.symlinkSync('.', path.join(archive, '2026-02-01-foo'), 'dir');
    expect(resolvesWithin(path.join(archive, '2026-02-01-foo'), archive)).toBe(true);
  });
});
