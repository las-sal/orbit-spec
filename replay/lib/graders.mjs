// The replay set's three grader types, parsed from Markdown files with YAML frontmatter (the
// `claude plugin eval` grader form): `file_exists`, `regex` and `orbit`.
//
// No type reads a session's tool inputs or a loaded skill's text: a `regex` over `orbit_output`
// reads `readTrace().orbitOutput`, which holds only the results of Bash calls that ran `orbit`.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const SHIM_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'shim');

const TYPES = new Set(['file_exists', 'regex', 'orbit']);

/** Splits `---\n<yaml>\n---\n<body>`; a file without frontmatter yields `{}` and the whole text. */
export function splitFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: {}, body: text };
  return { data: YAML.parse(m[1]) ?? {}, body: m[2] };
}

/** Parses one grader file; its id is the file's name without `.md`. Throws on a malformed grader. */
export function parseGrader(file) {
  const { data, body } = splitFrontmatter(fs.readFileSync(file, 'utf8'));
  const id = path.basename(file, '.md');
  const g = { id, ...data, fact: body.trim(), file };
  const fail = (why) => {
    throw new Error(`grader ${file}: ${why}`);
  };
  if (!TYPES.has(g.type)) fail(`type must be one of ${[...TYPES].join(', ')} (got ${JSON.stringify(g.type)})`);
  if (g.type === 'file_exists' && typeof g.path !== 'string') fail('file_exists needs a path');
  if (g.type === 'regex') {
    if (typeof g.pattern !== 'string') fail('regex needs a pattern');
    if (g.target !== 'orbit_output' && !(typeof g.target === 'string' && g.target.startsWith('file:'))) {
      fail("regex target must be 'orbit_output' or 'file:<path>'");
    }
    const re = new RegExp(g.pattern, g.flags ?? '');
    if (g.target === 'orbit_output') {
      // A literal line orbit prints, which the pattern must match: the grader's own positive control,
      // and the bait the free checks plant where a careless reader would find it.
      if (typeof g.example !== 'string' || !re.test(g.example)) {
        fail('a regex over orbit_output needs an example of orbit output its pattern matches');
      }
    }
  }
  if (g.type === 'orbit') {
    if (!Array.isArray(g.args) || g.args.length === 0) fail('orbit needs args (a list)');
    if (typeof g.path !== 'string') fail('orbit needs a path into the JSON answer');
    const checks = ['equals', 'matches', 'exists'].filter((k) => k in g);
    if (checks.length !== 1) fail('orbit needs exactly one of equals, matches, exists');
  }
  return g;
}

/** Every grader of a case, sorted by id. */
export function loadGraders(caseDir) {
  const dir = path.join(caseDir, 'graders');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.md'))
    .sort()
    .map((n) => parseGrader(path.join(dir, n)));
}

/** A grader over a file: `file_exists`, or a `regex` whose target is `file:<path>`. */
export function isFileGrader(g) {
  return g.type === 'file_exists' || (g.type === 'regex' && g.target.startsWith('file:'));
}

/** The fixture path a file grader names. */
export function filePathOf(g) {
  return g.type === 'file_exists' ? g.path : g.target.slice('file:'.length);
}

/** A grader whose fact only orbit's answer makes true: an `orbit` grader, or a `regex` over orbit's output. */
export function isOrbitFact(g) {
  return g.type === 'orbit' || (g.type === 'regex' && g.target === 'orbit_output');
}

// --- a small glob: `*` and `?` within one path segment, no `**` (Node 20 has no fs.globSync) ---

function segmentRegex(seg) {
  const escaped = seg.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]');
  return new RegExp(`^${escaped}$`);
}

export function globFixture(root, pattern) {
  const segments = pattern.split('/').filter(Boolean);
  let current = [root];
  for (const seg of segments) {
    const next = [];
    const wild = /[*?]/.test(seg);
    for (const dir of current) {
      if (!wild) {
        const p = path.join(dir, seg);
        if (fs.existsSync(p)) next.push(p);
        continue;
      }
      let entries = [];
      try {
        entries = fs.readdirSync(dir);
      } catch {
        continue;
      }
      const re = segmentRegex(seg);
      for (const e of entries.sort()) if (re.test(e)) next.push(path.join(dir, e));
    }
    current = next;
  }
  return current;
}

// --- reading an orbit JSON answer by a dotted path: `a.b`, `a.0`, `a[id=x].c`, `a.length` ---

