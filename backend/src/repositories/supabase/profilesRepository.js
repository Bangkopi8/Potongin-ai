const { getSupabaseAdminClient } = require('../../lib/supabaseClient');
const { createMockProfilesRepository } = require('../mock/profilesRepository');

function mapProfileRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    credits: row.credits,
    createdAt: row.created_at,
  };
}

function createSupabaseProfilesRepository(options = {}) {
  const adminClient = options.adminClient || getSupabaseAdminClient();
  const fallbackRepository = createMockProfilesRepository();

  return {
    async getProfileById(profileId) {
      if (!adminClient) {
        return fallbackRepository.getProfileById(profileId);
      }

      const { data, error } = await adminClient
        .from('profiles')
        .select('id, email, display_name, role, credits, created_at')
        .eq('id', profileId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load profile from Supabase: ${error.message}`);
      }

      return mapProfileRow(data);
    },

    async updateProfileCredits(profileId, credits) {
      void adminClient;
      // TODO: Replace mock fallback with real Supabase credit update logic.
      return fallbackRepository.updateProfileCredits(profileId, credits);
    },
  };
}

module.exports = {
  createSupabaseProfilesRepository,
  mapProfileRow,
};
