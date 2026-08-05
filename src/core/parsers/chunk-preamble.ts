import * as fs from 'node:fs';

/**
 * Chunk-preamble parser (D-arc Stage D5, orbit-run-summary-emit `Apply per-chunk-end
 * emission`). Parses the optional HTML-comment chunk declaration block at the top of a
 * change's tasks.md — the grammar is ENGINE data, no longer body prose.
 *
 * Grammar:
 *   <!--
 *   Implementation chunks:
 *     Chunk N (groups X[-Y]): <chunk-name>
 *   -->
 *
 * Constraints (all violations are MALFORMED — tolerant on read, strict on write:
 * a single stderr-suitable warning + no-chunking fallback, never a blocker):
 *  - `(groups X[-Y])` is a single group or a CONTIGUOUS range; non-contiguous sets are
 *    unsupported in v1.
 *  - Cross-declaration coverage: chunk numbers ascending, group ranges non-overlapping,
 *    and no gap (a group within the declared span covered by no chunk) — a tolerated gap
 *    would let chunk arithmetic declare apply-complete while uncovered tasks remain.
 */

export interface ChunkDeclaration {
  /** 1-based chunk number as declared. */
  chunk: number;
  /** First group number covered (inclusive). */
  groupStart: number;
  /** Last group number covered (inclusive; === groupStart for single-group chunks). */
  groupEnd: number;
  name: string;
}

export type ChunkPreambleResult =
  | { kind: 'absent' }
  | { kind: 'ok'; declarations: ChunkDeclaration[] }
  | { kind: 'malformed'; warning: string };

const MALFORMED_WARNING = (tasksPath: string): string =>
  `warning: tasks.md preamble at ${tasksPath} could not be parsed as chunk declarations; falling back to no-chunking mode`;

/** Parses the chunk preamble from tasks.md content. `tasksPath` is used only in the warning text. */
export function parseChunkPreamble(content: string, tasksPath: string): ChunkPreambleResult {
  // The preamble is an HTML comment block BEFORE the first `## ` group header.
  const firstGroup = content.search(/^##\s+/m);
  const head = firstGroup === -1 ? content : content.slice(0, firstGroup);

  const commentMatch = head.match(/<!--([\s\S]*?)-->/);
  if (!commentMatch) return { kind: 'absent' };
  const body = commentMatch[1];
  if (!/Implementation chunks:/i.test(body)) return { kind: 'absent' };

  const declarations: ChunkDeclaration[] = [];
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || /^Implementation chunks:$/i.test(trimmed)) continue;
    const m = trimmed.match(/^Chunk\s+(\d+)\s+\(groups\s+(\d+)(?:\s*-\s*(\d+))?\)\s*:\s*(.+\S)\s*$/);
    if (!m) {
      // A non-empty line inside the declared block that isn't a valid declaration
      // (missing parens, typo in `Chunk N`, malformed range, non-contiguous set, …).
      return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
    }
    const chunk = Number(m[1]);
    const groupStart = Number(m[2]);
    const groupEnd = m[3] !== undefined ? Number(m[3]) : groupStart;
    if (groupEnd < groupStart) {
      return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
    }
    declarations.push({ chunk, groupStart, groupEnd, name: m[4].trim() });
  }

  if (declarations.length === 0) {
    return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
  }

  // Cross-declaration coverage rules: ascending chunk numbers, non-overlapping,
  // gap-free coverage of the declared span.
  for (let i = 0; i < declarations.length; i++) {
    const d = declarations[i];
    if (d.chunk !== i + 1) {
      // Out-of-order or non-sequential chunk numbering.
      return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) };
    }
    if (i > 0) {
      const prev = declarations[i - 1];
      if (d.groupStart <= prev.groupEnd) {
        return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) }; // overlap
      }
      if (d.groupStart !== prev.groupEnd + 1) {
        return { kind: 'malformed', warning: MALFORMED_WARNING(tasksPath) }; // gap
      }
    }
  }

  return { kind: 'ok', declarations };
}

/** Convenience: parse from a tasks.md path on disk. Missing file → absent. */
export function parseChunkPreambleFile(tasksPath: string): ChunkPreambleResult {
  let content: string;
  try {
    content = fs.readFileSync(tasksPath, 'utf-8');
  } catch {
    return { kind: 'absent' };
  }
  return parseChunkPreamble(content, tasksPath);
}

/** Returns the declaration covering `group`, or null. */
export function chunkForGroup(
  declarations: ChunkDeclaration[],
  group: number
): ChunkDeclaration | null {
  return declarations.find(d => group >= d.groupStart && group <= d.groupEnd) ?? null;
}
