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
