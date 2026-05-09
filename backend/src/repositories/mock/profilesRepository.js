const {
  getBetaProfileById,
  updateBetaProfileCredits: updateStoredBetaProfileCredits,
} = require('../../lib/betaProfileStore');

function createMockProfilesRepository() {
  return {
    async getProfileById(profileId) {
      return getBetaProfileById(profileId);
    },

    async updateProfileCredits(profileId, credits) {
      return updateStoredBetaProfileCredits(profileId, credits);
    },
  };
}

module.exports = {
  createMockProfilesRepository,
};
