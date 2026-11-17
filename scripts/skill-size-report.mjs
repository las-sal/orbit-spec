#!/usr/bin/env node
/**
 * `npm run size:report` — the skill size report (reduce-orbit-phase1, R-rop-12; conditional-steps design §6).
 *
 * Renders every skill from the BUILT templates (run `npm run build` first) as `orbit init` writes its SKILL.md, and
 * prints, per skill: the body's characters, lines and estimated tokens (characters / 4) against the 5,000 tokens
 * Claude Code keeps of an invoked skill after a compaction, then each reference file's size; then the totals.
 *
 * It reports and never fails: it always exits 0, so a CI step running it cannot fail the build. The budget that
 * does fail is `test/core/templates/skill-body-budget.test.ts`.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KEPT_AFTER_COMPACTION = 5000;
const CHARS_PER_TOKEN = 4;

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fmt = (n) => n.toLocaleString('en-US');
const pad = (s, n) => String(s).padStart(n);
const lineCount = (text) => text.split('\n').length - 1;
const tokens = (chars) => Math.ceil(chars / CHARS_PER_TOKEN);

async function main() {
  const { version } = JSON.parse(readFileSync(path.join(repo, 'package.json'), 'utf-8'));
  const generation = path.join(repo, 'dist', 'core', 'shared', 'skill-generation.js');
  const { getSkillTemplates, generateSkillContent } = await import(pathToFileURL(generation).href);

  let bodyChars = 0;
  let referenceChars = 0;
  let referenceCount = 0;
  const over = [];

  console.log(`Skill size report (orbit ${version}; tokens estimated at ${CHARS_PER_TOKEN} characters each)\n`);
  console.log(`${'skill'.padEnd(28)}${pad('chars', 9)}${pad('lines', 7)}${pad('~tokens', 9)}  vs ${fmt(KEPT_AFTER_COMPACTION)} kept`);
  for (const { dirName, template } of getSkillTemplates()) {
    const body = generateSkillContent(template, version);
    const t = tokens(body.length);
    bodyChars += body.length;
    if (t > KEPT_AFTER_COMPACTION) over.push(dirName);
    const verdict = t > KEPT_AFTER_COMPACTION ? `over by ${fmt(t - KEPT_AFTER_COMPACTION)}` : 'within';
    console.log(`${dirName.padEnd(28)}${pad(fmt(body.length), 9)}${pad(lineCount(body), 7)}${pad(fmt(t), 9)}  ${verdict}`);
    for (const r of template.references ?? []) {
      referenceChars += r.content.length;
      referenceCount += 1;
      console.log(`  references/${r.name.padEnd(30)}${pad(fmt(r.content.length), 7)}${pad(lineCount(r.content), 7)}${pad(fmt(tokens(r.content.length)), 9)}`);
    }
  }
  console.log('');
  console.log(`bodies:     ${fmt(bodyChars)} characters (~${fmt(tokens(bodyChars))} tokens)`);
  console.log(`references: ${fmt(referenceChars)} characters in ${referenceCount} files (~${fmt(tokens(referenceChars))} tokens)`);
  console.log(`bodies over the ${fmt(KEPT_AFTER_COMPACTION)} tokens kept after a compaction: ${over.length ? over.join(', ') : 'none'}`);
}

try {
  await main();
} catch (error) {
  console.log(`size report not produced (run \`npm run build\` first?): ${error instanceof Error ? error.message : String(error)}`);
}
process.exit(0);
