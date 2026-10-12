/**
 * docs-under-test task 2.1/2.2 (design D3): the residue check — `orbit-user-docs`' `The old name
 * appears in the user docs only in four admitted places`, shown able to fail.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, docSurfaces, type Surface } from '../../helpers/surface-snippets.js';
import { ADMITTED_IDENTIFIERS, residueFailures } from '../../helpers/user-docs.js';

const FENCE = '```';
const doc = (file: string, text: string): Surface => ({ workflowId: DOCS_WORKFLOW, file, text });
const residue = (file: string, line: number, occurrence: string) => `${file}:${line}: residue '${occurrence}' (the residue check)`;

describe('the residue check', () => {
  it('passes over every unlisted user doc', () => {
    expect(residueFailures(docSurfaces())).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The old name appears in the user docs only in four admitted places :: An upstream command in a rewritten page is residue
  it('an upstream command in a shell fence is residue, naming the file, the line and the occurrence', () => {
    expect(residueFailures([doc('docs/cli.md', `# CLI\n\n${FENCE}bash\nopenspec init\n${FENCE}\n`)])).toEqual([
      residue('docs/cli.md', 4, 'openspec'),
    ]);
  });

  it('a /opsx: slash command, a Fission-AI URL and the package name are residue, case-insensitively', () => {
    const text = 'Run `/opsx:propose`.\nSee https://github.com/Fission-AI/OpenSpec.\nInstall @fission-ai/openspec.\n';
    expect(residueFailures([doc('docs/x.md', text)])).toEqual([
      residue('docs/x.md', 1, 'opsx'),
      residue('docs/x.md', 2, 'Fission'),
      residue('docs/x.md', 2, 'OpenSpec'),
      residue('docs/x.md', 3, 'fission'),
      residue('docs/x.md', 3, 'openspec'),
    ]);
  });

  // @scenario behaviour orbit-user-docs :: The old name appears in the user docs only in four admitted places :: The attribution section admits the old name
  it('the attribution section admits the old name, and the next heading of its level ends it', () => {
    const text = [
      '# orbit', // 1
      '', // 2
      '## Built on OpenSpec', // 3
      '', // 4
      'orbit is a fork of OpenSpec.', // 5
      '', // 6
      '### Credits', // 7
      '', // 8
      'Thanks to the OpenSpec authors.', // 9
      '', // 10
      FENCE, // 11
      '## Not a heading: OpenSpec', // 12
      FENCE, // 13
      '', // 14
      '## Next', // 15
      '', // 16
      'OpenSpec again.', // 17
    ].join('\n');
    expect(residueFailures([doc('README.md', text)])).toEqual([residue('README.md', 17, 'OpenSpec')]);
  });

  it('a higher-level heading ends an admitted section too, and the sections are README-only', () => {
    const text = '## How orbit improves on OpenSpec\n\nOpenSpec.\n\n# Top\n\nOpenSpec.\n';
    expect(residueFailures([doc('README.md', text)])).toEqual([residue('README.md', 7, 'OpenSpec')]);
    expect(residueFailures([doc('docs/x.md', text)])).toHaveLength(3);
  });

  it('a heading whose text is not exactly an admitted title admits nothing; a setext heading is not read', () => {
    const text = '## Built on OpenSpec 1.3\n\nOpenSpec.\n\nBuilt on OpenSpec\n=================\n\nOpenSpec.\n';
    expect(residueFailures([doc('README.md', text)])).toHaveLength(4);
  });

  // @scenario behaviour orbit-user-docs :: The old name appears in the user docs only in four admitted places :: A command inside an admitted section is admitted by the residue check
  it('an upstream command inside an admitted section passes', () => {
    const text = `# orbit\n\n## How orbit improves on OpenSpec\n\n${FENCE}bash\nopenspec init\n${FENCE}\n`;
    expect(residueFailures([doc('README.md', text)])).toEqual([]);
  });

  it('anything in docs/migration-guide.md passes', () => {
    expect(residueFailures([doc('docs/migration-guide.md', 'Run `openspec init` from @fission-ai/openspec; /opsx:apply.\n')])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The old name appears in the user docs only in four admitted places :: An on-disk name is admitted anywhere
  it('the admitted identifiers pass anywhere, and nothing beside them', () => {
    const text = [
      'Each change has `.openspec.yaml`.',
      'Global config: `~/.config/openspec/config.json`.',
      'Data: `~/.local/share/openspec`.',
      'Windows: `%APPDATA%\\openspec` or `~/AppData/Local/openspec`.',
      'XDG: `$XDG_CONFIG_HOME/openspec` and `$XDG_DATA_HOME\\openspec`.',
      'But `.openspec.yaml` is not openspec itself.',
    ].join('\n');
    expect(residueFailures([doc('docs/x.md', text)])).toEqual([residue('docs/x.md', 6, 'openspec')]);
    expect(ADMITTED_IDENTIFIERS).toHaveLength(17);
    expect(residueFailures([doc('docs/x.md', ADMITTED_IDENTIFIERS.join(' '))])).toEqual([]);
  });
});
