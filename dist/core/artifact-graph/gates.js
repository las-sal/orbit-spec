import * as fs from 'node:fs';
import * as path from 'node:path';
import { normalizeGates } from './schema.js';
import { readTrail, isSubstantive, } from './trail.js';
import { resolveReviewPreference } from '../project-config.js';
/** v1 freshness: a pass is stale iff an `apply-*.json` token is lexically later than its token. */
export function isPassStale(pass, applyTokens) {
    return applyTokens.some(t => t > pass.token);
}
/** Derive the review mode a gate operates over from its id (`review-proposal` → proposal). */
function gateMode(gate) {
    const m = gate.id.match(/^review-(proposal|system)$/);
    if (m)
        return m[1];
    if (gate.id.includes('proposal'))
        return 'proposal';
    if (gate.id.includes('system'))
        return 'system';
    return null;
}
/** A cadence slot is satisfied by a pass of its class (independent = fresh|external). */
function passSatisfiesSlot(slot, cls) {
    if (slot === 'independent')
        return cls === 'fresh' || cls === 'external';
    return slot === cls;
}
export function isIndependent(cls) {
    return cls === 'fresh' || cls === 'external';
}
/** The canonical command that covers a given cadence slot / class. */
function commandForClass(slot, mode, change) {
    // EXHAUSTIVE over CadenceEntry (rc02): a new token must never fall through to the in-context
    // command, which would recommend a class satisfying no slot.
    switch (slot) {
        // `independent` renders the fresh-context review (proposal-phase default), never
        // co-offered with external, per orbit-engine-gates single-voiced canonical-next.
        case 'independent':
        case 'fresh':
        // A `blind-pair` reaching here has no pairable pass standing; the fresh invocation is the
        // lighter first half. The pairable-partner case is resolved in canonicalNextForReviewed.
        case 'blind-pair':
            return `/orbit:review --as ${mode} --fresh ${change}`;
        // An `invoked` slot's command is chosen by its presentation table (`presentInvoked`); reaching
        // here means the default preference, which presents the pair command (rc17b).
        case 'invoked':
            return `/orbit:review --as ${mode} --reviewer blind-pair ${change}`;
        case 'external':
            return `/orbit:review --as ${mode} --reviewer external ${change}`;
        case 'in-context':
            return `/orbit:review --as ${mode} ${change}`;
        default: {
            const never = slot;
            throw new Error(`unhandled cadence entry: ${String(never)}`);
        }
    }
}
/**
 * Lifecycle command for a gate's `before` target when the gate passes. When the
 * gate is consent-marked, the rendered command carries the ` — user-invoked` marker
 * (D1 eligibility phrasing): entry into the phase is the user's call.
 */
function nextAfterPass(gate, change) {
    let cmd;
    if (gate.before === 'apply')
        cmd = `/orbit:apply ${change}`;
    if (gate.before === 'archive')
        cmd = `/orbit:archive ${change}`;
    if (cmd && gate.consent === 'user-invoked')
        cmd += ' — user-invoked';
    return cmd;
}
/** Count `- [ ]` vs `- [x]` checkboxes in a tracks file. */
function countCheckboxes(changeDir, tracks) {
    const p = path.join(changeDir, tracks);
    let content;
    try {
        content = fs.readFileSync(p, 'utf-8');
    }
    catch {
        return { checked: 0, total: 0 };
    }
    const checked = (content.match(/^\s*- \[x\]/gim) ?? []).length;
    const unchecked = (content.match(/^\s*- \[ \]/gim) ?? []).length;
    return { checked, total: checked + unchecked };
}
/**
 * Unchecked checkbox lines from a tracks file as `{id, text}` — id is the first
 * whitespace-delimited token after the box (e.g. `9.6`). Used by the D5 user-validation
 * subset rule; recomputed from disk on every render (self-healing, no stored state).
 */
function uncheckedTaskLines(changeDir, tracks) {
    const p = path.join(changeDir, tracks);
    let content;
    try {
        content = fs.readFileSync(p, 'utf-8');
    }
    catch {
        return [];
    }
    const out = [];
    for (const line of content.split('\n')) {
        const m = line.match(/^\s*- \[ \]\s+(\S+)\s*(.*)$/i);
        if (m)
            out.push({ id: m[1], text: line });
    }
    return out;
}
/** The address-reviews records whose `source_path` references this pass's findings artifact. */
function recordsFor(pass, trail) {
    const passFile = path.basename(pass.file);
    return trail.resolutions
        .filter(r => r.sourcePath && path.basename(r.sourcePath) === passFile)
        .sort((a, b) => (a.token < b.token ? -1 : 1));
}
/**
 * Clause (b). EXISTENCE FIRST (scoped to SUBSTANTIVE findings), then ONE readability predicate
 * with ONE fallback. Every empty case is STATED, never defaulted.
 */
function passResolved(pass, trail) {
    // A pass with no substantive findings needs no resolution run — including one whose findings are
    // ALL SUGGESTION-grade, since requiring a walk there would be SUGGESTIONs gating by another route.
    if (pass.critical + pass.warning === 0)
        return true;
    const recs = recordsFor(pass, trail);
    // EXISTENCE FIRST: no referencing record at all is UNRESOLVED, never vacuously resolved.
    if (recs.length === 0)
        return false;
    const latest = recs[recs.length - 1];
    if (latest.readable) {
        // COMPLETENESS BEFORE DISPOSITION (rc02 walk 7). A readable record certifies only the findings
        // it actually names: without this, a record listing one of a pass's two WARNINGs resolves both,
        // because no entry it contains carries a blocking disposition. Every substantive source finding
        // must be matched by an entry, keyed by the tuple (TRIMMED, CASE-SENSITIVE TITLE + REPO-RELATIVE FILE).
        // (Stated directly: the "new-finding match" this comment used to cite was retired with
        // clause (c), so a key defined by reference to it can no longer be looked up.)
        const named = new Set(latest.entries.filter(e => isSubstantive(e.severity)).map(e => JSON.stringify([e.title, e.file])));
        const covered = pass.findings
            .filter(f => isSubstantive(f.severity))
            .every(f => named.has(JSON.stringify([f.title, f.file])));
        if (!covered)
            return false;
        // Per-entry data is PREFERRED over the severity-blind `resolution_summary`.
        return !latest.entries.some(e => isSubstantive(e.severity) && (e.disposition === 'deferred' || e.disposition === 'escalated'));
    }
    // UNREADABLE: fall back WHOLE to the bare counts. `null` (absent/non-numeric) stays unresolved.
    return latest.deferred === 0 && latest.escalated === 0;
}
/**
 * Distinct SUGGESTION-grade entries deferred or escalated, deduplicated by (trimmed title,
 * repo-relative file) across the latest record of every relevant pass — the SAME key clause (b)
 * uses for completeness above, so one suggestion deferred across two passes counts once. Named
 * directly rather than by reference to the retired new-finding match.
 */
