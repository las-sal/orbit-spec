/**
 * `orbit decisions brief <change>` (stage `decision-reading`, `orbit-decision-records`' `The reading
 * step's brief is rendered by orbit`): render, read-only, the brief the reading step gives its reader.
 * Writes no file. A brief is whole or absent: a source that does not resolve exits non-zero naming it,
 * with nothing on standard output.
 */

import { buildDecisionBrief, renderDecisionBrief, DecisionBriefError } from '../core/decision-records.js';

export class DecisionsCommand {
  brief(change: string, options: { json?: boolean } = {}): number {
    let output: string;
    try {
      const brief = buildDecisionBrief('.', change);
      output = options.json ? JSON.stringify(brief, null, 2) + '\n' : renderDecisionBrief(brief);
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
