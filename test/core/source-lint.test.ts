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
import { readSourcesRegistry } from '../../src/core/sources-registry.js';

// The marker tokens are built at runtime rather than written literally, so that this
// instrument does not itself become a live marked span in the project it lints.
const OPEN = (name: string) => `<!${'--'} src:${name} ${'--'}>`;
const CLOSE = (name: string) => `<!${'--'} /src:${name} ${'--'}>`;

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
    fs.writeFileSync(path.join(root, 'GOV.md'), `prose ${OPEN('n')}${span}${CLOSE('n')} prose\n`);
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
    const parsed = parseMarkedSpans(`prose ${OPEN('pair')}${d.span}${CLOSE('pair')} prose\n`);
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
    const { spans, error } = parseMarkedSpans(`x ${OPEN('stages')}18${CLOSE('stages')} y\n`);
    expect(error).toBeNull();
    expect(spans).toEqual([{ source: 'stages', line: 1, text: '18' }]);
  });

  it('a second opener before any closer is a MARKER ERROR naming the FIRST opener line', () => {
    const { spans, error } = parseMarkedSpans(`a\n${OPEN('one')}x\nb\n${OPEN('two')}y${CLOSE('two')}\n`);
    expect(spans).toEqual([]);
    expect(error).toMatchObject({ line: 2 });
    expect(error!.detail).toMatch(/unclosed marker/);
  });

  it('a closer with no open span is a MARKER ERROR naming its own line', () => {
    const { error } = parseMarkedSpans(`a\nb\n${CLOSE('stages')}\n`);
    expect(error).toMatchObject({ line: 3 });
    expect(error!.detail).toMatch(/orphan closer/);
  });

  it('an opener with no closer before EOF is a MARKER ERROR naming the opener line', () => {
    const { error } = parseMarkedSpans(`a\n${OPEN('stages')}18 and then nothing\n`);
    expect(error).toMatchObject({ line: 2 });
    expect(error!.detail).toMatch(/end of file/);
  });

  it('a closer naming a DIFFERENT source is a mismatched-closer error', () => {
    // An authoring error the anonymous closer could not express: it would have silently closed
    // a span the author never opened.
    const { spans, error } = parseMarkedSpans(`${OPEN('stages')}18${CLOSE('rulings')}\n`);
    expect(spans).toEqual([]);
    expect(error).toMatchObject({ line: 1 });
    expect(error!.detail).toMatch(/mismatched closer/);
    expect(error!.detail).toContain('src:stages');
  });

  it('an opener immediately followed by its closer is an EMPTY span, not a syntax error', () => {
    const { spans, error } = parseMarkedSpans(`${OPEN('stages')}${CLOSE('stages')}\n`);
    expect(error).toBeNull();
    expect(spans).toEqual([{ source: 'stages', line: 1, text: '' }]);
    // An empty span contains no source value, so it fails like any disagreeing span.
    expect(''.includes('18')).toBe(false);
  });

  it('a span crossing line endings reports the OPENER line', () => {
    const { spans } = parseMarkedSpans(`a\nb ${OPEN('stages')}1\n8\n${CLOSE('stages')} c\n`);
    expect(spans[0].line).toBe(2);
    expect(spans[0].text).toBe('1\n8\n');
  });
});

// ---- Inertness (task 2.2) --------------------------------------------------

