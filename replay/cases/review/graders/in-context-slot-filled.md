---
type: orbit
args: [status, --change, greet-name, --json]
path: gates[id=review-system]
matches: '^(?![\s\S]*in-context. has no fresh pass)[\s\S]*"id":"review-system"'
---
The `review-system` gate reads an in-context system pass later than the walk: its in-context slot is no longer
empty.
