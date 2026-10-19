/**
 * `orbit pr select|publish|preflight|tail|program` (rc12-engine-owned-choreography,
 * `orbit-pr-lifecycle`'s `The \`orbit pr\` command observes and prints; it never writes`).
 *
 * Each subcommand prints ONE record, as JSON with `--json` and as text otherwise. It exits 0
 * whatever the action — the PR layer degrades and never blocks the lifecycle — and non-zero
 * only on a usage error.
 */
import { prPreflight } from '../core/pr/preflight.js';
import { prProgram } from '../core/pr/program.js';
import { prPublish } from '../core/pr/publish.js';
import { PrUsageError } from '../core/pr/record.js';
import { prSelect } from '../core/pr/select.js';
import { prTail } from '../core/pr/tail.js';
export class PrCommand {
    execute(sub, target, options = {}) {
        const ctx = { projectRoot: process.cwd(), env: process.env };
        let record;
        try {
            record = runSubcommand(ctx, sub, target, options);
        }
        catch (e) {
            if (e instanceof PrUsageError) {
                console.error(`Error: ${e.message}`);
                return 1;
            }
            throw e;
        }
        console.log(options.json ? JSON.stringify(record, null, 2) : renderRecord(record));
        return 0;
    }
}
export function runSubcommand(ctx, sub, target, options = {}) {
    switch (sub) {
        case 'select':
            return prSelect(ctx, target);
        case 'publish':
            return prPublish(ctx, target);
        case 'preflight':
            return prPreflight(ctx, target);
        case 'tail':
            return prTail(ctx, target, { outcome: options.outcome, include: options.include });
        case 'program':
            return prProgram(ctx, target);
    }
}
/** POSIX single-quoting, applied only where a word needs it. */
export function shellQuote(word) {
    if (word.length > 0 && /^[A-Za-z0-9_@%+=:,./-]+$/.test(word))
        return word;
    return `'${word.replace(/'/g, `'\\''`)}'`;
}
export function renderRecord(r) {
    const lines = [];
    lines.push(`orbit pr ${r.subcommand}: ${r.action}${r.degraded ? ` (degraded: ${r.degraded})` : ''}`);
    if (r.reason)
        lines.push(`reason: ${r.reason.code}${Object.keys(r.reason.detail).length ? ` ${JSON.stringify(r.reason.detail)}` : ''}`);
    const obs = Object.entries(r.observations);
    if (obs.length) {
        lines.push('observations:');
        for (const [k, v] of obs)
            lines.push(`  ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    }
    r.segments.forEach((seg, i) => {
        lines.push(`segment ${i + 1}${seg.inputs.length ? ` (author first: ${seg.inputs.join(', ')})` : ''}:`);
        for (const s of seg.steps)
            lines.push(`  ${s.argv.map(shellQuote).join(' ')}`);
    });
    if (r.human_acts.length) {
        lines.push('human acts (yours alone; never run by a workflow):');
        for (const a of r.human_acts)
            lines.push(`  ${a.act}: ${a.argv.map(shellQuote).join(' ')}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=pr.js.map