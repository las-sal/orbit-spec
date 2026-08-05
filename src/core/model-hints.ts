import { readProjectConfig } from './project-config.js';

/**
 * Model-hint garnish (D-arc Stage D5, D-d5-9 / R-d-9(a)). When `orbit/config.yaml`
 * carries an OPTIONAL `models:` map and the canonical-next command's phase or cadence
 * slot has an entry, the rendered eligibility line appends ` — hint: <value>` (after any
 * ` — user-invoked` marker). SLOT entry wins over phase (the more specific hook); keys
 * outside both vocabularies are inert; and the VALUE is checked only at this rendering
 * boundary — a renderable hint is a non-empty single-line string of at most 80 characters
 * with no control characters (the eligibility line is a model-facing protocol; an embedded
 * newline could forge readout lines). A failing value is INERT exactly like an unknown
 * key: the line renders without the suffix, byte-identical to an absent entry, never an
 * error. Absent map = byte-identical pre-capability output.
 */

export interface HintKeys {
  /** Schema phase id driving the canonical next (e.g. `review-proposal`, `apply`). */
  phase?: string;
  /** Cadence slot name when the next command covers a slot (`in-context`, `fresh`, `independent`, `external`). */
  slot?: string;
}

/** True iff the value passes the rendering-boundary well-formedness check. */
export function isRenderableHint(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v === '' || v.length > 80) return false;
  // No control characters (incl. CR/LF/tab) anywhere in the raw value.
  // eslint-disable-next-line no-control-regex
  return !/[\u0000-\u001f\u007f]/.test(value);
}

/** Resolve the hint for the given keys from a models map; slot wins over phase. */
export function resolveModelHint(
  models: Record<string, string> | undefined,
  keys: HintKeys | undefined
): string | null {
  if (!models || !keys) return null;
  const slotValue = keys.slot !== undefined ? models[keys.slot] : undefined;
  if (isRenderableHint(slotValue)) return slotValue.trim();
  const phaseValue = keys.phase !== undefined ? models[keys.phase] : undefined;
  if (isRenderableHint(phaseValue)) return phaseValue.trim();
  return null;
}

/** Convenience: resolve from orbit/config.yaml on disk. */
export function modelHintFor(projectRoot: string, keys: HintKeys | undefined): string | null {
  let models: Record<string, string> | undefined;
  try {
    models = readProjectConfig(projectRoot)?.models;
  } catch {
    models = undefined;
  }
  return resolveModelHint(models, keys);
}

/** Append the hint suffix to an eligibility line (after any ` — user-invoked` marker). */
export function withModelHint(line: string, hint: string | null): string {
  return hint ? `${line} — hint: ${hint}` : line;
}