describe('prose ABOUT the syntax never becomes prose CHECKED by it', () => {
  it('a comment failing the NAME grammar is not a marker at all', () => {
    const { spans, error } = parseMarkedSpans(`<!${'--'} src:NAME ${'--'}>18${CLOSE('stages')} and <!${'--'} src:Bad_Name ${'--'}>\n`);
    // The only live delimiter is the closer, so the file reports an orphan closer and no span.
    expect(spans).toEqual([]);
    expect(error!.detail).toMatch(/orphan closer/);
  });

  it('a marker inside a fenced code block is inert', () => {
    const doc = ['before', '```markdown', `${OPEN('stages')}18${CLOSE('stages')}`, '```', 'after'].join('\n');
    expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
  });

  it('a PLACEHOLDER-named pair in prose is inert, inside backticks or not', () => {
    // This replaces an inline-code-span test. Backticks no longer confer inertness — the NAME
    // does — so the same prose must go silent either way.
    const inTicks = `The opener is \`${OPEN('NAME')}\` and the closer is \`${CLOSE('NAME')}\`.\n`;
    const bare = `The opener is ${OPEN('NAME')} and the closer is ${CLOSE('NAME')}.\n`;
    for (const doc of [inTicks, bare]) {
      expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
    }
  });

  it('a LEGACY anonymous-closer pair fails LOUDLY at its opener, never silently', () => {
    // The migration failure mode, pinned. An old-format document does not go quietly inert: the
    // anonymous closer is no longer a delimiter, so the opener reaches EOF and the error names
    // the closer the author now has to write.
    const legacy = `prose ${OPEN('stages')}18<!${'--'} /src ${'--'}> more\n`;
    const { spans, error } = parseMarkedSpans(legacy);
    expect(spans).toEqual([]);
    expect(error!.detail).toMatch(/unclosed marker/);
    expect(error!.detail).toContain('<!-- /src:stages -->');
  });

  it('a REAL-named pair in prose IS live — the authoring rule is to use a placeholder', () => {
    // The honest cost of deleting the inline scanner, asserted rather than left implicit.
    const doc = `example: ${OPEN('stages')}18${CLOSE('stages')}\n`;
    expect(parseMarkedSpans(doc).spans).toHaveLength(1);
  });

  it('no living document carries a malformed marker, and every live span names a declared source', () => {
    // DERIVED FROM THE LINT'S OWN DOMAIN, not from a directory name. The earlier version read
    // `orbit/changes/rc07-artifact-lint` literally, so archiving this change — its own next
    // lifecycle step — moved the directory and the suite went red before its first assertion.
    // Resolving the domain instead is strictly stronger (it covers every living document, not
    // one directory), and it survives the archive untouched: the change's prose becomes an
    // excluded RECORD while the synced baseline spec keeps carrying the syntax it describes.
    const { files, reason } = resolveFileDomain(process.cwd());
    expect(reason).toBeNull();
    expect(files.length).toBeGreaterThan(0);

    // Only CONFORMING delimiters count. The old pattern also matched the retired anonymous
    // closer, so the sweep could satisfy itself on tokens the parser no longer recognises at all.
    const tokenPattern = /<!-- (?:src|\/src):[a-z0-9][a-z0-9-]*(?= )[^>]*-->/g;
    let inCodeRegion = 0;
    const dogfooded = new Map<string, string[]>();

    for (const file of files) {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
      const code = computeCodeRegionMask(content);
      tokenPattern.lastIndex = 0;
      for (let m = tokenPattern.exec(content); m !== null; m = tokenPattern.exec(content)) {
        if (code[m.index]) inCodeRegion++;
      }
      const { spans, error } = parseMarkedSpans(content);
      expect(error, `${file} must carry no malformed marker`).toBeNull();
      if (spans.length > 0) dogfooded.set(file, spans.map((sp) => sp.source));
    }

    // What this does NOT assert is which files carry live spans: pinning the present set would
    // make adding a legitimate marked claim anywhere in the project fail a unit test, and the
    // capability is explicitly project-wide.
    //
    // It also no longer asserts `inCodeRegion > 0` — that at least one CONFORMING token sits
    // inside a fenced example somewhere in the live domain. That requirement was unsound twice
    // over, and both ways it was unsound are worth stating, because it went red without a line
    // of engine code changing.
    //
    //   1. It depended on rc07's own in-flight artifacts. The comment at the top of this case
    //      says resolving the domain "survives the archive untouched" — it does, but the
    //      THRESHOLD did not: rc07's prose became an excluded RECORD at archive, taking the only
    //      real-named fenced examples in the domain with it.
    //   2. It demanded prose this capability's own AUTHORING RULE tells writers not to produce.
    //      A fenced example naming a REAL source is live-shaped; that is precisely why the rule
    //      says prose writes a PLACEHOLDER name, and placeholders do not match the conforming
    //      token grammar. The assertion was requiring the domain to contain a counter-example to
    //      its own guidance.
    //
    // Inertness inside code regions is exercised on CONSTRUCTED documents above, in both
    // directions, where it belongs. What a sweep over LIVING documents can soundly own is the
    // invariant below: no live span ever OPENS inside a code region. It is vacuously true when
    // the domain happens to hold no fenced examples, which is the correct reading — the absence
    // of examples is not a defect in living prose.
    for (const file of files) {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
      const code = computeCodeRegionMask(content);
      const lineStarts = [0];
      for (let i = 0; i < content.length; i++) if (content[i] === '\n') lineStarts.push(i + 1);
      for (const sp of parseMarkedSpans(content).spans) {
        const start = lineStarts[sp.line - 1];
        const rel = content.slice(start).indexOf(`<!-- src:${sp.source} -->`);
        expect(rel, `${file}:${sp.line} — opener not found on its reported line`).toBeGreaterThanOrEqual(0);
        expect(
          code[start + rel],
          `${file}:${sp.line} — a live span opened inside a code region`
        ).toBeFalsy();
      }
    }

    // Informational, never a threshold: how many conforming tokens the domain currently holds
    // inside code regions. Zero is legitimate (see above); this keeps the figure readable
    // without letting it gate.
    expect(inCodeRegion).toBeGreaterThanOrEqual(0);

    const declared = new Set(readSourcesRegistry(process.cwd()).map((d) => d.name));
    for (const [file, sources] of dogfooded) {
      for (const source of sources) {
        expect(declared, `${file} marks an undeclared source '${source}'`).toContain(source);
      }
    }
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
    expect(parseMarkedSpans(`${OPEN('stages')}18${CLOSE('stages')}`).spans).toHaveLength(1);
  });
});

