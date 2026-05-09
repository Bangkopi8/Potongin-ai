const { assertRepositoryShape } = require('./assertRepositoryShape');

const transactionsRepositoryMethods = [
  'createTransaction',
  'markTransactionSuccess',
  'listTransactionsByUserId',
];

function assertTransactionsRepository(repository) {
  return assertRepositoryShape(
    'transactionsRepository',
    repository,
    transactionsRepositoryMethods
  );
}

module.exports = {
  assertTransactionsRepository,
  transactionsRepositoryMethods,
};
