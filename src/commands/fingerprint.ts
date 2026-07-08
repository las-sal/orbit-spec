/**
 * `orbit fingerprint <change-name>` — stamp or check base fingerprints (C2).
 *
 * Stamp (default): capture the current baseline hash of every MODIFIED/REMOVED/RENAMED
 * requirement into the change's .openspec.yaml `base_fingerprints`. Add-missing-only;
 * `--refresh` overwrites (the deliberate re-stamp after reconciling).
 *
 * Check (`--check`): recompute live hashes and report per-requirement status. Never
 * writes. Exits non-zero when any requirement reports `diverged` or `missing`.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import {
  stampFingerprints,
  checkFingerprints,
  type FingerprintCheckEntry,
  type StampEntry,
} from '../core/fingerprints.js';

export class FingerprintCommand {
  async execute(
    changeName: string,
    options: { check?: boolean; refresh?: boolean; json?: boolean } = {}
  ): Promise<number> {
    const projectRoot = '.';
    const changeDir = path.join(projectRoot, 'orbit', 'changes', changeName);
    if (!fs.existsSync(changeDir) || !fs.statSync(changeDir).isDirectory()) {
      throw new Error(`Change '${changeName}' not found.`);
    }

    if (options.check) {
      return this.check(projectRoot, changeName, options.json === true);
    }
    return this.stamp(projectRoot, changeName, options.refresh === true, options.json === true);
  }

  private stamp(projectRoot: string, changeName: string, refresh: boolean, json: boolean): number {
    const entries = stampFingerprints(projectRoot, changeName, { refresh });
    if (json) {
      console.log(JSON.stringify({ change: changeName, mode: 'stamp', refresh, entries }, null, 2));
      return 0;
    }
    if (entries.length === 0) {
      console.log(
        `No MODIFIED/REMOVED/RENAMED requirements in ${changeName}'s delta specs — nothing to fingerprint (ADDED requirements have no base).`
      );
      return 0;
    }
    for (const e of entries) {
      console.log(`${this.stampGlyph(e)} ${e.capability} / "${e.requirement}" — ${this.stampLabel(e)}`);
    }
    const kept = entries.filter((e) => e.action === 'kept').length;
    if (kept > 0 && !refresh) {
      console.log(
        chalk.gray(
          `${kept} existing fingerprint(s) kept (add-missing-only by default; use --refresh after reconciling to overwrite).`
        )
      );
    }
    return 0;
  }

  private check(projectRoot: string, changeName: string, json: boolean): number {
    const entries = checkFingerprints(projectRoot, changeName);
    const blocking = entries.filter((e) => e.status === 'diverged' || e.status === 'missing');
    if (json) {
      console.log(
        JSON.stringify(
          {
            change: changeName,
            mode: 'check',
            entries,
            summary: this.summarize(entries),
          },
          null,
          2
        )
      );
      return blocking.length > 0 ? 1 : 0;
    }
    if (entries.length === 0) {
      console.log(
        `No MODIFIED/REMOVED/RENAMED requirements in ${changeName}'s delta specs — nothing to check.`
      );
      return 0;
    }
    for (const e of entries) {
      console.log(`${this.checkGlyph(e.status)} ${e.capability} / "${e.requirement}" — ${e.status}${this.hashSuffix(e)}`);
    }
    const s = this.summarize(entries);
    console.log(
      `Summary: ${s.verified} verified, ${s.diverged} diverged, ${s.unverified} unverified, ${s.missing} missing.`
    );
    if (s.diverged > 0) {
      console.log(
        chalk.yellow(
          `Divergence detected. Reconcile: hand-edit the delta spec(s) to incorporate the live content, THEN re-stamp with: orbit fingerprint ${changeName} --refresh`
        )
      );
    }
    return blocking.length > 0 ? 1 : 0;
  }

  private summarize(entries: FingerprintCheckEntry[]) {
    return {
      verified: entries.filter((e) => e.status === 'verified').length,
      diverged: entries.filter((e) => e.status === 'diverged').length,
      unverified: entries.filter((e) => e.status === 'unverified').length,
      missing: entries.filter((e) => e.status === 'missing').length,
    };
  }

  private hashSuffix(e: FingerprintCheckEntry): string {
    if (e.status !== 'diverged') return '';
    return ` (base ${e.base_hash} → live ${e.live_hash})`;
  }

  private checkGlyph(status: FingerprintCheckEntry['status']): string {
    switch (status) {
      case 'verified':
        return chalk.green('✓');
      case 'diverged':
        return chalk.red('✗');
      case 'unverified':
        return chalk.yellow('?');
      case 'missing':
        return chalk.red('!');
    }
  }

  private stampGlyph(e: StampEntry): string {
    return e.action === 'skipped-missing' ? chalk.yellow('!') : chalk.green('✓');
  }

  private stampLabel(e: StampEntry): string {
    switch (e.action) {
      case 'stamped':
        return `stamped ${e.hash}`;
      case 'refreshed':
        return `refreshed ${e.hash}`;
      case 'kept':
        return `kept existing ${e.hash}`;
      case 'skipped-missing':
        return 'skipped — requirement not found in live baseline (delta validation owns this error)';
    }
  }
}
