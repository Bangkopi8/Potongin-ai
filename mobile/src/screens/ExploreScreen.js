import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  ErrorState,
  FilterTabs,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  DiscoveryCard,
} from '../components/index.js';

export function ExploreScreen({
  language = 'en',
  t = (key) => key,
  status,
  items,
  error,
  filters,
  activeFilter,
  onSelectFilter,
  onRefresh,
  onTryStyle,
  onViewDetail,
  onOpenCustomLab,
}) {
  const filterItems = Array.isArray(items) ? items : [];
  const availableFilters = Array.isArray(filters) ? filters : [];
  const filterLabelMap = {
    All: t('common.all'),
    Men: t('common.men'),
    Women: t('common.women'),
    Unisex: t('common.unisex'),
  };
  const cardLabels = {
    language,
    tryLook: t('tryAi.recommendationCard.tryLook'),
    tryColor: t('tryAi.recommendationCard.tryColor'),
    readTip: t('common.viewDetail'),
    categoryFallback: t('tryAi.recommendationCard.categoryFallback'),
    titleFallback: t('tryAi.recommendationCard.titleFallback'),
    colorVisualFallback: t('tryAi.recommendationCard.colorVisualFallback'),
    styleVisualFallback: t('styleDetail.visualPreview'),
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
      eyebrow={t('explore.eyebrow')}
      title={t('explore.title')}
      subtitle={t('explore.subtitle')}
    >
      <Card accent="sky">
        <View style={styles.inlineHeader}>
          <Text style={styles.cardTitle}>{t('explore.filtersTitle')}</Text>
          <PrimaryButton
            label={t('common.refresh')}
            onPress={onRefresh}
            disabled={status === 'loading'}
            variant="secondary"
          />
        </View>
        <FilterTabs
          filters={availableFilters}
          activeFilter={activeFilter}
          onSelectFilter={onSelectFilter}
          labelMap={filterLabelMap}
        />
      </Card>

      <Card accent="amber">
        <Text style={styles.cardTitle}>{t('explore.customTitle')}</Text>
        <Text style={styles.bodyText}>
          {t('explore.customBody')}
        </Text>
        <PrimaryButton label={t('explore.customButton')} onPress={onOpenCustomLab} variant="secondary" />
      </Card>

      {status === 'loading' && <LoadingState message={t('explore.loading')} />}
      {status === 'error' && (
        <ErrorState title={t('explore.errorTitle')} message={t('explore.errorMessage', {}, error)} />
      )}
      {status === 'success' && filterItems.length === 0 && (
        <EmptyState
          title={t('explore.emptyTitle')}
          message={t('explore.emptyMessage')}
        />
      )}

      {status === 'success' ? (
        <View style={styles.resultsBlock}>
          <View style={styles.resultsHeader}>
            <Text style={styles.cardTitle}>{filterLabelMap[activeFilter] || activeFilter}</Text>
            <Text style={styles.resultCount}>{t('common.results', { count: filterItems.length })}</Text>
          </View>
          {filterItems.map((item) => (
            <DiscoveryCard
              key={item.id}
              item={item}
              onViewDetail={onViewDetail}
              onTryLook={onTryStyle}
              detailLabel={t('common.viewDetail')}
              labels={cardLabels}
            />
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  inlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
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
  resultsBlock: {
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    flexWrap: 'wrap',
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7a6652',
  },
});
