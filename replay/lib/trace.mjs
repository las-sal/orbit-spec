// Reads a `claude -p --output-format stream-json --verbose` trace (one JSON record per line).
//
// What a grader may read from it is `orbitOutput` alone: the RESULTS of the session's Bash calls
// whose command runs `orbit`, each paired with its call by `tool_use_id`. The command line the
// session typed (a tool input) and the Skill tool's loaded body (a Skill result) never enter it, by
// construction rather than by a careful pattern (orbit-replay-set: `Every grader grades what orbit
// printed or wrote`).
import fs from 'node:fs';

/** A Bash command runs `orbit` when the word `orbit` stands as a command word in it. */
const RUNS_ORBIT = /(?:^|[\s;&|()`])orbit(?=\s|$)/m;

export function commandRunsOrbit(command) {
  return typeof command === 'string' && RUNS_ORBIT.test(command);
}

export function parseTraceLines(text) {
  const records = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      records.push(JSON.parse(trimmed));
    } catch {
      // A partial last line (a killed session) is skipped, never fatal.
    }
  }
  return records;
}

function contentBlocks(record) {
  const content = record?.message?.content;
  return Array.isArray(content) ? content : [];
}

function resultText(block) {
  const c = block.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) {
    return c
      .map((part) => (typeof part === 'string' ? part : part && part.type === 'text' ? part.text ?? '' : ''))
      .join('\n');
  }
  return '';
}

/**
 * The trace's facts: the init record's model and skills, the result record's cost, turns, duration
 * and end, and the orbit output a grader reads.
 */
export function readTraceRecords(records) {
  let init = null;
  let result = null;
  const orbitCalls = new Map(); // tool_use id → command
  const orbitResults = [];

  for (const record of records) {
    if (record?.type === 'system' && record.subtype === 'init' && !init) {
      init = {
        model: record.model ?? null,
        skills: Array.isArray(record.skills) ? record.skills.map(String) : null,
        slash_commands: Array.isArray(record.slash_commands) ? record.slash_commands.map(String) : null,
        claude_code_version: record.claude_code_version ?? null,
      };
    } else if (record?.type === 'assistant') {
      for (const block of contentBlocks(record)) {
        if (block?.type === 'tool_use' && block.name === 'Bash' && commandRunsOrbit(block.input?.command)) {
          orbitCalls.set(block.id, block.input.command);
        }
      }
    } else if (record?.type === 'user') {
      for (const block of contentBlocks(record)) {
        if (block?.type === 'tool_result' && orbitCalls.has(block.tool_use_id)) {
          orbitResults.push(resultText(block));
        }
      }
    } else if (record?.type === 'result') {
      result = {
        subtype: record.subtype ?? null,
        is_error: record.is_error ?? null,
        num_turns: typeof record.num_turns === 'number' ? record.num_turns : null,
        duration_ms: typeof record.duration_ms === 'number' ? record.duration_ms : null,
        total_cost_usd: typeof record.total_cost_usd === 'number' ? record.total_cost_usd : null,
      };
    }
  }

  return { init, result, orbitOutput: orbitResults.join('\n'), orbitCallCount: orbitCalls.size };
}

export function readTrace(file) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  return readTraceRecords(parseTraceLines(text));
}

/**
 * How a session ended, read from its result record: `finished`, `limit` (turns or budget) or
 * `error`; `null` when there is no result record or no numeric cost (the caller counts the whole
 * budget then).
 */
export function endOf(result) {
  if (!result || result.total_cost_usd === null) return null;
  const subtype = String(result.subtype ?? '');
  if (subtype === 'success' && !result.is_error) return 'finished';
  if (/max_turns|budget/.test(subtype)) return 'limit';
  return 'error';
}
