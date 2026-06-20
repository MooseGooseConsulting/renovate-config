---
title: Renovate AI and Agent-First Patterns
date: 2026-06-20
discovered: 2026-06-20
review_by: 2026-09-20
status: inspirational
authoritative: false
sources_read: 10
mend_policy: >
  Mend-required confidence signals are unavailable for this repo. We are not
  paying for Mend or using the Mend-hosted app, so do not promote those features
  into shared policy.
description: >
  Research into how teams are making Renovate configurations readable, actionable,
  and safely operable by AI agents and automated systems. Covers PR metadata, risk
  matrices, automated triage, structured labels, and release-age/security-gate
  combinations. Inspirational only - validate against docs/NORTH_STAR.md before adopting.
---

# Renovate AI and Agent-First Patterns

> This document is about the intersection of Renovate and autonomous agents — both
> the agents that review and merge PRs and the configurations that make those agents
> able to do their job reliably.

---

## The Core Problem

A Renovate installation running across 50+ repositories generates hundreds of PRs per
month. A human-first review model eventually collapses under this volume. But an agent
that blindly merges everything defeats the purpose. The patterns below represent how
teams are navigating this.

The central insight from 2025–2026 research:

> **Enrich the PR with structured data rather than hiding PRs behind approval gates.**
> Agents need context, not silence.

---

## 1. The Risk Matrix Pattern (Marco Lancini, May 2026)

**Source:** https://blog.marcolancini.it/2026/blog-automating-security-operations-with-ai-triage-renovate/
(read June 2026)

### What it is
When Renovate opens a PR, a GitHub Actions workflow triggers. It:
1. Reads the Renovate PR metadata (dep name, from/to version, manager, datasource)
2. Searches the repository for all invocations of the updated package
3. Queries an LLM (Claude) for documented breaking changes in the upgrade path
4. Cross-references the OSV database for CVEs
5. Posts a structured Risk Matrix comment:

```markdown
## Dependency Update Risk Assessment

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Semver type | Major | 3.x → 4.x |
| Reachability | High | 47 call sites in src/ |
| Breaking changes | Medium | API changes in CHANGELOG.md |
| CVE | None | OSV clean |
| Ecosystem adoption | Unavailable | Mend mergeConfidence signal; not usable here |

**Verdict: MANUAL REVIEW REQUIRED**
```

6. Labels the PR `ai::risk-high`, `ai::risk-medium`, or `ai::risk-low`

### Why this matters for us
The risk matrix is the bridge between "raw Renovate PR" and "agent can make a decision."
Without structured risk data, an agent must either read the full diff (expensive, slow)
or ignore risk (dangerous). The matrix collapses the diff into a decision vector.

### The Renovate config side
```json
{
  "labels": ["{{#if isVulnerabilityAlert}}security-update{{/if}}"],
  "commitMessagePrefix": "{{#if isBreaking}}feat(deps)!: {{else}}chore(deps): {{/if}}",
  "prBodyNotes": [
    "- **Manager:** {{manager}}",
    "- **Update type:** {{updateType}}",
    "- **Datasource:** {{datasource}}",
    "- **From:** {{fromVersion}} → **To:** {{toVersion}}"
  ]
}
```

The Renovate config provides the raw structured data; the GitHub Actions workflow does
the enrichment.

---

## 2. `prCreation: "not-pending"` — No Phantom PRs

**Source:** renovatebot/.github shared preset (read June 2026)

```json
{
  "prCreation": "not-pending"
}
```

Renovate normally opens a PR and then runs branch CI. During the window between PR
creation and first CI result, the PR is "pending." An agent polling for actionable PRs
may see this PR and attempt to triage or merge it before CI has finished.

`"not-pending"` tells Renovate to delay PR creation while branch status checks are
pending. The PR should arrive in the agent's queue with more signal than an
immediate PR, but agents still need to read the current check state.

**The agent-first implication:** With `not-pending`, an agent sees fewer
not-yet-actionable PRs. Without it, agents must expect more false starts on
freshly opened Renovate PRs.

---

## 3. `internalChecksFilter: "strict"` - Release-Age Gate

**Source:** Automattic/wp-calypso, renovatebot/.github, google/osv-scanner (all read June 2026)

```json
{
  "internalChecksFilter": "strict"
}
```

Renovate's "internal checks" include its own stability-age check, such as
`renovate/stability-days` when `minimumReleaseAge` is configured. Current
official docs recommend `internalChecksFilter: "strict"` with
`minimumReleaseAge`; they also state that `strict` is the default when this is
not configured.

