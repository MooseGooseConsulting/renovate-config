# Documentation Index

Start here when navigating the Renovate config docs.

| Need | Read |
| --- | --- |
| Project intent, goals, anti-goals, and pillars | `docs/NORTH_STAR.md` |
| Technical shape, current components, invariants, and review cadence | `docs/architecture.md` |
| How to review whether Renovate is working well | `docs/rubrics/renovate-effectiveness-rubric.md` |
| How to review shared preset vs repo-local coordination | `docs/rubrics/repository-coordination-rubric.md` |
| How often to run reviews and what evidence to collect | `docs/workflows/renovate-review-cadence.md` |
| Agent-governed Renovate proposal | `docs/proposals/agent-governed-renovate-change-agent.md` |
| Detailed combinator, dead-dependency, and major-upgrade proposal | `docs/proposals/renovate-as-combinator-and-dead-code-agent.md` |
| Static subagent research archive | `docs/subagents/README.md` |
| Architecture decision records | `docs/decisions/README.md` |

## Inspiration Docs (non-authoritative — review by date in frontmatter)

> These files are surveys of what the broader Renovate ecosystem is doing.
> They are inspirational only. Anything here that influences shared preset
> decisions must first be validated against `docs/NORTH_STAR.md`.
> Per `AGENTS.md`: inspiration docs older than 3 months since discovery must be
> revised, archived, or removed.

| Topic | File |
| --- | --- |
| Reported repo config catalog and pattern leads | `docs/inspiration/renovate-trends.md` |
| Enterprise scale patterns (13 orgs, 40 lessons) | `docs/inspiration/renovate-enterprise-scale.md` |
| Advanced config patterns (customManagers, postUpgradeTasks, etc.) | `docs/inspiration/renovate-advanced-patterns.md` |
| AI and agent-first patterns (risk matrices, labels, metadata) | `docs/inspiration/renovate-agent-first-patterns.md` |

The authority flow is `docs/NORTH_STAR.md` -> `docs/architecture.md` -> task-specific workflow or rubric docs. If a downstream doc conflicts with the North Star, fix the downstream doc or consciously revise the North Star first.
