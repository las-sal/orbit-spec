import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CASES_DIR, LIB_DIR, buildFixture, deleteSection, fixtureEnv, listCases, loadCase } from '../../replay/lib/fixture.mjs';
import { checkStart, filePathOf, grade, gradeAll, isFileGrader, isOrbitFact, loadGraders, runOrbit } from '../../replay/lib/graders.mjs';
import { readTraceRecords } from '../../replay/lib/trace.mjs';

// The six cases' free checks: every seed is built with the repository's own build, laid out as the
// installed copy is (`.orbit-cli/node_modules/orbit-spec` symlinked to the repository root), so the
// shim finds it as in a billed run. Nothing here bills a session.

const REPO = path.resolve(__dirname, '..', '..');
const LIFECYCLE = ['/orbit:explore', '/orbit:propose', '/orbit:apply', '/orbit:review', '/orbit:address-reviews', '/orbit:archive'];

// The state each case's command leaves, where a later seed or a script builds it: each case's graders
// must PASS there (their positive control), beside failing on their own seed.
const AFTER: Record<string, { seedOf?: string; script?: string }> = {
  explore: { seedOf: 'propose' },
  propose: { seedOf: 'apply' },
  apply: { script: path.join(CASES_DIR, 'review', 'seed', 'applied.sh') },
  review: { seedOf: 'walk' },
  walk: { seedOf: 'archive' },
  archive: { script: path.join(__dirname, 'archive-after.sh') },
};

type Grader = Record<string, any>;
type Case = ReturnType<typeof loadCase>;

let root: string;
let cliDir: string;
const cases: Record<string, Case> = {};
const graders: Record<string, Grader[]> = {};
const seeds: Record<string, string> = {};

async function seed(id: string, name: string, extra: { extraScaffolds?: string[] } = {}) {
  return buildFixture({ dir: path.join(root, name), cliDir, caseDir: path.join(CASES_DIR, id), ...extra });
}

function sh(script: string, cwd: string) {
  const r = spawnSync('bash', [script], {
    cwd,
    env: { ...fixtureEnv(), REPLAY_LIB: LIB_DIR, REPLAY_CASES: CASES_DIR },
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`${script}: ${r.stderr}`);
}

beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'replay-cases-'));
  cliDir = path.join(root, 'cli');
  fs.mkdirSync(path.join(cliDir, 'node_modules'), { recursive: true });
  fs.symlinkSync(REPO, path.join(cliDir, 'node_modules', 'orbit-spec'));
  for (const id of listCases()) {
    cases[id] = loadCase(path.join(CASES_DIR, id));
    graders[id] = loadGraders(cases[id].dir);
    seeds[id] = await seed(id, `${id}-seed`);
  }
}, 240_000);

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe('replay cases — the set', () => {
  // @scenario behaviour orbit-replay-set :: The set holds six cases, one per default lifecycle command :: The set lists one case per default lifecycle command
  it('holds six cases, one per default lifecycle command', () => {
    const ids = listCases();
    expect(ids).toHaveLength(6);
    const firsts = ids.map((id) => cases[id].prompt.split('\n')[0].split(' ')[0]).sort();
    expect(firsts).toEqual([...LIFECYCLE].sort());
  });

  it('each case is well formed: its limits, its prompt answering up front, its break naming one of its graders', () => {
    for (const [id, c] of Object.entries(cases)) {
      expect(c.max_turns, id).toBeGreaterThan(0);
      expect(c.max_budget_usd, id).toBeGreaterThan(0);
      expect(c.prompt.split('\n')[0], id).toMatch(/^\/orbit:[a-z-]+ greet-name$/);
      expect(c.break, id).toBeTruthy();
      expect(graders[id].map((g) => g.id), id).toContain(c.break.grader);
    }
  });

  it("each case's break deletes exactly one section of its installed skill file", () => {
    for (const [id, c] of Object.entries(cases)) {
      const file = path.join(seeds[id], c.break.file);
      const before = fs.readFileSync(file, 'utf8');
      const after = deleteSection(before, c.break.section);
      expect(after.length, id).toBeLessThan(before.length);
      expect(after, id).not.toContain(c.break.section);
    }
  });

  it('a seed command reaches the build under test, not the stale global install', () => {
    const r = runOrbit(seeds.explore, ['decisions', 'status', '--json']);
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(expect.objectContaining({ write: false }));
  });
});

