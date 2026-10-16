/**
 * Static template strings for Bash completion scripts.
 * These are Bash-specific helper functions that never change.
 */
export declare const BASH_DYNAMIC_HELPERS = "# Dynamic completion helpers\n\n_orbit_complete_changes() {\n  local changes\n  changes=$(orbit __complete changes 2>/dev/null | cut -f1)\n  COMPREPLY=($(compgen -W \"$changes\" -- \"$cur\"))\n}\n\n_orbit_complete_specs() {\n  local specs\n  specs=$(orbit __complete specs 2>/dev/null | cut -f1)\n  COMPREPLY=($(compgen -W \"$specs\" -- \"$cur\"))\n}\n\n_orbit_complete_items() {\n  local items\n  items=$(orbit __complete changes 2>/dev/null | cut -f1; orbit __complete specs 2>/dev/null | cut -f1)\n  COMPREPLY=($(compgen -W \"$items\" -- \"$cur\"))\n}";
//# sourceMappingURL=bash-templates.d.ts.map