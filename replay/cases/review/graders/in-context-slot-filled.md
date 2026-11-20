---
type: orbit
args: [status, --change, greet-name, --json]
path: gates[id=review-system]
matches: '"state":"passed"|"reason":"pass \d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z has unresolved substantive findings"'
---
The `review-system` gate reads an in-context system pass later than the walk: the gate has passed (the pass found
nothing substantive), or it holds on that pass's unresolved findings. At the seed it reads neither: its in-context
slot is empty.