describe('replay cases — the graders', () => {
  // @scenario behaviour orbit-replay-set :: Every grader grades what orbit printed or wrote, and is shown failing on a known-bad input :: A file grader never stands alone
  it('every file grader names a pairs_with grader that only orbit makes true, about the same file', () => {
    let fileGraders = 0;
    for (const [id, gs] of Object.entries(graders)) {
      for (const g of gs.filter(isFileGrader)) {
        fileGraders++;
        const pair = gs.find((p) => p.id === g.pairs_with);
        expect(pair, `${id}/${g.id} pairs_with ${g.pairs_with}`).toBeTruthy();
        expect(isOrbitFact(pair), `${id}/${pair.id} is an orbit fact`).toBe(true);
        expect(pair.about, `${id}/${pair.id} about`).toBe(filePathOf(g));
      }
    }
    expect(fileGraders).toBeGreaterThanOrEqual(6);
  });

  it("every case's start checks pass on its seed", () => {
    for (const [id, c] of Object.entries(cases)) {
      expect(checkStart(c.start, { fixtureDir: seeds[id] }), id).toEqual([]);
    }
  });

  // @scenario behaviour orbit-replay-set :: Every grader grades what orbit printed or wrote, and is shown failing on a known-bad input :: Every grader fails on its known-bad fixture
  it('every grader fails on its seed with an empty trace, or on its known-bad scaffold', async () => {
    for (const [id, gs] of Object.entries(graders)) {
      for (const g of gs) {
        let fixture = seeds[id];
        if (g.negative_scaffold) {
          fixture = await seed(id, `${id}-bad-${g.id}`, { extraScaffolds: [path.join(cases[id].dir, g.negative_scaffold)] });
          // Its fact holds at the seed (a must-not fact), which is why it needs the known-bad.
          expect(grade(g, { fixtureDir: seeds[id], orbitOutput: '' }).pass, `${id}/${g.id} at seed`).toBe(true);
        }
        expect(grade(g, { fixtureDir: fixture, orbitOutput: '' }).pass, `${id}/${g.id}`).toBe(false);
      }
    }
  }, 120_000);

  // @scenario behaviour orbit-replay-set :: Every grader grades what orbit printed or wrote, and is shown failing on a known-bad input :: Every trace grader fails on a trace without orbit's answer
  it("every orbit_output grader fails on a trace holding the typed command and the skill's body, with no orbit answer", () => {
    let traceGraders = 0;
    for (const [id, gs] of Object.entries(graders)) {
      const c = cases[id];
      const body = fs.readFileSync(path.join(seeds[id], c.break.file), 'utf8');
      for (const g of gs.filter((x) => x.type === 'regex' && x.target === 'orbit_output')) {
        traceGraders++;
        // The bait: orbit's own printed line (the grader's example) sits in the typed command, in the
        // loaded skill body, in the session's text and in an orbit call that never answered.
        const records = [
          { type: 'system', subtype: 'init', model: 'm', skills: [] },
          { type: 'user', message: { content: [{ type: 'text', text: `${c.prompt}\n${g.example}` }] } },
          { type: 'assistant', message: { content: [{ type: 'tool_use', id: 's1', name: 'Skill', input: { skill: c.break.file } }] } },
          { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 's1', content: `${body}\n${g.example}` }] } },
          { type: 'assistant', message: { content: [{ type: 'text', text: `Wrote ${g.example}` }] } },
          {
            type: 'assistant',
            message: { content: [{ type: 'tool_use', id: 'b1', name: 'Bash', input: { command: `orbit emit x --payload p.json # ${g.example}` } }] },
          },
          { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'b2', content: 'unrelated' }] } },
        ];
        // A careless reader of the whole trace would pass it: the bait is real.
        expect(new RegExp(g.pattern, g.flags ?? '').test(JSON.stringify(records)), `${id}/${g.id} bait`).toBe(true);
        const t = readTraceRecords(records);
        expect(t.orbitOutput, `${id}/${g.id}`).toBe('');
        expect(grade(g, { fixtureDir: seeds[id], orbitOutput: t.orbitOutput }).pass, `${id}/${g.id}`).toBe(false);
        // …and the same grader passes on orbit's printed answer.
        records.push({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'b1', content: g.example }] } });
        const answered = readTraceRecords(records);
        expect(grade(g, { fixtureDir: seeds[id], orbitOutput: answered.orbitOutput }).pass, `${id}/${g.id} answered`).toBe(true);
      }
    }
    expect(traceGraders).toBe(6);
  });

  it("every grader passes on the state its case's command leaves (its positive control)", async () => {
    for (const [id, gs] of Object.entries(graders)) {
      const after = AFTER[id];
      let fixture: string;
      if (after.seedOf) fixture = seeds[after.seedOf];
      else {
        fixture = await seed(id, `${id}-after`);
        sh(after.script!, fixture);
      }
      // A trace grader's answer is the path orbit printed when it wrote the newest matching file.
      for (const g of gs) {
        let orbitOutput = '';
        if (g.type === 'regex' && g.target === 'orbit_output') {
          const r = spawnSync('bash', ['-c', `ls -d ${g.about} | tail -1`], { cwd: fixture, encoding: 'utf8' });
          orbitOutput = r.stdout.trim();
        }
        const r = grade(g, { fixtureDir: fixture, orbitOutput });
        expect(r.pass, `${id}/${g.id} after: ${r.detail}`).toBe(true);
      }
    }
  }, 120_000);
});

describe('replay cases — the grading reads no tool input', () => {
  it('gradeAll over a real seed reports every grader of the case', () => {
    const out = gradeAll(graders.walk, { fixtureDir: seeds.walk, orbitOutput: '' });
    expect(Object.keys(out).sort()).toEqual(graders.walk.map((g) => g.id).sort());
  });
});
