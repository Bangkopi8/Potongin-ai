import { apiClient, ApiClientError, isApiClientError } from '../lib/apiClient.js';

/**
 * @typedef {import('../types/apiContracts').BusinessProfileUpdateRequest} BusinessProfileUpdateRequest
 */

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

export const businessService = {
  /**
   * @returns {Promise<object>}
   */
  getProfile() {
    return unwrapData(apiClient.get('/api/business/profile'));
  },

  /**
   * @param {BusinessProfileUpdateRequest} payload
   * @returns {Promise<object>}
   */
  updateProfile(payload) {
    return unwrapData(apiClient.put('/api/business/profile', payload));
  },
};
