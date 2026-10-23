# ADR 0002: Dependency Dashboard on for visibility; security fixes uncapped

- Status: accepted (owner-requested audit fixes, 2026-10-21); amended 2026-10-22: the runner's job summary is removed ([#33](https://github.com/MooseGooseConsulting/renovate-config/issues/33)), so held and queued updates show on the dashboard, or only in the runner's log for a repository with issues turned off; the ordinary cap is five from 2026-10-22 ([ADR 0003](0003-one-non-major-pr-and-five-slots.md)); amended 2026-10-23: security PRs autoclosed by the 2026-10-22 run were caused by a run that read no alerts, not by the preset (see "Security PRs autoclosed on 2026-10-22" below)
- Applies to: every repository the shared preset reaches

## Context

The October 2026 read-only audit found two defects. First, updates held by the
two-slot cap or the release-age soak ([ADR 0001](0001-fleet-release-age-soak.md))
were invisible inside each repository: `dependencyDashboard` was `false`, so the
runner's job summary was the only place they showed. Second, security-fix
branches were capped at two per repository.

Facts about Renovate 44.107.0, the runner's pinned version:

- `lib/workers/global/limits.ts` counts vulnerability branches and PRs apart
  from ordinary ones (`VulnerabilityBranches`, `VulnerabilityConcurrentPRs`),
  but `calcLimit` still reads each upgrade's own `branchConcurrentLimit` and
  `prConcurrentLimit`. The top-level `branchConcurrentLimit: 2` therefore
  applied to security branches.
- Renovate's own `vulnerabilityAlerts` default already contains
  `prConcurrentLimit: 0` (`lib/config/options/index.ts`), so security PRs were
  never capped; only branch creation was. A local `--dry-run=full` on
  `MooseGooseConsulting/big-ui` showed 7 of its 9 vulnerability branches
  stopped as `branch-limit-reached` before this change and none after it.
- The commit-per-run and hourly-commit limits skip vulnerability alerts
  (`lib/workers/repository/update/branch/index.ts`), and both are unset (0) in
  this preset.
- The dashboard lists rate-limited branches ("Rate-Limited", checkbox
  `unlimit`) and branches held by `internalChecksFilter: strict`, which
  includes the release-age soak ("Pending Status Checks", checkbox `unpend`).
  Ticking either box makes the next run create that branch despite the cap or
  the soak (`unpendRequested` in the branch worker). A tick does not start a
  run.
- Enabling the dashboard does not change Renovate's control flow: schedules,
  caps and the soak still apply unless a box is ticked.

## Decision

- **Dashboard.** `dependencyDashboard: true` in the shared preset, with
  `dependencyDashboardApproval` left off. The dashboard is a view, not an
  inbox or a gate: Renovate PRs remain the operational inbox (North Star A4,
  G5-R1), nothing waits for approval, and nobody has to open the dashboard.
  Ticking a box is a deliberate, per-update override by someone with write
  access to the repository's issues. Repositories with issues turned off get no
  dashboard; their held and queued updates show only in the runner's log.
- **Security fixes.** `vulnerabilityAlerts` sets `branchConcurrentLimit: 0`,
  which is what lifts the branch cap, and `prConcurrentLimit: 0`, which
  restates Renovate's default so the PR cap stays lifted if a later preset
  layer sets one. Security PRs keep their own `prHeader`, no schedule, no
  release-age hold and no automerge. `prPriority` is not added: the validator
  rejects it inside `vulnerabilityAlerts`, and Renovate already sorts
  vulnerability branches first (`process/sort.ts`).
- **Job summary (removed 2026-10-22).** The runner's summary used to add
  per-repository rate-limited branch counts and Renovate's WARN and ERROR
  problem counts. No reference configuration builds one; the dashboard lists
  rate-limited branches, and Renovate's log has its problems.

## Consequences

- Each consuming repository with issues enabled gets one Renovate-owned
  dashboard issue.
- A repository can have more than two security-fix branches and PRs open at
  once. They still need review and CI.
- The uncapping depends on `calcLimit` reading the per-upgrade limits. When the
  runner's Renovate version changes, re-run a dry run on a repository with
  several open alerts and confirm no vulnerability branch reports
  `branch-limit-reached` or `pr-limit-reached`; such a branch would also be
  listed under "Rate-Limited" on that repository's dashboard.
- Security-fix PRs come from GitHub Dependabot alerts. A repository without
  them turned on gets no security-fix PRs.

## Security PRs autoclosed on 2026-10-22

### What happened

