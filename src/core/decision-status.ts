/**
 * Whether decision records are written (stage `records-by-setting` of `reduce-orbit-phase1`, R-rop-17;
 * `orbit-decision-records`' `Decision records are written when a setting reads them` and `orbit decisions status says
 * whether decision records are written`). Records are written exactly while a reader of them runs: a granted chain
 * key (the chain end step's open-stop check), a sign-off setting under which the user signs off (the program brief),
 * or a tripwire sensor that halts (its `tripwire` stops wait for an answer).
 *
 * Its own module, not `decision-records.ts`: it reads orbit's sensor list, and `tripwires.ts` imports
 * `decision-records.ts`. Read-only; the write gate does not read it.
 */

import { resolveChainSetting, resolveSignoffSetting, resolveTripwiresSetting, takesAccount, CHAIN_KEYS } from './project-config.js';
import { tripwireSensors } from './tripwires.js';

/** The terms that read decision records, in the order `readers` lists them. */
export const DECISION_READERS = ['chain', 'signoff', 'tripwires'] as const;
export type DecisionReader = (typeof DECISION_READERS)[number];

/** The result: `write` is true exactly when `readers` names at least one term. */
export interface DecisionStatus {
  write: boolean;
  readers: DecisionReader[];
}

/**
 * Compute the status from the working tree's `orbit/config.yaml` (or `.yml`), through each setting's own resolver: an
 * absent or unparseable file, or a value a resolver does not recognize, reads as that setting at its default. The
 * tripwire term iterates orbit's sensor list, so a later sensor is covered with no edit here.
 */
export function decisionStatus(projectRoot: string): DecisionStatus {
  const { grants } = resolveChainSetting(projectRoot);
  const tripwires = resolveTripwiresSetting({ projectRoot });
  const on: Record<DecisionReader, boolean> = {
    chain: CHAIN_KEYS.some(k => grants[k]),
    signoff: takesAccount(resolveSignoffSetting(projectRoot)),
    tripwires: tripwireSensors().some(s => s.onFire(tripwires) === 'halt'),
  };
  const readers = DECISION_READERS.filter(r => on[r]);
  return { write: readers.length > 0, readers };
}

/** The one human line `orbit decisions status` prints. */
export function renderDecisionStatus(status: DecisionStatus): string {
  return status.write
    ? `Decision records: written (read by ${status.readers.join(', ')})`
    : 'Decision records: not written (no setting reads them)';
}
