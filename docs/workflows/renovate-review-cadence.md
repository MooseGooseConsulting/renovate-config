# Renovate Review Cadence

Use this workflow to keep the shared Renovate preset useful, quiet, and aligned with real repository behavior.

## Cadence

- **Monthly while active:** Run both rubrics against the shared preset and a small sample of consumer repositories.
- **Quarterly when stable:** Reconfirm the North Star, architecture, and rubrics even if the config has not changed.
- **Event-triggered:** Run the relevant rubric after changes to grouping, schedules, throttles, dashboard behavior, automerge policy, vulnerability behavior, or inherited config behavior.
- **Incident-triggered:** Run a focused review after repeated noisy PRs, stale Renovate queues, missed security updates, or surprising repo-local overrides.

## Evidence To Collect

- Current `default.json` and `org-inherited-config.json`.
- Current official Renovate docs for changed options; use the refreshed `.agents/skills/renovate-config/references/renovate-docs-snapshot.md` only as an optional local cache.
- Local hook status from `git config --get core.hooksPath` and `.githooks/pre-push`.
- GitHub branch protection or rulesets for `main`.
- A sample of consumer `renovate.json` files.
- Open, merged, closed, and stale Renovate PRs across representative repositories.
- CI status and failure patterns on Renovate PRs.
- Security alerts and vulnerability PRs.
- Notes from humans or agents explaining merge, close, defer, or override decisions.

## Monthly Review Prompt

Ask an agent:

> Review whether the MooseGoose Renovate deployment is using Renovate effectively across sampled repositories. Use `docs/rubrics/renovate-effectiveness-rubric.md` and `docs/rubrics/repository-coordination-rubric.md`. Collect evidence before scoring. Call out evidence gaps, repeated local overrides, noisy groups, stale PRs, missed security response, and any config changes worth proposing.

## Output

Write a short report with:

- date and repositories sampled
- effectiveness score and coordination score
- evidence gaps
- config changes recommended now
- repo-local changes recommended now
- items to revisit next month

If the review produces a durable policy choice, add or update an ADR in `docs/decisions/`.
