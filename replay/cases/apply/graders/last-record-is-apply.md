---
type: orbit
args: [status, --json]
path: last.command
equals: apply
about: orbit/changes/greet-name/.orbit-runs/review-system-*.json
---
Bare `orbit status --json` reads the apply emit as the trail's last record: no review ran after apply in this
session (no-chaining).
