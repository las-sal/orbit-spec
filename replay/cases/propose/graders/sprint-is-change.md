---
type: orbit
args: [status, --json]
path: sprint
matches: '"name":"greet-name","kind":"change"'
about: orbit/explore/greet-name
---
Bare `orbit status --json` reads `greet-name` as a change, no longer a staged exploration.
