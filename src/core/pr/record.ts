/**
 * The `orbit pr` record (rc12-engine-owned-choreography, D-rc12-8; `orbit-pr-lifecycle`'s
 * `The \`orbit pr\` command observes and prints; it never writes`).
 *
 * One record per subcommand call. It separates what the engine SAW (`observations`), what the
 * workflow body RUNS (`segments`, in order, authoring each segment's `inputs` first), and what
 * the USER does (`human_acts`, never run by a body or a test). The engine writes no note: a
 * skip or a PR-half degradation carries a closed `reason.code` and the facts in `detail`, and
 * the body renders the one-line note (D-rc12-13).
 */

export type PrSubcommand = 'select' | 'publish' | 'preflight' | 'tail' | 'program';
export type PrAction = 'off' | 'skip' | 'proceed';

/** The CLOSED set of body-authored inputs a printed argv may name, each an exact argv element. */
export const SEGMENT_INPUTS = ['<message-file>', '<title>', '<body-file>', '<emit-path>'] as const;
export type SegmentInput = (typeof SEGMENT_INPUTS)[number];

export interface PrStep {
  step: string;
  argv: string[];
}

export interface PrSegment {
  inputs: SegmentInput[];
  steps: PrStep[];
}

export interface PrHumanAct {
  act: string;
  argv: string[];
}

export interface PrReason {
  code: string;
  detail: Record<string, unknown>;
}

export interface PrResolution {
  remote: string | null;
  repo: string | null;
  default_branch: string | null;
  gh: 'present' | 'absent';
}

export interface PrRecord {
  subcommand: PrSubcommand;
  action: PrAction;
  reason: PrReason | null;
  degraded: 'pr' | null;
  observations: Record<string, unknown>;
  segments: PrSegment[];
  human_acts: PrHumanAct[];
}

/**
 * A usage error: the only non-zero exit an `orbit pr` subcommand has. Every other outcome —
 * off, skip, proceed, degraded — exits 0, because the PR layer degrades and never blocks.
 */
export class PrUsageError extends Error {}

/**
 * Preflight's CLOSED outcome set (D-rc12-12), shared by `preflight` (which decides one), `tail`
 * (which takes one as `--outcome`) and `program` (which reports one).
 */
export const POSITIVE_INVALIDATIONS = [
  'closed',
  'merged',
  'retargeted',
  'head-mismatch',
  'repository-mismatch',
] as const;
export const PREFLIGHT_OUTCOMES = [
  'valid',
  ...POSITIVE_INVALIDATIONS,
  'not-found',
  'discovered',
  'none',
  'several',
  'unobserved',
  'gh-absent',
] as const;
export type PreflightOutcome = (typeof PREFLIGHT_OUTCOMES)[number];

export function offRecord(subcommand: PrSubcommand, observations: Record<string, unknown> = {}): PrRecord {
  return { subcommand, action: 'off', reason: null, degraded: null, observations, segments: [], human_acts: [] };
}

export function skipRecord(
  subcommand: PrSubcommand,
  code: string,
  detail: Record<string, unknown>,
  observations: Record<string, unknown>
): PrRecord {
  return {
    subcommand,
    action: 'skip',
    reason: { code, detail },
    degraded: null,
    observations,
    segments: [],
    human_acts: [],
  };
}
