# Renovate Effectiveness Rubric

Use this prompt to answer: "Is my Renovate deployment across repos using Renovate effectively?"

The evaluation should be outcome-first. Renovate's job is not to have an elegant
configuration; it is to keep dependencies current, surface security fixes
quickly, create reviewable PRs, and make dependency maintenance easier for
humans and agents.

## Agent Prompt

Evaluate the Renovate deployment across the target repos. Do not score the
shared config alone. Collect evidence from the config, current Renovate PRs,
recent merged or closed Renovate PRs, CI results, vulnerability handling, and
any human or agent triage notes. Prefer repo-specific examples over general
claims, and call out where evidence is missing.

For each dimension below:

1. Ask the listed questions.
2. Record the evidence collected.
3. Assign a score from 0 to 4.
4. Assign a confidence level of High, Medium, or Low.
5. Note one concrete improvement if the score is below 4.

Use exact numeric thresholds only when the org has already defined them. The
examples in this rubric are calibration aids, not required service-level
objectives.

## Scoring Contract

Score outcomes, not intentions. A Renovate option in config is evidence that the
deployment is trying to create an outcome; it is not proof that the outcome is
happening.

- Score each dimension after collecting evidence from the sampled repositories.
- Use `0` when evidence is missing, unusable, or shows the behavior is absent.
  List the missing evidence under Evidence Gaps.
- A score above `2` requires direct evidence from current repo state, recent
  Renovate PRs, CI, security data, or a documented triage decision.
- A score of `4` requires consistent evidence across the representative sample,
  not one clean example.
- Add a confidence level to every score:
  - **High:** direct evidence from most sampled repos and the evidence agrees.
  - **Medium:** direct evidence from some repos, with minor gaps or conflicts.
  - **Low:** sparse, stale, indirect, or conflicting evidence.
- Do not let Dependency Dashboard presence raise a score by itself. This repo's
  default operating model treats Renovate PRs as the inbox.
- Do not credit Mend-only features, paid Mend behavior, or Mend Developer Portal
  workflows as available shared-policy options.

## Scoring Bands

| Total | Band | Meaning |
| --- | --- | --- |
| 85-100 | Effective and quiet | Renovate is doing most dependency work with low noise and clear triage paths. |
| 70-84 | Mostly effective | Renovate is useful and trusted, but one or two dimensions need tuning. |
| 50-69 | Operational but leaky | Renovate helps, but stale updates, noisy PRs, weak tests, or manual triage regularly limit value. |
| 25-49 | Noisy or stale | Renovate creates work without reliably reducing dependency risk or maintenance burden. |
| 0-24 | Not effective | Renovate is absent, ignored, broken, or producing evidence too poor to evaluate. |

Each dimension is scored 0-4. Its weighted result is `(score / 4) * weight`.
A score of "unknown" should be treated as 0 for the total and listed as an
evidence gap.

| Dimension | Weight |
| --- | ---: |
| Dependency freshness and coverage | 15 |
| Security response | 15 |
| PR noise and cadence | 15 |
| Grouping and reviewability | 15 |
| Test signal and merge readiness | 15 |
| Mergeability and branch health | 10 |
| Cross-repo drift control | 10 |
| Human and agent triage loop | 5 |

## Score Meaning

| Score | Meaning |
| --- | --- |
| 4 | Strong: the deployment consistently produces the desired outcome with clear evidence. |
| 3 | Healthy: the outcome is usually good, with small gaps or occasional exceptions. |
| 2 | Mixed: Renovate works in some cases but creates repeated manual work or blind spots. |
| 1 | Weak: the deployment is mostly noisy, stale, blocked, or hard to trust. |
| 0 | Missing or broken: no usable evidence, no meaningful Renovate coverage, or the behavior works against the goal. |

## Minimum Evidence Gates

These gates prevent generous scoring when the evaluator only has config or
intent. If the listed evidence is unavailable, do not score the dimension above
`2`; if no usable evidence exists, score it `0`.

| Dimension | Evidence needed to score above 2 |
| --- | --- |
| Dependency freshness and coverage | Package/dependency surfaces from sampled repos plus current or recent Renovate PR/version evidence. |
| Security response | Current security alert/vulnerability PR evidence, emergency update history, or an explicit check that no relevant current alerts were found. |
| PR noise and cadence | Open and recently closed Renovate PR counts, age, throttling symptoms, and stale or superseded PR examples. |
| Grouping and reviewability | Actual Renovate PR titles/bodies/labels plus the grouping rules that produced them. |
| Test signal and merge readiness | Required checks, CI status, repeated failure patterns, and at least one passing or failing Renovate PR example. |
| Mergeability and branch health | Branch status, conflicts, stale checks, superseded PRs, or evidence that Renovate refreshes old branches cleanly. |
| Cross-repo drift control | Inventory of sampled repo `renovate.json` files and whether they extend the shared preset. |
| Human and agent triage loop | Labels, reviewers, assignees, PR body content, review comments, close reasons, or triage notes. |

