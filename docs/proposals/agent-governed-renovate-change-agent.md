---
title: Agent-Governed Renovate Change Agent Proposal
date: 2026-06-20
status: proposal
authoritative: false
owner: Patrick
---

# Agent-Governed Renovate Change Agent Proposal

## Short Version

Use Renovate as a versioned-reference detector and PR combinator. Do not make it
the generic refactoring engine.

Renovate should find versioned things, compare them against trusted datasources,
open ready-to-review PRs, and attach enough metadata for agents to govern the
change. Agents should then classify risk, consult current docs, inspect actual
usage, identify dead dependencies, and recommend merge, defer, close, remove, or
open a larger refactor proposal.

The Dependency Dashboard is not the operating surface. The operating surface is
GitHub PR state, comments, labels, checks, and follow-up issues.

## Why This Is Interesting

Renovate is normally described as a dependency update bot, but the deeper pattern
is more general:

1. Extract a versioned reference from a file.
2. Map that reference to a datasource.
3. Compare the current value to available releases.
4. Propose the smallest mechanical update as a branch or PR.
5. Let policy decide when the PR appears, how it is labeled, and who reviews it.

That makes Renovate useful as a generic indexer for versioned references, but
only for references with deterministic replacement semantics. It can track a
Docker image, GitHub Action, package, runtime pin, Helm chart, Terraform version,
URL-embedded release, or annotated variable. It should not be asked to prove an
architecture is correct or delete code by itself.

## Terms

| Term | Meaning |
| --- | --- |
| Versioned reference | A concrete value in a repo that can be compared to a release feed, such as a package version, Docker tag, action version, or runtime pin. |
| Combinator | Renovate combines managers, datasources, package rules, schedules, labels, and PR policy into one repeatable update workflow. |
| Change agent | A system that does more than notify; it creates a proposed branch/PR for review. Renovate is a safe change agent only for narrow mechanical edits. |
| Dead dependency candidate | A dependency that appears unused after an agent scans imports, config references, runtime usage, and tests. This is a candidate, not proof. |
| Refactor proposal | A comment or issue recommending larger code changes that should not be hidden inside the Renovate PR. |

## Pros

- **One queue for dependency work.** Renovate PRs become the inbox for humans and
  agents instead of scattered dashboards, manual audits, and stale TODOs.
- **Hidden version pins become visible.** Custom managers can surface values in
  Dockerfiles, Makefiles, docs, CI config, devcontainers, Terraform variables,
  and other files Renovate does not manage by default.
- **Major upgrades become structured prompts.** A major bump can trigger an
  agent to inspect package usage, query current docs, and write a risk matrix or
  follow-up refactor proposal.
- **Dead dependency discovery gets a natural trigger.** A package that receives a
  major or risky update is a good moment to ask whether the repo uses it at all.
- **Security work can stay fast.** Vulnerability PRs can bypass ordinary
  schedules and throttles while still landing in the same PR-review workflow.
- **Policy stays centralized.** The shared preset can standardize labels, PR
  creation timing, security behavior, and review expectations without forcing
  every repo into identical local config.

## Cons

- **Renovate cannot prove dead code.** It can tell us a dependency exists and has
  an update. An agent can gather evidence that it appears unused. Final removal
  needs tests, code review, and usually a separate removal PR.
- **Regex managers can lie.** Custom managers are powerful but fragile. A regex
  can match the wrong value, miss a real value, or silently stop matching after a
  file format changes.
- **Custom datasources create ownership.** Once we invent a release feed adapter,
  we own its semantics, auth story, schema drift, and test coverage.
- **Post-upgrade tasks raise trust.** Codemods and generated-file updates can be
  useful, but they execute commands in Renovate's context and can produce broad
  diffs. They need strong file filters, tests, and a clear rollback path.
- **PR-only operation can hide queues.** If we never open the Dashboard, agents
  need another way to inspect suppressed, rate-limited, pending, or delayed
  updates through logs, dry runs, or periodic audits.
- **Major upgrades can become architecture work.** Renovate should not smuggle a
  framework migration into a routine dependency PR. It should surface the need
  and let an agent write a proposal.
- **Hosted behavior may lag docs.** Mend-hosted Renovate can trail the latest
  OSS release. Do not promise brand-new options until validation and job logs
  show the hosted environment supports them.

## Recommended Operating Model

### Lane 1: Routine PR Inbox

Use the current default stance:

- `dependencyDashboard: false`
- `prCreation: "not-pending"`
- low concurrency limits
- grouped minor/patch updates
- no default automerge
- clear `dependencies` and `agent-review` labels

Agents should review open Renovate PRs from GitHub PR state. The Dashboard should
not be required for normal operation.

Important caveat: official Renovate docs recommend enabling the Dependency
Dashboard when `minimumReleaseAge`, `prCreation: "not-pending"`, and
`internalChecksFilter: "strict"` suppress branch/PR creation, because the
Dashboard shows pending updates. Our no-dashboard stance means agents need an
alternate visibility check: dry-run evidence, Renovate logs, and periodic
consumer-repo audits.

### Lane 2: Security Fast Lane

Security and vulnerability PRs should stay separate from routine noise:

- keep immediate PR creation for vulnerability alerts
- bypass ordinary schedules and release-age delays where Renovate supports it
- label security PRs in a way that agents can query from the PR list
- require agent summary of advisory, affected package, reachable usage, CI state,
  and recommendation

Candidate future config: evaluate `osvVulnerabilityAlerts` after confirming the
current Renovate version and official behavior for the hosted environment.
Treat it as experimental: official docs currently mark OSV alerts as
experimental, direct-dependency-oriented, and limited to specific datasources.

### Lane 3: Major Upgrade Review

Major PRs should trigger analysis, not automatic migration:

1. Agent reads the PR metadata and changed package list.
2. Agent classifies each bump as high, medium, or low risk.
3. For high-risk packages, agent searches the repo for actual usage.
4. For framework, runtime, or `0.x` bumps, agent queries current package docs
   with Context7 or another authoritative docs source.
5. Agent posts a PR comment with:
   - risk matrix
   - apparent usage or dead-dependency candidates
   - breaking-change notes with source links
   - test/CI status
   - recommendation: merge, defer, close, remove, or open refactor issue

Major architecture refactors should become follow-up issues or comments, not
hidden edits inside the Renovate branch.

### Lane 4: Dead Dependency Investigation

Treat "package dead code manager" as "dead dependency candidate workflow."

Renovate supplies the trigger: this package is present and has a meaningful
update. The agent supplies the investigation:

- search imports and require calls
- search config files, scripts, task runners, plugin registration, and docs
- inspect lockfile and workspace usage
- run existing dependency tools when present, such as `knip`, `depcheck`,
  language-specific analyzers, or repo-local tests
- distinguish runtime dependency, build dependency, dev-only tool, transitive
  dependency, and unused direct dependency

If the dependency appears unused, the agent should open a separate removal PR or
issue. Do not mix removal into the original Renovate update unless the repo
owner has explicitly chosen that behavior.

### Lane 5: Custom Manager Expansion

Use custom managers only after a coverage audit finds repeated versioned
references that Renovate should manage.

Adoption bar:

- the reference exists in at least two consumer repos, or it is security-critical
- the datasource is authoritative
- replacement semantics are deterministic
- fixture tests prove the regex extracts the intended value
- `renovate --dry-run=extract` or `--dry-run=lookup` proves detection before the
  rule enters shared policy
- if package rules depend on the extracted dependency, the dry run proves the
  grouping, labels, and PR behavior too

Good candidates:

- Docker image tags or digests in nonstandard files
- tool versions in Makefiles or scripts with explicit `# renovate:` comments
- runtime pins in devcontainers or CI variables
- EOL-tracked infrastructure versions

Bad candidates:

- prose that merely mentions a version
- generated files that should be regenerated by another tool
- values that require semantic code understanding to replace
- repo-specific one-offs that would make the shared preset noisy

### Lane 6: Post-Upgrade Tasks And Codemods

Use `postUpgradeTasks` as a repo-local experiment, not as shared policy.

These tasks can be legitimate when a repo needs generated files or codemods to
make dependency PRs reviewable. They are also the sharpest edge in this design:
commands require runner-level allowlists, may need shell execution, and can
create broad diffs. If adopted, require:

- repo owner approval
- narrow `allowedCommands`
- no broad shell execution by default
- precise `fileFilters`
- strong CI coverage
- a rollback path

The shared preset should describe the review expectation, not ship generic
command execution.

### Lane 7: Refactor Proposal Loop

When a Renovate PR reveals an outdated pattern, the agent should write a proposal
instead of doing a broad refactor by default.

Examples:

- "This Next.js major suggests replacing deprecated middleware conventions."
- "This TypeScript bump exposes compiler option drift."
- "This library appears unused and can probably be removed."
- "This framework migration needs an architecture plan."