function deferredSuggestionCount(passes, trail) {
    const seen = new Set();
    for (const p of passes) {
        const recs = recordsFor(p, trail);
        const latest = recs[recs.length - 1];
        if (!latest?.readable)
            continue;
        for (const e of latest.entries) {
            if (e.severity === 'SUGGESTION' && (e.disposition === 'deferred' || e.disposition === 'escalated')) {
                seen.add(JSON.stringify([e.title, e.file]));
            }
        }
    }
    return seen.size;
}
/** Tokens of every record closing the given passes' findings — clause (a)'s second ordering bound. */
function recordTokensFor(passes, trail) {
    const out = [];
    for (const p of passes)
        for (const r of recordsFor(p, trail))
            out.push(r.token);
    return out;
}
/**
 * rc17a: pair membership, read from the trail on every evaluation (the engine stores nothing). Per mode,
 * a launch's members are the first fresh pass and the first external return among the trail reader's
 * ACCEPTED passes — a rejected return is not in `trail.passes`, so it takes no position — later than the
 * launch and earlier than the mode's next launch. A walk record referencing a landed member whose token
 * precedes that member's partner (or with no partner landed at all) ENDS the pair at that record. An
 * apply ends nothing: freshness alone keeps a stale member from covering. ONE function, read by
 * coverage, diagnosis and presentation.
 */
export function computePairMembership(trail) {
    const pairs = [];
    const memberFiles = new Set();
    const ambiguousFiles = new Set();
    const byMode = new Map();
    for (const l of trail.launches) {
        const list = byMode.get(l.mode) ?? [];
        list.push(l);
        byMode.set(l.mode, list);
    }
    for (const [mode, launches] of byMode) {
        const sorted = [...launches].sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
        for (let k = 0; k < sorted.length; k++) {
            const launch = sorted[k];
            const next = sorted[k + 1]?.token;
            const window = trail.passes
                .filter(p => p.mode === mode && isIndependent(p.reviewerClass))
                .filter(p => p.token > launch.token && (next === undefined || p.token < next))
                .sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
            const fresh = window.find(p => p.reviewerClass === 'fresh');
            const external = window.find(p => p.reviewerClass === 'external');
            const tiedAll = trail.passes
                .filter(p => p.mode === mode && isIndependent(p.reviewerClass) && p.token === launch.token)
                .sort((a, b) => (path.basename(a.file) < path.basename(b.file) ? -1 : 1));
            for (const t of tiedAll)
                ambiguousFiles.add(t.file);
            const pair = {
                launch,
                ...(fresh ? { fresh } : {}),
                ...(external ? { external } : {}),
                ...(tiedAll.length > 0 ? { tied: tiedAll[0] } : {}),
            };
            // ENDED: a walk of a landed member before its partner lands — the user chose to proceed on one review.
            let endedAt;
            for (const [member, partner] of [
                [fresh, external],
                [external, fresh],
            ]) {
                if (!member)
                    continue;
                for (const r of recordsFor(member, trail)) {
                    if (partner === undefined || r.token < partner.token) {
                        if (endedAt === undefined || r.token < endedAt)
                            endedAt = r.token;
                    }
                }
            }
            if (endedAt !== undefined)
                pair.endedAt = endedAt;
            else {
                if (fresh)
                    memberFiles.add(fresh.file);
                if (external)
                    memberFiles.add(external.file);
            }
            pairs.push(pair);
        }
    }
    pairs.sort((a, b) => (a.launch.token < b.launch.token ? -1 : a.launch.token > b.launch.token ? 1 : 0));
    return { pairs, memberFiles, ambiguousFiles };
}
/** Blindness between two members, endpoints INCLUSIVE, scoped to records referencing either. */
function isBlindPair(a, b, trail) {
    if (a.token === b.token)
        return false; // token equality fails SAFE
    const lo = a.token < b.token ? a.token : b.token;
    const hi = a.token < b.token ? b.token : a.token;
    return !recordTokensFor([a, b], trail).some(t => t >= lo && t <= hi);
}
/**
 * Candidate assignments for ONE slot, in the TOTAL order the requirement names (later token, then
 * earlier token, then findings-artifact filename), so a depth-first search returning the FIRST
 * complete assignment returns the lexicographically smallest one.
 */
