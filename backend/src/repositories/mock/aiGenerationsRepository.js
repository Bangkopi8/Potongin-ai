const {
  createMockAnalyzeResult,
  createMockGenerateResult,
} = require('../shared/mockData');
const {
  deleteHistoryItem: deleteStoredHistoryItem,
  listHistoryByUserId,
  saveHistoryItem: saveStoredHistoryItem,
} = require('../../lib/betaHistoryStore');

function createMockAiGenerationsRepository() {
  return {
    async createAiGeneration(payload, currentUser) {
      void currentUser;
      return {
        id: 'generation-row-mock-001',
        ...payload,
        status: payload.status || 'pending',
        createdAt: new Date().toISOString(),
      };
    },

    async createAnalyzeResult(request, currentUser) {
      void currentUser;
      return createMockAnalyzeResult(request);
    },

    async createGenerateResult(request, currentUser) {
      void currentUser;
      return createMockGenerateResult(request);
    },

    async listHistoryByUserId(currentUser) {
      return listHistoryByUserId(currentUser?.id);
    },

    async saveHistoryItem(payload, currentUser) {
      return saveStoredHistoryItem(currentUser?.id, payload);
    },

    async deleteHistoryItem(historyId, currentUser) {
      return deleteStoredHistoryItem(currentUser?.id, historyId);
    },

    async updateAiGenerationStatus(generationId, status) {
      return {
        id: generationId,
        status,
        updatedAt: new Date().toISOString(),
      };
    },
  };
}

module.exports = {
  createMockAiGenerationsRepository,
};
