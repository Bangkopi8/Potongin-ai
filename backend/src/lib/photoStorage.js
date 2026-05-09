const { env } = require('../config/env');
const { createSupabaseClient } = require('./supabaseClient');
const {
  buildMockPhotoUploadSession,
  buildPhotoUploadSession,
  createPhotoSessionId,
  getFileExtension,
} = require('./photoUpload');

const PHOTO_STORAGE_MODE_MOCK = 'mock';
const PHOTO_STORAGE_MODE_SUPABASE = 'supabase';
const PHOTO_STORAGE_SIGNED_URL_TTL_SECONDS = 15 * 60;

function normalizePhotoStorageMode(value = env.PHOTO_STORAGE_MODE) {
  return String(value || '')
    .trim()
    .toLowerCase() === PHOTO_STORAGE_MODE_SUPABASE
    ? PHOTO_STORAGE_MODE_SUPABASE
    : PHOTO_STORAGE_MODE_MOCK;
}

function getPhotoStorageRuntimeConfig(source = env) {
  const storageMode = normalizePhotoStorageMode(source.PHOTO_STORAGE_MODE);
  const bucketName =
    typeof source.SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET === 'string' &&
    source.SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET.trim().length > 0
      ? source.SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET.trim()
      : 'original-temp';

  const missingKeys = [];

  if (storageMode === PHOTO_STORAGE_MODE_SUPABASE) {
    if (!source.SUPABASE_URL) {
      missingKeys.push('SUPABASE_URL');
    }

    if (!source.SUPABASE_SERVICE_ROLE_KEY) {
      missingKeys.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!bucketName) {
      missingKeys.push('SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET');
    }
  }

  return {
    bucketName,
    isSupabaseReady: storageMode === PHOTO_STORAGE_MODE_SUPABASE && missingKeys.length === 0,
    missingKeys,
    storageMode,
  };
}

function createPhotoStorageError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function buildPhotoStoragePath({ currentUser, file, payload, photoSessionId }) {
  const userId = currentUser?.id || 'mock-user-001';
  const extension = getFileExtension(file, payload);

  return `${userId}/${photoSessionId}/original.${extension}`;
}

async function uploadToSupabaseStorage({
  currentUser,
  envOverrides = env,
  file,
  payload,
  createClientFn = createSupabaseClient,
}) {
  const config = getPhotoStorageRuntimeConfig(envOverrides);

  if (!config.isSupabaseReady) {
    throw createPhotoStorageError(
      'PHOTO_STORAGE_UNAVAILABLE',
      `Supabase photo storage is unavailable. Missing: ${config.missingKeys.join(', ')}`
    );
  }

  if (!file) {
    throw createPhotoStorageError(
      'PHOTO_UPLOAD_INVALID',
      'A real image file is required when PHOTO_STORAGE_MODE=supabase.'
    );
  }

  const supabase = createClientFn({
    supabaseKey: envOverrides.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: envOverrides.SUPABASE_URL,
  });

  if (!supabase) {
    throw createPhotoStorageError(
      'PHOTO_STORAGE_UNAVAILABLE',
      'Supabase photo storage client could not be created.'
    );
  }

  const photoSessionId = createPhotoSessionId();
  const storagePath = buildPhotoStoragePath({
    currentUser,
    file,
    payload,
    photoSessionId,
  });

  const uploadResult = await supabase.storage.from(config.bucketName).upload(storagePath, file.buffer, {
    cacheControl: '900',
    contentType: file.mimetype,
    upsert: false,
  });

  if (uploadResult.error) {
    throw createPhotoStorageError(
      'PHOTO_STORAGE_UNAVAILABLE',
      `Supabase photo storage upload failed: ${uploadResult.error.message}`
    );
  }

  const signedUrlResult = await supabase.storage
    .from(config.bucketName)
    .createSignedUrl(storagePath, PHOTO_STORAGE_SIGNED_URL_TTL_SECONDS);

  const originalImageTempUrl =
    signedUrlResult?.data?.signedUrl || `supabase://${config.bucketName}/${storagePath}`;

  return buildPhotoUploadSession({
    file,
    originalImageTempUrl,
    payload,
    photoSessionId,
    status: 'confirmed_uploaded',
    storageMode: PHOTO_STORAGE_MODE_SUPABASE,
  });
}

async function confirmPhotoUpload({
  currentUser,
  envOverrides = env,
  file,
  payload,
  createClientFn = createSupabaseClient,
}) {
  const config = getPhotoStorageRuntimeConfig(envOverrides);

  if (config.storageMode === PHOTO_STORAGE_MODE_SUPABASE && file) {
    return uploadToSupabaseStorage({
      createClientFn,
      currentUser,
      envOverrides,
      file,
      payload,
    });
  }

  return buildMockPhotoUploadSession({
    file,
    payload,
  });
}

module.exports = {
  PHOTO_STORAGE_MODE_MOCK,
  PHOTO_STORAGE_MODE_SUPABASE,
  confirmPhotoUpload,
  createPhotoStorageError,
  getPhotoStorageRuntimeConfig,
  normalizePhotoStorageMode,
  uploadToSupabaseStorage,
};
