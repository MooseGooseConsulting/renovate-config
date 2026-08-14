/** Self-hosted runner config. Not shared preset policy.
 *
 * Cron and default dispatch inherit default.json throttles
 * (prCreation: not-pending, prConcurrentLimit: 2, prHourlyLimit: 1,
 * America/Chicago weekday schedule). Do not set prCreation: immediate,
 * prHourlyLimit: 0, or force-unrestricted schedule on that path.
 *
 * Diagnostic force applies only when the workflow sets
 * RENOVATE_DIAGNOSTIC_FORCE=true (workflow_dispatch, dryRun false,
 * unrestricted true). github-action default env-regex passes RENOVATE_*.
 *
 * RAMP: autodiscover is deliberately NOT "MooseGooseConsulting/*" yet.
 * 68 repos carry a valid consumer stub. default.json allows 2 concurrent
 * PRs per repo, so an unstaged fleet run tops out near 136 open PRs, all
 * assigned and review-requested to one person. That has never been run at
 * fleet scale, so the filter below is an explicit wave list.
 *
 * Wave 1 (2026-08-14): the 10 repos already proven by that day's wet runs
 * plus 10 low-risk actives. Ran wet (unrestricted) same day: 20/20 repos
 * processed cleanly, 20 PRs created (19 of them [security]), well under the
 * ~40 ceiling. Zero errors.
 * Wave 2 (2026-08-14): 20 more repos -- the next alphabetical slice of the
 * valid+extends-preset pool, skipping demo/scratch/acceptance-test repos and
 * renovate-config itself (self-referential bootstrapping; hold for the final
 * autodiscoverFilter swap, not a routine wave). Includes TechdealsHandoff,
 * which landed its consumer stub the same day. Combined ceiling ~80 PRs.
 * Wave 3+: append ~20 names per wave once the review load is understood.
 * Final state: replace the list with ["MooseGooseConsulting/*"].
 */
const applyDiagnosticForce = process.env.RENOVATE_DIAGNOSTIC_FORCE === "true";

const ACTIVE_REPOS = [
  // Wave 1 -- proven by the 2026-08-14 wet runs.
  "MooseGooseConsulting/ColdSearch",
  "MooseGooseConsulting/NorthStarGuardian",
  "MooseGooseConsulting/RoccatMouse",
  "MooseGooseConsulting/frozenSkillz",
  "MooseGooseConsulting/ai-config-registry",
  "MooseGooseConsulting/ColdVox",
  "MooseGooseConsulting/coldaine-homelab",
  "MooseGooseConsulting/open-swe",
  "MooseGooseConsulting/screenpipe",
  "MooseGooseConsulting/the-watchman",
  // Wave 1 -- added low-risk actives.
  "MooseGooseConsulting/anchor-marks",
  "MooseGooseConsulting/ColdTools",
  "MooseGooseConsulting/ColdVault",
  "MooseGooseConsulting/GitAtlas",
  "MooseGooseConsulting/llm-archiver",
  "MooseGooseConsulting/MooseGooseWebsite",
  "MooseGooseConsulting/PersonalKnowledgeBase",
  "MooseGooseConsulting/RobotOverview",
  "MooseGooseConsulting/Semantic-Planner",
  "MooseGooseConsulting/toDoDashboard",
  // Wave 2 (2026-08-14) -- next alphabetical slice, valid+extends preset.
  "MooseGooseConsulting/ActuarialKnowledge",
  "MooseGooseConsulting/AgentVisualCrazy",
  "MooseGooseConsulting/AlexaChat",
  "MooseGooseConsulting/aquacomputer-lab",
  "MooseGooseConsulting/BattleshipGraphicsProjects",
  "MooseGooseConsulting/bloodarrow-observability",
  "MooseGooseConsulting/bloodarrow-wrx90-memory-tuning",
  "MooseGooseConsulting/claude-oauth-bridge",
  "MooseGooseConsulting/ClaudePlanning",
  "MooseGooseConsulting/coldaine-control-plane",
  "MooseGooseConsulting/coldaine-k8cluster",
  "MooseGooseConsulting/ColdReviewer",
  "MooseGooseConsulting/ColdTrace",
  "MooseGooseConsulting/ComfyWatchman",
  "MooseGooseConsulting/constellation-task-gardener",
  "MooseGooseConsulting/cursor-responses-gateway",
  "MooseGooseConsulting/CursorMonitor",
  "MooseGooseConsulting/ddr5-rdimm-oracle",
  "MooseGooseConsulting/futuristic-code-interface",
  "MooseGooseConsulting/TechdealsHandoff",
];

const config = {
  platform: "github",
  onboarding: false,
  requireConfig: "required",
  autodiscover: true,
  autodiscoverFilter: ACTIVE_REPOS,
};

if (applyDiagnosticForce) {
  config.force = {
    schedule: [],
    updateNotScheduled: true,
  };
  config.prCreation = "immediate";
  config.internalChecksFilter = "relaxed";
  config.prHourlyLimit = 0;
}

module.exports = config;
