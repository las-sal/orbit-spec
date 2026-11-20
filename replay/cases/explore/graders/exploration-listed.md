---
type: orbit
args: [status, --json]
path: sprint
matches: '"name":"greet-name","kind":"explore"[\s\S]*"position":"exploring"'
---
Bare `orbit status --json` lists the exploration `greet-name` as the sprint, exploring: orbit's reading of its
staging directory. No orbit command reads `explore.md` once the session ends (its header and sections change no
answer), so the case grades that file only through the explore emit orbit wrote from it; it has no file grader of
its own.
