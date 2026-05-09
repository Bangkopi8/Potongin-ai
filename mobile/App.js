import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

import { HOME_SECTION_ORDER, homeFeedItems } from './src/data/index.js';
import { createTranslator } from './src/i18n/translations.js';
import {
  loadPersistedLanguagePreference,
  savePersistedLanguagePreference,
} from './src/lib/persistence.js';
import {
  useExploreMockFlow,
  useMockUserState,
  useProfileMockState,
  useTryAiMockFlow,
} from './src/hooks/index.js';
import { MOCK_BARBERSHOPS } from './src/mock/mockData.js';
import {
  BarbersScreen,
  CustomHairLabScreen,
  DemoAuthScreen,
  ExploreScreen,
  HomeScreen,
  LanguageOnboardingScreen,
  ProfileScreen,
  StyleDetailScreen,
  TryAiScreen,
} from './src/screens/index.js';

function LanguageToggle({ language, setLanguage, t }) {
  return (
    <View style={styles.languageToggleWrap}>
      <Text style={styles.languageLabel}>{t('app.languageLabel')}</Text>
      <View style={styles.languageToggleRow}>
        {['id', 'en'].map((value) => (
          <Pressable
            key={value}
            onPress={() => setLanguage(value)}
            style={[
              styles.languageButton,
              language === value && styles.languageButtonActive,
            ]}
          >
            <Text
              style={[
                styles.languageButtonLabel,
                language === value && styles.languageButtonLabelActive,
              ]}
            >
              {value.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AuthenticatedDemoShell({ language, setLanguage, t, demoSession, onLogoutDemoSession }) {
  const [activeScreen, setActiveScreen] = useState('home');
  const [detailItem, setDetailItem] = useState(null);
  const [detailOriginScreen, setDetailOriginScreen] = useState('explore');
  const [customLabOriginScreen, setCustomLabOriginScreen] = useState('home');

  const exploreFlow = useExploreMockFlow();
  const mockUserState = useMockUserState({ demoEmail: demoSession?.email });
  const tryAiFlow = useTryAiMockFlow({
    language,
    t,
    availableCredits: mockUserState.freeCredits,
    onConsumeGenerateCredit: mockUserState.consumeGenerateCredit,
    onSaveGeneratedResult: mockUserState.saveGeneratedResult,
  });
  const profileState = useProfileMockState(mockUserState);

  const homeSections = useMemo(
    () =>
      HOME_SECTION_ORDER.map((sectionTitle) => ({
        title: sectionTitle,
        items: homeFeedItems.filter((item) => item.section === sectionTitle),
      })),
    []
  );

  const navItems = useMemo(
    () => [
      { key: 'home', label: t('nav.home') },
      { key: 'explore', label: t('nav.explore') },
      { key: 'try-ai', label: t('nav.tryAi') },
      { key: 'custom-lab', label: t('nav.hairLab') },
      { key: 'barbers', label: t('nav.barbers') },
      { key: 'profile', label: t('nav.profile') },
    ],
    [t]
  );

  function createTryAiSelection(item) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    if (item.kind === 'color' || item.kind === 'tip') {
      return item;
    }

    if (item.kind === 'style' || item.styleType === 'haircut' || item.genderFit || item.genderTarget) {
      if (item.styleId || item.id) {
        return {
          kind: 'style',
          styleId: item.styleId || item.id,
        };
      }
    }

    return item;
  }

  function openTryAi() {
    setActiveScreen('try-ai');
  }

  function navigateTo(screenKey) {
    if (screenKey === 'custom-lab') {
      setCustomLabOriginScreen(activeScreen);
    }

    setActiveScreen(screenKey);
  }

  function openTryAiWithStyle(item) {
    tryAiFlow.selectInspiration(createTryAiSelection(item));
    setActiveScreen('try-ai');
  }

  async function trySelectedLook(item) {
    await tryAiFlow.tryThisLook(createTryAiSelection(item), {
      autoGenerateIfReady: false,
    });
    setActiveScreen('try-ai');
  }

  function openDetail(item) {
    setDetailOriginScreen(activeScreen);
    setDetailItem(item);
    setActiveScreen('detail');
  }

  function openCustomLab() {
    setCustomLabOriginScreen(activeScreen);
    setActiveScreen('custom-lab');
  }

  function closeDetail() {
    setDetailItem(null);
    setActiveScreen(detailOriginScreen);
  }

  function closeCustomLab() {
    setActiveScreen(customLabOriginScreen);
  }

  return (
    <View style={styles.appFrame}>
      <View style={styles.topBar}>
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Potongin AI</Text>
          <Text style={styles.brandSubcopy}>{t('app.brandSubtitle')}</Text>
        </View>
        <View style={styles.topBarActions}>
          <LanguageToggle language={language} setLanguage={setLanguage} t={t} />
          <View style={styles.creditPill}>
            <Text style={styles.creditPillLabel}>
              {t('app.creditsLabel', { count: profileState.freeCredits })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.navRail}>
        {navItems.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => navigateTo(item.key)}
            style={[
              styles.navButton,
              activeScreen === item.key && styles.navButtonActive,
            ]}
          >
            <Text
              style={[
                styles.navButtonLabel,
                activeScreen === item.key && styles.navButtonLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeScreen === 'home' && (
          <HomeScreen
            language={language}
            t={t}
            freeCredits={profileState.freeCredits}
            homeSections={homeSections}
            onTryAi={openTryAi}
            onOpenDetail={openDetail}
            onTryInspiration={openTryAiWithStyle}
            onOpenCustomLab={openCustomLab}
          />
        )}

        {activeScreen === 'explore' && (
          <ExploreScreen
            language={language}
            t={t}
            status={exploreFlow.status}
            items={exploreFlow.items}
            error={exploreFlow.error}
            filters={exploreFlow.filters}
            activeFilter={exploreFlow.activeFilter}
            onSelectFilter={exploreFlow.setActiveFilter}
            onRefresh={exploreFlow.loadStyles}
            onTryStyle={openTryAiWithStyle}
            onViewDetail={openDetail}
            onOpenCustomLab={openCustomLab}
          />
        )}

        {activeScreen === 'try-ai' && (
          <TryAiScreen
            language={language}
            t={t}
            selectedStyle={tryAiFlow.selectedStyle}
            selectedPhoto={tryAiFlow.selectedPhoto}
            photoSession={tryAiFlow.photoSession}
            photoError={tryAiFlow.photoError}
            photoConfirmationStatus={tryAiFlow.photoConfirmationStatus}
            photoStatus={tryAiFlow.photoStatus}
            photoInputState={tryAiFlow.photoInputState}
            photoQualityGuide={tryAiFlow.photoQualityGuide}
            previewActionLabel={tryAiFlow.previewActionLabel}
            analysisStatus={tryAiFlow.analysisStatus}
            analysisResult={tryAiFlow.analysisResult}
            analysisError={tryAiFlow.analysisError}
            analysisStatusSummary={tryAiFlow.analysisStatusSummary}
            analysisActionHint={tryAiFlow.analysisActionHint}
            availableCredits={tryAiFlow.availableCredits}
            canRunAnalysis={tryAiFlow.canRunAnalysis}
            canRunGenerate={tryAiFlow.canRunGenerate}
            canSaveResult={tryAiFlow.canSaveResult}
            generateStatus={tryAiFlow.generateStatus}
            generateResult={tryAiFlow.generateResult}
            generateError={tryAiFlow.generateError}
            generateStatusSummary={tryAiFlow.generateStatusSummary}
            generateActionHint={tryAiFlow.generateActionHint}
            hasInsufficientCredits={tryAiFlow.hasInsufficientCredits}
            instructionStyleName={tryAiFlow.instructionStyleName}
            mockRecommendationGroups={tryAiFlow.mockRecommendationGroups}
            paywallMessage={tryAiFlow.paywallMessage}
            paywallTitle={tryAiFlow.paywallTitle}
            recommendationGroups={tryAiFlow.recommendationGroups}
            saveMessage={tryAiFlow.saveMessage}
            selectionNotice={tryAiFlow.selectionNotice}
            selectedHairColor={tryAiFlow.selectedHairColor}
            selectedHairColorLabel={tryAiFlow.selectedHairColorLabel}
            selectedStyleId={tryAiFlow.selectedStyleId}
            showPaywallPlaceholder={tryAiFlow.showPaywallPlaceholder}
            showInstructionCard={tryAiFlow.showInstructionCard}
            onTakePhoto={tryAiFlow.takePhoto}
            onUploadFromGallery={tryAiFlow.uploadFromGallery}
            onConfirmPhoto={tryAiFlow.confirmPhoto}
            onResetPhoto={tryAiFlow.clearPhotoSelection}
            onRunAnalysis={tryAiFlow.runAnalysis}
            onRunGenerate={tryAiFlow.runGenerate}
            onSaveResult={tryAiFlow.saveResult}
            onSelectHairColor={tryAiFlow.setSelectedHairColorById}
            onTryRecommendation={trySelectedLook}
            onOpenProfile={() => navigateTo('profile')}
          />
        )}

        {activeScreen === 'barbers' && (
          <BarbersScreen language={language} t={t} barbershops={MOCK_BARBERSHOPS} />
        )}

        {activeScreen === 'profile' && (
          <ProfileScreen
            language={language}
            t={t}
            setLanguage={setLanguage}
            profile={profileState.profile}
            freeCredits={profileState.freeCredits}
            historyEmptyMessage={profileState.historyEmptyMessage}
            savedHistory={profileState.savedHistory}
            onDeleteHistoryItem={mockUserState.deleteSavedResult}
            onResetDemoCredits={mockUserState.resetDemoCredits}
            onLogoutDemoSession={onLogoutDemoSession}
          />
        )}

        {activeScreen === 'detail' && (
          <StyleDetailScreen
            language={language}
            t={t}
            item={detailItem}
            onBack={closeDetail}
            onTryLook={openTryAiWithStyle}
          />
        )}

        {activeScreen === 'custom-lab' && (
          <CustomHairLabScreen language={language} t={t} onBack={closeCustomLab} />
        )}
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [language, setLanguage] = useState('id');
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [demoSession, setDemoSession] = useState(null);
  const [languageHydrated, setLanguageHydrated] = useState(false);

  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateLanguagePreference() {
      try {
        const persistedLanguage = await loadPersistedLanguagePreference();

        if (!isCancelled && persistedLanguage) {
          setLanguage(persistedLanguage);
          setHasSelectedLanguage(true);
        }
      } finally {
        if (!isCancelled) {
          setLanguageHydrated(true);
        }
      }
    }

    hydrateLanguagePreference();

    return () => {
      isCancelled = true;
    };
  }, []);

  function updateLanguage(nextLanguage, { markSelected = true } = {}) {
    const normalizedLanguage = nextLanguage === 'en' ? 'en' : 'id';
    setLanguage(normalizedLanguage);

    if (markSelected) {
      setHasSelectedLanguage(true);
    }

    void savePersistedLanguagePreference(normalizedLanguage);
  }

  function handleSelectLanguage(nextLanguage) {
    updateLanguage(nextLanguage, { markSelected: true });
  }

  function handleDemoLogin(sessionInput) {
    const email = String(sessionInput?.email || '').trim().toLowerCase();

    if (!email) {
      return;
    }

    setDemoSession({
      email,
      mode: sessionInput?.mode === 'signup' ? 'signup' : 'login',
      isDemo: true,
      loggedInAt: new Date().toISOString(),
    });
  }

  function handleDemoLogout() {
    setDemoSession(null);
  }

  if (!languageHydrated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.appFrame}>
          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>Potongin AI</Text>
              <Text style={styles.brandSubcopy}>{t('app.brandSubtitle')}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {!hasSelectedLanguage ? (
        <View style={styles.appFrame}>
          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>Potongin AI</Text>
              <Text style={styles.brandSubcopy}>{t('app.brandSubtitle')}</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <LanguageOnboardingScreen
              t={t}
              onSelectLanguage={handleSelectLanguage}
            />
          </ScrollView>
        </View>
      ) : !demoSession ? (
        <View style={styles.appFrame}>
          <View style={styles.topBar}>
            <View style={styles.brandBlock}>
              <Text style={styles.brand}>Potongin AI</Text>
              <Text style={styles.brandSubcopy}>{t('app.brandSubtitle')}</Text>
            </View>
            <View style={styles.topBarActions}>
              <LanguageToggle language={language} setLanguage={updateLanguage} t={t} />
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <DemoAuthScreen language={language} t={t} onLogin={handleDemoLogin} />
          </ScrollView>
        </View>
      ) : (
        <AuthenticatedDemoShell
          key={demoSession.email}
          language={language}
          setLanguage={updateLanguage}
          t={t}
          demoSession={demoSession}
          onLogoutDemoSession={handleDemoLogout}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4efe6',
  },
  appFrame: {
    flex: 1,
    backgroundColor: '#f4efe6',
  },
  topBar: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#f8f3eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e4d9c8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  brandBlock: {
    flexShrink: 1,
    minWidth: 220,
    maxWidth: '100%',
  },
  topBarActions: {
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '100%',
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1b4332',
  },
  brandSubcopy: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5f6f65',
    marginTop: 4,
    maxWidth: 520,
  },
  creditPill: {
    backgroundColor: '#14342b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  creditPillLabel: {
    color: '#f8f3eb',
    fontSize: 13,
    fontWeight: '700',
  },
  languageToggleWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6f5a47',
  },
  languageToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  languageButton: {
    minWidth: 42,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ede2d3',
    borderWidth: 1,
    borderColor: '#ddcfba',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: '#14342b',
    borderColor: '#14342b',
  },
  languageButtonLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4c6057',
  },
  languageButtonLabelActive: {
    color: '#fffaf3',
  },
  navRail: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6d9c7',
    backgroundColor: '#fbf7f0',
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f1e8da',
  },
  navButtonActive: {
    backgroundColor: '#1b4332',
  },
  navButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#42594f',
  },
  navButtonLabelActive: {
    color: '#fffaf3',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 20,
  },
});
