#!/bin/bash

VERSION_FILE="version.json"

if [ ! -f "$VERSION_FILE" ]; then
  echo "version.json not found! Creating default..."
  echo '{"version": "1.0.0", "build": 1, "lastUpdated": "'"$(date -Iseconds)"'"}' > "$VERSION_FILE"
  exit 0
fi

# Extract current build and bump
current_build=$(jq '.build' "$VERSION_FILE")
new_build=$((current_build + 1))
now=$(date -Iseconds)

# Update JSON
jq --argjson newBuild "$new_build" --arg now "$now" \
  '.build = $newBuild | .lastUpdated = $now' "$VERSION_FILE" > tmp.$$.json && mv tmp.$$.json "$VERSION_FILE"

echo "🔁 Build number updated to $new_build at $now"

# Optional: Commit to Git (uncomment if needed)
# git add version.json
# git commit -m "chore: update build version to $new_build"
# git push
