/**
 * rc05 task 2.3: the shared extractor, one test per row of `orbit-cli-grammar`'s
 * places table and fence table, its tokenizer rules, and the guard's
 * normalisation.
 */
import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { commandTree, parseArgv } from '../../helpers/neutral-program.js';
import {
  analyseSurface,
  generatedSurfaces,
  guardFails,
  normaliseGuardLine,
  tokenize,
  type Surface,
} from '../../helpers/surface-snippets.js';

const tree = commandTree();

function surface(text: string, file = 'SKILL.md'): Surface {
  return { workflowId: 'demo', file, text };
}

function analyse(text: string) {
  return analyseSurface(surface(text), 'orbit', tree);
}

function extracted(text: string) {
  return analyse(text).snippets.map((s) => ({ line: s.line, tokens: s.tokens, source: s.source }));
}

const FENCE = '```';

describe('the places table', () => {
  it.each(['bash', 'sh', 'shell'])('a line in a %s fence is extracted, one argument vector per line', (info) => {
    const text = `Intro\n\n${FENCE}${info}\norbit list --json\necho done\norbit validate demo --strict\n${FENCE}\n`;
    expect(extracted(text)).toEqual([
      { line: 4, tokens: ['orbit', 'list', '--json'], source: 'fence' },
      { line: 6, tokens: ['orbit', 'validate', 'demo', '--strict'], source: 'fence' },
    ]);
  });

  it('a line in a shell fence nested in a list item is extracted the same way', () => {
    const text = `1. Step\n   - Sub-step:\n     ${FENCE}bash\n     orbit status --change "<name>" --json\n     ${FENCE}\n`;
    expect(extracted(text)).toEqual([
      { line: 4, tokens: ['orbit', 'status', '--change', '<name>', '--json'], source: 'fence' },
    ]);
  });

  it('a shell fence inside a markdown or md fence is extracted by parsing the outer content again', () => {
    for (const info of ['markdown', 'md']) {
      const text = `Prompt:\n\n${FENCE}${FENCE.slice(0, 1)}${info}\n# Title\n\n${FENCE}bash\norbit list\n${FENCE}\n${FENCE}${FENCE.slice(0, 1)}\n`;
      expect(extracted(text), info).toEqual([{ line: 7, tokens: ['orbit', 'list'], source: 'fence' }]);
    }
  });

  it('a quoted argument spanning lines is joined until the quote closes', () => {
    const text = `${FENCE}bash\norbit new change demo --description "line one\nline two"\norbit list\n${FENCE}\n`;
    expect(extracted(text)).toEqual([
      { line: 2, tokens: ['orbit', 'new', 'change', 'demo', '--description', 'line one\nline two'], source: 'fence' },
      { line: 4, tokens: ['orbit', 'list'], source: 'fence' },
    ]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: An unterminated quote fails extraction
  it('a quote still open at the end of its shell fence fails extraction, joining nothing beyond the fence', () => {
    const text = `${FENCE}bash\norbit status --change "demo\n${FENCE}\n\nA closing quote" here, outside.\n`;
    const result = analyse(text);
    expect(result.snippets).toEqual([]);
    expect(result.failures.map((f) => ({ line: f.line, snippet: f.snippet, file: f.surface.file }))).toEqual([
      { line: 2, snippet: 'orbit status --change "demo', file: 'SKILL.md' },
    ]);
    expect(result.failures[0].message).toMatch(/unterminated " quote/);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: An unterminated quote fails extraction
  it('a quote a non-orbit line holds open fails extraction too, so it cannot hide a later orbit line', () => {
    const swallowed = analyse(`${FENCE}bash\necho it's here\norbit status --frobnicate\n${FENCE}\n`);
    expect(swallowed.snippets).toEqual([]);
    expect(swallowed.failures.map((f) => ({ line: f.line, snippet: f.snippet }))).toEqual([
      { line: 2, snippet: "echo it's here\norbit status --frobnicate" },
    ]);

    // A backslash outside quotes escapes as the shell's does: `\"` opens no quote.
    const escaped = analyse(`${FENCE}bash\necho \\"\norbit status --frobnicate\n${FENCE}\n`);
    expect(escaped.failures).toEqual([]);
    expect(escaped.snippets.map((sn) => ({ line: sn.line, tokens: sn.tokens }))).toEqual([
      { line: 3, tokens: ['orbit', 'status', '--frobnicate'] },
    ]);
  });

  it('an inline single-backtick span beginning `orbit ` is extracted', () => {
    expect(extracted('Run `orbit status --change demo --json` first.\n')).toEqual([
      { line: 1, tokens: ['orbit', 'status', '--change', 'demo', '--json'], source: 'inline' },
    ]);
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: A bare command name is prose
  it('a bare command NAME in an inline span is prose: every token a command, nothing after', () => {
    const result = analyse('The `orbit feedback` command and `orbit architecture status` both, and `orbit external save <c>`.\n');
    expect(result.bareNames.map((s) => s.text)).toEqual(['orbit feedback', 'orbit architecture status']);
    expect(result.snippets.map((s) => s.text)).toEqual(['orbit external save <c>']);
  });

  it('a double-backtick span is not a single-backtick span, so it is not extracted', () => {
    expect(extracted('Write `` orbit list `x` `` here.\n')).toEqual([]);
  });

  it('a line in an untagged fence, a data-tagged fence, or prose is not extracted', () => {
    const text = `${FENCE}\norbit list\n${FENCE}\n\n${FENCE}json\n"orbit list"\n${FENCE}\n\norbit list\n`;
    expect(extracted(text)).toEqual([]);
  });

  it('a line whose first token is a placeholder (a runner\'s argument vector) is not extracted', () => {
    expect(extracted(`${FENCE}bash\n<argv[0]> <argv[1..]> < prompt.md\n${FENCE}\n`)).toEqual([]);
  });
});

describe('the fence table', () => {
  it('a top-level backtick or tilde fence is the parser\'s fence token, with its info string', () => {
    expect(extracted(`~~~bash\norbit list\n~~~\n`)).toEqual([{ line: 2, tokens: ['orbit', 'list'], source: 'fence' }]);
    expect(extracted(`${FENCE}bash\norbit list\n${FENCE}\n`)).toEqual([{ line: 2, tokens: ['orbit', 'list'], source: 'fence' }]);
  });

  it('a fence nested in a list item is measured from the item\'s content column', () => {
    // Indented 6 spaces: past the engine's own tracker's 0–3, inside the item's content column.
    const text = `- Item\n  - Nested:\n\n      ${FENCE}bash\n      orbit list\n      ${FENCE}\n`;
    expect(extracted(text)).toEqual([{ line: 5, tokens: ['orbit', 'list'], source: 'fence' }]);
  });

  it('a longer fence enclosing shorter fence lines is one outer token; its inner lines are content', () => {
    const text = `${FENCE}${FENCE.slice(0, 1)}text\n${FENCE}bash\norbit list --json\n${FENCE}\n${FENCE}${FENCE.slice(0, 1)}\n`;
    const result = analyse(text);
    expect(result.snippets).toEqual([]);
    expect(result.guard.map((g) => g.line)).toEqual([3]);
  });

  it('an indented code block is not a fence; its lines fall to the guard', () => {
    const result = analyse(`Para.\n\n    orbit list --json\n`);
    expect(result.snippets).toEqual([]);
    expect(result.guard.map((g) => g.line)).toEqual([3]);
  });

  it('a fence inside a blockquote is the parser\'s fence token within the quote', () => {
    expect(extracted(`> ${FENCE}bash\n> orbit list\n> ${FENCE}\n`)).toEqual([{ line: 2, tokens: ['orbit', 'list'], source: 'fence' }]);
  });

  it('an HTML block is not a fence; its lines fall to the guard', () => {
    const result = analyse(`<div>\norbit list --json\n</div>\n`);
    expect(result.snippets).toEqual([]);
    expect(result.guard.map((g) => g.line)).toEqual([2]);
  });

  it('an inline code span is the extractor\'s inline source, in a table cell with its row\'s line', () => {
    const text = `| a | b |\n|---|---|\n| x | y |\n| z | \`orbit list --json\` |\n`;
    expect(extracted(text)).toEqual([{ line: 4, tokens: ['orbit', 'list', '--json'], source: 'inline' }]);
  });
});

describe('the tokenizer', () => {
  it('keeps a quoted value as one token, single or double', () => {
    expect(tokenize(`orbit a "x y" 'p q'`)).toEqual({ ok: true, tokens: ['orbit', 'a', 'x y', 'p q'] });
  });

  it('inside double quotes, \\" does not close the quote', () => {
    expect(tokenize(`orbit a "say \\"hi\\" now" b`)).toEqual({ ok: true, tokens: ['orbit', 'a', 'say "hi" now', 'b'] });
  });

  it('a backslash escapes as the shell\'s does: outside quotes the next character, inside single quotes nothing', () => {
    expect(tokenize(`echo \\" it\\'s`)).toEqual({ ok: true, tokens: ['echo', '"', "it's"] });
    expect(tokenize(`orbit a "x\\\\" 'y\\'`)).toEqual({ ok: true, tokens: ['orbit', 'a', 'x\\', 'y\\'] });
  });

  it('a `<` followed by whitespace is a redirect, not a placeholder\'s opener', () => {
    expect(tokenize(`run < '<run-dir>/p.md' > '<run-dir>/log'`)).toEqual({
      ok: true,
      tokens: ['run', '<', '<run-dir>/p.md', '>', '<run-dir>/log'],
    });
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: A placeholder with a suffix is one token
  it('keeps a <…> placeholder as one token, spaces inside or a suffix attached, and the snippet parses', async () => {
    const snippet = 'orbit external save <change-name> --as <as> --from <run-dir>/return.md --launch <L> --json';
    const tokens = tokenize(snippet);
    expect(tokens.ok && (await parseArgv(tokens.tokens.slice(1)))).toEqual({ ok: true, code: null, message: '' });
    expect(tokenize(snippet)).toEqual({
      ok: true,
      tokens: ['orbit', 'external', 'save', '<change-name>', '--as', '<as>', '--from', '<run-dir>/return.md', '--launch', '<L>', '--json'],
    });
    expect(tokenize('orbit show <the change name>')).toEqual({ ok: true, tokens: ['orbit', 'show', '<the change name>'] });
  });

  it('drops a trailing # comment outside quotes, and keeps one inside', () => {
    expect(tokenize('orbit list --json # the active changes')).toEqual({ ok: true, tokens: ['orbit', 'list', '--json'] });
    expect(tokenize('orbit a "x # y"')).toEqual({ ok: true, tokens: ['orbit', 'a', 'x # y'] });
  });

  it('drops … and ...', () => {
    expect(tokenize('orbit status … --json ...')).toEqual({ ok: true, tokens: ['orbit', 'status', '--json'] });
  });

  it('reports an open quote at the end', () => {
    expect(tokenize('orbit a "open')).toEqual({ ok: false, open: '"' });
    expect(tokenize("orbit a 'open")).toEqual({ ok: false, open: "'" });
  });

  it('an unterminated quote in an inline span fails extraction', () => {
    const result = analyse('Run `orbit status --change "demo` now.\n');
    expect(result.failures.map((f) => f.snippet)).toEqual(['orbit status --change "demo']);
  });
});

describe('the guard', () => {
  it('strips leading whitespace, blockquote markers, list markers and a leading pipe', () => {
    expect(normaliseGuardLine('   > > - orbit list --json')).toBe('orbit list --json');
    expect(normaliseGuardLine('1. orbit list --json')).toBe('orbit list --json');
    expect(normaliseGuardLine('2) orbit list --json')).toBe('orbit list --json');
    expect(normaliseGuardLine('| orbit list --json | x |')).toBe('orbit list --json | x |');
    for (const line of ['  orbit list --json', '> orbit list --json', '* orbit list --json', '+ orbit list --json', '| orbit list --json']) {
      expect(guardFails(line, 'orbit'), line).toBe(true);
    }
  });

  // @scenario behaviour orbit-cli-grammar :: Every `orbit` snippet on the generated surface parses against that program :: Prose naming a command is not a guard failure
  it('a prose line carrying no flag passes the guard', () => {
    const result = analyse(`${FENCE}\norbit validate passes\n${FENCE}\n`);
    expect(result.guard).toEqual([]);
    expect(guardFails('orbit validate passes', 'orbit')).toBe(false);
  });

  it('reads only lines outside a shell fence', () => {
    const result = analyse(`${FENCE}bash\norbit list --json\n${FENCE}\n\norbit list --json\n`);
    expect(result.guard.map((g) => g.line)).toEqual([5]);
  });

  it('a line not starting with the tool passes, whatever follows', () => {
    expect(guardFails('Then orbit list --json', 'orbit')).toBe(false);
    expect(guardFails('`orbit list --json`', 'orbit')).toBe(false);
  });
});

describe('the surface set', () => {
  it('is getSkillTemplates()\'s workflows, architect included and feedback excluded', () => {
    const ids = [...new Set(generatedSurfaces().map((s) => s.workflowId))];
    expect(ids).toEqual(getSkillTemplates().map((e) => e.workflowId));
    expect(ids).toContain('architect');
    expect(ids).not.toContain('feedback');
  });

  it('reads each entry\'s instructions and every reference', () => {
    const files = generatedSurfaces().map((s) => `${s.workflowId}/${s.file}`);
    for (const entry of getSkillTemplates()) {
      expect(files).toContain(`${entry.workflowId}/SKILL.md`);
      for (const ref of entry.template.references ?? []) expect(files).toContain(`${entry.workflowId}/references/${ref.name}`);
    }
    expect(files.length).toBe(
      getSkillTemplates().reduce((n, e) => n + 1 + (e.template.references?.length ?? 0), 0)
    );
  });
});