function slotCandidates(slot, ordered, used, lowerBound, trail, membership) {
    const eligible = (i) => !used.has(i) && (lowerBound === null || ordered[i].token > lowerBound);
    const out = [];
    if (slot === 'blind-pair') {
        for (let i = 0; i < ordered.length; i++) {
            if (!eligible(i) || ordered[i].reviewerClass !== 'fresh')
                continue;
            for (let j = 0; j < ordered.length; j++) {
                if (i === j || !eligible(j) || ordered[j].reviewerClass !== 'external')
                    continue;
                const a = ordered[i];
                const b = ordered[j];
                // Token equality fails SAFE: blindness between same-second members is unknowable.
                if (a.token === b.token)
                    continue;
                const lo = a.token < b.token ? a.token : b.token;
                const hi = a.token < b.token ? b.token : a.token;
                // BLINDNESS, endpoints INCLUSIVE, scoped to records referencing either member.
                if (recordTokensFor([a, b], trail).some(t => t >= lo && t <= hi))
                    continue;
                const hiPass = a.token === hi ? a : b;
                out.push({ indices: [i, j], token: hi, sortKey: [hi, lo, path.basename(hiPass.file)].join('\u0000') });
            }
        }
    }
    else if (slot === 'invoked') {
        // rc17a: what the user INVOKED — every eligible SINGLE at its own token, and every COMPLETE pair at
        // its later member's token, in the same total order. A member of an open or complete pair is never
        // a single; an ended pair's former members are.
        for (let i = 0; i < ordered.length; i++) {
            const p = ordered[i];
            if (!eligible(i) || !isIndependent(p.reviewerClass) || membership.memberFiles.has(p.file) || membership.ambiguousFiles.has(p.file))
                continue;
            out.push({ indices: [i], token: p.token, sortKey: [p.token, path.basename(p.file)].join('\u0000') });
        }
        const index = new Map(ordered.map((p, i) => [p.file, i]));
        for (const pair of membership.pairs) {
            if (pair.endedAt !== undefined || !pair.fresh || !pair.external)
                continue;
            const i = index.get(pair.fresh.file);
            const j = index.get(pair.external.file);
            // Both members must be in THIS pass list (a stale member is absent from the fresh list) and eligible.
            if (i === undefined || j === undefined || !eligible(i) || !eligible(j))
                continue;
            const a = ordered[i];
            const b = ordered[j];
            if (!isBlindPair(a, b, trail))
                continue;
            const lo = a.token < b.token ? a.token : b.token;
            const hi = a.token < b.token ? b.token : a.token;
            const hiPass = a.token === hi ? a : b;
            out.push({ indices: [i, j], token: hi, sortKey: [hi, lo, path.basename(hiPass.file)].join('\u0000') });
        }
    }
    else {
        for (let i = 0; i < ordered.length; i++) {
            if (!eligible(i) || !passSatisfiesSlot(slot, ordered[i].reviewerClass))
                continue;
            out.push({
                indices: [i],
                token: ordered[i].token,
                sortKey: [ordered[i].token, path.basename(ordered[i].file)].join('\u0000'),
            });
        }
    }
    out.sort((x, y) => (x.sortKey < y.sortKey ? -1 : 1));
    return out;
}
/**
 * Clause (a). Coverage is EXISTENTIAL: it holds iff there EXISTS an assignment satisfying every
 * constraint. Depth-first WITH BACKTRACKING, because a pair chosen early can raise the lower bound
 * on a following slot (through that pair's resolution records) and foreclose an assignment a later
 * pair leaves open.
 */
function assignCadence(cadence, ordered, trail, membership) {
    let deepest = 0;
    // rc17a (D-bpc-6): the LOWEST lower bound seen at the deepest slot. Eligibility is `token > bound`, so
    // the lowest reaching bound's eligible set contains every other reaching state's — the canonical
    // state the failed slot is diagnosed at. `null` (no bound, slot 0) is lowest of all.
    let deepestBound = null;
    // Memoized FAILURE states. Without it the search re-explores equivalent (slot, consumed set,
    // lower bound) states and grows exponentially on a cadence with many slots; measured 4.5s at
    // 22 passes / 12 slots before this.
    const failed = new Set();
    const search = (slotIdx, used, lowerBound, acc) => {
        if (slotIdx >= cadence.length)
            return acc;
        // The key is (slot, lower bound) ONLY. The consumed set is redundant for eligibility: every
        // slot's pass must strictly beat the previous slot's token, so an already-consumed pass — whose
        // token is at or below the current bound — can never be eligible again. Dropping it from the key
        // collapses the state space from combinatorial to slots x distinct-tokens.
        const memoKey = `${slotIdx}|${lowerBound ?? ''}`;
        if (failed.has(memoKey))
            return null;
        if (slotIdx > deepest) {
            deepest = slotIdx;
            deepestBound = lowerBound;
        }
        else if (slotIdx === deepest && deepestBound !== null && (lowerBound === null || lowerBound < deepestBound)) {
            deepestBound = lowerBound;
        }
        const slot = cadence[slotIdx];
        for (const cand of slotCandidates(slot, ordered, used, lowerBound, trail, membership)) {
            const passes = cand.indices.map(i => ordered[i]);
            // The NEXT slot must beat this slot's passes AND every record closing their findings — what
            // makes a following slot a CHECK ON THE WALK rather than a pass that merely arrived late.
            const nextBound = [cand.token, ...recordTokensFor(passes, trail)].reduce((m, t) => (t > m ? t : m), cand.token);
            const nextUsed = new Set(used);
            for (const i of cand.indices)
                nextUsed.add(i);
            const got = search(slotIdx + 1, nextUsed, nextBound, [
                ...acc,
                { slot, indices: cand.indices, token: cand.token },
            ]);
            if (got)
                return got;
        }
        failed.add(memoKey);
        return null;
    };
    const found = search(0, new Set(), null, []);
    return found ? { assignment: found } : { failedSlot: deepest, failedBound: deepestBound };
}
/**
 * Why a blind-pair slot failed. Diagnosis uses the SAME predicates assignment uses, OVER THE SAME SET
 * (rc17a, D-bpc-6): the PAIRABLE passes ELIGIBLE at the failed slot — tokens above its canonical lower
 * bound — never the whole pass list, so the reason and the canonical command can never name different
 * classes. A pair excluded by the ordering constraints is a class missing above the bound; the retired
 * `foreclosed` label named that state and set no `openPair`.
 */
