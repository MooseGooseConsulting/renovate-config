Read `docs/NORTH_STAR.md` first. Do not infer project intent from config alone.

This document is the agent operating contract for Renovate configuration work in this repo.
Review `AGENTS.md` when a PR changes Renovate policy, docs authority, hooks, skills, or agent workflow.
Audit `docs/inspiration/` entries by their `review_by` date, or within three months of discovery when no `review_by` is set; revise, archive, or remove stale inspiration instead of letting it become ambient policy.

Before Renovate config edits, use `.agents/skills/renovate-config/SKILL.md`.
Docs authority: `docs/NORTH_STAR.md` -> `docs/architecture.md` -> workflows/rubrics.
Config surfaces: shared policy in `default.json`; repo-specific behavior in consumer `renovate.json`; `org-inherited-config.json` is compatibility-only and not part of the no-Mend operating model.
Commands: `npm run docs:update` refreshes the optional Renovate docs cache. Config validation runs in CI (`.github/workflows/validate.yml`) with the runner's pinned Renovate image; `.agents/skills/renovate-config/SKILL.md` has the same command for a local run.
Install repo hooks with `npm run hooks:install`; pre-push blocks direct pushes to `main`.
Validate config changes before pushing (local command in the skill), and do not merge with the Validate workflow red.
Work on PR branches, not `main`; completed scoped work goes through a non-draft PR.
Keep this repo public and secret-free; no host tokens, registry passwords, or `.env` values.
Do not recommend features that require paying for Mend or using the Mend Developer Portal.
Treat Renovate PRs as the default inbox; the Dependency Dashboard is on for visibility only, never as an approval gate (no `dependencyDashboardApproval` in shared policy).
For effectiveness reviews, use `docs/rubrics/renovate-effectiveness-rubric.md`.
For shared-vs-local coordination reviews, use `docs/rubrics/repository-coordination-rubric.md`.
For cadence and evidence collection, use `docs/workflows/renovate-review-cadence.md`.

If a change crosses a North Star goal, anti-goal, pillar, or architecture invariant, stop and surface the conflict.
