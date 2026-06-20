---
title: Real-World Renovate Config Catalog — 35 Repos Read and Analyzed
date: 2026-06-20
discovered: 2026-06-20
review_by: 2026-09-20
status: inspirational
authoritative: false
description: >
  35 real GitHub repositories whose renovate.json / .renovaterc.json / renovate.json5
  files were read in full via GitHub API. Each entry includes key excerpts, what makes
  it distinctive, and what it might inspire for an agent-first shared config strategy.
  Inspirational only — validate against docs/NORTH_STAR.md before adopting anything.
---

# Real-World Renovate Config Catalog (June 2026)

> **Methodology:** 10 GitHub code searches executed across `filename:renovate.json`,
> `filename:.renovaterc.json`, and `filename:renovate.json5` targeting advanced fields
> (`postUpgradeTasks`, `customManagers`, `automergeSchedule`, `groupName`, `prHourlyLimit`,
> `branchPrefix`, `vulnerabilityAlerts`, `dependencyDashboard`, `mergeConfidence`,
> `internalChecksFilter`). All 35 config files were read in full via GitHub API.
> Inspirational only — not authoritative.

---

## Contents

- [Tier 1 — Large Org / Framework-Level Configs](#tier-1--large-org--framework-level-configs)
- [Tier 2 — Power User / Creative Pattern Configs](#tier-2--power-user--creative-pattern-configs)
- [Tier 3 — Multi-Branch Release Coordination](#tier-3--multi-branch-release-coordination)
- [Tier 4 — Security-First Configs](#tier-4--security-first-configs)
- [Tier 5 — Kubernetes / Home-Ops / IaC Clusters](#tier-5--kubernetes--home-ops--iac-clusters)
- [Tier 6 — Niche Ecosystems](#tier-6--niche-ecosystems)
- [Patterns Summary](#patterns-summary)

---

## Tier 1 — Large Org / Framework-Level Configs

### 1. angular/angular

**URL:** https://github.com/angular/angular/blob/main/renovate.json  
**Org:** Google / Angular  
**Ecosystem:** Node (pnpm), Bazel, TypeScript  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>angular/dev-infra//renovate-presets/default.json5"],
  "baseBranchPatterns": ["main", "22.0.x"],
  "ignoreDeps": ["@types/selenium-webdriver", "convert-source-map", "systemjs"],
  "packageRules": [
    {
      "matchManagers": ["bazel", "bazel-module", "bazelisk", "npm"],
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
  ]
}
```

**What's notable:** Extends a private org preset at `github>angular/dev-infra//renovate-presets/default.json5` (double-slash path into subdirectory). Uses `postUpgradeTasks` to rebuild Bazel lockfiles and locale data artifacts — Renovate runs pnpm inside the PR branch and commits the generated artifacts. `executionMode: "branch"` means tasks run once per PR, not once per package.

**Agent-first inspiration:** This is the canonical pattern for monorepos needing generated artifacts committed alongside the dep bump. An agent reviewing such a PR can trust the branch is self-consistent. The `baseBranchPatterns` also shows how to scope Renovate to actively maintained release lines only.

---

### 2. pulumi/pulumi

**URL:** https://github.com/pulumi/pulumi/blob/master/renovate.json5  
**Org:** Pulumi  
**Ecosystem:** Go, Node, Python (multi-language SDK)  
**Config format:** `renovate.json5`  
**Found:** 2026-06-20

```json5
{
  extends: ["github>pulumi/renovate-config//default.json5"],
  enabledManagers: ["gomod", "npm", "pip_requirements", "pep621", "github-actions", "custom.regex"],
  customManagers: [
    {
      customType: "regex",
      fileMatch: ["^scripts/get-language-providers\\.sh$"],
      matchStrings: [
        "# renovate: datasource=(?<datasource>\\S+) depName=(?<depName>\\S+)...\\s+\"\\S+ (?<currentValue>\\S+)\""
      ]
    },
    {
      customType: "regex",
      fileMatch: ["^pkg/util/plugin\\.go$"],
      matchStrings: [
        "// renovate: datasource=...\\s+Version:\\s+semver\\.MustParse\\(\"(?<currentValue>[^\"]+)\"\\)"
      ]
    }
  ],
  packageRules: [
    { description: "Disable auto-update for first party @pulumi/** packages",
      matchDatasources: ["go", "npm", "pypi"],
      matchPackageNames: ["github.com/pulumi/**", "@pulumi/**"],
      enabled: false },
    { description: "Auto merge language runtimes",
      matchManagers: ["custom.regex"],
      matchFileNames: ["scripts/get-language-providers.sh"],
      postUpgradeTasks: { commands: ["make renovate"], executionMode: "branch" } }
  ]
}
```

**What's notable:** Two custom regex managers track pinned versions inside shell scripts and Go source files using inline `// renovate:` annotation comments. First-party `@pulumi/**` packages are blocked from auto-update. Language runtime updates also run `make renovate` which writes a changelog entry.

**Agent-first inspiration:** The `// renovate: datasource=...` annotation pattern is a best practice — any file becomes a managed dependency without tooling changes. The annotation is human-readable, grep-able, and tells both developers and agents why a version is pinned.

---

### 3. ampproject/amphtml

**URL:** https://github.com/ampproject/amphtml/blob/main/.renovaterc.json  
**Org:** Google / AMP  
**Ecosystem:** Node (npm), large monorepo  
**Config format:** `.renovaterc.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:recommended"],
  "commitMessagePrefix": "📦",
  "timezone": "America/Los_Angeles",
  "schedule": "after 12am every weekday",
  "dependencyDashboard": true,
  "prBodyNotes": [
    "See all other Renovate PRs on the [Dependency Dashboard](https://github.com/ampproject/amphtml/issues/34671)",
    "<details><summary>How to resolve breaking changes</summary>",
    "```sh\ngit checkout -b {{{branchName}}} main\ngit pull https://github.com/ampproject/amphtml.git {{{branchName}}}\namp lint --fix\namp prettify --fix\ngit push git@github.com:ampproject/amphtml.git {{{branchName}}}:{{{branchName}}}\n```",
    "</details>"
  ],
  "packageRules": [
    { "groupName": "build-system devDependencies", "matchFileNames": ["build-system/**"], "labels": ["WG: infra"], "automerge": true },
    { "groupName": "babel devDependencies", "matchPackageNames": ["/\\bbabel/"], "major": { "automerge": false } },
    { "groupName": "ampproject dependencies", "matchPackageNames": ["/^@ampproject//"], "matchDepTypes": ["dependencies"], "automerge": false, "schedule": null }
  ]
}
```

**What's notable:** Uses `prBodyNotes` to inject rich Markdown into every PR body, including a collapsible HTML `<details>` block with copy-paste git commands for resolving breaking changes. Groups tagged by Working Group (`WG: infra`, `WG: caching`) so triage can route PRs. Production `@ampproject` deps have `schedule: null` to bypass the nightly window.

**Agent-first inspiration:** `prBodyNotes` is underused: you can embed structured content (JSON, links to runbooks, YAML) into PR descriptions for agent consumption. WG labels make automated routing trivial.

---

### 4. Automattic/wp-calypso

**URL:** https://github.com/Automattic/wp-calypso/blob/trunk/renovate.json5  
**Org:** Automattic  
**Ecosystem:** Node (Yarn), React monorepo  
**Config format:** `renovate.json5`  
**Found:** 2026-06-20

```json5
{
  extends: ['config:recommended', 'default:pinDigestsDisabled', 'mergeConfidence:all-badges'],
  packageRules: [
    { extends: ['monorepo:wordpress', 'schedule:daily'], minimumReleaseAge: '0 days', prPriority: 3 },
    { groupName: 'nodejs', matchPackagePatterns: ['/node$/'], matchDatasources: ['docker', 'node'] },
    { extends: ['monorepo:react', ':widenPeerDependencies'], prPriority: 2 },
    { extends: ['monorepo:babel'], prPriority: 1 },
  ],
  postUpdateOptions: ['yarnDedupeHighest'],
  minimumReleaseAge: '10 days',
  prConcurrentLimit: 20,
  schedule: ['every weekend'],
  prCreation: 'immediate',
  internalChecksFilter: 'strict',
  rebaseWhen: 'conflicted',
  reviewers: ['team:@automattic/calypso-dependency-updates'],
  branchPrefix: 'renovate/',
  gitAuthor: 'Renovate Bot (self-hosted) <bot@renovateapp.com>',
  platform: 'github',
  repositories: ['Automattic/wp-calypso'],
}
```

**What's notable:** Self-hosted Renovate global config — includes `platform`, `gitAuthor`, and `repositories` fields. Uses `mergeConfidence:all-badges` to surface Mend merge confidence in PRs. `internalChecksFilter: "strict"` prevents PRs from landing until all CI passes. `prPriority` differentiates urgency without complex rule overlaps.

**Agent-first inspiration:** `mergeConfidence:all-badges` adds ecosystem-wide adoption signals into PR descriptions. `prPriority` is the right tool for "security updates first, major updates last" without conflicting rules. `internalChecksFilter: "strict"` means an agent can assume any open PR has already passed CI.

---

### 5. LedgerHQ/ledger-live

**URL:** https://github.com/LedgerHQ/ledger-live/blob/develop/renovate.json  
**Org:** Ledger (hardware wallet)  
**Ecosystem:** Node (npm), React Native, Electron  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:best-practices", ":dependencyDashboard"],
  "packageRules": [
    { "description": "GitHub Actions External",
      "matchManagers": ["github-actions"],
      "pinDigests": true,
      "minimumReleaseAge": "15 days",
      "reviewers": ["team:wallet-ci"],
      "assignees": ["team:wallet-ci"] },
    { "description": "Lumen UI React updates",
      "matchPackageNames": ["@ledgerhq/lumen-ui-react"],
      "commitMessagePrefix": "chore(desktop):",
      "reviewers": ["team:live-hub"],
      "prPriority": 10 },
    { "description": "Electron linked updates",
      "groupName": "electron",
      "matchPackageNames": ["/electron/", "/^@electron/", "!@sentry/electron"],
      "minimumReleaseAge": "2 days" },
    { "description": "E2E Playwright and Allure",
      "groupName": "e2e playwright and allure",
      "commitMessagePrefix": "chore(e2e):",
      "reviewers": ["team:qaa"] },
    { "description": "E2E Detox and Allure",
      "groupName": "e2e detox and allure",
      "reviewers": ["team:qaa"] }
  ],
  "prConcurrentLimit": 10,
  "separateMinorPatch": true,
  "timezone": "Europe/Paris",
  "enabledManagers": ["npm", "github-actions"]
}
```

**What's notable:** Per-package-group team routing via `reviewers` and `assignees`. Different `commitMessagePrefix` per group for conventional-commit scoping. `prPriority: 10` for first-party design system packages. `separateMinorPatch: true` gives independent control over minor vs. patch cadence.

**Agent-first inspiration:** Team routing at the package-rule level is the correct pattern when different teams own different dependency surfaces. An agent can use the team assignee as a proxy for "which team owns the merge decision".

---

### 6. renovatebot/renovate (self-referential)

**URL:** https://github.com/renovatebot/renovate/blob/main/renovate.json  
**Org:** Mend / Renovate maintainers  
**Ecosystem:** Node (npm), Docker  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["github>renovatebot/.github"],
  "assignees": ["viceice", "secustor", "jamietanna"],
  "reviewers": ["@renovatebot/maintainers"],
  "semanticCommitScope": "deps",
  "automergeType": "pr",
  "prCreation": "immediate",
  "baseBranchPatterns": ["$default", "/^disable-next$/"],
  "packageRules": [
    { "matchPackageNames": ["ghcr.io/renovatebot/base-image"],
      "matchUpdateTypes": ["major"],
      "commitMessagePrefix": "feat(deps)!:" },
    { "matchBaseBranches": ["next"], "dependencyDashboardApproval": true },
    { "matchUpdateTypes": ["major"], "addLabels": ["breaking"] },
    { "groupName": "zizmor",
      "matchPackageNames": ["ghcr.io/zizmorcore/zizmor", "zizmorcore/zizmor-action"],
      "minimumGroupSize": 2 }
  ],
  "customManagers": [
    { "customType": "regex",
      "managerFilePatterns": ["lib/config/options/index.ts"],
      "matchStrings": ["default: '(?<depName>ghcr.io/renovatebot/base-image):(?<currentValue>[^']*)'"],
      "datasourceTemplate": "docker" }
  ]
}
```

**What's notable:** Renovate managing itself. `feat(deps)!:` commit prefix for own Docker base image major bumps signals breaking changes. The `next` branch requires dashboard approval for all updates. `minimumGroupSize: 2` prevents a group PR when only one of two linked packages has an update. `$default` as a branch pattern literal.

**Agent-first inspiration:** `minimumGroupSize` prevents noise when a group only partially has updates. The `feat(deps)!:` breaking-commit prefix is the pattern for signaling semver impact in conventional-commit repos.

---

### 7. prometheus/prometheus

**URL:** https://github.com/prometheus/prometheus/blob/main/renovate.json  
**Org:** CNCF / Prometheus  
**Ecosystem:** Go, TypeScript (React)  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:recommended"],
  "separateMultipleMajor": true,
  "schedule": ["* * 7,21 * *"],
  "prBodyNotes": ["```release-notes\nNONE\n```"],
  "branchPrefix": "deps-update/",
  "packageRules": [
    { "matchPackageNames": ["github.com/aws/**"], "groupName": "AWS Go dependencies" },
    { "matchPackageNames": ["github.com/Azure/**"], "groupName": "Azure Go dependencies" },
    { "matchPackageNames": ["k8s.io/**"], "groupName": "Kubernetes Go dependencies" },
    { "matchPackageNames": ["go.opentelemetry.io/**"], "groupName": "OpenTelemetry Go dependencies" },
    { "matchFileNames": ["web/ui/mantine-ui/package.json"], "groupName": "Mantine UI" }
  ],
  "vulnerabilityAlerts": { "enabled": true, "labels": ["security-update"] },
  "osvVulnerabilityAlerts": true
}
```

**What's notable:** `branchPrefix: "deps-update/"` instead of default `renovate/` (useful when other automation filters by prefix). `prBodyNotes` injects `release-notes: NONE` for the project's release tooling to skip changelog entries. Vendor grouping by cloud provider namespace.

**Agent-first inspiration:** `prBodyNotes` with a structured block (`release-notes: NONE`) is machine-readable by downstream release tools. Vendor grouping by Go import prefix is scalable for large Go repos with cloud SDK dependencies.

---

### 8. grafana/mimir

**URL:** https://github.com/grafana/mimir/blob/main/renovate.json5  
**Org:** Grafana Labs  
**Ecosystem:** Go, Jsonnet, Docker (distroless), GitHub Actions  
**Config format:** `renovate.json5`  
**Found:** 2026-06-20

```json5
{
  extends: ['config:recommended', 'schedule:daily'],
  customManagers: [
    { customType: "regex", description: "Docker images in Jsonnet files",
      managerFilePatterns: ['\\.jsonnet$'],
      matchStrings: ["image:\\s*'(?<depName>.+):(?<currentValue>[^'/@]+)'"] },
    { customType: "regex", description: "grafana/docs-base digest in workflow files",
      managerFilePatterns: ['.github/workflows/**'],
      matchStrings: ['(?<depName>grafana/docs-base)@(?<currentDigest>sha256:[a-f0-9]+)'],
      currentValueTemplate: 'latest', datasourceTemplate: 'docker' },
    { customType: "regex", description: "go install in dev Dockerfiles",
      managerFilePatterns: ['mimir-build-image/Dockerfile'],
      matchStrings: ['go install\\s+(?<depName>[^@]+)@(?<currentValue>[^\\s]+)'],
      datasourceTemplate: 'go' },
    { customType: "regex", description: "Tools in build image from ENV vars",
      matchStrings: [
        "# renovate: datasource=(?<datasource>[^\\s]+) depName=(?<depName>[^\\s]+)\\s+ENV [A-Z0-9_]+=(\\s|\"|)(?<currentValue>[^\"\\s]*)(\"|)"
      ] }
  ],
  baseBranchPatterns: ['main', 'release-3.1', 'release-3.0'],
  packageRules: [
    { matchBaseBranches: ["release-3.1", "release-3.0"], enabled: false, matchPackageNames: ["*"] },
    { matchPackageNames: ["grafana/shared-workflows"],
      versioning: "regex:^(?<compatibility>.*)[-/]v?(?<major>\\d+)\\.(?<minor>\\d+)\\.(?<patch>\\d+)?$",
      additionalBranchPrefix: "{{ lookup (split newVersion '/') 0 }}-" },
    { matchUpdateTypes: ["digest"], schedule: ["* 0-4 * * 1"] }
  ],
  branchPrefix: 'deps-update/',
  osvVulnerabilityAlerts: true,
  prHourlyLimit: 10,
}
```

**What's notable:** Five custom regex managers covering Jsonnet refs, workflow `docker run` commands (invisible to the github-actions manager), `go install` in Dockerfiles, and ENV vars in build images. The `grafana/shared-workflows` monorepo uses per-action semver tags — requires a custom versioning regex plus `additionalBranchPrefix` using a handlebars template.

**Agent-first inspiration:** The shared-workflows versioning hack is the pattern for non-standard per-artifact tag schemes in monorepos. `gitIgnoredAuthors` (also present in full config) prevents bot-generated commits from triggering rebase loops — important when Renovate and CI bots both push to the same branch.

---

## Tier 2 — Power User / Creative Pattern Configs

### 9. oapi-codegen/oapi-codegen

**URL:** https://github.com/oapi-codegen/oapi-codegen/blob/main/renovate.json  
**Org:** oapi-codegen  
**Ecosystem:** Go multi-module monorepo  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["local>oapi-codegen/renovate-config"],
  "packageRules": [
    {
      "description": "Per-directory branch prefix for non-group updates",
      "matchFileNames": ["**/*"],
      "additionalBranchPrefix": "{{#if isGroup }}{{ else }}{{#if packageFileDir}}{{packageFileDir}}/{{else}}{{packageFile}}/{{/if}}{{/if}}",
      "commitMessageSuffix": "{{#if isGroup }}{{ else }} ({{#if packageFileDir}}{{packageFileDir}}{{/if}}){{/if}}"
    },
    { "matchFileNames": ["internal/test/**/*", "examples/**/*"], "dependencyDashboardApproval": true }
  ],
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["README.md"],
      "matchStrings": ["# yaml-language-server: \\$schema=https://raw.githubusercontent.com/oapi-codegen/oapi-codegen/(?<currentValue>[^/]+)/configuration-schema.json"],
      "depNameTemplate": "github.com/oapi-codegen/oapi-codegen/v2",
      "datasourceTemplate": "go"
    }
  ]
}
```

**What's notable:** The `additionalBranchPrefix` handlebars template gives each Go sub-module its own branch prefix, preventing collisions in a multi-module repo. Example and test code requires dashboard approval. Regex manager tracks schema URL version in README.md.

**Agent-first inspiration:** Per-directory `additionalBranchPrefix` is essential in Go multi-module repos. The `{{#if isGroup}}...{{/if}}` handlebars shows how to conditionally apply logic within a single packageRule.

---

### 10. elastic/terraform-provider-elasticstack

**URL:** https://github.com/elastic/terraform-provider-elasticstack/blob/main/renovate.json  
**Org:** Elastic  
**Ecosystem:** Go, Terraform, Docker  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["local>elastic/renovate-config"],
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/^generated/kbapi/Makefile$/"],
      "matchStrings": ["github_ref \\?= (?<currentDigest>.*?)\\n"],
      "currentValueTemplate": "main",
      "depNameTemplate": "kibana-openapi-spec",
      "packageNameTemplate": "https://github.com/elastic/kibana",
      "datasourceTemplate": "git-refs"
    },
    {
      "customType": "regex",
      "managerFilePatterns": ["/^\\.custom-gcl\\.yml$/"],
      "matchStrings": ["^version: (?<currentValue>v?\\d+\\.\\d+\\.\\d+)$"],
      "depNameTemplate": "golangci/golangci-lint",
      "datasourceTemplate": "github-releases"
    }
  ],
  "postUpgradeTasks": {
    "commands": ["make renovate-post-upgrade"],
    "fileFilters": ["generated/kbapi/kibana.gen.go", "generated/kbapi/oas-filtered.yaml", "NOTICE"]
  },
  "automerge": true,
  "automergeStrategy": "squash",
  "automergeType": "branch"
}
```

**What's notable:** Tracks a Git SHA from the Kibana OpenAPI spec using `datasource: "git-refs"`. When the spec SHA updates, `make renovate-post-upgrade` regenerates the Go API client — the PR arrives with generated code pre-updated. Automerge via squash on branch (no PR created for non-breaking).

**Agent-first inspiration:** `git-refs` datasource is the right tool for upstream SHA pinning. Pairing with `postUpgradeTasks` that regenerates code creates a fully automated codegen pipeline via Renovate.

---

### 11. go-gitea/gitea

**URL:** https://github.com/go-gitea/gitea/blob/main/renovate.json5  
**Org:** Gitea  
**Ecosystem:** Go, Node (pnpm), Python, Nix, Docker  
**Config format:** `renovate.json5`  
**Found:** 2026-06-20

Key patterns:
- Two Makefile regex patterns: Go tool installs and Docker image digests with SHA pinning
- `allowedVersions: "^3"` for Tailwind and other packages with known incompatibilities
- `postUpgradeTasks: { commands: ["make tidy"] }` for Go and `commands: ["make svg"]` for npm
- `osvVulnerabilityAlerts: true` + `minimumReleaseAge: "5 days"`
- `semanticCommits: "enabled"`

**Agent-first inspiration:** `allowedVersions` with explanatory comments (json5 allows `//`) is the canonical pattern for intentional version holds. SVG regeneration in `postUpgradeTasks` means the branch always builds.

