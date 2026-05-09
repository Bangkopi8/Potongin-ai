import { apiClient, ApiClientError, isApiClientError } from '../lib/apiClient.js';

/**
 * @typedef {import('../types/apiContracts').ExploreFeedItem} ExploreFeedItem
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

export const exploreService = {
  /**
   * @returns {Promise<{ items: ExploreFeedItem[], nextCursor: string | null }>}
   */
  getFeed() {
    return unwrapData(apiClient.get('/api/explore/feed'));
  },
};
