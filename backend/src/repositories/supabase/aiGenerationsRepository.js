const { getSupabaseAdminClient } = require('../../lib/supabaseClient');
const { createMockAiGenerationsRepository } = require('../mock/aiGenerationsRepository');

function createSupabaseAiGenerationsRepository() {
  const adminClient = getSupabaseAdminClient();
  const fallbackRepository = createMockAiGenerationsRepository();

  return {
    async createAiGeneration(payload) {
      void adminClient;
      // TODO: Insert ai_generations row in Supabase when persistence is enabled.
      return fallbackRepository.createAiGeneration(payload);
    },

    async createAnalyzeResult(request) {
      void adminClient;
      // TODO: Persist analyze metadata while preserving current response contract.
      return fallbackRepository.createAnalyzeResult(request);
    },

    async createGenerateResult(request) {
      void adminClient;
      // TODO: Persist generate metadata while preserving current response contract.
      return fallbackRepository.createGenerateResult(request);
    },

    async listHistoryByUserId(currentUser) {
      void adminClient;
      // TODO: Read saved generation history from Supabase when persistence is enabled.
      return fallbackRepository.listHistoryByUserId(currentUser);
    },

    async saveHistoryItem(payload, currentUser) {
      void adminClient;
      // TODO: Persist saved generation history in Supabase when enabled.
      return fallbackRepository.saveHistoryItem(payload, currentUser);
    },

    async deleteHistoryItem(historyId, currentUser) {
      void adminClient;
      // TODO: Soft-delete or archive saved generation history in Supabase.
      return fallbackRepository.deleteHistoryItem(historyId, currentUser);
    },

    async updateAiGenerationStatus(generationId, status) {
      void adminClient;
      // TODO: Update ai_generations.status through Supabase.
      return fallbackRepository.updateAiGenerationStatus(generationId, status);
    },
  };
}

module.exports = {
  createSupabaseAiGenerationsRepository,
};
