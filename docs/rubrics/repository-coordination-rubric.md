# Repository Coordination Rubric

Use this rubric to ask: are repo-local Renovate configs and the shared preset
coordinating well?

The goal is not to force identical Renovate behavior everywhere. The goal is to
keep shared defaults flexible, make repo-specific differences intentional, and
prevent configuration from spreading into many local files without a clear reason.

## Agent Prompt

Review the shared preset, inherited config, and a representative set of
repo-local Renovate configs. Score how well the layers coordinate. Do not treat
local overrides as failures by default; treat unexplained drift, duplicate policy,
and confusing ownership as the warning signs.

Collect evidence first, then score each category from 0 to 3:

- **3 - Healthy:** The coordination pattern is clear, low-noise, and easy to
  maintain across repos.
- **2 - Mostly Working:** The pattern is understandable, but a few repos or
  options need cleanup, documentation, or review.
- **1 - Drifting:** Local configs regularly duplicate or fight the shared preset,
  and repo owners need special knowledge to understand outcomes.
- **0 - Fragmented:** The shared preset no longer acts as a meaningful default,
  or inherited/local behavior is unpredictable.

## Scoring Categories

| Category | Ask | Evidence to Collect | Healthy Signals | Warning Signals |
| --- | --- | --- | --- | --- |
| Shared defaults are flexible | Does the shared preset encode common policy without assuming every repo has the same release, CI, or dependency shape? | `default.json`, README policy notes, common Renovate PR patterns across repos, examples of repos with different ecosystems. | Defaults cover broad behavior such as grouping, throttling, labels, review routing, and security handling while leaving room for repo-specific rules. | Shared rules are so narrow that most repos must duplicate policy, or so aggressive that special repos must disable large parts of the preset. |
| Repo-local overrides are intentional | Are local `renovate.json` changes specific to real repo needs? | Local config diffs, comments/descriptions, PRs that introduced overrides, recurring Renovate failures or stale PRs. | Overrides name a concrete repo constraint such as a test matrix, deployment window, dependency family, private registry, or intentionally isolated package. | Repos copy large blocks from the shared preset, carry unexplained `ignoreDeps`, disable Renovate broadly, or override shared behavior without a current reason. |
| Inherited config and preset behavior are understood | Do agents and maintainers know whether behavior comes from Mend-hosted inherited config, an explicit preset extension, or local config? | `org-inherited-config.json`, repo-local `extends`, onboarding PRs, Renovate logs when available, README guidance. | The inherited config is thin and points at shared policy, explicit repo presets remain visible to repo owners, and local config precedence is considered before making changes. | Teams assume inherited config and explicit presets are interchangeable, duplicate the same preset in confusing ways, or rely on local `ignorePresets` to escape behavior that actually came from inherited config. |
| Special repos retain autonomy | Can unusual repos adapt Renovate without abandoning the shared baseline? | Examples from monorepos, release-critical repos, private package users, generated-code repos, archived projects, or repos with weak CI. | Special repos use narrow package rules, schedules, managers, or automerge choices while still inheriting common labels, review expectations, and security posture where useful. | Special repos fully opt out because the shared preset is too rigid, or the shared preset accumulates many one-off exceptions that only serve one repository. |
| Config sprawl is controlled | Is policy placed at the smallest durable layer? | Count and shape of local configs, repeated package rules, repeated schedules, repeated reviewer/label policy, old migration leftovers. | Common policy lives once in the shared preset; repo configs are short; one-off decisions are named; stale overrides are removed during routine maintenance. | The same rule appears in many repos, local configs become mini-presets, inherited config duplicates the shared preset, or no one can tell which layer owns a behavior. |
| Review cadence keeps coordination current | Is there a recurring way to decide what should move up to the preset, stay local, or be deleted? | Recent PR reviews, Renovate queue audits, config validation runs, issue notes, docs updates, examples of promoted or retired rules. | Reviews compare local overrides against the shared contract, promote repeated patterns, retire stale exceptions, and check inherited-config blast radius before changing defaults. | Review only happens after noise or breakage, shared-preset changes ship without sampling consumer repos, or local drift is treated as invisible background clutter. |

## Score Bands

Total the six category scores for a maximum of 18.

- **16-18: Strong coordination.** The shared preset is a useful default, local
  autonomy is preserved, and ownership boundaries are clear.
- **12-15: Coordinating with cleanup needed.** The model works, but repeated
  local patterns, unclear inherited behavior, or stale exceptions should be
  reviewed soon.
- **7-11: Drift risk.** Repositories are still getting value from Renovate, but
  config behavior is becoming hard to reason about across layers.
- **0-6: Fragmented.** Treat as a design problem before adding more rules; first
  clarify ownership, inherited behavior, and the intended repo-local escape
  hatches.

## Questions for Agents

- Which repos receive Renovate policy through inherited config, explicit
  `extends`, both, or neither?
- When a repo differs from the shared preset, what repo-specific constraint
  explains the difference?
- Is the same override appearing in multiple repos? If yes, should it become a
  shared default or documented optional preset instead?
- Are repo-local overrides narrow enough that they preserve the shared labels,
  review flow, security handling, and noise controls?
- Would a maintainer reading only the repo-local config understand which behavior
  is local versus inherited?
- Are special repos using explicit autonomy, or are they forcing hidden
  exceptions into the shared preset?
- Has anyone recently checked whether old overrides still match current CI,
  package managers, release process, and dependency risk?

## Evidence Checklist

- [ ] Shared preset files and descriptions.
- [ ] Inherited config file and current hosting mode.
- [ ] Repo-local Renovate config files for sampled consumer repos.
- [ ] Recent Renovate PRs, especially noisy, stale, failed, or security PRs.
- [ ] PRs or commits that added local overrides.
- [ ] Validation output for changed config surfaces, when config edits are part
  of the work.
- [ ] Notes from maintainers about repo-specific constraints.

## What Good Looks Like

- Repos can start with the shared preset and need little or no local config.
- Local config is short, purposeful, and easy to delete when the repo changes.
- Inherited config is treated as an organization delivery mechanism, not a place
  to hide complex repo policy.
- Shared changes are reviewed for consumer impact before they become defaults.
- Repeated local patterns are promoted deliberately instead of copied around.
- Special repos have documented escape hatches without making the default worse
  for ordinary repos.

## What Bad Looks Like

- Many repos carry copied package rules, schedules, labels, reviewers, or
  throttles from the shared preset.
- Local configs disable broad pieces of Renovate because one default is too
  rigid.
- Agents cannot explain whether a behavior came from inherited config, an
  explicit preset, or repo-local raw config.
- The shared preset contains several one-repo exceptions.
- Repo owners are surprised by inherited behavior or cannot tell how to override
  it safely.
- No one periodically checks whether local exceptions are still needed.

## Example-Only Metrics

Use metrics as supporting evidence, not as the definition of success. Examples
that may help during an audit:

- Number of repos with no local overrides, small local overrides, or large local
  configs.
- Repeated local rules that appear in more than one repo.
- Renovate PRs closed because of noise, stale branches, or avoidable failures.
- Age of the oldest unexplained local override.
- Time since the last shared-preset review against a sample of consumer repos.
