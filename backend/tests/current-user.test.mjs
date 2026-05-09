import { createRequire } from 'node:module';

import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const MODULES_TO_CLEAR = [
  '../src/config/env.js',
  '../src/middleware/currentUser.js',
  '../src/middleware/mockCurrentUser.js',
  '../src/routes/mockRoutes.js',
];

function clearModules() {
  for (const modulePath of MODULES_TO_CLEAR) {
    try {
      delete require.cache[require.resolve(modulePath)];
    } catch {
      // Ignore modules that have not been loaded yet.
    }
  }
}

async function withEnv(overrides, callback) {
  const previousEnv = { ...process.env };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  clearModules();

  try {
    return await callback();
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in previousEnv)) {
        delete process.env[key];
      }
    }

    Object.assign(process.env, previousEnv);
    clearModules();
  }
}

describe('current user auth boundary', () => {
  it('attaches a mock currentUser when USE_SUPABASE=false', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { attachCurrentUser } = require('../src/middleware/currentUser.js');

        const testApp = express();
        testApp.get('/me', attachCurrentUser, (req, res) => {
          res.json({
            currentUser: req.currentUser,
            authBoundary: req.authBoundary,
          });
        });

        const response = await request(testApp).get('/me');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          currentUser: {
            id: 'mock-user-001',
            email: 'demo@potongin.ai',
            role: 'regular',
          },
          authBoundary: {
            mode: 'mock',
            isAuthenticated: true,
          },
        });
      }
    );
  });

  it('keeps Supabase auth as a TODO stub when USE_SUPABASE=true', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'true',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        SUPABASE_URL: 'https://example.supabase.co',
      },
      async () => {
        const { attachCurrentUser } = require('../src/middleware/currentUser.js');

        const testApp = express();
        testApp.get('/me', attachCurrentUser, (req, res) => {
          res.json({
            currentUser: req.currentUser,
            authBoundary: req.authBoundary,
          });
        });

        const response = await request(testApp).get('/me');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          currentUser: null,
          authBoundary: {
            mode: 'supabase-todo',
            isAuthenticated: false,
          },
        });
      }
    );
  });

  it('passes mock currentUser into repository-backed business profile reads', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { createMockRoutes } = require('../src/routes/mockRoutes.js');

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          createMockRoutes({
            repositories: {
              barbershops: {
                async getBusinessProfile(currentUser) {
                  return {
                    requestedBy: currentUser.id,
                    requestedRole: currentUser.role,
                  };
                },
              },
            },
          })
        );

        const response = await request(testApp).get('/api/business/profile');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            requestedBy: 'mock-user-001',
            requestedRole: 'regular',
          },
          message: 'Mock business profile loaded.',
        });
      }
    );
  });

  it('passes mock currentUser into repository-backed beta profile reads', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { createMockRoutes } = require('../src/routes/mockRoutes.js');

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          createMockRoutes({
            repositories: {
              profiles: {
                async getProfileById(profileId) {
                  return {
                    id: profileId,
                    name: 'Demo User',
                    credits: 2,
                    plan: 'beta',
                    role: 'regular',
                    beta: true,
                    updatedAt: '2026-05-03T00:00:00.000Z',
                  };
                },
              },
            },
          })
        );

        const response = await request(testApp).get('/api/profile/me');

        expect(response.status).toBe(200);
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
              updatedAt: '2026-05-03T00:00:00.000Z',
              apiBaseUrl: expect.any(String),
            }),
          },
          message: 'Profile loaded.',
        });
      }
    );
  });

  it('passes mock currentUser into repository-backed AI analyze and generate requests', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { createMockRoutes } = require('../src/routes/mockRoutes.js');

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          createMockRoutes({
            repositories: {
              aiGenerations: {
                async createAnalyzeResult(requestBody, currentUser) {
                  return {
                    request: requestBody,
                    currentUserId: currentUser.id,
                  };
                },
                async createGenerateResult(requestBody, currentUser) {
                  return {
                    request: requestBody,
                    currentUserId: currentUser.id,
                  };
                },
              },
            },
          })
        );

        const analyzeResponse = await request(testApp)
          .post('/api/ai/analyze')
          .send({
            photoSessionId: 'mock-photo-session-001',
            notes: 'Prefer short styles',
          });

        expect(analyzeResponse.status).toBe(200);
        expect(analyzeResponse.body).toEqual({
          success: true,
          data: {
            request: {
              photoSessionId: 'mock-photo-session-001',
              notes: 'Prefer short styles',
            },
            currentUserId: 'mock-user-001',
          },
          message: 'Mock AI analyze response generated.',
        });

        const generateResponse = await request(testApp)
          .post('/api/ai/generate')
          .send({
            prompt: 'Show modern crop previews',
            analysisId: 'analysis-mock-001',
            photoSessionId: 'mock-photo-session-001',
            variations: 2,
          });

        expect(generateResponse.status).toBe(200);
        expect(generateResponse.body).toEqual({
          success: true,
          data: {
            request: {
              prompt: 'Show modern crop previews',
              analysisId: 'analysis-mock-001',
              photoSessionId: 'mock-photo-session-001',
              variations: 2,
            },
            currentUserId: 'mock-user-001',
          },
          message: 'Mock AI generate response generated.',
        });
      }
    );
  });

  it('passes mock currentUser into repository-backed barbershop claims', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { createMockRoutes } = require('../src/routes/mockRoutes.js');

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          createMockRoutes({
            repositories: {
              barbershops: {
                async createBarbershopClaim(submittedData, currentUser) {
                  return {
                    barberId: submittedData.barberId,
                    requestedBy: currentUser.id,
                  };
                },
              },
            },
          })
        );

        const response = await request(testApp)
          .post('/api/barbers/claim')
          .send({
            barberId: 'barber-001',
            contactName: 'Rizky',
            phoneNumber: '+628123456789',
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            barberId: 'barber-001',
            requestedBy: 'mock-user-001',
          },
          message: 'Mock barber claim submitted.',
        });
      }
    );
  });

  it('passes mock currentUser into repository-backed history deletion', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { createMockRoutes } = require('../src/routes/mockRoutes.js');

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          createMockRoutes({
            repositories: {
              aiGenerations: {
                async deleteHistoryItem(historyId, currentUser) {
                  return {
                    deletedId: historyId,
                    requestedBy: currentUser.id,
                  };
                },
              },
            },
          })
        );

        const response = await request(testApp).delete('/api/history/history-mock-001');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          success: true,
          data: {
            deletedId: 'history-mock-001',
            requestedBy: 'mock-user-001',
          },
          message: 'History item deleted.',
        });
      }
    );
  });

  it('passes mock currentUser into repository-backed history list and save routes', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { createMockRoutes } = require('../src/routes/mockRoutes.js');

        const testApp = express();
        testApp.use(express.json());
        testApp.use(
          createMockRoutes({
            repositories: {
              aiGenerations: {
                async listHistoryByUserId(currentUser) {
                  return [
                    {
                      id: 'history-mock-001',
                      requestedBy: currentUser.id,
                    },
                  ];
                },
                async saveHistoryItem(savedLook, currentUser) {
                  return {
                    ...savedLook,
                    requestedBy: currentUser.id,
                  };
                },
                async deleteHistoryItem() {
                  return {
                    deletedId: 'unused',
                  };
                },
              },
            },
          })
        );

        const getResponse = await request(testApp).get('/api/history');

        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toEqual({
          success: true,
          data: {
            history: [
              {
                id: 'history-mock-001',
                requestedBy: 'mock-user-001',
              },
            ],
          },
          message: 'History loaded.',
        });

        const postResponse = await request(testApp)
          .post('/api/history')
          .send({
            id: 'history-mock-002',
            title: 'Textured Crop',
            previewCount: 2,
          });

        expect(postResponse.status).toBe(200);
        expect(postResponse.body).toEqual({
          success: true,
          data: {
            savedLook: {
              id: 'history-mock-002',
              title: 'Textured Crop',
              previewCount: 2,
              requestedBy: 'mock-user-001',
            },
          },
          message: 'Look saved.',
        });
      }
    );
  });

  it('returns UNAUTHENTICATED for user-context routes when currentUser is missing', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'true',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        SUPABASE_URL: 'https://example.supabase.co',
      },
      async () => {
        const app = require('../src/app.js');

        const businessProfileResponse = await request(app).get('/api/business/profile');
        const analyzeResponse = await request(app)
          .post('/api/ai/analyze')
          .send({
            photoSessionId: 'mock-photo-session-001',
            notes: 'Prefer short styles',
          });

        expect(businessProfileResponse.status).toBe(401);
        expect(businessProfileResponse.body).toEqual({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'User context is required.',
          },
        });

        expect(analyzeResponse.status).toBe(401);
        expect(analyzeResponse.body).toEqual({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'User context is required.',
          },
        });
      }
    );
  });
});
