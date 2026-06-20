# Documentation Index

Start here when navigating the Renovate config docs.

| Need | Read |
| --- | --- |
| Project intent, goals, anti-goals, and pillars | `docs/NORTH_STAR.md` |
| Technical shape, current components, invariants, and review cadence | `docs/architecture.md` |
| How to review whether Renovate is working well | `docs/rubrics/renovate-effectiveness-rubric.md` |
| How to review shared preset vs repo-local coordination | `docs/rubrics/repository-coordination-rubric.md` |
| How often to run reviews and what evidence to collect | `docs/workflows/renovate-review-cadence.md` |
| Subagent local config inventory | `docs/subagents/config-inventory.md` |
| Subagent official Renovate research | `docs/subagents/renovate-official-research.md` |
| Subagent skills research | `docs/subagents/skills-research.md` |
| Deep-dive: 10 exceptional open-source configs + AI/agent-first patterns | `docs/subagents/exceptional-configs-and-ai-patterns.md` |

## Inspiration Docs (non-authoritative — review by date in frontmatter)

> These files are surveys of what the broader Renovate ecosystem is doing.
> They are inspirational only. Anything here that influences shared preset
> decisions must first be validated against `docs/NORTH_STAR.md`.
> Per `AGENTS.md`: inspiration docs older than 3 months since discovery must be removed.

| Topic | File |
| --- | --- |
| 35 real repos surveyed — config catalog with excerpts | `docs/inspiration/renovate-trends.md` |
| Enterprise scale patterns (13 orgs, 40 lessons) | `docs/inspiration/renovate-enterprise-scale.md` |
| Advanced config patterns (customManagers, postUpgradeTasks, etc.) | `docs/inspiration/renovate-advanced-patterns.md` |
| AI and agent-first patterns (risk matrices, labels, metadata) | `docs/inspiration/renovate-agent-first-patterns.md` |

The authority flow is `docs/NORTH_STAR.md` -> `docs/architecture.md` -> task-specific workflow or rubric docs. If a downstream doc conflicts with the North Star, fix the downstream doc or consciously revise the North Star first.
