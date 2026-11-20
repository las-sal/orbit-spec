#!/bin/sh
d="$PWD"
while [ "$d" != "/" ]; do
  f="$d/.orbit-cli/node_modules/orbit-spec/bin/orbit.js"
  if [ -f "$f" ]; then exec node "$f" "$@"; fi
  d=$(dirname "$d")
done
echo "orbit shim: no .orbit-cli found above $PWD" >&2
exit 127
