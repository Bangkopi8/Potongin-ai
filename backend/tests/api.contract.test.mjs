import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../src/app.js';

const validAnalyzePayload = {
  photoSessionId: 'mock-photo-session-001',
  notes: 'Prefer short styles',
};

const validRealAnalyzePayload = {
  photoSessionId: 'mock-photo-session-001',
  imageBase64: Buffer.from('fake-jpeg-bytes').toString('base64'),
  mimeType: 'image/jpeg',
  width: 1024,
  height: 1024,
  source: 'gallery',
  selectedStyleId: 'men-clean-low-taper',
  selectedHairColor: 'color-espresso-black',
  notes: 'Prefer short styles',
};

const validGeneratePayload = {
  prompt: 'Show modern crop previews',
  analysisId: 'analysis-mock-001',
  photoSessionId: 'mock-photo-session-001',
  variations: 2,
};

const validRealGeneratePayload = {
  prompt: 'Show modern crop previews',
  analysisId: 'analysis-mock-001',
  photoSessionId: 'mock-photo-session-001',
  imageBase64: Buffer.from('fake-jpeg-bytes').toString('base64'),
  mimeType: 'image/jpeg',
  source: 'camera',
  selectedStyleId: 'men-clean-low-taper',
  selectedStyleName: 'Clean Low Taper',
  selectedHairColor: 'color-espresso-black',
  variations: 2,
};

const validBarberClaimPayload = {
  barberId: 'barber-001',
  contactName: 'Rizky',
  phoneNumber: '+628123456789',
  proofUrl: 'https://example.com/proof.jpg',
};

const validBusinessProfilePayload = {
  displayName: 'Potongin Studio Updated',
  phone: '+628111111111',
};

const validSavedLookPayload = {
  id: 'history-mock-001',
  title: 'Textured Crop',
  subtitle: 'Saved from the current public beta preview flow.',
  previewUrl: 'https://example.com/mock-preview-1.jpg',
  previewCount: 2,
  savedAt: '2026-05-03 14:00 UTC',
};

function expectStandardSuccess(body) {
  expect(body.success).toBe(true);
  expect(body).toHaveProperty('data');
}

function expectValidationError(body) {
  expect(body.success).toBe(false);
  expect(body.error).toEqual(
    expect.objectContaining({
      code: 'VALIDATION_ERROR',
      message: expect.any(String),
    })
  );
}

