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

export const profileService = {
  getCurrentProfile() {
    return unwrapData(apiClient.get('/api/profile/me'));
  },
};
