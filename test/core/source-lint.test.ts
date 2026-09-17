import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';
import {
  runSourceLint,
  parseMarkedSpans,
  resolveFileDomain,
  isExcludedPath,
} from '../../src/core/source-lint.js';
import { computeCodeRegionMask } from '../../src/core/markdown-fence.js';

// The marker tokens are built at runtime rather than written literally, so that this
// instrument does not itself become a live marked span in the project it lints.
const OPEN = (name: string) => `<!${'--'} src:${name} ${'--'}>`;
const CLOSE = `<!${'--'} /src ${'--'}>`;

// ---- The check (task 2.3) --------------------------------------------------

describe('the check is string containment inside an author-drawn boundary', () => {
  // The FOUR REAL DEFECTS from explore.md Case 2, as written, against what their sources
  // emit. All four must FAIL — that is the whole reason this capability exists.
  const realDefects: { name: string; span: string; sourceValue: string }[] = [
    { name: 'a schema version restated in prose', span: 'version 3', sourceValue: '4' },
    { name: 'a ruling range endpoint', span: 'R-crc-1..8', sourceValue: '10' },
    { name: 'a stage count in English words', span: 'seventeen small stages', sourceValue: '18' },
    { name: 'a compound severity string', span: '4C/7W/0S', sourceValue: '4C/6W/0S' },
  ];

  for (const d of realDefects) {
    it(`FAILS on ${d.name}`, () => {
      expect(d.span.includes(d.sourceValue)).toBe(false);
    });
  }

  it('the compound case needs no numeric parsing: containment alone decides both ways', () => {
    expect('the pair was 4C/6W/0S overall'.includes('4C/6W/0S')).toBe(true);
    expect('the pair was 4C/7W/0S overall'.includes('4C/6W/0S')).toBe(false);
  });
});

// ---- The span parser and its pairing table (task 2.2) ----------------------

describe('span pairing is a closed table', () => {
  it('opener then closer yields one span whose text is the bytes between them', () => {
    const { spans, error } = parseMarkedSpans(`x ${OPEN('stages')}18${CLOSE} y\n`);
    expect(error).toBeNull();
    expect(spans).toEqual([{ source: 'stages', line: 1, text: '18' }]);
  });

  it('a second opener before any closer is a MARKER ERROR naming the FIRST opener line', () => {
    const { spans, error } = parseMarkedSpans(`a\n${OPEN('one')}x\nb\n${OPEN('two')}y${CLOSE}\n`);
    expect(spans).toEqual([]);
    expect(error).toMatchObject({ line: 2 });
    expect(error!.detail).toMatch(/unclosed marker/);
  });

  it('a closer with no open span is a MARKER ERROR naming its own line', () => {
    const { error } = parseMarkedSpans(`a\nb\n${CLOSE}\n`);
    expect(error).toMatchObject({ line: 3 });
    expect(error!.detail).toMatch(/orphan closer/);
  });

  it('an opener with no closer before EOF is a MARKER ERROR naming the opener line', () => {
    const { error } = parseMarkedSpans(`a\n${OPEN('stages')}18 and then nothing\n`);
    expect(error).toMatchObject({ line: 2 });
    expect(error!.detail).toMatch(/end of file/);
  });

  it('an opener immediately followed by its closer is an EMPTY span, not a syntax error', () => {
    const { spans, error } = parseMarkedSpans(`${OPEN('stages')}${CLOSE}\n`);
    expect(error).toBeNull();
    expect(spans).toEqual([{ source: 'stages', line: 1, text: '' }]);
    // An empty span contains no source value, so it fails like any disagreeing span.
    expect(''.includes('18')).toBe(false);
  });

  it('a span crossing line endings reports the OPENER line', () => {
    const { spans } = parseMarkedSpans(`a\nb ${OPEN('stages')}1\n8\n${CLOSE} c\n`);
    expect(spans[0].line).toBe(2);
    expect(spans[0].text).toBe('1\n8\n');
  });
});

// ---- Inertness (task 2.2) --------------------------------------------------