The proposal should include code references, package docs, risk, expected tests,
and a recommendation for or against doing the work now.

## What Belongs Where

| Idea | Shared Preset | Repo-Local Experiment | Agent Workflow | Deferred |
| --- | --- | --- | --- | --- |
| PR labels and PR-inbox stance | Yes | No | Yes | No |
| Major-risk review comment | Metadata only | Maybe | Yes | No |
| Dead dependency investigation | No | Maybe | Yes | No |
| Custom managers for repeated version pins | After evidence | Yes first | Yes | No |
| Custom datasources | Rarely | Yes first | Yes | Usually |
| `postUpgradeTasks` codemods | No by default | Only with owner | Yes, proposal first | Usually |
| Dashboard approvals for majors | No | Maybe | No | Usually |
| Self-hosted fleet observability | No | No | Audit only | Yes |

## Near-Term Recommendation

Do not immediately expand `default.json` into a broad custom-manager or codemod
system.

Do these first:

1. Keep the Dashboard out of the normal workflow.
2. Write an agent Renovate PR review prompt that produces a risk matrix, dead
   dependency candidates, and refactor proposals.
3. Add a consumer-repo sampling workflow that finds unmanaged versioned
   references.
4. Add fixture/dry-run expectations before any shared custom manager.
5. Evaluate labels for majors, security, and possible dead dependency candidates
   so agents can query PRs without opening every PR.
6. Evaluate explicit `internalChecksFilter: "strict"` alongside the existing
   `minimumReleaseAge` and `prCreation: "not-pending"` policy.
7. Evaluate `osvVulnerabilityAlerts` and security labels with official docs
   before changing shared config.

## Evidence Strength

Do not overstate the public pattern.

Confirmed strong evidence:

- Marco Lancini documents a Renovate PR review routine that invokes a skill,
  greps source usage, queries Context7 for framework breaking changes, and posts
  a read-only risk matrix as a PR comment.
- Jamie Tanna documents a Renovate config agent that uses current docs,
  `renovate-config-validator`, and Renovate dry runs to check proposed config.

Confirmed weaker evidence:

- Some public repos co-locate Context7 with `renovate-review` and
  `renovate-migrate` skills in their agent config. That shows the workflow shape
  is emerging, but it is not proof that those repos run the full automation.

## Sources And Evidence Leads

- Official Renovate regex manager docs: https://docs.renovatebot.com/modules/manager/regex/
- Official Renovate custom datasource docs: https://docs.renovatebot.com/modules/datasource/custom/
- Official Renovate `postUpgradeTasks`: https://docs.renovatebot.com/configuration-options/#postupgradetasks
- Official Renovate `prCreation`, `dependencyDashboard`, `internalChecksFilter`,
  and `vulnerabilityAlerts`: https://docs.renovatebot.com/configuration-options/
- Official Renovate Dependency Dashboard docs:
  https://docs.renovatebot.com/key-concepts/dashboard/
- Official Renovate dry-run docs: https://docs.renovatebot.com/self-hosted-configuration/#dryrun
- Official Renovate allowed command docs:
  https://docs.renovatebot.com/self-hosted-configuration/#allowedcommands
- Jamie Tanna on testing Renovate config changes:
  https://www.jvt.me/posts/2026/03/08/renovate-test-config/
- Jamie Tanna on building an agent for Renovate config:
  https://www.jvt.me/posts/2026/01/23/agentic-renovate/
- Marco Lancini on AI triage of Renovate PRs with Context7-backed breaking
  change lookup:
  https://blog.marcolancini.it/2026/blog-automating-security-operations-with-ai-triage-renovate/
- Secustor on custom datasources:
  https://secustor.dev/blog/renovate_custom_datasources/
- Public examples of repos co-locating Context7, Renovate review, and Renovate
  migration skills:
  https://github.com/commercetools/test-data/blob/main/CLAUDE.md
  https://github.com/commercetools/merchant-center-application-kit/blob/main/CLAUDE.md

## Open Questions

- Which consumer repositories should be sampled first for unmanaged versioned
  references?
- Should major updates receive an explicit `breaking` or `major-upgrade` label
  in shared policy?
- Should vulnerability PRs include a commit-message suffix or label that makes
  security history queryable outside GitHub?
- Which dependency analyzers should agents prefer per ecosystem?
- Should agent-generated refactor proposals be PR comments, GitHub issues, or
  both?
