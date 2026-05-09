import { apiClient, ApiClientError, isApiClientError } from '../lib/apiClient.js';

/**
 * @typedef {import('../types/apiContracts').AnalyzePhotoRequest} AnalyzePhotoRequest
 * @typedef {import('../types/apiContracts').AnalyzePhotoResponse} AnalyzePhotoResponse
 * @typedef {import('../types/apiContracts').GeneratePreviewRequest} GeneratePreviewRequest
 * @typedef {import('../types/apiContracts').GeneratePreviewResponse} GeneratePreviewResponse
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

export const aiService = {
  /**
   * @param {AnalyzePhotoRequest} payload
   * @returns {Promise<AnalyzePhotoResponse>}
   */
  analyzePhoto(payload) {
    return unwrapData(apiClient.post('/api/ai/analyze', payload));
  },

  /**
   * @param {GeneratePreviewRequest} payload
   * @returns {Promise<GeneratePreviewResponse>}
   */
  generatePreview(payload) {
    return unwrapData(apiClient.post('/api/ai/generate', payload));
  },
};
