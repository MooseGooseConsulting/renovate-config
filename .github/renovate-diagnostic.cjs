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
 */
const applyDiagnosticForce = process.env.RENOVATE_DIAGNOSTIC_FORCE === "true";

const config = {
  platform: "github",
  onboarding: false,
  requireConfig: "required",
  autodiscover: true,
  autodiscoverFilter: ["MooseGooseConsulting/*"],
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
