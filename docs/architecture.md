---
title: MooseGoose Renovate Config Architecture
date: 2026-06-20
author: Patrick
status: living
last_confirmed: 2026-06-20
---

# MooseGoose Renovate Config Architecture

## Architecture Thesis

The repository uses a small public Renovate preset as the technical center of gravity. The self-hosted runner supplies that preset automatically to non-archived MooseGooseConsulting and Coldaine repositories, with documented exclusions and optional local customizations. No current architecture path depends on a Mend account, Mend-hosted app, Mend Developer Portal, or paid Mend features.

## Status Legend

- **Current** - implemented or directly reflected in this repository.
- **Planned** - decided direction, not fully implemented.
- **Candidate** - plausible option, not decided.
- **Deferred** - intentionally not being built now.

## System Shape

| Area | Status | Approach |
| --- | --- | --- |
| Shared preset | Current | `default.json` is the public Renovate preset consumed by repositories through `github>MooseGooseConsulting/renovate-config`; it extends Renovate's `config:best-practices`. |
| No-Mend operating model | Current | The shared policy must remain runnable through ordinary Renovate config, such as self-hosted Renovate or GitHub Actions. Mend-only features are not candidates for shared policy. |
| Mend inherited config | Deferred | `org-inherited-config.json` exists as a compatibility artifact only. It is not part of the planned operating model. |
| Renovate docs grounding | Current | Agents consult current official Renovate docs through Context7 or direct `docs.renovatebot.com` pages before config edits; the generated snapshot is only an optional local cache. |
| Validation | Current | `.github/workflows/validate.yml` runs Renovate's config validator on every PR against the shared, inherited and runner config files, from the same Renovate image and release as the runner; `renovate.json` groups the two pins so one PR moves both. |
| Local push guard | Current | `.githooks/pre-push` blocks direct pushes to `main` once installed with `npm run hooks:install`. |
| Remote PR gate | Current | GitHub branch protection on `main` requires pull requests and enforces the rule for admins. |
| Agent workflow | Current | `.agents/skills/renovate-config/SKILL.md` routes agents through official docs and validation before config edits. |
| Rubric evaluation | Current | `docs/rubrics/` contains agent-usable checklists for effectiveness and repository coordination. |
| Consumer repo sampling | Planned | Reviews should periodically sample real consuming repositories before making broad shared-preset changes. |
| Optional preset modules | Candidate | Future named presets may split policy for specific ecosystems if the default becomes too broad. |
| Dashboard workflow | Deferred | The shared preset disables the Dependency Dashboard; Renovate PRs are the inbox and runner logs surface lookup problems. |

## Current Components

| Component | Status | Responsibility |
| --- | --- | --- |
| `default.json` | Current | Shared policy: weekly non-major and major groups plus a separate TypeScript/ESLint stack group; five ordinary PR slots, prompt PR creation and no automerge. Runtime release lines are held as described in [shared policy](plans/2026-11-17-renovate-policy.md). Vulnerability fixes bypass schedule, release age and caps. First-party codeOps branch refs are not digest-pinned; third-party GHCR images use the custom GitHub Packages datasource. Standalone lock-file maintenance is disabled. |
| `.github/workflows/renovate-diagnostic.yml` | Current | Existing self-hosted executor: daily discovery scans and manual targeted or run-now dispatch. Credential access determines reachable repositories. Probes the token's GitHub Packages API access before each run and reports a failure as an error annotation. Runs the Docker Hub Renovate image (`renovate-image: docker.io/renovate/renovate`), so its own updates are dated. |
| `.github/renovate-diagnostic.cjs` | Current | Native `extends`, `onboarding: false`, `requireConfig: optional`; MooseGooseConsulting and Coldaine discovery including active forks; dormant repositories in its `excludedRepositories` list become negated `autodiscoverFilter` patterns (README, Execution and Weekly Cadence). No per-repo enrollment file is needed; branch dry runs resolve the proposed shared preset. Caps Docker Hub tag paging at 10 pages. |
| `org-inherited-config.json` | Deferred | Compatibility-only Mend-hosted inheritance file. Do not assume it is active or required. |
| `scripts/update-renovate-docs.mjs` | Current | Refreshes an optional local cache of selected official Renovate docs for offline/reference use. It is not policy truth. |
| `.agents/skills/renovate-config/` | Current | Repo-local agent operating guide for Renovate config work. |
| `docs/NORTH_STAR.md` | Current | Project intent, goals, anti-goals, requirements, and pillars. |
| `docs/rubrics/` | Current | Repeatable evaluation prompts for Renovate deployment quality. |
| `docs/inspiration/subagents/` | Current | Research notes produced by delegated agents during this documentation pass. |
| `docs/workflows/` | Current | Review cadence and operating procedures for evaluating the shared preset. |

