const { getSupabaseAdminClient } = require('../../lib/supabaseClient');
const { createMockExploreCollectionsRepository } = require('../mock/exploreCollectionsRepository');

function mapCtaTypeToSubtitle(ctaType) {
  switch (ctaType) {
    case 'view_barber':
      return 'Discover verified barber locations from Supabase content.';
    case 'claim_promo':
      return 'Supabase-driven promo card prepared for future campaigns.';
    case 'try_this_look':
    default:
      return 'Supabase-driven inspiration card for the explore feed.';
  }
}

function mapSourceTypeToFeedType(sourceType) {
  return sourceType === 'barbershop' ? 'barber' : 'style';
}

function mapExploreCollectionRow(row) {
  return {
    id: row.id,
    type: mapSourceTypeToFeedType(row.source_type),
    title: row.title,
    subtitle: row.face_shape_match
      ? `Best for ${row.face_shape_match} face shape.`
      : mapCtaTypeToSubtitle(row.cta_type),
  };
}

function createSupabaseExploreCollectionsRepository(options = {}) {
  const adminClient = options.adminClient || getSupabaseAdminClient();
  const fallbackRepository = createMockExploreCollectionsRepository();

  return {
    async listActiveExploreCollections() {
      if (!adminClient) {
        return fallbackRepository.listActiveExploreCollections();
      }

      const { data, error } = await adminClient
        .from('explore_collections')
        .select(
          'id, title, category, source_type, cta_type, face_shape_match, image_url, style_prompt_ref, is_premium, is_active, created_at'
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to load explore collections from Supabase: ${error.message}`);
      }

      return {
        items: (data || []).map(mapExploreCollectionRow),
        nextCursor: null,
      };
    },
  };
}

module.exports = {
  createSupabaseExploreCollectionsRepository,
  mapExploreCollectionRow,
};
