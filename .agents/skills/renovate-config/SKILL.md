---
name: renovate-config
description: Review and edit Renovate shared presets, inherited config, and Renovate PR policy. Use before changing renovate.json, default.json, org-inherited-config.json, packageRules, schedules, grouping, reviewers, PR throttles, or dashboard behavior.
---

# Renovate Config

Use this skill before editing Renovate configuration in this repository or in
repos that extend `github>MooseGooseConsulting/renovate-config`.

This is a repo-local skill, not an official Renovate-authored skill. It is a
procedural operating guide for this repository, not a policy authority and not a
replacement for Renovate's official documentation.

## Required Workflow

1. Read `docs/NORTH_STAR.md` and `docs/architecture.md` before inferring
   intent from config alone.

2. Consult current official Renovate documentation for every option whose
   behavior you change. Prefer Context7 or direct `docs.renovatebot.com` pages.
   The generated snapshot at `references/renovate-docs-snapshot.md` is an
   optional local cache, not the source of truth.

3. Edit the smallest relevant config surface:

   - `default.json` for shared repo policy.
   - `org-inherited-config.json` only if explicitly maintaining the compatibility
     artifact; it is not part of the planned no-Mend operating model.
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
- Do not depend on a Mend account, Mend-hosted app, Mend Developer Portal, or
  paid Mend feature.
- Keep Renovate quiet by grouping, throttling, and delaying PR creation until checks finish.
- Request review/assignment on PR creation so agents can triage PRs from GitHub directly.
- Keep the shared preset public and secret-free.
- Never add host tokens, registry passwords, or private credentials to this repo.

## Guardrails

- Do not combine `prCreation=approval` with `dependencyDashboardApproval=true`.
- Do not introduce options unless they validate with `renovate-config-validator`.
- Prefer `dependencyDashboard=false` unless a repo explicitly needs dashboard tracking.
- Vulnerability PRs may bypass schedule/throttles when Renovate's schema supports it.
- Treat `org-inherited-config.json` as compatibility-only Mend-hosted app
  behavior. Do not build new policy around it unless Patrick reverses the
  no-Mend decision.
- Treat custom managers, custom datasources, and `postUpgradeTasks` as
  higher-risk features. Promote them to shared policy only after consumer-repo
  evidence, fixture or dry-run validation, and official-doc review.

## Official Sources

Use these official docs as the primary references:

- `https://docs.renovatebot.com/configuration-options/`
- `https://docs.renovatebot.com/config-presets/`
- `https://docs.renovatebot.com/mend-hosted/hosted-apps-config/` only to
  understand why this repo does not depend on Mend-hosted behavior.
- `https://docs.renovatebot.com/key-concepts/minimum-release-age/`
- `https://docs.renovatebot.com/modules/manager/regex/`

If you intentionally need an offline/cacheable reference, run `npm run docs:update`
and then read `references/renovate-docs-snapshot.md`.
