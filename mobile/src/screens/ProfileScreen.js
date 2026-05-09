import { Image, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../components/index.js';

function getHistoryPreviewUri(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const candidateValues = [
    item.previewUrl,
    item.previewBase64,
    item.imageUrl,
    item.preview?.imageUrl,
    item.preview?.previewUrl,
  ];

  for (const candidate of candidateValues) {
    if (typeof candidate !== 'string') {
      continue;
    }

    const normalized = candidate.trim();

    if (!normalized || normalized === 'inline-preview-available') {
      continue;
    }

    if (/^data:image/i.test(normalized)) {
      return normalized;
    }

    if (/^https?:\/\//i.test(normalized)) {
      return normalized;
    }
  }

  return null;
}

export function ProfileScreen({
  language = 'en',
  t = (key) => key,
  setLanguage,
  profile,
  freeCredits,
  historyEmptyMessage,
  savedHistory,
  onDeleteHistoryItem,
  onResetDemoCredits,
  onLogoutDemoSession,
}) {
  const isDemoAccount = Boolean(profile?.demo);

  return (
    <ScreenContainer
      eyebrow={t('profile.eyebrow')}
      title={t('profile.title')}
      subtitle={t('profile.subtitle')}
    >
      <Card>
        <Text style={styles.cardTitle}>{t('profile.overviewTitle')}</Text>
        <Text style={styles.bodyText}>{t('profile.nameLabel')}: {profile.name}</Text>
        {profile?.email ? (
          <Text style={styles.bodyText}>{t('profile.emailLabel')}: {profile.email}</Text>
        ) : null}
        <Text style={styles.bodyText}>
          {t('profile.statusLabel')}: {isDemoAccount ? t('profile.demoAccount') : profile.plan || profile.role || (language === 'id' ? 'demo' : 'demo')}
        </Text>
        <Text style={styles.bodyText}>{t('profile.creditsLabel')}: {freeCredits}</Text>
        <Text style={styles.metaText}>{t('profile.infoLine')}</Text>
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>{t('profile.languageTitle')}</Text>
          <Text style={styles.metaText}>{t('profile.languageBody')}</Text>
          <View style={styles.actionStack}>
            <PrimaryButton
              label={t('languageOnboarding.indonesianButton')}
              onPress={() => setLanguage?.('id')}
              variant={language === 'id' ? 'primary' : 'secondary'}
            />
            <PrimaryButton
              label={t('languageOnboarding.englishButton')}
              onPress={() => setLanguage?.('en')}
              variant={language === 'en' ? 'primary' : 'secondary'}
            />
          </View>
        </View>
        {isDemoAccount ? (
          <View style={styles.actionStack}>
            {typeof onResetDemoCredits === 'function' ? (
              <PrimaryButton
                label={t('profile.resetCreditsButton')}
                onPress={onResetDemoCredits}
                variant="secondary"
              />
            ) : null}
            {typeof onLogoutDemoSession === 'function' ? (
              <PrimaryButton
                label={t('profile.logoutButton')}
                onPress={onLogoutDemoSession}
                variant="secondary"
              />
            ) : null}
          </View>
        ) : null}
      </Card>

      <Card accent="amber">
        <Text style={styles.cardTitle}>{t('profile.historyTitle')}</Text>
        {savedHistory.length === 0 ? (
          <EmptyState
            title={t('profile.emptyTitle')}
            message={t('profile.emptyMessage', {}, historyEmptyMessage)}
          />
        ) : (
          savedHistory.map((item) => {
            const previewUri = getHistoryPreviewUri(item);

            return (
              <View key={item.id} style={styles.historyItem}>
                <Text style={styles.historyTitle}>{item.title}</Text>
                {previewUri ? (
                  <Image source={{ uri: previewUri }} style={styles.historyThumbnail} />
                ) : (
                  <Text style={styles.previewFallback}>{t('profile.previewUnavailable')}</Text>
                )}
                <Text style={styles.bodyText}>{item.subtitle}</Text>
                <Text style={styles.metaText}>{t('profile.savedAtLabel')}: {item.savedAt}</Text>
                <Text style={styles.metaText}>{t('profile.previewCountLabel')}: {item.previewCount}</Text>
                <PrimaryButton
                  label={t('profile.deleteButton')}
                  onPress={() => onDeleteHistoryItem(item.id)}
                  variant="secondary"
                />
              </View>
            );
          })
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102a22',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7a6652',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14342b',
  },
  historyItem: {
    backgroundColor: '#f8f3eb',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#eadac3',
  },
  actionStack: {
    gap: 10,
    marginTop: 4,
  },
  languageSection: {
    gap: 8,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102a22',
  },
  historyThumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#eadac3',
  },
  previewFallback: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7a6652',
    fontStyle: 'italic',
  },
});
