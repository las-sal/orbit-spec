---
type: orbit
args: [status, --json]
path: last.file
matches: 'orbit/changes/greet-name/\.orbit-runs/review-system-[^/]+\.json$'
---
Bare `orbit status --json` reads a system review emit as the trail's last record.
