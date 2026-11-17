# Shared Renovate policy

## Configuration change at a glance

| Area | Policy |
| --- | --- |
| Base | Keep `config:best-practices`; disable the Dependency Dashboard explicitly. |
| Routine groups | Stable `all non-major dependencies` and `all major dependencies` groups; isolate TypeScript and ESLint stack into `TypeScript and ESLint stack`. Ordinary library and tool majors remain enabled. |
| Runtime release lines | Hold Python and Go within the current major/minor, and Node and .NET within the current major. Python and Go patch candidates are separated before filtering so newer minors cannot hide them; this can create an additional patch branch. |
| Cadence | Monday in `America/Chicago`; `github>MooseGooseConsulting/renovate-config:frequent` opts into daily updates. |
| Security | GitHub vulnerability-fix PRs remain separate, immediate, uncapped and subject to review. |
| Safety | Keep the four-day release-age policy and existing exceptions; never automerge. |

## Rules

- Never push commits to `renovate/` branches. Fix problems on the default branch so Renovate retains ownership and can regenerate its PRs.
- Renovate PRs are the inbox. The dashboard is disabled; inspect runner logs and GitHub Security alerts for held updates and vulnerabilities.
- Group TypeScript, ESLint, `@eslint/*`, `typescript-eslint`, `@typescript-eslint/*`, and ESLint plugins/config packages separately from other major and non-major work. A broken lint stack should not block the main major group.
- Keep language runtime migrations deliberate: Python `3.13 → 3.15`, Go `1.24 → 1.25`, Node `24 → 26`, and .NET `10 → 11` are not routine Renovate updates. The rules target recognized runtime sources, including official Docker images, runtime version files, asdf/mise tools, supported setup-action inputs, Python `requires-python`, npm Node engines, Go module directives, and .NET `global.json` SDKs. Ordinary Go, npm, PyPI and NuGet libraries retain major updates.
- Python and Go use `separateMinorPatch` to preserve patch candidates when a newer minor exists. Renovate may create a separate patch branch rather than placing those updates in the main non-major branch.
- Docker tags such as `python:3.13-slim` have minor-version semantics and may move behind a tag. A versioned tag plus digest makes the selected image reproducible; an unversioned or floating tag can move independently of these version filters. Hardcoded script versions, custom images, unsupported aliases, workflow matrices and unrecognized variables are not automatically covered.
- Runtime security updates that require a new release line must be handled deliberately. Security PRs are not grouped with routine updates and may exceed the ordinary PR limit. Standalone lock-file maintenance is disabled; lockfiles are refreshed with dependency updates where supported.
- A repository opting into the faster cadence extends both the shared default and `github>MooseGooseConsulting/renovate-config:frequent`, with `:frequent` last. The existing release-age soak still applies.

Renovate's [Docker versioning](https://docs.renovatebot.com/modules/versioning/docker/), [Node versioning](https://docs.renovatebot.com/modules/versioning/node/) and [GitHub Actions manager](https://docs.renovatebot.com/modules/manager/github-actions/) describe the underlying extraction and version behavior.
