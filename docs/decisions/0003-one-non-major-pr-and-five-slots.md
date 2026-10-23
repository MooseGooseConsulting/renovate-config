# ADR 0003: One non-major PR per repository and five PR slots

- Status: accepted (owner approval, 2026-10-22; [#33](https://github.com/MooseGooseConsulting/renovate-config/issues/33) item 2)
- Applies to: every repository the shared preset reaches
- Supersedes: the five domain groups and the two-slot cap in `default.json`; the security-fix
  uncapping in [ADR 0002](0002-dashboard-visibility-and-uncapped-security-fixes.md) is unchanged

## Context

The preset split routine updates into five domain groups (application dependencies, development
tools, container images, infrastructure, CI and development environment) and allowed two ordinary
PRs per repository. Majors shared those two slots. With nobody merging, 19 repositories had both
slots held from 2026-09-22 onwards (coldaine-codeOps#305), and the other domain groups queued
behind them. The owner's agent now reviews and merges dependency PRs on a weekly run, so fewer,
larger routine PRs and a few more slots serve it better than many narrow groups.

Facts about Renovate 44.107.0, the runner's pinned version:

- `group:allNonMajor` is one packageRule: `matchPackageNames: ["*"]`, `matchUpdateTypes: ["minor", "patch"]`,
  `groupName: "all non-major dependencies"`, `groupSlug: "all-minor-patch"`
  (`lib/config/presets/internal/group.preset.ts`). It does not match digest or pin updates.
- A rule with the same `groupName` and `groupSlug` puts other update types in the same branch.
- Lock-file maintenance cannot join another group's branch. `generateBranchName` prefixes a grouped
  lock-file-maintenance slug with `lock-file-maintenance-`, and `generate.ts` warns that "Grouping
  lockfile maintenance with other update types is not supported".
- With `separateMinorPatch` (set only for Python packages here), a patch update in a group gets a
  `patch-` slug prefix, so Python patch releases form a second, patch-only branch of the group.
- A later packageRule that sets only `groupName` also replaces an earlier `groupSlug`
  (`lib/util/package-rules/index.ts`), so a consumer's own group rules still win.

## Decision

- **One non-major PR.** `default.json` extends `group:allNonMajor` after `config:best-practices`, and
  one rule adds digest, pin and pinDigest updates to the same group. Every minor, patch, digest, pin and
  pinDigest update in a repository comes in one weekly "all non-major dependencies" PR, except the exceptions in
  the next bullet (Python patch releases get the group's patch-only branch). Its minor, patch and
  digest updates still wait out the 4-day soak ([ADR 0001](0001-fleet-release-age-soak.md)); pin and
  pinDigest updates carry no release date and are not held.
- **Separate PRs stay separate:** each major upgrade (`separateMajorMinor`, label `major-upgrade`,
  Renovate's related-package groups kept); Python minor and major upgrades (`python`); Python patch
  releases (the patch branch of the non-major group); lock-file maintenance; replacements.
- **Five slots.** `prConcurrentLimit` and `branchConcurrentLimit` are 5. Security fixes stay
  uncapped (`vulnerabilityAlerts`, ADR 0002).
- **Consumers keep their groups.** Consumer packageRules come after the preset's, so a repository's
  own groups (homelab-next's file-path, Talos and Kubernetes, Gateway API, LiteLLM and OpenTofu
  groups) take precedence over the non-major group, and a repository's own caps (homelab-next sets
  0, no limit) replace the preset's.
- Automerge stays off. The owner's agent merges.

## Consequences

- A typical repository gets at most a handful of PRs a week: the non-major PR, one per major, and
  lock-file maintenance where it is on. One failing package in the non-major PR holds back the rest
  of it until the reviewing agent fixes the branch or the package is split out with a consumer rule.
- A repository with more than five open ordinary PRs queues the rest; the Dependency Dashboard lists
  them under "Rate-Limited".
- Before this, the old domain groups' separation (for example, CI changes apart from application
  changes) helped review. The reviewer now reads one larger diff.

## Revisit when

- The non-major PR in a repository fails CI for most weeks in a row: split the noisy ecosystem out
  with a consumer group rule, or add a shared group for it.
- The owner turns automerge on for routine updates (#33 item 1).
