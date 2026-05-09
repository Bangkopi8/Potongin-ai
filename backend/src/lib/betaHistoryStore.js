function formatSavedAt(date = new Date()) {
  return date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
}

function createHistoryId() {
  return `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const betaHistoryByUserId = new Map();

function getSafeUserHistory(userId) {
  const safeUserId = userId || 'mock-user-001';

  if (!betaHistoryByUserId.has(safeUserId)) {
    betaHistoryByUserId.set(safeUserId, []);
  }

  return betaHistoryByUserId.get(safeUserId);
}

function listHistoryByUserId(userId) {
  return getSafeUserHistory(userId).map((item) => ({ ...item }));
}

function normalizeSavedLook(payload = {}) {
  return {
    id: payload.id?.trim() || createHistoryId(),
    title: payload.title,
    subtitle: payload.subtitle || 'Saved from the current public beta preview flow.',
    previewUrl: payload.previewUrl || '',
    previewCount: Number.isInteger(payload.previewCount) ? payload.previewCount : 0,
    savedAt: payload.savedAt || formatSavedAt(),
  };
}

function saveHistoryItem(userId, payload) {
  const nextSavedLook = normalizeSavedLook(payload);
  const currentHistory = getSafeUserHistory(userId);

  currentHistory.unshift(nextSavedLook);

  return { ...nextSavedLook };
}

function deleteHistoryItem(userId, historyId) {
  const currentHistory = getSafeUserHistory(userId);
  const itemIndex = currentHistory.findIndex((item) => item.id === historyId);

  if (itemIndex === -1) {
    return null;
  }

  currentHistory.splice(itemIndex, 1);

  return {
    deletedId: historyId,
  };
}

function resetBetaHistoryStore() {
  betaHistoryByUserId.clear();
}

module.exports = {
  deleteHistoryItem,
  listHistoryByUserId,
  resetBetaHistoryStore,
  saveHistoryItem,
};
