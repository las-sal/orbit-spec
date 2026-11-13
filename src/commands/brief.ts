/**
 * `orbit brief <doc>` and `orbit brief --change <name>` (stage `program-brief` of `automate-dev-flow`,
 * `orbit-program-brief`'s `` `orbit brief` renders a brief read-only `` and `A change's brief is saved, never
 * overwritten`): render a program's or a change's brief to standard output, writing no file — or, with
 * `--save`, save an active change's brief into its history and print the file and its SHA-256.
 *
 * A brief is whole or absent: any failure exits non-zero naming it on standard error, with nothing on
 * standard output and nothing written.
 */

import {
  ProgramBriefError,
  buildChangeBrief,
  buildProgramBrief,
  renderChangeBrief,
  renderProgramBrief,
  saveChangeBrief,
} from '../core/program-brief.js';

export interface BriefOptions {
  change?: string;
  json?: boolean;
  save?: boolean;
}

export class BriefCommand {
  run(doc: string | undefined, options: BriefOptions = {}, projectRoot = '.'): number {
    const usage = (message: string): number => {
      console.error(`orbit brief: ${message}`);
      return 1;
    };
    const hasDoc = doc !== undefined;
    const hasChange = options.change !== undefined;
    if (hasDoc && hasChange) return usage('name either a doc or a change, not both: `orbit brief <doc>` or `orbit brief --change <name>`.');
    if (options.save && !hasChange) {
      return usage(
        hasDoc
          ? "--save saves a change's brief and takes --change; saving a program brief is not built yet (stage program-brief's third change)."
          : '--save takes --change <name>: `orbit brief --change <name> --save`.'
      );
    }
    if (!hasDoc && !hasChange) return usage('name either a doc or a change: `orbit brief <doc>` or `orbit brief --change <name>`.');

    let output: string;
    try {
      if (hasChange) {
        const brief = buildChangeBrief(projectRoot, options.change as string);
        const markdown = renderChangeBrief(brief);
        if (options.save) {
          const saved = saveChangeBrief(projectRoot, brief, markdown);
          output = options.json
            ? JSON.stringify({ ...brief, markdown, saved }, null, 2) + '\n'
            : `${saved.path}\nsha256 ${saved.sha256}\n`;
        } else {
          output = options.json ? JSON.stringify({ ...brief, markdown }, null, 2) + '\n' : markdown;
        }
      } else {
        const brief = buildProgramBrief(projectRoot, doc as string);
        const markdown = renderProgramBrief(brief);
        output = options.json ? JSON.stringify({ ...brief, markdown }, null, 2) + '\n' : markdown;
      }
    } catch (e) {
      if (e instanceof ProgramBriefError) {
        console.error(`orbit brief: ${e.message} No brief was ${options.save ? 'saved' : 'printed'}.`);
        return 1;
      }
      throw e;
    }
    process.stdout.write(output);
    return 0;
  }
}
