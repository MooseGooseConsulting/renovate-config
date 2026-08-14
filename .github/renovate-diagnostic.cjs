/** Self-hosted runner config. Not shared preset policy. */
module.exports = {
  platform: "github",
  onboarding: false,
  requireConfig: "required",
  // Manual/scheduled dispatch can run outside the shared weekday window.
  force: {
    schedule: [],
    updateNotScheduled: true,
  },
  prCreation: "immediate",
  internalChecksFilter: "relaxed",
  prHourlyLimit: 0,
  // Keep in sync with App-token repositories in renovate-diagnostic.yml
  // (workflow also includes renovate-config so the App can read this repo).
  repositories: [
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
  ],
};
