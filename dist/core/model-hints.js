import { readProjectConfig } from './project-config.js';
/** True iff the value passes the rendering-boundary well-formedness check. */
export function isRenderableHint(value) {
    if (typeof value !== 'string')
        return false;
    const v = value.trim();
    if (v === '' || v.length > 80)
        return false;
    // No control characters (incl. CR/LF/tab) anywhere in the raw value.
    // eslint-disable-next-line no-control-regex
    return !/[\u0000-\u001f\u007f]/.test(value);
}
/** Resolve the hint for the given keys from a models map; slot wins over phase. */
export function resolveModelHint(models, keys) {
    if (!models || !keys)
        return null;
    const slotValue = keys.slot !== undefined ? models[keys.slot] : undefined;
    if (isRenderableHint(slotValue))
        return slotValue.trim();
    const phaseValue = keys.phase !== undefined ? models[keys.phase] : undefined;
    if (isRenderableHint(phaseValue))
        return phaseValue.trim();
    return null;
}
/** Convenience: resolve from orbit/config.yaml on disk. */
export function modelHintFor(projectRoot, keys) {
    let models;
    try {
        models = readProjectConfig(projectRoot)?.models;
    }
    catch {
        models = undefined;
    }
    return resolveModelHint(models, keys);
}
/** Append the hint suffix to an eligibility line (after any ` — user-invoked` marker). */
export function withModelHint(line, hint) {
    return hint ? `${line} — hint: ${hint}` : line;
}
//# sourceMappingURL=model-hints.js.map