## False Confidence Traps

Do not award high scores for these signals on their own:

- The shared config validates but sampled repos still carry stale or noisy PRs.
- A package rule exists but no current PR shows it creates reviewable output.
- A dashboard exists but PRs are not actionable from the GitHub PR list.
- Security labels exist but vulnerability fixes are stale, blocked, or
  unassigned.
- Automerge is enabled without evidence that checks catch likely dependency
  breakage.
- A repo has no open Renovate PRs, but there is no evidence that dependencies
  are current or intentionally ignored.

## Evidence To Collect

- The shared Renovate preset and any repo-local overrides. Treat
  `org-inherited-config.json` as compatibility-only unless Patrick explicitly
  reverses the no-Mend decision.
- A sample of open Renovate PRs across small, medium, and high-churn repos.
- A sample of recent merged, closed, and abandoned Renovate PRs.
- CI status, required checks, test failures, and rerun history on Renovate PRs.
- Security alerts, vulnerability PRs, advisory timelines, and emergency update history.
- Package manager files and lockfiles for ecosystems Renovate should manage.
- Dependency Dashboard state if the org uses dashboards for triage.
- Human or agent notes on why PRs were merged, closed, ignored, or deferred.

## 1. Dependency Freshness And Coverage

Questions:

- Are all relevant dependency surfaces covered, such as application packages,
  lockfiles, GitHub Actions, container images, devcontainers, language runtimes,
  infrastructure manifests, and internal package references?
- Are routine patch and minor updates arriving before repos drift far behind?
- Are major updates visible and intentionally handled, deferred, or grouped into
  a separate upgrade lane?
- Are closed or ignored updates revisited, or do they disappear into permanent
  drift?

Good looks like:

- Renovate opens updates for the dependency surfaces that actually matter in
  each repo.
- Repos rarely carry old patch or minor versions without an intentional reason.
- Major version work is visible, not mixed invisibly into routine maintenance.
- Lockfiles and manifests stay coherent.

Bad looks like:

- Important ecosystems are unmanaged, such as Actions, Docker images, or
  lockfiles.
- PRs exist but remain open long enough that superseding updates stack up.
- Major updates are either spammed into the normal queue or silently ignored.
- Renovate is judged healthy because config exists, even though dependency
  versions remain stale.

## 2. Security Response

Questions:

- Do vulnerability fixes bypass ordinary delay, schedule, or throttling rules
  when appropriate for the risk?
- Are security PRs clearly labeled, assigned, and prioritized?
- Can an evaluator trace a security alert from detection to merged fix,
  documented deferral, or accepted risk?
- Do security updates carry enough CI and changelog evidence for fast review?

Good looks like:

- Security PRs are easy to identify and are not buried in ordinary dependency
  noise.
- Critical fixes move quickly through review when tests pass.
- Deferrals are explicit and include a reason, owner, and next check.
- Security response depends on Renovate PRs and evidence, not on someone
  manually checking dashboards by habit.

Bad looks like:

- Vulnerability PRs wait behind routine update schedules without justification.
- Alerts are closed, ignored, or left unresolved without traceable decisions.
- Security updates fail the same tests repeatedly with no triage owner.
- The only security evidence is "Renovate is enabled."

## 3. PR Noise And Cadence

Questions:

- Is the number of open Renovate PRs small enough that humans or agents can
  review them during normal maintenance windows?
- Are PR creation, branch concurrency, and scheduling tuned to avoid CI
  contention and notification fatigue?
- Are updates delayed long enough to avoid obvious bad releases where that risk
  matters, without making routine updates stale?
- Are closed PRs mostly intentional decisions, or are they symptoms of overload?

Good looks like:

- Renovate PRs feel like an actionable inbox.
- The queue is paced, predictable, and rarely overwhelms active feature work.
- Throttles and schedules reduce noise while still allowing urgent updates.
- Old closed PRs do not immediately reappear in a frustrating loop.

Bad looks like:

- Repos routinely carry many simultaneous Renovate PRs with no clear priority.
- CI is consumed by bot branches during normal development.
- Humans close PRs just to quiet the bot.
- The cadence is so restrictive that updates arrive too late to be useful.

## 4. Grouping And Reviewability

Questions:

- Are related updates grouped so that the reviewer sees one coherent change
  instead of many tiny PRs?
- Are unrelated or risky updates separated when they need independent review?
- Do group names, labels, and PR bodies explain the dependency family and likely
  impact?
- Are package rules precise enough that grouping does not hide breaking changes
  or unrelated ecosystems?

Good looks like:

- Routine updates are grouped by meaningful dependency family, ecosystem,
  dep type, or operational risk.
- Major, security, runtime, and framework updates remain reviewable as distinct
  work when needed.
- PR titles and labels make triage possible from the PR list.
- Groups reduce review burden without making failures hard to isolate.

Bad looks like:

