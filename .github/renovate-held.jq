# Per-repository counts of updates the release-age soak is holding and of lookup warnings, from
# Renovate's file report (reportType "file"), as tab-separated rows: repository, held without a
# release timestamp, held while aging, lookup warnings. The workflow names only public
# repositories; this repository's job summary is public.
#
# A pure digest update never carries releaseTimestamp (renovatebot/renovate#45236): Renovate ages
# it against the current version's timestamp, so a dated current version means it is aging.
.repositories // {} | to_entries[] | .key as $repo
| [ (.value.packageFiles // {}) | to_entries[] | (.value // [])[] | (.deps // [])[] ] as $deps
| [ $deps[] | . as $dep | (.updates // [])[] | select(.pendingChecks == true)
    | if .releaseTimestamp or (.updateType == "digest" and $dep.currentVersionTimestamp)
      then "aging" else "undated" end ] as $held
| [ $deps[] | (.warnings // [])[] ] as $warnings
| select(($held | length) + ($warnings | length) > 0)
| [ $repo,
    ([ $held[] | select(. == "undated") ] | length),
    ([ $held[] | select(. == "aging") ] | length),
    ($warnings | length) ]
| @tsv
