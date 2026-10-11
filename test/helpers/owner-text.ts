import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(__dirname, '..', '..');

/**
 * The single-active-owner lookup (rc13a's generated-surface mirror test; shared since rc13b).
 *
 * The owner of a spec block is the spec. While a change is OPEN, its delta is the owner-to-be and
 * a mirror tracks it (a delta-plus-baseline pair is the normal mid-change state); once synced, the
 * baseline owns it. Two ACTIVE deltas holding one block would be two owners; no holder at all
 * would leave a mirror orphaned — both are reported as errors naming the anchor.
 */
export async function ownerText(capability: string, anchor: string): Promise<string> {
  const readIf = async (file: string): Promise<string | null> => {
    try {
      const t = await fs.readFile(file, 'utf-8');
      return t.includes(anchor) ? t : null;
    } catch {
      return null;
    }
  };
  const deltaHolders: string[] = [];
  for (const d of await fs.readdir(path.join(repo, 'orbit', 'changes'))) {
    const t = await readIf(path.join(repo, 'orbit', 'changes', d, 'specs', capability, 'spec.md'));
    if (t) deltaHolders.push(t);
  }
  if (deltaHolders.length > 1) {
    throw new Error(`at most one ACTIVE delta may own ${anchor} (found ${deltaHolders.length})`);
  }
  if (deltaHolders.length === 1) return deltaHolders[0];
  const baseline = await readIf(path.join(repo, 'orbit', 'specs', capability, 'spec.md'));
  if (baseline === null) throw new Error(`no owner holds ${anchor}`);
  return baseline;
}

/** The text INSIDE a bare ``` fence whose first line is `firstLine` (delimiters excluded). */
export function fencedProduction(text: string, firstLine: string): string {
  const open = '```\n' + firstLine;
  const i = text.indexOf(open);
  if (i < 0) throw new Error(`no fence starting ${JSON.stringify(firstLine)}`);
  const start = i + 4;
  const end = text.indexOf('\n```', start);
  if (end < 0) throw new Error(`unterminated fence starting ${JSON.stringify(firstLine)}`);
  return text.slice(start, end);
}
