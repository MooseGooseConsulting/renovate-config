# MooseGoose Renovate Config

Shared, secret-free Renovate policy for MooseGooseConsulting and Coldaine repositories.

There does not appear to be an official Renovate-authored agent `SKILL.md`.
This repo includes a local Renovate config skill at
`.agents/skills/renovate-config/SKILL.md`, but it is an operating aid, not a
source of policy truth. Official Renovate docs, this repo's authority docs, and
`npm run renovate:validate` remain the references for config behavior.

## No Mend Dependency

This repo is not planning to use a Mend account, the Mend-hosted Renovate app,
the Mend Developer Portal, or paid Mend features. If research finds a useful
idea that requires Mend, mark it as unavailable for this repo instead of
promoting it into shared policy.

## Documentation Map

- `docs/NORTH_STAR.md` defines the goals, anti-goals, and review pillars.
- `docs/architecture.md` explains the shared-preset shape and invariants.
- `docs/rubrics/` contains agent prompts for measuring Renovate effectiveness
  and shared-vs-local coordination.
- `docs/workflows/renovate-review-cadence.md` defines when to run those reviews.
- `docs/inspiration/` holds non-authoritative research seeds. Treat them as
  idea sources, audit them within three months, and promote only evidence-backed
  patterns into the shared config or architecture docs.
- `docs/inspiration/agent-governed-renovate-change-agent.md` proposes how to use
  Renovate PRs as an agent-governed inbox for updates, dead-dependency
  candidates, and larger refactor proposals.
- `docs/inspiration/renovate-as-combinator-and-dead-code-agent.md` expands that
  into concrete workflows for major upgrades, dead dependency investigations,
  and Context7-backed review experiments.
- `docs/inspiration/subagents/` holds static research reports from delegated
  agents. These are evidence leads, not runnable subagents and not policy authority.
- `docs/inspiration/subagents/renovate-change-agent-critique.md` captures the independent
  source-check and critique of that proposal.

## Automatic Enrollment and Local Customization

New non-archived repositories owned by MooseGooseConsulting or Coldaine are
discovered automatically and receive the shared policy without an onboarding PR
or a `renovate.json` file. No per-repository registration is required.

