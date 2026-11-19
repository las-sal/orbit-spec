import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getSkillTemplates } from '../../../src/core/shared/skill-generation.js';
import { DECISION_RECORDS_REFERENCE, DECISION_WRITING_BASIC, DECISION_WRITING_DISCIPLINE } from '../../../src/core/disciplines.js';

/**
 * tighten-bodies (reduce-orbit-phase1) — the edit ledger (`orbit-conventions`' `An edit ledger holds every tightened
 * body to its recorded text`).
 *
 * Task 1.1 recorded the sha256 of each edited body's `instructions` from the skills generated at ef55ee46, before any
 * template was edited: the twelve tightened bodies, and explore and bulk-archive for the shared decision-writing bullet.
 */
const RECORDED: Record<string, string> = {
  'orbit-explore': 'b3102136e06c78262ee732962339c6e863916f5fe0fc24569bcb74aa9af71e7c',
  'orbit-new-change': 'deed81aa02f0e8bc9387f565dd5be453d8a7d30344fe24cfcd9aaad80253ce0d',
  'orbit-continue-change': 'e150737e7253864c336dc9263de009a84c96dfef4538d70c875341b1d413b49c',
  'orbit-apply-change': 'cd9632e136bc4fecc2e795e05e24a6936bc69240fd0b8e47536960e1ed430caa',
  'orbit-ff-change': '79bbbd7f7bc8685751c574c97bc29a598b4c1de9f17321e266b1c1551a99ecbd',
  'orbit-sync-specs': 'b2d1bf0d0330aed3e8b51e32bdacd88e1681256789b79fa1b1937abc3103f32b',
  'orbit-archive-change': '72772de16426662f79fca69d093f92e8f9f275efcaf3a10b79cb1dd54fada5d6',
  'orbit-bulk-archive-change': 'b76fb452c01b0a4e0936b09d184d147ae058a9d8ae0a03b8cfc2a2b3db8204a4',
  'orbit-verify-change': '32919490db420a5d12391051f8df4a02e45a43a62866624070b9b942c9cdc993',
  'orbit-propose': 'a9890dce6dad3808048b40ac1ebbd9eaef9c154d74da5dd9fbf390aecf82ea2e',
  'orbit-review': 'a6b727aa2946b4fdf4647d8b9b55bf51c2110ecbc4c9fa309e8b823173bcd481',
  'orbit-address-reviews': 'df9ce6392b33736b5e9020d3c6c9080196ca4b485995c155d1661064579891af',
  'orbit-audit-drift': '15170c515daa02d1574623d8ed09858dde5dd1fc01af4b40c425a736ee69420c',
  'orbit-architect': 'e10e1c85e9ec1fff2e7363bed494f3f8072f587aaf1a1ceee3b95f6e315fbe5d',
};

/**
 * The decision-writing bullet's one-paragraph form, as every edited body carried it at ef55ee46: its clauses, joined by
 * the separators they had. The `restructured` pair's `before`, and the list of clauses the labelled form must keep.
 */
const ONE_PARAGRAPH_CLAUSES = [
  '- **Decision-writing (call-time)**: under every setting, keep a record of each call and each stop without changing what the user sees or is asked',
  'BEFORE asking the user a question that a stop condition describes — `security-unprecedented` (a security-relevant call with nothing approved to rely on), `user-facing-uncovered` (an end-user-visible call no ratified goal covers), `ruling-amendment` (amending a ratified ruling or goal), `outward-act` (an outward or irreversible act the settings do not grant), `unresolvable-critical` (a CRITICAL review finding no edit inside the change resolves) — write a stop record (`orbit emit stop`), then ask exactly as you would have',
  "with the user's answer, write a resolution naming that stop (`orbit emit resolution`)",
  'when `ruling-amendment`, `outward-act` or `unresolvable-critical` describes an act you take without asking — the user directed it (they told you to amend a ruling), or no flow asks — write its stop record before the act, then, when the user directed it, a resolution naming that stop whose answer is their direction, and otherwise leave the stop open',
  "AFTER any call that falls in a ledger area — however you reached it: without asking, after a question no condition describes, or with the user's answer to a stop — `user-sees-or-does`, `defaults`, `when-things-go-wrong`, `user-data`, `things-others-build-on`, `docs`, `who-can-get-in`, `secrets`, `network-exposure`, `trusting-input`, `new-dependencies`, `permissions-and-sandboxing`, `encryption`, `personal-data-and-privacy`, `cost`, `licensing`, `accessibility`, `performance-user-feels` — write a ledger entry (`orbit emit ledger`) citing what it relies on",
  'when `security-unprecedented` or `user-facing-uncovered` describes the call, by its own gloss above, the entry cites nothing and names that stop: the one you asked at, or, where you would not have asked, one you write first — ask nothing and leave that stop open',
  "A designed prompt — a consent prompt, an inflection prompt (at a gate, or at a base-fingerprint divergence), a walk's closure prompt — is a seam, not a stop, and writes nothing, unless a stop condition also describes it: then write the stop record first and fire the prompt as designed",
  'A question no condition describes writes nothing, nor does a call in no area',
  'A record names the work it belongs to (`--change <name>` for a change or a named exploration, or `--doc <doc>` in an architect session)',
  'in a session with neither (a project-wide run, an unnamed exploration), or on an archived change (orbit writes no record to its trail), write no record, never attaching it to other work',
  'What each record carries — its fields, its citations and the plain-language rule, with an example of each — is in `references/decision-records.md`, beside this skill',
  'a refused record names the field to fix',
];
/** The separators after each clause but the last, in order. */
const ONE_PARAGRAPH_SEPARATORS = ['. ', '; ', '; ', '; ', '; ', '. ', '. ', '. ', '; ', '. ', '; '];
const ONE_PARAGRAPH =
  ONE_PARAGRAPH_CLAUSES.map((c, i) => c + (ONE_PARAGRAPH_SEPARATORS[i] ?? '.')).join('');

/**
 * The one later edit to these bodies, `records-by-setting`'s (R-rop-17): each body's labelled bullet became its basic
 * content (`DECISION_WRITING_BASIC`), and the rule moved to `references/decision-records.md` with its opening clause
 * replaced. The labelled bullet as `tighten-bodies` left it is the rule with that one clause restored.
 */
const REPLACED_CLAUSE = { was: 'under every setting,', now: 'when `orbit decisions status` reports `write: true`,' };
const LABELLED_FORM = DECISION_WRITING_DISCIPLINE.replace(REPLACED_CLAUSE.now, REPLACED_CLAUSE.was);

