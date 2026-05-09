const { env } = require('../config/env');
const { createMockAiGenerationsRepository } = require('./mock/aiGenerationsRepository');
const { createMockBarbershopsRepository } = require('./mock/barbershopsRepository');
const {
  createMockExploreCollectionsRepository,
} = require('./mock/exploreCollectionsRepository');
const { createMockProfilesRepository } = require('./mock/profilesRepository');
const { createMockTransactionsRepository } = require('./mock/transactionsRepository');
const {
  assertAiGenerationsRepository,
} = require('./interfaces/aiGenerationsRepository');
const { assertBarbershopsRepository } = require('./interfaces/barbershopsRepository');
const {
  assertExploreCollectionsRepository,
} = require('./interfaces/exploreCollectionsRepository');
const { assertProfilesRepository } = require('./interfaces/profilesRepository');
const { assertTransactionsRepository } = require('./interfaces/transactionsRepository');
const {
  createSupabaseAiGenerationsRepository,
} = require('./supabase/aiGenerationsRepository');
const { createSupabaseBarbershopsRepository } = require('./supabase/barbershopsRepository');
const {
  createSupabaseExploreCollectionsRepository,
} = require('./supabase/exploreCollectionsRepository');
const { createSupabaseProfilesRepository } = require('./supabase/profilesRepository');
const { createSupabaseTransactionsRepository } = require('./supabase/transactionsRepository');

function buildMockRepositories() {
  return {
    aiGenerations: assertAiGenerationsRepository(createMockAiGenerationsRepository()),
    barbershops: assertBarbershopsRepository(createMockBarbershopsRepository()),
    exploreCollections: assertExploreCollectionsRepository(
      createMockExploreCollectionsRepository()
    ),
    profiles: assertProfilesRepository(createMockProfilesRepository()),
    transactions: assertTransactionsRepository(createMockTransactionsRepository()),
  };
}

function buildSupabaseRepositories() {
  return {
    aiGenerations: assertAiGenerationsRepository(createSupabaseAiGenerationsRepository()),
    barbershops: assertBarbershopsRepository(createSupabaseBarbershopsRepository()),
    exploreCollections: assertExploreCollectionsRepository(
      createSupabaseExploreCollectionsRepository()
    ),
    profiles: assertProfilesRepository(createSupabaseProfilesRepository()),
    transactions: assertTransactionsRepository(createSupabaseTransactionsRepository()),
  };
}

function getRepositories() {
  if (env.USE_SUPABASE) {
    return {
      source: 'supabase',
      ...buildSupabaseRepositories(),
    };
  }

  return {
    source: 'mock',
    ...buildMockRepositories(),
  };
}

module.exports = {
  getRepositories,
};
