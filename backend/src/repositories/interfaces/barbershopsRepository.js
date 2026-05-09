const { assertRepositoryShape } = require('./assertRepositoryShape');

const barbershopsRepositoryMethods = [
  'createBarbershopClaim',
  'getBusinessProfile',
  'listBarbershops',
  'updateBusinessProfile',
];

function assertBarbershopsRepository(repository) {
  return assertRepositoryShape(
    'barbershopsRepository',
    repository,
    barbershopsRepositoryMethods
  );
}

module.exports = {
  assertBarbershopsRepository,
  barbershopsRepositoryMethods,
};
