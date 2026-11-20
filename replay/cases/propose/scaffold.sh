#!/bin/bash
# The state /orbit:explore leaves: a staged exploration with its explore emit.
set -euo pipefail
. "$REPLAY_LIB/seed.sh"
here="$REPLAY_CASES/propose/seed"
mkdir -p orbit/explore/greet-name
cp "$here/explore.md" orbit/explore/greet-name/explore.md
printf 'schema: spec-driven\ncreated: 2026-01-05\n' > orbit/explore/greet-name/.openspec.yaml
seed_emit explore "$here/explore.json"
