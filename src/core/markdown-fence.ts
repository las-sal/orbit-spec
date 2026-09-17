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
 * Inline code spans need LOOKAHEAD, not a streaming toggle: an opening backtick run with no
 * matching run of EQUAL length anywhere after it is literal text, so anything following it
 * stays live. Spans may cross line endings; fenced lines are barriers that no span crosses.
 */
export function computeCodeRegionMask(content: string): boolean[] {
  const mask: boolean[] = new Array(content.length).fill(false);

  // Pass 1 — fenced lines, using the shared line-based grammar.
  interface LineSpan {
    start: number; // first char of the line
    end: number; // one past the last char, excluding a trailing \r
    nl: number; // offset of the line's \n, or -1 at EOF
    fenced: boolean;
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
    lineSpans.push({ start: offset, end, nl, fenced });
    if (nl === -1) break;
    offset = nl + 1;
  }

  // Pass 2 — inline code spans, scanned over maximal runs of NON-fenced lines so that a
  // span may cross a line ending but never a fence boundary.
  let i = 0;
  while (i < lineSpans.length) {
    if (lineSpans[i].fenced) {
      i++;
      continue;
    }
    let j = i;
    while (j < lineSpans.length && !lineSpans[j].fenced) j++;
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

    let p = 0;
    while (p < s.length) {
      if (s[p] !== '`') {
        p++;
        continue;
      }
      let openEnd = p;
      while (openEnd < s.length && s[openEnd] === '`') openEnd++;
      const runLength = openEnd - p;

      // Look ahead for a run of EXACTLY the same length; a different length is not a
      // delimiter pair and scanning continues past it.
      let q = openEnd;
      let closeStart = -1;
      while (q < s.length) {
        if (s[q] !== '`') {
          q++;
          continue;
        }
        let closeEnd = q;
        while (closeEnd < s.length && s[closeEnd] === '`') closeEnd++;
        if (closeEnd - q === runLength) {
          closeStart = q;
          q = closeEnd;
          break;
        }
        q = closeEnd;
      }

      if (closeStart === -1) {
        // No matching run anywhere after it: literal text, and what follows stays live.
        p = openEnd;
        continue;
      }
      for (let m = p; m < closeStart + runLength; m++) out[idx[m]] = true;
      p = closeStart + runLength;
    }
  }
}
