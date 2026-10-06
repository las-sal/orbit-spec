import { describe, it, expect } from 'vitest';
import { getSkillTemplates, generateSkillContent } from '../../../src/core/shared/skill-generation.js';

/**
 * rc08b-walk-routing — the generated surface's text obligations. The body is composed exactly as the
 * generator composes it: `SKILL.md` through `generateSkillContent`, each `references/<name>.md` as the
 * template's reference content.
 */

function skillFiles(dirName: string): Record<string, string> {
  const t = getSkillTemplates().find(s => s.dirName === dirName);
  if (!t) throw new Error(`no skill ${dirName}`);
  const out: Record<string, string> = { 'SKILL.md': generateSkillContent(t.template, 'test') };
  for (const r of t.template.references ?? []) out[`references/${r.name}`] = r.content;
  return out;
}

describe('rc08b — the T0 copy in the review body (task 2.1)', () => {
  const handoff = skillFiles('orbit-review')['references/external-handoff.md'];

  it('the T0 next_recommended copy ends at the save step and names no walk', () => {
    const at = handoff.indexOf('### `next_recommended` — multi-step prose');
    expect(at).toBeGreaterThan(-1);
    const section = handoff.slice(at);
    expect(section).toContain(' into the target AI, and save the response as\n orbit/changes/<name>/.orbit-runs/external-<as>-<TS>.md"');
    expect(section).not.toMatch(/then \/orbit:address-reviews/);
    expect(section).not.toContain('plus the follow-up command (per D14)');
  });
});

