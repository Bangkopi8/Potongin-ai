import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  DiscoveryCard,
  PrimaryButton,
  ScreenContainer,
} from '../components/index.js';
import { colors, radius, shadow, spacing, type } from '../theme.js';

export function HomeScreen({
  language = 'en',
  t = (key) => key,
  freeCredits,
  homeSections,
  onTryAi,
  onOpenDetail,
  onTryInspiration,
  onOpenCustomLab,
}) {
  const sections = Array.isArray(homeSections) ? homeSections : [];
  const cardLabels = {
    language,
    tryLook: t('tryAi.recommendationCard.tryLook'),
    tryColor: t('tryAi.recommendationCard.tryColor'),
    readTip: t('common.viewDetail'),
    categoryFallback: t('tryAi.recommendationCard.categoryFallback'),
    titleFallback: t('tryAi.recommendationCard.titleFallback'),
    colorVisualFallback: t('tryAi.recommendationCard.colorVisualFallback'),
    styleVisualFallback: t('tryAi.recommendationCard.styleVisualFallback'),
    tipVisualFallback: t('tryAi.recommendationCard.tipVisualFallback'),
    visualPreview: t('common.previewVisual'),
    previewComingSoon: t('styleDetail.previewComingSoon'),
    styleReference: t('styleDetail.styleReference'),
    maintenanceLabel: t('common.maintenanceShort'),
    changeLevelLabel: `${t('common.changeLevel')}: {value}`,
    regionLabel: t('common.region'),
    regionFallback: t('common.global'),
    regionTrendFallback: t('common.trend'),
    vibeLabel: t('common.vibe'),
    vibeFallback: t('common.versatileStyle'),
    genderMen: t('common.men'),
    genderWomen: t('common.women'),
    genderUnisex: t('common.unisex'),
    lengthShort: t('common.shortLength'),
    lengthMedium: t('common.mediumLength'),
    lengthLong: t('common.longLength'),
    maintenanceLow: t('common.lowMaintenance'),
    maintenanceMedium: t('common.mediumMaintenance'),
    maintenanceHigh: t('common.highMaintenance'),
    riskLow: t('common.lowRisk'),
    riskMedium: t('common.mediumRisk'),
    riskHigh: t('common.highRisk'),
    descriptionFallback: t('common.curatedDescription'),
  };

  return (
    <ScreenContainer
      eyebrow={t('home.eyebrow')}
      title={t('home.title')}
      subtitle={t('home.subtitle')}
    >
      {/* Hero credit banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroKicker}>{t('home.creditsTitle')}</Text>
          <Text style={styles.heroCredits}>{freeCredits}</Text>
          <Text style={styles.heroSub}>{t('home.creditsBody')}</Text>
        </View>
        <View style={styles.heroRight}>
          <PrimaryButton label={t('home.tryAiButton')} onPress={onTryAi} />
        </View>
      </View>

      {/* Custom lab card */}
      <Card>
        <View style={styles.labRow}>
          <View style={styles.labText}>
            <Text style={styles.cardTitle}>{t('home.customTitle')}</Text>
            <Text style={styles.bodyText}>{t('home.customBody')}</Text>
          </View>
          <PrimaryButton
            label={t('home.customButton')}
            onPress={onOpenCustomLab}
            variant="secondary"
          />
        </View>
      </Card>

      {/* Editorial sections */}
      {sections.map((section) => (
        <View key={section.title} style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getLocalizedHomeSectionTitle(section.title, t)}
            </Text>
            <Text style={styles.sectionCount}>
              {t('common.picks', {
                count: Array.isArray(section.items) ? section.items.length : 0,
              })}
            </Text>
          </View>

          {(Array.isArray(section.items) ? section.items : []).map((entry) => {
            const detailLabel = t('common.viewDetail');
            const tryLabel =
              entry.item?.kind === 'color'
                ? t('tryAi.recommendationCard.tryColor')
                : entry.item?.kind === 'tip'
                  ? t('common.viewDetail')
                  : t('tryAi.recommendationCard.tryLook');

            return (
              <DiscoveryCard
                key={entry.id}
                item={entry.item}
                onViewDetail={onOpenDetail}
                onTryLook={onTryInspiration}
                detailLabel={detailLabel}
                tryLabel={tryLabel}
                labels={cardLabels}
              />
            );
          })}
        </View>
      ))}
    </ScreenContainer>
  );
}

function getLocalizedHomeSectionTitle(title, t) {
  const n = String(title || '').toLowerCase();
  if (n.includes('continue your look')) return t('home.sections.continueYourLook');
  if (n.includes('trending in indonesia')) return t('home.sections.trendingIndonesia');
  if (n.includes('trending globally')) return t('home.sections.trendingGlobal');
  if (n.includes('popular men')) return t('home.sections.popularMens');
  if (n.includes('popular women')) return t('home.sections.popularWomens');
  if (n.includes('hair color ideas')) return t('home.sections.hairColors');
  if (n.includes('low maintenance')) return t('home.sections.lowMaintenance');
  if (n.includes('professional looks')) return t('home.sections.professional');
  if (n.includes('bold transformations')) return t('home.sections.bold');
  if (n.includes('korean/japanese')) return t('home.sections.koreanJapanese');
  if (n.includes('barber tips')) return t('home.sections.barberTips');
  return title;
}

const styles = StyleSheet.create({
  heroBanner: {
    backgroundColor: colors.forest,
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    flexWrap: 'wrap',
    ...shadow.cardStrong,
  },
  heroLeft: {
    gap: spacing.xs,
    flex: 1,
    minWidth: 120,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
  },
  heroCredits: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 54,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.75)',
  },
  heroRight: {
    minWidth: 140,
  },
  cardTitle: {
    ...type.h3,
  },
  bodyText: {
    ...type.body,
  },
  labRow: {
    gap: spacing.md,
  },
  labText: {
    gap: spacing.xs,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
