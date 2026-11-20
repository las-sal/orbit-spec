---
type: regex
target: orbit_output
pattern: 'orbit/changes/archive/\d{4}-\d{2}-\d{2}-greet-name/\.orbit-runs/archive-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json'
example: 'orbit/changes/archive/2026-01-05-greet-name/.orbit-runs/archive-2099-01-05T10-00-00Z.json'
after_seed: true
about: orbit/changes/archive/*-greet-name/.orbit-runs/archive-*.json
---
`orbit emit archive` printed the path of the archive emit it wrote in the archived change's trail.
