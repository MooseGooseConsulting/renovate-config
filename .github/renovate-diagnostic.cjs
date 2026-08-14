/** First-wave self-hosted diagnostic only. Not shared preset policy. */
module.exports = {
  platform: "github",
  onboarding: false,
  requireConfig: "required",
  // Manual dispatch can run outside the shared weekday window. Force
  // unrestricted scheduling so DRY-RUN evidence is not skipped.
  force: {
    schedule: [],
    updateNotScheduled: true,
  },
  // Keep this list in sync with the App-token scan targets in
  // .github/workflows/renovate-diagnostic.yml (workflow also includes
  // renovate-config so the App can read this repo).
  repositories: [
    "MooseGooseConsulting/ColdSearch",
    "MooseGooseConsulting/NorthStarGuardian",
    "MooseGooseConsulting/RoccatMouse",
    "MooseGooseConsulting/frozenSkillz",
  ],
};