describe('prose ABOUT the syntax never becomes prose CHECKED by it', () => {
  it('a comment failing the NAME grammar is not a marker at all', () => {
    const { spans, error } = parseMarkedSpans(`<!${'--'} src:NAME ${'--'}>18${CLOSE} and <!${'--'} src:Bad_Name ${'--'}>\n`);
    // The only live delimiter is the closer, so the file reports an orphan closer and no span.
    expect(spans).toEqual([]);
    expect(error!.detail).toMatch(/orphan closer/);
  });

  it('a marker inside a fenced code block is inert', () => {
    const doc = ['before', '```markdown', `${OPEN('stages')}18${CLOSE}`, '```', 'after'].join('\n');
    expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
  });

  it('a marker inside an inline code span is inert', () => {
    const doc = `The opener is \`${OPEN('stages')}\` and the closer is \`${CLOSE}\`.\n`;
    expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
  });

  it('every conforming marker inside a backtick span in this change\'s own prose goes silent', () => {
    // ENUMERATED FROM THE FILES, never transcribed and never pinned to a count: the number
    // moves whenever a scenario is added, and an earlier draft that said "four" was already
    // wrong. The rule is that whatever is there must be inert.
    const changeDir = path.join('orbit', 'changes', 'rc07-artifact-lint');
    const files = listMarkdown(changeDir).filter((f) => !f.includes('.orbit-runs'));
    expect(files.length).toBeGreaterThan(0);

    const tokenPattern = /<!--\s*(?:src:[a-z0-9][a-z0-9-]*|\/src)\s*-->/g;
    let inBacktick = 0;
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const code = computeCodeRegionMask(content);
      tokenPattern.lastIndex = 0;
      for (let m = tokenPattern.exec(content); m !== null; m = tokenPattern.exec(content)) {
        if (code[m.index]) inBacktick++;
      }
      // Whatever the count, NONE of them may produce a span or a marker error.
      expect(parseMarkedSpans(content), `${file} must carry no live marker`).toEqual({
        spans: [],
        error: null,
      });
    }
    // The fixtures are real: this change's prose does document the syntax.
    expect(inBacktick).toBeGreaterThan(0);
  });
});

describe('the inline-code grammar (CommonMark 0.31.2 code spans)', () => {
  const regions = (s: string) => computeCodeRegionMask(s);

  it('a run closed by an EQUAL-LENGTH run is a code region', () => {
    const s = 'a `x` b';
    expect(regions(s)[2]).toBe(true); // the opening backtick
    expect(regions(s)[3]).toBe(true); // x
    expect(regions(s)[6]).toBe(false); // b
  });

  it('a DIFFERENT-LENGTH run is not a delimiter pair; scanning continues', () => {
    const s = 'a `b `` c ` d';
    const m = regions(s);
    // The single-backtick run pairs with the LATER single-backtick run, not the double.
    expect(m[s.indexOf('b')]).toBe(true);
    expect(m[s.indexOf('c')]).toBe(true);
    expect(m[s.indexOf('d')]).toBe(false);
  });

  it('a run with NO matching run anywhere after it is literal text, and what follows stays live', () => {
    const s = `a \` b ${OPEN('stages')}18${CLOSE}\n`;
    expect(regions(s)[s.indexOf('<!')]).toBe(false);
    expect(parseMarkedSpans(s).spans).toHaveLength(1);
  });

  it('a code span crossing a line ending is ONE region', () => {
    const s = 'a `one\ntwo` b';
    const m = regions(s);
    expect(m[s.indexOf('one')]).toBe(true);
    expect(m[s.indexOf('\n')]).toBe(true);
    expect(m[s.indexOf('two')]).toBe(true);
    expect(m[s.length - 1]).toBe(false);
  });

  it('two adjacent code spans are two regions and the text between them is live', () => {
    const s = 'x `a` LIVE `b` y';
    const m = regions(s);
    expect(m[s.indexOf('a')]).toBe(true);
    expect(m[s.indexOf('LIVE')]).toBe(false);
    expect(m[s.indexOf('b')]).toBe(true);
  });

  it('a backtick run inside a FENCED block is not a code span; the fence already covers it', () => {
    const s = ['```', 'a ` lonely backtick', '```', 'LIVE'].join('\n');
    const m = regions(s);
    expect(m[s.indexOf('lonely')]).toBe(true);
    expect(m[s.indexOf('LIVE')]).toBe(false);
  });
});

// ---- The domain and its exclusions (task 2.1) ------------------------------

