---
title: Renovate as Combinator and Dead Code Agent - Detailed Workflow Proposal
date: 2026-06-20
status: proposal-draft
authoritative: false
owner: Patrick
related: docs/inspiration/agent-governed-renovate-change-agent.md
mend_policy: >
  Any Mend-hosted or paid Mend feature mentioned here is unavailable for this
  repo. We are not paying for Mend.
---

# Renovate as Combinator and Dead Code Agent

This document extends `agent-governed-renovate-change-agent.md` with concrete
workflow designs for three capabilities the parent proposal names but does not
fully specify:

1. **Renovate as combinator** - coordinating multiple change signals into a
   single actionable workflow
2. **Dead dependency investigation** - detecting unused packages as a first-class
   agent task triggered by Renovate
3. **Major upgrade to architectural proposal** - converting significant version
   bumps into GitHub issues for human and agent consideration rather than silent
   PR merges

The dashboard is out of scope for the default workflow. All normal operating
surfaces are GitHub PRs, PR comments, and GitHub issues.

---

## The Combinator Concept

The word "combinator" is being used precisely. Renovate does not merely open
PRs - it combines:

| Input | What Renovate produces |
|---|---|
| Package manifest (npm, pypi, go.mod, etc.) | Dep name, current version, latest version, update type |
| Release datasource | Release notes, changelog URL, release timestamp |
| Optional package metadata | Merge confidence score, adoption %, passing rate |
| Repository state | Branch age, CI results, conflict status, open PR count |
| Policy (packageRules, schedule, labels) | Which PRs get which behavior |

An agent sitting on top of Renovate can further combine:
- Package metadata -> Context7 or docs API -> breaking-change summary
- Package name -> repo import scan -> usage evidence
- Package name + update type -> dead dependency heuristic
- Major bump + framework type -> architectural implication flag
- CVE metadata -> affected code paths -> reachability evidence

The goal is to make every Renovate PR a self-contained decision packet. A
reviewer - human or agent - should have enough PR metadata, source links, and
evidence pointers to decide whether to merge, defer, investigate, or escalate.

---

## Why Renovate Is (and Is Not) a Dead Code Manager

### What Renovate Actually Does

Renovate finds versioned references and proposes version changes. It has no
understanding of whether code calls the updated package. It cannot run the
codebase. It cannot prove a package is unused.

### What Makes It a Dead Code *Trigger*

A meaningful update is a natural checkpoint: "we're about to make a change -
does this package actually belong here?" Renovate opens the conversation.

An agent answers it:

```
Tool needed: grep / AST scan / depcheck / knip / language-specific analyzer
Input: package name from Renovate PR
Questions:
  1. Does any source file import or require this package?
  2. Does any script, Makefile, or config reference it by name?
  3. Does the lockfile show it as a transitive dep only (not a direct dep)?
  4. Is it only in devDependencies but never called from test or build scripts?
  5. Does a language-specific analyzer (knip, depcheck, pip-autoremove, go mod tidy) flag it?
```

If answers 1-4 are all "no/only transitive" and answer 5 is "flagged unused,"
the agent opens a **separate removal PR** or **GitHub issue** - not a Renovate
branch - with its evidence. The original Renovate PR is noted and linked.

**Evidence boundary:** this event trigger is a proposed design. Public examples
support the separation principle - flag in a Renovate PR comment, remove in a
separate artifact - but no production example has been found for this exact
Renovate-PR-to-removal-issue workflow.

### The Separation of Concerns

Renovate PR = "this version is available, here is the diff"
Agent comment on PR = "this package appears unused - recommend closing this PR
and opening a removal issue instead"
Follow-up issue = "remove {package} - evidence: {grep output, depcheck result,
no test imports}"

This separation matters because:
- Renovate's branch only changes the version string. Mixing removal into that
  branch makes the diff ambiguous and the review harder.
- If the removal investigation is wrong, the Renovate PR should still be
  available to merge once the dependency is confirmed needed.
- Issues are the right surface for architectural discussions that need broader
  input before any code changes.

> **This event-driven trigger design has no current production analogue.**
> The separation of concerns is documented: Marco Lancini flags `[DEAD]` as
> a verdict in the PR comment; Ona Automation opens one small removal PR per
> daily Knip run, independent of any Renovate event. The specific chain -
> "Renovate PR opens -> dead-dep analysis runs -> separate GitHub issue created"
> - is this proposal's original design. Pilot manually before automating.