function pairableEligible(ordered, bound, trail) {
    return ordered.filter(p => isIndependent(p.reviewerClass) && (bound === null || p.token > bound) && isPairable(p, trail));
}
function diagnosePair(ordered, bound, trail) {
    const pairable = pairableEligible(ordered, bound, trail);
    const fresh = pairable.filter(p => p.reviewerClass === 'fresh');
    const ext = pairable.filter(p => p.reviewerClass === 'external');
    if (fresh.length === 0 && ext.length === 0)
        return 'none-standing';
    if (fresh.length === 0)
        return 'no-fresh';
    if (ext.length === 0)
        return 'no-external';
    let sawTie = false;
    let sawBroken = false;
    for (const a of fresh) {
        for (const b of ext) {
            if (a.token === b.token) {
                sawTie = true;
                continue;
            }
            if (!isBlindPair(a, b, trail))
                sawBroken = true;
        }
    }
    // A blind untied pairable pair above the canonical bound is UNREACHABLE here: it would have been a
    // candidate, and a LATER slot would be the deepest failure. Defensively it reads as broken.
    return sawTie && !sawBroken ? 'tie' : 'blindness-broken';
}
/**
 * A standing pass is PAIRABLE while no record referencing it carries a token at or after its own.
 * The bound is INCLUSIVE because the blindness rule is: a record sharing a member's token already
 * falls inside `[lo, hi]`, so an exclusive test here would recommend buying a partner for a pass
 * that cannot form a valid pair.
 */
function isPairable(pass, trail) {
    return !recordsFor(pass, trail).some(r => r.token >= pass.token);
}
function presentInvoked(mode, ordered, bound, membership, preference) {
    const preferred = preference === 'external' || preference === 'fresh' ? preference : 'blind-pair';
    const fallback = { reason: 'no outside review stands on this state', cls: preferred };
    const ofMode = membership.pairs.filter(p => mode === null || p.launch.mode === mode);
    const live = ofMode[ofMode.length - 1];
    // NO-LAUNCH, or the latest launch's pair already ENDED by a walk: nothing is open.
    if (!live || live.endedAt !== undefined)
        return fallback;
    // "Landed" is read from MEMBERSHIP (rc17a system walk, fresh W1, Sal: C): a member exists when the
    // membership table names it, stale or not. A landed member is USABLE on this state only when it is in the
    // evaluated (fresh) pass list and above the slot's bound; one that is not cannot fill the slot, and a
    // further review of its class — a second pass of that class in the window — lands as a single.
    const inList = new Set(ordered.map(p => p.file));
    const members = [live.fresh, live.external].filter((m) => m !== undefined);
    const L = live.launch.token;
    const above = (m) => bound === null || m.token > bound;
    if (members.length === 1) {
        const m = members[0];
        const cls = m.reviewerClass;
        const missing = cls === 'fresh' ? 'external' : 'fresh';
        if (!inList.has(m.file)) {
            return {
                reason: `pair launched at ${L} cannot fill this slot: its ${cls} member is stale (an apply landed after it); a further ${cls} review lands as a single`,
                cls,
            };
        }
        if (above(m)) {
            return {
                reason: `pair launched at ${L} is open: the ${cls} member has no ${missing} partner; run it before walking these findings`,
                cls: missing,
                openPair: { missing },
            };
        }
        return {
            reason: `pair launched at ${L} cannot fill this slot: its ${cls} member sits at or below the slot's bound; a further ${cls} review lands as a single`,
            cls,
        };
    }
    if (members.length === 0) {
        if (live.tied) {
            const cls = live.tied.reviewerClass;
            return {
                reason: `pair launched at ${L} ambiguous: the ${cls} pass sharing its token may have preceded it; a further ${cls} review lands as its member`,
                cls,
            };
        }
        return { reason: `pair launched at ${L}: neither member has landed; both must land before either is walked`, cls: 'fresh' };
    }
    if (members.every(m => inList.has(m.file) && above(m)) && members[0].token === members[1].token) {
        return { reason: `pair launched at ${L} ambiguous: its two members share a timestamp token`, cls: preferred };
    }
    return fallback;
}
/**
 * Evaluates the reviewed-gate pass condition.
 *
 * PASS-LIST QUANTIFICATION (stated once, here): clause (a) runs over the pass list the
 * CALLER supplies — fresh for the primary evaluation, the full list for the stale discrimination —
 * while clause (b) always runs over every relevant pass. No rule below restates a freshness
 * condition; the filter has exactly one home, the call site.
 *
 * EMPTY SETS ARE NEVER VACUOUSLY SATISFYING: every rule states its empty case.
 */
