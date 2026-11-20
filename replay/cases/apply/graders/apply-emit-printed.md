---
type: regex
target: orbit_output
pattern: 'orbit/changes/greet-name/\.orbit-runs/apply-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json'
example: 'orbit/changes/greet-name/.orbit-runs/apply-2099-01-05T10-00-00Z.json'
after_seed: true
about: orbit/changes/greet-name/.orbit-runs/apply-*.json
---
`orbit emit apply` printed the path of the apply emit it wrote in the change's trail.