---

### 12. buildkite/docs

**URL:** https://github.com/buildkite/docs/blob/main/renovate.json  
**Org:** Buildkite  
**Ecosystem:** Ruby (Bundler), Node, Docker, GitHub Actions, Buildkite pipelines, git-submodules  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "automerge": true,
  "automergeType": "pr",
  "customManagers": [
    { "description": "bk CLI version in shell script",
      "managerFilePatterns": ["/^scripts/update-bkcli-help\\.sh$/"],
      "matchStrings": ["CLI_VERSION=\"(?<currentValue>v[\\d.]+)\""],
      "depNameTemplate": "buildkite/cli",
      "datasourceTemplate": "github-releases" },
    { "description": "Docker images in Buildkite pipeline YAML",
      "managerFilePatterns": ["/^\\.buildkite/.*\\.ya?ml$/"],
      "matchStrings": ["image:\\s*\"(?<depName>...(?:ruby|node|golang)):(?<currentValue>[^\"@]+)\""],
      "datasourceTemplate": "docker" }
  ],
  "packageRules": [
    { "matchPackageNames": ["vite_rails", "vite_ruby", "vite-plugin-ruby"], "groupName": "vite packages", "automerge": true },
    { "matchManagers": ["buildkite"], "groupName": "buildkite plugins", "automerge": true },
    { "matchManagers": ["git-submodules"], "matchCurrentVersion": "/^main$/", "enabled": true, "automerge": true },
    { "matchUpdateTypes": ["major"], "automerge": false }
  ]
}
```

**What's notable:** Six managers simultaneously: npm, bundler, dockerfile, buildkite, git-submodules, custom.regex. Cross-ecosystem grouping — `vite_rails` (Ruby gem) and `vite-plugin-ruby` (npm) in the same group. Git submodule tracking on `main` branch enabled with automerge.

**Agent-first inspiration:** Cross-ecosystem package grouping is the right pattern for tightly-coupled frontend tools where gem and npm versions must upgrade together.

---

### 13. icoretech/pgbouncer-docker

**URL:** https://github.com/icoretech/pgbouncer-docker/blob/main/renovate.json  
**Org:** icoretech  
**Ecosystem:** Docker only  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/(^|/)Dockerfile$/"],
      "matchStrings": ["# renovate: datasource=(?<datasource>\\S+) depName=(?<depName>\\S+)\\s+ARG REPO_TAG=(?<currentValue>\\S+)"],
      "versioningTemplate": "regex:^pgbouncer_(?<major>\\d+)_(?<minor>\\d+)_(?<patch>\\d+)(?:-(?<prerelease>[0-9A-Za-z.-]+))?$"
    }
  ],
  "packageRules": [
    { "matchManagers": ["custom.regex"], "matchUpdateTypes": ["minor", "patch", "pin", "digest"], "automerge": true }
  ]
}
```

