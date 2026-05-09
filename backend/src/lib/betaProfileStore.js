const DEFAULT_BETA_CREDITS = 2;
const DEFAULT_BETA_NAME = 'Demo User';
const DEFAULT_BETA_PLAN = 'beta';
const DEFAULT_BETA_ROLE = 'regular';

const betaProfiles = new Map();

function buildDefaultBetaProfile(profileId) {
  return {
    id: profileId || 'mock-user-001',
    name: DEFAULT_BETA_NAME,
    plan: DEFAULT_BETA_PLAN,
    role: DEFAULT_BETA_ROLE,
    credits: DEFAULT_BETA_CREDITS,
    beta: true,
    updatedAt: new Date().toISOString(),
  };
}

function getBetaProfileById(profileId) {
  const safeProfileId = profileId || 'mock-user-001';

  if (!betaProfiles.has(safeProfileId)) {
    betaProfiles.set(safeProfileId, buildDefaultBetaProfile(safeProfileId));
  }

  return {
    ...betaProfiles.get(safeProfileId),
  };
}

function updateBetaProfileCredits(profileId, credits) {
  const currentProfile = getBetaProfileById(profileId);
  const nextProfile = {
    ...currentProfile,
    credits,
    updatedAt: new Date().toISOString(),
  };

  betaProfiles.set(nextProfile.id, nextProfile);

  return {
    ...nextProfile,
  };
}

function resetBetaProfileStore() {
  betaProfiles.clear();
}

module.exports = {
  DEFAULT_BETA_CREDITS,
  DEFAULT_BETA_NAME,
  DEFAULT_BETA_PLAN,
  DEFAULT_BETA_ROLE,
  buildDefaultBetaProfile,
  getBetaProfileById,
  resetBetaProfileStore,
  updateBetaProfileCredits,
};
