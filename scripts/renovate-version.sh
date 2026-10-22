#!/bin/sh
# Print the Renovate version the fleet runner pins (the renovate-version input of
# .github/workflows/renovate-diagnostic.yml), so validation runs the same release
# as the runner and cannot drift from it. Fails unless exactly one x.y.z pin is found.
set -eu
workflow="$(dirname "$0")/../.github/workflows/renovate-diagnostic.yml"
versions=$(sed -nE 's/^[[:space:]]*renovate-version:[[:space:]]*"?([^"[:space:]]+)"?.*/\1/p' "$workflow")
count=$(printf '%s\n' "$versions" | grep -c . || true)
if [ "$count" -ne 1 ] || ! printf '%s\n' "$versions" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Expected exactly one x.y.z renovate-version in $workflow, found: ${versions:-none}" >&2
  exit 1
fi
printf '%s\n' "$versions"