**What's notable:** Custom `versioningTemplate` with a regex to parse PgBouncer's non-semver tag format (`pgbouncer_1_23_0` → semver). This is the escape hatch for any project using underscore-delimited or otherwise non-standard version strings.

**Agent-first inspiration:** `versioningTemplate: "regex:^..."` with named capture groups (`<major>`, `<minor>`, `<patch>`) is how to track any project that doesn't use semver tags.

---

### 14. Automattic/wp-calypso (self-hosted config note)

*(Covered in Tier 1 at #4. Note: the `platform`, `gitAuthor`, and `repositories` keys only appear in a global self-hosted config, not a per-repo `renovate.json`. Seeing these in a repo file is a signal the file is the bot's actual config, not a standard repo config.)*

---

## Tier 3 — Multi-Branch Release Coordination

### 15. argoproj/argo-workflows

**URL:** https://github.com/argoproj/argo-workflows/blob/main/renovate.json  
**Org:** CNCF / Argo  
**Ecosystem:** Go, Node (Yarn), Nix, Docker  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "baseBranchPatterns": ["main", "release-3.7", "release-4.0"],
  "nix": { "enabled": true },
  "packageRules": [
    { "matchBaseBranches": ["release-3.7", "release-4.0"], "matchUpdateTypes": ["major", "minor"], "enabled": false },
    { "matchBaseBranches": ["release-3.7", "release-4.0"], "rangeStrategy": "in-range-only" },
    { "matchBaseBranches": ["main"], "matchUpdateTypes": ["patch"], "automerge": true },
    { "matchBaseBranches": ["release-3.7", "release-4.0"], "matchUpdateTypes": ["lockFileMaintenance"], "enabled": false }
  ],
  "platformAutomerge": true,
  "lockFileMaintenance": { "enabled": true },
  "osvVulnerabilityAlerts": true
}
```

**What's notable:** Per-branch policies via `matchBaseBranches`: release branches get only patch updates with conservative `in-range-only` range strategy; no major/minor and no lock file maintenance. Main branch automerges patches. Reference pattern for long-running support branches.

**Agent-first inspiration:** `matchBaseBranches` is the correct mechanism for different policies per release track. An agent evaluating a PR can check the target branch to determine what risk tier the update represents.

---

### 16. verdaccio/verdaccio

**URL:** https://github.com/verdaccio/verdaccio/blob/master/renovate.json  
**Org:** Verdaccio  
**Ecosystem:** Node (npm), Docker, GitHub Actions  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "baseBranchPatterns": ["master", "8.x", "6.x", "7.x"],
  "schedule": ["on the 1,11,21 day of the month"],
  "packageRules": [
    { "matchBaseBranches": ["8.x"], "matchUpdateTypes": ["major"], "enabled": false },
    { "matchBaseBranches": ["6.x"], "matchDepTypes": ["devDependencies"], "enabled": false },
    { "matchManagers": ["github-actions"], "pinDigests": true, "schedule": ["every 3 months"] },
    { "matchPackageNames": ["node"], "matchBaseBranches": ["6.x"], "allowedVersions": "/^22/" },
    { "matchPackageNames": ["node"], "matchBaseBranches": ["master", "7.x"], "allowedVersions": "/^24/" },
    { "matchUpdateTypes": ["major"], "matchBaseBranches": ["master", "7.x"], "schedule": ["every 2 months"] }
  ],
  "internalChecksFilter": "strict"
}
```

