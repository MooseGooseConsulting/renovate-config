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
| Dashboard-first workflow | Deferred | Approval-gated Dependency Dashboard workflows are opt-in exceptions, not the shared operating default. The dashboard issue itself is on in every repository as a view of queued and held updates; nothing waits for approval on it ([ADR 0002](decisions/0002-dashboard-visibility-and-uncapped-security-fixes.md)). |

## Current Components

| Component | Status | Responsibility |
| --- | --- | --- |
| `default.json` | Current | Shared policy: one weekly Monday PR for all non-major updates (`group:allNonMajor`; Python patch releases get its patch-only branch), one PR per major, five ordinary PR slots per repository ([ADR 0003](decisions/0003-one-non-major-pr-and-five-slots.md)), prompt PR creation and no automerge. Vulnerability fixes bypass routine scheduling, release age and both caps (`branchConcurrentLimit: 0` under `vulnerabilityAlerts` lifts the branch cap; `prConcurrentLimit: 0` restates Renovate's default there), are counted apart from the five ordinary slots, and are processed first ([ADR 0002](decisions/0002-dashboard-visibility-and-uncapped-security-fixes.md)); the preset does not schedule execution. First-party codeOps workflow/action refs retain branch refs instead of being digest-pinned. Python minor and major upgrades come in their own never-automerged `python` PR while patch updates stay in the non-major group. Major, minor, patch and digest updates wait 4 days; updates from sources that publish no dates come as ordinary PRs instead of being held; first-party actions and releases are exempt. Third-party GHCR images are dated by the `custom.ghcr` datasource (GitHub Packages API). |
| `.github/workflows/renovate-diagnostic.yml` | Current | Existing self-hosted executor: daily discovery scans and manual targeted or run-now dispatch. Credential access determines reachable repositories. Probes the token's GitHub Packages API access before each run and reports a failure as an error annotation. Runs the Docker Hub Renovate image (`renovate-image: docker.io/renovate/renovate`), so its own updates are dated. |
| `.github/renovate-diagnostic.cjs` | Current | Native `extends`, `onboarding: false`, `requireConfig: optional`; MooseGooseConsulting and Coldaine discovery including active forks and documented exclusions. No per-repo enrollment file is needed; branch dry runs resolve the proposed shared preset. Caps Docker Hub tag paging at 10 pages. |
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

The release-age soak is an owner rule (October 21, 2026), adopted after the LiteLLM 1.107.0 supply-chain compromise: major, minor, patch and digest updates wait 4 days. Sources that publish dates hold an update until its date is known; sources that publish none (other registries, git refs and tags, floating-tag digests, runner labels and the Java and Dart version lists) come as ordinary PRs for review, because the owner ruled on October 22, 2026 that nothing is held forever. First-party actions and GitHub releases are exempt; vulnerability fixes keep their bypass. Third-party GHCR images are dated through the GitHub Packages API by a custom datasource in the preset, which needs `read:packages` on the runner token. Lock files are covered too: Renovate hands the soak to npm and Poetry when it regenerates a lock file, uv, pnpm and bun repositories carry the same cooldown in their own configuration, and lock-file maintenance is off for managers that cannot honour one. The runner supplies the Docker Hub page cap (`dockerMaxPages`, global-only) and the GitHub Packages API probe; held updates surface on each repository's Dependency Dashboard. Mechanics, blast radius, known gaps and revisit triggers are in [ADR 0001](decisions/0001-fleet-release-age-soak.md).

The Python rule (October 13, 2026, revised October 22, 2026) keeps Python minor and major upgrades out of the non-major group. As written on October 13 it disabled them in every consumer, under an "owner rule" label that has no owner record; the October 22 revision ([#33](https://github.com/MooseGooseConsulting/renovate-config/issues/33)) turns them into one ordinary, never-automerged `python` PR per repository instead of a silent freeze. Before the rule, consumers received such upgrades from several managers, often inside grouped PRs: ColdVault #116 and llm-archiver #129 (python Docker tag to 3.14), beast-ros #58 (`setup-python` input to 3.14), and Python rows inside grouped PRs in bloodarrow-ops #32, capacitor #283, big-ui #12, coldaine-agent-loop #5, model-intelligence #9, promptcannon-prd-complete #26, tidbyt-agent-gateway #10 and ugv_ws #3. capacitor #286 carried a repository-local cap for the same reason. The policy is two shared packageRules matched by package name, so one pair covers every manager. Without `separateMinorPatch` Renovate reports only one update per package, so a minor upgrade would also carry the patch release. The first rule therefore sets `separateMinorPatch`, which keeps patches in the non-major group (in its patch branch); it cannot carry `matchUpdateTypes`, because that option is read before an update type exists. The second groups the minor and major upgrades as `python` with `automerge: false`. The `actions/setup-python` action and the devcontainer python feature are not Python releases and are not matched. Floating tags such as `python:latest` can still cross minors through digest updates.

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
  check consumer Dependency Dashboards for updates that stay under "Pending Status
  Checks" across runs and for failed GHCR lookups.

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
