import { apiClient, ApiClientError, isApiClientError } from '../lib/apiClient.js';

async function unwrapData(requestPromise) {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    if (isApiClientError(error)) {
      throw error;
    }

    throw new ApiClientError({
      code: 'UNEXPECTED_CLIENT_ERROR',
      message: error?.message || 'Unexpected mobile API error.',
    });
  }
}

export const historyService = {
  /**
   * @returns {Promise<{ history: import('../types/apiContracts').SavedHistoryItem[] }>}
   */
  getHistory() {
    return unwrapData(apiClient.get('/api/history'));
  },

  /**
   * @param {import('../types/apiContracts').SavedHistoryItem} payload
   * @returns {Promise<{ savedLook: import('../types/apiContracts').SavedHistoryItem }>}
   */
  saveHistoryItem(payload) {
    return unwrapData(apiClient.post('/api/history', payload));
  },

  /**
   * @param {string} historyId
   * @returns {Promise<{ deletedId: string }>}
   */
  deleteHistoryItem(historyId) {
    return unwrapData(apiClient.delete(`/api/history/${encodeURIComponent(historyId)}`));
  },
};
