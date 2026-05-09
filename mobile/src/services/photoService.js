import { apiClient, ApiClientError, isApiClientError } from '../lib/apiClient.js';

/**
 * @typedef {import('../types/apiContracts').ConfirmPhotoUploadResponse} ConfirmPhotoUploadResponse
 * @typedef {import('../types/apiContracts').SelectedLocalPhoto} SelectedLocalPhoto
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

function buildConfirmUploadPayload(photo) {
  return {
    localUri: photo.uri,
    source: photo.sourceType,
    width: photo.width,
    height: photo.height,
    fileName: photo.fileName,
    mimeType: photo.mimeType,
  };
}

function deriveUploadFileName(photo) {
  if (photo.fileName) {
    return photo.fileName;
  }

  if (typeof photo.uri === 'string' && photo.uri.includes('/')) {
    const lastPathSegment = photo.uri.split('/').pop();

    if (lastPathSegment) {
      return lastPathSegment;
    }
  }

  return 'selected-photo.jpg';
}

function canUseMultipartUpload(photo) {
  return Boolean(
    typeof FormData !== 'undefined' &&
      photo &&
      photo.file &&
      typeof Blob !== 'undefined' &&
      photo.file instanceof Blob &&
      typeof photo.uri === 'string' &&
      photo.uri.trim().length > 0
  );
}

function buildConfirmUploadFormData(photo) {
  const formData = new FormData();

  formData.append('source', photo.sourceType);
  formData.append('localUri', photo.uri);
  formData.append('width', String(photo.width));
  formData.append('height', String(photo.height));

  if (photo.fileName) {
    formData.append('fileName', photo.fileName);
  }

  if (photo.mimeType) {
    formData.append('mimeType', photo.mimeType);
  }

  if (photo.file instanceof Blob) {
    formData.append('photo', photo.file, deriveUploadFileName(photo));
  } else {
    formData.append('photo', {
      name: deriveUploadFileName(photo),
      type: photo.mimeType || 'image/jpeg',
      uri: photo.uri,
    });
  }

  return formData;
}

export const photoService = {
  /**
   * @param {SelectedLocalPhoto} selectedPhoto
   * @returns {Promise<ConfirmPhotoUploadResponse>}
   */
  confirmUpload(selectedPhoto) {
    if (canUseMultipartUpload(selectedPhoto)) {
      return unwrapData(
        apiClient.postForm(
          '/api/photos/confirm-upload',
          buildConfirmUploadFormData(selectedPhoto)
        )
      );
    }

    return unwrapData(
      apiClient.post('/api/photos/confirm-upload', buildConfirmUploadPayload(selectedPhoto))
    );
  },
};
