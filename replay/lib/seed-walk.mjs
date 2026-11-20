// Builds a seeded walk's payload from the pass it walks: the source fields from the pass's
// filename, the newest apply token, and the counts from the pass's findings and the resolutions.
// Usage: node seed-walk.mjs <change-dir> <pass-prefix> <resolutions.json> <out.json>
import fs from 'node:fs';
import path from 'node:path';

const [changeDir, prefix, resolutionsFile, out] = process.argv.slice(2);
const runs = path.join(changeDir, '.orbit-runs');
const names = fs.readdirSync(runs).sort();
const passName = names.filter((n) => n.startsWith(`${prefix}-`) && n.endsWith('.json')).pop();
if (!passName) throw new Error(`no ${prefix}-*.json pass in ${runs}`);
const token = (name) => /(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)/.exec(name)[1];
const pass = JSON.parse(fs.readFileSync(path.join(runs, passName), 'utf8'));
const applyName = names.filter((n) => /^apply-.*\.json$/.test(n)).pop();
const resolutions = JSON.parse(fs.readFileSync(resolutionsFile, 'utf8'));

const count = (sev) => pass.findings.filter((f) => f.severity === sev).length;
const payload = {
  model: null,
  source: 'auto-discovered',
  source_path: path.join(runs, passName),
  source_command: 'review',
  source_token: token(passName),
  latest_apply_token: applyName ? token(applyName) : null,
  external_reviewer: null,
  walk_mode: 'per_finding',
  input_findings_summary: { critical: count('CRITICAL'), warning: count('WARNING'), suggestion: count('SUGGESTION') },
  pushback_verification: 'Each finding verified against current state; none stale.',
  resolution_summary: { resolved: resolutions.length, stale_suppressed: 0, deferred: 0, escalated: 0 },
  resolutions,
  remaining_markers_in_scope: 0,
  persisted_escalations: [],
  final_assessment: `Seeded walk: ${resolutions.length} finding(s) resolved as repairs.`,
};
fs.writeFileSync(out, JSON.stringify(payload, null, 2));
