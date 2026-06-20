# Renovate Review Cadence

Use this workflow to keep the shared Renovate preset useful, quiet, and aligned
with real repository behavior. This is the runner prompt for the rubric docs; it
should produce an evidence-backed audit, not a loose opinion about the config.

## Cadence

- **Monthly while active:** Run both rubrics against the shared preset and a
  representative sample of consumer repositories.
- **Quarterly when stable:** Reconfirm the North Star, architecture, and rubrics
  even if the config has not changed.
- **Event-triggered:** Run the relevant rubric after changes to grouping,
  schedules, throttles, dashboard behavior, automerge policy, vulnerability
  behavior, or the no-Mend operating constraint.
- **Incident-triggered:** Run a focused review after repeated noisy PRs, stale
  Renovate queues, missed security updates, surprising repo-local overrides, or
  a repo opting out of the shared preset.

## Sampling Contract

Do not review only this repository and do not sample only the quietest repos.
Pick the smallest set that can show whether the shared preset works in practice.

For monthly reviews, sample this repository plus three to five consumer
repositories when available:

- one high-churn application or service repo
- one low-churn library, utility, or documentation repo
- one repo with repo-local Renovate overrides
- one repo with recent failed, stale, closed, or superseded Renovate PRs
- one repo with recent vulnerability alerts or security Renovate PRs, if present

For event-triggered reviews, include every repo known to depend on the changed
behavior plus at least one ordinary repo that should not be affected. For
incident-triggered reviews, start with the incident repo and add one or two
similar repos so the report can distinguish local failure from shared policy
failure.

If the available repository set cannot satisfy the sample shape, say that in the
report and treat it as an evidence gap.

## Evidence To Collect

Collect evidence before scoring. Prefer current GitHub, repo, and CI state over
old notes.

- Current `default.json`; inspect `org-inherited-config.json` only to confirm it
  remains compatibility-only.
- Current official Renovate docs for any option whose behavior you recommend
  changing. The generated docs snapshot is only an optional local cache.
- Consumer `renovate.json` files, including whether they extend
  `github>MooseGooseConsulting/renovate-config`.
- Open Renovate PRs, including age, labels, reviewers, assignees, CI status,
  conflicts, superseded versions, and grouping.
- Recent merged, closed, abandoned, or manually rebased Renovate PRs.
- Security alerts, vulnerability PRs, emergency update history, or an explicit
  check showing that no relevant current alerts were found.
- CI status and repeated failure patterns on Renovate PRs.
- Human or agent notes explaining merge, close, defer, rebase, escalation, or
  repo-local override decisions.
- Local hook status and branch protection for this repo only when the review
  covers agent workflow, repo safety, or merge discipline.

## Audit Runner Prompt

Ask an agent with this prompt:

> Review whether the MooseGoose Renovate deployment is actually working across
> sampled repositories. First read `docs/NORTH_STAR.md`,
> `docs/architecture.md`, this workflow, and both rubric docs. Identify the
> review trigger, choose a representative sample, and explain why each repo is
> included. Collect direct evidence before scoring.
>
> Run `docs/rubrics/renovate-effectiveness-rubric.md` and
> `docs/rubrics/repository-coordination-rubric.md`. Do not score the shared
> config alone. For every score, record the evidence, confidence level, and one
> concrete improvement when the score is below the maximum. Unknown evidence
> counts as zero and must be listed as an evidence gap. Do not award a strong
> score just because a desired rule exists in config; show that Renovate PRs,
> CI, security handling, or repo-local configs behave accordingly.
>
> Produce a decision-oriented report: what is working, what is noisy or stale,
> which repeated local overrides should be promoted or deleted, which config
> changes are worth proposing now, which repo-local changes should stay local,
> which changes should not be made yet, and what evidence should be collected
> before the next review.

## Scoring Rules

- Effectiveness uses eight 0-4 dimension scores weighted to 100. The weighted
  result is `(score / 4) * weight`.
- Coordination uses six 0-3 category scores for a maximum of 18. When comparing
  both rubrics in one summary, also show the normalized percentage:
  `(coordination_total / 18) * 100`.
- A score of `unknown` is not allowed in the totals. Use `0`, mark confidence as
  `Low`, and list the missing evidence.
- A score above the midpoint requires direct evidence from current repo state,
  recent Renovate PRs, CI, security data, or a documented triage decision.
- A clean config, a dashboard entry, or a label by itself is not enough to prove
  Renovate is effective.
- Dashboard evidence is optional support. The shared operating model treats
  Renovate PRs as the inbox.
- Mend-only evidence, paid Mend features, or Mend Developer Portal behavior must
  not be treated as available shared-policy options.

## Report Template

Use this report shape:

```markdown
# Renovate Deployment Review

Date: YYYY-MM-DD
Trigger: monthly | quarterly | event | incident
Reviewer:

## Scope
Sampled repositories:
- owner/repo - why sampled

Out of scope:
- __

## Evidence Inventory
- Shared preset/config evidence:
- Repo-local config evidence:
- Renovate PR evidence:
- CI evidence:
- Security evidence:
- Human/agent triage evidence:
- Evidence gaps:

## Overall Assessment
One paragraph on whether Renovate is keeping dependencies current, quiet,
secure, reviewable, and coordinated across repos.

## Scores
Effectiveness score: __ / 100
Effectiveness band: __
Coordination score: __ / 18 (__%)
Coordination band: __

| Rubric area | Score | Confidence | Key evidence | Main improvement |
| --- | ---: | --- | --- | --- |
| Effectiveness: dependency freshness and coverage | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: security response | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: PR noise and cadence | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: grouping and reviewability | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: test signal and merge readiness | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: mergeability and branch health | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: cross-repo drift control | __/4 | High/Medium/Low | __ | __ |
| Effectiveness: human and agent triage loop | __/4 | High/Medium/Low | __ | __ |
| Coordination: shared defaults are flexible | __/3 | High/Medium/Low | __ | __ |
| Coordination: repo-local overrides are intentional | __/3 | High/Medium/Low | __ | __ |
| Coordination: explicit preset behavior is understood | __/3 | High/Medium/Low | __ | __ |
| Coordination: special repos retain autonomy | __/3 | High/Medium/Low | __ | __ |
| Coordination: config sprawl is controlled | __/3 | High/Medium/Low | __ | __ |
| Coordination: review cadence keeps coordination current | __/3 | High/Medium/Low | __ | __ |

## Decisions And Recommendations
- Shared config changes recommended now:
- Repo-local changes recommended now:
- Changes to avoid for now:
- ADR or docs updates needed:
- Items to revisit next review:
```

## Follow-Up Rules

- If the review recommends changing Renovate config behavior, consult current
  official Renovate docs before editing config and run `npm run
  renovate:validate` before committing the config change.
- If repeated repo-local overrides appear, decide whether they should become a
  shared default, a documented optional preset, or intentionally local behavior.
- If a recommendation depends on unavailable evidence, list the evidence request
  instead of pretending the score is certain.
- If the review produces a durable policy choice, add or update an ADR in
  `docs/decisions/`.