**What's notable:** Actions updated every 3 months. Majors on a 2-month cadence on master. Node Docker image pinned per branch (`^22` on legacy, `^24` on current). Dev deps fully disabled on legacy 6.x branch. Branch-specific Node version pinning via `allowedVersions` regex.

**Agent-first inspiration:** Different `allowedVersions` per branch is the correct pattern when different branches must support different runtime versions. Monthly or quarterly action schedules reduce noise without missing security updates.

---

### 17. projectcalico/calico

**URL:** https://github.com/projectcalico/calico/blob/master/renovate.json  
**Org:** CNCF / Calico (Tigera)  
**Ecosystem:** Go, Node, Docker  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

Key patterns:
- Almost everything disabled, then selectively re-enabled: `k8s.io/**` and `golang.org/x/**` only
- All updates grouped into a single PR (`groupName: "dependency-updates"`)
- `addLabels`: heavy project management labels including `merge-when-ready`, `skip-bot-cherry-pick`
- Custom `prBodyTemplate` to control PR body sections
- `postUpgradeTasks: { commands: ["make gen-deps-files"] }` regenerates vendor dependency list

**Agent-first inspiration:** `skip-bot-cherry-pick` is a useful label for bots that auto-cherry-pick PRs — dep bump PRs should not be cherry-picked automatically. The "disable all, re-enable selectively" pattern is safer than the inverse for high-risk codebases.

