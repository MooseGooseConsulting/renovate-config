# Skills Research for Renovate Config

Search date: 2026-06-20

This note summarizes the local skill surfaces relevant to this repository. It is
research only; it does not change Renovate configuration.

## What a Skill Is Here

An agent skill is a small directory that teaches an agent how to handle a
specific kind of work. The required file is `SKILL.md`, with YAML frontmatter
containing at least `name` and `description`, followed by Markdown instructions.

In this environment, the `description` is load-bearing: it is how the agent
decides whether the skill applies before the body is read. The body is the
workflow once the skill has triggered. A skill may also include:

- `references/` for larger docs loaded only when relevant.
- `scripts/` for deterministic or repeated operations.
- `assets/` for templates or files used in outputs.
- optional agent/UI metadata, depending on the tool surface.

The useful mental model is: skills are task-specific operating guides and
tooling bundles, not project documentation dumps. Project truth should live in
repo docs; a repo-local skill should route agents to safe entrypoints, validation
commands, and non-obvious workflow constraints.

## Skill Roots Inspected

Inspected roots:

- `D:\_projects\renovate-config\.agents\skills`
- `C:\Users\pmacl\.agents\skills`
- `C:\Users\pmacl\.codex\skills`

The repo has one repo-local skill:

- `.agents\skills\renovate-config\SKILL.md`

The user-level `.agents\skills` root contains:

- `skill-install`
- `nlm-skill`
- `skill-finder`
- `retrospective`
- `run-opencode`
- `review-claudemd`
- `claude-md-enhancer`
- `google-stitch-ui-designer`
- `doppler`
- `chat-history`
- `project-docs`

The user-level `.codex\skills` root contains bundled system skills under
`.system`:

- `imagegen`
- `openai-docs`
- `plugin-creator`
- `skill-creator`
- `skill-installer`

There is also a `llm-archiver` link under `C:\Users\pmacl\.codex\skills`, but
its target was not readable during this pass, so it was not treated as relevant
evidence for this repository.

## Relevant Local Skills

### `renovate-config`

Source: `.agents\skills\renovate-config\SKILL.md`

This is the most important repo-local skill. It says it is not official
Renovate-authored content and exists to force agents toward the official
Renovate docs snapshot and real Renovate validation before changing config.

Influence on this repo:

- Use it before any edit to `default.json`, `org-inherited-config.json`,
  consumer `renovate.json`, package rules, schedules, grouping, reviewers,
  PR throttles, or dashboard behavior.
- Refresh docs with `npm run docs:update` and read
  `.agents\skills\renovate-config\references\renovate-docs-snapshot.md` before
  making config changes.
- Validate config changes with `npm run renovate:validate`.
- Keep the shared preset public and secret-free.
- Treat Renovate PRs as the primary inbox. Do not design the workflow around
  Patrick manually opening Dependency Dashboards.
- Preserve the guardrail against combining `prCreation=approval` with
  `dependencyDashboardApproval=true`.

Rubric implication: any effectiveness rubric should not reward Dependency
Dashboard utilization as a default. The repo-local skill points in the opposite
direction: prefer `dependencyDashboard=false` unless a repo explicitly needs
dashboard tracking. The canonical rubric should treat dashboard state as
conditional evidence, not a universal maturity requirement.

### `project-docs`

Source: `C:\Users\pmacl\.agents\skills\project-docs\SKILL.md`

This skill defines the documentation authority stack:

`NORTH_STAR.md` -> `architecture.md` -> `PROGRESS.md` -> `AGENTS.md`

Influence on this repo:

- Keep `AGENTS.md` as a router, not a project encyclopedia.
- Put durable decisions in `docs/decisions/`, subsystem detail in
  `docs/components/`, long procedures in `docs/workflows/`, and history in
  `docs/history/`.
- When downstream docs disagree with upstream docs, the downstream doc is the
  one to fix unless the maintainer explicitly changes the upstream authority.
