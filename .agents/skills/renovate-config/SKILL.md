---
name: renovate-config
description: Review and edit Renovate shared presets, inherited config, and Renovate PR policy. Use before changing renovate.json, default.json, org-inherited-config.json, packageRules, schedules, grouping, reviewers, PR throttles, or dashboard behavior.
---

# Renovate Config

Use this skill before editing Renovate configuration in this repository or in
repos that extend `github>MooseGooseConsulting/renovate-config`.

This is a repo-local skill, not an official Renovate-authored skill. A search of
the local skill inventory plus GitHub `renovatebot/*` and `mend/*` repositories
did not find an official Renovate `SKILL.md`. This skill instead forces use of
the official Renovate docs snapshot generated from renovatebot.com.

## Required Workflow

1. Refresh official Renovate documentation:

   ```bash
   npm run docs:update
   ```

2. Read `references/renovate-docs-snapshot.md`.

3. Edit the smallest relevant config surface:

   - `default.json` for shared repo policy.
   - `org-inherited-config.json` for MooseGooseConsulting inherited config.
   - A consumer repo's `renovate.json` only to extend or override the shared preset.

4. Validate with Renovate itself:

   ```bash
   npm run renovate:validate
   ```

5. If changing consumer repos, verify their config references this preset:

   ```json
   {
     "extends": ["github>MooseGooseConsulting/renovate-config"]
   }
   ```

## Policy Intent

- Renovate PRs are the inbox; do not depend on Patrick opening Dependency Dashboards.
- Keep Renovate quiet by grouping, throttling, and delaying PR creation until checks finish.
- Request review/assignment on PR creation so agents can triage PRs from GitHub directly.
- Keep the shared preset public and secret-free.
- Never add host tokens, registry passwords, or private credentials to this repo.

## Guardrails

- Do not combine `prCreation=approval` with `dependencyDashboardApproval=true`.
- Do not introduce options unless they validate with `renovate-config-validator`.
- Prefer `dependencyDashboard=false` unless a repo explicitly needs dashboard tracking.
- Vulnerability PRs may bypass schedule/throttles when Renovate's schema supports it.
- Treat `org-inherited-config.json` as Mend-hosted app behavior, not generic Renovate
  self-hosted global config.

## Official Sources

The generated reference snapshot is pulled from:

- `https://docs.renovatebot.com/configuration-options/`
- `https://docs.renovatebot.com/config-presets/`
- `https://docs.renovatebot.com/mend-hosted/hosted-apps-config/`

If a generated section is missing or stale-looking, inspect the source URL directly.
