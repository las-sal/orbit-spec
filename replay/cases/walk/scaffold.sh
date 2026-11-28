#!/bin/bash
# The state /orbit:review leaves: the review seed plus an in-context system pass whose one finding is an
# obvious fix.
set -euo pipefail
bash "$REPLAY_CASES/review/scaffold.sh"
. "$REPLAY_LIB/seed.sh"
seed_emit review "$REPLAY_CASES/walk/seed/review-in-context.json"
