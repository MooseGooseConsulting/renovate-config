# Counts, per repository, of updates the release-age soak is holding and of lookup warnings,
# from Renovate's file report (reportType "file"). Prints only repository names and counts:
# the job summary of this public repository must not list private repositories' dependencies.
# held_no_timestamp: the release has no publication date (for example GHCR); it stays held
# until the image is mapped to a dated registry. held_aging: published under 4 days ago.
[
  .repositories | to_entries[] | .key as $repo
  | [ .value.packageFiles | to_entries[] | .value[] | .deps[] ] as $deps
  | {
      repo: $repo,
      held_no_timestamp: [ $deps[] | (.updates // [])[] | select(.pendingChecks == true and (.releaseTimestamp | not)) ] | length,
      held_aging: [ $deps[] | (.updates // [])[] | select(.pendingChecks == true and .releaseTimestamp) ] | length,
      lookup_warnings: [ $deps[] | (.warnings // [])[] ] | length
    }
  | select(.held_no_timestamp + .held_aging + .lookup_warnings > 0)
]
| sort_by(-.held_no_timestamp, .repo)
| if length == 0 then "No updates held by the release-age soak and no lookup warnings."
  else
    "| Repository | Held, no timestamp | Held, aging | Lookup warnings |",
    "| --- | ---: | ---: | ---: |",
    (.[] | "| \(.repo) | \(.held_no_timestamp) | \(.held_aging) | \(.lookup_warnings) |")
  end
