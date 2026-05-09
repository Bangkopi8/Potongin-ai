import { StyleSheet, Text, View } from 'react-native';

import { BadgePill, Card, PrimaryButton, ScreenContainer } from '../components/index.js';
import { getHaircutStyleById } from '../data/catalogHelpers.js';
import { haircutStyles } from '../data/haircutStyles.js';
import { colors, radius, spacing, type } from '../theme.js';
import { localizeCustomerText, localizeMetadataValue } from '../utils/localizeCustomerCopy.js';

function formatList(value, fallback, language = 'en') {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value
    .map((e) => (typeof e === 'string' ? localizeMetadataValue(e, language, e) : String(e)))
    .join(', ');
}

function getPrimaryCategory(item, fallback, language = 'en') {
  if (Array.isArray(item?.categories) && item.categories.length > 0)
    return localizeMetadataValue(item.categories[0], language, fallback);
  return localizeMetadataValue(item?.category, language, fallback);
}

function formatRiskLabel(riskLevel, t) {
  if (riskLevel === 'high') return t('common.highRisk');
  if (riskLevel === 'low') return t('common.lowRisk');
  return t('common.mediumRisk');
}

function formatMaintenanceLabel(value, t) {
  if (value === 'high') return t('common.highMaintenance');
  if (value === 'low') return t('common.lowMaintenance');
  return t('common.mediumMaintenance');
}

function formatLengthLabel(value, t) {
  if (value === 'short') return t('common.shortLength');
  if (value === 'long') return t('common.longLength');
  return t('common.mediumLength');
}

function formatGenderFitLabel(value, t) {
  if (value === 'men') return t('common.men');
  if (value === 'women') return t('common.women');
  return t('common.unisex');
}

function getVisualPalette(item) {
  const cat = String(item?.categories?.[0] || item?.category || '').toLowerCase();
  if (cat.includes('korean') || cat.includes('soft'))
    return { bg: '#f0ebf8', accent: '#5b4682' };
  if (cat.includes('fade') || cat.includes('crop') || cat.includes('buzz'))
    return { bg: '#e8f2ec', accent: '#234233' };
  if (cat.includes('bob') || cat.includes('layered') || cat.includes('lob'))
    return { bg: '#f5ece4', accent: '#5f4331' };
  if (cat.includes('wolf') || cat.includes('shag') || cat.includes('editorial'))
    return { bg: '#f5e8ec', accent: '#603444' };
  return { bg: colors.bgSubtle, accent: colors.forest };
}

function getStyleFieldList(item, primary, fallback) {
  if (Array.isArray(item?.[primary]) && item[primary].length > 0) return item[primary];
  if (fallback && Array.isArray(item?.[fallback]) && item[fallback].length > 0) return item[fallback];
  return [];
}

function isStyleReference(item) {
  return item?.kind === 'style' && typeof item?.styleId === 'string';
}

function resolveStyleItem(item) {
  if (!item) return null;
  if (isStyleReference(item)) return getHaircutStyleById(haircutStyles, item.styleId);
  if (item?.kind === 'style' || item?.genderFit || item?.genderTarget) {
    const resolved = getHaircutStyleById(haircutStyles, item?.styleId || item?.id);
    if (resolved) return { ...item, ...resolved };
  }
  return item;
}

