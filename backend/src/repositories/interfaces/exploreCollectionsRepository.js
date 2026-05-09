const { assertRepositoryShape } = require('./assertRepositoryShape');

const exploreCollectionsRepositoryMethods = ['listActiveExploreCollections'];

function assertExploreCollectionsRepository(repository) {
  return assertRepositoryShape(
    'exploreCollectionsRepository',
    repository,
    exploreCollectionsRepositoryMethods
  );
}

module.exports = {
  assertExploreCollectionsRepository,
  exploreCollectionsRepositoryMethods,
};
