---
type: regex
target: orbit_output
pattern: 'orbit/changes/greet-name/\.orbit-runs/review-system-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json'
example: 'orbit/changes/greet-name/.orbit-runs/review-system-2099-01-05T10-00-00Z.json'
after_seed: true
about: orbit/changes/greet-name/.orbit-runs/review-system-*.json
---
`orbit emit review` printed the path of a system review emit it wrote in the change's trail.
