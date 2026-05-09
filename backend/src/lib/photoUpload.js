const multer = require('multer');

const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;

function createPhotoUploadInvalidError(message) {
  const error = new Error(message);
  error.code = 'PHOTO_UPLOAD_INVALID';
  return error;
}

const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PHOTO_UPLOAD_BYTES,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    if (ACCEPTED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      createPhotoUploadInvalidError('Only JPEG, PNG, or WebP images are accepted for upload.')
    );
  },
});

function normalizePhotoUploadError(error) {
  if (!error) {
    return null;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return createPhotoUploadInvalidError('Uploaded image must be 5 MB or smaller.');
    }

    return createPhotoUploadInvalidError('Uploaded photo could not be processed.');
  }

  if (error.code === 'PHOTO_UPLOAD_INVALID') {
    return error;
  }

  return createPhotoUploadInvalidError('Uploaded photo could not be processed.');
}

function parsePositiveNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }
  }

  return null;
}

function normalizePhotoPayload(body) {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const localUri =
    typeof body.localUri === 'string' && body.localUri.trim().length > 0 ? body.localUri.trim() : null;
  const source =
    typeof body.source === 'string' && body.source.trim().length > 0 ? body.source.trim() : null;
  const fileName =
    typeof body.fileName === 'string' && body.fileName.trim().length > 0 ? body.fileName.trim() : null;
  const mimeType =
    typeof body.mimeType === 'string' && body.mimeType.trim().length > 0 ? body.mimeType.trim() : null;

  return {
    localUri,
    source,
    width: parsePositiveNumber(body.width),
    height: parsePositiveNumber(body.height),
    fileName,
    mimeType,
  };
}

function hasValidPhotoMetadata(payload) {
  return Boolean(
    payload &&
      payload.localUri &&
      payload.source &&
      Number.isFinite(payload.width) &&
      payload.width > 0 &&
      Number.isFinite(payload.height) &&
      payload.height > 0
  );
}

function createPhotoSessionId(now = Date.now()) {
  return `mock-photo-session-${now}`;
}

function buildPhotoUploadSession({
  photoSessionId = createPhotoSessionId(),
  file,
  payload,
  originalImageTempUrl = null,
  storageMode = 'mock',
  status = 'confirmed_mock',
} = {}) {
  const now = Date.now();
  const normalizedPayload = normalizePhotoPayload(payload);
  const localUri = normalizedPayload?.localUri || null;
  const source =
    normalizedPayload?.source || (file ? 'multipart-upload-stub' : 'local-upload-stub');
  const width = normalizedPayload?.width ?? null;
  const height = normalizedPayload?.height ?? null;

  return {
    photoSessionId,
    originalImageTempUrl,
    localUri,
    originalLocalUri: localUri,
    source,
    width,
    height,
    status,
    storageMode,
    expiresAt: new Date(now + 15 * 60 * 1000).toISOString(),
  };
}

function buildMockPhotoUploadSession(options = {}) {
  return buildPhotoUploadSession({
    ...options,
    storageMode: 'mock',
    status: 'confirmed_mock',
  });
}

function getFileExtension(file, payload) {
  const sourceName = payload?.fileName || file?.originalname || '';
  const dottedExtension = sourceName.includes('.') ? sourceName.split('.').pop() : '';

  if (dottedExtension) {
    return dottedExtension.toLowerCase();
  }

  switch (file?.mimetype || payload?.mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

module.exports = {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_PHOTO_UPLOAD_BYTES,
  buildPhotoUploadSession,
  buildMockPhotoUploadSession,
  createPhotoUploadInvalidError,
  createPhotoSessionId,
  getFileExtension,
  hasValidPhotoMetadata,
  normalizePhotoPayload,
  normalizePhotoUploadError,
  parsePositiveNumber,
  photoUpload,
};
