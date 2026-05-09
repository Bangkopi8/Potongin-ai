import { Image, StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, PrimaryButton, ScreenContainer } from '../components/index.js';
import { colors, radius, shadow, spacing, type } from '../theme.js';

function getHistoryPreviewUri(item) {
  if (!item || typeof item !== 'object') return null;
  const candidates = [
    item.previewUrl,
    item.previewBase64,
    item.imageUrl,
    item.preview?.imageUrl,
    item.preview?.previewUrl,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string') continue;
    const n = c.trim();
    if (!n || n === 'inline-preview-available') continue;
    if (/^data:image/i.test(n) || /^https?:\/\//i.test(n)) return n;
  }
  return null;
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
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
  const initials = getInitials(profile?.name);

  return (
    <ScreenContainer
      eyebrow={t('profile.eyebrow')}
      title={t('profile.title')}
      subtitle={t('profile.subtitle')}
    >
      {/* Profile header card */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{initials || '?'}</Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.profileName}>{profile?.name || 'Demo User'}</Text>
          {profile?.email ? (
            <Text style={styles.profileEmail}>{profile.email}</Text>
          ) : null}
          <View style={styles.creditRow}>
            <View style={styles.creditBadge}>
              <Text style={styles.creditCount}>{freeCredits}</Text>
              <Text style={styles.creditLabel}>{t('profile.creditsLabel')}</Text>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>{profile?.plan || 'beta'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Language switcher */}
      <Card>
        <Text style={styles.sectionTitle}>{t('profile.languageTitle')}</Text>
        <Text style={styles.bodyText}>{t('profile.languageBody')}</Text>
        <View style={styles.langRow}>
          {[
            { code: 'id', label: t('languageOnboarding.indonesianButton') },
            { code: 'en', label: t('languageOnboarding.englishButton') },
          ].map(({ code, label }) => (
            <View key={code} style={styles.langOption}>
              <PrimaryButton
                label={label}
                onPress={() => setLanguage?.(code)}
                variant={language === code ? 'primary' : 'secondary'}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* Demo account actions */}
      {isDemoAccount ? (
        <Card>
          <Text style={styles.sectionTitle}>{t('profile.overviewTitle')}</Text>
          <Text style={styles.metaText}>{t('profile.infoLine')}</Text>
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
                variant="ghost"
              />
            ) : null}
          </View>
        </Card>
      ) : null}

      {/* History */}
      <View style={styles.historySection}>
        <Text style={styles.historyHeading}>{t('profile.historyTitle')}</Text>
        {savedHistory.length === 0 ? (
          <Card>
            <EmptyState
              title={t('profile.emptyTitle')}
              message={t('profile.emptyMessage', {}, historyEmptyMessage)}
            />
          </Card>
        ) : (
          <View style={styles.historyList}>
            {savedHistory.map((item) => {
              const previewUri = getHistoryPreviewUri(item);
              return (
                <View key={item.id} style={styles.historyCard}>
                  {previewUri ? (
                    <Image source={{ uri: previewUri }} style={styles.historyThumb} />
                  ) : (
                    <View style={styles.historyThumbPlaceholder} />
                  )}
                  <View style={styles.historyBody}>
                    <Text style={styles.historyTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.historySubtitle} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                    <Text style={styles.historyMeta}>
                      {t('profile.savedAtLabel')}: {item.savedAt}
                    </Text>
                    <PrimaryButton
                      label={t('profile.deleteButton')}
                      onPress={() => onDeleteHistoryItem(item.id)}
                      variant="ghost"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: colors.forest,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  creditCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  creditLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  planBadge: {
    backgroundColor: colors.bgMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textTertiary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bodyText: {
    ...type.body,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textTertiary,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langOption: {
    flex: 1,
  },
  actionStack: {
    gap: spacing.sm,
  },
  historySection: {
    gap: spacing.md,
  },
  historyHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  historyList: {
    gap: spacing.md,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  historyThumb: {
    width: 90,
    aspectRatio: 1,
    backgroundColor: colors.bgMuted,
  },
  historyThumbPlaceholder: {
    width: 90,
    backgroundColor: colors.bgMuted,
  },
  historyBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  historyMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
