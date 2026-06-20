---
title: Critique — Renovate as Combinator and Dead Code Agent
date: 2026-06-20
status: subagent-report
authoritative: false
sources_read: 7
critiques: docs/proposals/renovate-as-combinator-and-dead-code-agent.md
---

# Critique: "Renovate as Combinator and Dead Code Agent"

Requested to stress-test the proposal. Seven URLs fully read; four GitHub searches;
three Renovate commit diffs; two GitHub issue discussions reviewed.

---

## Sources Read

| URL | Status | Summary |
|-----|--------|---------|
| https://blog.marcolancini.it/2026/blog-automating-security-operations-with-ai-triage-renovate/ | **Fully read** | Marco Lancini's May 2026 post documenting a Claude Code Routine + `renovate-review` Skill. Fires on `[RENOVATE]`-prefixed PR open events. Classifies risk, greps for imports, calls Context7 for framework bumps. Output is a structured PR comment only — no issue creation, no file edits in the cloud version. |
| https://www.jvt.me/posts/2026/01/23/agentic-renovate/ | **Fully read** | Jamie Tanna (Mend Community Manager) documenting a Go agent that helps users write valid Renovate *config* — not review Renovate *PRs*. Tools: `validate_config`, `list_docs`, `run_renovate` (dry run). No dead-code analysis, no Context7, no GitHub Issues. Scope is entirely different from what earlier notes cited it for. |
| https://github.com/commercetools/test-data CLAUDE.md | **Fully read** | Lists context7 and playwright as MCP servers; lists `/renovate-review`, `/renovate-migrate`, `/repo-maintenance-node` as skills. Does not expose skill internals. |
| https://github.com/commercetools/merchant-center-application-kit CLAUDE.md | **Fully read** | Content is identical to the test-data file. Same MCP servers, same skill list. The separate `/renovate-migrate` skill is significant — migration is a separate invocation from review. |
| https://docs.renovatebot.com/mend-hosted/hosted-apps-config/ | **Fully read** | postUpgradeTasks blocked by default on the Mend-hosted app. A pre-approved set of undocumented commands exists. Enterprise/Appsec customers can request an allowlist on request. Free-tier users cannot add custom commands. |
| Ona Automation knip workflow (Feb 2026) | **Fully read** | Runs Knip daily, independent of Renovate. Agent picks one finding, opens one small auto-merge PR. The event-driven Renovate trigger is absent — this runs on its own schedule. |
| GitHub issue renovatebot/renovate#14244 (2022) | **Partial** | Users requested "Renovate open issues instead of PRs for major upgrades." Response: Dependency Dashboard is the supported path. No plan for native issue creation. |

---

## Marco Lancini Workflow (Exact)

The skill fires on `PR_open` for PRs with `[RENOVATE]` title prefix.

**Allowed tools declared in the skill:**
```
Bash(gh api:*), Bash(gh pr view:*), Bash(gh auth status:*),
Bash(ls:*), Bash(cat:*), Read, Grep, Glob, Edit
```

**Step-by-step:**
1. Fetch PR metadata and diff via `gh api`
2. Detect stack (JS/TS or Python) from PR title; detect project by matching changed file paths against `.github/labeler.yml` globs
3. Parse every bump; classify each into High / Medium / Low risk tiers
4. **High-risk:** grep source for imports; if zero results: flag `[DEAD]`; check installed version in lockfile; **"Query Context7 for documented breaking changes. Do this only for framework bumps and 0.x bumps — it's not worth the token cost for minor lucide-react."**
5. **Medium:** grep only, flag if dead, skip Context7
6. **Low:** skip investigation entirely, group in footer
7. Emit risk matrix as a single PR comment via `gh pr comment`

**What it does NOT do:**
- Does not open GitHub Issues
- Does not open removal PRs
- Does not call knip, depcheck, or any package analyzer
- Does not apply any code changes (cloud Routine explicitly: *"Do NOT apply any fixes. Do NOT call Edit. Do NOT modify any files."*)

**Dead dep verdict is a signal, not an action.** Example:

```markdown
| `eslint`   | `9 → 10` | — | `[DEAD]` | No `eslint.config.*`, `next lint` removed in Next.js 16 |
| `shiki`    | `3 → 4`  | — | `[DEAD]` | Listed as direct dep in `package.json` but zero source imports |
```

The `[DEAD]` flag prompts the human reviewer to investigate further.

---

## commercetools Evidence (What the Files Actually Show)

Both `commercetools/test-data` and `commercetools/merchant-center-application-kit`
have identical CLAUDE.md files:

```
MCP Servers: context7 (third-party library docs), playwright (visual UI verification)
Skills: /renovate-review, /renovate-migrate, /repo-maintenance-node
```

