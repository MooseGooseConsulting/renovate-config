# ADR 0004: Two PRs per repository — non-major group, major group

- Status: accepted (owner direction, 2026-11-16)
- Applies to: every repository the shared preset reaches
- Supersedes: [ADR 0003](0003-one-non-major-pr-and-five-slots.md) (separate
  major PRs, Python split, lock-file maintenance); the five-slot cap, the
  4-day soak ([ADR 0001](0001-fleet-release-age-soak.md)), dashboard
  visibility and the security-fix uncapping
  ([ADR 0002](0002-dashboard-visibility-and-uncapped-security-fixes.md)) are
  unchanged

## Context

ADR 0003 grouped every minor, patch, digest, pin and pinDigest update into one
weekly "all non-major dependencies" PR, kept each major upgrade in its own
`major-upgrade` PR, and gave Python its own `python` PR and lock-file
maintenance its own PR. On 2026-11-16 the brand-new
Coldaine/CodeConversationSync repository, which has no local Renovate config
and inherits the shared preset from the runner, received one non-major PR
(renovate/all-minor-patch) plus four separate major PRs at once (@google/genai
v3, @hookform/resolvers v7, @types/node v26, eslint v10), with four more
majors and lock-file maintenance queued behind the five-slot cap on its
Dependency Dashboard. The owner wants two grouped PRs per repository: majors
together, non-majors together, nothing else.

## Decision

- **Two PRs per repository.** `default.json` extends `group:allNonMajor` (as
  before) with `separateMinorPatch` off, so minor and patch stay together in
  one weekly "all non-major dependencies" PR (digest, pin and pinDigest join
  it too, as before). A packageRule matches every major update into one weekly
  "all major dependencies" PR, so major upgrades land together instead of one
  PR each.
- **Majors stay out of the non-major PR.** `separateMajorMinor` stays on (its
  original semantics): it keeps majors out of the non-major PR; the grouping
  rule is what gathers them into their own PR.
- **No Python split.** The former Python rules are deleted: Python patches,
  digest and pin updates join "all non-major dependencies", Python minor and
  major upgrades join "all major dependencies". Ecosystem splits contradict
  the two-PR-by-update-type model.
- **No lock-file maintenance.** `lockFileMaintenance` is disabled: Renovate
  44.107.0 cannot group it with other update types, so keeping it would be a
  third PR. Trade-off: lockfiles are still refreshed inside the two grouped
  PRs whenever dependencies change (the grouped updates' lock regeneration,
  soaked per ADR 0001), but standalone lock-file-only refreshes stop
  happening. The ADR 0001 pass-to-package-manager soak still applies when
  Renovate regenerates a lock file for a grouped update.
- **What stays.** The Monday schedule, the 4-day release-age soak, no
  automerge, the five ordinary PR slots, the Dependency Dashboard, and the
  uncapped security lane are untouched. A consumer's own group rules come
  later and still take precedence.

## Consequences

- A breaking major now rides with every other major in the major PR; one
  failing package holds back the whole major PR (or the whole non-major PR)
  until the reviewing agent fixes the branch or splits the package out with a
  consumer rule. Review surface: two PRs per repository per week at most
  (plus uncapped security fixes and transitive lock regeneration inside them).
- Existing per-major PRs open under the old policy converge on the next full
  run: Renovate re-groups their updates into "all major dependencies", closes
  the superseded branches, and stops raising lock-file maintenance. The
  Dependency Dashboard issue stays open as the queue view.
- Repositories with more than five open ordinary PRs under the old policy keep
  them until their updates are re-grouped; nothing is closed merely to fit
  the cap.

## Revisit when

- The non-major or the major PR in a repository fails CI for most weeks in a
  row: split the noisy ecosystem out with a consumer group rule, or add a
  shared group for it.
- The owner turns automerge on for routine updates (#33 item 1).