function evaluateReviewed(gate, coveragePasses, resolutionPasses, trail, membership, preference) {
    const ordered = [...coveragePasses].sort((a, b) => (a.token < b.token ? -1 : 1));
    const mode = gateMode(gate);
    // COVERAGE IS COMPUTED FIRST, even though resolution decides the state. The walk that clause (b)
    // would recommend is the very act that forecloses an open blind pair (or ends a launched one), so
    // the recommendation surface has to know about the pair BEFORE it is told to walk.
    const cover = assignCadence(gate.cadence, ordered, trail, membership);
    let openPair;
    let openPairFrom;
    let pairFailure;
    let invoked;
    if ('failedSlot' in cover) {
        const slot = gate.cadence[cover.failedSlot];
        if (slot === 'blind-pair') {
            pairFailure = diagnosePair(ordered, cover.failedBound, trail);
            // ONLY when a PAIRABLE member actually stands, which is the normative qualifier. With NOTHING
            // standing there is no pair to foreclose, so a safe outstanding walk must run first rather than
            // being deferred behind a review of a state no future pair member shares.
            if (pairFailure === 'no-fresh')
                openPair = { missing: 'fresh' };
            else if (pairFailure === 'no-external')
                openPair = { missing: 'external' };
            if (openPair)
                openPairFrom = 'blind-pair';
        }
        else if (slot === 'invoked') {
            invoked = presentInvoked(mode, ordered, cover.failedBound, membership, preference);
            if (invoked.openPair) {
                openPair = invoked.openPair;
                openPairFrom = 'invoked';
            }
        }
    }
    // (b) resolution over EVERY relevant same-gate pass — INCLUDING stale ones.
    // rc08b: the loop COLLECTS every unresolved pass rather than returning at the first, so the walk
    // can discover exactly what the gate holds. `reason` still names the FIRST.
    const resOrdered = [...resolutionPasses].sort((a, b) => (a.token < b.token ? -1 : 1));
    const unresolvedPasses = resOrdered.filter(p => !passResolved(p, trail));
    if (unresolvedPasses.length > 0) {
        const p = unresolvedPasses[0];
        let pairNote = '';
        if (openPair && openPairFrom === 'invoked' && invoked) {
            // The presentation's own row-1 reason, its tail sharpened: a walk now ENDS the pair.
            pairNote = ` — and the ${invoked.reason.replace(/; run it before walking these findings$/, '; run it BEFORE walking these findings, or the walk ends the pair')}`;
        }
        else if (openPair) {
            pairNote = ` — and the ${gate.cadence.includes('blind-pair') ? 'blind pair is OPEN' : 'pair is open'}: run the ${openPair.missing} member BEFORE walking these findings, or the pair can never be formed on this state`;
        }
        return {
            converged: false,
            reason: `pass ${p.token} has unresolved substantive findings${pairNote}`,
            unresolvedPass: p,
            unresolvedPasses,
            openPair,
            openPairFrom,
            invoked,
        };
    }
    const deferredSuggestions = deferredSuggestionCount(resOrdered, trail);
    // (a) ordered-slot coverage, existential with backtracking (computed above; reused here).
    if ('failedSlot' in cover) {
        const slot = gate.cadence[cover.failedSlot];
        const failed = { converged: false, neededSlot: slot, failedBound: cover.failedBound, unresolvedPasses, deferredSuggestions };
        if (slot === 'blind-pair') {
            const how = pairFailure;
            const reason = how === 'blindness-broken'
                ? `blind pair broken: a walk of one member's findings stands between them`
                : how === 'tie'
                    ? `blind pair ambiguous: two candidate members share a timestamp token`
                    : how === 'none-standing'
                        ? `blind pair open: no independent pass stands on this state — both members must run before EITHER is walked`
                        : how === 'no-fresh'
                            ? `blind pair open: the external pass on this state has no fresh partner; run it before walking these findings`
                            : `blind pair open: the fresh pass on this state has no external partner; run it before walking these findings`;
            return { ...failed, reason, pairFailure: how, openPair, openPairFrom };
        }
        if (slot === 'invoked') {
            return { ...failed, reason: invoked.reason, invoked, openPair, openPairFrom };
        }
        return { ...failed, reason: `cadence class '${slot}' has no fresh pass` };
    }
    // (c) is RETIRED (rc02c). The convergence criterion is clauses (a) and (b) ONLY: the gate SHALL
    // NOT compute whether a change has converged. Under R-crc-11 a cadence ends when the AI judges
    // the work ready knowing what the independent reviewers returned — not when reviewers stop
    // finding things. `gate.confirm` is still ACCEPTED by the grammar and is read by nothing.
    return { converged: true, unresolvedPasses, deferredSuggestions };
}
/**
 * Orders gate statuses by the gate graph's flow edges (topological), so position
 * readout + canonical-next follow `requires`/`before` rather than declaration order.
 * A gate comes after any gate it `requires`, and before its `before` gate; ties broken
 * by declaration order. (Cycles are rejected at parse; a defensive fallback preserves
 * declaration order if one is somehow reached.)
 */
function flowOrderGates(gates, statuses) {
    const decl = new Map(gates.map((g, i) => [g.id, i]));
    const ids = gates.map(g => g.id);
    const gateIds = new Set(ids);
    const predecessors = new Map(ids.map(id => [id, new Set()]));
    for (const g of gates) {
        for (const req of g.requires) {
            if (gateIds.has(req))
                predecessors.get(g.id).add(req); // required gate comes first
        }
        if (g.before && gateIds.has(g.before))
            predecessors.get(g.before).add(g.id); // g before g.before
    }
    const remaining = new Set(ids);
    const order = [];
    while (remaining.size > 0) {
        const ready = [...remaining]
            .filter(id => [...predecessors.get(id)].every(p => !remaining.has(p)))
            .sort((a, b) => decl.get(a) - decl.get(b));
        if (ready.length === 0) {
            // defensive (unreachable — cycles rejected at parse): keep declaration order
            order.push(...[...remaining].sort((a, b) => decl.get(a) - decl.get(b)));
            break;
        }
        order.push(ready[0]);
        remaining.delete(ready[0]);
    }
    const byId = new Map(statuses.map(s => [s.id, s]));
    return order.map(id => byId.get(id)).filter(Boolean);
}
/**
 * Computes the state of every gate in the schema for a change. Requires the set of
 * completed artifact ids (from file-existence detection) so gate `requires` on
 * artifacts can be evaluated; gate-on-gate requires are resolved recursively.
 */
