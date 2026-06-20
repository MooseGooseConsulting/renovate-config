# MooseGoose Renovate Config

Shared, secret-free Renovate policy for MooseGooseConsulting and Coldaine repositories.

There does not appear to be an official Renovate-authored agent `SKILL.md`.
This repo includes a local `renovate-config` skill, but it is an operating aid,
not a source of policy truth. Official Renovate docs, this repo's authority docs,
and `renovate-config-validator` remain the references for config behavior.

## Documentation Map

- `docs/NORTH_STAR.md` defines the goals, anti-goals, and review pillars.
- `docs/architecture.md` explains the shared-preset shape and invariants.
- `docs/rubrics/` contains agent prompts for measuring Renovate effectiveness
  and shared-vs-local coordination.
- `docs/workflows/renovate-review-cadence.md` defines when to run those reviews.
- `docs/inspiration/` holds non-authoritative research seeds. Treat them as
  idea sources, audit them within three months, and promote only evidence-backed
  patterns into the shared config or architecture docs.
- `docs/proposals/agent-governed-renovate-change-agent.md` proposes how to use
  Renovate PRs as an agent-governed inbox for updates, dead-dependency
  candidates, and larger refactor proposals.
- `docs/subagents/renovate-change-agent-critique.md` captures the independent
  source-check and critique of that proposal.

## Use From A Repo

Add this to `renovate.json`:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>MooseGooseConsulting/renovate-config"]
}
```

MooseGooseConsulting repos can also inherit the same policy automatically through
`org-inherited-config.json` when the Mend Renovate app is installed for the org.

## Policy Shape

- Do not require the Dependency Dashboard. Renovate PRs are the inbox.
- Wait for checks to finish before opening ordinary PRs when possible.
- Keep only a small number of Renovate branches/PRs active per repo.
- Request Patrick's review on Renovate PRs.
- Group minor/patch updates by dependency family.
- Let vulnerability-fix PRs bypass ordinary scheduling and release-age delays.

This repository intentionally contains no secrets or host rules.

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

## Local Guardrails

Install repo-managed hooks after cloning:

```sh
npm run hooks:install
```

The pre-push hook runs `npm run renovate:validate` and refuses direct pushes from
`main`/`master`. GitHub branch protection on `main` enforces the same PR flow
remotely.
