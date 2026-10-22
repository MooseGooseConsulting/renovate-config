# Per-repository counts of updates the release-age soak is holding and of lookup warnings, from
# Renovate's file report (reportType "file"), as tab-separated rows: repository, held without a
# release timestamp, held while aging, lookup warnings. The workflow names only public
# repositories; this repository's job summary is public.
#
# A pure digest update never carries releaseTimestamp (renovatebot/renovate#45236): Renovate ages
# it against the newest release matching the current value. The report holds only the current
# version's date, so a digest counts as aging only when the current value is that dated version
# (nginx:1.27); a floating or ranged value (latest, lts-alpine) counts as undated.
.repositories // {} | to_entries[] | .key as $repo
| [ (.value.packageFiles // {}) | to_entries[] | (.value // [])[] | (.deps // [])[] ] as $deps
| [ $deps[] | . as $dep | (.updates // [])[] | select(.pendingChecks == true)
    | if .releaseTimestamp
         or (.updateType == "digest" and $dep.currentVersionTimestamp
             and $dep.currentVersion != null and $dep.currentValue == $dep.currentVersion)
      then "aging" else "undated" end ] as $held
| [ $deps[] | (.warnings // [])[] ] as $warnings
| select(($held | length) + ($warnings | length) > 0)
| [ $repo,
    ([ $held[] | select(. == "undated") ] | length),
    ([ $held[] | select(. == "aging") ] | length),
    ($warnings | length) ]
| @tsv
