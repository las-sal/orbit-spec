---
type: orbit
args: [status, --json]
path: sprint
matches: '"name":"greet-name","kind":"explore"[\s\S]*"position":"exploring"'
about: orbit/explore/greet-name/explore.md
---
Bare `orbit status --json` lists the exploration `greet-name` as the sprint, exploring: orbit's reading of the
staging directory and its `explore.md` header.
