const { mockExploreFeedItems } = require('../shared/mockData');

function createMockExploreCollectionsRepository() {
  return {
    async listActiveExploreCollections() {
      return {
        items: mockExploreFeedItems,
        nextCursor: null,
      };
    },
  };
}

module.exports = {
  createMockExploreCollectionsRepository,
};
