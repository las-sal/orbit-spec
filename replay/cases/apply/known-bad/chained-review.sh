#!/bin/bash
# Known-bad for `no-system-review`: the seed plus an in-context system review, as a session that chained
# from apply into /orbit:review would leave.
set -euo pipefail
. "$REPLAY_LIB/seed.sh"
seed_emit review "$REPLAY_CASES/apply/known-bad/review-system.json"
