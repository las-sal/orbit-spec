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
 * fenced code block (delimiter lines included) or inside a CommonMark inline code span.
 * The source lint needs both, because a document describing the `src:` marker syntax carries
 * conforming markers inside backticks and must not be checked by the rule it documents.
 *
 * Three properties the first implementation got wrong, each now enforced and regression-tested:
 *
 *  - **Code spans are INLINE, so they never cross a block boundary.** Groups break at blank
 *    lines as well as at fences. Without this, two unrelated stray backticks in different
 *    paragraphs pair up and silently neutralize every marker between them — and silence is
 *    the one failure this lint cannot survive.
 *  - **A BACKSLASH-ESCAPED backtick is literal** (CommonMark 0.31.2 backslash escapes) and
 *    opens nothing. Without this, a marker between two escaped backticks is masked and its
 *    stale claim goes unreported.
 *  - **Pairing is LINEAR.** Each run's next equal-length partner is pre-indexed in one
 *    backward sweep, rather than re-scanning the remaining group per unmatched run.
 *
 * Lookahead is still required: an opening run with no matching run of EQUAL length anywhere
 * after it is literal text, so anything following it stays live.
 */
export function computeCodeRegionMask(content: string): boolean[] {
  const mask: boolean[] = new Array(content.length).fill(false);

  // Pass 1 — fenced lines, using the shared line-based grammar.
  interface LineSpan {
    start: number; // first char of the line
    end: number; // one past the last char, excluding a trailing \r
    nl: number; // offset of the line's \n, or -1 at EOF
    /** Fenced or BLANK: either ends a code-span group, for different reasons. */
    barrier: boolean;
  }
  const lineSpans: LineSpan[] = [];
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
    const fenced = wasInFence || isDelimiter;
    if (fenced) {
      for (let i = offset; i < rawEnd; i++) mask[i] = true;
    }
    // A blank line ends a paragraph, and an inline code span cannot span one.
    const blank = !fenced && line.trim() === '';
    lineSpans.push({ start: offset, end, nl, barrier: fenced || blank });
    if (nl === -1) break;
    offset = nl + 1;
  }

  // Pass 2 — inline code spans, scanned over maximal runs of NON-barrier lines so a span
  // may cross a line ending but never a fence or a paragraph break.
  let i = 0;
  while (i < lineSpans.length) {
    if (lineSpans[i].barrier) {
      i++;
      continue;
    }
    let j = i;
    while (j < lineSpans.length && !lineSpans[j].barrier) j++;
    maskCodeSpans(content, lineSpans.slice(i, j), mask);
    i = j;
  }

  return mask;

  function maskCodeSpans(
    text: string,
    group: { start: number; end: number; nl: number }[],
    out: boolean[]
  ): void {
    // Flatten the group into one scannable string plus a map back to document offsets.
    let s = '';
    const idx: number[] = [];
    for (let k = 0; k < group.length; k++) {
      const ln = group[k];
      for (let p = ln.start; p < ln.end; p++) {
        s += text[p];
        idx.push(p);
      }
      if (k < group.length - 1 && ln.nl !== -1) {
        s += '\n';
        idx.push(ln.nl);
      }
    }

    // Collect candidate delimiter runs, honouring backslash escapes.
    const runs: { start: number; length: number }[] = [];
    for (let p = 0; p < s.length; ) {
      if (s[p] !== '`') {
        p++;
        continue;
      }
      let end = p;
      while (end < s.length && s[end] === '`') end++;
      // An ODD number of immediately-preceding backslashes escapes the FIRST backtick, which
      // is then literal text; the rest of the run may still delimit.
      let backslashes = 0;
      for (let b = p - 1; b >= 0 && s[b] === '\\'; b--) backslashes++;
      const start = backslashes % 2 === 1 ? p + 1 : p;
      if (end - start > 0) runs.push({ start, length: end - start });
      p = end;
    }

    // Pre-index each run's next EQUAL-LENGTH partner in one backward sweep: pairing is then
    // linear in the number of runs rather than quadratic in document size.
    const nextEqual: number[] = new Array(runs.length).fill(-1);
    const lastSeenByLength = new Map<number, number>();
    for (let r = runs.length - 1; r >= 0; r--) {
      const seen = lastSeenByLength.get(runs[r].length);
      nextEqual[r] = seen === undefined ? -1 : seen;
      lastSeenByLength.set(runs[r].length, r);
    }

    for (let r = 0; r < runs.length; ) {
      const close = nextEqual[r];
      if (close === -1) {
        // No matching run anywhere after it: literal text, and what follows stays live.
        r++;
        continue;
      }
      const from = runs[r].start;
      const to = runs[close].start + runs[close].length;
      for (let m = from; m < to; m++) out[idx[m]] = true;
      // Every run between the two is inside the span.
      r = close + 1;
    }
  }
}
