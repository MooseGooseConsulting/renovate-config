---
title: Advanced Renovate Configuration Patterns — Beyond the Basics
date: 2026-06-20
discovered: 2026-06-20
review_by: 2026-09-20
status: inspirational
authoritative: false
sources_read: 20
mend_policy: >
  Mend-only patterns are unavailable for this repo. Self-hosted Renovate
  features remain possible only as separate non-Mend decisions.
description: >
  A survey of advanced, creative, and unusual Renovate configuration patterns found
  by reading GitHub repos, official docs, and community blog posts in June 2026.
  Covers customManagers, postUpgradeTasks, customDatasources, versioning, IaC,
  monorepo, security, and agent-readable metadata. Inspirational only.
---

# Advanced Renovate Configuration Patterns — Beyond the Basics

> **Not policy.** This documents what's possible. Whether any of it belongs in
> our shared preset requires evidence, consumer repo examples, and validation
> against `docs/NORTH_STAR.md`.

---

## A. `customManagers` (Regex Managers) — Non-Standard File Tracking

### A1. The `# renovate:` Inline Annotation Pattern

**Source:** [Renovate Docs — Regex Manager](https://docs.renovatebot.com/modules/manager/regex/) +
multiple repos including Pulumi (read June 2026)

The most portable customManager pattern: add an inline annotation comment directly above
any version string in any file. Renovate finds it with a generic regex.

```json
{
  "customManagers": [{
    "customType": "regex",
    "fileMatch": ["^scripts/.*\\.sh$", "^Makefile$"],
    "matchStrings": [
      "# renovate: datasource=(?<datasource>[a-z-]+) depName=(?<depName>[^\\s]+)\\n[A-Z_]+=(?<currentValue>[^\\s]+)"
    ]
  }]
}
```

**Why it's powerful:** The annotation is human-readable and machine-parseable. Any file —
shell scripts, Makefiles, Python scripts, Go source files, CI configs — becomes a managed
dependency without tool changes. The file documents WHY the version is pinned.

**Agent-first implication:** An agent reading a Renovate PR can find the annotation, check
the associated datasource, and understand the full dependency context without reading
surrounding code.

---

### A2. Dockerfile ENV Variable Tracking

**Source:** Renovate community forum + buildkite/docs repo (read June 2026)

```json
{
  "customManagers": [{
    "customType": "regex",
    "fileMatch": ["(^|/)Dockerfile[^/]*$"],
    "matchStrings": [
      "ARG (?<depName>[A-Z_]+)_VERSION=(?<currentValue>[0-9.]+)",
      "ENV (?<depName>[A-Z_]+)_VERSION=(?<currentValue>[0-9.]+)"
    ],
    "datasourceTemplate": "github-releases",
    "packageNameTemplate": "{{depName}}"
  }]
}
```

**Why it matters:** `ARG` and `ENV` version pins are invisible to standard Renovate.
Without this manager, a Dockerfile that pins `ARG NODEJS_VERSION=20.14.0` will never
get updated. This pattern is especially common in build images and CI base images.

---

### A3. AUR PKGBUILD Version Tracking

**Source:** GitHub code search `filename:renovate.json pkgver` (found June 2026)

Some organizations maintain Arch Linux User Repository packages as part of their
developer environment fleet. Renovate can track `pkgver=` in PKGBUILD files:

```json
{
  "customManagers": [{
    "customType": "regex",
    "fileMatch": ["^PKGBUILD$"],
    "matchStrings": ["pkgver=(?<currentValue>[^\\n]+)"],
    "depNameTemplate": "{{lookup depName 0}}",
    "datasourceTemplate": "repology"
  }]
}
```

This is a niche but instructive example: Renovate has no native PKGBUILD manager,
but the regex approach makes any version-pinning file tractable.

---

### A4. Go Source File Constant Tracking

**Source:** grafana/mimir repo (read June 2026), pulumi/pulumi (read June 2026)

```json
{
  "customManagers": [{
    "customType": "regex",
    "fileMatch": ["^pkg/.*\\.go$"],
    "matchStrings": [
      "// renovate: datasource=(?<datasource>[a-z-]+) depName=(?<depName>[^\\n]+)\\n.*\"(?<currentValue>[0-9][^\"]+)\""
    ]
  }]
}
```

**Example from Grafana Mimir:** They track Jsonnet library versions pinned as string
constants in Go source. The annotation comment tells both the developer and Renovate
exactly what the constant represents.

---

### A5. Non-Semantic Git Tags (No `v` Prefix)

**Source:** Several repos (read June 2026), Renovate Docs versioning section

Some projects tag releases as `2024.1` instead of `v2024.1`. The standard Renovate
semver datasource chokes on these. The fix:

```json
{
  "packageRules": [{
    "matchPackageNames": ["some-proj/releases"],
    "versioning": "loose"
  }]
}
```

Or with a custom regex versioning:

```json
{
  "packageRules": [{
    "matchPackageNames": ["dateVersion"],
    "versioning": "regex:^(?<major>\\d{4})\\.(?<minor>\\d+)\\.?(?<patch>\\d*)$"
  }]
}
```

---

## B. `customDatasources` — Tracking Versions from Unofficial APIs

### B1. HashiCorp Releases API (OSS-Only Filter)

**Source:** Renovate community forum + several terraform user repos (read June 2026)

HashiCorp changed their licensing. Some organizations only want OSS releases, not BUSL
ones. Using a `customDatasource` pointing to the HashiCorp releases API with a filter:

```json
{
  "customDatasources": {
    "hashicorp-oss": {
      "defaultRegistryUrlTemplate": "https://releases.hashicorp.com/{{packageName}}/index.json",
      "transformTemplates": [
        "{ versions: $keys($) ~> $filter(function($v) { $v ~> /^[0-9]/ and $not($v ~> /ent|enterprise|oss\\+ent/) }) }"
      ]
    }
  }
}
```

**Why it exists:** The official `hashicorp` datasource may surface enterprise-only
releases for OSS users. The custom datasource allows precise control over which version
series Renovate considers.

---

### B2. `endoflife.date` for Kubernetes EKS

**Source:** homeops repos on GitHub (read June 2026)

Track when an EKS cluster's Kubernetes minor version reaches end-of-life:

```json
{
  "customDatasources": {
    "eks-eol": {
      "defaultRegistryUrlTemplate": "https://endoflife.date/api/amazon-eks.json",
      "transformTemplates": [
        "{ versions: $, sourceUrl: 'https://endoflife.date/amazon-eks' }"
      ]
    }
  }
}
```

Combined with a `customManager` that reads the EKS version from a `cluster.yaml`, this
opens a PR warning that the cluster version is approaching EOL — before AWS does.

---

### B3. Grafana Dashboard Revision Tracking

**Source:** GitHub search for `grafana` + `customDatasource` (found June 2026)

Some teams pin Grafana dashboard JSON revisions. A `customDatasource` pointing to the
Grafana.com API fetches the latest revision for any community dashboard:

```json
{
  "customDatasources": {
    "grafana-dashboards": {
      "defaultRegistryUrlTemplate": "https://grafana.com/api/dashboards/{{packageName}}/revisions",
      "transformTemplates": [
        "{ versions: items.revision }"
      ]
    }
  }
}
```

This is genuinely unusual: Renovate tracking the revision number of a JSON dashboard
definition and opening a PR when the dashboard's author publishes a new revision.

---

## C. `postUpgradeTasks` — Making PRs Self-Consistent

### C1. Angular Migration Runs (codemod pattern)

**Source:** angular/angular repo (read June 2026), angular/dev-infra shared preset

```json
{
  "postUpgradeTasks": {
    "commands": [
      "pnpm install --frozen-lockfile",
      "pnpm ng-dev misc sync-module-bazel",
      "pnpm bazel run //.github/actions/deploy-docs-site:main",
      "pnpm bazel run //packages/common:base_currencies_file",
      "pnpm bazel run //packages/core:base_locale_file"
    ],
    "fileFilters": ["packages/**/*", "MODULE.bazel", "MODULE.bazel.lock"],
    "executionMode": "branch"
  }
}
```

**Why `executionMode: "branch"`:** Commands run once per PR (not per package). When
20 packages are grouped, Bazel lock files are rebuilt once at the end, not 20 times.

**The principle:** Renovate's job ends when the version string changes. `postUpgradeTasks`
is how you commit everything that MUST change along with the version.

---

### C2. Atlassian Codemod-CLI (Breaking API Migration)

**Source:** [Renovate GitHub Issue #8220](https://github.com/renovatebot/renovate/issues/8220)
(read June 2026)

```json
{
  "packageRules": [{
    "matchPackageNames": ["@atlaskit/**"],
    "postUpgradeTasks": {
      "commands": [
        "npx @atlaskit/codemod-cli --packages {{{depName}}}@{{{fromVersion}}} --path src/"
      ],
      "fileFilters": ["src/**/*.ts", "src/**/*.tsx"],
      "executionMode": "update"
    }
  }]
}
```

**`executionMode: "update"` here:** Runs the codemod once per package update, not once
per branch. This handles the case where multiple Atlaskit packages are bumped in one
PR — each needs its own codemod pass.

**The big picture:** This makes Renovate a distributed refactoring tool. When a design
system publishes a major with breaking API changes AND a codemod, the PR arrives with
the migration already applied. Reviewers see working code, not broken builds.

**Risk:** If the codemod has bugs, the PR may contain incorrect code that passes CI.
This pattern demands robust integration testing. Do not use for major public APIs unless
you have high test coverage.

---

### C3. Changeset / Changelog Generation

**Source:** microsoft/beachball repo (read June 2026), onthecode.co.uk blog (read June 2026)

```json
{
  "postUpgradeTasks": {
    "commands": [
      "npx beachball change --no-commit --no-push --message 'Update {{{depName}}} from {{{fromVersion}}} to {{{toVersion}}}'"
    ],
    "fileFilters": ["change/**/*.json"],
    "executionMode": "branch"
  }
}
```

The template variables `{{{depName}}}`, `{{{fromVersion}}}`, `{{{toVersion}}}` are
Renovate's Handlebars context — available in `postUpgradeTasks` commands. This generates
a Beachball changeset entry committed into the PR branch.

**Result:** Every Renovate PR arrives with a proper changelog entry pre-written. When
the PR is merged, the release pipeline finds the changeset and includes it in the
next version bump automatically.

---

### C4. Helm Subchart Source Pull

**Source:** Various homeops repos (read June 2026)

```json
{
  "postUpgradeTasks": {
    "commands": [
      "helm repo add {{{depName}}} {{{registryUrl}}} --force-update",
      "helm dependency update charts/{{{packageFileDir}}}"
    ],
    "fileFilters": ["charts/**/*"],
    "executionMode": "update"
  }
}
```

When Renovate bumps a Helm subchart version in `Chart.yaml`, the lock file
(`Chart.lock`) and downloaded charts directory become stale. This task runs
`helm dependency update` to relock and commit the result.

---

### C5. `.nvmrc` / `.node-version` Sync

**Source:** Multiple repos found via GitHub search `filename:renovate.json .nvmrc` (June 2026)

```json
{
  "packageRules": [{
    "matchPackageNames": ["node"],
    "matchManagers": ["nodenv", "nvm"],
    "postUpgradeTasks": {
      "commands": ["echo '{{{newVersion}}}' > .nvmrc", "echo '{{{newVersion}}}' > .node-version"],
      "fileFilters": [".nvmrc", ".node-version"],
      "executionMode": "update"
    }
  }]
}
```

**Why this exists:** `.nvmrc` and `package.json#engines.node` often go out of sync. This
ensures a Node version bump updates both the engines field and the `.nvmrc` file in the
same PR.

---

## D. `bumpVersions` — Keeping Helm Chart Versions Current

### D1. Helm `Chart.yaml` Version Auto-Bump

**Source:** Multiple homeops repos (read June 2026)

When a Helm chart's application dependencies change, the chart's own version in
`Chart.yaml` should also bump. Using `bumpVersion: "patch"`:

```json
{
  "packageRules": [{
    "matchManagers": ["helmv3"],
    "bumpVersion": "patch"
  }]
}
```

This makes the Renovate PR include both the dependency version bump AND the chart's
`version: 1.2.3 → 1.2.4` bump. CD pipelines that watch chart version numbers pick this
up automatically.

---

## E. GitHub Actions — Digest Pinning and Non-Semver Branch Tags

### E1. `helpers:pinGitHubActionDigests`

**Source:** Renovate preset library + renovatebot/.github own config (read June 2026)

```json
{
  "extends": ["helpers:pinGitHubActionDigests"]
}
```

Converts `uses: actions/checkout@v4` to `uses: actions/checkout@abc1234 # v4.1.0`.
This is a supply chain hardening measure: pinning to a digest prevents a tag from being
silently force-pushed to a malicious commit.

**The corresponding Renovate config** still tracks the tag and opens a PR when
`actions/checkout` publishes a new release — but the merge commits the new digest,
not the new tag name.

**This is relevant to us:** Our GitHub Actions workflows should use digest pinning. It is
one of the few categories where `pinDigests: true` in the shared preset would benefit
every consumer automatically.

---

### E2. Non-Semver Branch Tag Pinning (New March 2026)

**Source:** Renovate changelog (March 2026), read via GitHub releases page

A new feature as of early 2026: Renovate can now track GitHub Actions that publish
"floating branch tags" like `v3` (which points to the latest `v3.x.x` release).
Previously these were unmanaged. Now Renovate can pin them and issue digest-based updates.

---

## F. Versioning Strategies for Non-Standard Version Schemes

### F1. Bitnami Regex Versioning

**Source:** Bitnami Helm chart repos (found June 2026)

Bitnami prefixes their chart versions with the application version:
`2.34.0-debian-12-r5`. Standard semver parsing fails. Their custom versioning:

```json
{
  "packageRules": [{
    "matchDatasources": ["helm"],
    "matchPackageNames": ["bitnami/**"],
    "versioning": "regex:^(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)-debian-(?<build>\\d+-r\\d+)$"
  }]
}
```

### F2. Python `pep440` Versioning

**Source:** Renovate Docs, pypi repos (June 2026)

Python packages use PEP 440 (`1.0.0a1`, `1.0.0b2`, `1.0.0rc1`, `1.0.0.post1`).
The default semver parser mishandles these. Setting `"versioning": "pep440"` on
`matchDatasources: ["pypi"]` ensures pre-releases and post-releases are correctly ordered.

---

## G. Infrastructure as Code (IaC) — Terraform and Helm Together

### G1. Terragrunt `inputs` Block Regex

**Source:** GitHub search `filename:renovate.json terragrunt` (found June 2026)

Terragrunt `inputs = { ... }` blocks are not tracked by the standard Terraform manager.
A custom regex manager:

```json
{
  "customManagers": [{
    "customType": "regex",
    "fileMatch": ["^terragrunt\\.hcl$"],
    "matchStrings": [
      "# renovate: datasource=(?<datasource>[a-z-]+) depName=(?<depName>[^\\n]+)\\n\\s+\"(?<currentValue>[v0-9.]+)\""
    ]
  }]
}
```

### G2. Terraform Provider and Helm Chart Grouping

**Source:** Multiple homeops repos (read June 2026)

```json
{
  "packageRules": [
    {
      "groupName": "terraform providers",
      "matchManagers": ["terraform"],
      "matchDepTypes": ["provider"],
      "automerge": false
    },
    {
      "groupName": "helm charts — infra",
      "matchManagers": ["helmv3"],
      "matchPackageNames": ["/^cert-manager/", "/^ingress-nginx/", "/^external-dns/"],
      "automerge": false,
      "schedule": ["every weekend"]
    }
  ]
}
```

The separation between "groupName for PRs" (how many PRs appear) and "automerge policy"
(whether they merge automatically) is a common confusion. Grouping reduces noise; automerge
policy decides safety. They are orthogonal.

---

## H. Monorepo Patterns

### H1. pnpm Catalog Support

**Source:** Renovate 2025 release notes (read June 2026)

As of Renovate 2025, `pnpm-workspace.yaml` `catalog:` entries are natively supported.
A single PR updates the catalog entry, and all workspace packages consuming it update
simultaneously without per-package PRs.

### H2. `additionalBranchPrefix` for Multi-Tenant Monorepos

**Source:** oapi-codegen/oapi-codegen repo (read June 2026)

In monorepos where different directories have different release cadences:

```json
{
  "packageRules": [{
    "matchFileNames": ["cmd/oapi-codegen/**"],
    "additionalBranchPrefix": "codegen/",
    "commitMessageSuffix": "(codegen)"
  }, {
    "matchFileNames": ["pkg/**"],
    "additionalBranchPrefix": "pkg/",
    "commitMessageSuffix": "(pkg)"
  }]
}
```

Branch names become `renovate/pkg/express-5.0.1` vs `renovate/codegen/express-5.0.1`.
PR titles carry the suffix showing which monorepo section is affected.

---

## I. `packageRules` — Advanced Matching Patterns

### I1. `matchJsonata` for Semantic Version Condition

**Source:** Renovate 2025 release notes + community forum (June 2026)

```json
{
  "packageRules": [{
    "matchJsonata": "$exists(updateType) and updateType = 'major'",
    "addLabels": ["breaking-change"],
    "automerge": false,
    "reviewers": ["team:platform"]
  }]
}
```

`matchJsonata` allows JSONata expressions as matching conditions. `$exists(updateType)`
is the idiomatic way to match "this is a major version bump" — which can then route
the PR to a specific reviewer team and add a label, all without human action.

### I2. `constraintsFiltering: "strict"` for Multi-Version Compatibility

**Source:** Renovate Docs, verified in several Python repos (June 2026)

When a Python or Ruby package publishes versions for different language runtimes,
`constraintsFiltering: "strict"` tells Renovate only to offer upgrades compatible with
the repo's declared `python` or `ruby` engine constraint:

```json
{
  "constraints": { "python": ">=3.10,<3.13" },
  "constraintsFiltering": "strict"
}
```

Without this, Renovate may offer a Python 3.13-only package update to a service running
Python 3.10.

### I3. `matchCurrentValue` Regex — Controlled Major Upgrades

**Source:** Multiple repos (June 2026)

```json
{
  "packageRules": [{
    "matchPackageNames": ["typescript"],
    "matchCurrentValue": "/^4\\./",
    "allowedVersions": "<5.0.0"
  }]
}
```

Pins a package to its current major series only when it's on a specific version. Once
the team manually bumps to `5.x`, this rule no longer applies and Renovate freely tracks
the `5.x` series. Useful for controlled major upgrades without permanent version caps.

---

## J. Security-Specific Patterns

### J1. `osvVulnerabilityAlerts` - Candidate Extra Security Signal

**Source:** google/osv-scanner repo (read June 2026), Renovate docs (June 2026)

```json
{
  "osvVulnerabilityAlerts": true
}
```

Enables Renovate to query the OSV (Open Source Vulnerabilities) database for
supported direct dependencies and open vulnerability-fix PRs once fixes are
available.

This is not a replacement for `vulnerabilityAlerts`. Official Renovate docs mark
OSV alerting as experimental and limited by datasource/dependency shape, so it
belongs in the "evaluate with docs and runner-version evidence" bucket before
shared adoption.

**Agent-first implication:** if adopted, OSV PRs need deterministic security
labels so agents can prioritize them from the PR list.

### J2. `[SECURITY]` Commit Suffix for Vulnerability PRs

**Source:** oapi-codegen/oapi-codegen (read June 2026)

```json
{
  "packageRules": [{
    "matchCategories": ["security"],
    "commitMessageSuffix": "[SECURITY]",
    "prPriority": 10
  }]
}
```

Makes security-related commits immediately identifiable in `git log` without reading
the PR. `prPriority: 10` (highest) ensures the PR appears first in any queue sorted by
priority.

---

## K. Agent-Readable PR Body and Metadata

### K1. `prBodyNotes` for Structured Context

**Source:** ampproject/amphtml (read June 2026)

```json
{
  "prBodyNotes": [
    "**Affected ecosystem:** {{manager}}",
    "**Update type:** {{updateType}}",
    "**Datasource:** {{datasource}}",
    "<details><summary>Migration notes</summary>\n{{changelog}}\n</details>"
  ]
}
```

`prBodyNotes` accepts Handlebars templates with Renovate's full context object.
The fields available include `manager`, `updateType`, `datasource`, `depName`,
`fromVersion`, `toVersion`, `releaseTimestamp`. An agent reading PR body content
can parse these structured fields without touching the diff.

### K2. `commitMessageTopic` for Routing

**Source:** Multiple enterprise deployments (June 2026)

```json
{
  "commitMessageTopic": "{{depName}} ({{manager}})"
}
```

Combined with `branchPrefix` conventions, every Renovate PR has a machine-parseable
commit message structure. Example: `chore(deps): update lodash (npm) to v4.18.0`.
An agent filtering for `(npm)` in commit messages can immediately exclude Docker/Helm/
GitHub Actions updates from a query.

---

*Research conducted June 2026 by reading 20+ sources including GitHub repos, Renovate docs,
community blog posts, and GitHub issues. All patterns above are sourced from real
configurations observed in the wild. No patterns here are authoritative — validate
each against the NORTH_STAR before adopting.*
