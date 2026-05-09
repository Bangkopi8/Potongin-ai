const { getSupabaseAdminClient } = require('../../lib/supabaseClient');
const { createMockTransactionsRepository } = require('../mock/transactionsRepository');

function createSupabaseTransactionsRepository() {
  const adminClient = getSupabaseAdminClient();
  const fallbackRepository = createMockTransactionsRepository();

  return {
    async createTransaction(payload) {
      void adminClient;
      // TODO: Insert pending top-up transaction in Supabase.
      return fallbackRepository.createTransaction(payload);
    },

    async listTransactionsByUserId(userId) {
      void adminClient;
      // TODO: Query user transaction history from Supabase.
      return fallbackRepository.listTransactionsByUserId(userId);
    },

    async markTransactionSuccess(transactionId) {
      void adminClient;
      // TODO: Mark transaction success and apply credits atomically in Supabase-backed flow.
      return fallbackRepository.markTransactionSuccess(transactionId);
    },
  };
}

module.exports = {
  createSupabaseTransactionsRepository,
};