The scheduled run of 2026-10-22 15:20 UTC
([run 39803908043](https://github.com/MooseGooseConsulting/renovate-config/actions/runs/39803908043),
preset `8a0d8c9`) autoclosed five security-fix PRs whose Dependabot alerts were
still open:

- MooseGooseConsulting/TechdealsHandoff#235, vite 8.3.3 (GHSA-587h-7wmj-h5pm and two more);
- MooseGooseConsulting/ColdTools#17, next 16.3.8, and #18, mermaid 11.16.1;
- MooseGooseConsulting/big-ui#9, flask 3.1.3, and #10, python-dotenv 1.2.2.

In those three repositories the run planned no security branch at all,
although each has other open alerts with a patched version (ColdTools: axios,
@modelcontextprotocol/sdk, postcss, vitest; big-ui: vite, next, vitest and
four more). The vite update was planned inside the routine "development tools"
group instead. Thirteen other repositories in
the same run got their security branches, including a vite fix in
agent-control-plane.

### Cause

Those three repositories read no alerts in that run. The preset did not drop
them. Renovate 44.107.0 source:

- `lib/workers/repository/init/vulnerability.ts:60-66`: alerts are read once
  per repository. An empty result is logged only at debug ("No vulnerability
  alerts found") and the run continues.
- `lib/modules/platform/github/index.ts:2367-2394`: `getVulnerabilityAlerts`
  returns an empty list, logged only at debug, when GitHub's GraphQL reports
  `hasVulnerabilityAlertsEnabled: false`. Only a failed request logs a WARN
  ("Cannot access vulnerability alerts"). The run's info log has no such WARN
  and the new dashboards list no such problem.
- `lib/workers/repository/finalize/prune.ts:197-199` and `:80-94`: a
  `renovate/*` branch that the run did not plan is stale. Its PR is retitled
  "- autoclosed", closed, and the branch is deleted.

Which of the two silent paths was taken cannot be shown: the runner logs at
info. The three repositories ran between 15:27 and 15:43 UTC, inside GitHub's
incident of 2026-10-22 15:28 UTC to 2026-10-23 02:30 UTC ("intermittent errors
loading Issues, Pull Requests and search results"; API requests degraded;
<https://stspg.io/sx51v1tlpqjc>). Dependabot alerts were on in all three
repositories at 08:10 UTC that day and are on now.

### Why the preset is not the cause

- Each open alert becomes a package rule appended after every preset rule, with
  `force` set to the `vulnerabilityAlerts` object
  (`vulnerability.ts:149-173`). Renovate's default for that object includes
  `groupName: null` and the branch topic
  `{{{datasource}}}-{{{depNameSanitized}}}-vulnerability`
  (`lib/config/options/index.ts:2418-2434`, `mergeable: true`), and the preset's
  object merges into it. `mergeChildConfig` re-applies `force` after every
  merge (`lib/config/utils.ts:56`). No group rule, neither the old "development
  tools" rule nor `group:allNonMajor`, can move a vulnerable package into a
  group branch, so the preset needs no `groupName: null` of its own.
- Local Renovate 44.107.0 `--dry-run=full` runs against the live repositories
  on 2026-10-23, with the run's preset (`8a0d8c9`) and with main (`7bc9fdb`),
  plan `renovate/npm-vite-vulnerability` in TechdealsHandoff,
  `renovate/npm-next-vulnerability` and `renovate/npm-mermaid-vulnerability`
  (and five more) in ColdTools, and `renovate/pypi-flask-vulnerability` and
  `renovate/pypi-python-dotenv-vulnerability` (and seven more) in big-ui
  (main only), each outside every group. A runner dry run with the
  fleet token
  ([run 39908259656](https://github.com/MooseGooseConsulting/renovate-config/actions/runs/39908259656))
  also plans the vite branch.
- Not involved: `vulnerabilityFixStrategy` (`lowest`; vite 8.3.3 and next
  16.3.8 are the first patched versions, 16 and 22 days old at the run),
  `matchDepTypes`, branch-topic collisions, and the 2026-10-23 switch of
  Dependabot security updates off (configuration 286410 keeps alerts on, and
  run 39908259656 read them after it).

### Decision

No preset change. When a later run reads the alerts, Renovate plans the branch
again and reopens the autoclosed PR if it was closed less than 7 days earlier
(`lib/workers/repository/update/pr/pr-reuse.ts:7-53`). A missed read therefore
closes a security PR until the next run, which is daily.

### Consequences

- A `[security] - autoclosed` PR whose alerts are still open is not a decision
  to drop the fix. Check the next run before closing anything that duplicates
  it. Dependabot is no longer a fallback: its security updates are off.
- If it happens outside a GitHub incident, reproduce with a local debug dry
  run against the repository (platform `github`, the runner's preset
  reference) and look for "No vulnerability alerts found" or "No
  vulnerability alerts enabled for repo".
