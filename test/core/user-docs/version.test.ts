/**
 * release tasks 2.2–2.3 (design D1, D2): the version check — `orbit-user-docs`' `The user docs state orbit's current
 * version as package.json's`, shown able to fail — and the admitted list's exactness, a whole-docs rule run here over
 * the unlisted user docs together. The fixtures pass an explicit version; the shipped-docs run reads `package.json`'s.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, docSurfaces, type Surface } from '../../helpers/surface-snippets.js';
import {
  INSTALL_PAGES,
  PACKAGE_VERSION,
  VERSION_ADMISSIONS,
  fileLocalFailures,
  staleAdmissionFailures,
  versionFailures,
} from '../../helpers/user-docs.js';

const doc = (file: string, text: string): Surface => ({ workflowId: DOCS_WORKFLOW, file, text });
const VERSION = '2.0.1';
const install = (v: string) => `npm install -g github:las-sal/orbit-spec#v${v}`;
const PHRASE_WRAPPED = "orbit's version numbers are its own: orbit 2.0.0 is orbit's first\nrelease, not OpenSpec 2.0.0. Telemetry is gone.";

describe('the version check', () => {
  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: The shipped docs state the current version
  it('passes the shipped unlisted docs at package.json\'s version, every admitted entry admitting a token', () => {
    // The requirement's table, written out here so dropping or adding an admission fails.
    expect(VERSION_ADMISSIONS).toEqual([
      { file: 'README.md', phrase: "orbit 2.0.0 is orbit's first release, not OpenSpec 2.0.0" },
      { value: '1.3.1' },
      { value: '1.14.1' },
      { value: '20.19.0' },
    ]);
    expect(INSTALL_PAGES).toEqual(['README.md', 'docs/installation.md']);
    const docs = docSurfaces();
    expect(INSTALL_PAGES.every((p) => docs.some((d) => d.file === p))).toBe(true);
    expect(versionFailures(docs)).toEqual([]);
    expect(staleAdmissionFailures(docs)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: A stale install pin fails
  it('fails a stale install pin, naming the file, the line, the token and the version', () => {
    const page = doc('docs/cli.md', `# CLI\n\n\`\`\`bash\n${install('2.0.0')}\n\`\`\`\n`);
    expect(versionFailures([page], VERSION)).toEqual([
      "docs/cli.md:4: install target 'v2.0.0' is not package.json's version 2.0.1; no admission applies to an install target (the version check)",
    ]);
    expect(versionFailures([doc('docs/cli.md', `# CLI\n\n${install(VERSION)}\n`)], VERSION)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: A stale version in prose fails, sentence-ending period and all
  it('fails a stale version in prose, a sentence-ending period not hiding it', () => {
    const page = doc('docs/cli.md', '# CLI\n\n`orbit --version` prints 2.0.0.\n');
    expect(versionFailures([page], VERSION)).toEqual([
      "docs/cli.md:3: version token '2.0.0' is neither package.json's version 2.0.1 nor admitted (the version check)",
    ]);
    expect(versionFailures([doc('docs/cli.md', 'It prints 2.0.1.\n')], VERSION)).toEqual([]);
    // Not tokens: a fourth component, a letter or a dot before, a letter after.
    expect(versionFailures([doc('docs/cli.md', '1.2.3.4 x2.0.0 .2.0.0 2.0.0a\n')], VERSION)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: An admitted phrase admits only its own tokens
  it('admits the tokens inside a wrapped admitted phrase and only those, each reported at its own line', () => {
    const readme = doc('README.md', `# orbit\n\n${PHRASE_WRAPPED}\n\n${install(VERSION)}\n\nSee 2.0.0 too.\n`);
    expect(versionFailures([readme], VERSION)).toEqual([
      "README.md:8: version token '2.0.0' is neither package.json's version 2.0.1 nor admitted (the version check)",
    ]);
    // The same phrase on another page is not admitted.
    const other = doc('docs/concepts.md', `# Concepts\n\n${PHRASE_WRAPPED}\n`);
    expect(versionFailures([other], VERSION)).toEqual([
      "docs/concepts.md:3: version token '2.0.0' is neither package.json's version 2.0.1 nor admitted (the version check)",
      "docs/concepts.md:4: version token '2.0.0' is neither package.json's version 2.0.1 nor admitted (the version check)",
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: A wrong install target fails beside current-tag prose
  it('fails an install target no value admission reaches, and the missing current install command, beside current-tag prose', () => {
    const page = doc('docs/installation.md', `# Installation\n\n${install('1.3.1')}\n\nThe \`#v2.0.1\` tag names a release tree.\n`);
    expect(versionFailures([page], VERSION)).toEqual([
      "docs/installation.md:3: install target 'v1.3.1' is not package.json's version 2.0.1; no admission applies to an install target (the version check)",
      'docs/installation.md: carries no install command `npm install -g github:las-sal/orbit-spec#v2.0.1` (the version check)',
    ]);
    // The same value outside an install target is admitted.
    expect(versionFailures([doc('docs/concepts.md', 'Tagged `upstream/v1.3.1`.\n')], VERSION)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: A stale admission fails
  it('fails an admitted entry that admits no token in the user docs, naming the entry', () => {
    const docs = [doc('docs/concepts.md', 'Forked from 1.3.1.\n')];
    expect(staleAdmissionFailures(docs, [{ value: '1.3.1' }])).toEqual([]);
    expect(staleAdmissionFailures(docs, [{ value: '1.3.1' }, { value: '9.9.9' }, { file: 'README.md', phrase: 'orbit 2.0.0 is' }])).toEqual([
      "admitted value '9.9.9': admits no version token in the user docs (a stale admission)",
      'admitted README.md phrase "orbit 2.0.0 is": admits no version token in the user docs (a stale admission)',
    ]);
    // An install target takes no admission, so it never keeps a value admission alive.
    expect(staleAdmissionFailures([doc('README.md', `${install('1.3.1')}\n`)], [{ value: '1.3.1' }])).toEqual([
      "admitted value '1.3.1': admits no version token in the user docs (a stale admission)",
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The user docs state orbit's current version as package.json's :: A page without its install command fails
  it('fails an install page naming the current tag only in prose, naming the page; another page owes no command', () => {
    const page = doc('docs/installation.md', '# Installation\n\nThe `#v2.0.1` tag names a release tree.\n');
    expect(versionFailures([page], VERSION)).toEqual([
      'docs/installation.md: carries no install command `npm install -g github:las-sal/orbit-spec#v2.0.1` (the version check)',
    ]);
    expect(versionFailures([doc('README.md', '# orbit\n')], VERSION)).toEqual([
      'README.md: carries no install command `npm install -g github:las-sal/orbit-spec#v2.0.1` (the version check)',
    ]);
    // A longer version does not stand in for the current one.
    expect(versionFailures([doc('README.md', `${install('2.0.10')}\n`)], VERSION)).toContain(
      'README.md: carries no install command `npm install -g github:las-sal/orbit-spec#v2.0.1` (the version check)',
    );
    expect(versionFailures([doc('docs/cli.md', '# CLI\n')], VERSION)).toEqual([]);
  });

  it('reads package.json\'s version, and joins fileLocalFailures under `version`', async () => {
    expect(PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    const stale = doc('docs/cli.md', '# CLI\n\nPrints 0.9.9.\n');
    expect(await fileLocalFailures([stale])).toContain(
      `[version] docs/cli.md:3: version token '0.9.9' is neither package.json's version ${PACKAGE_VERSION} nor admitted (the version check)`,
    );
  });
});