- Avoid duplicating project identity or policy across docs.

This matters because skills and repo docs can easily drift into doing the same
job. The skill should carry workflow triggers and guardrails; the repo docs
should carry the project authority.

### `skill-creator`

Source: `C:\Users\pmacl\.codex\skills\.system\skill-creator\SKILL.md`

This system skill gives the clearest definition of a skill in this environment.
It emphasizes that skills are modular folders with a required `SKILL.md`,
optional `scripts/`, `references/`, and `assets/`, and concise instructions
designed for another agent to use.

Influence on this repo:

- If this repo grows more repo-local skills, each one should have a specific
  trigger and a small workflow.
- Do not turn a skill into a compact copy of `NORTH_STAR.md`, architecture, or
  rubric docs.
- Put detailed Renovate docs in references, not the main `SKILL.md`.
- Use scripts for repeatable validation or extraction instead of asking agents
  to retype fragile commands.

### `skill-finder` and Best Practices

Sources:

- `C:\Users\pmacl\.agents\skills\skill-finder\SKILL.md`
- `C:\Users\pmacl\.agents\skills\skill-finder\references\best-practices-checklist.md`

This skill is for query-driven skill search and quality evaluation. Its
best-practices checklist is useful even when not installing anything.

Influence on this repo:

- Judge candidate skills by the actual `SKILL.md`, not by folder name or repo
  popularity.
- Prefer specific descriptions that say what the skill does and when to use it.
- Keep `SKILL.md` concise, generally under 500 lines.
- Use progressive disclosure: short skill body, task-specific references.
- Include clear workflows and validation loops.
- Avoid time-sensitive facts in skill bodies unless they are cheap to refresh.

### `skill-install` and `skill-installer`

Sources:

- `C:\Users\pmacl\.agents\skills\skill-install\SKILL.md`
- `C:\Users\pmacl\.codex\skills\.system\skill-installer\SKILL.md`

These skills cover installing and consolidating skills across tools. The local
`skill-install` guidance says one physical user-authored copy should live under
`~\.agents\skills`, with junctions or tool-specific exceptions only where a
client requires them. The system `skill-installer` covers installing Codex skills
from curated or GitHub sources.

Influence on this repo:

- Treat `.agents\skills` as a live discovery surface, not an archival dump.
- Avoid copy-pasting the same skill into several tool roots.
- Keep repo-local skills in the repo only when they encode repo-specific
  behavior.
- Do not edit bundled `.codex\skills\.system` skills as if they were project
  source.

### `chat-history` and `retrospective`

Sources:

- `C:\Users\pmacl\.agents\skills\chat-history\SKILL.md`
- `C:\Users\pmacl\.agents\skills\retrospective\SKILL.md`

These are relevant when auditing what an earlier agent actually did or when
turning session lessons into improved process.

Influence on this repo:

- For "did this actually land?" or "was the plan followed?" questions, inspect
  transcript, branch, diff, and PR evidence.
- Do not answer from memory when local session logs or GitHub state can prove
  the claim.
- Retrospective work should produce actionable lessons and not displace the
  user's requested evaluation.

### `doppler`

Source: `C:\Users\pmacl\.agents\skills\doppler\SKILL.md`

This is not Renovate-specific, but it matters because Renovate config can touch
registries, host rules, and tokens.

Influence on this repo:

- Any work involving secrets, tokens, `.env` files, CI credentials, or Doppler
  secret injection must load the Doppler skill first.
- This repo's shared Renovate preset should remain public and secret-free.
- Host tokens and registry passwords do not belong in this repository.

## Relevant Runtime Plugin Skills

These were not under the three requested skill roots, but they are available in
the current Codex runtime through plugin caches and are directly relevant to PR
follow-through and review workflows.

### GitHub PR Follow-Through

Sources:

- `github:github`
- `github:gh-address-comments`
- `github:yeet`

Influence on this repo:

