import { createRequire } from 'node:module';

import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const MODULES_TO_CLEAR = [
  '../src/app.js',
  '../src/config/env.js',
  '../src/lib/supabaseClient.js',
  '../src/repositories/getRepositories.js',
  '../src/repositories/supabase/aiGenerationsRepository.js',
  '../src/repositories/supabase/barbershopsRepository.js',
  '../src/repositories/supabase/exploreCollectionsRepository.js',
  '../src/repositories/supabase/profilesRepository.js',
  '../src/repositories/supabase/transactionsRepository.js',
  '../src/routes/mockRoutes.js',
];

function createExploreAdminClient(rows) {
  return {
    from(tableName) {
      expect(tableName).toBe('explore_collections');

      return {
        select(selection) {
          expect(selection).toContain('source_type');

          return {
            eq(column, value) {
              expect(column).toBe('is_active');
              expect(value).toBe(true);

              return {
                async order(columnName, options) {
                  expect(columnName).toBe('created_at');
                  expect(options).toEqual({ ascending: false });
                  return {
                    data: rows,
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

function createProfilesAdminClient(row) {
  return {
    from(tableName) {
      expect(tableName).toBe('profiles');

      return {
        select(selection) {
          expect(selection).toContain('display_name');

          return {
            eq(column, value) {
              expect(column).toBe('id');
              expect(value).toBe('user-123');

              return {
                async maybeSingle() {
                  return {
                    data: row,
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

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

describe('repository selection and Supabase gating', () => {
  it('loads the backend app and health route without Supabase credentials when USE_SUPABASE=false', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const app = require('../src/app.js');
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.service).toBe('potongin-ai-backend');
      }
    );
  });

  it('uses mock repositories by default when USE_SUPABASE=false', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'false',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      async () => {
        const { getRepositories } = require('../src/repositories/getRepositories.js');
        const repositories = getRepositories();
        const feed = await repositories.exploreCollections.listActiveExploreCollections();

        expect(repositories.source).toBe('mock');
        expect(feed).toEqual(
          expect.objectContaining({
            items: expect.any(Array),
            nextCursor: null,
          })
        );
      }
    );
  });

  it('uses Supabase repository stubs when USE_SUPABASE=true and credentials are present', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'true',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        SUPABASE_URL: 'https://example.supabase.co',
      },
      async () => {
        const { getRepositories } = require('../src/repositories/getRepositories.js');
        const repositories = getRepositories();
        const result = await repositories.aiGenerations.createGenerateResult({
          prompt: 'Show modern crop previews',
        });

        expect(repositories.source).toBe('supabase');
        expect(result.generationId).toBe('generate-mock-001');
      }
    );
  });

  it('implements read-only Supabase explore collection queries with an injected admin client', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'true',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        SUPABASE_URL: 'https://example.supabase.co',
      },
      async () => {
        const {
          createSupabaseExploreCollectionsRepository,
        } = require('../src/repositories/supabase/exploreCollectionsRepository.js');

        const repository = createSupabaseExploreCollectionsRepository({
          adminClient: createExploreAdminClient([
            {
              id: 'explore-001',
              title: 'Supabase Fade',
              category: 'fade',
              source_type: 'barbershop',
              cta_type: 'view_barber',
              face_shape_match: null,
              image_url: 'https://example.com/explore-001.jpg',
              style_prompt_ref: null,
              is_premium: false,
              is_active: true,
              created_at: '2026-01-02T00:00:00.000Z',
            },
          ]),
        });

        const result = await repository.listActiveExploreCollections();

        expect(result).toEqual({
          items: [
            {
              id: 'explore-001',
              type: 'barber',
              title: 'Supabase Fade',
              subtitle: 'Discover verified barber locations from Supabase content.',
            },
          ],
          nextCursor: null,
        });
      }
    );
  });

  it('implements read-only Supabase profile queries with an injected admin client', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'true',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
        SUPABASE_URL: 'https://example.supabase.co',
      },
      async () => {
        const {
          createSupabaseProfilesRepository,
        } = require('../src/repositories/supabase/profilesRepository.js');

        const repository = createSupabaseProfilesRepository({
          adminClient: createProfilesAdminClient({
            id: 'user-123',
            email: 'demo@potongin.ai',
            display_name: 'Demo User',
            role: 'regular',
            credits: 2,
            created_at: '2026-01-01T00:00:00.000Z',
          }),
        });

        const result = await repository.getProfileById('user-123');

        expect(result).toEqual({
          id: 'user-123',
          email: 'demo@potongin.ai',
          displayName: 'Demo User',
          role: 'regular',
          credits: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        });
      }
    );
  });

  it('routes GET /api/explore/feed through the repository layer and preserves the success contract', async () => {
    const { createMockRoutes } = require('../src/routes/mockRoutes.js');

    const testApp = express();
    testApp.use(express.json());
    testApp.use(
      createMockRoutes({
        repositories: {
          exploreCollections: {
            async listActiveExploreCollections() {
              return {
                items: [
                  {
                    id: 'explore-test-001',
                    type: 'style',
                    title: 'Repository-backed Buzz Cut',
                    subtitle: 'Returned from the injected repository.',
                  },
                ],
                nextCursor: null,
              };
            },
          },
        },
      })
    );

    const response = await request(testApp).get('/api/explore/feed');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        items: [
          {
            id: 'explore-test-001',
            type: 'style',
            title: 'Repository-backed Buzz Cut',
            subtitle: 'Returned from the injected repository.',
          },
        ],
        nextCursor: null,
      },
      message: 'Mock explore feed loaded.',
    });
  });

  it('returns EXPLORE_FEED_READ_FAILED when the repository read fails', async () => {
    const { createMockRoutes } = require('../src/routes/mockRoutes.js');

    const testApp = express();
    testApp.use(express.json());
    testApp.use(
      createMockRoutes({
        repositories: {
          exploreCollections: {
            async listActiveExploreCollections() {
              throw new Error('Supabase read failed');
            },
          },
        },
      })
    );

    const response = await request(testApp).get('/api/explore/feed');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'EXPLORE_FEED_READ_FAILED',
        message: 'Unable to load explore feed.',
      },
    });
  });

  it('routes GET /api/business/profile through the repository layer and preserves the success contract', async () => {
    const { createMockRoutes } = require('../src/routes/mockRoutes.js');

    const testApp = express();
    testApp.use(express.json());
    testApp.use(
      createMockRoutes({
        repositories: {
          barbershops: {
            async getBusinessProfile() {
              return {
                id: 'business-test-001',
                displayName: 'Repository-backed Studio',
                phone: '+628123456700',
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
        id: 'business-test-001',
        displayName: 'Repository-backed Studio',
        phone: '+628123456700',
      },
      message: 'Mock business profile loaded.',
    });
  });

  it('returns BUSINESS_PROFILE_READ_FAILED when the repository read fails', async () => {
    const { createMockRoutes } = require('../src/routes/mockRoutes.js');

    const testApp = express();
    testApp.use(express.json());
    testApp.use(
      createMockRoutes({
        repositories: {
          barbershops: {
            async getBusinessProfile() {
              throw new Error('Profile read failed');
            },
          },
        },
      })
    );

    const response = await request(testApp).get('/api/business/profile');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'BUSINESS_PROFILE_READ_FAILED',
        message: 'Unable to load business profile.',
      },
    });
  });

  it('requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY when USE_SUPABASE=true', async () => {
    await withEnv(
      {
        USE_SUPABASE: 'true',
        SUPABASE_SERVICE_ROLE_KEY: '',
        SUPABASE_URL: '',
      },
      () => {
        expect(() => require('../src/config/env.js')).toThrow(
          /Missing required Supabase environment variables/
        );
      }
    );
  });
});
