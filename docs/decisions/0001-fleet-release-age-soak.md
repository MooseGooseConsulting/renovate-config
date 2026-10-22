# ADR 0001: Fleet-wide 4-day release-age soak, failing closed

- Status: accepted (owner decision, 2026-10-21)
- Applies to: every repository the shared preset reaches

## Context

On 2026-10-21, LiteLLM 1.107.0 was published to PyPI and Docker Hub/GHCR with a credential stealer that ran on every Python start. It was pulled about two hours later ([advisory](https://docs.litellm.ai/blog/security-incident-oct-21-2026)). homelab-next was not affected because its image is pinned by digest. But its Renovate rule set `minimumReleaseAgeBehaviour: timestamp-optional`. GHCR publishes no release dates, so the 4-day soak recorded on that rule never applied, and a poisoned release could have been proposed on the next run.

Facts about Renovate 44.107.0, the runner's pinned version:

- `minimumReleaseAge` holds a release until it is old enough. With `timestamp-required`, the default since v42, an undated release is held indefinitely.
- The docker datasource reads release dates only from Docker Hub. GHCR support ([renovatebot/renovate#39064](https://github.com/renovatebot/renovate/issues/39064)) is unshipped. The OCI `created` annotation is set by the publisher, and maintainers reject it as forgeable.
- Docker Hub refuses anonymous tag paging past page 10. When that happens, Renovate discards every date it fetched ([#46925](https://github.com/renovatebot/renovate/issues/46925)).
- Pin, pinDigest, replacement, lock-file maintenance and rollback updates carry no release date. Range bumps (`rangeStrategy: bump`) and lock-file-only updates are flags on major, minor and patch updates, so they are dated and held like them.
- `python-version`, `java-version`, `dart-version`, `github-runners`, `git-refs` and `git-tags` publish no release dates. A digest update of a floating tag (`latest`, `lts-alpine`) is never dated either, because Renovate 44 has no version to take the date from.
- Pure digest updates are aged against the current version's date at lookup. The branch-stage `renovate/stability-days` check reads a field digest updates never have, so it stays pending forever ([#45236](https://github.com/renovatebot/renovate/issues/45236)).
- `github-tags` dates a tag by its first release, so a force-pushed tag passes at once.

## Decision

- **The rule.** Major, minor, patch and digest updates wait 4 days after release, with `timestamp-required` stated explicitly. Pin, pinDigest, replacement, lockFileMaintenance and rollback updates are not held, because they carry no date, matching Renovate's own `security:minimumReleaseAge*` presets; range bumps and lock-file-only updates are held with the updates they ride on.
- **Exemptions.** First-party images on GHCR (`ghcr.io/moosegooseconsulting/**`, `ghcr.io/coldaine/**`) and first-party GitHub actions and releases (`MooseGooseConsulting/**`, `Coldaine/**`, scoped to the GitHub datasources so an unclaimed Docker Hub namespace of the same name stays soaked) are exempt, because this fleet builds them. `github-runners`, `python-version`, `java-version` and `dart-version` are exempt: they name official toolchain releases, and holding them forever would stop the Python patch releases the 2026-10-13 Python rule keeps flowing. Vulnerability-fix PRs keep their bypass.
- **Status check.** `statusCheckWhen.minimumReleaseAge: never` turns off the stability status check. The gate is the lookup stage: `internalChecksFilter: strict` creates no branch until an update has aged.
- **Runner settings.** The runner sets `dockerMaxPages: 10`, which is a global-only option, and writes a file report. A job-summary step turns it into four counts per repository:
  - **Held, no release date:** waits forever unless the dependency gets a dated source or an exemption. Any count raises a warning annotation.
  - **Held, aging:** under 4 days old, and clears by itself.
  - **Newer releases withheld:** Renovate proposed an older release while newer ones wait. The report does not say whether those are dated, so they are excluded from the undated count. They normally age out.
  - **Lookup warnings.**

  Public repositories are named, checked with the runner's token; private ones are aggregated. Repositories whose visibility lookup fails get a separate "visibility unknown" row and a warning.
- **Undated images.** Consumers keep undated images updating by mapping each one to a Docker Hub repository that serves identical index digests, using `overridePackageName`. The mapping is checked per tag before it is added. Images with no such mirror stay held, visibly.

## Consequences

- **Fewer updates.** Non-exempt images on GHCR, Quay, registry.k8s.io, MCR and GCR get no version or digest updates unless they are mapped. Floating-tag digests (`node:lts-alpine@sha256:…`) and `git-refs`/`git-tags` dependencies are held forever too; a mapping cannot help them. The remedy is a versioned tag (`node:24.11-alpine@sha256:…`), or a narrow consumer rule with `minimumReleaseAge: null` where the owner accepts the risk. This trades part of North Star G1 ("use Renovate broadly") for supply-chain safety. Under "Quiet, Not Silent", the job summary is what keeps the holds visible, so a broken summary is a policy failure, not cosmetic.
- **Docker Hub coverage is partial.** Dates come from the newest 1,000 tags. A pin older than that loses digest-update dates, though newer versions still arrive. A mapped image depends on its mirror staying digest-identical; if it drifts, a proposed digest may not exist on the original registry.
- **Transitive dependencies are not held.** The soak filters only the version Renovate proposes. When an update or a weekly lock-file maintenance run regenerates a lock file (`uv.lock`, `poetry.lock`, `package-lock.json`), the package manager may resolve a transitive release published minutes earlier ([renovatebot/renovate discussion #41607](https://github.com/renovatebot/renovate/discussions/41607); uv `--exclude-newer` support is still open in [#41654](https://github.com/renovatebot/renovate/issues/41654)). Closing this needs a package-manager-native cooldown, or no regeneration; it is tracked in [#28](https://github.com/MooseGooseConsulting/renovate-config/issues/28).
- **No fast lane for images.** GitHub advisories do not cover container images, so an urgent image fix needs a narrow consumer rule with `minimumReleaseAge: null`.
- **Other runners.** A consumer that runs Renovate outside this runner must set `dockerMaxPages` itself.
- **The page cap is global.** Renovate 44 always pages GHCR, Quay, cgr.dev and Red Hat registries fully. Other non-Docker-Hub registries stop at 10 pages, but their images have no dates and are held regardless. An image exempted with `minimumReleaseAge: null` on an oldest-first registry such as lscr.io may miss its newest tags; give such a repository its own runner setting if that arises.

## Revisit when

- Renovate dates GHCR images natively (#39064), or opt-in OCI timestamps ([#43566](https://github.com/renovatebot/renovate/pull/43566)) merge.
- The runner token gains `read:packages`, making a GitHub Packages API datasource possible ([#27](https://github.com/MooseGooseConsulting/renovate-config/issues/27)).
- Renovate fixes #45236 or #46925.
- The job summary shows undated holds growing without mappings being added, or a repository's "newer releases withheld" count staying up across runs (inspect it with a local dry run; it may hide undated releases).
