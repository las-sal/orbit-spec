/**
 * The ONE argv validator both the `gh` stub (a standalone Node script, hence CommonJS) and
 * the fidelity sweep derive from the recorded contract (rc01-instrument-fidelity, design D3).
 *
 * Convention: `argv` EXCLUDES the leading `gh` token. Lookup: the availability probe first,
 * then the longest leading key in `contract.commands` (`pr view` before `pr`). Tokenizing:
 * a token matching a flag's long or short name is a flag; a value-taking flag consumes the
 * next token or its `=value` suffix; a boolean flag consumes nothing; every other token is a
 * positional (the references' placeholders are ordinary tokens). Checks, in order: unknown
 * flag (the real CLI's message), positional shape, the two recorded rules, the two
 * orbit-side rules.
 */
'use strict';

/** Placeholders the generated references use in copyable commands — never real values. */
const PLACEHOLDER = /^<[^>]+>$|^<[^>]+>\/<[^>]+>$/;

/**
 * Reproduce the real CLI's value parse for an explicit value. Returns an error message or
 * undefined. Placeholders are exempt (a reference's `<number>` stands for a real one).
 */
function checkValue(flag, value, name) {
  if (value === undefined || PLACEHOLDER.test(value)) return undefined;
  const type = flag.value_type ?? (flag.takes_value ? 'string' : 'boolean');
  if (type === 'boolean') {
    if (!/^(1|0|t|f|T|F|true|false|TRUE|FALSE|True|False)$/.test(value)) {
      return `invalid argument "${value}" for "${flag.short ? flag.short + ', ' : ''}${flag.long}" flag: strconv.ParseBool: parsing "${value}": invalid syntax`;
    }
    return undefined;
  }
  if (type === 'int') {
    if (!/^-?\d+$/.test(value)) {
      return `invalid argument "${value}" for "${flag.short ? flag.short + ', ' : ''}${flag.long}" flag: strconv.ParseInt: parsing "${value}": invalid syntax`;
    }
    return undefined;
  }
  return undefined;
}

function validate(argv, contract) {
  const probe = contract.availability_probe;
  if (probe && argv.length === probe.argv.length && argv.every((a, i) => a === probe.argv[i])) {
    return { ok: true, command: '--version', probe: true, stdout: probe.stdout };
  }
  const keys = Object.keys(contract.commands).sort((a, b) => b.length - a.length);
  const command = keys.find((k) => k.split(' ').every((part, i) => argv[i] === part));
  if (!command) {
    return { ok: false, message: `unknown command "${argv.slice(0, 2).join(' ')}" for "gh"` };
  }
  const spec = contract.commands[command];
  const rest = argv.slice(command.split(' ').length);
  const flags = [];
  const positionals = [];
  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i];
    if (tok.startsWith('-') && tok.length > 1) {
      const eq = tok.indexOf('=');
      const name = eq > 0 ? tok.slice(0, eq) : tok;
      const inline = eq > 0 ? tok.slice(eq + 1) : undefined;
      const flag = spec.flags.find((f) => f.long === name || f.short === name);
      if (!flag) return { ok: false, message: `unknown flag: ${name}` };
      let value;
      if (flag.takes_value) {
        if (inline !== undefined) {
          value = inline;
        } else {
          i += 1;
          if (i >= rest.length) return { ok: false, message: `flag needs an argument: ${name}` };
          value = rest[i];
        }
      } else if (inline !== undefined) {
        value = inline; // `--boolean=x` is legal shell, and the CLI parses x as a bool.
      }
      const parseError = checkValue(flag, value, name);
      if (parseError) return { ok: false, message: parseError };
      flags.push(flag.long);
    } else {
      positionals.push(tok);
    }
  }
  const shape = spec.positional.shape;
  if (!shape && positionals.length > 0) {
    return { ok: false, message: `accepts 0 arg(s), received ${positionals.length}` };
  }
  if (shape && positionals.length > 1) {
    return { ok: false, message: `accepts at most 1 arg(s), received ${positionals.length}` };
  }
  if (spec.positional.required && positionals.length === 0) {
    return { ok: false, message: 'argument required' };
  }
  const rules = contract.rules;
  const isPr = command.startsWith('pr ');
  const selectorTaking = shape.startsWith('[<number>');
  if (isPr && selectorTaking && flags.includes('--repo') && positionals.length === 0) {
    return { ok: false, message: rules.pr_selector_required_with_repo };
  }
  if (isPr && rules.pr_verbs_require_repo && !flags.includes('--repo')) {
    return { ok: false, message: 'stub: gh pr verbs must carry --repo per the shared resolution' };
  }
  if (command === 'repo view' && rules.repo_view_requires_positional && positionals.length === 0) {
    return { ok: false, message: 'stub: gh repo view requires a positional <owner>/<repo>' };
  }
  return { ok: true, command, flags, positionals };
}

module.exports = { validate };
