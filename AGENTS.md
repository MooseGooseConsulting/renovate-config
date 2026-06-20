Read `docs/NORTH_STAR.md` first. Do not infer project intent from config alone.

This document is the agent operating contract for Renovate configuration work in this repo.
Review `AGENTS.md` when a PR changes Renovate policy, docs authority, hooks, skills, or agent workflow.
Audit `docs/inspiration/` entries by their `review_by` date, or within three months of discovery when no `review_by` is set; revise, archive, or remove stale inspiration instead of letting it become ambient policy.

Before Renovate config edits, use `.agents/skills/renovate-config/SKILL.md`.
Docs authority: `docs/NORTH_STAR.md` -> `docs/architecture.md` -> workflows/rubrics.
Config surfaces: shared policy in `default.json`; Mend inheritance in `org-inherited-config.json`; repo-specific behavior in consumer `renovate.json`.
Commands: `npm run renovate:validate`; `npm run docs:update` refreshes the optional Renovate docs cache; `npm run verify` refreshes that cache and then validates config.
Install repo hooks with `npm run hooks:install`; pre-push runs Renovate validation and blocks direct pushes from `main`.
Run `npm run renovate:validate` before committing config changes.
Work on PR branches, not `main`; completed scoped work goes through a non-draft PR.
Keep this repo public and secret-free; no host tokens, registry passwords, or `.env` values.
Treat Renovate PRs as the default inbox; dashboard workflows are opt-in exceptions.
For effectiveness reviews, use `docs/rubrics/renovate-effectiveness-rubric.md`.
For shared-vs-local coordination reviews, use `docs/rubrics/repository-coordination-rubric.md`.
For cadence and evidence collection, use `docs/workflows/renovate-review-cadence.md`.
If a change crosses a North Star goal, anti-goal, pillar, or architecture invariant, stop and surface the conflict.
