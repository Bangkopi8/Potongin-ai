import { Image, StyleSheet, Text, View } from 'react-native';

import { BadgePill } from './BadgePill.js';
import { Card } from './Card.js';
import { PrimaryButton } from './PrimaryButton.js';
import { usePexelsPhoto } from '../services/pexelsService.js';
import { localizeCustomerText, localizeMetadataValue } from '../utils/localizeCustomerCopy.js';

function getRiskTone(riskLevel) {
  if (riskLevel === 'high') {
    return 'rose';
  }
  if (riskLevel === 'medium') {
    return 'amber';
  }
  return 'mint';
}

function getMaintenanceTone(maintenance) {
  if (maintenance === 'high') {
    return 'rose';
  }
  if (maintenance === 'medium') {
    return 'amber';
  }
  return 'mint';
}

function getMaintenanceValue(item) {
  return item?.maintenanceLevel || item?.maintenance || 'medium';
}

function getAccent(item) {
  if (item.kind === 'color') {
    return 'sky';
  }
  if (item.isTrending) {
    return 'rose';
  }
  return 'default';
}

function formatRegionTrendBadge(label, fallback = 'Trend', language = 'en') {
  if (!label || typeof label !== 'string') {
    return fallback;
  }

  return localizeCustomerText(label.split(' ').slice(0, 3).join(' '), language);
}