---

### 18. grafana/mimir (multi-branch) — also in Tier 1 #8

Release branches (`release-3.1`, `release-3.0`) completely disabled via `enabled: false, matchPackageNames: ["*"]`.

---

## Tier 4 — Security-First Configs

### 19. cypress-io/eslint-plugin-cypress

**URL:** https://github.com/cypress-io/eslint-plugin-cypress/blob/master/renovate.json  
**Org:** Cypress.io  
**Ecosystem:** Node (npm)  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "configMigration": true,
  "automerge": true,
  "major": { "automerge": false },
  "prHourlyLimit": 2,
  "minimumReleaseAge": "7 days",
  "osvVulnerabilityAlerts": true,
  "vulnerabilityAlerts": { "minimumReleaseAge": "0 days" },
  "rangeStrategy": "bump",
  "lockFileMaintenance": { "enabled": true },
  "packageRules": [
    { "matchDepTypes": ["peerDependencies"], "enabled": false },
    { "matchPackageNames": ["cypress"], "minimumReleaseAge": "0 days" }
  ]
}
```

**What's notable:** Vulnerability alerts bypass the 7-day wait via `vulnerabilityAlerts.minimumReleaseAge: "0 days"`. Peer dependencies disabled. Cypress itself (their own product) bypasses the stability wait. Lock file maintenance enabled.

**Agent-first inspiration:** The two-tier release age is the canonical security fast-lane. An agent can reliably identify security PRs by the zero-delay trait.

---

### 20. stakater/Reloader

**URL:** https://github.com/stakater/Reloader/blob/master/renovate.json  
**Org:** Stakater  
**Ecosystem:** Go, Docker, Helm  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "vulnerabilityAlerts": { "enabled": true, "labels": ["security"] },
  "customManagers": [
    { "customType": "regex",
      "fileMatch": [".vale.ini"],
      "matchStrings": ["https:\\/\\/github\\.com\\/(?<depName>.*)\\/releases\\/download\\/(?<currentValue>.*)\\/.*\\.zip"],
      "datasourceTemplate": "github-releases" },
    { "customType": "regex",
      "fileMatch": ["values\\.yaml$"],
      "matchStrings": ["image:\\s*name: (?<depName>[a-zA-Z0-9\\.\\/]*)\\s*tag: (?<currentValue>[a-zA-Z0-9\\.\\/]*)"],
      "datasourceTemplate": "docker" }
  ]
}
```

**What's notable:** Tracks download URLs inside `.vale.ini` (documentation linting tool) to keep Vale style packages updated. Also tracks Docker images embedded in Helm `values.yaml`. Any file with a GitHub release download URL can be managed.

**Agent-first inspiration:** `.vale.ini` tracking demonstrates the pattern extends to any config/tooling file, not just source code.

---

### 21. dev-sec/ansible-collection-hardening

**URL:** https://github.com/dev-sec/ansible-collection-hardening/blob/master/renovate.json  
**Org:** dev-sec  
**Ecosystem:** Ansible  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:best-practices", ":gitSignOff"],
  "dependencyDashboard": true,
  "dependencyDashboardAutoclose": true,
  "packageRules": [
    { "matchUpdateTypes": ["patch", "minor"], "automerge": true }
  ]
}
```

**What's notable:** `:gitSignOff` preset adds `Signed-off-by` trailers (required for DCO). `dependencyDashboardAutoclose: true` closes the dashboard issue automatically when no updates are pending.

**Agent-first inspiration:** `:gitSignOff` is necessary for repos with DCO enforcement. `dependencyDashboardAutoclose` keeps the issue tracker clean without human intervention.

---

### 22. meerkat-lang/meerkat

**URL:** https://github.com/meerkat-lang/meerkat/blob/main/renovate.json  
**Org:** meerkat-lang  
**Ecosystem:** Rust (Cargo), GitHub Actions, pre-commit  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:best-practices", ":enablePreCommit"],
  "abandonmentThreshold": "2 years",
  "osvVulnerabilityAlerts": true,
  "dependencyDashboardOSVVulnerabilitySummary": "all",
  "platformCommit": "enabled",
  "rollbackPrs": true,
  "separateMultipleMajor": true,
  "enabledManagers": ["cargo", "github-actions", "pre-commit"]
}
```

**What's notable:** `abandonmentThreshold: "2 years"` skips updates from packages with no upstream activity for 2 years — flags zombie dependencies. `platformCommit: "enabled"` uses GitHub's commit API instead of git push (useful for branch protection requiring signed commits). `rollbackPrs: true` creates rollback PRs when an automerged update breaks CI. `dependencyDashboardOSVVulnerabilitySummary: "all"` shows OSV data in dashboard.

**Agent-first inspiration:** `platformCommit` + `rollbackPrs` together create a safety net: if an automerged update breaks CI, a rollback PR appears automatically. `abandonmentThreshold` is a useful signal for flagging zombie deps.

---

### 23. avishj/blueprints

**URL:** https://github.com/avishj/blueprints/blob/main/renovate.json  
**Org:** avishj  
**Ecosystem:** Python (pep621), Dockerfile, GitHub Actions, pre-commit  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

