# Renovate Official Research

Scope: live official Renovate and Mend docs reviewed on 2026-06-20. I did not edit Renovate configuration and did not refresh the generated local docs snapshot.

## No-Mend Update

This report predates the explicit no-Mend decision. Mend-hosted inherited
config, Mend Developer Portal credentials, Mend merge-confidence behavior, and
Mend reconfigure validation are external facts only. They are unavailable for
this repo because we are not going to pay for Mend.

## Key concepts for this repo

- Presets are reusable Renovate config stored as JSON, JSONC, or JSON5. Consumers can extend built-in presets such as `config:recommended` or repo-hosted presets such as `github>owner/repo`; when no file is named, Renovate looks for `default.json`.
- Preset order matters. In a logical conflict, the later preset in `extends` wins, while raw config in the same config object has higher precedence than presets resolved from that object.
- Shared config repos are the official pattern for managing many repositories: create a global preset, then have consumers extend it so policy can be changed in one place.
- Inherited config is separate from a shareable preset. For GitHub, Renovate looks for `{parentOrg}/renovate-config/org-inherited-config.json`; Mend-hosted apps apply it automatically when the app and file conditions are met.
- Repository config is merged after inherited config, but repository config cannot use `ignorePresets` to remove presets that came from inherited config.
- `packageRules` are the main targeting mechanism for per-manager, per-package, per-update-type, or per-file behavior. Official docs recommend ordering less important rules first and more important overrides later.
- Grouping reduces PR volume by combining related updates, especially monorepos and tool families. Over-broad groups can make review and rollback harder, so grouping should map to real review ownership or CI confidence.
- Schedules limit when Renovate creates branches or PRs. Official schedule docs prefer array syntax and note that built-in schedule presets are worth checking before custom cron-like rules.
- PR creation can be delayed. Renovate's GitHub docs call out `prCreation: "status-success"` to wait for passing tests and `prCreation: "not-pending"` to wait until checks are no longer pending.
- The Dependency Dashboard is an issue-based visibility and approval surface. Official best-practice docs recommend using it, but a PR-inbox-first repo can intentionally disable it if docs explain that tradeoff.
- Vulnerability alerts are special GitHub behavior. Renovate needs GitHub Dependency Graph and Dependabot alerts, and vulnerability PRs use `vulnerabilityAlerts` config. Official docs say they ignore normal branch, PR, hourly, and schedule limits, so they "skip the line."

## Current official-doc considerations

- Official best-practice guidance now recommends `config:best-practices` over `config:recommended`. This repo's docs should either align with that or explain why the shared preset intentionally starts elsewhere.
- Mend-hosted apps can lag open-source Renovate by hours to about a week, and major versions may be held back. This matters only as external context; our docs should verify the actual runner rather than depend on Mend-hosted behavior.
- Mend-hosted inherited config is not generic self-hosted global config. For this repo, `org-inherited-config.json` is compatibility-only and should not be treated as active policy.
- The Mend app automatically adds `mergeConfidence:all-badges` and adds `config:recommended` to onboarding config unless explicitly ignored or overridden. This is unavailable for us; do not rely on those Mend-provided defaults.
- Mend-hosted apps no longer read encrypted secrets from config files. Because we are not using Mend, credentials belong in the consumer repo's runner, secret manager, or hosting platform, not in this public shared config repo.
- The Dependency Dashboard is both a visibility surface and an approval workflow. If this repo keeps `dependencyDashboard=false`, docs should state that Renovate PRs are the operational inbox and that dashboard approval workflows are an opt-in exception.
- Vulnerability behavior should be documented as a separate fast path. Schedules, PR throttles, and release-age waits that keep routine updates quiet do not necessarily apply to security PRs.
- Config docs should point maintainers to validation: `renovate-config-validator` for schema checks, plus non-Mend dry-run evidence where needed.

## Practical recommendations

1. Keep `default.json` as a small, boring shared preset with clear `description` fields and links from docs to the policy rationale.
2. Treat `org-inherited-config.json` as compatibility-only. Prefer explicit consumer `extends` rather than Mend-hosted inherited config.
3. Document intentional deviations from official defaults, especially disabling the Dependency Dashboard or staying on `config:recommended`.
4. Order `packageRules` from broad to specific, and add comments or docs for every broad group so future maintainers know what ownership or CI assumption justifies it.
5. Group by reviewable domains: monorepos, dev tooling, GitHub Actions, Docker/devcontainer updates, and other families that usually pass or fail together.
6. Use schedules, `prHourlyLimit`, `prConcurrentLimit`, and delayed `prCreation` to keep routine updates quiet, but keep the limits visible in docs so maintainers understand why updates may be delayed.
7. Treat vulnerability alerts as their own lane with security labels and assignment, and do not imply that normal quieting controls will hold them back.
8. Keep secrets and host credentials out of this repo. Point users to the consumer repo's runner, secret manager, or hosting platform instead of Mend Developer Portal settings.
9. Validate config changes before merging with the local validator, and use non-Mend dry-run checks for behavior that schema validation cannot prove.

## Sources

- Renovate configuration options: https://docs.renovatebot.com/configuration-options/
- Renovate configuration overview and precedence: https://docs.renovatebot.com/config-overview/
- Renovate presets key concept: https://docs.renovatebot.com/key-concepts/presets/
- Shareable config presets: https://docs.renovatebot.com/config-presets/
- Renovate noise reduction: https://docs.renovatebot.com/noise-reduction/
- Renovate scheduling: https://docs.renovatebot.com/key-concepts/scheduling/
- Dependency Dashboard: https://docs.renovatebot.com/key-concepts/dashboard/
- Upgrade best practices: https://docs.renovatebot.com/upgrade-best-practices/
- Mend-hosted app configuration and inherited config: https://docs.renovatebot.com/mend-hosted/hosted-apps-config/
- Mend-hosted credentials: https://docs.renovatebot.com/mend-hosted/credentials/
- Renovate GitHub FAQ source: https://github.com/renovatebot/renovate/blob/main/docs/usage/faq.md
