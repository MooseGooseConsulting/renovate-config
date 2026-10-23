# ADR 0002: Dependency Dashboard on for visibility; security fixes uncapped

- Status: accepted (owner-requested audit fixes, 2026-10-21); amended 2026-10-22: the runner's job summary is removed ([#33](https://github.com/MooseGooseConsulting/renovate-config/issues/33)), so held and queued updates show on the dashboard, or only in the runner's log for a repository with issues turned off; the ordinary cap is five from 2026-10-22 ([ADR 0003](0003-one-non-major-pr-and-five-slots.md))
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