---

## Tooling Inventory for Dead Dependency Investigation

An agent conducting the investigation should prefer tools in this order,
falling back when the ecosystem doesn't have a primary tool:

| Ecosystem | Primary tool | Fallback |
|---|---|---|
| Node/npm | `knip` | `depcheck` |
| Python | `deptry` | `pip-autoremove`, grep |
| Go | `go mod tidy --diff` | grep for import paths |
| Ruby | `bundle-audit`, gem usage grep | grep |
| Rust | `cargo udeps` | grep |
| Java/Maven | `mvn dependency:analyze` | grep |
| Docker images | check if base image is referenced anywhere | N/A |
| GitHub Actions | check if the action is called from any workflow | N/A |

The investigation output should always include:
- Tool version used
- Command run (for reproducibility)
- Raw output excerpt
- Agent interpretation: "appears unused," "transitively used," "used in test only,"
  "used in build only," "confirmed used in runtime code"

---

## The Major Upgrade -> Architectural Proposal Workflow

### The Problem

A major version bump of a framework or core library often implies:
- API deprecations that require code changes
- Configuration format changes
- New patterns replacing old ones
- Migration guides with multi-step instructions

Merging such a PR without investigation silently introduces breaking changes.
But blocking the PR with a comment loop is slow and loses context.

### The Proposed Workflow

```
Trigger: Renovate opens a PR with updateType=major OR isBreaking=true

Step 1: Agent risk classification
  - Query: is this a framework? (React, Next.js, Django, Rails, Spring, etc.)
  - Query: is this a runtime? (Node.js, Python, JVM, etc.)
  - Query: does the changelog mention "breaking", "deprecated", "migration"?
  -> Classify: HIGH / MEDIUM / LOW architectural impact

Step 2a (LOW): Post risk matrix comment, automerge eligible after CI
Step 2b (MEDIUM): Post risk matrix comment, hold for human or agent approval
Step 2c (HIGH): Do not merge the Renovate PR yet. Open a GitHub issue instead.

Step 3 (HIGH only): Agent opens a GitHub issue:
  Title: "[Architectural Review] Upgrade {package} from {from} to {to}"
  Body:
    - What changed: breaking-change summary (from Context7 or changelog)
    - Current usage in this repo: grep/AST summary
    - Recommended action: migrate / skip this major / defer
    - Affected files: list
    - Migration guide link
    - Related Renovate PR: #{number}
    - Renovate PR status: hold pending this issue's resolution

  > **No production example found for this specific step.** The closest
  > documented analogues post structured PR comments (Lancini's `renovate-review`
  > skill) or send Slack notifications. GitHub Issue creation as the output
  > artifact for a HIGH-risk major bump is this proposal's original design.
  > It should be piloted manually before automation is built.

Step 4: Issue outcome determines PR fate:
  - "Do it now" -> agent opens a migration PR, Renovate PR is closed
  - "Defer" -> Renovate PR closed with ignore comment for N months
  - "Skip this major" -> renovate-ignore directive added, issue closed
```

### The Renovate Config Side

```json
{
  "packageRules": [
    {
      "matchUpdateTypes": ["major"],
      "addLabels": ["major-upgrade", "agent-review-required"],
      "automerge": false,
      "prPriority": 5
    },
    {
      "matchUpdateTypes": ["major"],
      "matchCategories": ["framework"],
      "addLabels": ["major-upgrade", "architectural-review", "agent-review-required"],
      "automerge": false,
      "prBodyNotes": [
        "**Architectural review required.** This is a framework major upgrade.",
        "An agent will analyze usage and breaking changes and may open a separate issue.",
        "Do not merge until the architectural review is complete."
      ]
    }
  ]
}
```

The key constraint: the Renovate PR for a HIGH-impact major stays open as a
reference point but is labeled "do-not-merge" until the separate issue resolves
it. This keeps the diff visible without merging prematurely.

---

## The Context7 Integration Pattern

### What Context7 Is

Context7 is an MCP-based documentation resolution service. Given a package name
and version, it can fetch current package documentation for review-time use.

### Why This Is Valuable Here

When an agent reviews a Renovate PR for a major upgrade, it needs to know:
- What the new API looks like
- What was deprecated or removed
- What the migration path is

Calling Context7 with `{depName}@{toVersion}` at review time can produce a
documentation snapshot closer to the target version than the LLM's training
data alone.