- Every package gets a separate PR even when updates are reviewed together.
- Large mixed PRs combine unrelated packages, making failures hard to diagnose.
- Grouping rules are broad enough to create surprising side effects in edge
  repos.
- Agents must inspect the full diff before they can tell what category of
  update they are reviewing.

## 5. Test Signal And Merge Confidence

Questions:

- Do Renovate PRs receive the same required checks needed for human-authored
  dependency changes?
- Are tests specific enough to catch common dependency breakage in each repo?
- Are failures actionable, reproducible, and linked to the changed dependency?
- Is automerge used only where the test signal and rollback path justify it?

Good looks like:

- Passing Renovate PRs provide credible confidence for low-risk updates.
- Failing PRs point reviewers toward a real compatibility issue or a flaky test
  that needs ownership.
- Lockfile-only or generated changes still get relevant validation.
- Automerge, when used, is limited to changes that the repo can safely validate.

Bad looks like:

- Renovate PRs pass because tests are absent or irrelevant.
- Failures are common but unactioned, causing PRs to rot.
- Required checks differ between Renovate and normal PRs without a documented
  reason.
- Automerge merges changes that have not been meaningfully tested.

## 6. Mergeability And Branch Health

Questions:

- Are Renovate branches usually up to date enough to merge after review?
- Do PRs recover cleanly from base-branch changes, conflicts, and superseded
  versions?
- Are abandoned branches and duplicate PRs cleaned up?
- Is the queue biased toward mergeable PRs rather than a pile of stale branches?

Good looks like:

- Most routine Renovate PRs are either merged, intentionally closed, or updated
  by the next Renovate run.
- Conflicts and failed rebases are visible and assigned.
- The open queue mostly contains work that can still be acted on.

Bad looks like:

- Many PRs are blocked by conflicts, stale checks, or old base branches.
- Superseded PRs remain open after newer versions appear.
- Reviewers spend more time rebasing bot work than evaluating dependency risk.

## 7. Cross-Repo Drift Control

Questions:

- Do repos consistently inherit the shared Renovate policy unless there is a
  documented reason not to?
- Are repo-local overrides small, intentional, and periodically reviewed?
- Can an agent explain which repos are outside the standard policy and why?
- Does the shared config make common policy changes once, rather than requiring
  repeated per-repo edits?

Good looks like:

- The shared policy is the default path.
- Exceptions are named, owned, and easy to audit.
- Similar repos behave similarly enough that agents can triage them with the
  same playbook.
- Drift is reduced by improving the shared preset instead of copy-pasting local
  rules everywhere.

Bad looks like:

- Each repo has a bespoke Renovate file with unexplained differences.
- Repos silently stop extending the shared config.
- Teams fix noise locally in incompatible ways.
- The org cannot answer which policy a repo is actually using.

## 8. Human And Agent Triage Loop

Questions:

- Are Renovate PRs labeled, assigned, and described so an agent can pick them up
  from the PR list?
- Is there a repeatable triage path for merge, close, defer, rebase, or escalate?
- Are repeated failures converted into config changes, test fixes, or backlog
  items instead of being rediscovered every cycle?
- Are humans reviewing the right decisions rather than doing mechanical bot
  babysitting?

Good looks like:

- PR metadata tells the reviewer what kind of decision is needed.
- Agents can summarize impact, verify checks, and recommend merge or deferral
  without guessing the org's process.
- Repeated pain produces durable changes to config, tests, or documentation.

Bad looks like:

- Every Renovate PR starts from scratch because labels, ownership, and review
  expectations are missing.
- The same dependency family fails repeatedly with no recorded policy decision.
- Humans only interact with Renovate when the queue is already stale or noisy.

## Final Report Template

Use this format when reporting the evaluation:

```markdown
# Renovate Effectiveness Evaluation

Overall score: __ / 100
Band: __

## Summary
One paragraph on whether Renovate is acting as a useful dependency-maintenance
system or just generating work.

## Scores
| Dimension | Score | Weighted result | Confidence | Evidence | Main improvement |
| --- | ---: | ---: | --- | --- | --- |
| Dependency freshness and coverage | __/4 | __/15 | High/Medium/Low | __ | __ |
| Security response | __/4 | __/15 | High/Medium/Low | __ | __ |
| PR noise and cadence | __/4 | __/15 | High/Medium/Low | __ | __ |
| Grouping and reviewability | __/4 | __/15 | High/Medium/Low | __ | __ |
| Test signal and merge readiness | __/4 | __/15 | High/Medium/Low | __ | __ |
| Mergeability and branch health | __/4 | __/10 | High/Medium/Low | __ | __ |
| Cross-repo drift control | __/4 | __/10 | High/Medium/Low | __ | __ |
| Human and agent triage loop | __/4 | __/5 | High/Medium/Low | __ | __ |

## Evidence Gaps
- __

## False Confidence Checks
- Scores that depend only on config, docs, labels, or dashboards:
- Scores capped because minimum evidence gates were not met:

## Recommended Next Actions
- __
```
