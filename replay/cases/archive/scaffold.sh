#!/bin/bash
# The state /orbit:address-reviews leaves: the walk seed with its finding repaired and walked, so
# review-system has passed.
set -euo pipefail
bash "$REPLAY_CASES/walk/scaffold.sh"
. "$REPLAY_LIB/seed.sh"
cp "$REPLAY_CASES/archive/seed/greet.js" greet.js
seed_walk review-system "$REPLAY_CASES/archive/seed/walk.json"
