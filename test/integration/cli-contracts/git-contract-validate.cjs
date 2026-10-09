/**
 * The ONE `git` argv validator, over the recorded contract `git-contract.json`
 * (rc05b-git-grammar, design D5). CommonJS, beside `gh`'s, with `gh`'s calling convention:
 * `argv` EXCLUDES the leading `git`; the result is `{ ok, message }`.
 *
 * The rules are `orbit-cli-grammar`'s `Every \`git\` and \`gh\` snippet on the generated
 * surface validates against its tool's recorded contract` (its validator paragraph). Strict
 * on purpose: a flag matches a recorded name exactly, never abbreviated or bundled.
 */
'use strict';

const RECAPTURE = 're-run npm run capture:git';

/** The longest recorded key leading the argument vector, or undefined. */
function lookup(argv, contract) {
  const keys = Object.keys(contract.commands).sort((a, b) => b.split(' ').length - a.split(' ').length);
  return keys.find((k) => k.split(' ').every((word, i) => argv[i] === word));
}

/** The words an unmatched vector names: a group's first word with its verb, else the first word. */
function unmatchedName(argv, contract) {
  const heads = new Set(Object.keys(contract.commands).filter((k) => k.includes(' ')).map((k) => k.split(' ')[0]));
  return heads.has(argv[0]) && argv[1] !== undefined ? `${argv[0]} ${argv[1]}` : argv[0] ?? '';
}

function validate(argv, contract) {
  const key = lookup(argv, contract);
  if (key === undefined) {
    return { ok: false, message: `unknown command "${unmatchedName(argv, contract)}" for "git" — ${RECAPTURE}` };
  }
  const spec = contract.commands[key];
  if (!spec.known) return { ok: false, message: spec.message };

  const byName = new Map(spec.flags.map((f) => [f.name, f]));
  const ruled = spec.class === 'rule';
  const unrecorded = (token) =>
    ruled
      ? `flag ${token} on git ${key} is not recorded, and the orbit-side rule rev_parse_recorded_flags_only accepts recorded flags only — ${RECAPTURE}`
      : `flag ${token} on git ${key} is not in the recorded contract — ${RECAPTURE}`;

  const rest = argv.slice(key.split(' ').length);
  let positionals = 0;
  let optionsEnded = false;
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (optionsEnded || !token.startsWith('-') || token.length < 2) {
      positionals += 1; // a placeholder is a value, exactly as a real value
      continue;
    }
    if (token === '--') {
      optionsEnded = true;
      continue;
    }
    if (token.startsWith('--') && token.includes('=')) {
      // `--name=value` is accepted on any accepted long flag (the requirement's named limit).
      const flag = byName.get(token.slice(0, token.indexOf('=')));
      if (!flag) return { ok: false, message: unrecorded(token.slice(0, token.indexOf('='))) };
      if (!flag.accepted) return { ok: false, message: flag.message };
      continue;
    }
    const flag = byName.get(token);
    if (flag) {
      if (!flag.accepted) return { ok: false, message: flag.message };
      if (flag.takes_value) {
        i += 1;
        if (i >= rest.length) return { ok: false, message: `flag ${token} on git ${key} requires a value` };
      }
      continue;
    }
    if (!token.startsWith('--') && token.length > 2) {
      // An attached short value (`-S<x>`) only on a value-taking short flag; anything else
      // (a bundle, an attached value on a flag that takes none) is not recorded.
      const short = byName.get(token.slice(0, 2));
      if (short && short.takes_value) {
        if (!short.accepted) return { ok: false, message: short.message };
        continue;
      }
    }
    return { ok: false, message: unrecorded(token) };
  }
  if (spec.positional_required && positionals === 0) {
    return { ok: false, message: `git ${key} requires an argument` };
  }
  return { ok: true, command: key };
}

module.exports = { validate };
