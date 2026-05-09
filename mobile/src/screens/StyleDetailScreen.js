import { StyleSheet, Text, View } from 'react-native';

import { BadgePill, Card, PrimaryButton, ScreenContainer } from '../components/index.js';
import { getHaircutStyleById } from '../data/catalogHelpers.js';
import { haircutStyles } from '../data/haircutStyles.js';
import { localizeCustomerText, localizeMetadataValue } from '../utils/localizeCustomerCopy.js';

function formatList(value, fallback, language = 'en') {
  if (!Array.isArray(value) || value.length === 0) {
    return fallback;
  }

  return value
    .map((entry) =>
      typeof entry === 'string'
        ? localizeMetadataValue(entry, language, entry)
        : String(entry)
    )
    .join(', ');
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

function formatRiskLabel(riskLevel, t, language) {
  if (riskLevel === 'high') {
    return t('common.highRisk');
  }

  if (riskLevel === 'low') {
    return t('common.lowRisk');
  }

  return t('common.mediumRisk', {}, language === 'id' ? 'Sedang' : 'Balanced');
}

function formatMaintenanceLabel(value, t, language) {
  if (value === 'high') {
    return t('common.highMaintenance');
  }

  if (value === 'low') {
    return t('common.lowMaintenance');
  }

  return t('common.mediumMaintenance', {}, language === 'id' ? 'Sedang' : 'Medium');
}

function formatLengthLabel(value, t, language) {
  if (value === 'short') {
    return t('common.shortLength');
  }

  if (value === 'long') {
    return t('common.longLength');
  }

  return t('common.mediumLength', {}, language === 'id' ? 'Sedang' : 'Medium');
}

function formatGenderFitLabel(value, t) {
  if (value === 'men') {
    return t('common.men');
  }

  if (value === 'women') {
    return t('common.women');
  }

  return t('common.unisex');
}

function getVisualPalette(item) {
  const category = String(item?.categories?.[0] || item?.category || '').toLowerCase();

  if (category.includes('korean') || category.includes('soft')) {
    return {
      background: '#efe8f6',
      border: '#d8cdea',
      eyebrow: '#7556a8',
      accent: '#563d80',
    };
  }

  if (category.includes('fade') || category.includes('crop') || category.includes('buzz')) {
    return {
      background: '#e5efe8',
      border: '#c8dbc8',
      eyebrow: '#48715a',
      accent: '#223f32',
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

function isStyleReference(item) {
  return item?.kind === 'style' && typeof item?.styleId === 'string';
}

function resolveStyleItem(item) {
  if (!item) {
    return null;
  }

  if (isStyleReference(item)) {
    return getHaircutStyleById(haircutStyles, item.styleId);
  }

  if (item?.kind === 'style' || item?.styleType === 'haircut' || item?.genderFit || item?.genderTarget) {
    const resolvedStyle = getHaircutStyleById(haircutStyles, item?.styleId || item?.id);

    if (resolvedStyle) {
      return {
        ...item,
        ...resolvedStyle,
      };
    }
  }

  return item;
}

function getStyleFieldList(item, primaryField, fallbackField) {
  if (Array.isArray(item?.[primaryField]) && item[primaryField].length > 0) {
    return item[primaryField];
  }

  if (Array.isArray(item?.[fallbackField]) && item[fallbackField].length > 0) {
    return item[fallbackField];
  }

  return [];
}

function ColorVisual({ item }) {
  return (
    <View style={[styles.visualBlock, { backgroundColor: item.colorHex || '#d7b998' }]}>
      <Text style={styles.visualTitle}>{item.title}</Text>
      <Text style={styles.visualSubtitle}>{item.colorFamily}</Text>
    </View>
  );
}

function StyleVisual({ item, language = 'en', t = (key) => key }) {
  const palette = getVisualPalette(item);
  const primaryCategory = getPrimaryCategory(item, t('styleDetail.placeholders.curated'), language);
  const localizedLength = formatLengthLabel(item?.length, t, language);
  const localizedGenderFit = formatGenderFitLabel(item?.genderFit || item?.genderTarget, t);
  const localizedMaintenance = formatMaintenanceLabel(
    item?.maintenanceLevel || item?.maintenance || 'medium',
    t,
    language
  );

  return (
    <View
      style={[
        styles.visualBlock,
        styles.styleVisualBlock,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
      ]}
    >
      <Text style={[styles.visualEyebrow, { color: palette.eyebrow }]}>
        {t('styleDetail.styleReference')}
      </Text>
      <Text style={[styles.visualTitle, { color: palette.accent }]}>
        {item.name || item.title || t('styleDetail.eyebrow')}
      </Text>
      <Text style={styles.visualSubtitle}>{primaryCategory}</Text>
      <View style={styles.visualChipRow}>
        <BadgePill tone="amber" label={localizedLength} />
        <BadgePill tone="mint" label={localizedGenderFit} />
        <BadgePill tone="sky" label={localizedMaintenance} />
      </View>
      <Text style={styles.visualHelper}>
        {item.previewLabel || t('styleDetail.previewComingSoon')}
      </Text>
    </View>
  );
}

function TipVisual({ item, title }) {
  return (
    <View style={styles.visualBlock}>
      <Text style={styles.visualTitle}>{title}</Text>
      <Text style={styles.visualSubtitle}>{item.focus}</Text>
    </View>
  );
}

export function StyleDetailScreen({ language = 'en', t = (key) => key, item, onBack, onTryLook }) {
  if (!item) {
    return null;
  }

  const resolvedItem = resolveStyleItem(item);
  const isColor = resolvedItem?.kind === 'color';
  const isTip = resolvedItem?.kind === 'tip';
  const isStyle = !isColor && !isTip;

  if (!resolvedItem) {
    return (
      <ScreenContainer
        eyebrow={t('styleDetail.eyebrow')}
        title={t('styleDetail.missingTitle')}
        subtitle={t('styleDetail.missingSubtitle')}
      >
        <Card accent="amber">
          <Text style={styles.bodyText}>
            {t('styleDetail.missingBody')}
          </Text>
          <PrimaryButton label={t('common.back')} onPress={onBack} variant="secondary" />
        </Card>
      </ScreenContainer>
    );
  }

  const safeCategories = getStyleFieldList(resolvedItem, 'categories', 'category');
  const safeFaceShapes = getStyleFieldList(resolvedItem, 'faceShapesFit', 'faceShapeFit');
  const safeHairTypes = getStyleFieldList(resolvedItem, 'hairTypesFit', 'hairTypeFit');
  const safeVibeTags = getStyleFieldList(resolvedItem, 'vibeTags', 'tags');
  const safeSuitableFor = getStyleFieldList(resolvedItem, 'suitableFor');
  const safeAvoidIf = getStyleFieldList(resolvedItem, 'avoidIf');
  const resolvedMaintenance = resolvedItem.maintenanceLevel || resolvedItem.maintenance || 'medium';
  const resolvedRegion = localizeMetadataValue(
    resolvedItem.popularityRegion || resolvedItem.regionTrend || 'Global',
    language,
    t('common.global')
  );
  const resolvedTrendScore = Number.isFinite(resolvedItem.trendScore) ? resolvedItem.trendScore : null;
  const resolvedTitle =
    isTip
      ? localizeCustomerText(resolvedItem.name || resolvedItem.title || t('styleDetail.tipEyebrow'), language)
      : resolvedItem.name || resolvedItem.title || t('styleDetail.eyebrow');
  const resolvedSubtitle = localizeCustomerText(
    resolvedItem.subtitle ||
      resolvedItem.description ||
      t('styleDetail.placeholders.description'),
    language
  );
  const localizedGenderFit = formatGenderFitLabel(
    resolvedItem.genderFit || resolvedItem.genderTarget,
    t
  );
  const localizedLength = formatLengthLabel(resolvedItem.length, t, language);
  const localizedMaintenance = formatMaintenanceLabel(resolvedMaintenance, t, language);
  const changeLevelLabel = formatRiskLabel(resolvedItem.riskLevel, t, language);
  const primaryCategory = getPrimaryCategory(resolvedItem, t('styleDetail.placeholders.curated'), language);

  return (
    <ScreenContainer
      eyebrow={isColor ? t('styleDetail.colorEyebrow') : isTip ? t('styleDetail.tipEyebrow') : t('styleDetail.eyebrow')}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
    >
      <Card accent={isColor ? 'sky' : isTip ? 'amber' : 'rose'}>
        {isColor ? (
          <ColorVisual item={resolvedItem} />
        ) : isTip ? (
          <TipVisual item={resolvedItem} title={t('styleDetail.tipEyebrow')} />
        ) : (
          <StyleVisual
            item={{ ...resolvedItem, previewLabel: t('styleDetail.previewComingSoon') }}
            language={language}
            t={t}
          />
        )}

        <View style={styles.badgeRow}>
          <BadgePill tone="amber" label={primaryCategory} />
          <BadgePill tone="mint" label={`${t('styleDetail.maintenance')}: ${localizedMaintenance}`} />
          {!isTip ? <BadgePill tone="rose" label={changeLevelLabel} /> : null}
          <BadgePill tone="sky" label={resolvedRegion} />
        </View>

        {isColor ? (
          <>
            <Text style={styles.bodyText}>
              {localizeCustomerText(
                resolvedItem.description || resolvedItem.subtitle || t('styleDetail.placeholders.colorDescription'),
                language
              )}
            </Text>
            <Text style={styles.metaLine}>{t('styleDetail.colorTone')}: {resolvedItem.tone || changeLevelLabel}</Text>
            <Text style={styles.metaLine}>
              {t('styleDetail.skinToneFit')}: {formatList(resolvedItem.skinToneFit, t('styleDetail.placeholders.skinTone'), language)}
            </Text>
            <Text style={styles.metaLine}>{t('styleDetail.maintenance')}: {resolvedItem.maintenance || t('styleDetail.placeholders.colorMaintenance')}</Text>
            <PrimaryButton label={t('styleDetail.colorTry')} onPress={() => onTryLook?.(resolvedItem)} />
          </>
        ) : isTip ? (
          <>
            <Text style={styles.bodyText}>
              {localizeCustomerText(
                resolvedItem.subtitle || resolvedItem.description || t('styleDetail.placeholders.tipDescription'),
                language
              )}
            </Text>
            <Text style={styles.metaLine}>
              {t('styleDetail.focus')}: {localizeMetadataValue(resolvedItem.focus || t('styleDetail.placeholders.focus'), language, t('styleDetail.placeholders.focus'))}
            </Text>
            <PrimaryButton label={t('styleDetail.tipBack')} onPress={onBack} variant="secondary" />
          </>
        ) : isStyle ? (
          <>
            <Text style={styles.bodyText}>
              {localizeCustomerText(
                resolvedItem.description || resolvedItem.subtitle || t('styleDetail.placeholders.description'),
                language
              )}
            </Text>
            <Text style={styles.metaLine}>{t('styleDetail.genderFit')}: {localizedGenderFit}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.length')}: {localizedLength}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.categories')}: {formatList(safeCategories, t('styleDetail.placeholders.curated'), language)}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.faceShape')}: {formatList(safeFaceShapes, t('styleDetail.placeholders.suitableFor'), language)}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.hairType')}: {formatList(safeHairTypes, t('styleDetail.placeholders.suitableFor'), language)}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.vibe')}: {formatList(safeVibeTags, t('styleDetail.placeholders.curated'), language)}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.maintenance')}: {localizedMaintenance}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.boldness')}: {changeLevelLabel}</Text>
            <Text style={styles.metaLine}>{t('styleDetail.region')}: {resolvedRegion}</Text>
            <Text style={styles.metaLine}>
              {t('styleDetail.trendLabel')}: {resolvedTrendScore ?? t('styleDetail.placeholders.trend')}
            </Text>
            <Text style={styles.metaLine}>
              {t('styleDetail.suitableFor')}: {formatList(safeSuitableFor, t('styleDetail.placeholders.suitableFor'), language)}
            </Text>
            <Text style={styles.metaLine}>
              {t('styleDetail.avoidIf')}: {formatList(safeAvoidIf, t('styleDetail.placeholders.avoidIf'), language)}
            </Text>
            <Text style={styles.instructionTitle}>{t('styleDetail.stylingNotes')}</Text>
            <Text style={styles.bodyText}>
              {localizeCustomerText(
                resolvedItem.stylingNotes || t('styleDetail.placeholders.stylingNotes'),
                language
              )}
            </Text>
            <Text style={styles.instructionTitle}>{t('styleDetail.barberInstruction')}</Text>
            <Text style={styles.bodyText}>
              {localizeCustomerText(
                resolvedItem.barberInstruction || t('styleDetail.placeholders.barberInstruction'),
                language
              )}
            </Text>
            <PrimaryButton label={t('styleDetail.styleTry')} onPress={() => onTryLook?.(resolvedItem)} />
          </>
        ) : null}

        <PrimaryButton label={t('common.back')} onPress={onBack} variant="secondary" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  visualBlock: {
    minHeight: 180,
    borderRadius: 24,
    backgroundColor: '#eadac3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 6,
  },
  styleVisualBlock: {
    borderWidth: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  visualEyebrow: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  visualTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    color: '#102a22',
  },
  visualSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5d6f65',
  },
  visualChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visualHelper: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5d6f65',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
  },
  metaLine: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5b6d62',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102a22',
  },
});