export function computeGateStates(schema, changeName, changeDir, completedArtifacts, overlay) {
    const gates = normalizeGates(schema);
    const trail = readTrail(changeDir, overlay);
    const byId = new Map(gates.map(g => [g.id, g]));
    // rc17a (design D6): the review preference is read ONCE, here, from the change's project root, so
    // every surface that prints `nextCommand` presents the same command. It shapes only the presentation.
    const reviewedIds = gates.filter(g => g.kind === 'reviewed').map(g => g.id);
    const projectRoot = projectRootOf(changeDir);
    const preferences = projectRoot !== null && reviewedIds.length > 0
        ? resolveReviewPreference(projectRoot, reviewedIds)
        : Object.fromEntries(reviewedIds.map(id => [id, 'blind-pair']));
    const statusById = new Map();
    const computeOne = (gate, stack) => {
        const existing = statusById.get(gate.id);
        if (existing)
            return existing;
        if (stack.has(gate.id)) {
            // Defensive: cycles are rejected at parse; treat as blocked if reached.
            const s = { id: gate.id, kind: gate.kind, state: 'blocked', reason: 'cyclic requires' };
            return s;
        }
        stack.add(gate.id);
        // requires: artifacts must be complete; gates must be passed.
        const unmet = [];
        for (const req of gate.requires) {
            const depGate = byId.get(req);
            if (depGate) {
                const depStatus = computeOne(depGate, stack);
                if (depStatus.state !== 'passed')
                    unmet.push(req);
            }
            else if (!completedArtifacts.has(req)) {
                unmet.push(req);
            }
        }
        let status;
        if (unmet.length > 0) {
            // A blocked reviewed gate still reports the spend already on its trail: blocking is not an
            // exemption from counting. `review-system` is blocked for the whole life of every change
            // until apply passes, so this is the common case, not an edge.
            let blockedSpend = {};
            if (gate.kind === 'reviewed') {
                const sp = computeSpend(gate, trail);
                if (sp.reportable) {
                    blockedSpend = {
                        ...(gate.budget !== undefined ? { budget: gate.budget } : {}),
                        independentSpend: sp.independentSpend,
                    };
                }
                else if (gate.budget !== undefined) {
                    // Mode-underivable: no spend to report, but the declaration still exists.
                    blockedSpend = { budget: gate.budget };
                }
            }
            status = {
                id: gate.id,
                kind: gate.kind,
                state: 'blocked',
                reason: `blocked by incomplete requires: ${unmet.join(', ')}`,
                ...blockedSpend,
                before: gate.before,
                consent: gate.consent,
            };
        }
        else if (gate.kind === 'tracked') {
            const { checked, total } = gate.tracks
                ? countCheckboxes(changeDir, gate.tracks)
                : { checked: 0, total: 0 };
            let passed = total === 0 ? false : checked === total;
            let userValidationPending;
            let reason = total === 0 ? undefined : `${checked}/${total} tasks complete`;
            // D5 user-validation subset rule: when EVERY remaining unchecked box (a) is named
            // by the latest apply emit's engine-verified `user_validation_tasks` declaration
            // AND (b) self-describes as a handoff (its line carries the `(User-validation`
            // marker), the gate is passed FOR FLOW PURPOSES — apply's AI-doable work is done;
            // the pending human obligation is surfaced, never hidden. Recomputed from disk
            // each render: a new ordinary unchecked task breaks the subset and the gate
            // honestly drops back to `ready`.
            if (!passed && total > 0 && gate.tracks) {
                const declared = trail.latestApplyUserValidation;
                if (declared && declared.length > 0) {
                    const unchecked = uncheckedTaskLines(changeDir, gate.tracks);
                    const allDeclaredHandoffs = unchecked.length > 0 &&
                        unchecked.every(u => declared.includes(u.id) && u.text.includes('(User-validation'));
                    if (allDeclaredHandoffs) {
                        passed = true;
                        userValidationPending = unchecked.map(u => u.id);
                        reason = `${checked}/${total} tasks complete — awaiting user validation: ${userValidationPending.join(', ')}`;
                    }
                }
            }
            status = {
                id: gate.id,
                kind: gate.kind,
                state: passed ? 'passed' : 'ready',
                reason,
                checked,
                total,
                ...(userValidationPending ? { userValidationPending } : {}),
                before: gate.before,
                consent: gate.consent,
                nextCommand: passed ? nextAfterPass(gate, changeName) : undefined,
            };
        }
        else {
            status = evaluateReviewedGate(gate, changeName, trail, preferences[gate.id] ?? 'blind-pair');
        }
        stack.delete(gate.id);
        statusById.set(gate.id, status);
        return status;
    };
    const results = gates.map(g => computeOne(g, new Set()));
    // C1: mark non-passed reviewed gates superseded (moot) when their `before` names a declared
    // gate (e.g. `apply`) that has passed: such a gate gated a phase that has run and is no longer
    // the frontier. A test on gate ids only (rc18): an artifact or non-gate phase never marks one.
    const passedGateIds = new Set(results.filter(s => s.state === 'passed').map(s => s.id));
    for (const s of results) {
        if (s.kind === 'reviewed' && s.state !== 'passed' && s.before && passedGateIds.has(s.before)) {
            s.superseded = true;
        }
    }
    // rc18 (D1): a passed FRONTIER gate holding an unwalked pass names the walk, by the SAME predicate the
    // change-level selection applies, so the row and the change never name different commands. Every
    // other passed row keeps its phase command; state and reason do not move.
    for (const s of results) {
        if (passedFrontierHoldsUnwalked(s, results))
            s.nextCommand = `/orbit:address-reviews ${changeName}`;
    }
    // Order by flow edges (requires/before), not declaration order, so both the position
    // readout AND canonical-next selection (which iterates this list) follow the graph.
    const ordered = flowOrderGates(gates, results);
    return { gates: ordered, position: buildPositionReadout(schema, ordered, completedArtifacts) };
}
/**
 * rc18 (D1, D2): a `passed` reviewed gate that is the FRONTIER — its `before` names no gate that has
 * passed, the superseded test negated on GATE IDS only (a `before` naming an artifact, a non-gate phase
 * such as `archive`, or nothing never makes a gate non-frontier) — and whose `unwalkedPasses` is
 * non-empty. The ONE predicate both the gate row and the change-level selection read.
 */
export function passedFrontierHoldsUnwalked(gate, gates) {
    if (gate.kind !== 'reviewed' || gate.state !== 'passed')
        return false;
    if ((gate.unwalkedPasses?.length ?? 0) === 0)
        return false;
    if (gate.before && gates.some(o => o.id === gate.before && o.state === 'passed'))
        return false;
    return true;
}
/**
 * The gate's RECORDED SPEND, computed from the trail alone (rc02 walk 9; rc02c reduced this to
 * ONE figure — `budget` is a declaration read from the schema, never computed here). Factored out of
 * `computeReviewedStatus` because a BLOCKED reviewed gate must report its real totals: blocking on
 * `requires` is not an exemption from "counts independent passes across the whole trail", and
 * reviews genuinely do run before the tracked gate completes or under an override.
 */
