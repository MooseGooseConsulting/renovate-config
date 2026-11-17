# Renovate fleet policy plan

**Status: proposal for owner review, not implemented.** This document changes no Renovate configuration. The owner directs a standard preset, no Dependency Dashboard, a short automatic-major allowlist, and patch-only language runtimes. Existing ADRs are prior agent notes, not authority. This plan deliberately identifies where those notes and the current project documentation disagree with the new direction.

## Summary

| Concern | Proposal |
| --- | --- |
| Base | Keep the existing `config:best-practices`, which already includes `config:recommended`; retain fleet rules that genuinely add policy. |
| Cadence | Full-day Monday in `America/Chicago`; optional `:frequent` preset for Monday, Wednesday, Saturday. |
| Grouping | Preserve one ordinary non-major group and one ordinary major group; no standalone lockfile maintenance. A hard two-total-PR guarantee is **not** established: security fixes and other special branches can escape. |
| Majors | Disable majors by default, then re-enable only explicitly listed package/tool majors. No dashboard approval and no dashboard queue. |
| Runtime | Hold Python, Node, Go and .NET at their selected major/minor; allow patch and digest proposals where supported. Java is a separately scoped candidate. |
| Security | Preserve immediate, uncapped vulnerability-fix PRs, independent of the dashboard, subject to the rule-interaction risk below. This can exceed two PRs. |
| Typical week | Zero or one routine non-major PR and zero or one allowlisted-major PR; security and other exceptions may be additional. All require review and CI; no automerge. |

The strongest argument against this combined policy is that it hides non-allowlisted majors and may postpone security or compatibility work until someone explicitly looks for it. One failing package may also block an entire group. A dashboard-free periodic inventory or other explicit review process is needed; no native hidden-major queue remains.

## Research: standard and real-world patterns