function MetaRow({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

export function StyleDetailScreen({ language = 'en', t = (key) => key, item, onBack, onTryLook }) {
  if (!item) return null;

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
        <Card>
          <Text style={styles.body}>{t('styleDetail.missingBody')}</Text>
          <PrimaryButton label={t('common.back')} onPress={onBack} variant="secondary" />
        </Card>
      </ScreenContainer>
    );
  }

  const palette = getVisualPalette(resolvedItem);
  const resolvedTitle = isTip
    ? localizeCustomerText(resolvedItem.name || resolvedItem.title, language)
    : resolvedItem.name || resolvedItem.title || t('styleDetail.eyebrow');
  const resolvedSubtitle = localizeCustomerText(
    resolvedItem.subtitle || resolvedItem.description,
    language
  );
  const primaryCategory = getPrimaryCategory(resolvedItem, t('styleDetail.placeholders.curated'), language);
  const resolvedMaintenance = resolvedItem.maintenanceLevel || resolvedItem.maintenance || 'medium';
  const resolvedRegion = localizeMetadataValue(
    resolvedItem.popularityRegion || 'Global',
    language,
    t('common.global')
  );

  const safeCategories = getStyleFieldList(resolvedItem, 'categories', 'category');
  const safeFaceShapes = getStyleFieldList(resolvedItem, 'faceShapesFit', 'faceShapeFit');
  const safeHairTypes = getStyleFieldList(resolvedItem, 'hairTypesFit', 'hairTypeFit');
  const safeVibeTags = getStyleFieldList(resolvedItem, 'vibeTags', 'tags');
  const safeSuitableFor = getStyleFieldList(resolvedItem, 'suitableFor');
  const safeAvoidIf = getStyleFieldList(resolvedItem, 'avoidIf');

  return (
    <ScreenContainer
      eyebrow={isColor ? t('styleDetail.colorEyebrow') : isTip ? t('styleDetail.tipEyebrow') : t('styleDetail.eyebrow')}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
    >
      {/* Visual hero */}
      <View style={[styles.visualHero, { backgroundColor: isColor ? (resolvedItem.colorHex || '#d7b998') : palette.bg }]}>
        {isColor ? (
          <>
            <Text style={styles.visualHeroTitle}>{resolvedItem.title}</Text>
            <Text style={styles.visualHeroSub}>{resolvedItem.colorFamily}</Text>
          </>
        ) : isTip ? (
          <>
            <Text style={[styles.visualEyebrow, { color: palette.accent }]}>{t('styleDetail.tipEyebrow')}</Text>
            <Text style={[styles.visualHeroTitle, { color: palette.accent }]}>{resolvedItem.focus}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.visualEyebrow, { color: palette.accent }]}>{t('styleDetail.styleReference')}</Text>
            <Text style={[styles.visualHeroTitle, { color: palette.accent }]}>{resolvedTitle}</Text>
            <Text style={styles.visualHeroSub}>{primaryCategory}</Text>
            <View style={styles.visualBadgeRow}>
              <BadgePill tone="amber" label={formatLengthLabel(resolvedItem.length, t)} />
              <BadgePill tone="mint" label={formatGenderFitLabel(resolvedItem.genderFit || resolvedItem.genderTarget, t)} />
              <BadgePill tone="sky" label={formatMaintenanceLabel(resolvedMaintenance, t)} />
            </View>
            <Text style={styles.visualComingSoon}>{t('styleDetail.previewComingSoon')}</Text>
          </>
        )}
      </View>

      {/* Badge row */}
      <View style={styles.badgeRow}>
        <BadgePill tone="amber" label={primaryCategory} />
        <BadgePill tone="mint" label={`${t('styleDetail.maintenance')}: ${formatMaintenanceLabel(resolvedMaintenance, t)}`} />
        {!isTip ? <BadgePill tone="rose" label={formatRiskLabel(resolvedItem.riskLevel, t)} /> : null}
        <BadgePill tone="sky" label={resolvedRegion} />
      </View>

      {/* Content */}
      <Card>
        <Text style={styles.body}>
          {localizeCustomerText(
            resolvedItem.description || resolvedItem.subtitle,
            language
          )}
        </Text>

        {isColor ? (
          <View style={styles.metaBlock}>
            <MetaRow label={t('styleDetail.colorTone')} value={resolvedItem.tone} />
            <MetaRow label={t('styleDetail.skinToneFit')} value={formatList(resolvedItem.skinToneFit, '', language)} />
            <MetaRow label={t('styleDetail.maintenance')} value={resolvedItem.maintenance} />
          </View>
        ) : isTip ? (
          <View style={styles.metaBlock}>
            <MetaRow
              label={t('styleDetail.focus')}
              value={localizeMetadataValue(resolvedItem.focus, language, '')}
            />
          </View>
        ) : (
          <View style={styles.metaBlock}>
            <MetaRow label={t('styleDetail.genderFit')} value={formatGenderFitLabel(resolvedItem.genderFit || resolvedItem.genderTarget, t)} />
            <MetaRow label={t('styleDetail.length')} value={formatLengthLabel(resolvedItem.length, t)} />
            <MetaRow label={t('styleDetail.categories')} value={formatList(safeCategories, '', language)} />
            <MetaRow label={t('styleDetail.faceShape')} value={formatList(safeFaceShapes, '', language)} />
            <MetaRow label={t('styleDetail.hairType')} value={formatList(safeHairTypes, '', language)} />
            <MetaRow label={t('styleDetail.vibe')} value={formatList(safeVibeTags, '', language)} />
            <MetaRow label={t('styleDetail.region')} value={resolvedRegion} />
            <MetaRow label={t('styleDetail.suitableFor')} value={formatList(safeSuitableFor, '', language)} />
            <MetaRow label={t('styleDetail.avoidIf')} value={formatList(safeAvoidIf, '', language)} />
          </View>
        )}

        {isStyle && resolvedItem.stylingNotes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('styleDetail.stylingNotes')}</Text>
            <Text style={styles.body}>
              {localizeCustomerText(resolvedItem.stylingNotes, language)}
            </Text>
          </View>
        ) : null}

        {isStyle && resolvedItem.barberInstruction ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('styleDetail.barberInstruction')}</Text>
            <Text style={styles.body}>
              {localizeCustomerText(resolvedItem.barberInstruction, language)}
            </Text>
          </View>
        ) : null}

        {!isTip ? (
          <PrimaryButton
            label={isColor ? t('styleDetail.colorTry') : t('styleDetail.styleTry')}
            onPress={() => onTryLook?.(resolvedItem)}
          />
        ) : null}
        <PrimaryButton label={t('common.back')} onPress={onBack} variant="secondary" />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  visualHero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 180,
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  visualEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  visualHeroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 32,
  },
  visualHeroSub: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  visualBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  visualComingSoon: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  metaBlock: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTertiary,
    minWidth: 100,
  },
  metaValue: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  section: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
