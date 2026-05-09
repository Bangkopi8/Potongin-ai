import { describe, expect, it, vi } from 'vitest';

const photoStorageModule = await import('../src/lib/photoStorage.js');

const photoStorage = photoStorageModule.default ?? photoStorageModule;

describe('photo storage gate', () => {
  it('normalizes missing or invalid storage mode to mock', () => {
    expect(photoStorage.normalizePhotoStorageMode()).toBe('mock');
    expect(photoStorage.normalizePhotoStorageMode('')).toBe('mock');
    expect(photoStorage.normalizePhotoStorageMode('invalid')).toBe('mock');
    expect(photoStorage.normalizePhotoStorageMode('supabase')).toBe('supabase');
  });

  it('keeps mock mode ready without Supabase credentials', () => {
    const config = photoStorage.getPhotoStorageRuntimeConfig({
      PHOTO_STORAGE_MODE: 'mock',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET: '',
      SUPABASE_URL: '',
    });

    expect(config).toEqual({
      bucketName: 'original-temp',
      isSupabaseReady: false,
      missingKeys: [],
      storageMode: 'mock',
    });
  });

  it('reports missing env safely in supabase mode', () => {
    const config = photoStorage.getPhotoStorageRuntimeConfig({
      PHOTO_STORAGE_MODE: 'supabase',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET: 'original-temp',
      SUPABASE_URL: '',
    });

    expect(config.storageMode).toBe('supabase');
    expect(config.isSupabaseReady).toBe(false);
    expect(config.missingKeys).toEqual(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
  });

  it('uploads through the Supabase path when enabled and a file is present', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'mock-user-001/path' }, error: null });
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: 'https://example.com/signed-photo.jpg' }, error: null });

    const fakeClient = {
      storage: {
        from: vi.fn().mockReturnValue({
          upload,
          createSignedUrl,
        }),
      },
    };

    const result = await photoStorage.confirmPhotoUpload({
      createClientFn: vi.fn().mockReturnValue(fakeClient),
      currentUser: {
        id: 'mock-user-001',
      },
      envOverrides: {
        PHOTO_STORAGE_MODE: 'supabase',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        SUPABASE_STORAGE_ORIGINAL_TEMP_BUCKET: 'original-temp',
        SUPABASE_URL: 'https://example.supabase.co',
      },
      file: {
        buffer: Buffer.from('fake-image'),
        mimetype: 'image/jpeg',
        originalname: 'selfie.jpg',
      },
      payload: {
        height: 1080,
        localUri: 'file://selfie.jpg',
        source: 'camera',
        width: 720,
      },
    });

    expect(upload).toHaveBeenCalledTimes(1);
    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        photoSessionId: expect.stringMatching(/^mock-photo-session-/),
        originalImageTempUrl: 'https://example.com/signed-photo.jpg',
        localUri: 'file://selfie.jpg',
        originalLocalUri: 'file://selfie.jpg',
        source: 'camera',
        width: 720,
        height: 1080,
        status: 'confirmed_uploaded',
        storageMode: 'supabase',
        expiresAt: expect.any(String),
      })
    );
  });
});
