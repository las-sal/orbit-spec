---
name: spike-explore
runs: 1
max_turns: 15
timeout_seconds: 600
allowed_tools: [Bash, Read, Write, Edit, Glob, Grep, Skill]
---

/orbit:explore spike-probe

The exploration is about whether the CLI should gain a --verbose flag. Scaffold it, record that one sentence as its premise, and stop there; ask me nothing.