### Workflow Pattern (from Marco Lancini's documented implementation, May 2026)

```
On: Renovate PR opened with label=major or breaking

Agent step 1: Extract depName and toVersion from PR metadata
Agent step 2: Call Context7 resolve-library-id(depName)
Agent step 3: Call Context7 get-library-docs(id, topic="migration breaking changes")
Agent step 4: Read actual repo usage (imports, config, test files)
Agent step 5: Cross-reference docs against usage
Agent step 6: Synthesize:
  - "Docs say {feature} is removed; repo uses it at {files}"
  - "Docs say use {newAPI} instead of {oldAPI}; repo uses {oldAPI} at {files}"
Agent step 7: Post structured comment OR open architectural proposal issue
```

### Relevant Evidence Found

Reported evidence from the research pass:
- Marco Lancini's published `renovate-review` skill text explicitly states:
  *"Query Context7 for documented breaking changes. Do this only for framework
  bumps and 0.x bumps - it's not worth the token cost for minor lucide-react."*
  This is a direct quote from a published skill, not an inference.
- commercetools CLAUDE.md files co-locate a `/renovate-review` skill with a
  `context7` MCP server configuration - consistent with the Lancini pattern,
  but the skill internals are not exposed in the CLAUDE.md file. This shows
  the workflow shape is present, not that context7 is called internally.

This is an emerging pattern, not a widespread established practice. It is worth
tracking and piloting.

---

## Pros and Cons: Renovate as Generic Change Agent

### Strong Pros

**Canonical PR surface.** Routine work lands in GitHub PR state. No separate
dashboards, no separate tools, no hunting through issues. Agents and humans
work the same queue.

**Deterministic triggers.** A version changes -> a PR appears. The trigger is
mechanical and auditable. There is no question of "why did this happen" - the
git diff is the answer.

**Rich metadata available.** Renovate PRs can carry datasource, manager, update
type, changelog URL, release notes where available, and semantic version type.
Optional features such as merge-confidence badges can add more signal. This is
more structured context than most handwritten review requests.

**Versioned reference coverage.** With custom managers, Renovate can index
pinned versions in Dockerfiles, shell scripts, CI variables, devcontainers,
Makefiles, Terraform, Helm, documentation, and arbitrary text files - anywhere
a version string appears with deterministic replacement semantics.

**Security fast lane is built in.** Existing `vulnerabilityAlerts` behavior can
route security fixes through the same PR surface as routine updates. OSV-backed
alerts are a candidate extra signal, but official docs currently mark them
experimental and limited to supported direct dependencies.

**Shared policy, per-repo behavior.** The central shared preset controls PR
timing, labels, stability gates, and automerge policy. Consumer repos inherit
without per-repo config. Changing security behavior for all repos is one config
change.

### Real Cons

**Renovate cannot analyze code.** It finds version strings and compares them to
feeds. It does not know if a package is called. It does not know if a migration
is needed. It does not know if an upgrade would break tests it hasn't run. The
"dead code manager" and "architectural proposal" workflows require agent tooling
ON TOP of Renovate, not inside Renovate.

**`postUpgradeTasks` is a sharp edge.** Running scripts in Renovate's execution
context creates a command injection surface. The security implications of
allowing arbitrary shell commands - especially in a shared preset that applies
to all consumer repos - are serious. Commands need explicit allowlists on every
self-hosted runner. Mend-hosted command allowlisting is unavailable for this
repo because we are not going to pay for Mend; Enterprise/AppSec-only
allowlisting should not be promoted into our shared policy.

**Custom managers can silently stop working.** A regex that matched a file
format in 2025 may not match after a toolchain update. There is no automatic
alert when a custom manager's regex fails to find anything - Renovate just
stops proposing updates for that dependency. This requires periodic dry-run
audits.

**Regex can match the wrong thing.** A pattern written for one file structure
may overfit, capturing version strings that are examples, documentation, or
comments rather than live pins. Every custom manager needs fixture tests.

**"Never open the dashboard" means dark updates exist.** When `minimumReleaseAge`
and `prCreation: "not-pending"` suppress a PR, the update sits in a pending
state that is only visible in the Dependency Dashboard or Renovate logs. Without
a dashboard check or periodic `--dry-run=lookup`, there is no way to see what
is suppressed. This is a real blind spot that the agent operating model must
account for through scheduled dry-run audits.