function computeSpend(gate, trail) {
    const mode = gateMode(gate);
    // rc02c: the RECORD is gated on mode alone. It used to require a declared `budget` too, but the
    // declaration is inert now — a recorded cost that appears only when an inert field happens to be
    // present is incoherent. Mode attribution STAYS: a gate whose mode cannot be derived from its id
    // reports NO SPEND rather than one summed across every mode's passes.
    const reportable = mode !== null;
    const rejected = trail.rejectedExternals.filter(r => (mode ? r.mode === mode : true));
    const relevant = trail.passes.filter(p => (mode ? p.mode === mode : true));
    const indepAll = relevant.filter(p => isIndependent(p.reviewerClass));
    return {
        reportable,
        independentSpend: indepAll.length + rejected.length,
        rejected,
    };
}
/** The project root, derived STRUCTURALLY from the change dir (`<root>/orbit/...`); null when it is not under one. */
function projectRootOf(changeDir) {
    const cd = changeDir.replace(/\\/g, '/');
    const marker = cd.lastIndexOf('/orbit/');
    return marker >= 0 ? changeDir.slice(0, marker) || '/' : null;
}
/**
 * rc17a: evaluates ONE reviewed gate over an in-memory `Trail` — the pure seam the exhaustive oracle
 * calls. Reads no file: the trail and the resolved preference are its whole input. (Gate `requires`
 * are not evaluated here; `computeGateStates` does that before calling it.)
 */
export function evaluateReviewedGate(gate, changeName, trail, preference = 'blind-pair') {
    const mode = gateMode(gate);
    const membership = computePairMembership(trail);
    const relevant = trail.passes.filter(p => (mode ? p.mode === mode : true));
    const fresh = relevant.filter(p => !isPassStale(p, trail.applyTokens));
    // rc02c RECORD. ONE figure: every independent pass on the gate's mode across the whole trail,
    // stale included — spend is spend, a pass invalidated by a later apply was still paid for — plus
    // every REJECTED external return attributed to that mode, which satisfies no slot but cost a run.
    // There is no second, fresh-restricted count: the trigger it fed is retired (Q-crc-19).
    const spend = computeSpend(gate, trail);
    const { rejected, independentSpend } = spend;
    // A reviewed gate whose mode cannot be derived from its id reports NO SPEND at all, rather than
    // one summed across every mode's passes (both halves of the pair found this).
    // rc02c: the DECLARATION and the RECORD are SEPARATE fields and are gated separately.
    // `budget` is emitted whenever it is declared — it is schema text, and nothing about deriving a
    // mode makes a declared expectation stop existing. `independentSpend` is gated on mode alone,
    // because a spend summed across every mode's passes would be attributed to the wrong cadence.
    // Coupling them in one bundle was the mirror of the defect this change removes: a cost that
    // appeared only when an inert field happened to be present. Neither key is ever emitted
    // undefined-valued.
    const spendReportable = spend.reportable;
    const spendFields = {
        ...(gate.budget !== undefined ? { budget: gate.budget } : {}),
        ...(spendReportable ? { independentSpend } : {}),
    };
    // rc17a: the discovery set beside the hold — every relevant pass (stale included) carrying a finding
    // of ANY severity that no walk record references, minus what `unresolvedPasses` already lists.
    const toRow = (p) => ({
        token: p.token,
        file: toRepoRelPath(p.file, trail.changeDir),
        mode: p.mode,
        source: p.source,
    });
    const unwalkedFor = (unresolved) => {
        const held = new Set(unresolved.map(p => p.file));
        return [...relevant]
            .sort((a, b) => (a.token < b.token ? -1 : 1))
            .filter(p => p.critical + p.warning + p.suggestion > 0 && recordsFor(p, trail).length === 0 && !held.has(p.file))
            .map(toRow);
    };
    // Coverage (a) uses fresh passes; resolution (b) uses ALL relevant passes. There is no (c).
    const freshEval = evaluateReviewed(gate, fresh, relevant, trail, membership, preference);
    if (freshEval.converged) {
        const deferred = freshEval.deferredSuggestions ?? 0;
        return {
            id: gate.id,
            kind: gate.kind,
            state: 'passed',
            ...spendFields,
            ...(deferred > 0
                ? {
                    deferredSuggestions: deferred,
                    // rc02c: NOT "converged" — the engine no longer computes convergence, and a public
                    // reason claiming it is the readiness claim this change moves to rc04's record.
                    reason: `passed with ${deferred} SUGGESTION-grade finding${deferred === 1 ? '' : 's'} deferred (reported, never blocking)`,
                }
                : {}),
            before: gate.before,
            consent: gate.consent,
            nextCommand: nextAfterPass(gate, changeName),
            // rc08b: a passed gate lists nothing, from its own return path.
            unresolvedPasses: [],
            // rc17a: a passed gate can still hold an unwalked SUGGESTION-only pass.
            unwalkedPasses: unwalkedFor([]),
        };
    }
    // Distinguish stale (a later apply invalidated otherwise-covering passes) from unpassed.
    const allEval = evaluateReviewed(gate, relevant, relevant, trail, membership, preference);
    const stale = allEval.converged && !freshEval.converged;
    const unwalked = unwalkedFor(freshEval.unresolvedPasses);
    const next = canonicalNextForReviewed(mode, changeName, freshEval, trail, fresh, unwalked);
    let reason = stale ? `a review pass is stale (an apply landed after it)` : freshEval.reason;
    // A rejected return is named UNCONDITIONALLY — there is no ceiling for the naming to be below,
    // and naming it names the rule that fired, not the spend. Otherwise the
    // user would be told to buy another external run with no hint that one already came
    // back unreadable.
    const rejectedFresh = rejected.filter(r => !trail.applyTokens.some(t => t > r.token));
    if (spendReportable && rejectedFresh.length > 0) {
        reason = `${reason ?? 'unconverged'} (${rejectedFresh.length} external return${rejectedFresh.length === 1 ? '' : 's'} rejected as malformed — ${rejectedFresh.map(r => path.basename(r.file)).join(', ')})`;
    }
    return {
        id: gate.id,
        kind: gate.kind,
        state: stale ? 'stale' : 'unpassed',
        reason,
        ...spendFields,
        ...((freshEval.deferredSuggestions ?? 0) > 0
            ? { deferredSuggestions: freshEval.deferredSuggestions }
            : {}),
        nextCommand: next.cmd,
        nextSlot: next.slot,
        before: gate.before,
        consent: gate.consent,
        unresolvedPasses: freshEval.unresolvedPasses.map(toRow),
        unwalkedPasses: unwalked,
        ...(freshEval.openPair ? { openPair: freshEval.openPair } : {}),
    };
}
/** Single-voiced canonical next command (+ covered slot) for an unpassed/stale reviewed gate. */
function canonicalNextForReviewed(mode, change, ev, trail, freshPasses, unwalked) {
    const m = mode ?? 'proposal';
    const forClass = (cls) => cls === 'external'
        ? `/orbit:review --as ${m} --reviewer external ${change}`
        : cls === 'blind-pair'
            ? `/orbit:review --as ${m} --reviewer blind-pair ${change}`
            : `/orbit:review --as ${m} --fresh ${change}`;
    // An OPEN PAIR outranks the walk recommendation: on a `blind-pair` slot walking now writes a record
    // between the two members and forecloses the pair; on an `invoked` slot it ENDS the launched pair.
    if (ev.openPair) {
        // `nextSlot` names the presented class on an `invoked` slot, so a `models:` hint keyed by class
        // garnishes the command it describes (rc17a D7); a `blind-pair` slot keeps its own name.
        return { cmd: forClass(ev.openPair.missing), slot: ev.openPairFrom === 'invoked' ? ev.openPair.missing : 'blind-pair' };
    }
    // rc08b: the change-scoped walk, naming NO file — it discovers every listed pass and applies the
    // openPair warning, where a `--from-file` aim would walk one half and skip both. rc18 (D5): an
    // UNWALKED SUGGESTION-only pass joins this step, so it is walked before the review that checks it.
    if (ev.unresolvedPass || unwalked.length > 0) {
        return { cmd: `/orbit:address-reviews ${change}` };
    }
    if (ev.neededSlot === 'invoked' && ev.invoked) {
        return { cmd: forClass(ev.invoked.cls), slot: ev.invoked.cls };
    }
    if (ev.neededSlot === 'blind-pair') {
        // Name the class missing from the earliest pair STILL FORMABLE, over the SAME eligible pairable set
        // the diagnosis read (rc17a, D-bpc-6): tokens above the canonical bound, never the whole list.
        const pairable = pairableEligible(freshPasses, ev.failedBound ?? null, trail);
        const hasFresh = pairable.some(p => p.reviewerClass === 'fresh');
        const hasExternal = pairable.some(p => p.reviewerClass === 'external');
        if (hasFresh && !hasExternal) {
            return { cmd: forClass('external'), slot: 'blind-pair' };
        }
        return { cmd: forClass('fresh'), slot: 'blind-pair' };
    }
    if (ev.neededSlot) {
        return { cmd: commandForClass(ev.neededSlot, m, change), slot: ev.neededSlot };
    }
    // stale — re-validate against current state via a fresh independent pass.
    return { cmd: commandForClass('independent', m, change), slot: 'independent' };
}
function toRepoRelPath(absFile, changeDir) {
    // The project root is derived STRUCTURALLY from the change dir rather than by searching the
    // absolute path for a magic `/orbit/` segment: any ancestor directory named `orbit` made the
    // first match the wrong one and produced a path to a file that does not exist. The change dir is
    // always `<root>/orbit/...`, so the LAST such segment in IT locates the root.
    const norm = absFile.replace(/\\/g, '/');
    const cd = changeDir.replace(/\\/g, '/');
    const marker = cd.lastIndexOf('/orbit/');
    if (marker >= 0) {
        const root = cd.slice(0, marker);
        const rel = path.relative(root, absFile).replace(/\\/g, '/');
        if (rel && !rel.startsWith('..'))
            return rel;
    }
    const idx = norm.indexOf('/orbit/');
    if (idx >= 0)
        return norm.slice(idx + 1);
    return path.basename(norm);
}
/**
 * Builds the one-line position readout of the canonical flow, e.g.
 * `propose ✓ → review(proposal) ✓ → apply ✓ → review(system) STALE → archive blocked-by-gate`.
 */
