# Weekly policy verification — 2026-09-22

## Decisions and concrete findings

- Patrick selected separate major-upgrade proposals, no automatic merging,
  at most two ordinary PRs per repository, and the existing security exception.
- The old executor filtered to a fixed 40-repository wave list. This omitted
  both newly created repositories and existing configured consumers such as
  `renovate-config` itself. Organization discovery removes this second enrollment
  list; explicit consumer `extends` remains the policy ownership boundary.
- GitHub run `35739153596` started at 14:16 UTC on September 22 although the
  workflow requested 10:00 UTC. That is 09:16 Chicago time, outside the previous
  04:00–08:59 window. Daily execution plus an all-day Monday routine window
  addresses the observed delay; it is not an uptime guarantee from GitHub.
- The old one-PR-per-hour limit could leave the second free slot unused during
  a single weekly run. Removing that hourly limit retains the two-open-PR cap.
- `prCreation: not-pending` can leave a branch waiting for CI that runs only
  after a PR exists. Prompt creation addresses that circular dependency, while
  `internalChecksFilter: strict` retains the inherited release-age behavior.

## Consumer sampling and coverage boundaries

Live GitHub default-branch configuration inspection found existing shared-preset
consumers including `ColdSearch`, `MooseGooseWebsiteServices`, and
`renovate-config`. `homelab-next` and `coldaine-codeOps` had no root configuration.
The latter has a separate specialized Hermes release runner under
`tools/hermes-updates`; that is not an organization-wide Renovate configuration.
Its release workflow must not be replaced merely by enabling ordinary managers.

The org also contains forks with upstream Renovate/Dependabot settings, and
`capacitor` has Dependabot configuration. Discovery is not evidence that these
repositories use the shared preset. Native onboarding should surface missing
configuration rather than silently replace another dependency owner.

Grouping has a fallback for ordinary updates across supported managers, then
domain-specific overrides. Majors have `groupName: null` and remain separate.
The explicit two-slot choice can leave domains or majors queued across weeks;
it cannot guarantee every dependency receives a PR in the same Monday run.
Opening a major PR does not implement its application migration.

## Verification levels

Hosted dry run [35747463832](https://github.com/MooseGooseConsulting/renovate-config/actions/runs/35747463832)
processed `ColdSearch` successfully using Renovate 44.107.0 and the candidate
preset. It extracted 17 dependencies across six files and five managers, and
proposed application, development-tool and container groups, plus separate
checkout, setup-node, TypeScript and Node major branches. Dry-run branch logging
is not evidence that live PR concurrency was enforced; no PRs were written.
The inherited lockfile-maintenance window was separately found to end before
the daily runner starts; it now uses the same full-Monday window.

- Run `npm run renovate:validate` for native schema and preset validation.
- Dispatch a full dry run from the PR branch. The runner maps the shared preset
  to that branch using native `migratePresets`; otherwise consumer configs would
  silently resolve the old main policy. Check dependency extraction, grouping,
  registry warnings, scheduling and proposed PR actions in the logs.
- After merge, dispatch a live run to verify actual discovery/onboarding/PR
  processing. A green workflow alone is not proof every dependency was found or
  every update was created: review per-repository warnings and queue limits.

Execution results and run links are recorded on the implementation PR. This
document does not claim that validation alone proves rollout completion.

## Official behavior references

- [Schedules](https://docs.renovatebot.com/configuration-options/#schedule)
- [PR creation](https://docs.renovatebot.com/configuration-options/#prcreation)
- [PR concurrency](https://docs.renovatebot.com/configuration-options/#prconcurrentlimit)
- [Grouping and package rules](https://docs.renovatebot.com/configuration-options/#packagerules)
- [Discovery and onboarding](https://docs.renovatebot.com/self-hosted-configuration/)
- [GitHub Actions runner-version extraction](https://docs.renovatebot.com/modules/manager/github-actions/)
- [Kubernetes file matching](https://docs.renovatebot.com/modules/manager/kubernetes/)
- [Flux extraction](https://docs.renovatebot.com/modules/manager/flux/)
