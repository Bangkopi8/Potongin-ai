import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  DiscoveryCard,
  PrimaryButton,
  ScreenContainer,
} from '../components/index.js';

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
    descriptionFallback:
      t('common.curatedDescription'),
  };

  return (
    <ScreenContainer
      eyebrow={t('home.eyebrow')}
      title={t('home.title')}
      subtitle={t('home.subtitle')}
    >
      <Card accent="amber">
        <Text style={styles.kicker}>{t('home.creditsTitle')}</Text>
        <Text style={styles.heroValue}>{freeCredits}</Text>
        <Text style={styles.bodyText}>
          {t('home.creditsBody')}
        </Text>
        <PrimaryButton label={t('home.tryAiButton')} onPress={onTryAi} />
      </Card>

      <Card accent="sky">
        <Text style={styles.cardTitle}>{t('home.customTitle')}</Text>
        <Text style={styles.bodyText}>
          {t('home.customBody')}
        </Text>
        <PrimaryButton label={t('home.customButton')} onPress={onOpenCustomLab} variant="secondary" />
      </Card>

      {sections.map((section) => (
        <View key={section.title} style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{getLocalizedHomeSectionTitle(section.title, t)}</Text>
            <Text style={styles.sectionCount}>
              {t('common.picks', { count: Array.isArray(section.items) ? section.items.length : 0 })}
            </Text>
          </View>

          {(Array.isArray(section.items) ? section.items : []).map((entry) => {
            const detailLabel =
              entry.item?.kind === 'tip' ? t('common.viewDetail') : t('common.viewDetail');
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
  const normalizedTitle = String(title || '').toLowerCase();

  if (normalizedTitle.includes('continue your look')) {
    return t('home.sections.continueYourLook');
  }

  if (normalizedTitle.includes('trending in indonesia')) {
    return t('home.sections.trendingIndonesia');
  }

  if (normalizedTitle.includes('trending globally')) {
    return t('home.sections.trendingGlobal');
  }

  if (normalizedTitle.includes('popular men')) {
    return t('home.sections.popularMens');
  }

  if (normalizedTitle.includes('popular women')) {
    return t('home.sections.popularWomens');
  }

  if (normalizedTitle.includes('hair color ideas')) {
    return t('home.sections.hairColors');
  }

  if (normalizedTitle.includes('low maintenance')) {
    return t('home.sections.lowMaintenance');
  }

  if (normalizedTitle.includes('professional looks')) {
    return t('home.sections.professional');
  }

  if (normalizedTitle.includes('bold transformations')) {
    return t('home.sections.bold');
  }

  if (normalizedTitle.includes('korean/japanese')) {
    return t('home.sections.koreanJapanese');
  }

  if (normalizedTitle.includes('barber tips')) {
    return t('home.sections.barberTips');
  }

  return title;
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#b45b31',
  },
  heroValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#102a22',
  },
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
  sectionBlock: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#102a22',
  },
  sectionCount: {
    fontSize: 13,
    color: '#7a6652',
    fontWeight: '700',
  },
});
