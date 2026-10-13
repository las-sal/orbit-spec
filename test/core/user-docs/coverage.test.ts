/**
 * reference-docs task 1.3 (design D2, D3): the command-coverage check — `orbit-user-docs`' `The reference pages
 * name every command and every workflow`, shown able to fail. The fixtures pass small domains; the real domain is
 * read from the program and the workflow registry and never typed here.
 */
import { describe, expect, it } from 'vitest';
import { DOCS_WORKFLOW, allDocSurfaces, readPendingRewrite, type Surface } from '../../helpers/surface-snippets.js';
import {
  CLI_PAGE,
  COMMANDS_PAGE,
  commandCoverageFailures,
  commandPaths,
  fileLocalFailures,
  missingOwingPageFailures,
  pendingListFailures,
  workflowIds,
} from '../../helpers/user-docs.js';

const page = (file: string, text: string): Surface => ({ workflowId: DOCS_WORKFLOW, file, text });
const missingPath = (p: string) => `${CLI_PAGE}: does not name '${p}' (the command-coverage check)`;
const missingId = (id: string) => `${COMMANDS_PAGE}: does not name '/orbit:${id}' (the command-coverage check)`;

describe('the command-coverage check', () => {
  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: A command the CLI page does not name fails
  it('fails an unlisted CLI page that never names a command path, naming the page and the path', async () => {
    const cli = page(CLI_PAGE, '# CLI\n\nRun `orbit validate` and `orbit list`.\n');
    expect(commandCoverageFailures([cli], ['orbit validate', 'orbit fingerprint', 'orbit list'], [])).toEqual([
      missingPath('orbit fingerprint'),
    ]);
    const real = commandPaths().filter((p) => p !== 'orbit fingerprint' && !p.startsWith('orbit fingerprint '));
    const failures = await fileLocalFailures([page(CLI_PAGE, real.map((p) => `- \`${p}\``).join('\n') + '\n')]);
    expect(failures).toContain(`[coverage] ${missingPath('orbit fingerprint')}`);
  });

  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: A subcommand names its parent
  it('counts a longer path as naming each of its prefixes', () => {
    const cli = page(CLI_PAGE, 'Select with `orbit pr select --json`.\n');
    expect(commandCoverageFailures([cli], ['orbit pr', 'orbit pr select'], [])).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: A longer word is not a name
  it('bounds both ends: a longer word, a path segment or a dotted name is not a name', () => {
    const paths = ['orbit validate'];
    expect(commandCoverageFailures([page(CLI_PAGE, 'orbit validated\n')], paths, [])).toEqual([missingPath('orbit validate')]);
    expect(commandCoverageFailures([page(CLI_PAGE, 'orbit validate-all\n')], paths, [])).toEqual([missingPath('orbit validate')]);
    expect(commandCoverageFailures([page(CLI_PAGE, 'see .orbit validate\n')], paths, [])).toEqual([missingPath('orbit validate')]);
    expect(commandCoverageFailures([page(CLI_PAGE, 'see my-orbit validate\n')], paths, [])).toEqual([missingPath('orbit validate')]);
    expect(commandCoverageFailures([page(CLI_PAGE, 'Orbit Validate\n')], paths, [])).toEqual([missingPath('orbit validate')]);
    expect(commandCoverageFailures([page(CLI_PAGE, '`orbit validate`.\n')], paths, [])).toEqual([]);
    const ids = ['archive'];
    expect(commandCoverageFailures([page(COMMANDS_PAGE, '/orbit:bulk-archive\n')], [], ids)).toEqual([missingId('archive')]);
    expect(commandCoverageFailures([page(COMMANDS_PAGE, '/orbit:archive-x\n')], [], ids)).toEqual([missingId('archive')]);
    expect(commandCoverageFailures([page(COMMANDS_PAGE, '`/orbit:archive <name>`\n')], [], ids)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: A hidden command is not owed
  it('reads a domain that holds neither hidden command, so a page naming neither passes', () => {
    const paths = commandPaths();
    expect(paths.some((p) => /^orbit (experimental|__complete)\b/.test(p))).toBe(false);
    const cli = page(CLI_PAGE, paths.map((p) => `- \`${p}\``).join('\n') + '\n');
    expect(commandCoverageFailures([cli], paths, workflowIds())).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: A workflow the commands page does not name fails
  it('fails an unlisted commands page that never names a workflow id, naming the page and the id', async () => {
    const ids = workflowIds().filter((id) => id !== 'audit-drift');
    const failures = await fileLocalFailures([page(COMMANDS_PAGE, ids.map((id) => `- \`/orbit:${id}\``).join('\n') + '\n')]);
    expect(failures).toEqual([`[coverage] ${missingId('audit-drift')}`]);
  });

  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: A missing owing page fails
  it('fails, naming it, an owing page neither listed nor present; a listed or present one passes', () => {
    const docs = allDocSurfaces();
    const without = docs.filter((d) => d.file !== CLI_PAGE);
    expect(missingOwingPageFailures([], without)).toEqual([
      `${CLI_PAGE}: owed by the command-coverage check but neither listed nor present among the user docs`,
    ]);
    expect(missingOwingPageFailures([CLI_PAGE], without)).toEqual([]);
    expect(missingOwingPageFailures(readPendingRewrite(), docs)).toEqual([]);
  });

  // @scenario behaviour orbit-user-docs :: The reference pages name every command and every workflow :: Every other user doc passes
  it('passes every other user doc, even one that names no command', () => {
    const other = page('docs/concepts.md', '# Concepts\n\nNo command here.\n');
    expect(commandCoverageFailures([other], commandPaths(), workflowIds())).toEqual([]);
  });

  it('runs over a listed owing page alone through the exactness rule', async () => {
    const empty = page(CLI_PAGE, '# CLI\n');
    expect(await pendingListFailures([CLI_PAGE], [empty])).toEqual([]);
  });
});

describe('the real domain', () => {
  it('is read from the program and the registry: a depth-two path, no hidden command, at least one workflow id', () => {
    const paths = commandPaths();
    expect(paths.every((p) => p.startsWith('orbit '))).toBe(true);
    expect(paths.some((p) => p.split(' ').length >= 3)).toBe(true);
    expect(paths).not.toContain('orbit experimental');
    expect(paths).not.toContain('orbit __complete');
    expect(workflowIds().length).toBeGreaterThan(0);
  });
});