**Major-to-architectural-proposal conversion adds latency.** If a major upgrade
triggers an investigation issue rather than a mergeable PR, the upgrade is
delayed until the issue resolves. For security-tagged majors, this can be the
wrong tradeoff. The classification logic (HIGH/MEDIUM/LOW impact) must be
sound to avoid false positives that turn routine major bumps into open-ended
architectural review tickets.

**Pattern evidence is thin.** The Context7 + Renovate + agent audit workflow
is emerging and documented by a small number of practitioners. The dead-code-on-
update-trigger pattern is not widely implemented - it is a natural extension of
what these practitioners describe, but it has not been documented as a
production workflow. We are designing something that may be ahead of documented
practice.

---

## What We Would Not Use Renovate For

Even within this expanded model, some things should not run through Renovate:

| Not a Renovate job | Why |
|---|---|
| Removing unused packages | Renovate opens a removal PR only if it detected the dependency via a manager and the removal has deterministic semantics. Ad-hoc removal should be a separate PR initiated by the agent, not by Renovate. |
| Rewriting code to new API patterns | `postUpgradeTasks` can run codemods, but this is a per-repo experiment, not shared policy. The refactor is proposed as an issue first. |
| Architecture reviews without a version trigger | If the concern is "this library is outdated but hasn't published a new version," Renovate has nothing to say about it. Agent-initiated audits are separate from Renovate's PR queue. |
| Dependency security audits on demand | `npm audit`, `pip-audit`, `govulncheck`, etc. are separate tools. Renovate reacts to published releases. A security audit finding for an already-current package is outside Renovate's scope. |
| Monorepo cross-package consistency checks | Renovate can track `updateInternalDeps`, but the agent logic for "all internal packages should use the same external version" is separate tooling. |

---

## Near-Term Experiments Worth Running

These are ordered by expected value and implementation complexity:

### Experiment 1: Label-driven agent triage (low complexity, high value)
Keep the shared preset's `major-upgrade` label and existing security labels,
then validate that agents can query PR lists by label without reading diff
content. Measure whether this reduces triage time before adding more labels
such as `architectural-review` or `security-fast-lane`.

### Experiment 2: Dead dependency trigger on one consumer repo (medium complexity)
On one real consumer repo, when Renovate opens a major PR, manually run
`knip` or `depcheck` and post the output as a comment. Do this five times.
Document what the tool output looks like, how often packages are flagged unused,
and what action was taken. Use this evidence before automating.

### Experiment 3: Context7 review on one real major PR (medium complexity, unclear value)
Pick one upcoming major framework upgrade (Next.js, React, Django, etc.) in a
consumer repo. Manually run the Context7 -> usage scan -> risk matrix workflow
described above. Document whether the output was actionable or obvious. Decide
whether to automate based on that evidence.

### Experiment 4: Dry-run audit workflow for suppressed updates (medium complexity)
Write a GitHub Actions workflow that runs `renovate --dry-run=lookup` against
the consumer repo and posts the output as an artifact or issue comment. Run it
monthly. This replaces the Dependency Dashboard for visibility into suppressed
or pending updates.

---

## Open Questions for Further Research

1. **For this repo specifically:** Mend-hosted command allowlisting is
   unavailable because we are not using or paying for Mend. Any idea that
   depends on Mend-hosted `postUpgradeTasks` allowlisting is out of scope. A
   self-hosted Renovate experiment would be a separate decision.
2. What is the exact agent workflow commercetools uses when `renovate-review`
   and Context7 appear in the same CLAUDE.md?
3. Are there public examples of a Renovate PR triggering a GitHub issue (not
   just a PR comment) for architectural review?
4. Which dependency analyzers are most reliable across multiple ecosystems,
   and do any have native Renovate integrations?
5. What happens to the Renovate PR when we want to "hold" it pending an
   architectural review issue - use a label, a `renovate-ignore` comment, or
   close and reopen?

---

*Written 2026-06-20. Based on existing proposal analysis, Marco Lancini's
documented triage workflow, and commercetools CLAUDE.md evidence leads.
Jamie Tanna's agentic Renovate work is relevant as evidence that building
agents on top of Renovate tooling is tractable - his specific agent writes
valid Renovate *config*, not reviews Renovate *PRs*. Subagent critique at
`docs/inspiration/subagents/renovate-combinator-critique.md`.*
