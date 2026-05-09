import { useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '../config/api.js';
import {
  deletePersistedSavedLook,
  loadPersistedSavedLooks,
  savePersistedSavedLook,
} from '../lib/persistence.js';
import {
  DEMO_FREE_CREDITS,
  FREE_CREDITS,
  HISTORY_EMPTY_MESSAGE,
  PROFILE_PLACEHOLDER,
} from '../mock/mockData.js';
import { historyService, profileService } from '../services/index.js';
import {
  createSavedResultHistoryItem,
  deductGenerateCredit,
  prependSavedHistoryItem,
  removeSavedHistoryItem,
} from '../utils/mockUserState.js';

export function useMockUserState({ demoEmail = '' } = {}) {
  const normalizedDemoEmail = typeof demoEmail === 'string' ? demoEmail.trim().toLowerCase() : '';
  const [freeCredits, setFreeCredits] = useState(
    normalizedDemoEmail ? DEMO_FREE_CREDITS : FREE_CREDITS
  );
  const [savedHistory, setSavedHistory] = useState([]);
  const [backendProfile, setBackendProfile] = useState(null);
  const [historySource, setHistorySource] = useState('local');

  useEffect(() => {
    let isCancelled = false;

    profileService
      .getCurrentProfile()
      .then((data) => {
        if (!isCancelled && data?.profile) {
          setBackendProfile(data.profile);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setBackendProfile(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadHistory() {
      const persistedHistory = await loadPersistedSavedLooks();

      if (!isCancelled && Array.isArray(persistedHistory)) {
        setSavedHistory(persistedHistory);
        setHistorySource('supabase');
        return;
      }

      historyService
        .getHistory()
        .then((data) => {
          if (!isCancelled && Array.isArray(data?.history)) {
            setSavedHistory(data.history);
            setHistorySource('backend');
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setHistorySource('local');
          }
        });
    }

    loadHistory();

    return () => {
      isCancelled = true;
    };
  }, []);

  const profile = useMemo(() => {
    const demoName =
      normalizedDemoEmail.length > 0
        ? normalizedDemoEmail.split('@')[0]?.replace(/[._-]+/g, ' ') || 'Demo User'
        : PROFILE_PLACEHOLDER.name;
    const fallbackProfile = {
      ...PROFILE_PLACEHOLDER,
      apiBaseUrl: API_BASE_URL,
      id: 'mock-user-001',
      email: normalizedDemoEmail,
      name: demoName
        .split(' ')
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' '),
      plan: normalizedDemoEmail ? 'demo' : PROFILE_PLACEHOLDER.plan,
      role: normalizedDemoEmail ? 'demo' : 'regular',
      demo: Boolean(normalizedDemoEmail),
      source: 'local',
      updatedAt: null,
    };

    if (!backendProfile) {
      return fallbackProfile;
    }

    return {
      ...fallbackProfile,
      ...backendProfile,
      source: 'backend',
      apiBaseUrl: backendProfile.apiBaseUrl || fallbackProfile.apiBaseUrl,
      email: normalizedDemoEmail || backendProfile.email || fallbackProfile.email,
      plan: normalizedDemoEmail ? 'demo' : backendProfile.plan || fallbackProfile.plan,
      role: normalizedDemoEmail ? 'demo' : backendProfile.role || fallbackProfile.role,
      demo: normalizedDemoEmail ? true : Boolean(backendProfile.demo ?? fallbackProfile.demo),
    };
  }, [backendProfile, normalizedDemoEmail]);

  function consumeGenerateCredit() {
    setFreeCredits((currentCredits) => deductGenerateCredit(currentCredits));
  }

  function resetDemoCredits() {
    setFreeCredits(DEMO_FREE_CREDITS);
  }

  async function saveGeneratedResult({
    generateResult,
    selectedStyle,
    selectedHairColorLabel,
    instructionStyleName,
  }) {
    const fallbackHistoryItem = createSavedResultHistoryItem({
      generateResult,
      selectedStyle,
      selectedHairColorLabel,
      instructionStyleName,
    });

    const supabaseSavedLook = await savePersistedSavedLook({
      generateResult,
      historyItem: fallbackHistoryItem,
      selectedStyle,
      selectedHairColorLabel,
      instructionStyleName,
    });

    if (supabaseSavedLook) {
      const mergedSavedLook = {
        ...supabaseSavedLook,
        // Preserve the local/session preview when Supabase intentionally skips
        // non-http image payloads such as base64 or local file URIs.
        previewUrl: supabaseSavedLook.previewUrl || fallbackHistoryItem.previewUrl,
        previewCount:
          typeof supabaseSavedLook.previewCount === 'number' && supabaseSavedLook.previewCount > 0
            ? supabaseSavedLook.previewCount
            : fallbackHistoryItem.previewCount,
        subtitle: supabaseSavedLook.subtitle || fallbackHistoryItem.subtitle,
        savedAt: supabaseSavedLook.savedAt || fallbackHistoryItem.savedAt,
      };

      setSavedHistory((currentHistory) => prependSavedHistoryItem(currentHistory, mergedSavedLook));
      setHistorySource('supabase');
      return mergedSavedLook;
    }

    try {
      const data = await historyService.saveHistoryItem(fallbackHistoryItem);

      if (data?.savedLook) {
        setSavedHistory((currentHistory) => prependSavedHistoryItem(currentHistory, data.savedLook));
        setHistorySource('backend');
        return data.savedLook;
      }
    } catch {
      // Fall back to local-only history when backend history is unavailable.
      setHistorySource('local');
    }

    setSavedHistory((currentHistory) => prependSavedHistoryItem(currentHistory, fallbackHistoryItem));
    setHistorySource('local');
    return fallbackHistoryItem;
  }

  async function deleteSavedResult(historyId) {
    const deletedFromSupabase = await deletePersistedSavedLook(historyId);

    if (deletedFromSupabase) {
      setSavedHistory((currentHistory) => removeSavedHistoryItem(currentHistory, historyId));
      setHistorySource('supabase');
      return {
        deletedId: historyId,
      };
    }

    try {
      await historyService.deleteHistoryItem(historyId);
      setHistorySource('backend');
    } catch {
      // Fall back to local-only history deletion when backend history is unavailable.
      setHistorySource('local');
    }

    setSavedHistory((currentHistory) => removeSavedHistoryItem(currentHistory, historyId));
    return {
      deletedId: historyId,
    };
  }

  return {
    deleteSavedResult,
    freeCredits,
    historyEmptyMessage: HISTORY_EMPTY_MESSAGE,
    historySource,
    profile,
    savedHistory,
    saveGeneratedResult,
    consumeGenerateCredit,
    resetDemoCredits,
  };
}
