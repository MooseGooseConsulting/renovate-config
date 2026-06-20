# Config Inventory

Scope: local repository files only. I did not edit Renovate configuration or refresh generated docs.

## Config surfaces

- `default.json`: public shared Renovate preset for consumers extending `github>MooseGooseConsulting/renovate-config`. It extends `config:recommended`, disables the Dependency Dashboard, adds dependency/agent-review labels, sets Patrick/Coldaine review and assignment defaults, limits Renovate activity, delays ordinary PR creation until pending checks clear, confines scheduled updates to weekday early mornings in `America/Chicago`, disables automerge, groups minor/patch updates for npm, GitHub Actions, Dockerfile, and devcontainer managers, and gives vulnerability alerts faster treatment.
- `org-inherited-config.json`: MooseGooseConsulting inherited Renovate config entry point. It only extends the shared GitHub preset, so org-wide behavior should be the same policy as `default.json` when the Mend-hosted app applies inherited config.
- `README.md`: consumer-facing contract. It tells repos to extend the shared preset, describes Mend inherited config as the org-level path, and states the intended policy shape: PRs as the inbox, low Renovate noise, Patrick review, grouped updates, and vulnerability bypasses.
- `package.json`: maintenance workflow surface. `docs:update` regenerates the local Renovate docs snapshot, `renovate:validate` runs `renovate-config-validator --no-global --strict` over `default.json` and `org-inherited-config.json`, and `verify` chains both.
- `scripts/update-renovate-docs.mjs`: docs-refresh implementation. It fetches selected official Renovate docs sections and writes `.agents/skills/renovate-config/references/renovate-docs-snapshot.md`; this is tooling for future edits, not Renovate runtime policy.
- `.agents/skills/renovate-config/SKILL.md`: agent-facing repo workflow and guardrails. It reinforces the policy intent and says to refresh docs, read the snapshot, edit the smallest config surface, and validate before config changes.
- `.github/CODEOWNERS`: config-repo ownership control: all files require `@Coldaine` review in this repo. It does not directly set shared Renovate behavior for consumers.
- `.gitignore`: secret hygiene and local-noise surface: excludes `node_modules/`, `.env`, and `.env.*`, while allowing `.env.example`.
- There is no root `renovate.json` in this repository.

## Inferred shared-policy intent

The repo is aiming for an agent-review-first Renovate posture: Renovate should create a small, reviewable stream of PRs instead of depending on a Dependency Dashboard workflow. Ordinary updates are intentionally slowed by scheduling, concurrency limits, hourly limits, release-age delay, no automerge, and grouped minor/patch updates. Vulnerability alerts are treated as exceptional and should bypass the ordinary delay path with immediate PRs and security labels.

The org inherited config appears intentionally thin: it centralizes org behavior by extending the same public preset instead of duplicating policy in a separate inherited config.

## Risks and tensions

- Centralization vs repo fit: `default.json` applies concrete reviewers, assignees, labels, schedule, throttles, and `minimumReleaseAge` to every consumer. That keeps behavior consistent, but repos with different owners, time zones, CI speed, or dependency risk may need local overrides.
- Specific owners vs reusable preset: hard-coded `reviewers`/`assignees` point to `Coldaine`, while `reviewersFromCodeOwners` also asks Renovate to use repo CODEOWNERS. Main docs should clarify whether both are desired everywhere or whether CODEOWNERS should be the primary repo-specific escape hatch.
- PRs-as-inbox vs low-noise throttling: `dependencyDashboard=false` makes PRs the main visibility surface, but `prConcurrentLimit: 2`, `branchConcurrentLimit: 2`, `prHourlyLimit: 1`, schedule limits, and `prCreation: not-pending` can substantially delay visibility in busy or slow-CI repos.
- Grouping vs review precision: grouped minor/patch updates reduce noise, but broad npm development or production groups can mix unrelated packages and make regression attribution harder.
- Vulnerability bypass expectations: `vulnerabilityAlerts` tries to bypass schedule and release age with `schedule: []`, `minimumReleaseAge: null`, and `prCreation: immediate`. This should be validated against current Renovate schema/semantics before docs promise exact behavior.
- Inherited config blast radius: `org-inherited-config.json` extends the public preset directly. Any future change to `default.json` can affect both explicit consumers and org-inherited repos, so docs should call out rollout/testing expectations.

## Questions for the main agent

- Should consumer docs recommend local overrides for owner assignment, schedule, and throttle limits, or should those stay strongly centralized?
- Is `Coldaine` intended as the permanent reviewer/assignee for every consumer repo, or only as a default until repo CODEOWNERS take over?
- Should docs define when a repo may re-enable `dependencyDashboard`, given the policy currently assumes PRs are the inbox?
- Before final docs promise vulnerability bypass behavior, should the main agent run `npm run renovate:validate` and/or inspect current Renovate docs for `vulnerabilityAlerts` support?
- Should the docs explicitly distinguish Mend-hosted inherited config behavior from generic self-hosted Renovate global config?
