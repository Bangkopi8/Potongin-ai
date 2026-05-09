import { apiClient, ApiClientError, isApiClientError } from '../lib/apiClient.js';

/**
 * @typedef {import('../types/apiContracts').BarberClaimRequest} BarberClaimRequest
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

export const barbershopService = {
  /**
   * @param {BarberClaimRequest} payload
   * @returns {Promise<{ claimId: string, status: string, submittedData: BarberClaimRequest }>}
   */
  claimBarbershop(payload) {
    return unwrapData(apiClient.post('/api/barbers/claim', payload));
  },
};