export function readPath(value, dotted) {
  const tokens = [];
  for (const part of dotted.split('.')) {
    const m = /^([^[\]]*)((?:\[[^\]]+\])*)$/.exec(part);
    if (!m) return { found: false };
    if (m[1]) tokens.push({ key: m[1] });
    for (const sel of m[2].match(/\[[^\]]+\]/g) ?? []) {
      const [k, v] = sel.slice(1, -1).split('=');
      tokens.push({ select: [k, v] });
    }
  }
  let cur = value;
  for (const t of tokens) {
    if (t.select) {
      if (!Array.isArray(cur)) return { found: false };
      const [k, v] = t.select;
      cur = cur.find((el) => el && String(el[k]) === v);
      if (cur === undefined) return { found: false };
    } else if (t.key === 'length' && (Array.isArray(cur) || typeof cur === 'string')) {
      cur = cur.length;
    } else {
      if (cur === null || typeof cur !== 'object' || !(t.key in cur)) return { found: false };
      cur = cur[t.key];
    }
  }
  return { found: true, value: cur };
}

/** Runs `orbit <args>` in the fixture through the shim, as a session's shell does. */
export function runOrbit(fixtureDir, args, env = process.env) {
  const r = spawnSync('orbit', args, {
    cwd: fixtureDir,
    env: { ...env, PATH: `${SHIM_DIR}${path.delimiter}${env.PATH ?? ''}`, NO_COLOR: '1' },
    encoding: 'utf8',
    timeout: 120_000,
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function parseJsonAnswer(stdout) {
  try {
    return { ok: true, value: JSON.parse(stdout) };
  } catch {
    // Some commands print a spinner line before the JSON; take the outermost object.
    const start = stdout.indexOf('{');
    const end = stdout.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return { ok: true, value: JSON.parse(stdout.slice(start, end + 1)) };
      } catch {
        /* fall through */
      }
    }
    return { ok: false };
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Grades one fact. `ctx` is `{ fixtureDir, orbitOutput, orbit? }`, where `orbit(args)` runs orbit
 * in the fixture (default: through the shim). Returns `{ pass, detail }`.
 */
export function grade(g, ctx) {
  const orbit = ctx.orbit ?? ((args) => runOrbit(ctx.fixtureDir, args));
  if (g.type === 'file_exists') {
    const hits = globFixture(ctx.fixtureDir, g.path);
    const pass = g.absent ? hits.length === 0 : hits.length > 0;
    return { pass, detail: `${hits.length} match(es) for ${g.path}` };
  }
  if (g.type === 'regex') {
    const re = new RegExp(g.pattern, g.flags ?? '');
    let text;
    if (g.target === 'orbit_output') {
      text = ctx.orbitOutput ?? '';
    } else {
      const hits = globFixture(ctx.fixtureDir, filePathOf(g));
      if (hits.length === 0) return { pass: false, detail: `no file at ${filePathOf(g)}` };
      text = fs.readFileSync(hits[0], 'utf8');
    }
    const pass = re.test(text);
    return { pass, detail: pass ? 'matched' : 'no match' };
  }
  // orbit
  const r = orbit(g.args);
  const parsed = parseJsonAnswer(r.stdout);
  if (!parsed.ok) return { pass: false, detail: `orbit ${g.args.join(' ')} gave no JSON (exit ${r.status})` };
  const at = readPath(parsed.value, g.path);
  if ('exists' in g) {
    const pass = at.found === Boolean(g.exists);
    return { pass, detail: at.found ? `${g.path} present` : `${g.path} absent` };
  }
  if (!at.found) return { pass: false, detail: `${g.path} absent` };
  if ('equals' in g) {
    const pass = deepEqual(at.value, g.equals);
    return { pass, detail: `${g.path} = ${JSON.stringify(at.value)}` };
  }
  const shown = typeof at.value === 'string' ? at.value : JSON.stringify(at.value);
  const pass = new RegExp(g.matches).test(shown);
  return { pass, detail: `${g.path} = ${shown.slice(0, 200)}` };
}

/** Grades every grader; a grader that throws fails with the error as its detail. */
export function gradeAll(graders, ctx) {
  const out = {};
  for (const g of graders) {
    try {
      out[g.id] = grade(g, ctx);
    } catch (err) {
      out[g.id] = { pass: false, detail: `error: ${err.message}` };
    }
  }
  return out;
}

/** A case's `start` checks are `orbit`-type checks; each is graded like an `orbit` grader. */
export function checkStart(start, ctx) {
  const failures = [];
  (start ?? []).forEach((check, i) => {
    const g = { id: `start-${i + 1}`, type: 'orbit', ...check };
    const r = grade(g, ctx);
    if (!r.pass) failures.push(`${g.args.join(' ')} → ${r.detail}`);
  });
  return failures;
}
