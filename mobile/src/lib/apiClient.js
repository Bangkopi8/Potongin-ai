import { API_BASE_URL } from '../config/api.js';

export class ApiClientError extends Error {
  constructor({ code = 'API_ERROR', message = 'API request failed.', status, response } = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status ?? null;
    this.response = response ?? null;
  }
}

function isStandardSuccessResponse(payload) {
  return Boolean(
    payload &&
      payload.success === true &&
      Object.prototype.hasOwnProperty.call(payload, 'data')
  );
}

function isStandardErrorResponse(payload) {
  return Boolean(
    payload &&
      payload.success === false &&
      payload.error &&
      typeof payload.error.code === 'string' &&
      typeof payload.error.message === 'string'
  );
}

function buildMalformedResponseError(status, payload) {
  return new ApiClientError({
    code: 'INVALID_RESPONSE_SHAPE',
    message: 'API response did not match the expected standardized format.',
    status,
    response: payload,
  });
}

function isFormDataBody(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function hasContentTypeHeader(headers) {
  return Object.keys(headers || {}).some((key) => key.toLowerCase() === 'content-type');
}

async function request(path, options = {}) {
  let response;
  const requestHeaders = { ...(options.headers || {}) };

  if (!hasContentTypeHeader(requestHeaders) && options.body !== undefined && !isFormDataBody(options.body)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: requestHeaders,
      ...options,
    });
  } catch (error) {
    throw new ApiClientError({
      code: 'NETWORK_ERROR',
      message: error?.message || 'Network request failed.',
    });
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (isStandardErrorResponse(payload)) {
      throw new ApiClientError({
        code: payload.error.code,
        message: payload.error.message,
        status: response.status,
        response: payload,
      });
    }

    throw new ApiClientError({
      code: 'HTTP_ERROR',
      message: `Request failed with status ${response.status}`,
      status: response.status,
      response: payload,
    });
  }

  if (!isStandardSuccessResponse(payload)) {
    throw buildMalformedResponseError(response.status, payload);
  }

  return payload;
}

export function isApiClientError(error) {
  return error instanceof ApiClientError;
}

export const apiClient = {
  delete(path, options) {
    return request(path, {
      method: 'DELETE',
      ...options,
    });
  },
  get(path, options) {
    return request(path, {
      method: 'GET',
      ...options,
    });
  },
  post(path, body, options) {
    return request(path, {
      method: 'POST',
      body: isFormDataBody(body) ? body : JSON.stringify(body || {}),
      ...options,
    });
  },
  postForm(path, formData, options) {
    return request(path, {
      method: 'POST',
      body: formData,
      ...options,
    });
  },
  put(path, body, options) {
    return request(path, {
      method: 'PUT',
      body: isFormDataBody(body) ? body : JSON.stringify(body || {}),
      ...options,
    });
  },
};
