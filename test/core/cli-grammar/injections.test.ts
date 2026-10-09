/**
 * rc05 exit (2): every check shown able to fail. Each injection goes into a COPY
 * of the real generated surface, through the shared helper; a snippet or guard
 * injection must fail naming the surface and the line, a parity injection
 * naming the command or flag.
 */
import MarkdownIt from 'markdown-it';
import { describe, expect, it } from 'vitest';
import { buildProgram } from '../../../src/cli/program.js';
import { COMMAND_REGISTRY } from '../../../src/core/completions/command-registry.js';
import type { CommandDefinition } from '../../../src/core/completions/types.js';
import { analyseOrbit, guardFailureLines, sweepFailures } from '../../helpers/orbit-sweep.js';
import { fromProgram, fromRegistry, registryDiff } from '../../helpers/registry-parity.js';
import {
  MARKDOWN_INFO,
  SHELL_INFO,
  describeSurface,
  escapedBacktickFailures,
  generatedSurfaces,
  type Surface,
} from '../../helpers/surface-snippets.js';

const md = new MarkdownIt();

function surfaceNamed(id: string): Surface {
  const found = generatedSurfaces().find((s) => describeSurface(s) === id);
  if (!found) throw new Error(`no surface ${id}`);
  return found;
}

/** A copy of the whole surface with one surface's text replaced. */
function withSurface(replacement: Surface): Surface[] {
  return generatedSurfaces().map((s) => (describeSurface(s) === describeSurface(replacement) ? replacement : s));
}

/** Insert `line` after 0-based line `after`, indented like that line; returns the copy and the 1-based line. */
function insertAfter(surface: Surface, after: number, line: string): { surface: Surface; line: number } {
  const lines = surface.text.split('\n');
  const indent = lines[after].match(/^[\s>]*/)?.[0] ?? '';
  lines.splice(after + 1, 0, indent + line);
  return { surface: { ...surface, text: lines.join('\n') }, line: after + 2 };
}

type FencePlace = 'reference shell fence' | 'list-nested shell fence' | 'shell fence inside a markdown fence';

/** The 0-based opening line of the first fence of the kind, located by the same parser the extractor uses. */
function openingLine(surface: Surface, place: FencePlace): number {
  for (const token of md.parse(surface.text, {})) {
    if (token.type !== 'fence' || !token.map) continue;
    const info = token.info.trim().split(/\s+/)[0];
    if (place === 'reference shell fence' && SHELL_INFO.has(info) && token.level === 0) return token.map[0];
    if (place === 'list-nested shell fence' && SHELL_INFO.has(info) && token.level >= 4) return token.map[0];
    if (place === 'shell fence inside a markdown fence' && MARKDOWN_INFO.has(info)) {
      for (const inner of md.parse(token.content, {})) {
        if (inner.type === 'fence' && inner.map && SHELL_INFO.has(inner.info.trim().split(/\s+/)[0])) {
          return token.map[0] + 1 + inner.map[0];
        }
      }
    }
  }
  throw new Error(`no ${place} in ${describeSurface(surface)}`);
}

const PLACES: { place: FencePlace | 'SKILL.md inline span'; surface: string }[] = [
  { place: 'SKILL.md inline span', surface: 'apply/SKILL.md' },
  { place: 'reference shell fence', surface: 'review/references/external-handoff.md' },
  { place: 'list-nested shell fence', surface: 'continue/SKILL.md' },
  { place: 'shell fence inside a markdown fence', surface: 'review/references/prompt-template.md' },
];

const DEFECTS = [
  { defect: 'an unknown flag', snippet: 'orbit status --change <name> --frobnicate', message: "error: unknown option '--frobnicate'" },
  { defect: 'an unknown subcommand', snippet: 'orbit architecture frobnicate', message: "error: unknown command 'frobnicate'" },
  { defect: 'an extra positional', snippet: 'orbit list extra-positional', message: "error: too many arguments for 'list'. Expected 0 arguments but got 1." },
];

function inject(place: (typeof PLACES)[number], snippet: string): { surfaces: Surface[]; at: string } {
  const base = surfaceNamed(place.surface);
  let injected: { surface: Surface; line: number };
  if (place.place === 'SKILL.md inline span') {
    const text = `${base.text.replace(/\n*$/, '')}\n\nRun \`${snippet}\` here.\n`;
    injected = { surface: { ...base, text }, line: text.split('\n').length - 1 };
  } else {
    injected = insertAfter(base, openingLine(base, place.place), snippet);
  }
  return { surfaces: withSurface(injected.surface), at: `${place.surface}:${injected.line}: ` };
}