function formatLabel(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getPrimaryCategory(item, fallback, language = 'en') {
  if (Array.isArray(item?.categories) && item.categories.length > 0) {
    return localizeMetadataValue(item.categories[0], language, fallback);
  }

  return localizeMetadataValue(item?.category, language, fallback);
}

function getVisualPalette(item) {
  const category = String(item?.categories?.[0] || item?.category || '').toLowerCase();

  if (category.includes('korean') || category.includes('soft')) {
    return {
      background: '#efe8f6',
      border: '#d8cdea',
      eyebrow: '#7556a8',
      accent: '#5b4682',
    };
  }

  if (category.includes('fade') || category.includes('crop') || category.includes('buzz')) {
    return {
      background: '#e5efe8',
      border: '#c8dbc8',
      eyebrow: '#466f57',
      accent: '#234233',
    };
  }

  if (category.includes('bob') || category.includes('layered') || category.includes('lob')) {
    return {
      background: '#f4e9df',
      border: '#e1d0c1',
      eyebrow: '#8a5d3d',
      accent: '#5f4331',
    };
  }

  if (category.includes('wolf') || category.includes('shag') || category.includes('editorial')) {
    return {
      background: '#f4e5e8',
      border: '#e5cad1',
      eyebrow: '#9a4d66',
      accent: '#603444',
    };
  }

  return {
    background: '#f1eadf',
    border: '#dfd0bd',
    eyebrow: '#7a6652',
    accent: '#294037',
  };
}

function getMetadataValue(item, key, fallback) {
  const rawValue = item?.[key];

  if (typeof rawValue === 'string' && rawValue.trim().length > 0) {
    return rawValue.trim();
  }

  return fallback;
}

export function DiscoveryCard({
  item,
  onViewDetail,
  onTryLook,
  detailLabel = 'View Detail',
  tryLabel,
  labels = {},
}) {
  if (!item) {
    return null;
  }

  const pexelsPhotoUrl = usePexelsPhoto(item.kind === 'style' ? item.name : null);
  const visualPalette = getVisualPalette(item);
  const language = labels.language || 'en';
  const primaryCategory = getPrimaryCategory(item, labels.categoryFallback || 'Curated', language);
  const localizedGenderFit =
    item?.genderFit === 'men'
      ? labels.genderMen || 'Men'
      : item?.genderFit === 'women'
        ? labels.genderWomen || 'Women'
        : labels.genderUnisex || 'Unisex';
  const localizedLength =
    item?.length === 'short'
      ? labels.lengthShort || 'Short'
      : item?.length === 'long'
        ? labels.lengthLong || 'Long'
        : labels.lengthMedium || 'Medium';
  const localizedMaintenance =
    item?.maintenance === 'high' || item?.maintenanceLevel === 'high'
      ? labels.maintenanceHigh || 'High'
      : item?.maintenance === 'low' || item?.maintenanceLevel === 'low'
        ? labels.maintenanceLow || 'Low'
        : labels.maintenanceMedium || 'Medium';
  const localizedRisk =
    item?.riskLevel === 'high'
      ? labels.riskHigh || 'Bold'
      : item?.riskLevel === 'low'
        ? labels.riskLow || 'Low'
        : labels.riskMedium || 'Balanced';
  const actionLabel =
    tryLabel ||
    (item.kind === 'color'
      ? labels.tryColor || 'Try This Color'
      : item.kind === 'tip'
        ? labels.readTip || 'Read Tip'
        : labels.tryLook || 'Try This Look');

  const localizedDescription = localizeCustomerText(
    item.shortDescription ||
      item.subtitle ||
      item.description ||
      labels.descriptionFallback ||
      'Curated discovery item.',
    language
  );
  const localizedTitle =
    item.kind === 'tip'
      ? localizeCustomerText(
          item.title || item.name || labels.titleFallback || 'Discovery Pick',
          language
        )
      : item.title || item.name || labels.titleFallback || 'Discovery Pick';
  const localizedRegion = localizeMetadataValue(
    item.popularityRegion || labels.regionFallback || 'Global',
    language,
    labels.regionFallback || 'Global'
  );
  const localizedVibes =
    Array.isArray(item.vibeTags) && item.vibeTags.length
      ? item.vibeTags.slice(0, 3).map((value) => localizeMetadataValue(value, language, value)).join(', ')
      : labels.vibeFallback || 'Versatile style';

  return (
    <Card accent={getAccent(item)} style={styles.card}>
      {item.kind === 'color' ? (
        <View style={[styles.visualBlock, { backgroundColor: item.colorHex || '#d8c0a5' }]}>
          <Text style={styles.visualText}>
            {item.colorFamily || labels.colorVisualFallback || 'Color idea'}
          </Text>
        </View>
      ) : item.kind === 'tip' ? (
        <View
          style={[
            styles.visualBlock,
            styles.visualCard,
            {
              backgroundColor: visualPalette.background,
              borderColor: visualPalette.border,
            },
          ]}
        >
          <Text style={[styles.visualEyebrow, { color: visualPalette.eyebrow }]}>
            {labels.tipVisualFallback || 'Barber tip'}
          </Text>
          <Text style={[styles.visualHeroTitle, { color: visualPalette.accent }]}>
            {localizeMetadataValue(
              getMetadataValue(item, 'focus', labels.tipVisualFallback || 'Barber tip'),
              language,
              labels.tipVisualFallback || 'Barber tip'
            )}
          </Text>
          <Text style={styles.visualSupportingText}>
            {labels.previewComingSoon || 'Visual preview coming soon'}
          </Text>
        </View>
      ) : pexelsPhotoUrl ? (
        <View style={styles.photoVisualBlock}>
          <Image source={{ uri: pexelsPhotoUrl }} style={styles.photoFill} resizeMode="cover" />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoEyebrow}>
              {labels.visualPreview || labels.styleVisualFallback || 'Style preview'}
            </Text>
            <Text style={styles.photoTitle}>{primaryCategory}</Text>
            <View style={styles.photoChipRow}>
              <View style={styles.photoChip}>
                <Text style={styles.photoChipText}>{localizedGenderFit}</Text>
              </View>
              <View style={styles.photoChip}>
                <Text style={styles.photoChipText}>{localizedLength}</Text>
              </View>
              <View style={styles.photoChip}>
                <Text style={styles.photoChipText}>{localizedMaintenance}</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.visualBlock,
            styles.visualCard,
            {
              backgroundColor: visualPalette.background,
              borderColor: visualPalette.border,
            },
          ]}
        >
          <Text style={[styles.visualEyebrow, { color: visualPalette.eyebrow }]}>
            {labels.visualPreview || labels.styleVisualFallback || 'Style preview'}
          </Text>
          <Text style={[styles.visualHeroTitle, { color: visualPalette.accent }]}>
            {primaryCategory}
          </Text>
          <View style={styles.visualChipRow}>
            <View style={styles.visualChip}>
              <Text style={styles.visualChipText}>{localizedLength}</Text>
            </View>
            <View style={styles.visualChip}>
              <Text style={styles.visualChipText}>{localizedGenderFit}</Text>
            </View>
            <View style={styles.visualChip}>
              <Text style={styles.visualChipText}>{localizedMaintenance}</Text>
            </View>
          </View>
          <Text style={styles.visualSupportingText}>
            {labels.previewComingSoon || 'Visual preview coming soon'}
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>
          {localizedTitle}
        </Text>
        <Text style={styles.category}>{primaryCategory}</Text>
        {item.kind === 'style' ? (
          <Text style={styles.metaLine}>
            {localizeCustomerText(item.detailMetaLine || `${localizedGenderFit} / ${localizedLength}`, language)}
          </Text>
        ) : null}
      </View>

      <View style={styles.badgeRow}>
        {item.kind === 'tip' ? (
          <>
            <BadgePill
              tone="amber"
              label={item.focus || item.category || labels.tipVisualFallback || 'Tip'}
            />
            <BadgePill
              tone="sky"
              label={formatRegionTrendBadge(
                item.regionTrend,
                labels.regionTrendFallback || 'Trend',
                language
              )}
            />
          </>
        ) : (
          <>
            <BadgePill
              tone={getMaintenanceTone(getMaintenanceValue(item))}
              label={(labels.maintenanceLabel || 'Maint: {value}').replace(
                '{value}',
                localizedMaintenance
              )}
            />
            <BadgePill
              tone={getRiskTone(item.riskLevel)}
              label={(labels.changeLevelLabel || 'Change: {value}').replace(
                '{value}',
                localizedRisk
              )}
            />
            <BadgePill
              tone="sky"
              label={formatRegionTrendBadge(
                item.popularityRegion || item.regionTrend,
                labels.regionTrendFallback || 'Trend',
                language
              )}
            />
          </>
        )}
      </View>

      <Text style={styles.description} numberOfLines={4}>
        {localizedDescription}
      </Text>

      {item.kind === 'style' ? (
        <View style={styles.detailBlock}>
          <Text style={styles.detailText}>
            {labels.regionLabel || 'Region'}: {localizedRegion}
          </Text>
          <Text style={styles.detailText}>
            {labels.vibeLabel || 'Vibe'}:{' '}
            {localizedVibes}
          </Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <PrimaryButton
          label={detailLabel}
          onPress={() => onViewDetail?.(item)}
          variant="secondary"
        />
        {item.kind !== 'tip' ? (
          <PrimaryButton label={actionLabel} onPress={() => onTryLook?.(item)} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  photoVisualBlock: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#d0cac3',
  },
  photoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 44,
    backgroundColor: 'rgba(8, 24, 16, 0.6)',
    gap: 6,
  },
  photoEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
  },
  photoTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 26,
  },
  photoChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  photoChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  photoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  visualBlock: {
    minHeight: 110,
    borderRadius: 18,
    backgroundColor: '#eadac3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  visualCard: {
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  visualText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#294037',
    textAlign: 'center',
  },
  visualEyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  visualHeroTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  visualChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visualChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,250,243,0.9)',
    borderWidth: 1,
    borderColor: '#e6d9c7',
  },
  visualChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#43594f',
  },
  visualSupportingText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5f6f65',
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    color: '#102a22',
  },
  category: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7a6652',
    fontWeight: '700',
  },
  metaLine: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5f6f65',
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#46594f',
  },
  detailBlock: {
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5f6f65',
  },
  buttonRow: {
    gap: 10,
  },
});
