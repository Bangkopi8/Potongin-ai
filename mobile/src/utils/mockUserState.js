/**
 * @typedef {import('../types/apiContracts').GeneratePreviewResponse} GeneratePreviewResponse
 * @typedef {import('../types/apiContracts').ExploreFeedItem} ExploreFeedItem
 * @typedef {import('../types/apiContracts').SavedHistoryItem} SavedHistoryItem
 */

/**
 * @param {number} credits
 * @returns {boolean}
 */
export function canGenerateWithCredits(credits) {
  return credits > 0;
}

/**
 * @param {number} credits
 * @returns {number}
 */
export function deductGenerateCredit(credits) {
  return Math.max(credits - 1, 0);
}

/**
 * @param {Date=} date
 * @returns {string}
 */
function formatSavedAt(date = new Date()) {
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

/**
 * @param {{
 *   generateResult: GeneratePreviewResponse,
 *   selectedStyle?: ExploreFeedItem | null,
 *   selectedHairColorLabel?: string | null,
 *   instructionStyleName?: string,
 * }} input
 * @returns {SavedHistoryItem}
 */
export function createSavedResultHistoryItem({
  generateResult,
  selectedStyle,
  selectedHairColorLabel,
  instructionStyleName,
}) {
  const primaryPreview = generateResult?.previews?.[0];
  const rawPreviewUrl =
    primaryPreview?.imageUrl || generateResult?.previewUrl || '';
  const styleTitle =
    selectedStyle?.title ||
    primaryPreview?.styleName ||
    instructionStyleName ||
    'Saved Look';
  const colorLabel = selectedHairColorLabel || generateResult?.hairColor || null;
  const baseSubtitle =
    selectedStyle?.subtitle || 'Saved from the current public beta preview flow.';
  const subtitleWithColor =
    colorLabel && !String(baseSubtitle).includes(`Color: ${colorLabel}`)
      ? `${baseSubtitle} Color: ${colorLabel}.`
      : baseSubtitle;

  return {
    id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: styleTitle,
    subtitle: subtitleWithColor,
    previewUrl: typeof rawPreviewUrl === 'string' ? rawPreviewUrl : '',
    previewCount: generateResult?.previews?.length || 0,
    savedAt: formatSavedAt(),
  };
}

/**
 * @param {SavedHistoryItem[]} currentHistory
 * @param {SavedHistoryItem} item
 * @returns {SavedHistoryItem[]}
 */
export function prependSavedHistoryItem(currentHistory, item) {
  return [item, ...currentHistory];
}

/**
 * @param {SavedHistoryItem[]} currentHistory
 * @param {string} historyId
 * @returns {SavedHistoryItem[]}
 */
export function removeSavedHistoryItem(currentHistory, historyId) {
  return currentHistory.filter((item) => item.id !== historyId);
}