describe('mock API contract', () => {
  it('GET /health returns success: true', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
  });

  it('POST /api/ai/analyze with valid payload returns success: true', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .send(validAnalyzePayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data.request.photoSessionId).toBe(validAnalyzePayload.photoSessionId);
  });

  it('POST /api/ai/analyze accepts real-mode-compatible payload fields in mock mode', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .send(validRealAnalyzePayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data.request.selectedStyleId).toBe(validRealAnalyzePayload.selectedStyleId);
    expect(response.body.data.request.selectedHairColor).toBe(validRealAnalyzePayload.selectedHairColor);
    expect(response.body.data.request.source).toBe(validRealAnalyzePayload.source);
  });

  it('POST /api/photos/confirm-upload with a valid image returns success: true', async () => {
    const response = await request(app)
      .post('/api/photos/confirm-upload')
      .attach('photo', Buffer.from('fake-jpeg-bytes'), {
        filename: 'selfie.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        photoSessionId: expect.stringMatching(/^mock-photo-session-/),
        originalImageTempUrl: null,
        localUri: null,
        originalLocalUri: null,
        source: 'multipart-upload-stub',
        width: null,
        height: null,
        status: 'confirmed_mock',
        storageMode: 'mock',
        expiresAt: expect.any(String),
      })
    );
  });

  it('POST /api/photos/confirm-upload with a valid placeholder payload returns success: true', async () => {
    const response = await request(app)
      .post('/api/photos/confirm-upload')
      .send({
        source: 'manual-test',
        localUri: 'file://test.jpg',
        width: 1024,
        height: 1084,
      });

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        photoSessionId: expect.stringMatching(/^mock-photo-session-/),
        originalImageTempUrl: null,
        localUri: 'file://test.jpg',
        originalLocalUri: 'file://test.jpg',
        source: 'manual-test',
        width: 1024,
        height: 1084,
        status: 'confirmed_mock',
        storageMode: 'mock',
        expiresAt: expect.any(String),
      })
    );
  });

  it('POST /photos/confirm-upload also returns success for compatibility', async () => {
    const response = await request(app)
      .post('/photos/confirm-upload')
      .attach('photo', Buffer.from('fake-jpeg-bytes'), {
        filename: 'selfie.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        photoSessionId: expect.stringMatching(/^mock-photo-session-/),
        originalImageTempUrl: null,
        localUri: null,
        originalLocalUri: null,
        source: 'multipart-upload-stub',
        width: null,
        height: null,
        status: 'confirmed_mock',
        storageMode: 'mock',
        expiresAt: expect.any(String),
      })
    );
  });

  it('POST /api/ai/generate with valid payload returns success: true', async () => {
    const response = await request(app)
      .post('/api/ai/generate')
      .send(validGeneratePayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data.request.photoSessionId).toBe(validGeneratePayload.photoSessionId);
  });

  it('POST /api/ai/generate accepts real-mode-compatible payload fields in mock mode', async () => {
    const response = await request(app)
      .post('/api/ai/generate')
      .send(validRealGeneratePayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body.data.request.selectedStyleId).toBe(validRealGeneratePayload.selectedStyleId);
    expect(response.body.data.request.selectedHairColor).toBe(validRealGeneratePayload.selectedHairColor);
    expect(response.body.data.request.source).toBe(validRealGeneratePayload.source);
  });

  it('GET /api/explore/feed returns success: true', async () => {
    const response = await request(app).get('/api/explore/feed');

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
  });

  it('GET /api/profile/me returns success: true', async () => {
    const response = await request(app).get('/api/profile/me');

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body).toEqual({
      success: true,
      data: {
        profile: expect.objectContaining({
          id: 'mock-user-001',
          name: 'Demo User',
          credits: 2,
          plan: 'beta',
          role: 'regular',
          beta: true,
          apiBaseUrl: expect.any(String),
          updatedAt: expect.any(String),
        }),
      },
      message: 'Profile loaded.',
    });
  });

  it('GET /api/history returns success: true', async () => {
    const response = await request(app).get('/api/history');

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body).toEqual({
      success: true,
      data: {
        history: expect.any(Array),
      },
      message: 'History loaded.',
    });
  });

  it('POST /api/history with valid payload returns success: true', async () => {
    const response = await request(app)
      .post('/api/history')
      .send(validSavedLookPayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
    expect(response.body).toEqual({
      success: true,
      data: {
        savedLook: expect.objectContaining(validSavedLookPayload),
      },
      message: 'Look saved.',
    });
  });

  it('POST /api/barbers/claim with valid payload returns success: true', async () => {
    const response = await request(app)
      .post('/api/barbers/claim')
      .send(validBarberClaimPayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
  });

  it('GET /api/business/profile returns success: true', async () => {
    const response = await request(app).get('/api/business/profile');

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
  });

  it('DELETE /api/history/:id returns success: true', async () => {
    await request(app).post('/api/history').send(validSavedLookPayload);

    const response = await request(app).delete('/api/history/history-mock-001');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        deletedId: 'history-mock-001',
      },
      message: 'History item deleted.',
    });
  });

  it('PUT /api/business/profile with valid payload returns success: true', async () => {
    const response = await request(app)
      .put('/api/business/profile')
      .send(validBusinessProfilePayload);

    expect(response.status).toBe(200);
    expectStandardSuccess(response.body);
  });

  it('POST /api/ai/analyze with invalid payload returns VALIDATION_ERROR', async () => {
    const response = await request(app).post('/api/ai/analyze').send({});

    expect(response.status).toBe(400);
    expectValidationError(response.body);
  });

  it('POST /api/ai/analyze without photoSessionId returns VALIDATION_ERROR', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .send({ notes: 'Prefer short styles' });

    expect(response.status).toBe(400);
    expectValidationError(response.body);
  });

  it('POST /api/ai/generate with invalid payload returns VALIDATION_ERROR', async () => {
    const response = await request(app)
      .post('/api/ai/generate')
      .send({ prompt: 'hi', variations: 9 });

    expect(response.status).toBe(400);
    expectValidationError(response.body);
  });

  it('POST /api/barbers/claim with invalid payload returns VALIDATION_ERROR', async () => {
    const response = await request(app)
      .post('/api/barbers/claim')
      .send({ barberId: '', contactName: 'A', phoneNumber: '123' });

    expect(response.status).toBe(400);
    expectValidationError(response.body);
  });

  it('PUT /api/business/profile with invalid payload returns VALIDATION_ERROR', async () => {
    const response = await request(app).put('/api/business/profile').send({});

    expect(response.status).toBe(400);
    expectValidationError(response.body);
  });

  it('POST /api/photos/confirm-upload without an image returns PHOTO_UPLOAD_INVALID', async () => {
    const response = await request(app).post('/api/photos/confirm-upload');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PHOTO_UPLOAD_INVALID',
        message: 'Photo confirmation requires localUri, source, width, and height.',
      },
    });
  });

  it('POST /api/photos/confirm-upload with a non-image file returns PHOTO_UPLOAD_INVALID', async () => {
    const response = await request(app)
      .post('/api/photos/confirm-upload')
      .attach('photo', Buffer.from('plain-text-bytes'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PHOTO_UPLOAD_INVALID',
        message: 'Only JPEG, PNG, or WebP images are accepted for upload.',
      },
    });
  });

  it('POST /api/photos/confirm-upload with an oversized image returns PHOTO_UPLOAD_INVALID', async () => {
    const response = await request(app)
      .post('/api/photos/confirm-upload')
      .attach('photo', Buffer.alloc(6 * 1024 * 1024, 1), {
        filename: 'too-large.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PHOTO_UPLOAD_INVALID',
        message: 'Uploaded image must be 5 MB or smaller.',
      },
    });
  });

  it('POST /api/history with invalid payload returns VALIDATION_ERROR', async () => {
    const response = await request(app)
      .post('/api/history')
      .send({ previewCount: -1 });

    expect(response.status).toBe(400);
    expectValidationError(response.body);
  });

  it('DELETE /api/history/:id with a missing id returns HISTORY_ITEM_NOT_FOUND', async () => {
    const response = await request(app).delete('/api/history/history-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'HISTORY_ITEM_NOT_FOUND',
        message: 'History item not found.',
      },
    });
  });
});