describe('the sweep fails on an injected defect, naming the surface and the line', () => {
  const CASES = PLACES.flatMap((place) => DEFECTS.map((defect) => ({ ...defect, place })));

  it('covers twelve cases', () => {
    expect(CASES).toHaveLength(12);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: An unknown flag in a reference fails the sweep
  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: A list-nested shell fence is extracted
  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: A shell fence inside a markdown fence is extracted
  it.each(CASES)('$defect in a $place.place', async ({ place, snippet, message }) => {
    const { surfaces, at } = inject(place, snippet);
    const failures = await sweepFailures(analyseOrbit(surfaces));
    expect(failures).toEqual([`${at}${snippet}\n    ${message}`]);
  });
});

describe('a non-orbit line before an injected defect cannot hide it', () => {
  const place = PLACES.find((p) => p.place === 'reference shell fence')!;

  function injectAfterOpener(lines: string[]): { surfaces: Surface[]; first: number } {
    const base = surfaceNamed(place.surface);
    const opening = openingLine(base, 'reference shell fence');
    const text = base.text.split('\n');
    const indent = text[opening].match(/^[\s>]*/)?.[0] ?? '';
    text.splice(opening + 1, 0, ...lines.map((l) => indent + l));
    return { surfaces: withSurface({ ...base, text: text.join('\n') }), first: opening + 2 };
  }

  it('an apostrophe left open fails extraction at its own line', async () => {
    const { surfaces, first } = injectAfterOpener(["echo it's here", 'orbit status --frobnicate']);
    const failures = await sweepFailures(analyseOrbit(surfaces));
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatch(new RegExp(`^${place.surface}:${first}: echo it's here\n`));
    expect(failures[0]).toMatch(/unterminated ' quote at the end of the shell fence$/);
  });

  it('a quote a later line closes fails extraction at the held orbit line', async () => {
    const { surfaces, first } = injectAfterOpener(["echo it's here", 'orbit status --frobnicate', "echo that's all"]);
    expect(await sweepFailures(analyseOrbit(surfaces))).toEqual([
      `${place.surface}:${first + 1}: orbit status --frobnicate\n    inside a quote opened at line ${first} by another command`,
    ]);
  });

  it('an escaped quote opens none, so the orbit line after it is parsed and fails', async () => {
    const { surfaces, first } = injectAfterOpener(['echo \\"', 'orbit status --frobnicate']);
    expect(await sweepFailures(analyseOrbit(surfaces))).toEqual([
      `${place.surface}:${first + 1}: orbit status --frobnicate\n    error: unknown option '--frobnicate'`,
    ]);
  });
});

describe('the guard fails on an injected command outside a shell fence, naming the surface and the line', () => {
  const UNTAGGED_HOST = 'apply/SKILL.md';

  function untaggedOpening(surface: Surface): number {
    const token = md.parse(surface.text, {}).find((t) => t.type === 'fence' && t.info.trim() === '' && t.map);
    if (!token?.map) throw new Error('no untagged fence');
    return token.map[0];
  }

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: A command in an untagged fence fails the guard
  it.each(['orbit validate --strict', 'orbit status --frobnicate'])('`%s` in an untagged fence', (line) => {
    const base = surfaceNamed(UNTAGGED_HOST);
    const injected = insertAfter(base, untaggedOpening(base), line);
    const analysis = analyseOrbit(withSurface(injected.surface));
    expect(guardFailureLines(analysis)).toEqual([`${UNTAGGED_HOST}:${injected.line}: ${line}`]);
  });

  it.each(['orbit validate --strict', 'orbit status --frobnicate'])('`%s` inside a blockquote', (line) => {
    const base = surfaceNamed(UNTAGGED_HOST);
    const text = `${base.text.replace(/\n*$/, '')}\n\n> ${line}\n`;
    const analysis = analyseOrbit(withSurface({ ...base, text }));
    expect(guardFailureLines(analysis)).toEqual([`${UNTAGGED_HOST}:${text.split('\n').length - 1}: > ${line}`]);
  });
});

describe('the parity test fails on an injected drift, naming the command or flag', () => {
  const registryCopy = (): CommandDefinition[] => structuredClone(COMMAND_REGISTRY);
  const diff = (program = buildProgram({ hooks: false }), registry = registryCopy()) =>
    registryDiff(fromProgram(program), fromRegistry(registry));

  // @scenario behaviour orbit-cli-grammar :: The completion registry is a checked copy of the program :: A program command missing from the registry fails parity
  it('a command added to a build that the registry lacks', () => {
    const program = buildProgram({ hooks: false });
    program.command('frobnicate').action(() => {});
    expect(diff(program)).toEqual(["command 'frobnicate': in the program, missing from the registry"]);
  });

  // @scenario behaviour orbit-cli-grammar :: The completion registry is a checked copy of the program :: A registry entry with no program command fails parity
  it('a registry command the program lacks, and a registry flag the program lacks', () => {
    const registry = registryCopy();
    registry.push({ name: 'frobnicate', description: 'x', flags: [] });
    expect(diff(undefined, registry)).toEqual(["command 'frobnicate': in the registry, not declared by the program"]);

    const flagged = registryCopy();
    flagged.find((c) => c.name === 'status')!.flags.push({ name: 'frobnicate', description: 'x' });
    expect(diff(undefined, flagged)).toEqual(["command 'status': flag --frobnicate in the registry, not declared by the program"]);
  });

  it('a flag added to a program command that the registry lacks', () => {
    const program = buildProgram({ hooks: false });
    program.commands.find((c) => c.name() === 'status')!.option('--frobnicate', 'x');
    expect(diff(program)).toEqual(["command 'status': flag --frobnicate in the program, missing from the registry"]);
  });

  it('a changed short and a changed takesValue on one flag', () => {
    const shortened = registryCopy();
    shortened.find((c) => c.name === 'archive')!.flags.find((f) => f.name === 'yes')!.short = 'z';
    expect(diff(undefined, shortened)).toEqual(["command 'archive': flag --yes short is z in the registry, y in the program"]);

    const valued = registryCopy();
    valued.find((c) => c.name === 'archive')!.flags.find((f) => f.name === 'yes')!.takesValue = true;
    expect(diff(undefined, valued)).toEqual(["command 'archive': flag --yes takesValue is true in the registry, false in the program"]);
  });
});

describe('the escaped-backtick check fails on an injected backslash-backtick', () => {
  it('names the surface and the line', () => {
    const base = surfaceNamed('architect/SKILL.md');
    const injected = insertAfter(base, 0, 'Run \\`orbit architecture status\\` first.');
    expect(escapedBacktickFailures(withSurface(injected.surface))).toEqual([
      `architect/SKILL.md:${injected.line}: Run \\\`orbit architecture status\\\` first.`,
    ]);
  });
});