Similar pattern to #22 (meerkat): `platformCommit`, `rollbackPrs`, `abandonmentThreshold`, `dependencyDashboardOSVVulnerabilitySummary`. Blueprint/template repo baking these into defaults. Python PEP 621 + pre-commit + Actions + Dockerfile managers enabled together.

---

### 24. midokura/phoenix-documentation

**URL:** https://github.com/midokura/phoenix-documentation/blob/main/renovate.json  
**Org:** midokura  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:recommended", "default:automergeStableNonMajor", "mergeConfidence:all-badges"],
  "minimumReleaseAge": "60 days",
  "minimumConfidence": "high",
  "internalChecksFilter": "strict",
  "addLabels": ["dependencies"]
}
```

**What's notable:** `minimumReleaseAge: "60 days"` — one of the longest release-age windows seen in the wild. Paired with `minimumConfidence: "high"` (Mend's merge confidence data), only packages with both 60 days of release history AND high community adoption get updated. Extremely conservative.

**Agent-first inspiration:** `minimumConfidence` is a Mend-proprietary feature that uses community adoption data to score update safety. `60 days + high confidence` is the right combination for production infrastructure that cannot tolerate surprise breakage.

---

## Tier 5 — Kubernetes / Home-Ops / IaC Clusters

### 25. nshores/k8s-home-ops

**URL:** https://github.com/nshores/k8s-home-ops/blob/main/renovate.json5  
**Org:** personal  
**Ecosystem:** Kubernetes (Docker + Helm), Flux CD  
**Config format:** `renovate.json5`  
**Found:** 2026-06-20

```json5
{
  timezone: 'America/Los_Angeles',
  dependencyDashboard: true,
  commitMessageSuffix: '[ci-skip]',
  ignoreDeps: ['ghcr.io/fluxcd/helm-controller', 'ghcr.io/fluxcd/source-controller'],
  customManagers: [
    { customType: 'regex',
      managerFilePatterns: ['/./.+\\.yaml$/'],
      matchStrings: ['registryUrl=(?<registryUrl>.*?)\\n *chart: (?<depName>.*?)\\n *version: (?<currentValue>.*)\\n'],
      datasourceTemplate: 'helm' }
  ],
  packageRules: [
    { matchPackageNames: ['ghcr.io/home-assistant/home-assistant', 'lscr.io/linuxserver/plex'],
      schedule: ['after 12am and before 7am'],
      automergeSchedule: ['after 12am and before 7am'],
      automerge: true,
      labels: ['nightly-update-window'] },
    { matchDatasources: ['docker'], versioning: 'loose', matchPackageNames: ['plexinc/pms-docker'] },
    { matchDatasources: ['docker'], matchUpdateTypes: ['major'], labels: ['renovate/image-release', 'dependency/major'] },
    { matchDatasources: ['helm'], matchUpdateTypes: ['major'], labels: ['renovate/helm-release', 'dependency/major'] }
  ]
}
```

**What's notable:** Home Assistant and Plex updates restricted to nightly window (midnight–7am). `versioning: 'loose'` for Plex (non-standard version strings). Separate label taxonomies for Docker vs. Helm. Flux CD controllers excluded. `[ci-skip]` suffix prevents CI from running on dep bumps.

**Agent-first inspiration:** The nightly-window `automergeSchedule` is a mature pattern for infrastructure — changes go in while no one is watching, checked the next morning. The `dependency/major`, `dependency/minor`, `dependency/patch` label taxonomy is excellent for agent triage.

---

### 26. onedr0p/cluster-template

**URL:** https://github.com/onedr0p/cluster-template/blob/main/.renovaterc.json5  
**Org:** onedr0p  
**Ecosystem:** Kubernetes, Flux, Helm, Mise tools  
**Config format:** `.renovaterc.json5`  
**Found:** 2026-06-20

```json5
{
  extends: ["github>home-operations/renovate-presets#2.0.0"],
  schedule: ["every weekend"],
  lockFileMaintenance: { enabled: true, schedule: ["every weekend"] },
  packageRules: [
    { matchManagers: ["mise"], automerge: true, automergeType: "branch", ignoreTests: true },
    { matchManagers: ["github-actions"], automerge: true, automergeType: "branch", minimumReleaseAge: "3 days", ignoreTests: true },
    { matchUpdateTypes: ["major"], addLabels: ["type/major"] },
    { matchDatasources: ["docker"], addLabels: ["renovate/container"] },
    { matchDatasources: ["helm"], addLabels: ["renovate/helm"] },
    { matchManagers: ["github-actions"], addLabels: ["renovate/github-action"] }
  ]
}
```

**What's notable:** Extends a versioned community preset (`#2.0.0` tag) — pinning prevents silent behavior changes. `mise` manager (mise-en-place tool versions) automerges on branch. Five label rules create a clean datasource-scoped taxonomy.

**Agent-first inspiration:** Pinning preset versions with `#2.0.0` is critical for production infra. The label taxonomy here is the most agent-readable variant seen: datasource-scoped labels enable instant classification without reading the diff.

---

### 27. imagegenius/docker-immich

**URL:** https://github.com/imagegenius/docker-immich/blob/main/.renovaterc.json5  
**Org:** imagegenius  
**Ecosystem:** Docker, Docker Bake (HCL)  
**Config format:** `.renovaterc.json5`  
**Found:** 2026-06-20

```json5
{
  extends: ["github>home-operations/renovate-config"],
  customManagers: [
    { customType: "regex",
      description: "Process Annotations in Docker Bake HCL",
      managerFilePatterns: ["/(^|/)docker-bake\\.hcl$/"],
      matchStrings: ['datasource=(?<datasource>\\S+) depName=(?<depName>\\S+)( versioning=(?<versioning>\\S+))?\\n.+ = "(?<currentValue>[^"]+)"'],
      versioningTemplate: "{{#if versioning}}{{{versioning}}}{{else}}semver{{/if}}" }
  ],
  packageRules: [
    { matchFileNames: ["docker-bake.hcl"], automerge: true },
    { matchFileNames: ["docker-bake.hcl"], matchDepNames: ["nodejs/node", "astral-sh/uv"], automerge: false }
  ]
}
```

**What's notable:** Tracks Docker Bake HCL files — a format Renovate can't natively parse yet — using annotation comments. Most bake updates automerge; specific toolchain deps require manual review. Versionng is dynamic via handlebars.

---

## Tier 6 — Niche Ecosystems

### 28. angristan/openvpn-install (shell script only)

