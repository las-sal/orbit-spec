/**
 * The file-resident inputs `orbit pr` reads before it runs anything: the resolved `pr:` regime,
 * a change's (or staging exploration's) citation, and the PR attachment on a trail. None of
 * these touch git, so an `off` decision made from them runs no `git` or `gh` invocation.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readProjectConfig, resolvePrMode, type PrMode } from '../project-config.js';

/** The regime, through the same reader `orbit status --json` surfaces as `pr`. */
export function readRegime(projectRoot: string): PrMode {
  return resolvePrMode(readProjectConfig(projectRoot));
}

/** The `architecture.doc` citation in `<dir>/.openspec.yaml`, or null when absent or unreadable. */
export function readCitation(dir: string): string | null {
  const p = path.join(dir, '.openspec.yaml');
  let raw: unknown;
  try {
    raw = parseYaml(fs.readFileSync(p, 'utf-8'));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const arch = (raw as Record<string, unknown>).architecture;
  if (!arch || typeof arch !== 'object') return null;
  const doc = (arch as Record<string, unknown>).doc;
  return typeof doc === 'string' && doc.length > 0 ? doc : null;
}

/** The PR target a regime and a citation select: granularity, and the doc on the program path. */
export interface Target {
  granularity: 'per-proposal' | 'per-architecture';
  doc?: string;
}

/**
 * The targeting predicate (`orbit-pr-lifecycle`'s `Config selects the regime; citation selects
 * the target`): a program target of the cited doc when the regime is `per-architecture` and a
 * citation is present, else a per-change target. ONE function for `select`, `publish` and
 * `preflight`, so the target selected, the target published and the divergence note agree.
 */
export function selectTarget(regime: PrMode, citation: string | null): Target {
  return regime === 'per-architecture' && citation !== null
    ? { granularity: 'per-architecture', doc: citation }
    : { granularity: 'per-proposal' };
}

export interface Attachment {
  branch: string;
  granularity: 'per-proposal' | 'per-architecture';
  url?: string;
  state?: 'draft' | 'ready';
  doc?: string;
}

export interface AttachmentRecord {
  attachment: Attachment;
  /** The emit file the attachment was read from, relative to the project root. */
  emit: string;
  /** The emit's `<TS>` token, for ordering across trails. */
  token: string;
}

const ATTACHING_EMIT = /^(propose|ff)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/;

/** Every attachment-bearing propose or ff emit on one trail, oldest first. */
export function attachmentsOnTrail(projectRoot: string, trailDir: string): AttachmentRecord[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(trailDir);
  } catch {
    return [];
  }
  const out: AttachmentRecord[] = [];
  for (const name of entries) {
    const m = name.match(ATTACHING_EMIT);
    if (!m) continue;
    const file = path.join(trailDir, name);
    let emit: unknown;
    try {
      emit = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      continue;
    }
    const a = (emit as Record<string, unknown>)?.pr_attachment;
    if (!a || typeof a !== 'object' || Array.isArray(a)) continue;
    const att = a as Record<string, unknown>;
    if (typeof att.branch !== 'string') continue;
    if (att.granularity !== 'per-proposal' && att.granularity !== 'per-architecture') continue;
    out.push({
      attachment: {
        branch: att.branch,
        granularity: att.granularity,
        ...(typeof att.url === 'string' ? { url: att.url } : {}),
        ...(att.state === 'draft' || att.state === 'ready' ? { state: att.state } : {}),
        ...(typeof att.doc === 'string' ? { doc: att.doc } : {}),
      },
      emit: path.relative(projectRoot, file),
      token: m[2],
    });
  }
  return out.sort((x, y) => (x.token < y.token ? -1 : x.token > y.token ? 1 : x.emit.localeCompare(y.emit)));
}

/** The LATEST attachment-bearing propose or ff emit on a change's trail (both equally authoritative). */
export function latestAttachment(projectRoot: string, changeDir: string): AttachmentRecord | null {
  const all = attachmentsOnTrail(projectRoot, path.join(changeDir, '.orbit-runs'));
  return all.length > 0 ? all[all.length - 1] : null;
}

/** Every change directory, active and archived, whose trail may carry an attachment. */
export function allChangeDirs(projectRoot: string): string[] {
  const changes = path.join(projectRoot, 'orbit', 'changes');
  const dirs: string[] = [];
  const list = (root: string): string[] => {
    try {
      return fs
        .readdirSync(root, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(root, e.name));
    } catch {
      return [];
    }
  };
  for (const d of list(changes)) {
    if (path.basename(d) === 'archive') dirs.push(...list(d));
    else dirs.push(d);
  }
  return dirs;
}
