#!/bin/bash
# The state /orbit:apply and the first half of the system review leave: the change applied (every task
# checked, its account and an apply emit), then a fresh system pass and its walk — so the typed
# /orbit:review fills review-system's in-context slot.
set -euo pipefail
bash "$REPLAY_CASES/apply/scaffold.sh"
bash "$REPLAY_CASES/review/seed/applied.sh"
. "$REPLAY_LIB/seed.sh"
here="$REPLAY_CASES/review/seed"
seed_emit review "$here/review-fresh.json"
cp "$here/README-walked.md" README.md
seed_walk review-system "$here/walk-fresh.json"