describe('the file domain', () => {
  it('excludes RECORDS, fixtures, templates, generated surface and historical files', () => {
    for (const p of [
      'orbit/changes/archive/2026-01-01-x/proposal.md',
      'orbit/changes/rc07-artifact-lint/.orbit-runs/review-x.md',
      'orbit/architecture/.orbit-runs/x.md',
      'test/core/source-lint.test.ts',
      'schemas/spec-driven/templates/proposal.md',
      'orbit/schemas/spec-driven/templates/proposal.md',
      '.claude/skills/orbit-review/SKILL.md',
      'README_OLD.md',
      'adopter-report-openspec-to-orbit-dir.md',
    ]) {
      expect(isExcludedPath(p), p).toBe(true);
    }
  });

  it('includes living documents anywhere in the project, not only orbit/', () => {
    for (const p of [
      'CLAUDE.md',
      'README.md',
      'docs/cli.md',
      'orbit/architecture/clean-up-review-cycle.md',
      'orbit/specs/orbit-conventions/spec.md',
      'schemas/spec-driven/README.md',
    ]) {
      expect(isExcludedPath(p), p).toBe(false);
    }
  });

  it('a checkout without git degrades to an EMPTY domain with a named reason, never an exception', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-nogit-'));
    try {
      const { files, reason } = resolveFileDomain(dir);
      expect(files).toEqual([]);
      expect(reason).toMatch(/not a repository|no git/i);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---- End to end over a real git repository ---------------------------------

describe('runSourceLint end to end', () => {
  let root: string;

  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });

  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-lint-')));
    fs.mkdirSync(path.join(root, 'orbit', 'architecture'), { recursive: true });
    fs.mkdirSync(path.join(root, 'orbit', 'specs', 'cap-one'), { recursive: true });
    fs.writeFileSync(path.join(root, 'orbit', 'specs', 'cap-one', 'spec.md'), '# one\n');
    fs.writeFileSync(
      path.join(root, 'orbit', 'architecture', 'prog.md'),
      ['# Program', '', '### Stage s1 — one', '', '### Stage s2 — two', ''].join('\n')
    );
    fs.writeFileSync(
      path.join(root, 'orbit', 'sources.yaml'),
      'sources:\n  stages:\n    engine: architecture.stage-count\n    doc: prog\n'
    );
    git('init', '-q');
    git('config', 'user.email', 't@example.com');
    git('config', 'user.name', 'T');
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  const track = () => {
    git('add', '-A');
    git('commit', '-q', '-m', 'x');
  };

  it('no registry means total silence', () => {
    fs.rmSync(path.join(root, 'orbit', 'sources.yaml'));
    track();
    expect(runSourceLint(root)).toEqual({
      registryPresent: false,
      findings: [],
      coverage: [],
      filesScanned: 0,
      domainReason: null,
    });
  });

  it('an agreeing span passes and is counted in coverage', () => {
    fs.writeFileSync(path.join(root, 'GOV.md'), `The program has ${OPEN('stages')}2${CLOSE} stages.\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([]);
    expect(r.coverage).toEqual([{ source: 'stages', value: '2', markers: 1 }]);
  });

  it('a disagreeing span FAILS naming file, line, source, span text and source value', () => {
    fs.writeFileSync(path.join(root, 'GOV.md'), `line one\nThe program has ${OPEN('stages')}17${CLOSE} stages.\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([
      { kind: 'mismatch', file: 'GOV.md', line: 2, source: 'stages', span_text: '17', source_value: '2' },
    ]);
  });

  it('a marker naming an undeclared source is an unknown-source finding', () => {
    fs.writeFileSync(path.join(root, 'GOV.md'), `${OPEN('nope')}1${CLOSE}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([{ kind: 'unknown-source', file: 'GOV.md', line: 1, source: 'nope' }]);
    expect(r.coverage).toEqual([{ source: 'stages', value: '2', markers: 0 }]);
  });

  it("a marker error's blast radius is ONE FILE; every other file still lints", () => {
    fs.writeFileSync(path.join(root, 'BROKEN.md'), `${OPEN('stages')}2\nand no closer at all\n`);
    fs.writeFileSync(path.join(root, 'OTHER.md'), `has ${OPEN('stages')}99${CLOSE}\n`);
    track();
    const r = runSourceLint(root);
    const kinds = r.findings.map((f) => `${f.kind}:${f.file}`).sort();
    expect(kinds).toEqual(['marker:BROKEN.md', 'mismatch:OTHER.md']);
  });

  it('a marked span inside a RECORD is ignored', () => {
    const archive = path.join(root, 'orbit', 'changes', 'archive', '2026-01-01-old');
    fs.mkdirSync(archive, { recursive: true });
    fs.writeFileSync(path.join(archive, 'proposal.md'), `back then there were ${OPEN('stages')}7${CLOSE}\n`);
    track();
    expect(runSourceLint(root).findings).toEqual([]);
  });

  it('an UNTRACKED file is outside the domain until it is added', () => {
    track();
    fs.writeFileSync(path.join(root, 'NEW.md'), `${OPEN('stages')}999${CLOSE}\n`);
    expect(runSourceLint(root).findings).toEqual([]);
    track();
    expect(runSourceLint(root).findings).toHaveLength(1);
  });

  it('coverage names a source nothing points at', () => {
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([]);
    expect(r.coverage).toEqual([{ source: 'stages', value: '2', markers: 0 }]);
  });

  it('a malformed registry is ONE registry finding and resolves nothing', () => {
    fs.writeFileSync(path.join(root, 'orbit', 'sources.yaml'), 'sources:\n  a:\n    engine: nope\n');
    track();
    const r = runSourceLint(root);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].kind).toBe('registry');
    expect(r.coverage).toEqual([]);
  });

  it('a source that will not resolve is reported once, at the registry level, with a null coverage value', () => {
    fs.writeFileSync(
      path.join(root, 'orbit', 'architecture', 'prog.md'),
      ['# Program', '', '### Stage s1 — one', '', '### Stage bad_id no em-dash', ''].join('\n')
    );
    fs.writeFileSync(path.join(root, 'GOV.md'), `${OPEN('stages')}2${CLOSE}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]).toMatchObject({ kind: 'registry' });
    expect(r.coverage).toEqual([{ source: 'stages', value: null, markers: 1 }]);
  });
});

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}