describe('the marker NAME grammar is what makes prose inert', () => {
  // The inline-code scanner is GONE. Prose is protected by the name grammar alone, which now
  // covers the closer as well as the opener — so these must hold with no masking whatsoever.
  it('a placeholder-named opener and closer are both inert, even outside backticks', () => {
    const doc = `An opener is <!${'--'} src:NAME ${'--'}> and its closer is <!${'--'} /src:NAME ${'--'}>.`;
    expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
  });

  it('the anonymous legacy closer is no longer a delimiter at all', () => {
    // Every pre-existing document that MENTIONS `<!-- /src -->` goes silent for free; that is
    // the property the whole descope was bought for.
    const doc = `the old closer was <!${'--'} /src ${'--'}> and it names nothing now`;
    expect(parseMarkedSpans(doc)).toEqual({ spans: [], error: null });
  });

  it('a code span crossing a block boundary can no longer swallow a marker', () => {
    // Iteration 2's two CRITICALs were masking failures. With no inline mask, the class is gone
    // — these are the reviewer's own reproductions, kept as the record of what was removed.
    const bt = '`';
    for (const [label, doc] of [
      ['backslash inside an open code span', `${bt}code\\${bt} ${OPEN('stages')}99${CLOSE('stages')} tail${bt}`],
      ['ATX heading between two backticks', [`para ${bt}`, `# h ${OPEN('stages')}99${CLOSE('stages')}`, `trail ${bt}`].join('\n')],
      ['list item between two backticks', [`para ${bt}`, `- i ${OPEN('stages')}99${CLOSE('stages')}`, `trail ${bt}`].join('\n')],
      ['block quote between two backticks', [`para ${bt}`, `> q ${OPEN('stages')}99${CLOSE('stages')}`, `trail ${bt}`].join('\n')],
    ] as const) {
      expect(parseMarkedSpans(doc).spans, label).toHaveLength(1);
    }
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
      scanComplete: true,
    });
  });

  it('an agreeing span passes and is counted in coverage', () => {
    fs.writeFileSync(path.join(root, 'GOV.md'), `The program has ${OPEN('stages')}2${CLOSE('stages')} stages.\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([]);
    expect(r.coverage).toEqual([{ source: 'stages', value: '2', markers: 1 }]);
  });

  it('a disagreeing span FAILS naming file, line, source, span text and source value', () => {
    fs.writeFileSync(path.join(root, 'GOV.md'), `line one\nThe program has ${OPEN('stages')}17${CLOSE('stages')} stages.\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([
      { kind: 'mismatch', file: 'GOV.md', line: 2, source: 'stages', span_text: '17', source_value: '2' },
    ]);
  });

  it('a marker naming an undeclared source is an unknown-source finding', () => {
    fs.writeFileSync(path.join(root, 'GOV.md'), `${OPEN('nope')}1${CLOSE('nope')}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toEqual([{ kind: 'unknown-source', file: 'GOV.md', line: 1, source: 'nope' }]);
    expect(r.coverage).toEqual([{ source: 'stages', value: '2', markers: 0 }]);
  });

  it("a marker error's blast radius is ONE FILE; every other file still lints", () => {
    fs.writeFileSync(path.join(root, 'BROKEN.md'), `${OPEN('stages')}2\nand no closer at all\n`);
    fs.writeFileSync(path.join(root, 'OTHER.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    track();
    const r = runSourceLint(root);
    const kinds = r.findings.map((f) => `${f.kind}:${f.file}`).sort();
    expect(kinds).toEqual(['marker:BROKEN.md', 'mismatch:OTHER.md']);
  });

  it('a marked span inside a RECORD is ignored', () => {
    const archive = path.join(root, 'orbit', 'changes', 'archive', '2026-01-01-old');
    fs.mkdirSync(archive, { recursive: true });
    fs.writeFileSync(path.join(archive, 'proposal.md'), `back then there were ${OPEN('stages')}7${CLOSE('stages')}\n`);
    track();
    expect(runSourceLint(root).findings).toEqual([]);
  });

  it('an UNTRACKED file is outside the domain until it is added', () => {
    track();
    fs.writeFileSync(path.join(root, 'NEW.md'), `${OPEN('stages')}999${CLOSE('stages')}\n`);
    expect(runSourceLint(root).findings).toEqual([]);
    track();
    expect(runSourceLint(root).findings).toHaveLength(1);
  });

  it('a tracked file with a NON-ASCII name is in the domain and its stale span fails', () => {
    // git's default core.quotePath=true C-quotes such a path, which then named no file on
    // disk and left the domain with no signal at all — the silent partial lint this
    // capability's own thesis is written against. `-z` emits raw bytes.
    fs.writeFileSync(path.join(root, 'dé-café.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    fs.writeFileSync(path.join(root, 'plain.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings.map((f) => f.file).sort()).toEqual(['dé-café.md', 'plain.md']);
    // Every domain file was readable, so scanned == domain.
    expect(r.filesScanned).toBe(resolveFileDomain(root).files.length);
    expect(resolveFileDomain(root).files).toContain('dé-café.md');
  });

  it('a tracked path with surrounding spaces survives, because paths are never trimmed', () => {
    fs.writeFileSync(path.join(root, ' spaced .md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    track();
    expect(runSourceLint(root).findings.map((f) => f.file)).toEqual([' spaced .md']);
  });

  it('a tracked-but-DELETED file is the one correct silence', () => {
    fs.writeFileSync(path.join(root, 'gone.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
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
    fs.writeFileSync(unreadable, `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    // Deliberately STALE, so its finding proves the readable sibling was still linted.
    fs.writeFileSync(path.join(root, 'ok.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
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

  it('a tracked DANGLING symlink is a domain fault, not a silent skip', () => {
    // `existsSync` follows symlinks, so a link to nothing looked exactly like a deleted file.
    fs.symlinkSync(path.join(root, 'missing-target.md'), path.join(root, 'dangling.md'));
    fs.writeFileSync(path.join(root, 'plain.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings.some((f) => f.kind === 'domain' && f.file === 'dangling.md')).toBe(true);
    // The readable sibling still lints.
    expect(r.findings.some((f) => f.kind === 'mismatch' && f.file === 'plain.md')).toBe(true);
  });

  it('a tracked symlink is a domain fault rather than a file the lint follows', () => {
    fs.writeFileSync(path.join(root, 'real.md'), `has ${OPEN('stages')}99${CLOSE('stages')}\n`);
    fs.symlinkSync(path.join(root, 'real.md'), path.join(root, 'link.md'));
    track();
    const r = runSourceLint(root);
    const fault = r.findings.find((f) => f.kind === 'domain' && f.file === 'link.md');
    expect(fault).toBeDefined();
    expect((fault as { detail: string }).detail).toMatch(/symlink/);
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
    fs.writeFileSync(path.join(root, 'GOV.md'), `${OPEN('stages')}2${CLOSE('stages')}\n`);
    track();
    const r = runSourceLint(root);
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0]).toMatchObject({ kind: 'registry' });
    expect(r.coverage).toEqual([{ source: 'stages', value: null, markers: 1 }]);
  });
});