**What this shows:**
- context7 is configured as an available MCP server
- `/renovate-review` is a named skill — but its internals are not exposed
- `/renovate-migrate` is a SEPARATE skill for applying migrations after review
- `/repo-maintenance-node` covers dead code — also separate from renovate-review

**What this does NOT show:**
- Does not confirm that the commercetools `renovate-review` skill calls Context7 internally
- Does not reveal any GitHub Issue creation workflow
- The skill co-location with context7 is consistent with Lancini's pattern but is not proof of it

GitHub code search found 4+ additional repos co-locating `renovate-review` and `context7`
in CLAUDE.md files, but none expose their skill implementations.

---

## Dead Code + Renovate Evidence

**Lancini:** Flags `[DEAD]` in PR comment only. No automated removal. *"This is a fix candidate"* — human follow-up required.

**Ona Automation (Feb 2026):** Daily Knip runner → agent opens one small auto-merge removal PR per run. Independent of Renovate completely. The correct *principle* — separate small PRs, not big mixed ones — but the Renovate event trigger is absent.

**Renovate maintainer position (issue #1503, 2018):** Explicitly declined to add unused-dependency detection: *"I would argue that perhaps this isn't an issue for Renovate to solve."* No indication this has changed.

**Key finding:** The event-driven design ("Renovate PR opens → dead-dep analysis → separate GitHub Issue") is the proposal's original design. It is a reasonable extension of documented practice but has no production analogue.

---

## Mend-Hosted postUpgradeTasks (Exact Constraint)

From official docs:

> "In Mend-hosted Renovate apps, commands remain blocked by default but **can be allowed on-request for any paying ('Renovate Enterprise' or Mend Appsec) customers** or trusted OSS repositories."

**For this repo (free-tier Mend app):** Custom `postUpgradeTasks` commands are not available. The proposal's scoping decision (don't use postUpgradeTasks in shared presets) is correct.

The language "may not support them" in the proposal should be strengthened: for the free app tier, custom postUpgradeTasks are **not** available, not merely uncertain.

---

## Proposal Verdict — Claim by Claim

| Claim | Verdict | Notes |
|---|---|---|
| Renovate as "combinator" combining rich metadata for agent enrichment | **Conceptually sound** | Terminology is original; the concept is accurate |
| Context7 called by agents for major-version breaking-change docs | **Fully supported** | Lancini's published skill text: *"Query Context7 for framework bumps and 0.x bumps"* |
| commercetools CLAUDE.md evidences Context7 usage in renovate-review | **Partially accurate** | context7 is co-located as MCP server; skill internals are not exposed. Should be framed as "consistent with" not "evidenced by" |
| Dead dep detection triggered by Renovate PRs → separate removal artifacts | **Separation principle supported; event-trigger is original design** | Lancini flags in PR comment only; Ona uses independent schedule; no event-triggered production example found |
| Major upgrade → agent opens GitHub Issue for architectural review | **Speculative — no production analogue found** | Renovate maintainers explicitly declined native issue creation; no practitioner has documented doing this as agent behavior |
| Mend-hosted postUpgradeTasks constraint | **Direction correct; framing imprecise** | Free-tier: unavailable. Enterprise: requestable. "May not" understates the constraint |
| Jamie Tanna's work as evidence for PR review agents | **Wrong citation** | Tanna's agent writes Renovate config; it does not review Renovate PRs |

---

## Recommended Revisions

### 1. Remove Jamie Tanna citation from PR review claims
Tanna's post is about a config-writing agent, not a PR-review agent. It is useful
evidence only for "building agents on top of Renovate tooling is tractable."

### 2. Tighten commercetools evidence language
Replace "evidenced by commercetools CLAUDE.md files" with:
"consistent with the pattern Lancini documented — commercetools co-locates a
`/renovate-review` skill with a `context7` MCP server configuration."

### 3. Add a clear "ORIGINAL DESIGN" callout to dead-dep trigger
The event chain "Renovate PR opens → dead-dep analysis → separate GitHub issue"
is this proposal's original design. Label it explicitly. Proposed callout:

> **This trigger design has no current production analogue.** The separation
> of concerns (flag in PR comment, remove in separate PR) is documented by
> Lancini and Ona. The event-driven trigger is this proposal's own design.

### 4. Strengthen postUpgradeTasks constraint language
Replace "may not support" with:
"For free-tier Mend app users (this repo's current setup), custom
`postUpgradeTasks` commands are not available."

### 5. Label the GitHub Issue creation workflow as proposed design
The `Step 3 (HIGH only): Agent opens a GitHub issue` section should carry a
prominent callout:

> **No production example found for this specific workflow.** This is a
> proposed design. The closest analogues post PR comments (Lancini) or send
> Slack notifications (n8n/Claude workflows), not GitHub Issues.
