const { getSupabaseAdminClient } = require('../../lib/supabaseClient');
const { createMockBarbershopsRepository } = require('../mock/barbershopsRepository');

function createSupabaseBarbershopsRepository() {
  const adminClient = getSupabaseAdminClient();
  const fallbackRepository = createMockBarbershopsRepository();

  return {
    async createBarbershopClaim(submittedData) {
      void adminClient;
      // TODO: Insert barbershop claim row in Supabase.
      return fallbackRepository.createBarbershopClaim(submittedData);
    },

    async getBusinessProfile() {
      void adminClient;
      // TODO: Read verified owner-facing barbershop profile from Supabase.
      return fallbackRepository.getBusinessProfile();
    },

    async listBarbershops() {
      void adminClient;
      // TODO: Query barbershop discovery rows from Supabase.
      return fallbackRepository.listBarbershops();
    },

    async updateBusinessProfile(updates) {
      void adminClient;
      // TODO: Update verified owner-facing barbershop profile in Supabase.
      return fallbackRepository.updateBusinessProfile(updates);
    },
  };
}

module.exports = {
  createSupabaseBarbershopsRepository,
};
