#!/bin/bash
# The archive case's positive control: what /orbit:archive leaves on the archive seed — the delta
# synced and the change moved by `orbit archive`, then the archive emit.
set -euo pipefail
orbit archive greet-name --yes > /dev/null
payload=$(mktemp)
printf '{ "model": null, "final_assessment": "Positive control: archived by orbit archive." }\n' > "$payload"
orbit emit archive --change greet-name --payload "$payload" > /dev/null
rm -f "$payload"
