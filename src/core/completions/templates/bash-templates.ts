/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */

export const BASH_DYNAMIC_HELPERS = `# Dynamic completion helpers

_orbit_complete_changes() {
  local changes
  changes=$(orbit __complete changes 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$changes" -- "$cur"))
}

_orbit_complete_specs() {
  local specs
  specs=$(orbit __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$specs" -- "$cur"))
}

_orbit_complete_items() {
  local items
  items=$(orbit __complete changes 2>/dev/null | cut -f1; orbit __complete specs 2>/dev/null | cut -f1)
  COMPREPLY=($(compgen -W "$items" -- "$cur"))
}`;