**URL:** https://github.com/angristan/openvpn-install/blob/master/renovate.json  
**Org:** angristan  
**Ecosystem:** Shell script  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["config:recommended"],
  "customManagers": [
    {
      "customType": "regex",
      "managerFilePatterns": ["/^openvpn-install\\.sh$/"],
      "matchStrings": ["readonly\\s+EASYRSA_VERSION=\"(?<currentValue>\\d+\\.\\d+\\.\\d+)\""],
      "depNameTemplate": "OpenVPN/easy-rsa",
      "datasourceTemplate": "github-releases",
      "extractVersionTemplate": "^v(?<version>.*)$"
    }
  ]
}
```

**What's notable:** Shell script is the only file in scope. Single custom manager tracks one hardcoded version string. `extractVersionTemplate` strips the `v` prefix from GitHub release tags.

**Agent-first inspiration:** `extractVersionTemplate` is necessary when upstream uses `v1.2.3` tags but the tracked file stores `1.2.3`. Even a single-file bash project can have automated dependency updates.

---

### 29. UI5/openui5 (SAP)

**URL:** https://github.com/UI5/openui5/blob/master/renovate.json  
**Org:** SAP  
**Ecosystem:** Node (npm), enterprise framework  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "commitMessagePrefix": "[INTERNAL] Infra:",
  "rangeStrategy": "bump",
  "reviewers": ["UI5 Foundation"],
  "maven": { "enabled": false },
  "lockFileMaintenance": { "enabled": true },
  "ignorePresets": [":pinDevDependencies"],
  "osvVulnerabilityAlerts": true,
  "packageRules": [
    { "matchDatasources": ["npm"], "minimumReleaseAge": "3 days" },
    { "matchPackageNames": ["@ui5/builder", "@ui5/cli", "@ui5/fs", "@ui5/project", "@ui5/server"],
      "groupName": "All UI5 CLI devDependencies",
      "minimumReleaseAge": null }
  ]
}
```

**What's notable:** Enterprise conventional commit prefix `[INTERNAL] Infra:`. `minimumReleaseAge: null` in a specific rule overrides the global 3-day delay for first-party packages. `ignorePresets: [":pinDevDependencies"]` opts out of one specific best-practices behavior.

**Agent-first inspiration:** `minimumReleaseAge: null` is the escape hatch for first-party or trusted packages without needing a `vulnerabilityAlerts` override.

---

### 30. PaulWoitaschek/Voice (Android/Kotlin)

**URL:** https://github.com/PaulWoitaschek/Voice/blob/main/renovate.json  
**Org:** personal  
**Ecosystem:** Android (Gradle, Maven), Kotlin  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "packageRules": [
    { "matchDatasources": ["maven"],
      "registryUrls": ["https://repo.maven.apache.org/maven2/", "https://dl.google.com/dl/android/maven2/", "https://plugins.gradle.org/m2/"] },
    { "groupName": "AGP, Lint", "matchDepNames": ["com.android.library{/,}**", "com.android.application{/,}**"] },
    { "groupName": "Kotlin, KSP, Mero", "matchPackageNames": ["org.jetbrains.kotlin:{/,}**", "com.google.devtools.ksp{/,}**"] },
    { "matchUpdateTypes": ["minor", "patch", "pin", "digest"], "automerge": true },
    { "matchPackageNames": ["com.google.android.play:review-ktx"], "allowedVersions": "!/^(2\\.0\\.2)$/" }
  ],
  "prHourlyLimit": 0,
  "prConcurrentLimit": 0,
  "configMigration": true
}
```

**What's notable:** Explicit Maven registry URLs for Android (Google Maven, Gradle plugins portal). AGP, Kotlin, KSP grouped together (must upgrade in sync). `allowedVersions: "!/^(2\\.0\\.2)$/"` — negation regex to exclude a specific known-broken version while allowing everything else.

**Agent-first inspiration:** The negation regex in `allowedVersions` is how to exclude specific broken releases without blocking the entire upgrade path.

---

### 31. appium/appium

**URL:** https://github.com/appium/appium/blob/master/.renovaterc.json  
**Org:** Appium (OpenJS Foundation)  
**Ecosystem:** Node (npm)  
**Config format:** `.renovaterc.json`  
**Found:** 2026-06-20

```json
{
  "extends": ["github>appium/appium//renovate/default"],
  "schedule": ["after 10pm", "before 5:00am"],
  "timezone": "America/Vancouver"
}
```

**What's notable:** Three-line config. Policy lives in a preset at `github>appium/appium//renovate/default` (double-slash for subdirectory path). Schedule defined locally; all policy centralized. This is the minimum viable "extend and override schedule only" pattern.

**Agent-first inspiration:** Double-slash path syntax (`github>org/repo//path/to/preset.json`) is essential for hosting presets in non-root repo locations. The pattern shows how far policy centralization can be pushed — consuming repos need only 3 lines.

---

### 32. google/osv.dev