**Without this:** older or unusual configurations can make the relationship
between PR creation and release-age checks harder for agents to reason about.

**With this:** the release-age intent is explicit: ordinary branches and PRs
should not appear before Renovate's own internal checks are satisfied. Agents
still need to inspect repository CI separately.

---

## 4. Release-Age Plus Security Alert Pattern

**Source:** renovatebot/.github, google/osv-scanner, safeguard.sh (all read June 2026)

Several security-conscious configurations combine these ideas, but this is an
adoption candidate rather than a universal rule:

```json
{
  "minimumReleaseAge": "7 days",
  "internalChecksFilter": "strict",
  "osvVulnerabilityAlerts": true
}
```

### Why each is necessary

**`minimumReleaseAge: "7 days"`:** Prevents merging day-0 releases. Supply chain attacks
often target the first 24–72 hours after a popular package release. A 7-day buffer
gives the ecosystem time to detect malicious packages before they merge.

**`internalChecksFilter: "strict"`:** Makes the stability gate explicit and
suppresses branches before Renovate's internal checks pass.

**`osvVulnerabilityAlerts: true`:** A candidate extra signal for OSV-based
security PRs. Official docs currently describe it as experimental and limited to
direct dependencies for supported datasources, so it needs validation before
shared adoption.

**Together:** ordinary updates get a release-age buffer, while security updates
retain a faster path where Renovate supports it. Agents should distinguish the
two by labels, PR metadata, advisory evidence, and CI state.

---

## 5. Structured Label Taxonomy for Agent Queue Management

**Source:** TSS Yonder, Grafana Labs, renovatebot repos, multiple homeops repos (June 2026)

The most consistent agent-first pattern found across the research:
**deterministic labels that enable PR-list triage without reading diff content.**

### Example taxonomy (composite from multiple orgs)

```json
{
  "packageRules": [
    {
      "matchUpdateTypes": ["major"],
      "addLabels": ["renovate/major", "requires-human-review"]
    },
    {
      "matchUpdateTypes": ["minor", "patch"],
      "addLabels": ["renovate/routine"]
    },
    {
      "matchCategories": ["security"],
      "addLabels": ["renovate/security", "priority-high"]
    },
    {
      "matchManagers": ["docker", "github-actions"],
      "addLabels": ["renovate/infra"]
    },
    {
      "matchManagers": ["npm", "yarn"],
      "addLabels": ["renovate/js"]
    },
    {
      "matchDepTypes": ["devDependencies"],
      "addLabels": ["renovate/devdep-only"]
    }
  ]
}
```

### How an agent uses this

An agent can implement a tiered merge policy purely from label queries:
1. `renovate/security` + `renovate/infra` → read diff, evaluate risk, request review
2. `renovate/devdep-only` + `renovate/routine` + CI passing → automerge eligible
3. `renovate/major` → always requires human review
4. `renovate/js` + `renovate/routine` + `internalChecksFilter: "strict"` passing → automerge

This is composable and extensible. Adding a new ecosystem only requires adding a new
label rule to the shared preset.

---

## 6. `commitMessagePrefix` as Agent-Parseable Metadata

**Source:** renovatebot/renovate own config (read June 2026), oapi-codegen (read June 2026)

```json
{
  "commitMessagePrefix": "chore(deps): ",
  "packageRules": [
    {
      "matchUpdateTypes": ["major"],
      "commitMessagePrefix": "feat(deps)!: "
    },
    {
      "matchCategories": ["security"],
      "commitMessagePrefix": "fix(security): "
    }
  ]
}
```

**Why this matters:** Conventional Commits prefixes allow any tool that reads `git log`
to classify dependency updates without GitHub API access. `fix(security):` in a commit
message is unambiguous — no label lookups, no PR body parsing.

An agent auditing a branch for "did any security patches land?" can run
`git log --oneline --grep "fix(security):"` and get an immediate answer.

---

## 7. `minimumGroupSize` — Avoiding Single-Package Groups

**Source:** renovatebot/renovate own config (read June 2026)

```json
{
  "packageRules": [{
    "groupName": "eslint tooling",
    "matchPackageNames": ["eslint", "/^@eslint\\//", "eslint-*"],
    "minimumGroupSize": 2
  }]
}
```

