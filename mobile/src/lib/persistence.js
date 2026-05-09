import { DEMO_USER_KEY, isSupabasePersistenceReady, supabaseRestRequest } from './supabaseClient.js';

const SUPPORTED_LANGUAGES = new Set(['id', 'en']);

function formatSavedAt(dateInput = new Date()) {
  const normalizedDate =
    dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());

  if (Number.isNaN(normalizedDate.getTime())) {
    return new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  }

  return normalizedDate.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getPersistableImageUri(candidate) {
  if (typeof candidate !== 'string') {
    return null;
  }

  const normalized = candidate.trim();

  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return null;
}

function buildSavedLookSubtitle(row) {
  if (isRecord(row?.metadata) && typeof row.metadata.subtitle === 'string') {
    return row.metadata.subtitle;
  }

  const styleName = typeof row?.style_name === 'string' ? row.style_name.trim() : '';
  const colorName = typeof row?.hair_color === 'string' ? row.hair_color.trim() : '';

  if (styleName && colorName) {
    return `Saved look in ${colorName}.`;
  }

  if (styleName) {
    return 'Saved look reference.';
  }

  return 'Saved look reference.';
}

function mapSavedLookRowToHistoryItem(row) {
  if (!isRecord(row)) {
    return null;
  }

  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const title =
    typeof metadata.title === 'string' && metadata.title.trim().length > 0
      ? metadata.title.trim()
      : typeof row.style_name === 'string' && row.style_name.trim().length > 0
        ? row.style_name.trim()
        : 'Saved Look';

  return {
    id: String(row.id || `history-${Date.now()}`),
    title,
    subtitle: buildSavedLookSubtitle(row),
    previewUrl:
      typeof row.preview_image === 'string' ? row.preview_image.trim() : '',
    previewCount:
      typeof metadata.previewCount === 'number' && Number.isFinite(metadata.previewCount)
        ? metadata.previewCount
        : 1,
    savedAt:
      typeof metadata.savedAt === 'string' && metadata.savedAt.trim().length > 0
        ? metadata.savedAt.trim()
        : formatSavedAt(row.created_at),
  };
}

function buildSavedLookRow({
  historyItem,
  generateResult,
  selectedStyle,
  selectedHairColorLabel,
  instructionStyleName,
}) {
  const styleName =
    historyItem?.title ||
    selectedStyle?.title ||
    instructionStyleName ||
    generateResult?.styleName ||
    'Saved Look';

  const hairColor =
    selectedHairColorLabel ||
    generateResult?.hairColor ||
    null;

  const metadata = {
    title: historyItem?.title || styleName,
    subtitle: historyItem?.subtitle || 'Saved look reference.',
    previewCount: historyItem?.previewCount || generateResult?.previews?.length || 1,
    savedAt: historyItem?.savedAt || formatSavedAt(),
    source: 'mobile-demo',
    category: selectedStyle?.category || selectedStyle?.styleFamily || null,
    length: selectedStyle?.length || null,
    maintenanceLevel:
      selectedStyle?.maintenanceLevel ||
      selectedStyle?.maintenance ||
      null,
  };

  const barberCard = {
    styleName,
    hairColor,
    maintenanceLevel: selectedStyle?.maintenanceLevel || selectedStyle?.maintenance || null,
    category: selectedStyle?.category || selectedStyle?.styleFamily || null,
    length: selectedStyle?.length || null,
    barberInstruction:
      selectedStyle?.barberInstruction ||
      selectedStyle?.barberInstructions ||
      null,
    stylingNotes: selectedStyle?.stylingNotes || null,
  };

  return {
    demo_user_key: DEMO_USER_KEY,
    style_name: styleName,
    hair_color: hairColor,
    preview_image: getPersistableImageUri(historyItem?.previewUrl),
    original_image: null,
    barber_card: barberCard,
    metadata,
  };
}

export function getPersistenceMode() {
  return isSupabasePersistenceReady() ? 'supabase' : 'local';
}

export async function loadPersistedLanguagePreference() {
  const result = await supabaseRestRequest({
    table: 'user_preferences',
    query: `?select=language&demo_user_key=eq.${encodeURIComponent(
      DEMO_USER_KEY
    )}&limit=1`,
  });

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  const language = typeof result.data[0]?.language === 'string'
    ? result.data[0].language.trim()
    : '';

  return SUPPORTED_LANGUAGES.has(language) ? language : null;
}

export async function savePersistedLanguagePreference(language) {
  const normalizedLanguage = SUPPORTED_LANGUAGES.has(language) ? language : 'id';

  const result = await supabaseRestRequest({
    table: 'user_preferences',
    method: 'POST',
    query: '?on_conflict=demo_user_key&select=language',
    body: [
      {
        demo_user_key: DEMO_USER_KEY,
        language: normalizedLanguage,
        updated_at: new Date().toISOString(),
      },
    ],
    prefer: 'resolution=merge-duplicates,return=representation',
  });

  return result.ok;
}

export async function loadPersistedSavedLooks() {
  const result = await supabaseRestRequest({
    table: 'saved_looks',
    query: `?select=id,style_name,hair_color,preview_image,original_image,barber_card,metadata,created_at&demo_user_key=eq.${encodeURIComponent(
      DEMO_USER_KEY
    )}&order=created_at.desc`,
  });

  if (!result.ok || !Array.isArray(result.data)) {
    return null;
  }

  return result.data
    .map(mapSavedLookRowToHistoryItem)
    .filter(Boolean);
}

export async function savePersistedSavedLook({
  historyItem,
  generateResult,
  selectedStyle,
  selectedHairColorLabel,
  instructionStyleName,
}) {
  const payload = buildSavedLookRow({
    historyItem,
    generateResult,
    selectedStyle,
    selectedHairColorLabel,
    instructionStyleName,
  });

  const result = await supabaseRestRequest({
    table: 'saved_looks',
    method: 'POST',
    query: '?select=id,style_name,hair_color,preview_image,original_image,barber_card,metadata,created_at',
    body: [payload],
    prefer: 'return=representation',
  });

  if (!result.ok || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  return mapSavedLookRowToHistoryItem(result.data[0]);
}

export async function deletePersistedSavedLook(historyId) {
  if (typeof historyId !== 'string' || historyId.trim().length === 0) {
    return false;
  }

  const result = await supabaseRestRequest({
    table: 'saved_looks',
    method: 'DELETE',
    query: `?id=eq.${encodeURIComponent(historyId)}&demo_user_key=eq.${encodeURIComponent(
      DEMO_USER_KEY
    )}`,
    prefer: 'return=minimal',
  });

  return result.ok;
}
