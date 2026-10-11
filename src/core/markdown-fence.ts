/**
 * CommonMark fence tracking — the ONE helper shared by every parser that must agree on what is
 * fenced. Extracted (rc02 walk 9) after a lean reimplementation inside the trail reader drifted
 * to a weaker language: it remembered only the fence CHARACTER, so a three-backtick line closed a
 * four-backtick fence and everything after it read as document structure. An external findings
 * file whose severity headings sat inside such a fence was then admitted as a clean pass, which is
 * false convergence at the gate.
 *
 * A fence OPENS on a run of ``` or ~~~ (length >= 3, indented up to three spaces; a backtick
 * fence's info string may not itself contain a backtick) and CLOSES only on a run of the SAME
 * character with AT LEAST the opening length and nothing but whitespace after (also up to three
 * spaces of indent). A three-backtick line inside a four-backtick fence is body content — the
 * fence stays open.
 *
 * Two parsers implementing one contract is the defect this module exists to prevent: import it,
 * never restate it.
 */
export interface FenceTracker {
  readonly inFence: boolean;
  /** Feeds one line; returns true iff the line is a fence delimiter (opening or closing). */
  handle(line: string): boolean;
}

export function createFenceTracker(): FenceTracker {
  let open: { char: string; len: number } | null = null;
  return {
    get inFence(): boolean {
      return open !== null;
    },
    handle(line: string): boolean {
      const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (!m) return false;
      const char = m[1][0];
      const len = m[1].length;
      if (open === null) {
        if (char === '`' && m[2].includes('`')) return false; // not a valid backtick opener
        open = { char, len };
        return true;
      }
      if (char === open.char && len >= open.len && m[2].trim() === '') {
        open = null;
        return true;
      }
      return false; // inside the fence: a non-closing delimiter-shaped line is body
    },
  };
}

/**
 * Whole-document CODE-REGION mask (rc07) — an ADDITIVE companion to `createFenceTracker`,
 * which is untouched because the trail and report parsers share its line-based API.
 *
 * Returns a per-CHARACTER boolean over `content`: true where the character sits inside a
 * fenced code block, delimiter lines included. The source lint needs character granularity
 * because a `src:` marker is matched by offset, not by line.
 *
 * **This deliberately does NOT track inline code spans, and the history is worth keeping.**
 * An earlier version did, so that prose mentioning the anonymous closer `<!-- /src -->`
 * inside backticks would not become a live orphan closer. Four independent reviewers found
 * four separate defects in that scanner — a blank-line block boundary, backslash escapes
 * applied inside an open span, escapes that CommonMark does not honour there at all, and
 * superlinear pairing — and the last of them established the shape of the problem: a
 * line-grouping heuristic was being asked to do a block parser's job, because inline
 * elements never cross CommonMark block boundaries and blank lines are only one of the
 * things that end a block.
 *
 * The fix was to remove the need rather than the bug. Naming the closer (`<!-- /src:NAME -->`)
 * lets the marker NAME GRAMMAR make prose inert — the same rule that always made
 * `<!-- src:NAME -->` inert — so no inline scanner is required. What remains is fence
 * tracking, which the shared tracker already does correctly.
 */
export function computeCodeRegionMask(content: string): boolean[] {
  const mask: boolean[] = new Array(content.length).fill(false);
  const tracker = createFenceTracker();
  let offset = 0;
  for (;;) {
    const nl = content.indexOf('\n', offset);
    const rawEnd = nl === -1 ? content.length : nl;
    let end = rawEnd;
    if (end > offset && content[end - 1] === '\r') end--;
    const line = content.slice(offset, end);
    const wasInFence = tracker.inFence;
    const isDelimiter = tracker.handle(line);
    if (wasInFence || isDelimiter) {
      for (let i = offset; i < rawEnd; i++) mask[i] = true;
    }
    if (nl === -1) break;
    offset = nl + 1;
  }
  return mask;
}
