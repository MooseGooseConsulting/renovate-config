/** Native self-hosted Renovate configuration; shared policy lives in default.json.
 * Discover organization and personal repositories without a rollout allowlist.
 * Missing configurations receive standard onboarding PRs with an explicit preset.
 * Include owned forks; archived repositories retain Renovate's default skip.
 */
const preset = "github>MooseGooseConsulting/renovate-config";
const target = process.env.RENOVATE_TARGET_REPOSITORY;
if (target && !/^(MooseGooseConsulting|Coldaine)\/[A-Za-z0-9_.-]+$/i.test(target)) {
  throw new Error("Target must be one MooseGooseConsulting or Coldaine repository, not a pattern.");
}

const config = {
  platform: "github",
  onboarding: true,
  onboardingConfig: { extends: [preset] },
  requireConfig: "required",
  autodiscover: true,
  autodiscoverFilter: target ? [target] : ["MooseGooseConsulting/*", "Coldaine/*"],
  forkProcessing: "enabled",
};

// A manual run-now bypasses time only, never PR caps, release age, or review.
if (process.env.RENOVATE_DIAGNOSTIC_FORCE === "true") {
  config.force = { schedule: [], updateNotScheduled: true };
}

// Branch dry runs must resolve the proposed preset, not silently test main.
// Never persist a preview reference into a consumer configuration.
const previewRef = process.env.RENOVATE_PRESET_REF;
if (previewRef) {
  if (process.env.RENOVATE_DRY_RUN !== "full") {
    throw new Error("Preset previews require a full dry run.");
  }
  config.migratePresets = { [preset]: `${preset}#${previewRef}` };
  config.force = { ...config.force, configMigration: false };
}

module.exports = config;