- Use the umbrella GitHub skill for general repository, issue, or PR triage.
- Use `gh-address-comments` when review-thread state matters. It explicitly
  warns that flat connector comments are not enough for unresolved inline review
  threads; use thread-aware GraphQL data for `reviewThreads`, `isResolved`, and
  inline anchors.
- Use the publish flow for branch, commit, push, and PR creation, but obey this
  repo's active instruction that completed scoped asks should create a
  non-draft PR. That overrides the generic `yeet` default of draft PRs.
- Stage only intended files in mixed worktrees. This repo may have unrelated
  agent changes in progress.

### Code Review

Sources:

- `coderabbit:code-review`
- `superpowers:requesting-code-review`
- `superpowers:receiving-code-review`
- `superpowers:verification-before-completion`

Influence on this repo:

- For explicit "review" requests, lead with findings and risks, then summary.
- CodeRabbit can be used when the user asks for PR feedback, code quality
  checks, or fix-review cycles.
- Treat external review feedback as input to verify against the codebase, not as
  orders to implement blindly.
- Before claiming work is complete, run fresh verification and report the actual
  evidence.

### Agent and Subagent Workflow

Sources:

- `superpowers:dispatching-parallel-agents`
- `superpowers:subagent-driven-development`
- `superpowers:writing-plans`

Influence on this repo:

- At the start of substantial work, consider whether independent investigation
  lanes should run in parallel.
- When no subagent launch tool is available, preserve the same discipline by
  splitting the work into independent searches and keeping write paths scoped.
- For multi-step work, make the plan concrete enough to verify, but keep docs
  and rubrics high-level enough not to overspecify implementation detail.

## Public Renovate Skill Search

Bounded searches performed:

- GitHub code search: `filename:SKILL.md org:renovatebot`
- GitHub code search: `filename:SKILL.md org:mend renovate`
- GitHub code search: `filename:SKILL.md renovate Claude skill`
- Web search for Renovate `SKILL.md` and Claude/agent skills.

Result: no official Renovate-authored `SKILL.md` was found in `renovatebot` or
Mend-owned search scopes, and no obvious public Renovate-specific Claude/agent
skill was found in the bounded public search.

Adjacent public evidence found:

- `renovatebot/renovate` discussion #41841 asks about Renovate support for
  updating `skills.sh`: https://github.com/renovatebot/renovate/discussions/41841
- `renovatebot/renovate` discussion #41861 asks about `skills-lock.json`:
  https://github.com/renovatebot/renovate/discussions/41861
- `renovatebot/renovate` discussion #42507 discusses `apm.yml` and agent-skill
  discovery/package-manager ideas:
  https://github.com/renovatebot/renovate/discussions/42507

Interpretation: there is public Renovate-adjacent interest in managing agent
skill artifacts as dependencies, but that is different from an official
Renovate-authored skill teaching agents how to configure Renovate.

## Wisdom for This Repo's Docs and Rubrics

- Keep skills procedural and docs authoritative. Skills should say how to work;
  repo docs should say what is true.
- Make triggers explicit. If an agent should use a skill for shared Renovate
  policy, the frontmatter description must say so.
- Prefer PR-centric Renovate operations because the repo-local skill says
  Renovate PRs are the inbox. Reconcile any rubric language that rewards
  dashboard use as a default.
- Make rubrics evidence-driven. A useful rubric should point reviewers to config
  files, PR history, issue state, and validation commands instead of relying on
  impressionistic scoring.
- Keep always-loaded agent guidance short. Put long agent procedures in
  `docs/workflows/` or skill references.
- Avoid duplicated doctrine across `AGENTS.md`, repo-local skills, rubrics, and
  architecture docs. Duplication is where agent instructions rot.
- Validate before publishing. For config, use Renovate validation. For skills,
  use skill validation where available. For PRs, inspect diff, run checks, and
  confirm review-thread state when comments are involved.
