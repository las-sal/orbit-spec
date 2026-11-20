/**
 * records-by-setting (reduce-orbit-phase1, R-rop-17): whether decision records are written — `orbit-decision-records`'
 * `Decision records are written when a setting reads them` (one case per row of its table) and `orbit decisions
 * status says whether decision records are written` (the readers' order and the command's two outputs).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { decisionStatus, renderDecisionStatus, DECISION_READERS } from '../../src/core/decision-status.js';
import { CHAIN_KEYS } from '../../src/core/project-config.js';
import { runCLI } from '../helpers/run-cli.js';

let root: string;

const config = (text: string, name = 'config.yaml'): void => {
  fs.mkdirSync(path.join(root, 'orbit'), { recursive: true });
  fs.writeFileSync(path.join(root, 'orbit', name), text);
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-status-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const NOT_WRITTEN = { write: false, readers: [] };

describe('Decision records are written when a setting reads them — each row of the table', () => {
  // @scenario behaviour orbit-decision-records :: Decision records are written when a setting reads them :: Each reading setting turns writing on
  it('a granted chain key turns the chain term on, for every key', () => {
    for (const key of CHAIN_KEYS) {
      config(`schema: spec-driven\nchain:\n  ${key}: true\n`);
      expect(decisionStatus(root), key).toEqual({ write: true, readers: ['chain'] });
    }
  });

  // @scenario behaviour orbit-decision-records :: Decision records are written when a setting reads them :: A setting with no reader turns nothing on
  it('a chain map with no key granted, or a grant that is not exactly true, turns nothing on', () => {
    config(`schema: spec-driven\nchain:\n${CHAIN_KEYS.map(k => `  ${k}: false`).join('\n')}\n`);
    expect(decisionStatus(root)).toEqual(NOT_WRITTEN);
    config('schema: spec-driven\nchain:\n  review: "true"\n  driver: true\n');
    expect(decisionStatus(root)).toEqual(NOT_WRITTEN);
  });

  // @scenario behaviour orbit-decision-records :: Decision records are written when a setting reads them :: Each reading setting turns writing on
  it('signoff: change and signoff: program each turn the signoff term on', () => {
    for (const value of ['change', 'program']) {
      config(`schema: spec-driven\nsignoff: ${value}\n`);
      expect(decisionStatus(root), value).toEqual({ write: true, readers: ['signoff'] });
    }
  });

  // @scenario behaviour orbit-decision-records :: orbit decisions status says whether decision records are written :: An unrecognized sign-off value is off
  it('signoff: off, and an unrecognized value such as weekly, turn nothing on', () => {
    for (const value of ['off', 'weekly']) {
      config(`schema: spec-driven\nsignoff: ${value}\n`);
      expect(decisionStatus(root), value).toEqual(NOT_WRITTEN);
    }
  });

  // @scenario behaviour orbit-decision-records :: Decision records are written when a setting reads them :: Each reading setting turns writing on
  it('a halting tripwire sensor turns the tripwires term on', () => {
    config('schema: spec-driven\ntripwires:\n  touchpoints:\n    on_fire: halt\n');
    expect(decisionStatus(root)).toEqual({ write: true, readers: ['tripwires'] });
  });

  // @scenario behaviour orbit-decision-records :: Decision records are written when a setting reads them :: A setting with no reader turns nothing on
  it('a recording tripwire sensor, beside a chain map with no grant, turns nothing on', () => {
    config('schema: spec-driven\nchain:\n  review: false\ntripwires:\n  touchpoints:\n    on_fire: record\n');
    expect(decisionStatus(root)).toEqual(NOT_WRITTEN);
  });

  // @scenario behaviour orbit-decision-records :: Decision records are written when a setting reads them :: At the defaults no new record is written
  it('no config, and a config setting none of the three keys, write nothing', () => {
    expect(decisionStatus(root)).toEqual(NOT_WRITTEN);
    config('schema: spec-driven\n');
    expect(decisionStatus(root)).toEqual(NOT_WRITTEN);
  });

  // @scenario behaviour orbit-decision-records :: orbit decisions status says whether decision records are written :: An unparseable config reads as the defaults
  it('an unparseable config reads as the defaults', () => {
    config('chain: [unclosed\n  signoff: change\n');
    expect(decisionStatus(root)).toEqual(NOT_WRITTEN);
  });

  it('reads orbit/config.yml when there is no config.yaml', () => {
    config('signoff: program\n', 'config.yml');
    expect(decisionStatus(root)).toEqual({ write: true, readers: ['signoff'] });
  });

  // @scenario behaviour orbit-decision-records :: orbit decisions status says whether decision records are written :: Every reader that is on is named, in order
  it('names every reader that is on, in the order chain, signoff, tripwires', () => {
    expect([...DECISION_READERS]).toEqual(['chain', 'signoff', 'tripwires']);
    config('tripwires:\n  touchpoints:\n    on_fire: halt\nsignoff: program\nchain:\n  address-reviews: true\n');
    const status = decisionStatus(root);
    expect(status).toEqual({ write: true, readers: ['chain', 'signoff', 'tripwires'] });
    expect(renderDecisionStatus(status)).toBe('Decision records: written (read by chain, signoff, tripwires)');
  });

  it('mutation: the predicate is not a key\'s mere presence', () => {
    // A key present with no reader must not read as on: a chain map, a signoff key, a tripwires map.
    config('chain: {}\nsignoff: off\ntripwires:\n  touchpoints: {}\n');
    expect(decisionStatus(root).write).toBe(false);
    // and flipping each to its reading state flips the result
    config('chain:\n  apply: true\n');
    expect(decisionStatus(root).write).toBe(true);
  });
});

describe('orbit decisions status — the command', () => {
  // @scenario behaviour orbit-decision-records :: orbit decisions status says whether decision records are written :: At the defaults the command says nothing is written
  it('prints the not-written line and exits zero with no config; --json prints write false and no readers', async () => {
    const r = await runCLI(['decisions', 'status'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe('Decision records: not written (no setting reads them)');
    const j = await runCLI(['decisions', 'status', '--json'], { cwd: root });
    expect(j.exitCode).toBe(0);
    expect(JSON.parse(j.stdout)).toEqual({ write: false, readers: [] });
    // It writes nothing.
    expect(fs.readdirSync(root)).toEqual([]);
  });

  // @scenario behaviour orbit-decision-records :: orbit decisions status says whether decision records are written :: Every reader that is on is named, in order
  it('names every reader in order, in both outputs', async () => {
    config('chain:\n  address-reviews: true\nsignoff: program\ntripwires:\n  touchpoints:\n    on_fire: halt\n');
    const r = await runCLI(['decisions', 'status'], { cwd: root });
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe('Decision records: written (read by chain, signoff, tripwires)');
    const j = await runCLI(['decisions', 'status', '--json'], { cwd: root });
    expect(JSON.parse(j.stdout)).toEqual({ write: true, readers: ['chain', 'signoff', 'tripwires'] });
  });

  // @scenario behaviour orbit-decision-records :: orbit decisions status says whether decision records are written :: An unparseable config reads as the defaults
  it('exits zero on an unparseable config, reporting the defaults', async () => {
    config('chain: [unclosed\n');
    const j = await runCLI(['decisions', 'status', '--json'], { cwd: root });
    expect(j.exitCode).toBe(0);
    expect(JSON.parse(j.stdout)).toEqual({ write: false, readers: [] });
  });
});
