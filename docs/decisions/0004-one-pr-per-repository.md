# ADR 0004: One PR per repository for all dependency updates

- Status: accepted (owner direction, 2026-11-16)
- Applies to: every repository the shared preset reaches
- Supersedes: [ADR 0003](0003-one-non-major-pr-and-five-slots.md) (grouping and
  separate major/Python PRs); the five-slot cap, the 4-day soak
  ([ADR 0001](0001-fleet-release-age-soak.md)), dashboard visibility and the
  security-fix uncapping ([ADR 0002](0002-dashboard-visibility-and-uncapped-security-fixes.md)) are unchanged

## Context

ADR 0003 grouped every minor, patch, digest, pin and pinDigest update into one
weekly "all non-major dependencies" PR, kept each major upgrade in its own
`major-upgrade` PR, and gave Python its own `python` PR. On 2026-11-16 the
brand-new Coldaine/CodeConversationSync repository, which has no local
Renovate config and inherits the shared preset from the runner, received one
non-major PR (renovate/all-minor-patch) plus four separate major PRs at once
(@google/genai v3, @hookform/resolvers v7, @types/node v26, eslint v10), with
four more majors and lock-file maintenance queued behind the five-slot cap on
its Dependency Dashboard. The owner asked for a single PR per repository
instead: one review surface for all dependency updates.

## Decision

- **One PR per repository.** `default.json` extends `group:all` (instead of
  `group:allNonMajor`) after `config:best-practices`, with
  `separateMajorMinor` and `separateMinorPatch` off. Every major, minor, patch,
  digest, pin, pinDigest and replacement update in a repository comes in one
  weekly "all dependencies" PR.
- **The old split rules are removed.** The digest/pin/pinDigest rule that
  reassigned those updates to the old group, the major rule that labelled
  majors `major-upgrade`, and both Python rules (`separateMinorPatch` for
  Python, the separate `python` group) are deleted; Python now joins "all
  dependencies" like everything else.
- **What stays.** The Monday schedule, the 4-day release-age soak, no
  automerge, the five ordinary PR slots, the Dependency Dashboard, and the
  uncapped security lane are untouched. Lock-file maintenance stays its own
  weekly PR: Renovate 44.107.0 cannot group it with other update types
  (see ADR 0003). A consumer's own group rules come later and still take
  precedence.

## Consequences

- A breaking major (for example a Python 3.15 bump) now rides with every other
  update; one failing package holds back the whole PR until the reviewing
  agent fixes the branch or splits the package out with a consumer rule. This
  is the same firewall tradeoff ADR 0003 accepted for the non-major PR,
  generalized to majors.
- Existing per-major PRs open under the old policy converge on the next full
  run: Renovate re-groups their updates into "all dependencies" and closes the
  superseded branches. The Dependency Dashboard issue stays open as the queue
  view.
- Repositories with more than five open ordinary PRs under the old policy keep
  them until their updates are re-grouped; nothing is closed merely to fit
  the cap.

## Revisit when

- The single PR in a repository fails CI for most weeks in a row: split the
  noisy ecosystem out with a consumer group rule, or add a shared group for it.
- The owner turns automerge on for routine updates (#33 item 1).