`minimumGroupSize: 2` means: only group these packages if at least 2 of them have
updates. If only one package in the group needs updating, don't group it — open a
normal single-package PR.

**Why this helps agents:** Single-item groups are confusing — the PR title says "Update
eslint group" but there's only one package in it. `minimumGroupSize` prevents this,
keeping group PRs meaningful and individual PRs clean.

---

## 8. `rollbackPrs: true` — Automatic Rollback PRs

**Source:** Renovate docs (read June 2026), verified in several repos

```json
{
  "rollbackPrs": true
}
```

If a manually-managed `package.json` pins a version that is *below* the latest known
version (e.g., someone manually downgraded after a bad release), Renovate opens a PR
to "roll forward" to the latest. But more critically: if `rollbackPrs: true` is set
and a managed package somehow regresses in version, Renovate detects the regression
and opens a corrective PR.

**For agent-managed repos:** This is a safety net. If an agent incorrectly merges a
downgrade or a dependency resolution picks an older version, Renovate will notice and
open a correction PR.

---

## 9. Jamie Tanna's Dry-Run Validation Loop (Agent Self-Verification)

**Source:** jvt.me/posts/renovate-validate/ (read June 2026)

Jamie Tanna published a pattern for using Renovate's own `--dry-run` mode as a config
validation step in CI:

```yaml
# .github/workflows/validate-renovate.yml
- run: |
    npx --yes renovate --dry-run=lookup \
      --config-migration=false \
      --print-config=true \
      --require-config=optional \
      ${{ github.repository }}
```

`--dry-run=lookup` fetches all available package updates and logs what Renovate *would*
do — without creating any PRs. Used in a PR workflow, this validates that the config
change doesn't accidentally disable major update paths.

**For us:** We already use `renovate-config-validator`. This pattern goes further: it
validates that the *logical behavior* of the config is correct, not just its syntax.
An agent modifying `default.json` should run this dry-run check and report back on
what changed.

---

## 10. `mergeConfidence:all-badges` — Ecosystem Risk Signal in PR Body

> **Unavailable for us:** this is a cool signal, but it depends on the
> Mend-hosted app or Mend API access. We are not going to pay for Mend or use
> the Mend-hosted app, so this must not be promoted into the shared preset.

**Source:** Automattic/wp-calypso (read June 2026), Mend documentation

```json
{
  "extends": ["mergeConfidence:all-badges"]
}
```

This adds a badge table to every Renovate PR body showing the package's merge confidence
scores from the Mend/Renovate ecosystem database:
- **Age**: How long since this version was published
- **Adoption**: Percentage of the ecosystem that has updated to this version
- **Passing**: Percentage of CI runs that pass with this version
- **Confidence**: Combined confidence score

An agent can parse these badge values from the PR body and factor them into the merge
decision. A package with `Adoption: 92%` and `Passing: 98%` is much lower risk than one
with `Adoption: 3%` and `Passing: 71%`.

**Implementation note:** This requires the Mend-hosted Renovate app or self-hosted
Renovate with Mend API access. For this repo, that makes it unavailable.

---

## Summary: Agent-First Configuration Checklist

The patterns above converge on a checklist for making a Renovate deployment agent-friendly:

| Setting | Why | Source |
|---------|-----|--------|
| `prCreation: "not-pending"` | No phantom PRs in agent queue | renovatebot team |
| `internalChecksFilter: "strict"` | Release-age/internal checks are explicit | Multiple |
| `minimumReleaseAge: "7 days"` | Supply chain stability window | Safeguard.sh, Renovate team |
| `osvVulnerabilityAlerts: true` | Candidate extra security signal; validate first | google/osv-scanner, Grafana |
| Deterministic label taxonomy | Agent queue management by query | TSS Yonder, Multiple |
| Conventional Commits prefixes | `git log` parseable without API | Renovate team, oapi-codegen |
| `commitMessageTopic` with context | Service/stack identification | Deliveroo |
| `prBodyNotes` with Handlebars fields | Structured PR body for parsing | ampproject/amphtml |
| `minimumGroupSize: 2` | Meaningful groups, clean singles | renovatebot team |
| `rollbackPrs: true` | Agent-merge safety net | Renovate docs |

---

*Research conducted June 2026. Sources include blog.marcolancini.it, jvt.me, safeguard.sh,
renovatebot/.github, google/osv-scanner, Automattic/wp-calypso, TSS Yonder, Deliveroo
engineering blog, and Renovate official documentation.*