describe('rc08b — the walk body discovers what the gate holds (task 3.1)', () => {
  const files = skillFiles('orbit-address-reviews');
  const skill = files['SKILL.md'];
  const detail = files['references/resolution-detail.md'];
  const schema = files['references/run-summary-schema.md'];
  const step = (n: string, next: string) => skill.split(`### ${n}`)[1].split(`### ${next}`)[0];
  const step1 = step('1. Discover', '2. Triage');
  const step2 = step('2. Triage', '3. Walk each marker');
  const classify = skill.split('#### 3b. Classify')[1].split('#### 3b.5.')[0];
  const persist = step('6. Persist the run summary', 'never-matches');

  it('Step 1 reads unresolvedPasses and openPair from the change-tier status JSON', () => {
    expect(step1).toContain('orbit status --change <name> --json');
    expect(step1).toContain('`unresolvedPasses`');
    expect(step1).toContain('`openPair`');
  });

  it('the single-newest recency rule and its tie-break are gone from the body and resolution-detail', () => {
    for (const text of [skill, detail]) {
      expect(text).not.toMatch(/most-recent internal review/);
      expect(text).not.toMatch(/single most-recent file/);
      expect(text).not.toMatch(/ONE recency axis|same recency axis/);
      expect(text).not.toMatch(/D-recency-1/);
      expect(text).not.toMatch(/tie-break by stable lexicographic/);
      expect(text).not.toContain('no internal review/audit-drift JSON in .orbit-runs/');
    }
    expect(detail).toContain('No @review: markers and no outstanding passes in scope. Nothing to walk.');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: A --mark marker is walked once
  it('a --mark marker that restates a discovered finding is walked as that finding, in its pass log', () => {
    expect(step1).toMatch(/walked AS that finding, in its pass's log/);
    expect(step1).toContain('The markers\' log omits it, so no finding is walked twice');
  });

  // @scenario text orbit-address-reviews :: A walk entry records its remedy, and a REDESIGN leaves the walk :: Repair and descope entries carry their remedy
  it('repair and descope are remedy values, recorded beside the process lane', () => {
    expect(classify).toMatch(/`repair`: the right thing is local/);
    expect(classify).toMatch(/`descope`: the change was doing something it should not/);
    expect(classify).toContain('a field separate from the process `lane`');
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A blind pair walks in two logs
  it('one log per source, in token order, the markers last; a converged finding is stale-with-evidence in the later log', () => {
    expect(persist).toContain('ONE resolution log PER SOURCE');
    expect(persist).toMatch(/token order, oldest first, then the markers/);
    expect(step2).toMatch(/`stale` with evidence naming the earlier log's token/);
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A converged finding left open stays open in the later log
  it('a converged finding left open takes the same open disposition in the later log', () => {
    expect(step2).toMatch(/the same `deferred` or `escalated` disposition/);
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A rediscovered pass re-walks only its open entries
  it('a rediscovered pass re-records its closed findings stale; nothing is copied forward', () => {
    expect(step2).toMatch(/re-checked by pushback against current state: still fixed, it is recorded `stale`/);
    expect(step2).toContain('Nothing is copied forward');
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: An incomplete log leaves its pass rediscovered
  it('rediscovery covers an incomplete or unreadable log, and an unnamed finding is walked', () => {
    expect(step2).toContain('names only some of its substantive findings, or is unreadable with summary counts that leave an entry open or carry none');
    expect(step2).toContain('a substantive finding that log does not name is walked');
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A routed redesign is carried, not re-walked
  it('a routed redesign is re-recorded escalated with its route, not walked, and its route named again', () => {
    expect(step2).toContain('re-record it `escalated` with the same `routed_to`, do not walk it, and name its route again in the report');
    expect(classify).toContain('While the hold stands, the eligibility line stays on the walk');
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A regressed fix is walked again on rediscovery
  it('a regressed fix on a rediscovered pass is walked again with a fresh sweep, never recorded stale', () => {
    expect(step2).toContain('reproduced — the fix regressed — it is walked again like any finding, with a fresh `sweep`');
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: A batch walk over two sources writes both logs after its cascade
  it('batch mode writes every log after its one cascade', () => {
    expect(persist).toMatch(/runs its ONE aggregated cascade, then writes every source's log/);
  });

  // @scenario text orbit-address-reviews :: One invocation writes one log per discovered source :: An interrupted walk resumes by rediscovery
  it('an interrupted walk leaves its written logs and rediscovers the rest', () => {
    expect(persist).toMatch(/interrupted walk leaves the logs it completed/);
  });

  // @scenario text orbit-address-reviews :: A walk entry records its remedy, and a REDESIGN leaves the walk :: A separable redesign is descoped and routed
  it('classify carries the remedy test and points at the remedy table; REDESIGN names the route and invokes nothing', () => {
    expect(classify).toContain('does closing the finding require mechanism nobody has reviewed?');
    expect(classify).toContain('`A walk entry records its remedy, and a REDESIGN leaves the walk`');
    expect(classify).toMatch(/names the route/);
    expect(classify).toMatch(/invokes nothing/);
    expect(classify).toContain('`routed_to`');
  });

  // @scenario text orbit-address-reviews :: A walk entry records its remedy, and a REDESIGN leaves the walk :: An essential redesign holds the gate
  it('the essential-redesign route is scoped to active changes', () => {
    expect(classify).toContain('`orbit/changes/<name>/explore.md` on an ACTIVE change');
    expect(classify).toMatch(/on any other scope[^.]*`orbit\/explore\/<new-name>\/`/);
  });

  // (the scenario's THEN is engine state: declared as behaviour in walk-discovery-e2e.test.ts)
  it('an essential redesign holds the gate only on a substantive gate-pass finding', () => {
    expect(classify).toContain('It holds the gate only where the gate reads it: on a CRITICAL or WARNING of a reviewed-gate pass, that pass stays unresolved; an escalated SUGGESTION, or an entry from an audit-drift emit or from markers, records the route and holds nothing.');
  });

  // @scenario text orbit-address-reviews :: A walk entry records its remedy, and a REDESIGN leaves the walk :: A stale entry carries no remedy
  it('a stale entry carries no remedy', () => {
    expect(classify).toMatch(/`stale`[^.]*carr(?:y|ies) no `remedy`/);
  });

  // @scenario text orbit-address-reviews :: A disagreement between the halves of a pair is settled by one test :: A contradiction is settled by one test
  it('a disagreement is settled at triage by one test and recorded on the later log', () => {
    expect(step2).toContain('ONE cheap empirical test');
    expect(step2).toContain('AT TRIAGE');
    expect(step2).toContain('`disagreement: {with, test, observed}`');
  });

  // @scenario text orbit-address-reviews :: A disagreement between the halves of a pair is settled by one test :: The earlier pass's claim is refuted
  it('a refuted claim is stale in its OWN pass log, the test output its evidence', () => {
    expect(step2).toMatch(/refutes is `stale` with the test's output as its evidence, in its OWN pass's log/);
  });

  // @scenario text orbit-address-reviews :: A disagreement between the halves of a pair is settled by one test :: An untestable contradiction goes to the user
  it('an untestable contradiction enters the decision lane', () => {
    expect(step2).toMatch(/cannot be run[^.]*decision lane/);
  });

  it('the schema reference documents remedy, routed_to and disagreement, and no longer documents tie_break_rationale as written', () => {
    const block = schema.split('## Schema (v2)')[1].split('## Example payloads')[0];
    expect(block).toContain('"remedy":');
    expect(block).toContain('"routed_to":');
    expect(block).toContain('"disagreement":');
    expect(block).not.toContain('"tie_break_rationale":');
    const notes = schema.split('## Field notes')[1];
    for (const k of ['remedy', 'routed_to', 'disagreement']) expect(notes).toContain('`' + k + '`');
    const examples = schema.split('## Example payloads')[1].split('## v1 → v2')[0];
    for (const k of ['"remedy"', '"routed_to"', '"disagreement"']) expect(examples).toContain(k);
    expect(examples).not.toContain('"tie_break_rationale"');
  });

  it('the frontmatter describes discovery, not the retired "no markers" fallback', () => {
    const t = getSkillTemplates().find(s => s.dirName === 'orbit-address-reviews')!.template;
    expect(t.description).not.toMatch(/when invoked with a change name and no markers/);
    expect(t.compatibility ?? '').not.toMatch(/no inline markers found/);
    expect(t.description).toMatch(/outstanding pass/);
  });
});

describe('rc08b 5.1 — the discovery scenarios the walk body carries', () => {
  const files = skillFiles('orbit-address-reviews');
  const skill = files['SKILL.md'];
  const detail = files['references/resolution-detail.md'];
  const step1 = skill.split('### 1. Discover')[1].split('### 2. Triage')[0];
  const persist = skill.split('### 6. Persist the run summary')[1];
  const row = (n: number) => step1.split('\n').find(l => l.startsWith(`${n} `))!;
  const R = 'orbit-address-reviews :: Address-reviews command available :: ';
  void R;

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Default scan
  it('no positional and no active change: the whole-repo marker scan with the safe exclusions, no trail', () => {
    expect(row(3)).toMatch(/zero or several active changes: the whole-repo @review: marker scan/);
    expect(step1).toMatch(/whole-repo scan[\s\S]*`\.git\/`, `node_modules\/`, `dist\/`, `build\/`\. No trail is read\./);
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Bare invocation with several active changes names them
  it('several active changes are named in the header', () => {
    expect(row(3)).toContain('several are named in the header so the user can aim the walk');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Bare invocation resolves the single active change
  it('the header half: a bare invocation with one active change names it before walking', () => {
    expect(row(2)).toContain('say "resolved to the single active change <name>; markers outside it are not scanned"');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Scoped scan — path or pattern
  it('a path positional scans markers in that scope only, and reads no trail', () => {
    expect(row(7)).toContain('a positional resolving to no change (a path or pattern): markers in that scope only');
    expect(detail).toMatch(/Path\/pattern fallback[^\n]*no trail is read/);
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Markers and outstanding passes are walked together
  it('an active change walks the UNION of markers and outstanding passes', () => {
    expect(row(5)).toMatch(/the UNION of @review: markers in the change directory, every unresolvedPasses and unwalkedPasses entry/);
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: An open pair warns before the walk
  it('an open pair warns before triage, naming the missing member and the canonical next, and offers stop or walk', () => {
    expect(row(4)).toContain('before triage, warn that the pair is half-landed, naming the missing member and the gate\'s canonical next command, and offer two choices — stop (walk nothing, write no log, so the missing review can run) or walk now');
    expect(step1).toContain('Row 4 reads `openPair`');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Walking past the warning ends the pair
  it('walking past the warning ends the pair and continues at row 5', () => {
    expect(row(4)).toContain('Walking now ends the pair: on an invoked slot the walked half then covers alone');
    expect(row(4)).toContain('On walk, continue at row 5.');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: A bare invocation meets the openPair warning
  it('a bare invocation re-enters the rows as the single change, so the openPair warning applies', () => {
    expect(row(2)).toContain('then re-enter these rows as a positional naming that change');
    expect(row(2)).toContain('resolved to the single active change <name>');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: A suggestion-only pass is discovered
  it('a suggestion-only pass is discovered through unwalkedPasses, and the walk holds nothing on the gate', () => {
    expect(step1).toContain('row 5 reads the union of the two lists');
    expect(step1).toContain('so a suggestion-only pass is discovered and walked like any other');
    expect(step1).not.toContain('a suggestion-only pass is reached by `--from-file`');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Superseded and blocked gates contribute nothing
  it('blocked and superseded gates contribute no passes', () => {
    expect(row(5)).toContain('each reviewed gate neither blocked nor superseded');
    expect(step1).toContain('whose `state` is not `blocked` and that does not carry `superseded: true`');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: An unwalked audit-drift emit is discovered
  it('an audit-drift emit no log names is discovered by basename', () => {
    expect(row(5)).toContain('every audit-drift-*.json in its .orbit-runs/ whose basename no address-reviews-*.json there names in source_path');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Nothing to walk
  it('nothing discovered prints the empty line and lists walked audit emits', () => {
    expect(step1).toContain('AFTER the matched row: when it discovered nothing, print "No @review: markers and no outstanding passes in scope. Nothing to walk."');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Explicit `--from-file` overrides discovery
  it('--from-file is the only input: no grep, no discovery, no openPair warning', () => {
    expect(row(1)).toContain('the file ONLY; no marker grep, no trail discovery, no openPair warning; the positional, if any, resolves only where the log lands');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Discovered work walks the standard ingest lifecycle
  it('every discovered source walks the --from-file ingest path', () => {
    expect(step1).toContain('Every discovered pass and audit-drift emit walks the `--from-file` ingest path below');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: A discovered log captures its provenance
  it('a discovered log carries its provenance and no tie-break field', () => {
    expect(persist).toContain('A discovered source\'s log carries `source: "auto-discovered"`, `source_path` (that one file), `source_command` (its top-level `command`, or `null` for an external return), `source_token` and `latest_apply_token`; no `tie_break_rationale` is written');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: `--mark` is not a prerequisite
  it('--mark stays a stylistic choice', () => {
    expect(step1).toContain('`--mark` stays a stylistic choice, never a prerequisite');
  });

  // @scenario text orbit-address-reviews :: Address-reviews command available :: Archived change reads markers and audit-drift only
  it('an archived change reads markers and audit-drift; its passes are reached by --from-file', () => {
    expect(row(6)).toContain('archived change: markers in the archived directory + its unwalked audit-drift-*.json by the same basename rule; its review passes are reached by --from-file, and the header says so');
  });
});

describe('rc08b 5.1 — the inline audit-drift scenario', () => {
  // @scenario text orbit-run-summary-emit :: Audit-drift standalone recommendations :: Inline audit-drift during archive unchanged
  it('the audit-drift body folds an archive-invoked pass into the archive emit, writing no audit-drift JSON', () => {
    const body = skillFiles('orbit-audit-drift')['references/run-summary-schema.md'];
    expect(body).toMatch(/\/orbit:archive\\?` pre-archive sweep\): no separate audit-drift JSON — findings fold into the caller's emit[^\n]*archive's `archive-<TS>\.json` `audit\.\*` fields/);
  });
});
