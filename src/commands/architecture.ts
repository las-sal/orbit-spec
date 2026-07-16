/**
 * `orbit architecture status|show|validate` — the architecture-tier CLI (D-arc D2).
 *
 * status:   computed program position across all docs, bucketed parseable/legacy/
 *           malformed; per-stage observed state (with the completion composition) +
 *           citing artifacts. Eligibility-framed: renders state, never commands.
 * show:     one stage's section (heading-to-heading slice) or the doc's stage index —
 *           a session loads ONE stage section, never the whole doc.
 * validate: doc structure only (heading form, slot syntax, id uniqueness, Depends-on
 *           resolution). Legacy passes with a note; malformed fails naming lines.
 */

import chalk from 'chalk';
import {
  listArchitectureDocs,
  loadArchitectureDoc,
  sliceStageSection,
  type ParsedArchitectureDoc,
} from '../core/architecture/parser.js';
import { computeStageStates, type StageState } from '../core/architecture/state.js';
import { validateArchitectureDoc } from '../core/architecture/validate.js';

interface StatusDocPayload {
  doc: string;
  stages: StageState[];
  violations?: Array<{ line: number; reason: string; text: string }>;
}

function renderStageLine(s: StageState): string {
  const mark =
    s.rendered === 'complete'
      ? chalk.green(`complete (ratified ${s.ratifiedDate} by ${s.ratifiedWho})`)
      : s.rendered === 'inconsistent'
        ? chalk.red(`INCONSISTENT — ${s.inconsistency}`)
        : s.rendered === 'quiescent-awaiting-ratification'
          ? chalk.yellow('quiescent — completion awaiting your ratification')
          : s.rendered;
  const citing =
    s.citing.length > 0 ? chalk.gray(` [${s.citing.map((c) => `${c.kind}:${c.name}`).join(', ')}]`) : '';
  return `  ${s.id} — ${mark}${citing}`;
}

export class ArchitectureCommand {
  status(options: { json?: boolean } = {}): number {
    const projectRoot = '.';
    const docs = listArchitectureDocs(projectRoot);
    const parseable: StatusDocPayload[] = [];
    const legacy: string[] = [];
    const malformed: StatusDocPayload[] = [];

    for (const doc of docs) {
      if (doc.docClass === 'legacy') {
        legacy.push(doc.name);
        continue;
      }
      const payload: StatusDocPayload = { doc: doc.name, stages: computeStageStates(projectRoot, doc) };
      if (doc.docClass === 'malformed') {
        payload.violations = doc.violations.map((v) => ({ line: v.line + 1, reason: v.reason, text: v.text }));
        malformed.push(payload);
      } else {
        parseable.push(payload);
      }
    }

    if (options.json) {
      console.log(JSON.stringify({ parseable, legacy, malformed }, null, 2));
      return 0;
    }

    if (docs.length === 0) {
      console.log('no architecture docs (orbit/architecture/ has none)');
      return 0;
    }
    for (const p of parseable) {
      console.log(chalk.bold(p.doc));
      for (const s of p.stages) console.log(renderStageLine(s));
    }
    for (const name of legacy) {
      console.log(`${chalk.bold(name)} — legacy/opaque (no parseable stages)`);
    }
    for (const p of malformed) {
      console.log(`${chalk.bold(p.doc)} — ${chalk.red('MALFORMED')} (fix via: orbit architecture validate ${p.doc})`);
      for (const v of p.violations ?? []) console.log(chalk.red(`  line ${v.line}: ${v.reason}`));
      for (const s of p.stages) console.log(renderStageLine(s));
    }
    return 0;
  }

  show(docName: string, stageId: string | undefined, options: { json?: boolean } = {}): number {
    const projectRoot = '.';
    const doc = loadArchitectureDoc(projectRoot, docName);
    if (!doc) throw new Error(`No architecture doc named '${docName}' under orbit/architecture/.`);

    if (doc.docClass === 'malformed') {
      const details = doc.violations.map((v) => `line ${v.line + 1}: ${v.reason}`).join('; ');
      throw new Error(
        `Doc '${docName}' is MALFORMED (${details}). Malformed docs are fixed, not browsed — run: orbit architecture validate ${docName}`
      );
    }

    if (stageId === undefined) {
      const index = doc.stages.map((s) => ({ id: s.id, title: s.title }));
      if (options.json) {
        console.log(JSON.stringify({ doc: docName, docClass: doc.docClass, stages: index }, null, 2));
        return 0;
      }
      if (doc.docClass === 'legacy') {
        console.log(`${docName} — legacy/opaque doc; no parseable stages to index`);
        return 0;
      }
      console.log(chalk.bold(`${docName} — stage index`));
      for (const s of index) console.log(`  ${s.id} — ${s.title}`);
      return 0;
    }

    const section = sliceStageSection(doc, stageId);
    if (section === null) {
      const declared = doc.stages.length > 0 ? doc.stages.map((s) => s.id).join(', ') : 'none (legacy/opaque doc)';
      throw new Error(`Doc '${docName}' declares no stage '${stageId}'. Declared stages: ${declared}.`);
    }
    if (options.json) {
      console.log(JSON.stringify({ doc: docName, stage: stageId, section }, null, 2));
      return 0;
    }
    console.log(section);
    return 0;
  }

  validate(docName: string, options: { json?: boolean } = {}): number {
    const projectRoot = '.';
    const doc = loadArchitectureDoc(projectRoot, docName);
    if (!doc) throw new Error(`No architecture doc named '${docName}' under orbit/architecture/.`);

    const result = validateArchitectureDoc(doc);
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            doc: docName,
            valid: result.valid,
            docClass: result.docClass,
            issues: result.issues.map((i) => ({ line: i.line !== undefined ? i.line + 1 : undefined, message: i.message })),
            note: result.note,
          },
          null,
          2
        )
      );
      return result.valid ? 0 : 1;
    }

    if (result.valid) {
      console.log(`Doc '${docName}' is valid${result.note ? ` — ${result.note}` : ''}`);
      return 0;
    }
    console.log(chalk.red(`Doc '${docName}' is INVALID:`));
    for (const issue of result.issues) {
      const where = issue.line !== undefined ? `line ${issue.line + 1}: ` : '';
      console.log(chalk.red(`  ${where}${issue.message}`));
    }
    return 1;
  }
}

export type { ParsedArchitectureDoc };