/** The rule as the reference carries it: the body of its `## When to write a record` section. */
function ruleInReference(ref: string): string {
  const head = '\n## When to write a record\n\n';
  const start = ref.indexOf(head);
  if (start < 0) return '';
  const from = start + head.length;
  const end = ref.indexOf('\n\n## ', from);
  return ref.slice(from, end < 0 ? undefined : end);
}

/** The clauses of the one-paragraph form the labelled form lacks; a clause's first letter may change case. */
function missingClauses(statement: string): string[] {
  return ONE_PARAGRAPH_CLAUSES.filter((c) => {
    const lower = c[0].toLowerCase() + c.slice(1);
    const upper = c[0].toUpperCase() + c.slice(1);
    return !statement.includes(lower) && !statement.includes(upper);
  });
}

// ---------------------------------------------------------------------------
// The COVERED check of `Tightened bodies carry no provenance`: a removed span is covered when, after the mirror-note
// spans it holds are taken out whole, every remaining character is a token match or a connector.
// ---------------------------------------------------------------------------

/** The removed span of a pair: [start, end) in `before`, and whatever the pair adds. */
function removedSpan(before: string, after: string): { start: number; end: number; added: string } {
  let p = 0;
  while (p < before.length && p < after.length && before[p] === after[p]) p++;
  let s = 0;
  while (s < before.length - p && s < after.length - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
  return { start: p, end: before.length - s, added: after.slice(p, after.length - s) };
}

const MARKERS = [
  'checked mirror', 'mirror of', 'parity test', 'installed skill', 'has no specs', 'cannot open', 'never edit it here',
  'the grammar module supplies it',
];

/** [start, end) of each backtick span. */
function codeSpans(text: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let open = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '`') continue;
    if (open < 0) open = i;
    else {
      out.push([open, i + 1]);
      open = -1;
    }
  }
  return out;
}

/**
 * Each mirror-note span: from the clause holding a marker (clauses split at , ; — and brackets outside backtick spans)
 * to the end of its sentence, or of the bracket the marker sits in.
 */
function mirrorNoteSpans(text: string): Array<[number, number]> {
  const code = codeSpans(text);
  const inCode = (i: number): boolean => code.some(([a, b]) => i >= a && i < b);
  const lower = text.toLowerCase();
  const spans: Array<[number, number]> = [];
  for (const m of MARKERS) {
    for (let at = lower.indexOf(m); at >= 0; at = lower.indexOf(m, at + 1)) {
      if (inCode(at)) continue;
      let start = at;
      let depth = 0;
      for (let i = at - 1; i >= 0; i--) {
        const c = text[i];
        if (inCode(i)) continue;
        if (c === ')') depth++;
        if (c === '(') {
          if (depth === 0) {
            start = i;
            break;
          }
          depth--;
          continue;
        }
        if (depth > 0) continue;
        if (c === ',' || c === ';' || c === '—') {
          start = i;
          break;
        }
        if (c === '\n' || ((c === '.' || c === ':') && /\s/.test(text[i + 1] ?? ''))) {
          start = i + 1;
          break;
        }
        start = i;
      }
      // The bracket the marker sits in: an unclosed ( between the sentence start and the marker.
      let sentence = start;
      for (let i = start - 1; i >= 0; i--) {
        if (inCode(i)) continue;
        if (text[i] === '\n' || (text[i] === '.' && /\s/.test(text[i + 1] ?? ''))) break;
        sentence = i;
      }
      let open = 0;
      for (let i = sentence; i < at; i++) {
        if (inCode(i)) continue;
        if (text[i] === '(') open++;
        if (text[i] === ')') open = Math.max(0, open - 1);
      }
      let end = text.length;
      let d = 0;
      for (let i = at; i < text.length; i++) {
        if (inCode(i)) continue;
        const c = text[i];
        if (c === '(') d++;
        if (c === ')') {
          if (d === 0 && open > 0) {
            end = i + 1;
            break;
          }
          d = Math.max(0, d - 1);
          continue;
        }
        if (open > 0) continue;
        if (c === '\n') {
          end = i;
          break;
        }
        if ((c === '.' || c === ':') && d === 0 && (i + 1 >= text.length || /\s/.test(text[i + 1]))) {
          end = i + 1;
          break;
        }
      }
      spans.push([start, end]);
    }
  }
  return spans;
}