Existing repository configs remain supported. For explicit inheritance when
adding local customizations or using another runner, use:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>MooseGooseConsulting/renovate-config"]
}
```

`org-inherited-config.json` remains an unused compatibility artifact. The runner
supplies `extends`, `onboarding: false`, and `requireConfig: "optional"` using
ordinary self-hosted Renovate options; no Mend service is involved.

## Policy Shape

- Do not require the Dependency Dashboard. Renovate PRs are the inbox.
- Extend Renovate's `config:best-practices` preset as the base policy.
- Open PRs when branches are ready so pull-request-only CI can run; review CI
  before merging. Release-age filtering remains enabled.
- Keep at most two ordinary Renovate branches and PRs active per repository.
  Security-fix PRs retain their existing exception to this cap.
- Keep internal checks explicit so release-age gates inherited from
  `config:best-practices`, especially npm's three-day security window, are not
  bypassed by early PR creation.
- Request `@Coldaine` review on Renovate PRs.
- Group routine minor, patch, digest, and pin updates by domain:
  application dependencies, development tools, container images, infrastructure,
  and CI/development environments. Later matching rules take precedence.
- Propose major upgrades separately and label them `major-upgrade`; preserve
  Renovate's known related-package groups such as Prisma CLI/client. Native
  package-replacement proposals remain separate from routine groups too.
- Never automatically merge updates, including majors and security fixes.
- Let vulnerability-fix PRs bypass ordinary scheduling and release-age delays.

This repository intentionally contains no secrets or host rules.

## Execution and Weekly Cadence

The existing self-hosted [workflow](.github/workflows/renovate-diagnostic.yml)
discovers `MooseGooseConsulting/*` and `Coldaine/*` using its existing GitHub credentials. It runs
daily at 10:17 UTC to check security alerts; `default.json` permits ordinary
updates all day Monday in `America/Chicago`. The full-day window tolerates
GitHub scheduled-run delays and daylight-saving changes. A schedule in a preset
does not itself start Renovate: the GitHub workflow is the executor. Lockfile
maintenance uses the same full-Monday window, replacing the inherited before-4am
window that this runner would miss.

The runner supplies the shared preset centrally, including for repositories
without config files. Existing local config still participates in Renovate's
normal merging rules and can supply custom managers, dependency constraints, or
`enabled: false` to opt out. Active forks are included; archived repositories
retain native skip behavior. Enrollment does not merge dependency upgrades or
disable another updater.
Access is limited to repositories the runner credential can see.
The current cross-owner PAT is preferred when present. The optional App-token
path is scoped to one installation owner and only allowed for manually targeted
organization runs. Full-fleet runs fail visibly without a cross-owner PAT rather
than silently losing personal-account coverage.

There are no per-repository discovery exclusions. `coldaine-ci` is archived and
therefore skipped by Renovate's native archived-repository handling.
`beast-ros` is enrolled after [#56](https://github.com/MooseGooseConsulting/beast-ros/pull/56)
merged; it uses standard hosted runners without a Renovate Python-version freeze.
`oh-my-openagent` receives the central policy without needing its config-only
setup PR merged. Dependency PRs remain subject to normal CI and review requirements.

The two-PR limit is per repository, not per organization and not two new PRs
every week. Major upgrades share those slots with routine groups. If both are
occupied, other updates queue; with `updateNotScheduled: false`, new routine
branches and ordinary branch updates wait for Monday. There is no additional
one-PR-per-hour throttle. Urgent security fixes can bypass the schedule and cap,
but still require review. Previously opened PRs are not closed merely to bring
an existing queue under the cap.

Renovate selects the newest eligible stable releases under each dependency's
versioning, compatibility and local constraints; it does not promise to update
arbitrary version strings it cannot extract. Native managers cover manifests,
lockfiles, Actions and container files. Kubernetes YAML requires explicit file
patterns in the consumer config; Flux defaults to `gotk-components.yaml` unless
expanded. Use local patterns and rules for these repositories, not a bespoke
dependency-update program. The GitHub Actions manager also updates this runner's
`renovate-version` input.

For an immediate run, dispatch the workflow with `dryRun=false` and
`unrestricted=true`. Despite the legacy input name, this bypasses **time only**,
not caps, release-age rules or review. Set `repository` to one full repository
name or leave it blank to discover both owners. Dry runs from a feature
branch automatically resolve that branch's proposed preset, rather than testing
the old preset on main. Native Renovate logs are the execution evidence.

See [cadence verification](docs/workflows/weekly-policy-verification.md) for the
runner audit and the distinction between configuration validation and execution.

## Idea Criteria

An idea is **useful** when it makes Renovate better at the repo's North Star:
keeping dependency work broad, quiet, safe, reviewable, and coordinated across
repositories. Prefer ideas that generalize across multiple repos, reduce manual
drift or stale PRs, improve security response, create better agent/human review
signals, can be validated with real PR evidence, and keep repo-specific
exceptions narrow.

An idea is **unusual** when it uses Renovate beyond ordinary package-manifest
updates: custom managers for arbitrary files, custom datasources for private or
nonstandard release feeds, `postUpgradeTasks` or codemods, infrastructure/runtime
version management, digest pinning, fleet-level observability, or PR metadata
designed for automated triage agents.

The best next candidates are:

- Add a custom-manager coverage audit before writing new regex managers.
- Create fixture tests for any custom manager or custom datasource we adopt.
- Improve Renovate PR metadata so agents can classify risk and recommend merge,
  defer, close, or escalate from GitHub PR state.
- Expand coverage for infrastructure surfaces such as GitHub Actions, Docker,
  devcontainers, Helm, Terraform, and runtime pins where consumer repos need it.
- Consider custom datasources only when at least one real repo has a release feed
  Renovate cannot otherwise read well.

More aggressive ideas, such as codemods in `postUpgradeTasks` or self-hosted
fleet orchestration, are powerful but should start as consumer-repo experiments
until the rubrics show they belong in shared policy.

Do not carry forward Mend-only ideas such as paid hosted command allowlisting,
Mend Developer Portal credentials, or Mend-specific merge-confidence gates.

## Local Guardrails

Install repo-managed hooks after cloning:

```sh
npm run hooks:install
```

The pre-push hook runs `npm run renovate:validate` and refuses direct pushes from
`main`/`master`. GitHub branch protection on `main` enforces the same PR flow
remotely.
