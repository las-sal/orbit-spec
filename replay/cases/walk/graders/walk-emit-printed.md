---
type: regex
target: orbit_output
pattern: 'orbit/changes/greet-name/\.orbit-runs/address-reviews-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json'
about: orbit/changes/greet-name/.orbit-runs/address-reviews-*.json
example: 'orbit/changes/greet-name/.orbit-runs/address-reviews-2026-01-05T10-00-00Z.json'
---
`orbit emit address-reviews` printed the path of the walk emit it wrote in the change's trail.
