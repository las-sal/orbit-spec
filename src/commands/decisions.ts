/**
 * `orbit decisions status` (stage `records-by-setting`, `orbit-decision-records`' `orbit decisions status says
 * whether decision records are written`): report, read-only and project-wide, whether decision records are written.
 *
 * `orbit decisions brief <change>` (stage `decision-reading`, `orbit-decision-records`' `The reading
 * step's brief is rendered by orbit`): render, read-only, the brief the reading step gives its reader.
 * Writes no file. A brief is whole or absent: a source that does not resolve exits non-zero naming it,
 * with nothing on standard output.
 */

import { buildDecisionBrief, renderDecisionBrief, DecisionBriefError } from '../core/decision-records.js';
import { decisionStatus, renderDecisionStatus } from '../core/decision-status.js';

export class DecisionsCommand {
  status(options: { json?: boolean } = {}): number {
    const status = decisionStatus('.');
    process.stdout.write(options.json ? JSON.stringify(status, null, 2) + '\n' : renderDecisionStatus(status) + '\n');
    return 0;
  }

  brief(change: string, options: { json?: boolean } = {}): number {
    let output: string;
    try {
      const brief = buildDecisionBrief('.', change);
      const markdown = renderDecisionBrief(brief);
      // --json carries the rendered text too, so one run gives the reading step both the brief it
      // dispatches and the filenames it records (the system walk: two runs could disagree).
      output = options.json ? JSON.stringify({ ...brief, markdown }, null, 2) + '\n' : markdown;
    } catch (e) {
      if (e instanceof DecisionBriefError) {
        console.error(`orbit decisions brief: ${e.message} No brief was printed.`);
        return 1;
      }
      throw e;
    }
    process.stdout.write(output);
    return 0;
  }
}
