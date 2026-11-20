---
type: regex
target: orbit_output
pattern: 'orbit/explore/greet-name/\.orbit-runs/explore-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json'
example: 'orbit/explore/greet-name/.orbit-runs/explore-2099-01-05T10-00-00Z.json'
after_seed: true
about: orbit/explore/greet-name/.orbit-runs/explore-*.json
---
`orbit emit explore` printed the path of the explore emit it wrote in the exploration's trail.
