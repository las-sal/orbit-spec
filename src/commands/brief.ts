/**
 * `orbit brief <doc>` and `orbit brief --change <name>` (stage `program-brief` of `automate-dev-flow`,
 * `orbit-program-brief`'s `` `orbit brief` renders a brief read-only `` and `A change's brief is saved, never
 * overwritten`): render a program's or a change's brief to standard output, writing no file — or, with
 * `--save`, save an active change's brief into its history, or a finished program's into the architecture trail
 * (`A program's brief is saved once the program is finished`), and print the file and its SHA-256 — or, with
 * `--hold`, report whether an active change (`A sign-off is recorded against the saved copy, and the hold reads
 * it`) or a program (`A program's sign-off is recorded against its saved copy, and the hold reads arc-done`) waits
 * on the user's sign-off, rendering no brief and writing nothing.
 *
 * A brief is whole or absent: any failure exits non-zero naming it on standard error, with nothing on
 * standard output and nothing written.
 */

import {
  ProgramBriefError,
  buildChangeBrief,
  buildProgramBrief,
  renderChangeBrief,
  findChange,
  renderProgramBrief,
  saveChangeBrief,
  saveProgramBrief,
} from '../core/program-brief.js';
import { SignoffError, computeHold, computeProgramHold, renderHold, renderProgramHold } from '../core/signoff.js';
import { isSingleName } from '../core/containment.js';
import { isValidDocName } from '../core/architecture/parser.js';

export interface BriefOptions {
  change?: string;
  json?: boolean;
  save?: boolean;
  hold?: boolean;
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
    if (options.hold) return this.hold(doc, options, projectRoot, usage);
    if (options.save && !hasChange && !hasDoc) {
      return usage('--save takes a doc or --change <name>: `orbit brief <doc> --save` or `orbit brief --change <name> --save`.');
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
        if (options.save) {
          const { save, saved } = saveProgramBrief(projectRoot, brief, markdown);
          if (options.json) output = JSON.stringify({ ...brief, markdown, save, saved }, null, 2) + '\n';
          else if (save === 'saved') output = `${saved!.path}\nsha256 ${saved!.sha256}\n`;
          else if (save === 'unchanged') output = `${saved!.path} is unchanged: the program's latest saved brief holds exactly this text, so no copy was saved.\n`;
          else output = `The program ${doc} is not finished, so its brief was not saved.\n`;
        } else {
          output = options.json ? JSON.stringify({ ...brief, markdown }, null, 2) + '\n' : markdown;
        }
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

  /** `--hold`: read-only; renders no brief. Every refusal prints nothing to standard output. */
  private hold(doc: string | undefined, options: BriefOptions, projectRoot: string, usage: (m: string) => number): number {
    if (options.save) return usage('--hold reads the hold and writes nothing; run --save and --hold separately.');
    if (doc !== undefined) return this.programHold(doc, options, projectRoot);
    if (options.change === undefined) {
      return usage('--hold takes a doc or --change <name>: `orbit brief <doc> --hold` or `orbit brief --change <name> --hold`.');
    }
    const name = options.change;
    if (!isSingleName(name)) return usage(`'${name}' is not a single change name.`);
    const found = findChange(projectRoot, name);
    if (found === null || found.status !== 'active') {
      return usage(
        found === null
          ? `--hold reads an active change's hold; change '${name}' was not found at orbit/changes/${name}/.`
          : `--hold reads an active change's hold; change '${name}' is archived, and an archived change waits on nothing.`
      );
    }
    let report;
    try {
      report = computeHold(projectRoot, name, found.dir);
    } catch (e) {
      if (e instanceof SignoffError) {
        console.error(`orbit brief: ${e.message} The hold was not read.`);
        return 1;
      }
      throw e;
    }
    if (options.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    } else {
      // The one line on standard output; a warning, when the setting carries one, on standard error.
      if (report.warning !== null) console.error(`orbit brief: ${report.warning}`);
      process.stdout.write(renderHold(report) + '\n');
    }
    return 0;
  }

  /** `<doc> --hold`: the program's hold. The setting is read first; under any value but `program` nothing else is. */
  private programHold(doc: string, options: BriefOptions, projectRoot: string): number {
    if (!isSingleName(doc) || !isValidDocName(doc)) {
      console.error(`orbit brief: '${doc}' is not a single doc name.`);
      return 1;
    }
    let report;
    try {
      report = computeProgramHold(projectRoot, doc);
    } catch (e) {
      if (e instanceof SignoffError) {
        console.error(`orbit brief: ${e.message} The hold was not read.`);
        return 1;
      }
      throw e;
    }
    if (options.json) {
      process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    } else {
      if (report.warning !== null) console.error(`orbit brief: ${report.warning}`);
      process.stdout.write(renderProgramHold(report) + '\n');
    }
    return 0;
  }
}