| Pattern | Source | What it does | Fits us? |
| --- | --- | --- | --- |
| Standard base | [Renovate `config:recommended` / `config:best-practices`](https://docs.renovatebot.com/presets-config/) | `recommended` adds dashboard, curated grouping, replacements, workarounds; `best-practices` extends it with image/Action digest pinning, migration, dev-dependency pins, abandonment, npm age and weekly lock maintenance. | Yes. We already use `best-practices`, so retaining it is a re-evaluation rather than a risky rebase. Explicitly override its dashboard and lock maintenance. |
| Existing runtime workarounds | [Renovate workarounds](https://docs.renovatebot.com/presets-workarounds/) | `nodeDockerVersioning` makes matching Node images LTS-aware; `javaLTSVersions` restricts supported Java versions to LTS; `doNotUpgradeFromAlpineStableToEdge` guards Alpine. All are inherited through `recommended` → `workarounds:all`. | Keep them, but none implements a general patch-only hold. [Node versioning](https://docs.renovatebot.com/modules/versioning/node/) cannot replace Docker versioning for `-alpine` suffixes. |
| Targeted Python hold | [Python Docker discussion #19811](https://github.com/renovatebot/renovate/discussions/19811) | A user matches `python`, disables major/minor; the maintainer explains version support for `matchDepNames`. | Good targeting pattern; it does not itself prove coverage across every datasource. |
| Preserve patch candidates | [Renovate discussion #18742](https://github.com/renovatebot/renovate/discussions/18742) | A Python Docker user found disabling minor alone hid the patch; a maintainer suggested `separateMinorPatch`, which resolved the issue. | Correctness precedent, but an extra patch branch can break the two-group goal. |
| Pre-lookup current-line filter | [Rancher shared preset](https://github.com/rancher/renovate-config/blob/main/default.json) | Uses `allowedVersions` with `{{{major}}}`/`{{{minor}}}` for Go directives and custom extraction for specific Go workflow variables and images. [Templates](https://docs.renovatebot.com/templates/) document these current-version variables. | Promising to retain patches without a patch branch; requires exact-version fixture and dry-run evidence before rollout. It is not a universal runtime solution. |
| No universal LTS switch | [Renovate maintainer discussion #31281](https://github.com/renovatebot/renovate/discussions/31281) | LTS knowledge is product-specific. | Holding a platform line is stricter than accepting any LTS major. |
| .NET SDK feature bands | [Renovate discussion #36300](https://github.com/renovatebot/renovate/discussions/36300), [Microsoft `global.json`](https://learn.microsoft.com/en-us/dotnet/core/tools/global-json) | SDK `x.y.znn` encodes feature band `z` and patch `nn`; a user suggested, but had not thoroughly tested, custom regex versioning. | Default semantic patch includes feature-band changes. A true SDK patch-only guarantee requires a tested extra filter; don't describe major/minor filtering as sufficient. |
| Dashboard and security | [Renovate vulnerability options](https://docs.renovatebot.com/configuration-options/#vulnerabilityalerts), [maintainer discussion #34923](https://github.com/renovatebot/renovate/discussions/34923) | Security PRs have their own defaults/budget and normally skip schedule and routine limits; dashboard is not needed to read alerts or create fixes. | Preserve fast security lane without dashboard, but it contradicts a literal two-total-PR cap. Verify that disabled package rules do not suppress fixes. |
| Published project practice | [Rancher preset](https://github.com/rancher/renovate-config/blob/main/default.json); [fleet research archive](../inspiration/subagents/exceptional-configs-and-ai-patterns.md) | Real shared configs use targeted package rules, groupings and annotated custom managers. Archive is historical, not policy. | Reuse native targeting and small explicit lists. Custom managers for scripts require their own evidence and are not proposed fleet-wide. |

The archived [official research](../inspiration/subagents/renovate-official-research.md) endorses `best-practices`, ordered rules, and a distinct vulnerability lane; the [inventory](../inspiration/subagents/config-inventory.md) is stale about current dashboard/schedule/config and explicitly predates the base change. The [review cadence](../workflows/renovate-review-cadence.md) requires representative consumers and real evidence, not a schema-only claim. The [weekly verification workflow](../workflows/weekly-policy-verification.md) records why a full Monday window fits the once-daily runner. These are research/process leads, not contrary owner policy.

## Base and current-rule disposition

Retain `config:best-practices` and `group:allNonMajor`. `best-practices` provides Docker/Actions digest pinning, dev pins, standard workarounds and other defaults. It does **not** provide our all-major group, pin/digest group, 4-day fleet-wide soak, first-party exceptions or GHCR lookup. `config:recommended` alone drops several protections and would require deliberately adding them back. **Strongest counterargument:** best-practices brings additional moving upstream behavior and pinning noise; a leaner `recommended` base is easier to understand.

| Current surface | Proposed change |
| --- | --- |
| `dependencyDashboard: { "enabled": true }` | Replace with `{ "enabled": false }`, not merely delete: `config:recommended` enables it. Retire or disable existing Renovate-created issues after rollout using an explicit separately authorized cleanup procedure; disabling creation is not proof historical issues will be deleted. |
| `group:allNonMajor`, major grouping and pin/digest grouping | Keep; still necessary. Update description/header to state only allowed majors flow and security can be separate. |
| 4-day `minimumReleaseAge`, timestamp-required and undated-source exceptions | Keep; base npm soak is narrower. Preserve first-party code exemption, GHCR custom datasource and ordering, exclusions, and associated runner token requirements. |
| GHCR `custom.ghcr` and `logLevelRemap` | Keep: dates and expected logging are fleet-specific. |
| CodeOps action-ref pin exemption; npm `rangeStrategy: bump` | Keep: fleet-specific, not supplied by base. |
| `lockFileMaintenance.enabled: false` | Keep to avoid a third standalone branch. Lockfiles still regenerate with dependency updates, subject to per-manager soak limitations. |
| Three package rules restricting lockfile maintenance by manager and lockfile | Candidate removal as dead under global disable. They still protect consumers who locally re-enable maintenance: delete only if the owner accepts removing that guard or replaces it in the opt-in. |
| `vulnerabilityAlerts` fast path (`schedule: []`, age null, concurrency 0) | Keep independently of dashboard; update wording only if policy changes. Native GitHub alert ingestion must remain enabled and accessible. |
| `prConcurrentLimit` / `branchConcurrentLimit` 5 | Consider 2 as a **concurrent ordinary** backstop, not an aggregate per-cycle counter and not a cap on the separate security budget. Existing groups ordinarily use two branches already. Test interaction with existing open PRs. |
| Existing schedule, timezone, no automerge, labels, assignees, reviewer settings | Keep; frequent cadence is a separate opt-in. |

There is no `:disableMajorUpdates` preset extended globally: package rules disable majors and a later, explicit allowlist restores only selected ones. Any earlier owner description that remains in the actual config stays intact; new policy descriptions should use `Owner rule (2026-11-17): ...`.

## Cadence

Retain `"timezone": "America/Chicago"`, `"schedule": ["* * * * 1"]` and `"updateNotScheduled": false`: every Monday, all day. `schedule:weekly` means early Monday before 04:00, so it is not equivalent to the existing window. Schedules do not trigger the runner ([schedule documentation](https://docs.renovatebot.com/configuration-options/#schedule)).

Draft `frequent.json` for repositories that explicitly opt in after the default preset:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "description": "Owner rule (2026-11-17): opt into Monday, Wednesday and Saturday routine updates.",
  "schedule": ["* * * * 1,3,6"]
}
```

Example `extends`: `["github>MooseGooseConsulting/renovate-config", "github>MooseGooseConsulting/renovate-config:frequent"]`. Check effective ordering when the self-hosted runner also supplies the default. The gaps are 2/3/2 days; the four-day release-age soak is unchanged. No built-in [schedule preset](https://docs.renovatebot.com/presets-schedule/) gives these exact full days.

**Strongest counterargument:** more windows increase CI/review load while the four-day soak limits freshness gains; Monday-only remains simpler.

## Grouping, security and two-PR limit

Draft grouping fragment; the group rules shown already exist in current config:

```json
{
  "extends": ["config:best-practices", "group:allNonMajor"],
  "dependencyDashboard": { "enabled": false },
  "separateMajorMinor": true,
  "separateMinorPatch": false,
  "lockFileMaintenance": { "enabled": false },
  "prConcurrentLimit": 2,
  "branchConcurrentLimit": 2,
  "packageRules": [
    {
      "description": "Owner rule (2026-11-17): group pin and digest updates with routine non-major changes.",
      "matchUpdateTypes": ["digest", "pin", "pinDigest"],
      "groupName": "all non-major dependencies",
      "groupSlug": "all-minor-patch"
    },
    {
      "description": "Owner rule (2026-11-17): group allowed major updates together for review.",
      "matchUpdateTypes": ["major"],
      "groupName": "all major dependencies",
      "groupSlug": "all-major"
    }
  ]
}
```

A hard maximum of two **total PRs per cycle** is not provided by these settings: Renovate security alerts default to separate branches, no schedule/soak, and a separate concurrency budget. Security fixes can create a third or later PR. The dependency dashboard was only a visibility surface; disabling it does not remove GitHub Dependabot alerts, Renovate's alert ingestion or security branches. Keep the existing `vulnerabilityAlerts` object and review alerts directly in GitHub Security and runner logs. In contrast, a package rule that says `enabled: false` can suppress some vulnerability fixes: Renovate explicitly warns about disabled dependencies in [vulnerability options](https://docs.renovatebot.com/configuration-options/#vulnerabilityalerts). Do **not** assume major/runtime security fixes bypass disabled rules. Test exact `44.236.4` rule ordering and alert behavior, including a fix that requires a major; if it fails, design a verified security-specific override or explicitly escalate those fixes, rather than silently claiming security coverage.

Further exceptions include native package replacements, configuration migration PRs, consumer group overrides, multiple base branches, previous stale branches, maintenance re-enabled locally, and multiple sequential merges within the same window. Two concurrent ordinary branches is not a per-cycle count. `separateMinorPatch: true` can generate a separate runtime patch branch. Pins and digests are grouped with non-majors; routine lockfile maintenance is disabled and lockfiles change as artifacts of actual updates.

**Strongest counterargument:** if two total PRs is truly non-negotiable, native immediate uncapped security and these special branches cannot simply be promised at the same time. That requires an explicit policy choice, likely an external per-cycle coordinator and acceptance that security fixes can queue. Disabling alerts to meet a number would be unsafe.

## Majors: no dashboard, explicit allowlist

Proposed packageRules, after the grouping rule. Ordering and effective config must be verified on the pinned Renovate release; matching a GitHub Actions `uses:` reference must not also allow a setup action's runtime input.

```json
[
  {
    "description": "Owner rule (2026-11-17): do not propose major upgrades unless a later rule explicitly opts the tool in.",
    "matchUpdateTypes": ["major"],
    "enabled": false
  },
  {
    "description": "Owner rule (2026-11-17): allow explicitly listed GitHub Actions major updates for review.",
    "matchManagers": ["github-actions"],
    "matchDepTypes": ["action"],
    "matchPackageNames": ["actions/checkout", "actions/upload-artifact", "actions/download-artifact"],
    "matchUpdateTypes": ["major"],
    "enabled": true
  },
  {
    "description": "Owner rule (2026-11-17): allow the explicitly listed formatter major for review.",
    "matchDatasources": ["npm"],
    "matchPackageNames": ["prettier"],
    "matchUpdateTypes": ["major"],
    "enabled": true
  }
]
```

| Initial entry | Why allow a major PR? | Important limitation |
| --- | --- | --- |
| `actions/checkout` | Keeps checkout action maintained. | Can require newer runner and change checkout semantics. |
| `actions/upload-artifact` | Keeps CI artifact publication maintained. | Artifact compatibility and runner requirements can change. |
| `actions/download-artifact` | Maintains the matching retrieval operation. | Not automatically compatible with every upload version. |
| `prettier` | Formatting tool, rather than production runtime. | Can alter formatting and require a newer Node. |

`typescript`, `eslint`, their plugins, application libraries and every other tool are **not** allowlisted initially; their major updates are not proposed. Adding an allowlist item is a deliberate review of tool and ecosystem, not automerge. Do not use a blanket `actions/**` or all-linter wildcard. Holding major dependency releases risks ecosystem drift, and explicit `enabled: false` can interfere with security updates.

**Visibility:** there is no dashboard and no native visible queue of disabled major proposals. An owner can manually inspect registries/release notes or run a periodic, separately configured read-only Renovate inventory with a temporary non-disabling policy and export results. Such a report is a **proposal**, not an existing automation; without it, nobody is automatically notified. Define owner, cadence, output destination, credentials and issue-disabled-repository behavior before implementation. The existing review workflow would need updating from dashboard checks to that mechanism. Do not deploy an imaginary report.

**Strongest counterargument:** ordinary library majors will rot silently and fixes/features may be missed; the prior PR-inbox approach, with reviewed major PRs, provides visibility without an extra reporting system. The owner has nevertheless requested no dashboard and selective majors.

## Runtime policy: draft rules, locations and gaps

The user wants no minor/major runtime proposals, but security patch proposals should continue. Filtering only after candidate selection can hide patches when a minor exists ([#18742](https://github.com/renovatebot/renovate/discussions/18742)). A pre-lookup `allowedVersions` filter may keep patches in the ordinary non-major group without `separateMinorPatch`; Rancher's real preset and [Renovate template docs](https://docs.renovatebot.com/templates/) motivate this, but they do **not** prove this generic expression works for every version scheme and range. These JSON fragments are design candidates, not validated rules. `matchPackageNames` matches the lookup package name; datasources limit accidental library matches. Add them after broad major rules. `allowedVersions` cannot be combined with `matchUpdateTypes` in the same rule.

```json
[
  {
    "description": "Owner rule (2026-11-17): keep Python in its selected major/minor line.",
    "matchDatasources": ["docker", "python-version", "github-tags", "github-releases"],
    "matchPackageNames": ["/^(?:(?:docker\\.io|index\\.docker\\.io|registry-1\\.docker\\.io)\\/(?:library\\/)?)?python$/", "python/cpython", "actions/python-versions"],
    "allowedVersions": "/^v?{{{major}}}\\.{{{minor}}}(?:\\.\\d+)?(?:[-+_].*)?$/"
  },
  {
    "description": "Owner rule (2026-11-17): keep Node in its selected major/minor line even when a later major reaches LTS.",
    "matchDatasources": ["docker", "node-version", "github-releases"],
    "matchPackageNames": ["/^(?:(?:docker\\.io|index\\.docker\\.io|registry-1\\.docker\\.io)\\/(?:library\\/)?)?node$/", "actions/node-versions"],
    "allowedVersions": "/^v?{{{major}}}\\.{{{minor}}}(?:\\.\\d+)?(?:[-+_].*)?$/"
  },
  {
    "description": "Owner rule (2026-11-17): keep Go toolchains in their selected major/minor line without holding Go modules.",
    "matchDatasources": ["docker", "golang-version", "github-tags", "github-releases"],
    "matchPackageNames": ["/^(?:(?:docker\\.io|index\\.docker\\.io|registry-1\\.docker\\.io)\\/(?:library\\/)?)?golang$/", "go", "golang/go", "actions/go-versions"],
    "allowedVersions": "/^v?{{{major}}}\\.{{{minor}}}(?:\\.\\d+)?(?:[-+_].*)?$/"
  },
  {
    "description": "Owner rule (2026-11-17): keep .NET SDK and runtime in their selected major/minor line without holding NuGet libraries.",
    "matchDatasources": ["docker", "dotnet-version"],
    "matchPackageNames": ["dotnet-sdk", "dotnet-runtime", "/^mcr\\.microsoft\\.com\\/dotnet\\/(?:sdk|runtime|runtime-deps|aspnet)$/"],
    "allowedVersions": "/^v?{{{major}}}\\.{{{minor}}}(?:\\.\\d+)?(?:[-+_].*)?$/"
  }
]
```

| Runtime | Intended locations, when extracted with the specified datasource/name | Not caught or not proved |
| --- | --- | --- |
| Python | Docker Hub `python` in Dockerfiles, Compose and workflow container/service image references, including versioned tag+digest; `.python-version` ([pyenv](https://docs.renovatebot.com/modules/manager/pyenv/)); `.tool-versions` Python; core mise Python; `actions/setup-python` `python-version`; `[project].requires-python` in `pyproject.toml`, including uv projects ([pinned PEP 621 extractor](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/pep621/extract.ts)). | Scripts, matrices, unrecognized variables and Docker ARGs, arbitrary mirrors/custom images and unlisted backends. `uv` version itself is a tool, not Python; `uv.lock` is not a Python runtime pin. `requires-python` is a range, not an installed interpreter, and filtering its computed version needs testing. |
| Node | `node` Docker Hub images, `.nvmrc`, `.node-version`, `package.json` `engines.node`, `devEngines.runtime`, `volta.node`; asdf `nodejs`, core mise `node`; `actions/setup-node` `node-version` ([Node coverage](https://docs.renovatebot.com/node/), [pinned action mapping](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/github-actions/known-actions/github-releases.ts)). | Scripts, workflow matrices, unrecognized variables and custom image names/backends. An existing wide engines range or `lts` selector can already resolve a later version; the rule does not make it a pin. |
| Go | `golang` Docker Hub images; `go` and `toolchain` lines in `go.mod`; `go.work` only if manager extraction is verified; asdf `golang`, core mise `go`; `actions/setup-go` `go-version` ([pinned parser](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/gomod/line-parser.ts), [action mapping](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/github-actions/known-actions/github-releases.ts)). | `GOTOOLCHAIN`, scripts, ARGs, custom Go images and workflow matrices unless separately extracted. Go modules use datasource `go`, excluded here. [Go directive versioning](https://docs.renovatebot.com/modules/versioning/go-mod-directive/) treats a partial directive as a range and normally does not bump it; do not promise patch PRs without a fixture. |
| .NET | `global.json` `sdk.version`, supported `actions/setup-dotnet` `dotnet-version`, asdf `dotnet-core` and supported mise mappings; MCR `dotnet/sdk`, `runtime`, `runtime-deps`, `aspnet` image references ([NuGet manager](https://docs.renovatebot.com/modules/manager/nuget/), [pinned action extractor](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/github-actions/known-actions/dotnet-version.ts)). | Project `TargetFramework`/`TargetFrameworks` are not listed NuGet dependency types; scripts, unknown custom images and multiline action version inputs are not covered. SDK `10.0.100 → 10.0.400` passes this major/minor filter even though it changes feature band. **Thus this draft does not satisfy strict SDK patch-only** until an additional band-aware rule is designed and tested. |

Sources for asdf/mise mappings: [pinned asdf tooling](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/asdf/upgradeable-tooling.ts) and [pinned mise tooling](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/mise/upgradeable-tooling.ts). The action manager extracts supported `with:` inputs separately from Action `uses:` versions ([Actions docs](https://docs.renovatebot.com/modules/manager/github-actions/)). asdf/mise commonly manage only the first listed version. Explicit aliases, other backends, custom datasources and replacement rules need separate matching.

Docker `python:3.13-slim → 3.15-slim` is a **minor** under Docker versioning, not a major. Docker preserves tag precision and suffix ([Docker versioning](https://docs.renovatebot.com/modules/versioning/docker/)); `3.13-slim` is a floating image tag, not an immutable `3.13.1` pin. A digest update for `python:3`, `node:lts`, or another floating tag can change the actual runtime line without changing the tag. Version filtering cannot guarantee patch-only for unversioned/floating selectors, or make loose ranges precise.

Java: consider only after identifying fleet usage. Existing `workarounds:javaLTSVersions` is not a patch-only hold. If chosen, use a dedicated `docker`/`java-version` rule scoped to supported distribution names and inspect `setup-java`, asdf and mise extraction. Major-only tags (`21`) and Java build numbers require distinct semantics; do not reuse the above regex uncritically. [Pinned Java action extraction](https://github.com/renovatebot/renovate/blob/44.236.4/lib/modules/manager/github-actions/known-actions/java-version-dynamic.ts) supports only specific distributions/forms. Java's draft matchers cannot be claimed complete without fixtures.

**Strongest counterargument:** the templated filter may resolve a range to an unintended current version, miss patch candidates, interfere with advisories, or fail on image suffixes and SDKs. The more established alternative is `separateMinorPatch: true` before lookup and a separate `matchUpdateTypes: ["minor", "major"], enabled: false` rule per family; that can create a third `patch-` branch. Prefer correctness over claiming both guarantees, and do not implement either without behavioral evidence.

## Historical notes and what to delete

The owner says `docs/decisions/0001`–`0004` are historical agent notes, not authority. They are useful for understanding how this configuration arrived here, not as a mandate:

- 0001 recorded the four-day soak and exceptions; this plan keeps them on their merits.
- 0002 recorded dashboard visibility and uncapped vulnerability fixes. This plan contradicts dashboard visibility but recommends keeping uncapped vulnerability fixes independently of the dashboard.
- 0003 recorded a separate Python PR and was later marked superseded. The older split separated Python updates for review; it did **not** disable Python minor migrations.
- 0004 records removal of that Python split and grouping Python minors with other non-majors. **It made the Python 3.13 → 3.15 proposal travel in the common non-major PR; it was not the underlying permission for the upgrade.** The previous split still proposed minor upgrades separately, and no runtime minor hold existed. The report that the upgrade was proposed/merged is owner-provided; no individual PR or precise causal trace has been independently examined here.

When implementation is separately authorized, delete the four old ADR files and `docs/decisions/README.md` as requested, and migrate any still-useful facts to current documentation rather than leaving broken inbound links. Audit references in `docs/INDEX.md`, `docs/architecture.md`, workflows, README and elsewhere; update/remove them in the implementation PR. This plan does **not** perform those deletions. Delete dashboard-enabling config but **replace** it with explicit `enabled: false` because the base preset turns the dashboard on. Remove or amend dashboard-first text, links and the now-dead lock-maintenance package rules only after deciding whether local maintenance opt-ins need their protection. Review the old GHCR/dashboard references for which operational facts still apply.

Existing `docs/NORTH_STAR.md` A4 and `AGENTS.md` say PRs are the inbox and dashboard approval is not shared policy; no dashboard approval is proposed. However, other current docs describe a dashboard for visibility, security exceptions and prior decision history. Update them to match the owner direction at implementation. The proposal must not suggest deleting GitHub Dependabot alerts just because dashboard issues go away.

## Risks and pre-implementation evidence

1. **Invisible major backlog:** disabled updates do not appear in a dashboard queue. Until a real periodic inventory exists, discovery is manual and may never happen. Alert on/report aging only after a real mechanism is specified and implemented.
2. **Security suppression:** `enabled: false` and restrictive `allowedVersions` may block a vulnerability-only major or runtime fix. Test both direct and transitive vulnerability alerts; if a native override cannot be proven, specify manual emergency remediation and alert ownership. GitHub Security alerts remain necessary.
3. **Patch starvation or false match:** validate `python:3.13.1-slim → 3.13.2-slim` is proposed, but `3.13.1-slim → 3.15.0-slim` is not; repeat tag+digest, Node, Go, .NET, action inputs, asdf/mise, pyenv, global.json, npm engines and Python ranges. Test nonmatching ordinary libraries and tool allowlist boundaries.
4. **.NET bands and floating tags:** major/minor regex is insufficient for strict SDK feature-band patch-only; floating images may move runtime even on a digest refresh. Require band-aware behavior and concrete pins, or explicitly accept exceptions.
5. **Grouping semantics:** package-rule order, `enabled` restoration, `allowedVersions` template context, per-manager versioning, consumer overrides and vulnerability force rules need exact-version behavioral checks. A config validator only checks schema.
6. **Special PRs and caps:** vulnerability, replacement, migration, patch-split, multiple bases and sequential runs can exceed two total per cycle. An ordinary two-concurrency limit does not prove otherwise.
7. **Cadence:** the runner must run during the schedule; frequent schedule does not shorten the soak. Verify the runner-injected preset and consumer extend order.
8. **Large blast radius:** one bad Action/formatter major or non-major update can break the whole grouped PR. Check review capacity and consumer CI; no automerge.

If the owner approves implementation, use the pinned image from `.github/workflows/validate.yml` (`renovate/renovate:44.236.4`, `--strict --no-global default.json org-inherited-config.json renovate.json`, plus the runner config) and representative extraction/behavior dry runs on the PR branch. Validator success alone is not evidence of correct matching or alert behavior. Follow the sampling principles in `docs/workflows/renovate-review-cadence.md`. This docs-only proposal ran no configuration validation.

## Open questions for the owner

1. Is two **routine** groups plus immediate uncapped security acceptable, or is a hard maximum of two total PRs per cycle required even if critical fixes must queue? How are merged/closed PRs counted?
2. How should a held runtime or disabled library major be handled when it is the only security fix? Is a tested native bypass required before rollout, or is manual Security-alert escalation acceptable?
3. Should a scheduled inventory of held majors be built? Who owns it, how often does it run, and where are results reported? If none, is lack of any automatic held-major notification accepted?
4. Does .NET patch-only prohibit SDK feature-band changes such as `10.0.100 → 10.0.400`? If so, approve design/fixtures for a band-aware filter before claiming completion.
5. Are `actions/checkout`, upload/download-artifact and `prettier` the right initial major allowlist? Should TypeScript, ESLint and their plugins stay disabled until compatibility is deliberately reviewed?
6. Is Monday/Wednesday/Saturday full-day Chicago cadence appropriate for the opt-in, and should its four-day soak remain unchanged?
7. Should Java be held across the fleet, and which actual distributions/image registries must be covered? What is the policy for custom mirrors, scripts and floating tags?
8. May the dormant lock-maintenance safety rules be removed even though they protect local opt-ins? Should replacements and config-migration PRs remain possible extra branches?
9. Does 'delete the dashboard' include closing and deleting all pre-existing Renovate Dashboard issues, or only preventing future dashboard creation? Existing issue deletion needs a deliberately scoped operation.