## Architectural Invariants

- **No Mend dependency:** Do not recommend or adopt features that require paying for Mend, using the Mend Developer Portal, or depending on Mend-hosted command allowlisting. If research finds a good Mend-only feature, mark it unavailable.
- **Secret-free preset:** No host tokens, registry passwords, encrypted secrets, or `.env` values are committed here. Credentials belong in the consumer repo's runner, secret manager, or hosting platform, not in this shared public preset.
- **Smallest config surface:** Edit `default.json` for shared policy and consumer `renovate.json` only for repo-local overrides. Treat `org-inherited-config.json` as compatibility-only unless the no-Mend decision changes.
- **Official docs before config edits:** Consult current official Renovate docs before changing Renovate options, package rules, schedules, dashboard behavior, vulnerability behavior, custom managers, custom datasources, or post-upgrade tasks.
- **Validation before merge:** Config changes pass the Validate workflow (`validate.yml`), which runs the runner's own Renovate release. `npm run docs:update` refreshes the optional docs cache when that churn is intended.
- **PR branch flow:** Work happens on non-`main` branches and is reviewed through pull requests; local hooks reinforce this and GitHub branch protection enforces it remotely.
- **PRs are the inbox:** The default workflow assumes Renovate PRs, labels, reviewers, assignees, CI, and PR history are the operational surface.
- **Exceptions are evidence-backed:** A local override is acceptable when it names a real repo constraint; repeated local overrides should be considered for shared policy.

The codeOps digest-pinning exception is a repeated fleet pattern, not a general opt-out from dependency handling. Renovate opened first-party SHA-pin PRs in codeOps #163, capacitor #202, llm-rig #13 and coldaine-configurations #47; homelab-next #250 merged a local exception. The common policy prevents another pin PR while codeOps adopts a centrally promoted `prod` branch. It covers codeOps GitHub Actions references in every consumer of this preset, including callers not yet migrated from `@main`; it does not migrate them. Remove or narrow the rule if the shared publication model changes, and re-sample consumers before doing so.

The four-day release-age soak applies to major, minor, patch and digest updates where timestamps are available; undated sources use timestamp-optional. First-party actions and releases are exempt and vulnerability fixes bypass the soak. Third-party GHCR images use a custom datasource requiring `read:packages`; lock regeneration observes the soak only where the package manager supports it.

Python and Go stay within their selected major/minor line; Node and .NET stay within their selected major. TypeScript and ESLint stack updates have their own group. See [shared policy](plans/2026-11-17-renovate-policy.md) for limits.

## Review Cadence

The September 2026 weekly-policy change is a scoped configuration/runner review,
not a full architecture or inspiration-library reconfirmation. Its evidence is
recorded in [weekly policy verification](workflows/weekly-policy-verification.md).

- Run the rubrics in `docs/rubrics/` monthly while the shared preset is actively changing.
- Run the rubrics after any broad change to grouping, schedules, throttles, dashboard behavior, automerge policy, or vulnerability handling.
- Sample consumer repositories before promoting a local override into the shared preset.
- Reconfirm this architecture at least quarterly, or sooner if Renovate behavior changes materially.
- Revisit the release-age soak when Renovate dates GHCR images natively
  (renovatebot/renovate#39064), which would replace the `custom.ghcr` datasource, and
  inspect runner logs for held updates and failed GHCR lookups.

## Open Architecture Questions

- Should repeated ecosystem-specific local overrides become named optional presets rather than additions to `default.json`?
- Which consumer repositories are the right standing sample set for monthly/quarterly evaluation?
- Should `org-inherited-config.json` remain in the repo as an inert compatibility file, or should it be removed to prevent future agents from assuming Mend is planned?

## Source Links

- Official Renovate configuration options: https://docs.renovatebot.com/configuration-options/
- Renovate configuration overview: https://docs.renovatebot.com/config-overview/
- Renovate presets: https://docs.renovatebot.com/key-concepts/presets/
- Mend-hosted app config, retained only as a "do not depend on this" reference: https://docs.renovatebot.com/mend-hosted/hosted-apps-config/
- Local research: `docs/inspiration/subagents/renovate-official-research.md`