function buildPositionReadout(schema, gateStatuses, completedArtifacts) {
    const statusById = new Map(gateStatuses.map(s => [s.id, s]));
    const tokens = [];
    // Artifacts (propose stage): collapse to a single `propose` token.
    const allArtifactsDone = schema.artifacts.every(a => completedArtifacts.has(a.id));
    tokens.push(`propose ${allArtifactsDone ? '✓' : '…'}`);
    const renderGate = (s) => {
        const label = s.id === 'apply' ? 'apply' : s.id.startsWith('review-') ? `review(${s.id.slice('review-'.length)})` : s.id;
        // A superseded reviewed gate (its `before` phase already ran) is no longer the
        // frontier — render "(past)" rather than a scary "unpassed"/"STALE".
        if (s.superseded)
            return `${label} (past)`;
        switch (s.state) {
            case 'passed':
                return s.userValidationPending?.length
                    ? `${label} ✓ (awaiting user validation: ${s.userValidationPending.join(', ')})`
                    : `${label} ✓`;
            case 'stale':
                return `${label} STALE`;
            case 'blocked':
                return `${label} blocked-by-gate`;
            case 'ready':
                return `${label} ready`;
            default:
                return `${label} unpassed`;
        }
    };
    // Order gates by requires/before edges; fall back to declaration order.
    for (const s of gateStatuses) {
        tokens.push(renderGate(s));
        // Render a lifecycle phase token after the gate that gates it.
        if (s.before === 'archive')
            tokens.push(`archive ${s.state === 'passed' ? 'ready' : 'blocked-by-gate'}`);
    }
    return tokens.join(' → ');
}
//# sourceMappingURL=gates.js.map