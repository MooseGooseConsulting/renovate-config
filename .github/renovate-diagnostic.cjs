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
 * Wave 1 (below): the 10 repos already proven by the 2026-08-14 wet runs
 * plus 10 low-risk actives. Ceiling ~40 PRs.
 * Wave 2+: append ~20 names per wave once the review load is understood.
 * Final state: replace the list with ["MooseGooseConsulting/*"].
 */
const applyDiagnosticForce = process.env.RENOVATE_DIAGNOSTIC_FORCE === "true";

const WAVE_1 = [
  // Proven by the 2026-08-14 wet runs.
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
  // Added for wave 1.
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
];

const config = {
  platform: "github",
  onboarding: false,
  requireConfig: "required",
  autodiscover: true,
  autodiscoverFilter: WAVE_1,
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