**URL:** https://github.com/google/osv.dev/blob/master/renovate.json  
**Org:** Google  
**Ecosystem:** Go, Python, Docker, Terraform, git-submodules  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "git-submodules": { "enabled": true },
  "lockFileMaintenance": { "enabled": true, "groupName": "lockfile maintenance" },
  "customManagers": [
    { "customType": "regex",
      "managerFilePatterns": ["deployment/terraform/environments/oss-vdb/main.tf"],
      "matchStrings": ["esp_version\\s*=\\s*\"(?<currentValue>.*)\""],
      "depNameTemplate": "gcr.io/endpoints-release/endpoints-runtime-serverless",
      "datasourceTemplate": "docker" },
    { "customType": "regex",
      "managerFilePatterns": ["osv/models.py"],
      "matchStrings": ["SCHEMA_VERSION\\s*=\\s*'(?<currentValue>.*)'"],
      "packageNameTemplate": "ossf/osv-schema",
      "datasourceTemplate": "github-tags" }
  ],
  "packageRules": [
    { "matchFileNames": ["gcp/api/**", "gcp/functions/**", "gcp/workers/**"], "matchCategories": ["python"], "groupName": "gcp-services-python" },
    { "matchFileNames": ["deployment/terraform/**"], "groupName": "terraform" },
    { "matchFileNames": [".github/**"], "groupName": "workflows" },
    { "matchManagers": ["git-submodules"], "groupName": "submodules" }
  ]
}
```

**What's notable:** Uses `matchCategories` (`["python"]`, `["golang"]`) for language-scoped grouping — more stable than listing manager names. Groups updates by directory/subsystem (gcp-api, terraform, workflows, go-libraries). Tracks a Python constant against GitHub tags.

**Agent-first inspiration:** `matchCategories` is immune to manager-name changes and works across multiple managers for the same language (pip, poetry, pep621 all count as "python").

---

### 33. Unstructured-IO/unstructured

**URL:** https://github.com/Unstructured-IO/unstructured/blob/main/renovate.json5  
**Org:** Unstructured-IO (AI/ML)  
**Ecosystem:** Python  
**Config format:** `renovate.json5`  
**Found:** 2026-06-20

```json5
{
  "extends": ["github>unstructured-io/renovate-config"],
  "vulnerabilityAlerts": {
    "postUpgradeTasks": {
      "commands": ["bash scripts/renovate-security-bump.sh"],
      "fileFilters": ["unstructured/__version__.py", "CHANGELOG.md"],
      "executionMode": "branch"
    }
  }
}
```

**What's notable:** `postUpgradeTasks` scoped inside `vulnerabilityAlerts` — runs a version-bump and changelog script *only* on security PRs. Normal dep updates do not run the script. This differentiates post-upgrade behavior by PR type.

**Agent-first inspiration:** Security PRs often need different processing (changelog entries, version bumps) than routine updates. Scoping `postUpgradeTasks` inside `vulnerabilityAlerts` is the clean way to automate that distinction without duplicating rules.

---

### 34. circleci/circleci-docs

**URL:** https://github.com/circleci/circleci-docs/blob/master/renovate.json  
**Org:** CircleCI  
**Ecosystem:** Go, Node  
**Config format:** `renovate.json`  
**Found:** 2026-06-20

```json
{
  "timezone": "Europe/London",
  "postUpdateOptions": ["gomodTidy", "gomodUpdateImportPaths"],
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch", "pin", "digest"],
      "automerge": true,
      "automergeStrategy": "squash",
      "automergeSchedule": [
        "after 9am and before 12pm on monday",
        "after 9am and before 12pm on tuesday",
        "after 9am and before 12pm on wednesday",
        "after 9am and before 12pm on thursday"
      ]
    }
  ]
}
```

**What's notable:** `automergeSchedule` with precise business-hours windows — automerge only fires during working hours on weekdays when a human can catch problems quickly. Weekends and afternoons intentionally excluded.

**Agent-first inspiration:** Business-hours `automergeSchedule` is the responsible pattern for production repos where human oversight matters. The PR may be open and ready but merges only during monitored hours.

---

### 35. ik-automation/my-mixed-pipelines

**URL:** https://github.com/ik-automation/my-mixed-pipelines/blob/master/renovate/003.renovate.json  
**Org:** ik-automation  
**Ecosystem:** Helm (Tanka), Jsonnet, `.tool-versions`  
**Config format:** `renovate.json` (multi-file pattern, stored in subdirectory)  
**Found:** 2026-06-20

```json
{
  "extends": ["config:base", ":disableDependencyDashboard", ":disableRateLimiting"],
  "regexManagers": [
    { "fileMatch": ["^chartfile\\.yaml$"],
      "matchStrings": ["renovate: datasource=(?<datasource>.*?) depName=(?<depName>.*?)...\\s*(version|tag):\\s*(?<currentValue>.*)"] },
    { "fileMatch": ["\\.(j|lib)sonnet$"],
      "matchStrings": ["...\\s*(version|tag):\\s*'(?<currentValue>[^']*)'"] },
    { "fileMatch": ["^\\.tool-versions$"],
      "matchStrings": ["^# renovate: datasource=(?<datasource>.*?) depName=(?<depName>.*?)...\\n[^\\s]+\\s+(?<currentValue>.*)"] }
  ],
  "packageRules": [
    { "matchFiles": ["chartfile.yaml"],
      "postUpgradeTasks": {
        "commands": ["curl -sL ... | tar xz ... helm", "curl -sL ... tk-linux-amd64", "tk tool charts vendor"],
        "fileFilters": ["chartfile.yaml", "charts/**"]
      } }
  ]
}
```

**What's notable:** Uses old `regexManagers` field (equivalent to `customManagers`). Three regex managers for Helm chartfiles, Jsonnet, and `.tool-versions` (asdf format). The `postUpgradeTasks` dynamically installs the correct Helm and Tanka versions from `.tool-versions` before vendoring.

**Agent-first inspiration:** `.tool-versions` (asdf format) regex manager is the correct approach for tracking language/tool version pins without a native manager. The bootstrap pattern (install tool from the file being updated) is creative but risky — those `curl` URLs are themselves unmanaged by Renovate.

---

## Patterns Summary

### Top 10 Patterns Worth Considering for Agent-First Strategy

| # | Pattern | Key Repos | Notes |
|---|---------|-----------|-------|
| 1 | `postUpgradeTasks` per manager/rule | angular, pulumi, gitea, elastic, calico | Commits generated artifacts into the PR branch |
| 2 | `// renovate:` annotation comments | pulumi, grafana/mimir, gitea | Tracks hardcoded version via inline comment in any file |
| 3 | `automergeSchedule` business hours | circleci-docs, k8s-home-ops | Merge only when humans are monitoring |
| 4 | `matchBaseBranches` per-branch policies | argo-workflows, verdaccio, calico, mimir | Different rules per release branch |
| 5 | `abandonmentThreshold` + `rollbackPrs` | meerkat, avishj/blueprints | Auto-flag zombie deps; auto-rollback on CI failure |
| 6 | `mergeConfidence:all-badges` | Automattic/wp-calypso, midokura | Adds community adoption signal to PR descriptions |
| 7 | `minimumConfidence: "high"` | midokura/phoenix-documentation | Merge only when community evidence is strong |
| 8 | `prBodyNotes` with structured content | ampproject/amphtml, prometheus | Machine-readable blocks for downstream tools |
| 9 | Datasource-scoped label taxonomy | onedr0p, nshores, LedgerHQ | `renovate/container`, `renovate/helm` etc. for routing |
| 10 | `dependencyDashboardOSVVulnerabilitySummary: "all"` | meerkat, avishj | Shows all OSV vulnerability data in dashboard issue |

### Rarely Used But High-Value Features

| Feature | What it does | Seen in |
|---------|-------------|---------|
| `platformCommit: "enabled"` | Uses GitHub commit API (signed commit bypass) | meerkat, avishj/blueprints |
| `minimumGroupSize: N` | Prevents group PRs when < N packages have updates | renovatebot/renovate |
| `versioningTemplate` regex | Parses non-semver tag formats | icoretech/pgbouncer-docker |
| `additionalBranchPrefix` with handlebars | Per-package/per-directory branch namespacing | oapi-codegen, grafana/mimir |
| `separateMultipleMajor: true` | Splits multiple major versions into separate PRs | meerkat, prometheus |
| `internalChecksFilter: "strict"` | Holds PRs until all CI checks pass | Automattic/wp-calypso, midokura, circleci |
| `dependencyDashboardAutoclose: true` | Closes dashboard issue when no pending work | dev-sec/ansible-hardening |
| `gitIgnoredAuthors` | Prevents bot commits from triggering rebase loops | grafana/mimir |
| `minimumGroupSize` | Requires at least N packages to form a group PR | renovatebot/renovate |
| `extractVersionTemplate` | Strips prefixes from upstream release tags | angristan/openvpn-install |

### Anti-Patterns Observed

| Anti-Pattern | Risk | Better Alternative |
|---|---|---|
| `prHourlyLimit: 0, prConcurrentLimit: 0` | PR flood in large repos | Set `prConcurrentLimit: 10–20` |
| `postUpgradeTasks` with ad-hoc `curl` downloads | URL itself is unmanaged by Renovate | Use container images or managed tool versions |
| `regexManagers` (old field name) | Still works but deprecated | Use `customManagers` |
| `extends: ["config:base"]` | Old preset name | Use `config:recommended` |
| `:disableRateLimiting` in shared pipelines | Can trigger GitHub API rate limits | Use reasonable `prHourlyLimit` |
| Dashboard as primary inbox | Creates dependency on issue triage | Prefer PR-as-inbox (no dashboard) |
