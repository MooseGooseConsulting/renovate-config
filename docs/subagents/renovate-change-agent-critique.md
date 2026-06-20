---
title: Renovate Change Agent Critique
date: 2026-06-20
status: subagent-report
authoritative: false
---

# Renovate Change Agent Critique

This read-only critique was requested to stress-test the proposal in
`docs/proposals/agent-governed-renovate-change-agent.md`.

## Findings

- Renovate is a strong fit as a versioned-reference proposal engine: managers
  extract dependencies, datasources resolve newer versions, and PRs carry
  reviewable diffs.
- Custom managers and custom datasources widen coverage only when lookup and
  replacement semantics are explicit.
- `prCreation: "not-pending"` fits a PR-inbox model because agents see PRs that
  are closer to actionable.
- `minimumReleaseAge` should be paired with `internalChecksFilter: "strict"` when
  the goal is to suppress branches/PRs until the release-age gate passes.
- Public agent evidence exists, especially Marco Lancini's Renovate PR review
  workflow and Jamie Tanna's Renovate config agent, but the pattern should not
  be described as widespread.

## Risks

- Renovate is not a package dead-code manager. It can trigger unused-dependency
  investigation, but usage proof requires source scans, dependency analyzers,
  lockfile checks, tests, and review.
- Custom managers can silently overfit or stop matching. They need fixtures and
  dry-run verification before promotion.
- `postUpgradeTasks` are dangerous as shared policy because they execute
  commands and require runner-level allowlists.
- Dashboard-disabled operation is coherent, but it loses dashboard visibility
  for pending or suppressed updates. Agents need log, dry-run, or audit
  substitutes.
- OSV vulnerability alerts are useful but experimental and limited; they should
  be evaluated before enabling as shared policy.
- Mend-hosted Renovate may lag the latest OSS behavior, so validation and logs
  matter more than docs alone.

## Recommendation

Use Renovate as a dependency/change-surface combinator and PR-producing trigger.
Do not use it as a generic indexer or autonomous refactoring engine.

Reframe the desired dead-code feature as "versioned-reference manager plus
agent-assisted unused-dependency review trigger."

## Source Leads

- Renovate configuration options:
  https://docs.renovatebot.com/configuration-options/
- Renovate regex manager:
  https://docs.renovatebot.com/modules/manager/regex/
- Renovate datasources:
  https://docs.renovatebot.com/modules/datasource/
- Renovate custom datasource:
  https://docs.renovatebot.com/modules/datasource/custom/
- Renovate self-hosted dry run and command controls:
  https://docs.renovatebot.com/self-hosted-configuration/
- Renovate Dependency Dashboard:
  https://docs.renovatebot.com/key-concepts/dashboard/
- Marco Lancini, AI triage of Renovate PRs:
  https://blog.marcolancini.it/2026/blog-automating-security-operations-with-ai-triage-renovate/
- Jamie Tanna, agentic Renovate config:
  https://www.jvt.me/posts/2026/01/23/agentic-renovate/
