const { createClient } = require('@supabase/supabase-js');

const { env, getMissingSupabaseEnvKeys } = require('../config/env');

let supabaseAdminClient = null;

function isSupabaseEnabled() {
  return env.USE_SUPABASE;
}

function createSupabaseClient(options = {}) {
  const {
    supabaseUrl = env.SUPABASE_URL,
    supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY,
    clientOptions = {},
  } = options;

  if (!supabaseUrl || !supabaseKey) {
    if (!isSupabaseEnabled()) {
      return null;
    }

    const missingKeys = getMissingSupabaseEnvKeys();
    throw new Error(
      `Supabase is enabled but missing required environment variables: ${missingKeys.join(', ')}`
    );
  }

  return createClient(supabaseUrl, supabaseKey, clientOptions);
}

function getSupabaseAdminClient() {
  if (!isSupabaseEnabled()) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createSupabaseClient();
  }

  return supabaseAdminClient;
}

module.exports = {
  createSupabaseClient,
  getSupabaseAdminClient,
  isSupabaseEnabled,
};
