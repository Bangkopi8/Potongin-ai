const {
  createMockBarbershopClaim,
  mockBarbershops,
  mockBusinessProfile,
} = require('../shared/mockData');

function createMockBarbershopsRepository() {
  return {
    async createBarbershopClaim(submittedData, currentUser) {
      void currentUser;
      return createMockBarbershopClaim(submittedData);
    },

    async getBusinessProfile(currentUser) {
      void currentUser;
      return mockBusinessProfile;
    },

    async listBarbershops() {
      return mockBarbershops;
    },

    async updateBusinessProfile(updates, currentUser) {
      void currentUser;
      return {
        ...mockBusinessProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    },
  };
}

module.exports = {
  createMockBarbershopsRepository,
};
