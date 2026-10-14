/**
 * cli-says-orbit tasks 1.2–1.4 (design decisions 2–4): `orbit-cli-name`'s source scan and runtime help
 * check, shown able to fail over fixtures and passing over the real package.
 */
import { describe, expect, it } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { helpTexts, residue, runtimeResidue, shippedFiles, type AdmittedEntry } from '../helpers/cli-name.js';

describe('the source scan', () => {
  // @scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: An unadmitted OpenSpec in a string literal is residue
  it('an unadmitted OpenSpec in a string literal is residue, naming the file, the line and the occurrence', () => {
    const text = "import chalk from 'chalk';\n\nconst title = chalk.bold('Welcome to OpenSpec');\n";
    expect(residue([{ file: 'src/ui/x.ts', text }], [])).toEqual(["src/ui/x.ts:3: residue 'OpenSpec'"]);
  });

  it('reads every line of a multi-line template, its head and its spans, but not its expressions', () => {
    const text = [
      'const a = `line one', // 1
      'Openspec on two ${OpenSpecName} and', // 2
      'OpenSpec on three`;', // 3
    ].join('\n');
    expect(residue([{ file: 'src/x.ts', text }], [])).toEqual([
      "src/x.ts:2: residue 'Openspec'",
      "src/x.ts:3: residue 'OpenSpec'",
    ]);
  });

  // @scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: A comment or an identifier is not read
  it('a comment or an identifier is not read', () => {
    const text = [
      '// OpenSpec markers live here',
      '/** OpenSpec block comment */',
      'export function hasOpenSpecMarkers(content: string): boolean {',
      "  return content.includes('<!-- marker -->');",
      '}',
    ].join('\n');
    expect(residue([{ file: 'src/core/x.ts', text }], [])).toEqual([]);
  });

  // @scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: A shipped schema file is read
  it('a shipped schema file is read line by line', () => {
    const text = 'name: spec-driven\nversion: 1\ndescription: Default OpenSpec workflow - proposal\n';
    expect(residue([{ file: 'schemas/spec-driven/schema.yaml', text }], [])).toEqual([
      "schemas/spec-driven/schema.yaml:3: residue 'OpenSpec'",
    ]);
  });

  // @scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: An admitted occurrence passes and a stale admission fails
  it('an admitted occurrence passes and a stale admission fails', () => {
    const file = 'src/core/legacy-cleanup.ts';
    const text = "lines.push(chalk.dim('OpenSpec markers will be removed, your content preserved:'));\n";
    const admitted: AdmittedEntry[] = [
      { file, substring: 'OpenSpec markers will be removed', reason: "names OpenSpec's own artefact" },
      { file, substring: 'Removed OpenSpec markers', reason: "names OpenSpec's own artefact" },
    ];
    expect(residue([{ file, text }], admitted)).toEqual([
      "src/core/legacy-cleanup.ts: stale admission 'Removed OpenSpec markers' (names OpenSpec's own artefact)",
    ]);
  });

  it('an entry naming another file admits nothing there', () => {
    const text = "const s = 'Removed OpenSpec markers';\n";
    const admitted: AdmittedEntry[] = [
      { file: 'src/core/legacy-cleanup.ts', substring: 'Removed OpenSpec markers', reason: "names OpenSpec's own artefact" },
    ];
    expect(residue([{ file: 'src/core/other.ts', text }], admitted)).toEqual([
      "src/core/other.ts:1: residue 'OpenSpec'",
      "src/core/legacy-cleanup.ts: stale admission 'Removed OpenSpec markers' (names OpenSpec's own artefact)",
    ]);
  });

  // @scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: An admission covers only the occurrence inside its substring
  it('an admission covers only the occurrence inside its substring', () => {
    const file = 'src/core/legacy-cleanup.ts';
    const text = "const s = 'Removed OpenSpec markers. Welcome to OpenSpec';\n";
    const admitted: AdmittedEntry[] = [
      { file, substring: 'Removed OpenSpec markers', reason: "names OpenSpec's own artefact" },
    ];
    expect(residue([{ file, text }], admitted)).toEqual(["src/core/legacy-cleanup.ts:1: residue 'OpenSpec'"]);
  });

  it('passes over the real package', () => {
    expect(residue(shippedFiles())).toEqual([]);
  });

  it('reads every member the requirement names', () => {
    const files = shippedFiles().map((f) => f.file);
    expect(files).toContain('schemas/spec-driven/schema.yaml');
    expect(files).toContain('bin/orbit.js');
    expect(files).toContain('scripts/postinstall.js');
    expect(files).toContain('build.js');
    expect(files.filter((f) => f.startsWith('src/') && f.endsWith('.ts')).length).toBeGreaterThan(100);
  });
});

describe('the runtime help check', () => {
  it('flags a case-insensitive openspec and admits only OPENSPEC_CONCURRENCY', () => {
    expect(runtimeResidue('help', 'Initialize OpenSpec\nset OPENSPEC_CONCURRENCY=4\nsee openspec/ and OPENSPEC_NO_AUTO_CONFIG')).toEqual([
      "help:1: residue 'OpenSpec'",
      "help:3: residue 'openspec'",
      "help:3: residue 'OPENSPEC'",
    ]);
  });

  // @scenario behaviour orbit-cli-name :: The old name appears in what the package ships only for an admitted reason :: Every command's help says orbit
  it("every visible command's help says orbit", () => {
    const texts = helpTexts(buildProgram());
    expect(texts.length).toBeGreaterThan(20);
    expect(texts.flatMap(({ command, text }) => runtimeResidue(command, text))).toEqual([]);
  });
});
