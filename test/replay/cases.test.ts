import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CASES_DIR, LIB_DIR, applyBreak, breakSections, buildFixture, fixtureEnv, listCases, loadCase, newestTrailToken } from '../../replay/lib/fixture.mjs';
import { checkStart, filePathOf, grade, gradeAll, isFileGrader, isOrbitFact, loadGraders, runOrbit } from '../../replay/lib/graders.mjs';
import { commandRunsOrbit, readTraceRecords } from '../../replay/lib/trace.mjs';

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

async function seed(id: string, name: string, extra: { extraScaffolds?: string[]; brk?: Record<string, unknown> } = {}) {
  return buildFixture({ dir: path.join(root, name), cliDir, caseDir: path.join(CASES_DIR, id), ...extra });
}

/** A grading context over a fixture: its orbit output and the seed's newest trail token. */
function ctxOf(fixtureDir: string, orbitOutput: string) {
  return { fixtureDir, orbitOutput, seedToken: newestTrailToken(fixtureDir) };
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

  it("each case's break deletes each of its sections, and every reference file it removes, from the installed skill", () => {
    for (const [id, c] of Object.entries(cases)) {
      // A copy of the seed's installed skills, so the shared seed is never broken.
      const copy = fs.mkdtempSync(path.join(root, `break-${id}-`));
      fs.cpSync(path.join(seeds[id], '.claude'), path.join(copy, '.claude'), { recursive: true });
      const file = path.join(copy, c.break.file);
      const before = fs.readFileSync(file, 'utf8');
      const removes: string[] = c.break.remove ?? [];
      for (const rel of removes) expect(fs.existsSync(path.join(path.dirname(file), rel)), `${id} ${rel}`).toBe(true);
      const result = applyBreak(copy, c.break);
      const after = fs.readFileSync(file, 'utf8');
      expect(after.length, id).toBeLessThan(before.length);
      // The cut takes the emit step with it: fewer `orbit emit` lines than the body held (the
      // 2026-11-20 walk break cut the report section and left the emit command in place).
      const emits = (t: string) => (t.match(/orbit emit /g) ?? []).length;
      expect(emits(after), `${id} orbit emit lines`).toBeLessThan(emits(before));
      for (const heading of breakSections(c.break)) {
        expect(before.split('\n').filter((l) => l.startsWith(heading)), `${id} ${heading}`).toHaveLength(1);
        expect(after, `${id} ${heading}`).not.toContain(heading);
      }
      expect(result.removed, id).toEqual(removes);
      for (const rel of removes) expect(fs.existsSync(path.join(path.dirname(file), rel)), `${id} ${rel} removed`).toBe(false);
    }
  });

  it('a break naming a reference file the skill does not install refuses, so a break cannot silently break nothing', () => {
    const copy = fs.mkdtempSync(path.join(root, 'break-missing-'));
    fs.cpSync(path.join(seeds.apply, '.claude'), path.join(copy, '.claude'), { recursive: true });
    expect(() => applyBreak(copy, { ...cases.apply.break, remove: ['references/no-such-file.md'] })).toThrow(/break remove: no references\/no-such-file\.md/);
  });

  it('every case whose skill installs an emit reference has its break remove it', () => {
    for (const [id, c] of Object.entries(cases)) {
      const rel = path.join(path.dirname(c.break.file), 'references', 'run-summary-emit.md');
      if (!fs.existsSync(path.join(seeds[id], rel))) continue;
      const copy = fs.mkdtempSync(path.join(root, `emitref-${id}-`));
      fs.cpSync(path.join(seeds[id], '.claude'), path.join(copy, '.claude'), { recursive: true });
      applyBreak(copy, c.break);
      expect(fs.existsSync(path.join(copy, rel)), `${id} ${rel}`).toBe(false);
    }
  });

  it('a whole-body break keeps only the frontmatter, so the skill still loads with no instructions', () => {
    const whole = Object.entries(cases).filter(([, c]) => c.break.whole_body);
    expect(whole.map(([id]) => id).sort()).toEqual(['archive', 'review', 'walk']);
    for (const [id, c] of whole) {
      const copy = fs.mkdtempSync(path.join(root, `whole-${id}-`));
      fs.cpSync(path.join(seeds[id], '.claude'), path.join(copy, '.claude'), { recursive: true });
      applyBreak(copy, c.break);
      const after = fs.readFileSync(path.join(copy, c.break.file), 'utf8');
      expect(after, id).toMatch(/^---\n(?:[\s\S]*\n)?name: orbit-[\s\S]*\ndescription: [\s\S]*\n---\n$/);
      expect(after.split('\n---\n')[1] ?? '', id).toBe('');
    }
  });

  it("a broken fixture's history does not tell the session a break happened", async () => {
    const git = (dir: string, args: string[]) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' }).stdout;
    const broken = await seed('review', 'review-broken-history', { brk: cases.review.break });
    for (const dir of [broken, seeds.walk]) {
      const subjects = git(dir, ['log', '--format=%s']).trim().split('\n');
      expect(subjects.filter((m) => /break|fixture|seed|replay/i.test(m)), dir).toEqual([]);
      expect(git(dir, ['status', '--porcelain']).trim(), dir).toBe('');
    }
    // The broken body is the committed state from the first commit: no later commit touches .claude/.
    expect(git(broken, ['log', '--format=%h', '--', '.claude']).trim().split('\n')).toHaveLength(1);
    const body = fs.readFileSync(path.join(broken, cases.review.break.file), 'utf8');
    expect(body.split('\n---\n')[1] ?? '').toBe('');
  }, 60_000);

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
          expect(grade(g, ctxOf(seeds[id], '')).pass, `${id}/${g.id} at seed`).toBe(true);
        }
        expect(grade(g, ctxOf(fixture, '')).pass, `${id}/${g.id}`).toBe(false);
      }
    }
  }, 120_000);

  // @scenario behaviour orbit-replay-set :: Every grader grades what orbit printed or wrote, and is shown failing on a known-bad input :: Every trace grader fails on a trace without orbit's answer
  it("every orbit_output grader fails on a trace holding the typed command, the skill's body and a trail listing, with no orbit answer", () => {
    let traceGraders = 0;
    for (const [id, gs] of Object.entries(graders)) {
      const c = cases[id];
      const body = fs.readFileSync(path.join(seeds[id], c.break.file), 'utf8');
      for (const g of gs.filter((x) => x.type === 'regex' && x.target === 'orbit_output')) {
        traceGraders++;
        expect(g.after_seed, `${id}/${g.id} after_seed`).toBe(true);
        // The seed's own records the grader's pattern matches, listed as a session would list them.
        const listing = spawnSync('bash', ['-c', `ls -d ${g.about} 2>/dev/null`], { cwd: seeds[id], encoding: 'utf8' }).stdout;
        // The bait: orbit's own printed line (the grader's example) sits in the typed command, in the
        // loaded skill body, in the session's text, in an orbit call that never answered, and in a
        // `find orbit …` listing — a call that names the orbit/ directory but never runs orbit.
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
          {
            type: 'assistant',
            message: { content: [{ type: 'tool_use', id: 'f1', name: 'Bash', input: { command: "find orbit -name '*.json'" } }] },
          },
          { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'f1', content: `${listing}${g.example}\n` }] } },
        ];
        // A careless reader of the whole trace would pass it: the bait is real.
        expect(new RegExp(g.pattern, g.flags ?? '').test(JSON.stringify(records)), `${id}/${g.id} bait`).toBe(true);
        const t = readTraceRecords(records);
        expect(t.orbitOutput, `${id}/${g.id}`).toBe('');
        expect(grade(g, ctxOf(seeds[id], t.orbitOutput)).pass, `${id}/${g.id}`).toBe(false);
        // …and the same grader passes on orbit's printed answer.
        records.push({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'b1', content: g.example }] } });
        const answered = readTraceRecords(records);
        expect(grade(g, ctxOf(seeds[id], answered.orbitOutput)).pass, `${id}/${g.id} answered`).toBe(true);
      }
    }
    expect(traceGraders).toBe(6);
  });

  it("every orbit_output grader fails on orbit's own answers over the seed, which name the seeded records", () => {
    for (const [id, gs] of Object.entries(graders)) {
      const answers = [
        ['status', '--json'],
        ['status', '--change', 'greet-name', '--json'],
        ['status', '--change', 'greet-name', '--boot'],
        ['status', '--change', 'greet-name', '--report'],
      ].map((args) => {
        const r = runOrbit(seeds[id], args);
        return `${r.stdout}\n${r.stderr}`;
      });
      const orbitOutput = answers.join('\n');
      for (const g of gs.filter((x) => x.type === 'regex' && x.target === 'orbit_output')) {
        expect(grade(g, ctxOf(seeds[id], orbitOutput)).pass, `${id}/${g.id}`).toBe(false);
      }
    }
    // The review and walk seeds' --boot answers do print a path those cases' patterns match:
    // without after_seed, the graders would pass on them.
    for (const id of ['review', 'walk']) {
      const g = graders[id].find((x) => x.type === 'regex' && x.target === 'orbit_output')!;
      const boot = runOrbit(seeds[id], ['status', '--change', 'greet-name', '--boot']).stdout;
      expect(new RegExp(g.pattern).test(boot), `${id} --boot names a seeded record`).toBe(true);
    }
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
      // A trace grader's answer is the path orbit printed when it wrote the newest matching file. The
      // after-state fixture was built on its own, so the case's seed token is not its own: the
      // after_seed rule is shown by the bait checks above, and is set aside here (seedToken null).
      for (const g of gs) {
        let orbitOutput = '';
        if (g.type === 'regex' && g.target === 'orbit_output') {
          const r = spawnSync('bash', ['-c', `ls -d ${g.about} | tail -1`], { cwd: fixture, encoding: 'utf8' });
          orbitOutput = r.stdout.trim();
        }
        const r = grade(g, { fixtureDir: fixture, orbitOutput, seedToken: null });
        expect(r.pass, `${id}/${g.id} after: ${r.detail}`).toBe(true);
      }
    }
  }, 120_000);
});

