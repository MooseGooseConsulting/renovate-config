---
title: MooseGoose Renovate Config Architecture
date: 2026-06-20
author: Patrick
status: living
last_confirmed: 2026-06-20
---

# MooseGoose Renovate Config Architecture

## Architecture Thesis

The repository uses a small public Renovate preset as the technical center of gravity, with Mend-hosted inherited config acting only as a delivery bridge and consumer repositories retaining narrow local override authority.

## Status Legend

- **Current** - implemented or directly reflected in this repository.
- **Planned** - decided direction, not fully implemented.
- **Candidate** - plausible option, not decided.
- **Deferred** - intentionally not being built now.

## System Shape

| Area | Status | Approach |
| --- | --- | --- |
| Shared preset | Current | `default.json` is the public Renovate preset consumed by repositories through `github>MooseGooseConsulting/renovate-config`. |
| Mend inherited config | Current | `org-inherited-config.json` extends the shared preset for Mend-hosted org inheritance. |
| Official docs snapshot | Current | `npm run docs:update` refreshes `.agents/skills/renovate-config/references/renovate-docs-snapshot.md`. |
| Validation | Current | `npm run renovate:validate` runs `renovate-config-validator --no-global --strict` against the shared and inherited config files. |
| Local push guard | Current | `.githooks/pre-push` runs Renovate validation and blocks direct pushes from `main` once installed with `npm run hooks:install`. |
| Remote PR gate | Current | GitHub branch protection on `main` requires pull requests and enforces the rule for admins. |
| Agent workflow | Current | `.agents/skills/renovate-config/SKILL.md` routes agents through official docs and validation before config edits. |
| Rubric evaluation | Current | `docs/rubrics/` contains agent-usable checklists for effectiveness and repository coordination. |
| Consumer repo sampling | Planned | Reviews should periodically sample real consuming repositories before making broad shared-preset changes. |
| Optional preset modules | Candidate | Future named presets may split policy for specific ecosystems if the default becomes too broad. |
| Dashboard-first workflow | Deferred | Dependency Dashboard workflows are opt-in exceptions, not the shared operating default. |

## Current Components

| Component | Status | Responsibility |
| --- | --- | --- |
| `default.json` | Current | Shared Renovate behavior: labels, reviewers, throttles, schedule, grouping, delayed PR creation, and vulnerability behavior. |
| `org-inherited-config.json` | Current | Mend-hosted organization inheritance entry point that points back to the shared preset. |
| `scripts/update-renovate-docs.mjs` | Current | Fetches selected official Renovate docs into the repo-local skill reference snapshot. |
| `.agents/skills/renovate-config/` | Current | Repo-local agent operating guide for Renovate config work. |
| `docs/NORTH_STAR.md` | Current | Project intent, goals, anti-goals, requirements, and pillars. |
| `docs/rubrics/` | Current | Repeatable evaluation prompts for Renovate deployment quality. |
| `docs/subagents/` | Current | Research notes produced by delegated agents during this documentation pass. |
| `docs/workflows/` | Current | Review cadence and operating procedures for evaluating the shared preset. |

## Architectural Invariants

- **Secret-free preset:** No host tokens, registry passwords, encrypted secrets, or `.env` values are committed here. Mend-hosted credentials and host rules belong in Mend/GitHub administrative surfaces.
- **Smallest config surface:** Edit `default.json` for shared policy, `org-inherited-config.json` for Mend inheritance behavior, and consumer `renovate.json` only for repo-local overrides.
- **Official docs before config edits:** Refresh the Renovate docs snapshot and consult official docs before changing Renovate options, package rules, schedules, dashboard behavior, or vulnerability behavior.
- **Validation before merge:** Config changes run `npm run renovate:validate`; broader changes should run `npm run verify` when refreshing the generated docs snapshot is acceptable.
- **PR branch flow:** Work happens on non-`main` branches and is reviewed through pull requests; local hooks reinforce this and GitHub branch protection enforces it remotely.
- **PRs are the inbox:** The default workflow assumes Renovate PRs, labels, reviewers, assignees, CI, and PR history are the operational surface.
- **Exceptions are evidence-backed:** A local override is acceptable when it names a real repo constraint; repeated local overrides should be considered for shared policy.

## Review Cadence

- Run the rubrics in `docs/rubrics/` monthly while the shared preset is actively changing.
- Run the rubrics after any broad change to grouping, schedules, throttles, dashboard behavior, automerge policy, or vulnerability handling.
- Sample consumer repositories before promoting a local override into the shared preset.
- Reconfirm this architecture at least quarterly, or sooner if Renovate/Mend behavior changes materially.

## Open Architecture Questions

- Should the default eventually move from `config:recommended` to `config:best-practices`, and what consumer repo evidence would justify the move?
- Should repeated ecosystem-specific local overrides become named optional presets rather than additions to `default.json`?
- Which consumer repositories are the right standing sample set for monthly/quarterly evaluation?

## Source Links

- Official Renovate configuration options: https://docs.renovatebot.com/configuration-options/
- Renovate configuration overview: https://docs.renovatebot.com/config-overview/
- Renovate presets: https://docs.renovatebot.com/key-concepts/presets/
- Mend-hosted app config: https://docs.renovatebot.com/mend-hosted/hosted-apps-config/
- Local research: `docs/subagents/renovate-official-research.md`
