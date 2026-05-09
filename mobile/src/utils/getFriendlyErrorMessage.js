import { isApiClientError } from '../lib/apiClient.js';

export function getFriendlyErrorMessage(error) {
  if (isApiClientError(error)) {
    switch (error.code) {
      case 'AI_REAL_MODE_UNAVAILABLE':
        return 'Real AI mode is enabled, but the backend is missing OPENAI_API_KEY. Add the key or switch the backend back to mock mode.';
      case 'IMAGE_INPUT_INVALID':
        return error.message || 'Please use a JPEG, PNG, or WebP photo and confirm it before generating a live preview.';
      case 'IMAGE_PREPROCESS_FAILED':
        return error.message || 'We could not prepare that photo for live AI preview. Please try another image.';
      case 'IMAGE_MODEL_UNSUPPORTED':
        return error.message || 'The backend image model is not supported for the real try-on flow. Switch to gpt-image-1 or back to mock mode.';
      case 'IMAGE_REQUEST_FAILED':
        return error.message || 'The live AI preview request failed. Please try again.';
      case 'IMAGE_RESPONSE_EMPTY':
        return error.message || 'Preview finished but no image was returned.';
      case 'AI_ANALYSIS_FAILED':
        return 'The AI analysis could not finish right now. Please try again, or switch back to mock mode for the demo.';
      case 'AI_GENERATION_FAILED':
        return 'The AI preview could not be generated right now. Please try again with the same photo, haircut, or color.';
      case 'NETWORK_ERROR':
        return 'We could not reach the backend. Check that the backend is running and your phone can reach it on the same network.';
      case 'VALIDATION_ERROR':
        return error.message || 'Some photo or style details were missing. Please try again.';
      default:
        return error.message || 'Something went wrong.';
    }
  }

  return error?.message || 'Something went wrong.';
}