describe('replay cases — the trace reader', () => {
  it('counts a Bash call as an orbit call only when orbit is the first word of one of its commands', () => {
    const runs = [
      'orbit status --json',
      'cd /x && orbit emit apply --change g --payload p.json',
      'NO_COLOR=1 orbit status',
      "cat > /tmp/p.json <<'EOF'\n{}\nEOF\norbit emit explore --change g --payload /tmp/p.json",
      'x=$(orbit status --json)',
      'orbit status --change g --json | head -5',
      'false || orbit validate g',
    ];
    const names = [
      "find orbit -name 'review-system-*'",
      'ls orbit',
      'grep -rl x orbit',
      'git log --name-only -- orbit',
      'echo orbit path',
      'cat orbit/changes/g/tasks.md',
      'node .orbit-cli/node_modules/orbit-spec/bin/orbit.js status',
    ];
    for (const c of runs) expect(commandRunsOrbit(c), c).toBe(true);
    for (const c of names) expect(commandRunsOrbit(c), c).toBe(false);
  });

  it('gradeAll over a real seed reports every grader of the case', () => {
    const out = gradeAll(graders.walk, ctxOf(seeds.walk, ''));
    expect(Object.keys(out).sort()).toEqual(graders.walk.map((g) => g.id).sort());
  });

  it('an after_seed grader refuses to grade without the seed token', () => {
    const g = graders.walk.find((x) => x.after_seed)!;
    expect(() => grade(g, { fixtureDir: seeds.walk, orbitOutput: g.example })).toThrow(/needs the seed's newest token/);
  });
});
