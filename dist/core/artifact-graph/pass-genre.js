import * as path from 'node:path';
import { isIndependent } from './gates.js';
/**
 * The ONE function implementing the pass-genre table. Inputs: the trail reader's ACCEPTED pass set
 * and its address-reviews records, plus the pass's own class, mode and filename token; only records
 * whose tokens STRICTLY precede that token are read.
 *
 * For an in-context pass in proposal or system mode, the qualifying walks are the address-reviews
 * records whose `source_path` resolves — by basename, through the ACCEPTED pass set — to a pass of
 * this mode, with a token after the latest accepted independent pass of the mode (every such walk
 * when the mode has none) and before the pass. A walk naming a rejected external return, no pass on
 * the trail, or no source at all is MODE-LESS and qualifies for no mode. The set is UNNARROWED: a
 * prior in-context pass does not move the lower bound, so a second verification re-lists the walks
 * an earlier one verified. Every other pass is REVIEW with an empty set.
 */
export function computePassGenre(trail, reviewerClass, mode, token) {
    const review = { passGenre: 'REVIEW', verifiedWalks: [] };
    if (reviewerClass !== 'in-context' || (mode !== 'proposal' && mode !== 'system'))
        return review;
    const prior = trail.passes.filter(p => p.token < token);
    const independent = prior
        .filter(p => p.mode === mode && isIndependent(p.reviewerClass))
        .map(p => p.token)
        .sort();
    const bound = independent.length > 0 ? independent[independent.length - 1] : null;
    // A walk's mode resolves THROUGH the accepted pass set — never from its source filename, which
    // would let the walk of a rejected external return qualify while the return itself bounds nothing.
    const modeOfPass = new Map(prior.map(p => [path.basename(p.file), p.mode]));
    const verifiedWalks = trail.resolutions
        .filter(r => r.token < token &&
        (bound === null || r.token > bound) &&
        r.sourcePath !== null &&
        modeOfPass.get(path.basename(r.sourcePath)) === mode)
        .map(r => r.token)
        .sort();
    return verifiedWalks.length > 0 ? { passGenre: 'VERIFICATION', verifiedWalks } : review;
}
// ---------------------------------------------------------------------------------------
// The verification record's KEYS and LEDGER — `orbit-emit-composition`'s `A VERIFICATION-genre
// payload carries its verdicts and its findings link to the walk record` owns the owed set; the
// write gate and the renderer both read it through this one ledger.
// ---------------------------------------------------------------------------------------
/**
 * The key the gate uses for resolution: trimmed, case-sensitive title + repo-relative file with any
 * `:line` suffix stripped. The trail reader applies this to walk entries already; a PAYLOAD key is
 * normalized here by the same steps (the trail reader's helpers are private, and `trail.ts` carries
 * no diff for this stage).
 */
export function normalizeKey(title, file) {
    return {
        title: title.trim(),
        file: file.replace(/\\/g, '/').trim().replace(/:\d+(:\d+)?$/, '').trim(),
    };
}
export function keyString(k) {
    return JSON.stringify([k.title, k.file]);
}
/**
 * The owed set over a computed walk set. An entry OWES a verdict exactly when its disposition is
 * `resolved`, at every severity; a key carried `resolved` by several walks is ONE owed entry judged
 * against the LATEST such walk, and a later walk carrying the key at another disposition does not
 * lift it. A walk is UNREADABLE for the record when the trail reader cannot read it, or when any of
 * its entries normalizes to an empty title or file — no well-shaped verdict could name that key.
 */
export function verificationLedger(trail, verifiedWalks) {
    const owed = new Map();
    const carried = new Map();
    const unreadable = [];
    const byToken = new Map(trail.resolutions.map(r => [r.token, r]));
    for (const token of [...verifiedWalks].sort()) {
        const rec = byToken.get(token);
        if (!rec || !rec.readable || rec.entries.some(e => e.title === '' || e.file === '')) {
            unreadable.push(token);
            continue;
        }
        for (const e of rec.entries) {
            const k = keyString(e);
            const list = carried.get(k) ?? [];
            list.push(e.disposition);
            carried.set(k, list);
            if (e.disposition === 'resolved') {
                const prev = owed.get(k);
                if (prev)
                    prev.walk = token;
                else
                    owed.set(k, { title: e.title, file: e.file, walk: token });
            }
        }
    }
    return { owed, carried, unreadable };
}
const VERDICTS = new Set(['landed', 'regressed']);
function isPlainObject(v) {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function slotError(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        return { field, kind: 'mistyped', detail: 'must be a non-empty single-line string' };
    }
    if (value.includes('\n') || value.includes('\r')) {
        return { field, kind: 'newline', detail: 'must be single-line (embedded newline)' };
    }
    return null;
}
function keyedObjectError(v, at, keys) {
    if (!isPlainObject(v)) {
        return { field: at, kind: 'mistyped', detail: `must be an object {${keys.join(', ')}}` };
    }
    for (const k of Object.keys(v)) {
        if (!keys.includes(k))
            return { field: `${at}.${k}`, kind: 'unknown-key', detail: `is not a key of ${at} — only ${keys.join(', ')}` };
    }
    for (const k of ['title', 'file']) {
        const e = slotError(v[k], `${at}.${k}`);
        if (e)
            return e;
    }
    return null;
}
/** `verification`: an array of `{title, file, verdict}`, `verdict` exactly `landed` | `regressed`. */
export function verificationShapeError(v) {
    if (!Array.isArray(v))
        return { field: 'verification', kind: 'mistyped', detail: 'must be an array of {title, file, verdict}' };
    for (let i = 0; i < v.length; i++) {
        const at = `verification[${i}]`;
        const e = keyedObjectError(v[i], at, ['title', 'file', 'verdict']);
        if (e)
            return e;
        const verdict = v[i].verdict;
        if (typeof verdict !== 'string' || !VERDICTS.has(verdict)) {
            return { field: `${at}.verdict`, kind: 'mistyped', detail: `must be 'landed' or 'regressed' (got ${JSON.stringify(verdict)})` };
        }
    }
    return null;
}
/** A finding's `walk_entry`: an object `{title, file}`. */
export function walkEntryShapeError(v, findingIndex) {
    return keyedObjectError(v, `findings[${findingIndex}].walk_entry`, ['title', 'file']);
}
//# sourceMappingURL=pass-genre.js.map