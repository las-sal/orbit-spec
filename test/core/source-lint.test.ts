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
  checkSpanAgainstValue,
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
  //
  // These run through `runSourceLint`, NOT through `String.prototype.includes`. An earlier
  // version asserted `d.span.includes(d.sourceValue)` directly, which is a statement about
  // JavaScript: it passed identically whether the lint compared strings, parsed numbers, or
  // did nothing at all. The change's own motivating evidence has to be able to detect a
  // regression in the code it motivated.
  const realDefects: { name: string; span: string; sourceValue: string }[] = [
    { name: 'a schema version restated in prose', span: 'version 3', sourceValue: '4' },
    { name: 'a ruling range endpoint', span: 'R-crc-1..8', sourceValue: '10' },
    { name: 'a stage count in English words', span: 'seventeen small stages', sourceValue: '18' },
    { name: 'a compound severity string', span: '4C/7W/0S', sourceValue: '4C/6W/0S' },
  ];

  let root: string;
  beforeEach(() => {
    root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-defects-')));
    execFileSync('git', ['init', '-q'], { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
    execFileSync('git', ['config', 'user.email', 't@example.com'], { cwd: root, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'T'], { cwd: root, stdio: 'ignore' });
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  /**
   * Stands a source up that emits an ARBITRARY string — including a compound one the CLOSED
   * v1 engine table cannot produce — by giving `specs.capability-count` exactly that many
   * capability directories, or, for a non-numeric value, by checking the comparison the lint
   * actually performs against a real parsed span.
   */
  const lintWith = (span: string, capabilities: number) => {
    fs.mkdirSync(path.join(root, 'orbit'), { recursive: true });
    for (let i = 0; i < capabilities; i++) {
      const dir = path.join(root, 'orbit', 'specs', `cap-${i}`);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'spec.md'), '# c\n');
    }
    fs.writeFileSync(path.join(root, 'orbit', 'sources.yaml'), 'sources:\n  n:\n    engine: specs.capability-count\n');
    fs.writeFileSync(path.join(root, 'GOV.md'), `prose ${OPEN('n')}${span}${CLOSE} prose\n`);
    execFileSync('git', ['add', '-A'], { cwd: root, stdio: 'ignore' });
    execFileSync('git', ['commit', '-q', '-m', 'x'], { cwd: root, stdio: 'ignore' });
    return runSourceLint(root);
  };

  for (const d of realDefects.filter((d) => /^\d+$/.test(d.sourceValue))) {
    it(`FAILS on ${d.name}, through the real lint`, () => {
      const r = lintWith(d.span, Number(d.sourceValue));
      expect(r.findings).toEqual([
        {
          kind: 'mismatch',
          file: 'GOV.md',
          line: 1,
          source: 'n',
          span_text: d.span,
          source_value: d.sourceValue,
        },
      ]);
    });
  }

  it('FAILS on a compound severity string, through the real parse and check', () => {
    // The CLOSED v1 engine table emits no compound value, so this case is exercised one layer
    // down — at the real parsed span against the real comparison — rather than against
    // `includes` in the abstract. It is the only fixture that discriminates containment from a
    // numeric parse, so it must touch the product somewhere.
    const d = realDefects.find((x) => x.sourceValue === '4C/6W/0S')!;
    const parsed = parseMarkedSpans(`prose ${OPEN('pair')}${d.span}${CLOSE} prose\n`);
    expect(parsed.error).toBeNull();
    expect(parsed.spans).toHaveLength(1);
    expect(checkSpanAgainstValue(parsed.spans[0].text, d.sourceValue)).toBe(false);
    expect(checkSpanAgainstValue('the pair was 4C/6W/0S overall', d.sourceValue)).toBe(true);
  });

  it('an AGREEING span of the same shape passes, so the four failures mean something', () => {
    const r = lintWith('4 capabilities', 4);
    expect(r.findings).toEqual([]);
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

  it('every conforming marker inside a backtick span anywhere in the LIVING project goes silent', () => {
    // DERIVED FROM THE LINT'S OWN DOMAIN, not from a directory name. The earlier version read
    // `orbit/changes/rc07-artifact-lint` literally, so archiving this change — its own next
    // lifecycle step — moved the directory and the suite went red before its first assertion.
    // Resolving the domain instead is strictly stronger (it covers every living document, not
    // one directory), and it survives the archive untouched: the change's prose becomes an
    // excluded RECORD while the synced baseline spec keeps carrying the syntax it describes.
    const { files, reason } = resolveFileDomain(process.cwd());
    expect(reason).toBeNull();
    expect(files.length).toBeGreaterThan(0);

    const tokenPattern = /<!--\s*(?:src:[a-z0-9][a-z0-9-]*|\/src)\s*-->/g;
    let inCodeRegion = 0;
    const dogfooded = new Map<string, number>();

    for (const file of files) {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
      const code = computeCodeRegionMask(content);
      tokenPattern.lastIndex = 0;
      for (let m = tokenPattern.exec(content); m !== null; m = tokenPattern.exec(content)) {
        if (code[m.index]) inCodeRegion++;
      }
      const { spans, error } = parseMarkedSpans(content);
      expect(error, `${file} must carry no malformed marker`).toBeNull();
      if (spans.length > 0) dogfooded.set(file, spans.length);
    }

    // Prose DESCRIBING the syntax is everywhere in this capability's artifacts and must all be
    // inert; the only live spans in the project are the deliberate dogfood.
    expect(inCodeRegion).toBeGreaterThan(0);
    expect([...dogfooded.keys()]).toEqual(['CLAUDE.md']);
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

// ---- Regressions from the system-mode blind pair ---------------------------

describe('the delimiter grammar is matched EXACTLY', () => {
  // The spec says a comment that does not match the opener grammar exactly is INERT. A
  // tolerant `\s*` turned every one of these into a live span, so prose the contract declares
  // inert could raise a false failure.
  const inertForms = [
    ['compact, no spaces', `<!${'--'}src:stages${'--'}>18<!${'--'}/src${'--'}>`],
    ['tabbed', `<!${'--'}\tsrc:stages\t${'--'}>18<!${'--'}\t/src\t${'--'}>`],
    ['double-spaced', `<!${'--'}  src:stages  ${'--'}>18<!${'--'}  /src  ${'--'}>`],
    ['split across lines', `<!${'--'}\nsrc:stages\n${'--'}>18<!${'--'}\n/src\n${'--'}>`],
  ] as const;

  for (const [label, doc] of inertForms) {
    it(`treats a ${label} comment as inert`, () => {
      expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
    });
  }

  it('still recognises the exact canonical form', () => {
    expect(parseMarkedSpans(`${OPEN('stages')}18${CLOSE}`).spans).toHaveLength(1);
  });
});

describe('the code-region mask respects CommonMark block and escape rules', () => {
  it('a code span never crosses a blank line, so stray backticks cannot swallow a marker', () => {
    const doc = ['A sentence with a stray backtick `', '', `has ${OPEN('stages')}99${CLOSE} stages`, '', 'Another stray `'].join('\n');
    expect(parseMarkedSpans(doc).spans).toHaveLength(1);
  });

  it('a BACKSLASH-ESCAPED backtick opens nothing, so the marker after it stays live', () => {
    const doc = `Escaped \\\` then ${OPEN('stages')}99${CLOSE} then \\\` again`;
    expect(parseMarkedSpans(doc).spans).toHaveLength(1);
  });

  it('an EVEN number of backslashes leaves the backtick a real delimiter', () => {
    const doc = `A \\\\\` ${OPEN('stages')}99${CLOSE} \\\\\` B`;
    expect(parseMarkedSpans(doc).spans).toHaveLength(0);
  });

  it('pairing is linear: many unmatched runs of distinct lengths do not blow up', () => {
    // The old implementation re-scanned the whole remaining group per unmatched run. This is
    // a bound, not a benchmark — it fails on superlinear behaviour, not on a slow machine.
    let doc = '';
    for (let i = 1; i <= 400; i++) doc += '`'.repeat((i % 17) + 1) + ` filler ${i} `;
    doc += `\n\n${OPEN('stages')}99${CLOSE}\n`;
    const started = Date.now();
    const { spans } = parseMarkedSpans(doc);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(spans).toHaveLength(1);
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

  it('a tracked file with a NON-ASCII name is in the domain and its stale span fails', () => {
    // git's default core.quotePath=true C-quotes such a path, which then named no file on
    // disk and left the domain with no signal at all — the silent partial lint this
    // capability's own thesis is written against. `-z` emits raw bytes.
    fs.writeFileSync(path.join(root, 'dé-café.md'), `has ${OPEN('stages')}99${CLOSE}\n`);
    fs.writeFileSync(path.join(root, 'plain.md'), `has ${OPEN('stages')}99${CLOSE}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings.map((f) => f.file).sort()).toEqual(['dé-café.md', 'plain.md']);
    // Every domain file was readable, so scanned == domain.
    expect(r.filesScanned).toBe(resolveFileDomain(root).files.length);
    expect(resolveFileDomain(root).files).toContain('dé-café.md');
  });

  it('a tracked path with surrounding spaces survives, because paths are never trimmed', () => {
    fs.writeFileSync(path.join(root, ' spaced .md'), `has ${OPEN('stages')}99${CLOSE}\n`);
    track();
    expect(runSourceLint(root).findings.map((f) => f.file)).toEqual([' spaced .md']);
  });

  it('a tracked-but-DELETED file is the one correct silence', () => {
    fs.writeFileSync(path.join(root, 'gone.md'), `has ${OPEN('stages')}99${CLOSE}\n`);
    track();
    const listed = resolveFileDomain(root).files.length;
    fs.rmSync(path.join(root, 'gone.md'));
    const r = runSourceLint(root);
    expect(r.findings).toEqual([]);
    // Still LISTED by git, but not read — and never counted as scanned.
    expect(resolveFileDomain(root).files.length).toBe(listed);
    expect(r.filesScanned).toBe(listed - 1);
  });

  it('an UNREADABLE tracked file is reported, never swallowed, and is not counted as scanned', () => {
    const unreadable = path.join(root, 'locked.md');
    fs.writeFileSync(unreadable, `has ${OPEN('stages')}99${CLOSE}\n`);
    // Deliberately STALE, so its finding proves the readable sibling was still linted.
    fs.writeFileSync(path.join(root, 'ok.md'), `has ${OPEN('stages')}99${CLOSE}\n`);
    track();
    const listed = resolveFileDomain(root).files.length;
    fs.chmodSync(unreadable, 0o000);
    try {
      const r = runSourceLint(root);
      const fault = r.findings.find((f) => f.kind === 'domain' && f.file === 'locked.md');
      expect(fault, 'an unreadable tracked file must produce a DOMAIN finding').toBeDefined();
      expect((fault as { detail: string }).detail).toMatch(/could not be read/);
      // A domain fault is NOT a marker error: there is no delimiter, so it carries no line.
      expect(fault).not.toHaveProperty('line');
      expect(r.findings.some((f) => f.kind === 'marker')).toBe(false);
      // Every other file still lints; only the unreadable one is missing from the count.
      expect(r.filesScanned).toBe(listed - 1);
      expect(r.findings.some((f) => f.kind === 'mismatch' && f.file === 'ok.md')).toBe(true);
    } finally {
      fs.chmodSync(unreadable, 0o644);
    }
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
