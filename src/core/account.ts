import * as fs from 'node:fs';
import * as path from 'node:path';
import { checkDefines, checkDetail, latestInChain, type DecisionFolder } from './decision-records.js';

/**
 * A change's ACCOUNT (stage `program-brief` of `automate-dev-flow`, `orbit-decision-records`' `Each change
 * carries one account, written when apply is complete`) — what the change built, its new seams and where the
 * work left its plan, in plain language — and the write gate's checks on it (`orbit-emit-composition`'s
 * `The write gate checks the account`). The emit surface owns target resolution, the `account/` path, the
 * spine and the no-overwrite publish; this module owns what an account must hold and its one-chain rule.
 * It judges FORM and EXISTENCE only (R-crc-10): whether the account is true, complete or clear is a reader's.
 *
 * The account is NOT a decision record: it records no call and no stop, and it is kept in `.orbit-runs/account/`,
 * outside `decisions/`, so no reader of the decision-record selection (`selectUnreadRecords`) takes it.
 */

export class AccountError extends Error {}

/** The emit command that writes an account. */
export const ACCOUNT_COMMAND = 'account';

/** The trail child the account is kept in, beside `decisions/` and outside it. */
export const ACCOUNT_DIR = 'account';

/** The three plain-language fields, each a non-blank string ("none" is said in words). */
export const ACCOUNT_PLAIN_FIELDS = ['built', 'seams', 'deviations'] as const;

/** The optional fields, as the decision records have them (`replaces` names an account). */
export const ACCOUNT_OPTIONAL_FIELDS = ['defines', 'detail', 'replaces'] as const;

/** The payload table (`orbit-emit-composition`'s `The write gate checks the account`). */
export const ACCOUNT_PAYLOAD_FIELDS: string[] = [...ACCOUNT_PLAIN_FIELDS, ...ACCOUNT_OPTIONAL_FIELDS];

/** An account's filename, `account-<TS>.json`. */
export const ACCOUNT_FILENAME = /^account-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$/;

function refuse(message: string): never {
  throw new AccountError(message);
}

function hasOwn(o: Record<string, unknown>, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(o, k);
}

function describe(v: unknown): string {
  return JSON.stringify(v) ?? String(v);
}

function readJson(p: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * The refusal for an `--change` naming no active change: an account is written while a change is built.
 * `foundAt` is the repo-relative place the name was found (an exploration, an archive), or null.
 */
export function accountScopeRefusal(name: string, foundAt: string | null): string {
  const where = foundAt === null ? `'${name}' was found nowhere` : `'${name}' was found only at ${foundAt}`;
  return `an account is written only for an active change under orbit/changes/ — ${where}.`;
}

/** One `account/` folder read once, in the decision records' folder shape (so the chain helpers apply). */
export function readAccountFolder(dir: string): DecisionFolder {
  let names: string[] = [];
  try {
    names = fs.readdirSync(dir).filter(f => ACCOUNT_FILENAME.test(f)).sort();
  } catch {
    names = [];
  }
  const records = new Map<string, Record<string, unknown> | null>();
  const replacedBy = new Map<string, string>();
  for (const n of names) {
    const r = readJson(path.join(dir, n));
    records.set(n, r);
    if (r !== null && typeof r.replaces === 'string' && !replacedBy.has(r.replaces)) replacedBy.set(r.replaces, n);
  }
  return { dir, records, replacedBy };
}

/**
 * The change's current account: the newest account no other replaces, or null when the folder holds none.
 * With one chain (the gate's rule) that is the chain's latest; two chains (the named limit's concurrent
 * writers) surface by naming the newer head.
 */
export function latestAccount(folder: DecisionFolder): string | null {
  const heads = [...folder.records.keys()].filter(n => !folder.replacedBy.has(n));
  return heads.length > 0 ? heads[heads.length - 1] : null;
}

/** The shape checks, with no file read. */
export function checkAccountShape(record: Record<string, unknown>): void {
  for (const f of ACCOUNT_PLAIN_FIELDS) {
    const v = record[f];
    if (typeof v !== 'string' || v.trim() === '') {
      refuse(`'${f}' must be a non-blank string — a plain field is never empty; when there is none, say so in words (got ${describe(v)}).`);
    }
  }
  checkDefines(record);
  checkDetail(record);
  if (hasOwn(record, 'replaces')) {
    const r = record.replaces;
    if (typeof r !== 'string' || !ACCOUNT_FILENAME.test(r)) {
      refuse(`'replaces' must name an account by its filename, account-<TS>.json (got ${describe(r)}).`);
    }
  }
}

/** The one-account and `replaces` checks, reading the change's `account/` folder. */
export function checkAccountChain(record: Record<string, unknown>, accountDir: string): void {
  const folder = readAccountFolder(accountDir);
  const latest = latestAccount(folder);
  if (!hasOwn(record, 'replaces')) {
    if (latest !== null) {
      refuse(`'replaces' is required — this change already has an account; a change carries one, so replace ${latest}, the latest.`);
    }
    return;
  }
  const name = record.replaces as string;
  const original = folder.records.get(name);
  if (!folder.records.has(name) || original === null || original === undefined || original.command !== ACCOUNT_COMMAND) {
    refuse(`'replaces' '${name}' names no account in ${accountDir}${latest !== null ? ` — replace ${latest}, the latest` : ''}.`);
  }
  const by = folder.replacedBy.get(name);
  if (by !== undefined) {
    refuse(`'replaces' '${name}' is already replaced by ${by} — an account is replaced once; replace ${latestInChain(folder, name)}, the latest.`);
  }
}

/** Every check on an account, in order: shape first, then the folder. */
export function checkAccount(record: Record<string, unknown>, accountDir: string): void {
  checkAccountShape(record);
  checkAccountChain(record, accountDir);
}