/** The token patterns and the connectors, as `Tightened bodies carry no provenance` writes them. */
const TOKENS = [
  /`orbit-[a-z-]+`(?:'s?)?(?: (?:`[^`]+`|"[^"]+"|\*\*[^*]+\*\*)(?: requirement)?)?/y, // spec citation
  /D-arc(?:'s)?(?: Stage D[0-9])?|Stage D[0-9]|\bC[0-9]\b|\brc[0-9]{2}[a-z]?\b/y, // stage tag
  /\bNEW(?= Step )|orbit named edit/y, // NEW marker
  /\bR-[a-z0-9]+-[0-9]+(?:'s)?\b|\bD-[a-z0-9]+-[0-9]+(?:'s)?\b|\bD[0-9]{1,2}\b/y, // ruling or decision id
  /\b(?:per|see|by|since|from|in|at|of|the|its|and)\b/iy, // connector words
  /\*\*|[—–\-,;:()*]|\s+/y, // connector marks and whitespace
];

/** The words of `before`'s [start, end) that no token, connector or mirror-note span covers. */
function uncovered(before: string, start: number, end: number): string[] {
  const notes = mirrorNoteSpans(before).filter(([a, b]) => b > start && a < end);
  const inNote = (i: number): boolean => notes.some(([a, b]) => i >= a && i < b);
  const left: string[] = [];
  let i = start;
  while (i < end) {
    if (inNote(i)) {
      i++;
      continue;
    }
    let len = 0;
    for (const re of TOKENS) {
      re.lastIndex = i;
      const m = re.exec(before);
      if (m && m.index === i && m[0].length > 0 && i + m[0].length <= end) {
        len = m[0].length;
        break;
      }
    }
    if (len > 0) {
      i += len;
      continue;
    }
    let j = i;
    while (j < end && !inNote(j) && !/\s/.test(before[j])) j++;
    left.push(before.slice(i, Math.max(j, i + 1)));
    i = Math.max(j, i + 1);
  }
  return left;
}

/** Why a `provenance` pair is not covered, or null. */
function provenanceFailure(before: string, after: string): string | null {
  const { start, end, added } = removedSpan(before, after);
  if (added !== '') return `the pair adds ${JSON.stringify(added)}`;
  const left = uncovered(before, start, end);
  return left.length ? `uncovered: ${left.join(' ')}` : null;
}

// ---------------------------------------------------------------------------
// The pairs: every edit to the fourteen bodies, in the order applied, written from the generated diff.
// `restated` names the step line(s) that state the removed Guardrails line; the decision-writing bullet's one
// `restructured` pair (ONE_PARAGRAPH → the labelled form) is shared by every body and applied first; `records-by-setting`'s
// swap (the labelled form → DECISION_WRITING_BASIC) was applied after every pair, so `undo` reverses it first.
// ---------------------------------------------------------------------------

type Pair = {
  body: string;
  kind: 'restated' | 'provenance' | 'link';
  before: string;
  after: string;
  step?: string;
  steps?: string[];
};

const PAIRS: Pair[] = [
  // orbit-apply-change
  { body: 'orbit-apply-change', kind: 'restated', before: "**Guardrails**\n- Keep going through tasks until done or blocked\n", after: "**Guardrails**\n", step: "6. **Implement tasks (loop until done or blocked)**" },
  { body: 'orbit-apply-change', kind: 'restated', before: "**Guardrails**\n- Always read context files before starting (from the apply instructions output)\n", after: "**Guardrails**\n", step: "Read every file path listed under `contextFiles` from the apply instructions output." },
  { body: 'orbit-apply-change', kind: 'restated', before: "- If task is ambiguous, pause and ask before implementing (chain: decision)\n- If implementation reveals issues, pause and suggest artifact updates (chain: decision)\n", after: "- If task is ambiguous, pause and ask before implementing (chain: decision)\n", step: "- Implementation reveals a design issue → suggest updating artifacts" },
  { body: 'orbit-apply-change', kind: 'restated', before: "- Keep code changes minimal and scoped to each task\n- Update task checkbox immediately after completing each task\n", after: "- Keep code changes minimal and scoped to each task\n", step: "- Mark task complete in the tasks file: `- [ ]` → `- [x]`" },
  { body: 'orbit-apply-change', kind: 'restated', before: "- Keep code changes minimal and scoped to each task\n- Pause on errors, blockers, or unclear requirements - don't guess (chain: decision)\n", after: "- Keep code changes minimal and scoped to each task\n", step: "- Error or blocker encountered → report and wait for guidance (chain: decision)" },
  { body: 'orbit-apply-change', kind: 'restated', before: "- Keep code changes minimal and scoped to each task\n- Use contextFiles from CLI output, don't assume specific file names\n", after: "- Keep code changes minimal and scoped to each task\n", step: "- Other schemas: follow the contextFiles from CLI output" },
  // orbit-archive-change
  { body: 'orbit-archive-change', kind: 'restated', before: "All artifacts complete. All tasks complete.\n```\n\n**Guardrails**\n- Always prompt for change selection if not provided\n- Use artifact graph (orbit status --change <name> --json) for completion checking\n- Don't block archive on warnings - just inform and confirm\n- Preserve .openspec.yaml when moving to archive (it moves with the directory)\n- Show clear summary of what happened\n- If sync is requested, use orbit-sync-specs approach (agent-driven)\n- If delta specs exist, always run the sync assessment and show the combined summary before prompting\n\n---", after: "All artifacts complete. All tasks complete.\n```\n\n---", steps: ["1. **If no change name provided, prompt for selection**","Run `orbit status --change \"<name>\" --json` to check artifact completion.","Use **AskUserQuestion tool** to confirm user wants to proceed","5. **Perform the archive**","6. **Display summary**","Use Skill tool to invoke orbit-sync-specs","- Show a combined summary before prompting"] },
  // orbit-continue-change
  { body: 'orbit-continue-change', kind: 'restated', before: "**Guardrails**\n- Create ONE artifact per invocation\n", after: "**Guardrails**\n", step: "- STOP after creating ONE artifact" },
  { body: 'orbit-continue-change', kind: 'restated', before: "**Guardrails**\n- Always read dependency artifacts before creating a new one\n", after: "**Guardrails**\n", step: "- Read any completed dependency files for context" },
  { body: 'orbit-continue-change', kind: 'restated', before: "**Guardrails**\n- Never skip artifacts or create out of order\n", after: "**Guardrails**\n", step: "- Pick the FIRST artifact with `status: \"ready\"` from the status output" },
  { body: 'orbit-continue-change', kind: 'restated', before: "- Verify the artifact file exists after writing before marking progress\n- Use the schema's artifact sequence, don't assume specific artifact names\n", after: "- Verify the artifact file exists after writing before marking progress\n", step: "The artifact types and their purpose depend on the schema." },
  // orbit-ff-change
  { body: 'orbit-ff-change', kind: 'restated', before: "**Guardrails**\n- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)\n", after: "**Guardrails**\n", step: "b. **Continue until all `applyRequires` artifacts are complete**" },
  { body: 'orbit-ff-change', kind: 'restated', before: "**Guardrails**\n- Always read dependency artifacts before creating a new one\n", after: "**Guardrails**\n", step: "- Read any completed dependency files for context" },
  // orbit-propose
  { body: 'orbit-propose', kind: 'restated', before: "**Guardrails**\n- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)\n", after: "**Guardrails**\n", step: "b. **Continue until all `applyRequires` artifacts are complete**" },
  { body: 'orbit-propose', kind: 'restated', before: "**Guardrails**\n- Always read dependency artifacts before creating a new one\n", after: "**Guardrails**\n", step: "- Read any completed dependency files for context" },
  // orbit-new-change
  { body: 'orbit-new-change', kind: 'restated', before: "- Do NOT create any artifacts yet - just show the instructions\n- Do NOT advance beyond showing the first artifact template\n", after: "- Do NOT create any artifacts yet - just show the instructions\n", step: "6. **STOP and wait for user direction**" },
  { body: 'orbit-new-change', kind: 'restated', before: "- If a change with that name already exists, suggest continuing that change instead\n- Pass --schema if using a non-default workflow\n", after: "- If a change with that name already exists, suggest continuing that change instead\n", step: "Add `--schema <name>` only if the user requested a specific workflow." },
  // orbit-propose
  { body: 'orbit-propose', kind: 'provenance', before: "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)", after: "## Commit step (the closing commit)" },
  // orbit-ff-change
  { body: 'orbit-ff-change', kind: 'provenance', before: "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)", after: "## Commit step (the closing commit)" },
  // orbit-apply-change
  { body: 'orbit-apply-change', kind: 'provenance', before: "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)", after: "## Commit step (the closing commit)" },
  // orbit-review
  { body: 'orbit-review', kind: 'provenance', before: "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)", after: "## Commit step (the closing commit)" },
  // orbit-address-reviews
  { body: 'orbit-address-reviews', kind: 'provenance', before: "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)", after: "## Commit step (the closing commit)" },
  // orbit-archive-change
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Commit step (the closing commit — `orbit-conventions`' `The commit step closes each carrying body`)", after: "## Commit step (the closing commit)" },
  // orbit-propose
  { body: 'orbit-propose', kind: 'provenance', before: "## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)", after: "## Chain end step (the closing step)" },
  // orbit-ff-change
  { body: 'orbit-ff-change', kind: 'provenance', before: "## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)", after: "## Chain end step (the closing step)" },
  // orbit-apply-change
  { body: 'orbit-apply-change', kind: 'provenance', before: "## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)", after: "## Chain end step (the closing step)" },
  // orbit-review
  { body: 'orbit-review', kind: 'provenance', before: "## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)", after: "## Chain end step (the closing step)" },
  // orbit-address-reviews
  { body: 'orbit-address-reviews', kind: 'provenance', before: "## Chain end step (the closing step — `orbit-conventions`' `No-chaining contract`)", after: "## Chain end step (the closing step)" },
  // orbit-apply-change
  { body: 'orbit-apply-change', kind: 'provenance', before: "## Account step (before the run summary — `orbit-decision-records`' `Each change carries one account, written when apply is complete`)", after: "## Account step (before the run summary)" },
  // orbit-address-reviews
  { body: 'orbit-address-reviews', kind: 'provenance', before: "### 7. Replace the account when a fix changed it (`orbit-decision-records`' `Each change carries one account, written when apply is complete`)", after: "### 7. Replace the account when a fix changed it" },
  // orbit-apply-change
  { body: 'orbit-apply-change', kind: 'provenance', before: "not a separate lifecycle node (D5 — a separate verify gate would double-count).", after: "not a separate lifecycle node (a separate verify gate would double-count)." },
  { body: 'orbit-apply-change', kind: 'provenance', before: "0. **Consent at entry (provenance rule — per `orbit-lifecycle-consent`)**", after: "0. **Consent at entry (provenance rule)**" },
  { body: 'orbit-apply-change', kind: 'provenance', before: "`chain` setting allows, per `orbit-lifecycle-consent`): the arrival is not typed", after: "`chain` setting allows): the arrival is not typed" },
  { body: 'orbit-apply-change', kind: 'provenance', before: "from this touch onward (per `orbit-lifecycle-consent`'s consent-era marker).", after: "from this touch onward (consent-era marker)." },
  { body: 'orbit-apply-change', kind: 'provenance', before: "(C1 — the `review-proposal` gate is unpassed/stale at apply entry)", after: "(the `review-proposal` gate is unpassed/stale at apply entry)" },
  { body: 'orbit-apply-change', kind: 'provenance', before: "**Position-readout convention (C1, D-c1-2)**:", after: "**Position-readout convention**:" },
  { body: 'orbit-apply-change', kind: 'provenance', before: "bare `orbit status` is the D3 orientation surface", after: "bare `orbit status` is the orientation surface" },
  // orbit-continue-change
  { body: 'orbit-continue-change', kind: 'provenance', before: "## Base-fingerprint capture (NEW step — fires when the created artifact is `specs`)\n\n(Per `orbit-base-fingerprints`' `Fingerprint capture at every spec-authoring point` requirement)\n\n", after: "## Base-fingerprint capture (NEW step — fires when the created artifact is `specs`)\n\n" },
  // orbit-ff-change
  { body: 'orbit-ff-change', kind: 'provenance', before: "## Base-fingerprint capture (NEW step)\n\n(Per `orbit-base-fingerprints`' `Fingerprint capture at every spec-authoring point` requirement)\n\n", after: "## Base-fingerprint capture (NEW step)\n\n" },
  { body: 'orbit-ff-change', kind: 'provenance', before: "## PR lifecycle (config-gated — D-arc Stage D6)", after: "## PR lifecycle (config-gated)" },
  // orbit-sync-specs
  { body: 'orbit-sync-specs', kind: 'provenance', before: "## Consent inheritance (D1, per `orbit-lifecycle-consent`)", after: "## Consent inheritance" },
  // orbit-verify-change
  { body: 'orbit-verify-change', kind: 'provenance', before: "Report what it returns by this table, a CHECKED MIRROR of `orbit-verify-modifications`' `Verify's Scenario Coverage step reads the scenario map`, held byte-equal to it by a parity test (an installed skill cannot open that spec). The table", after: "Report what it returns by this table. The table" },
  // orbit-architect
  { body: 'orbit-architect', kind: 'provenance', before: "the reason lives in the status log). The `Complete:` productions in that sentence are a CHECKED MIRROR of `orbit-architecture-engine`'s `Parseable architecture-doc format` requirement, which OWNS the slot grammar — this body cannot resolve the owner at runtime, so it carries the copy and says so (held byte-equal by a parity test). Everything else", after: "the reason lives in the status log). Everything else" },
  { body: 'orbit-architect', kind: 'provenance', before: "**R-d-8 residency sweep at every conversation boundary**:", after: "**residency sweep at every conversation boundary**:" },
  { body: 'orbit-architect', kind: 'provenance', before: "### 5.5. Arc-done readout: the program PR's human acts (D-arc Stage D6)", after: "### 5.5. Arc-done readout: the program PR's human acts" },
  { body: 'orbit-architect', kind: 'provenance', before: "### 6. Out of scope (deliberately — D-d2-6 rungs 6–8)", after: "### 6. Out of scope (deliberately — rungs 6–8)" },
  { body: 'orbit-architect', kind: 'provenance', before: "(Per `orbit-run-summary-emit` — `/orbit:architect` is a multi-turn", after: "(`/orbit:architect` is a multi-turn" },
  { body: 'orbit-architect', kind: 'provenance', before: "Composed and written via `orbit emit architect` — `orbit-emit-composition`.)", after: "Composed and written via `orbit emit architect`.)" },
  { body: 'orbit-architect', kind: 'provenance', before: "**No emit without sweep** (D-arc Stage D5, leak-hardening layer 2", after: "**No emit without sweep** (leak-hardening layer 2" },
  { body: 'orbit-architect', kind: 'provenance', before: "the Step 4 R-d-8 residency sweep precedes EVERY boundary emit", after: "the Step 4 residency sweep precedes EVERY boundary emit" },
  // orbit-audit-drift
  { body: 'orbit-audit-drift', kind: 'provenance', before: "**Architecture staleness check (D-arc Stage D2)**", after: "**Architecture staleness check**" },
  { body: 'orbit-audit-drift', kind: 'provenance', before: "**Missing consent-record check (D1 tripwire", after: "**Missing consent-record check (tripwire" },
  { body: 'orbit-audit-drift', kind: 'provenance', before: "check (tripwire, per `orbit-lifecycle-consent`)**", after: "check (tripwire)**" },
  { body: 'orbit-audit-drift', kind: 'provenance', before: "the empirical tripwire behind the D-arc's harness-hooks deferral", after: "the empirical tripwire behind the harness-hooks deferral" },
  { body: 'orbit-audit-drift', kind: 'provenance', before: "harness-hooks deferral (R-d-2): its firing", after: "harness-hooks deferral: its firing" },
  { body: 'orbit-audit-drift', kind: 'provenance', before: "### 7.5 Category 5 — Touchpoints divergence (D-arc Stage D5)", after: "### 7.5 Category 5 — Touchpoints divergence" },
  { body: 'orbit-audit-drift', kind: 'provenance', before: "### 7.6 Category 6 — Explore emit attestation cross-check (D-arc Stage D5)", after: "### 7.6 Category 6 — Explore emit attestation cross-check" },
  // orbit-archive-change
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 5.5 — Archive run summary", after: "## Step 5.5 — Archive run summary" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "— Step 3.2 owns those (orbit named edit, per `orbit-archive-modifications`' `User-validation closure at the archive seam`).", after: "— Step 3.2 owns those." },
  { body: 'orbit-archive-change', kind: 'provenance', before: "- One line per Step 3.2 deferral (orbit, rc10):", after: "- One line per Step 3.2 deferral (orbit):" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "a **consent check at entry** (D1),", after: "a **consent check at entry**," },
  { body: 'orbit-archive-change', kind: 'provenance', before: "a **user-validation closure** (rc10),", after: "a **user-validation closure**," },
  { body: 'orbit-archive-change', kind: 'provenance', before: "a **base-fingerprint divergence check** (C2),", after: "a **base-fingerprint divergence check**," },
  { body: 'orbit-archive-change', kind: 'provenance', before: "When the change is PR-ATTACHED (D6 — resolve this", after: "When the change is PR-ATTACHED (resolve this" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "`chain` setting allows, per `orbit-lifecycle-consent`): the arrival is not typed", after: "`chain` setting allows): the arrival is not typed" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "a named limit of `orbit-archive-modifications`)", after: "a named limit)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "fix any other case in the composed deferrals yourself. This is a CHECKED MIRROR of the production `orbit-archive-modifications`' `User-validation closure at the archive seam` states once — no engine surface runs the write gate before the move, so the step carries the production itself:", after: "fix any other case in the composed deferrals yourself." },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.7 — The sign-off hold (BEFORE the sync)\n\n(Per `orbit-archive-modifications`' `The archive holds for a per-change sign-off` requirement)\n\n", after: "## NEW Step 3.7 — The sign-off hold (BEFORE the sync)\n\n" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "ratification never happens here (D-d2-4).", after: "ratification never happens here." },
  { body: 'orbit-archive-change', kind: 'provenance', before: "This is a deliberate choice (per `orbit-archive-modifications`' `Audit informational, not blocking by default` requirement): users", after: "This is a deliberate choice: users" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 0 — Consent at entry", after: "## Step 0 — Consent at entry" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 0 — Consent at entry (provenance rule, per `orbit-lifecycle-consent`)", after: "## Step 0 — Consent at entry (provenance rule)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 0.7 — PR-attachment entry observation", after: "## Step 0.7 — PR-attachment entry observation" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "(READ-ONLY, every provenance path — D-arc Stage D6)", after: "(READ-ONLY, every provenance path)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 1.5 — Unresolved", after: "## Step 1.5 — Unresolved" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.2 — User-validation closure", after: "## Step 3.2 — User-validation closure" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 3.2 — User-validation closure (rc10)", after: "## Step 3.2 — User-validation closure" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.4 — Gate inflection prompt", after: "## Step 3.4 — Gate inflection prompt" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 3.4 — Gate inflection prompt (C1; every reviewed gate", after: "## Step 3.4 — Gate inflection prompt (every reviewed gate" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "(every reviewed gate since rc10)", after: "(every reviewed gate)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.45 — Base-fingerprint divergence check", after: "## Step 3.45 — Base-fingerprint divergence check" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 3.45 — Base-fingerprint divergence check (C2)", after: "## Step 3.45 — Base-fingerprint divergence check" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.5 — Pre-archive", after: "## Step 3.5 — Pre-archive" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.6 — Save", after: "## Step 3.6 — Save" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 3.7 — The sign-off hold", after: "## Step 3.7 — The sign-off hold" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 4.9 — PR preflight", after: "## Step 4.9 — PR preflight" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "BEFORE the move — D-arc Stage D6; moved before the move by rc12)", after: "BEFORE the move; moved before the move by rc12)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "; moved before the move by rc12)", after: "; moved before the move)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 5.6 — The PR-attached tail (AFTER the emit, BEFORE the completion readout", after: "## Step 5.6 — The PR-attached tail (AFTER the emit, BEFORE the completion readout" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 5.6 — The PR-attached tail (AFTER the emit, BEFORE the completion readout — D-arc Stage D6)", after: "## Step 5.6 — The PR-attached tail (AFTER the emit, BEFORE the completion readout)" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 5.65 — The readiness line in the completion readout", after: "## Step 5.65 — The readiness line in the completion readout" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 5.65 — The readiness line in the completion readout (rc04a)", after: "## Step 5.65 — The readiness line in the completion readout" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 5.7 — Stage-line garnish in the completion readout", after: "## Step 5.7 — Stage-line garnish in the completion readout" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 5.7 — Stage-line garnish in the completion readout (D-arc Stage D2)", after: "## Step 5.7 — Stage-line garnish in the completion readout" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## NEW Step 5.8 — Residual outward-actions echo", after: "## Step 5.8 — Residual outward-actions echo" },
  { body: 'orbit-archive-change', kind: 'provenance', before: "## Step 5.8 — Residual outward-actions echo (per `orbit-conventions`)", after: "## Step 5.8 — Residual outward-actions echo" },
  // orbit-propose
  { body: 'orbit-propose', kind: 'provenance', before: "## Mode detection (NEW Step 0 — runs before upstream Step 1)", after: "## Mode detection (Step 0 — runs before upstream Step 1)" },
  { body: 'orbit-propose', kind: 'provenance', before: "token (per `orbit-conventions`' status-header production — read that line, never `head -1`) is NOT a candidate", after: "token (status-header production — read that line, never `head -1`) is NOT a candidate" },
  { body: 'orbit-propose', kind: 'provenance', before: "token (per `orbit-conventions`' status-header production — read that line, never `head -1`) → **REFUSED**", after: "token (status-header production — read that line, never `head -1`) → **REFUSED**" },
  { body: 'orbit-propose', kind: 'provenance', before: "References.\n\n*Mirror of `orbit-conventions`' `explore.md` format requirement — the owner of this list; a parity test holds this copy byte-equal.*\n\n- **All listed sections present**", after: "References.\n\n- **All listed sections present**" },
  { body: 'orbit-propose', kind: 'provenance', before: "The entry form (a checked mirror of `orbit-conventions`' \"Decision entry identity and classification\" — the owner; the grammar module supplies it):", after: "The entry form:" },
  { body: 'orbit-propose', kind: 'provenance', before: "Mechanism-entry requirement owns — carried here as a checked mirror, because your repository may not hold that spec (the grammar module supplies it; a parity test holds it equal to the owner):", after: "Mechanism-entry requirement owns:" },
  { body: 'orbit-propose', kind: 'provenance', before: "### Step 0c.5 — Author `## Touchpoints` in design.md (BOTH modes — D-arc Stage D5)", after: "### Step 0c.5 — Author `## Touchpoints` in design.md (BOTH modes)" },
  { body: 'orbit-propose', kind: 'provenance', before: "(a duplicate). The table is a checked mirror of the requirement's; a parity test holds it byte-equal:", after: "(a duplicate)." },
  { body: 'orbit-propose', kind: 'provenance', before: "**The CLOSED shapes** (a checked mirror of the requirement's list): a normative TABLE", after: "**The CLOSED shapes**: a normative TABLE" },
  { body: 'orbit-propose', kind: 'provenance', before: "THEN bulk-move (D-arc Stage D2):", after: "THEN bulk-move:" },
  { body: 'orbit-propose', kind: 'provenance', before: "## Base-fingerprint capture (NEW step — both modes)\n\n(Per `orbit-base-fingerprints`' `Fingerprint capture at every spec-authoring point` requirement)\n\n", after: "## Base-fingerprint capture (NEW step — both modes)\n\n" },
  { body: 'orbit-propose', kind: 'provenance', before: "## PR lifecycle (config-gated — D-arc Stage D6)", after: "## PR lifecycle (config-gated)" },
  { body: 'orbit-propose', kind: 'provenance', before: "**Position (NEW Step 0.5).**", after: "**Position (Step 0.5).**" },
  // orbit-review
  { body: 'orbit-review', kind: 'provenance', before: "(6 passes, NO gate — D-arc Stage D2)", after: "(6 passes, NO gate)" },
  { body: 'orbit-review', kind: 'provenance', before: "carries the REVIEWER axis (D-arc Stage D5): ", after: "carries the REVIEWER axis: " },
  { body: 'orbit-review', kind: 'provenance', before: "The table below is a CHECKED MIRROR of `orbit-conventions`' `Review mode decision framework` — the owner of how a pass's genre is determined and of what a REVIEW-genre brief may carry. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here. The pass genre is a record", after: "The pass genre is a record" },
  { body: 'orbit-review', kind: 'provenance', before: "#### Verdicts\n\nThe definition below is a CHECKED MIRROR of `orbit-emit-composition`'s **A VERIFICATION-genre payload carries its verdicts and its findings link to the walk record** — its owner. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here.\n\n```", after: "#### Verdicts\n\n```" },
  { body: 'orbit-review', kind: 'provenance', before: "The rule below is a CHECKED MIRROR of `orbit-emit-composition`'s **The walk write gate checks sweep evidence** — its owner, which the walk's write gate enforces. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here. Grade over", after: "Grade over" },
  { body: 'orbit-review', kind: 'provenance', before: "computes it from the trail (D-arc Stage D4).", after: "computes it from the trail." },
  { body: 'orbit-review', kind: 'provenance', before: "(review standing without a gate — D-arc D-d2-5)", after: "(review standing without a gate)" },
  // orbit-address-reviews
  { body: 'orbit-address-reviews', kind: 'provenance', before: "**Discovery** decides which sources this invocation walks. The fence below is a CHECKED MIRROR of `orbit-address-reviews`' `Address-reviews command available`, its owner. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here.", after: "**Discovery** decides which sources this invocation walks." },
  { body: 'orbit-address-reviews', kind: 'provenance', before: "The triage OPENS with the **obvious-fix lane preview** (D-arc Stage D4):", after: "The triage OPENS with the **obvious-fix lane preview**:" },
  { body: 'orbit-address-reviews', kind: 'provenance', before: "**Then the remedy** — R-crc-6's three lanes,", after: "**Then the remedy** — three lanes," },
  { body: 'orbit-address-reviews', kind: 'provenance', before: "The lane's protocol (D-arc Stage D4):", after: "The lane's protocol:" },
  { body: 'orbit-address-reviews', kind: 'provenance', before: "AND `orbit/architecture/.orbit-runs/*` (D-arc Stage D2) |", after: "AND `orbit/architecture/.orbit-runs/*` |" },
  { body: 'orbit-address-reviews', kind: 'provenance', before: "resolves by are below — a CHECKED MIRROR of `orbit-emit-composition`'s `The walk write gate checks sweep evidence`, its owner. An installed skill has no specs to point at, so the copy exists here; a parity test holds it byte-equal to the owner's fence. Never edit it here.", after: "resolves by are below." },
  // orbit-review
  { body: 'orbit-review', kind: 'link', before: "(a different AI in a separate session — the handoff branch, `references/external-handoff.md`)", after: "(a different AI in a separate session — the handoff branch, `references/external-handoff.md`, which packages the prompt from `references/prompt-template.md` and `references/mode-sections.md`)" },
];

const sha = (s: string): string => createHash('sha256').update(s).digest('hex');
const skills = getSkillTemplates();

describe('tighten-bodies edit ledger', () => {
  it('records a hash for each of the fourteen edited bodies', () => {
    expect(Object.keys(RECORDED)).toHaveLength(14);
    for (const dir of Object.keys(RECORDED)) {
      expect(skills.find((s) => s.dirName === dir), dir).toBeDefined();
      expect(RECORDED[dir]).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(sha('')).toHaveLength(64);
  });

  it('the one-paragraph form is the recorded text the bodies carried', () => {
    expect(ONE_PARAGRAPH).toHaveLength(2835);
    expect(sha(ONE_PARAGRAPH)).toBe('fe1f88f761c55a4280e8eb9c13f8223739689d5d3fdd81e6606b1f0e8391e29a');
  });

  // @scenario text orbit-conventions :: Decision-writing discipline :: The labelled form keeps every clause
  // @scenario text orbit-conventions :: An edit ledger holds every tightened body to its recorded text :: A clause dropped from the bullet fails
  it('the rule in the reference keeps every clause of the one-paragraph form but the one replaced clause', () => {
    const rule = ruleInReference(DECISION_RECORDS_REFERENCE);
    expect(rule).toBe(DECISION_WRITING_DISCIPLINE);
    expect(rule.split('\n')).toHaveLength(6);
    // The one replaced clause is named: the opening "under every setting", now the condition the basic content reads.
    expect(rule.split(REPLACED_CLAUSE.now).length - 1).toBe(1);
    expect(rule).not.toContain(REPLACED_CLAUSE.was);
    expect(missingClauses(rule)).toEqual([ONE_PARAGRAPH_CLAUSES[0]]);
    expect(missingClauses(rule.replace(REPLACED_CLAUSE.now, REPLACED_CLAUSE.was))).toEqual([]);
    // Mutation: a clause dropped from the rule is named.
    const dropped = rule.replace(' A question no condition describes writes nothing, nor does a call in no area.', '');
    expect(missingClauses(dropped)).toEqual([ONE_PARAGRAPH_CLAUSES[0], 'A question no condition describes writes nothing, nor does a call in no area']);
  });

  const body = (dir: string): string => skills.find((s) => s.dirName === dir)!.template.instructions;

  /**
   * Undo `records-by-setting`'s swap (the basic content back to the labelled bullet), then every pair of `dir` on
   * `text`, last applied first, then the shared restructure; or the first failure.
   */
  function undo(dir: string, text: string, pairs: Pair[] = PAIRS): { text: string } | { failure: string } {
    const swaps = text.split(DECISION_WRITING_BASIC).length - 1;
    if (swaps !== 1) return { failure: `${dir}: the decision-writing basic content occurs ${swaps} times` };
    let t = text.replace(DECISION_WRITING_BASIC, () => LABELLED_FORM);
    for (const p of [...pairs].reverse().filter((x) => x.body === dir)) {
      const n = t.split(p.after).length - 1;
      if (n !== 1) return { failure: `${dir}: a pair's after occurs ${n} times: ${JSON.stringify(p.after.slice(0, 80))}` };
      t = t.replace(p.after, () => p.before);
    }
    const n = t.split(LABELLED_FORM).length - 1;
    if (n !== 1) return { failure: `${dir}: the decision-writing bullet occurs ${n} times` };
    return { text: t.replace(LABELLED_FORM, () => ONE_PARAGRAPH) };
  }

  /** Why the undo of `dir`'s pairs does not reproduce its recorded body, or null. */
  function ledgerFailure(dir: string, text: string, pairs: Pair[] = PAIRS): string | null {
    const r = undo(dir, text, pairs);
    if ('failure' in r) return r.failure;
    return sha(r.text) === RECORDED[dir] ? null : `${dir}: the undone body does not match its recorded hash`;
  }

  /** Why a `restated` pair fails: it removes something other than whole list lines (or archive's heading), or a step line it names is gone. */
  function restatedFailure(p: Pair, text: string): string | null {
    const { start, end, added } = removedSpan(p.before, p.after);
    if (added !== '') return `the pair adds ${JSON.stringify(added)}`;
    const removed = p.before.slice(start, end);
    if (!removed.split('\n').filter(Boolean).every((l) => l.startsWith('- ') || l === '**Guardrails**')) {
      return `the pair removes more than Guardrails lines: ${JSON.stringify(removed.slice(0, 80))}`;
    }
    const steps = p.steps ?? (p.step ? [p.step] : []);
    if (steps.length === 0) return 'the pair names no step line';
    const gone = steps.filter((s) => !text.includes(s));
    return gone.length ? `the body no longer carries the step line ${JSON.stringify(gone[0])}` : null;
  }

  it('every pair is of one kind, and the pairs count 23 restated lines, the link and the provenance spans', () => {
    expect(PAIRS.filter((p) => p.kind === 'restated')).toHaveLength(17); // 16 lines one by one, archive's seven and its heading together
    expect(PAIRS.filter((p) => p.kind === 'link')).toHaveLength(1);
    const lines = PAIRS.filter((p) => p.kind === 'restated').reduce((n, p) => {
      const { start, end } = removedSpan(p.before, p.after);
      return n + p.before.slice(start, end).split('\n').filter((l) => l.startsWith('- ')).length;
    }, 0);
    expect(lines).toBe(23);
    for (const p of PAIRS) expect(Object.keys(RECORDED), p.body).toContain(p.body);
  });

  for (const dir of Object.keys(RECORDED)) {
    // @scenario text orbit-conventions :: An edit ledger holds every tightened body to its recorded text :: An unlisted edit fails the ledger
    it(`${dir}: undoing its pairs and the restructure reproduces its recorded body`, () => {
      expect(ledgerFailure(dir, body(dir))).toBeNull();
    });
  }

  it('mutation: an unlisted edit fails the ledger, naming the body', () => {
    const dir = 'orbit-apply-change';
    const cut = body(dir).replace('Keep changes minimal and focused', 'Keep changes focused');
    expect(cut).not.toBe(body(dir));
    expect(ledgerFailure(dir, cut)).toMatch(/orbit-apply-change: the undone body does not match/);
  });

  it('every provenance pair removes only what the patterns cover', () => {
    const failures = PAIRS.filter((p) => p.kind === 'provenance')
      .map((p) => [p.body, p.before.slice(0, 60), provenanceFailure(p.before, p.after)])
      .filter(([, , f]) => f !== null);
    expect(failures).toEqual([]);
  });

  // @scenario text orbit-conventions :: An edit ledger holds every tightened body to its recorded text :: An instruction filed as provenance fails
  it('mutation: a mirror note taken together with the instruction after it fails, naming the words left', () => {
    const note = PAIRS.find((p) => p.body === 'orbit-review' && p.before.startsWith('The table below is a CHECKED MIRROR'))!;
    expect(provenanceFailure(note.before, note.after)).toBeNull();
    const greedy = provenanceFailure(note.before + ' a header word; the gate reads nothing of it.', '');
    expect(greedy).toMatch(/uncovered: .*pass genre is a record/);
  });

  // @scenario text orbit-conventions :: An edit ledger holds every tightened body to its recorded text :: A sentence that only names an owner is not a note
  it("mutation: removing review's owner-exemption instruction, which carries no marker, fails", () => {
    const line = body('orbit-review').split('\n').find((l) => l.includes("The owner's ONE exemption:"))!;
    const at = line.indexOf("The owner's ONE exemption:");
    expect(provenanceFailure(line, line.slice(0, at))).toMatch(/uncovered: .*exemption/);
  });

  // @scenario text orbit-conventions :: Restated Guardrails lines are removed from orbit-modified bodies :: A line a step states goes
  // @scenario text orbit-conventions :: Restated Guardrails lines are removed from orbit-modified bodies :: Archive's Guardrails heading goes with its lines
  it('every restated pair removes Guardrails lines a step line of its body still states', () => {
    const failures = PAIRS.filter((p) => p.kind === 'restated')
      .map((p) => [p.body, restatedFailure(p, body(p.body))])
      .filter(([, f]) => f !== null);
    expect(failures).toEqual([]);
    const apply = body('orbit-apply-change');
    expect(apply).not.toContain('Pause on errors, blockers, or unclear requirements');
    expect(apply).toContain('Error or blocker encountered → report and wait for guidance (chain: decision)');
    expect(body('orbit-archive-change')).not.toContain('**Guardrails**');
  });

  // @scenario text orbit-conventions :: An edit ledger holds every tightened body to its recorded text :: A restated line needs its step line
  it('mutation: a restated pair naming a step line the body no longer carries fails', () => {
    const p = PAIRS.find((x) => x.kind === 'restated' && x.body === 'orbit-apply-change')!;
    const gone = body('orbit-apply-change').replace(p.step!, '');
    expect(restatedFailure(p, gone)).toMatch(/no longer carries the step line/);
  });

  // @scenario text orbit-conventions :: Restated Guardrails lines are removed from orbit-modified bodies :: A line that adds to the steps stays
  it("apply keeps the Guardrails lines that add to its steps; new-change keeps its prohibition", () => {
    const apply = body('orbit-apply-change');
    expect(apply).toContain('- If task is ambiguous, pause and ask before implementing (chain: decision)');
    expect(apply).toContain('- Keep code changes minimal and scoped to each task');
    expect(body('orbit-new-change')).toContain('- Do NOT create any artifacts yet - just show the instructions');
  });

  // @scenario text orbit-conventions :: Restated Guardrails lines are removed from orbit-modified bodies :: Sync-specs keeps its upstream body
  it("sync-specs' upstream portion, its Guardrails list included, is unchanged", () => {
    const sync = body('orbit-sync-specs');
    const additions = sync.indexOf('\n# Orbit additions\n');
    expect(additions).toBeGreaterThan(0);
    for (const p of PAIRS.filter((x) => x.body === 'orbit-sync-specs')) expect(sync.indexOf(p.after)).toBeGreaterThan(additions);
    expect(sync.slice(0, additions)).toContain('**Guardrails**');
  });

  // @scenario text orbit-conventions :: Tightened bodies carry no provenance :: A stage tag leaves a heading and its number stays
  it("archive's user-validation closure heading keeps its number and loses NEW and its tag", () => {
    const archive = body('orbit-archive-change');
    expect(archive).toContain('\n## Step 3.2 — User-validation closure\n');
    expect(archive).not.toContain('NEW Step');
    expect(archive).not.toContain('(rc10)');
  });

  // @scenario text orbit-conventions :: Tightened bodies carry no provenance :: A citation a requirement asks for stays
  it('review and address-reviews still name the Severity ladder wherever they assign a severity', () => {
    expect(body('orbit-review')).toContain("`orbit-conventions`' Severity ladder");
    expect(body('orbit-address-reviews')).toContain("per `orbit-conventions`' Severity ladder");
  });

  // @scenario text orbit-conventions :: Tightened bodies carry no provenance :: An id that names a thing drops at every use
  it('an id that is part of a name drops at every use, and the name stays', () => {
    for (const [dir, id, name] of [
      ['orbit-architect', 'R-d-8', 'residency sweep'],
      ['orbit-address-reviews', 'R-crc-6', 'three lanes'],
    ]) {
      expect(body(dir), dir).not.toContain(id);
      expect(body(dir), dir).toContain(name);
    }
  });

  it('the link pair adds the two prompt references and removes nothing', () => {
    const link = PAIRS.find((p) => p.kind === 'link')!;
    const { added, start, end } = removedSpan(link.before, link.after);
    expect(end - start).toBe(0);
    expect(added).toContain('`references/prompt-template.md`');
    expect(added).toContain('`references/mode-sections.md`');
  });

  it('the restructure is one pair shared by the fourteen bodies, and records-by-setting\'s swap one edit undone first', () => {
    expect(LABELLED_FORM).not.toBe(DECISION_WRITING_DISCIPLINE);
    expect(missingClauses(LABELLED_FORM)).toEqual([]);
    for (const dir of Object.keys(RECORDED)) {
      expect(body(dir).split(DECISION_WRITING_BASIC).length - 1, dir).toBe(1);
      expect(body(dir), dir).not.toContain(LABELLED_FORM);
    }
  });

  it('mutation: a body that still carries the labelled bullet, or carries the basic content twice, fails the ledger', () => {
    const dir = 'orbit-explore';
    expect(ledgerFailure(dir, body(dir))).toBeNull();
    expect(ledgerFailure(dir, body(dir).replace(DECISION_WRITING_BASIC, () => LABELLED_FORM))).toMatch(/basic content occurs 0 times/);
    expect(ledgerFailure(dir, body(dir) + '\n' + DECISION_WRITING_BASIC)).toMatch(/basic content occurs 2 times/);
  });
});
