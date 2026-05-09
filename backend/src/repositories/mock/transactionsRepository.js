const { createMockTransaction } = require('../shared/mockData');

function createMockTransactionsRepository() {
  return {
    async createTransaction(payload) {
      return createMockTransaction(payload);
    },

    async listTransactionsByUserId(userId) {
      return [
        createMockTransaction({
          userId,
          amount: 0,
          creditsAdded: 0,
          paymentGatewayRef: null,
        }),
      ];
    },

    async markTransactionSuccess(transactionId) {
      return {
        id: transactionId,
        status: 'success',
        updatedAt: new Date().toISOString(),
      };
    },
  };
}

module.exports = {
  createMockTransactionsRepository,
};
