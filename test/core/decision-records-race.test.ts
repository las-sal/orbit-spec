/**
 * decision-layer system walk (external W1, Sal: A): a decision record is published WITHOUT OVERWRITING.
 * A same-token collision is only reachable when another writer lands AFTER the folder listing the token
 * bump reads, so this file simulates that race: `node:fs`'s `readdirSync` is wrapped to return an empty
 * listing for a `decisions` folder while `race.on` is set. Everything else is the real filesystem.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const race = vi.hoisted(() => ({ on: false }));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  const readdirSync = ((p: fs.PathLike, ...rest: unknown[]) =>
    race.on && String(p).endsWith(`${path.sep}decisions`) ? [] : (actual.readdirSync as any)(p, ...rest)) as typeof actual.readdirSync;
  return { ...actual, readdirSync, default: { ...actual, readdirSync } };
});

const { composeAndWriteEmit } = await import('../../src/core/emit-composition.js');

let root: string;
const DEC = 'orbit/changes/foo/.orbit-runs/decisions';

function write(rel: string, content: string): void {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

const stopPayload = { model: 'm', condition: 'outward-act', about: 'Publishing the release.', question: 'May orbit push the tag?' };
const emitStop = () => composeAndWriteEmit('stop', { change: 'foo' }, stopPayload, { projectRoot: root });

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-decisions-race-'));
  write('orbit/changes/foo/proposal.md', '# P\n');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-07T10:00:00Z'));
  race.on = true;
});

afterEach(() => {
  race.on = false;
  vi.useRealTimers();
  fs.rmSync(root, { recursive: true, force: true });
});

describe('a decision record is published without overwriting', () => {
  // @scenario behaviour orbit-emit-composition :: The write gate checks decision records :: A same-token writer cannot replace a record
  it("another writer's temporary file for the token refuses the emit and is left in place", () => {
    const tmp = `${DEC}/.stop-2026-11-07T10-00-00Z.json.tmp`;
    write(tmp, 'another writer, mid-write');
    expect(() => emitStop()).toThrow(/\.stop-2026-11-07T10-00-00Z\.json\.tmp already exists — another writer drew token 2026-11-07T10-00-00Z/);
    expect(fs.readFileSync(path.join(root, tmp), 'utf-8')).toBe('another writer, mid-write');
    expect(fs.existsSync(path.join(root, DEC, 'stop-2026-11-07T10-00-00Z.json'))).toBe(false);
  });

  it("another writer's published record for the token refuses the emit and is not replaced", () => {
    const rec = `${DEC}/stop-2026-11-07T10-00-00Z.json`;
    write(rec, '{"command":"stop","change":"foo","condition":"ruling-amendment"}');
    expect(() => emitStop()).toThrow(/stop-2026-11-07T10-00-00Z\.json already exists — another writer drew token/);
    expect(fs.readFileSync(path.join(root, rec), 'utf-8')).toBe('{"command":"stop","change":"foo","condition":"ruling-amendment"}');
    // Our own temporary file is cleaned up: only the other writer's record remains.
    race.on = false;
    expect(fs.readdirSync(path.join(root, DEC))).toEqual(['stop-2026-11-07T10-00-00Z.json']);
  });

  it('with no other writer the record is written and no temporary file remains', () => {
    const r = emitStop();
    race.on = false;
    expect(fs.readdirSync(path.join(root, DEC))).toEqual([path.basename(r.path)]);
  });
});
