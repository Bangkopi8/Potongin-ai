const { assertRepositoryShape } = require('./assertRepositoryShape');

const profilesRepositoryMethods = ['getProfileById', 'updateProfileCredits'];

function assertProfilesRepository(repository) {
  return assertRepositoryShape('profilesRepository', repository, profilesRepositoryMethods);
}

module.exports = {
  assertProfilesRepository,
  profilesRepositoryMethods,
};
