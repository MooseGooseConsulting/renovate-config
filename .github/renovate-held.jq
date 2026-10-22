# Per-repository counts of updates the release-age soak is holding, of lookup warnings, of branches
# stopped by a branch, PR or commit limit, and of repository problems, from Renovate's file report
# (reportType "file"), as tab-separated rows: repository, held without a release timestamp, held
# while aging, partially held, lookup warnings, limit-blocked branches, problems logged at WARN,
# problems logged at ERROR or FATAL. The workflow names only public repositories; this repository's
# job summary is public. "Partially held" is an update that
# proposes an older release while newer ones wait (pendingVersions): the report does not say
# whether those newer releases are dated, so they are counted apart and claimed as neither: the
# undated count excludes them. They are normally young releases that age out within 4 days; a
# repository whose count stays up across runs needs a targeted local dry run (ADR 0001).
#
# A pure digest (or pinDigest) update never carries releaseTimestamp (renovatebot/renovate#45236): Renovate ages
# it against the newest release matching the current value. The report holds only the current
# version's date, so a digest counts as aging only when the current value is that dated version
# (nginx:1.27); a floating or ranged value (latest, lts-alpine) counts as undated.
#
# Limit-blocked branches are report branches whose result is one of the limit results below (the same
# set the Dependency Dashboard lists as "Rate-Limited"). Problems are Renovate's own WARN and ERROR
# log records for the repository (bunyan levels 40 and 50+).
[ "branch-limit-reached", "pr-limit-reached", "commit-per-run-limit-reached",
  "commit-hourly-limit-reached" ] as $limitResults
| .repositories // {} | to_entries[] | .key as $repo
| [ (.value.packageFiles // {}) | to_entries[] | (.value // [])[] | (.deps // [])[] ] as $deps
| [ $deps[] | . as $dep | (.updates // [])[]
    | if (.pendingChecks != true) and ((.pendingVersions // []) | length > 0)
      # Renovate proposed an older release that passed and is still withholding newer ones.
      then "partial"
      elif .pendingChecks != true then empty
      elif .releaseTimestamp
         or ((.updateType == "digest" or .updateType == "pinDigest") and $dep.currentVersionTimestamp
             and $dep.currentVersion != null and $dep.currentValue == $dep.currentVersion)
      then "aging" else "undated" end ] as $held
| [ $deps[] | (.warnings // [])[] ] as $warnings
| [ (.value.branches // [])[] | select(.result as $r | $limitResults | index($r)) ] as $limited
| [ (.value.problems // [])[] | (.level // 0) | select(. >= 40) ] as $problems
| select(($held | length) + ($warnings | length) + ($limited | length) + ($problems | length) > 0)
| [ $repo,
    ([ $held[] | select(. == "undated") ] | length),
    ([ $held[] | select(. == "aging") ] | length),
    ([ $held[] | select(. == "partial") ] | length),
    ($warnings | length),
    ($limited | length),
    ([ $problems[] | select(. < 50) ] | length),
    ([ $problems[] | select(. >= 50) ] | length) ]
| @tsv
