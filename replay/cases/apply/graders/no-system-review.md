---
type: file_exists
path: orbit/changes/greet-name/.orbit-runs/review-system-*.json
absent: true
pairs_with: last-record-is-apply
negative_scaffold: known-bad/chained-review.sh
---
No system review emit is in the trail: the apply session did not chain into `/orbit:review` (a must-not fact; it
already holds at the seed, so its known-bad scaffold writes one).
