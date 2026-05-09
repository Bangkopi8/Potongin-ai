import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  BadgePill,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PrimaryButton,
  ScreenContainer,
  StatusNotice,
} from '../components/index.js';
import { haircutStyles } from '../data/haircutStyles.js';
import { hairColors } from '../data/hairColors.js';
import { usePexelsPhoto } from '../services/pexelsService.js';
import { colors, radius, shadow, spacing, type } from '../theme.js';
import { localizeCustomerText, localizeMetadataValue } from '../utils/localizeCustomerCopy.js';

function getPreviewImageSource(generateResult, preview) {
  if (typeof preview?.imageUrl === 'string' && preview.imageUrl.trim().length > 0) {
    return preview.imageUrl.trim();
  }

  if (typeof generateResult?.previewUrl === 'string' && generateResult.previewUrl.trim().length > 0) {
    return generateResult.previewUrl.trim();
  }

  if (typeof generateResult?.previewBase64 === 'string' && generateResult.previewBase64.trim().length > 0) {
    const normalizedBase64 = generateResult.previewBase64.trim();
    return normalizedBase64.startsWith('data:image')
      ? normalizedBase64
      : `data:image/png;base64,${normalizedBase64}`;
  }

  return null;
}

function canRenderPreviewImage(uri) {
  return (
    typeof uri === 'string' &&
    (/^data:image/i.test(uri) || /^https?:\/\//i.test(uri) || /^file:/i.test(uri) || /^content:/i.test(uri))
  );
}

function getSaveFeedbackMessage(saveMessage, t) {
  if (typeof saveMessage !== 'string' || saveMessage.trim().length === 0) {
    return '';
  }

  if (/saved/i.test(saveMessage)) {
    return t('tryAi.preview.saveSuccess');
  }

  return saveMessage;
}

function getCustomerFacingErrorMessage(message, fallback) {
  if (typeof message !== 'string' || message.trim().length === 0) {
    return fallback;
  }

  const normalized = message.trim();

  if (/OPENAI_API_KEY|openai|gpt-image-1|mock mode|backend|stack|trace/i.test(normalized)) {
    return fallback;
  }

  if (/network|same network|phone can reach/i.test(normalized)) {
    return fallback;
  }

  if (/^\s*[\[{]/.test(normalized) || /"error"|"message"|"status"/i.test(normalized)) {
    return fallback;
  }

  return normalized;
}

function getLocalizedGroupTitle(group, t) {
  const key = String(group?.key || '');

  if (key.includes('best-fit')) {
    return t('tryAi.groups.titles.bestFit');
  }

  if (key.includes('safe-alternatives')) {
    return t('tryAi.groups.titles.safeAlternatives');
  }

  if (key.includes('bolder-options')) {
    return t('tryAi.groups.titles.bolderOptions');
  }

  return group?.title || t('tryAi.recommendationCard.fallbackTitle');
}

function getLocalizedGroupReason(group, t) {
  const key = String(group?.key || '');

  if (key.includes('best-fit')) {
    return t('tryAi.groups.reasons.bestFit');
  }

  if (key.includes('safe-alternatives')) {
    return t('tryAi.groups.reasons.safeAlternatives');
  }

  if (key.includes('bolder-options')) {
    return t('tryAi.groups.reasons.bolderOptions');
  }

  return group?.reason || t('tryAi.recommendationCard.fallbackReason');
}

function getStyleItemKey(item) {
  if (!item || typeof item !== 'object') {
    return '';
  }

  return String(item.styleId || item.id || item.title || item.name || '').trim().toLowerCase();
}

function pickFirstStyleItem(groups, matcher, usedKeys) {
  const safeGroups = Array.isArray(groups) ? groups.filter(Boolean) : [];

  for (const group of safeGroups) {
    if (!matcher(group)) {
      continue;
    }

    const item = (Array.isArray(group.items) ? group.items : []).find((entry) => {
      const itemKey = getStyleItemKey(entry);
      return entry?.kind === 'style' && itemKey && !usedKeys.has(itemKey);
    });

    if (item) {
      return item;
    }
  }

  return null;
}

function getFlatStyleItems(groups) {
  const safeGroups = Array.isArray(groups) ? groups.filter(Boolean) : [];
  return safeGroups.flatMap((group) =>
    (Array.isArray(group.items) ? group.items : []).filter((item) => item?.kind === 'style')
  );
}

function buildGuidedRecommendationSlots(groups, fallbackGroups, t) {
  const usedKeys = new Set();
  const sourceGroups = Array.isArray(groups) && groups.length > 0 ? groups : fallbackGroups;
  const backupGroups = Array.isArray(fallbackGroups) ? fallbackGroups : [];
  const flatCandidates = [...getFlatStyleItems(sourceGroups), ...getFlatStyleItems(backupGroups)];

  const slots = [
    {
      key: 'top-match',
      title: t('tryAi.groups.slots.topMatch'),
      reason: t('tryAi.groups.reasons.bestFit'),
      matcher: (group) => String(group?.key || '').includes('best-fit'),
      tone: 'mint',
    },
    {
      key: 'safe-alternative',
      title: t('tryAi.groups.slots.safeAlternative'),
      reason: t('tryAi.groups.reasons.safeAlternatives'),
      matcher: (group) => String(group?.key || '').includes('safe-alternatives'),
      tone: 'amber',
    },
    {
      key: 'bold-option',
      title: t('tryAi.groups.slots.boldOption'),
      reason: t('tryAi.groups.reasons.bolderOptions'),
      matcher: (group) => String(group?.key || '').includes('bolder-options'),
      tone: 'rose',
    },
  ];

  return slots.map((slot) => {
    let item =
      pickFirstStyleItem(sourceGroups, slot.matcher, usedKeys) ||
      pickFirstStyleItem(backupGroups, slot.matcher, usedKeys) ||
      flatCandidates.find((entry) => {
        const itemKey = getStyleItemKey(entry);
        return itemKey && !usedKeys.has(itemKey);
      }) ||
      null;

    if (item) {
      usedKeys.add(getStyleItemKey(item));
    }

    return {
      ...slot,
      item,
    };
  });
}

function pickSuggestedStyles(catalog, currentStyleId, analysisResult) {
  const safeStyles = Array.isArray(catalog) ? catalog.filter(Boolean) : [];
  const faceShape = String(analysisResult?.result?.faceShape || '').toLowerCase().trim();

  let candidates = safeStyles.filter((s) => s.id !== currentStyleId);

  if (faceShape) {
    const matching = candidates.filter((s) =>
      Array.isArray(s.faceShapesFit) && s.faceShapesFit.some((f) => f.toLowerCase() === faceShape)
    );
    const rest = candidates.filter((s) =>
      !Array.isArray(s.faceShapesFit) || !s.faceShapesFit.some((f) => f.toLowerCase() === faceShape)
    );
    candidates = [...matching, ...rest];
  }

  return candidates.slice(0, 10);
}

function getRiskLabel(riskLevel, language) {
  return localizeMetadataValue(
    riskLevel === 'high' ? 'bold' : riskLevel === 'low' ? 'light' : 'balanced',
    language,
    language === 'id' ? 'Sedang' : 'Balanced'
  );
}

function formatDisplayLabel(value, fallback = '') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  return value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getLocalizedLengthLabel(lengthValue, t) {
  if (lengthValue === 'short') {
    return t('common.shortLength');
  }
  if (lengthValue === 'long') {
    return t('common.longLength');
  }
  return t('common.mediumLength');
}

function getLocalizedMaintenanceLabel(level, t) {
  if (level === 'low') {
    return t('common.lowMaintenance');
  }
  if (level === 'high') {
    return t('common.highMaintenance');
  }
  return t('common.mediumMaintenance');
}

function FlowStep({ stepNumber, title, description }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepPill}>
        <Text style={styles.stepPillText}>{stepNumber}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        {description ? <Text style={styles.stepDescription}>{description}</Text> : null}
      </View>
    </View>
  );
}

function CompareTabButton({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.compareTabButton, active && styles.compareTabButtonActive]}>
      <Text style={[styles.compareTabLabel, active && styles.compareTabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function AnalysisOverlay({ visible, t }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlayBackdrop}>
        <View style={styles.overlayCard}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={styles.overlayTitle}>{t('tryAi.analyze.overlayTitle')}</Text>
          <Text style={styles.overlayBody}>{t('tryAi.analyze.overlayMessage')}</Text>
        </View>
      </View>
    </Modal>
  );
}

function PhotoSourceStepCard({ t, status, onTakePhoto, onUploadFromGallery, isBusy }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.photo.sourceOnlyTitle')}</Text>
      <Text style={styles.bodyText}>{t('tryAi.photo.sourceOnlyBody')}</Text>
      {status ? (
        <StatusNotice tone={status.tone} title={status.title} message={status.message} />
      ) : null}
      <View style={styles.buttonStack}>
        <PrimaryButton
          label={t('tryAi.photo.takePhoto')}
          onPress={onTakePhoto}
          disabled={isBusy}
        />
        <PrimaryButton
          label={t('tryAi.photo.upload')}
          onPress={onUploadFromGallery}
          variant="secondary"
          disabled={isBusy}
        />
      </View>
    </Card>
  );
}

function PhotoReviewCard({
  title,
  body,
  selectedPhoto,
  status,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryDisabled = false,
}) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
      {status ? <StatusNotice tone={status.tone} title={status.title} message={status.message} /> : null}
      <View style={styles.photoReviewFrame}>
        <Image source={{ uri: selectedPhoto?.uri }} style={styles.photoReviewImage} />
      </View>
      <View style={styles.buttonStack}>
        <PrimaryButton label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} />
        <PrimaryButton label={secondaryLabel} onPress={onSecondary} variant="secondary" disabled={primaryDisabled} />
      </View>
    </Card>
  );
}

function ConfirmedPhotoCard({ t, selectedPhoto, onResetPhoto }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.photo.confirmedTitle')}</Text>
      <Text style={styles.bodyText}>{t('tryAi.photo.status.confirmedMessage')}</Text>
      <View style={styles.confirmedPhotoRow}>
        <Image source={{ uri: selectedPhoto?.uri }} style={styles.confirmedPhotoImage} />
        <View style={styles.confirmedPhotoCopy}>
          <Text style={styles.metaText}>
            {t('tryAi.photo.sourceLabel')}: {selectedPhoto?.sourceType === 'camera' ? t('tryAi.photo.sourceCamera') : t('tryAi.photo.sourceGallery')}
          </Text>
          <Text style={styles.metaText}>
            {t('tryAi.photo.sizeLabel')}: {selectedPhoto?.width} x {selectedPhoto?.height}
          </Text>
          <PrimaryButton
            label={t('tryAi.photo.change')}
            onPress={onResetPhoto}
            variant="secondary"
          />
        </View>
      </View>
    </Card>
  );
}

function ColorChip({ color, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.colorChip, active && styles.colorChipActive]}>
      <View style={[styles.colorSwatch, { backgroundColor: color?.hex || '#d7b998' }, active && styles.colorSwatchActive]} />
      <Text style={[styles.colorChipLabel, active && styles.colorChipLabelActive]}>
        {color?.name || 'Color'}
      </Text>
    </Pressable>
  );
}

function GuidedRecommendationCard({
  language,
  t,
  slot,
  item,
  selectedStyleId,
  onTryLook,
}) {
  const styleId = item?.styleId || item?.id;
  const isSelected = Boolean(styleId) && styleId === selectedStyleId;
  const maintenanceLabel = t('tryAi.recommendationCard.maintenanceLabel').replace(
    '{value}',
    getLocalizedMaintenanceLabel(item?.maintenance || item?.maintenanceLevel || 'medium', t)
  );
  const riskLabel = `${t('common.changeLevel')}: ${getRiskLabel(item?.riskLevel, language)}`;
  const description =
    localizeCustomerText(
      item?.shortDescription ||
        item?.subtitle ||
        item?.description ||
        slot.reason,
      language
    );

  return (
    <View style={[styles.recommendationCard, isSelected && styles.recommendationCardSelected]}>
      <View style={styles.recommendationVisual}>
        <BadgePill tone={slot.tone} label={slot.title} />
        <Text style={styles.recommendationVisualText}>
          {t('tryAi.recommendationCard.styleVisualFallback')}
        </Text>
      </View>
      <Text style={styles.recommendationTitle}>{item?.title || slot.title}</Text>
      <Text style={styles.recommendationDescription} numberOfLines={3}>
        {description}
      </Text>
      <View style={styles.badgeRow}>
        <BadgePill
          tone="amber"
          label={localizeMetadataValue(
            item?.category || item?.categories?.[0] || t('tryAi.recommendationCard.categoryFallback'),
            language,
            t('tryAi.recommendationCard.categoryFallback')
          )}
        />
        <BadgePill tone="mint" label={maintenanceLabel} />
        <BadgePill tone="rose" label={riskLabel} />
        {isSelected ? <BadgePill tone="rose" label={t('tryAi.recommendationCard.selectedBadge')} /> : null}
      </View>
      <PrimaryButton
        label={t('tryAi.recommendationCard.tryLook')}
        onPress={() => item && onTryLook?.(item)}
        disabled={!item}
      />
    </View>
  );
}

function GuidedRecommendationRail({
  language,
  t,
  recommendations,
  selectedStyleId,
  onTryLook,
  highlighted = false,
}) {
  return (
    <View style={styles.groupStack}>
      <Card style={highlighted ? styles.focusCard : null}>
        <Text style={styles.cardTitle}>{t('tryAi.groups.guidedTitle')}</Text>
        <Text style={styles.bodyText}>{t('tryAi.groups.guidedBody')}</Text>
        {highlighted ? (
          <StatusNotice
            tone="info"
            title={t('tryAi.resultDecision.tryAnotherStyle')}
            message={t('tryAi.groups.changeHaircutBody')}
          />
        ) : null}
      </Card>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recommendationRail}
      >
        {recommendations.map((slot) => (
          <GuidedRecommendationCard
            key={slot.key}
            language={language}
            t={t}
            slot={slot}
            item={slot.item}
            selectedStyleId={selectedStyleId}
            onTryLook={onTryLook}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function StyleSuggestionCard({ language, t, item, onTry }) {
  const photoUrl = usePexelsPhoto(item?.name);
  const categoryLabel = localizeMetadataValue(
    item?.categories?.[0] || item?.category || '',
    language,
    t('tryAi.recommendationCard.categoryFallback')
  );
  const lengthLabel = getLocalizedLengthLabel(item?.length || 'medium', t);
  const initial = String(item?.name || '').charAt(0).toUpperCase();

  return (
    <View style={styles.suggestionCard}>
      {photoUrl ? (
        <View style={styles.suggestionPhotoContainer}>
          <Image source={{ uri: photoUrl }} style={styles.suggestionPhotoFill} resizeMode="cover" />
          <View style={styles.suggestionPhotoOverlay} />
        </View>
      ) : (
        <View style={styles.suggestionVisual}>
          <Text style={styles.suggestionInitial}>{initial}</Text>
        </View>
      )}
      <Text style={styles.suggestionName} numberOfLines={2}>{item?.name}</Text>
      <View style={styles.suggestionBadgeRow}>
        <BadgePill tone="amber" label={categoryLabel} />
        <BadgePill tone="mint" label={lengthLabel} />
      </View>
      <PrimaryButton
        label={t('tryAi.suggestionRail.tryButton')}
        onPress={() => item && onTry?.(item)}
      />
    </View>
  );
}

function StyleSuggestionRail({ language, t, catalog, currentStyleId, analysisResult, onTryRecommendation }) {
  const suggestions = useMemo(
    () => pickSuggestedStyles(catalog, currentStyleId, analysisResult),
    [catalog, currentStyleId, analysisResult]
  );

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.groupStack}>
      <Card>
        <Text style={styles.cardTitle}>{t('tryAi.suggestionRail.title')}</Text>
        <Text style={styles.bodyText}>{t('tryAi.suggestionRail.body')}</Text>
      </Card>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionRail}
      >
        {suggestions.map((item) => (
          <StyleSuggestionCard
            key={item.id}
            language={language}
            t={t}
            item={item}
            onTry={onTryRecommendation}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SelectedLookCard({
  t,
  selectedStyle,
  selectedHairColorLabel,
  selectionNotice,
  generateStatusSummary,
  generateButtonLabel,
  canRunGenerate,
  onRunGenerate,
  hasGeneratedPreview,
}) {
  const hasSelectedStyle = Boolean(selectedStyle?.title || selectedStyle?.name);
  const selectedStyleName = selectedStyle?.title || selectedStyle?.name || t('tryAi.selectedLook.none');
  const selectedStyleCategory = formatDisplayLabel(
    selectedStyle?.category || selectedStyle?.categories?.[0],
    t('tryAi.recommendationCard.categoryFallback')
  );
  const selectedStyleLength = getLocalizedLengthLabel(selectedStyle?.length || 'medium', t);
  const selectedStyleGender = selectedStyle?.genderFit === 'men'
    ? t('common.men')
    : selectedStyle?.genderFit === 'women'
      ? t('common.women')
      : selectedStyle?.genderTarget === 'men'
        ? t('common.men')
        : selectedStyle?.genderTarget === 'women'
          ? t('common.women')
          : t('common.unisex');
  const visibleGuidance = !hasSelectedStyle
    ? t('tryAi.selectedLook.guidanceNoStyle')
    : selectionNotice ||
      t('tryAi.selectedLook.guidanceSelected', {
        styleName: selectedStyle?.title || selectedStyle?.name || t('tryAi.selectedLook.none'),
      });

  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.selectedLook.title')}</Text>
      <Text style={styles.resultHeadline}>{selectedStyleName}</Text>
      <View style={styles.badgeRow}>
        <BadgePill tone="amber" label={selectedStyleCategory} />
        <BadgePill tone="mint" label={selectedStyleLength} />
        <BadgePill tone="rose" label={selectedStyleGender} />
        {selectedHairColorLabel ? <BadgePill tone="sky" label={selectedHairColorLabel} /> : null}
        {hasSelectedStyle ? <BadgePill tone="rose" label={t('tryAi.selectedLook.selectedBadge')} /> : null}
      </View>
      <Text style={styles.bodyText}>{visibleGuidance}</Text>
      <Text style={styles.metaText}>
        {t('tryAi.selectedLook.haircutLabel')}: {hasSelectedStyle ? selectedStyleName : t('tryAi.selectedLook.guidanceNoStyle')}
      </Text>
      <Text style={styles.metaText}>
        {t('tryAi.selectedLook.hairColorLabel')}: {selectedHairColorLabel || t('tryAi.selectedLook.defaultColor')}
      </Text>
      <StatusNotice
        tone={generateStatusSummary.tone}
        title={generateStatusSummary.title}
        message={generateStatusSummary.message}
      />
      <PrimaryButton label={generateButtonLabel} onPress={onRunGenerate} disabled={!canRunGenerate} />
      {hasGeneratedPreview ? (
        <Text style={styles.metaText}>{t('tryAi.preview.updatedHint')}</Text>
      ) : null}
    </Card>
  );
}

function HairColorPicker({ t, selectedHairColor, onSelectHairColor, hasGeneratedPreview, highlighted = false }) {
  const safeColors = Array.isArray(hairColors) ? hairColors.filter(Boolean) : [];

  return (
    <Card style={highlighted ? styles.focusCard : null}>
      <Text style={styles.cardTitle}>
        {hasGeneratedPreview ? t('tryAi.colorPicker.changeTitle') : t('tryAi.colorPicker.chooseTitle')}
      </Text>
      <Text style={styles.bodyText}>{t('tryAi.colorPicker.body')}</Text>
      {highlighted ? (
        <StatusNotice
          tone="info"
          title={t('tryAi.resultDecision.tryAnotherColor')}
          message={t('tryAi.preview.updatedHint')}
        />
      ) : null}
      {safeColors.length === 0 ? (
        <Text style={styles.metaText}>{t('tryAi.colorPicker.unavailable')}</Text>
      ) : (
        <View style={styles.colorChipWrap}>
          {safeColors.map((color) => (
            <ColorChip
              key={color.id}
              color={color}
              active={selectedHairColor?.id === color.id}
              onPress={() => onSelectHairColor?.(color.id)}
            />
          ))}
        </View>
      )}
      <Text style={styles.metaText}>
        {t('tryAi.colorPicker.selectedLabel')}: {selectedHairColor?.title || selectedHairColor?.name || t('tryAi.colorPicker.none')}
      </Text>
    </Card>
  );
}

function AnalysisSnapshotCard({ language = 'en', t, analysisResult }) {
  if (!analysisResult) {
    return null;
  }

  const faceShape = localizeMetadataValue(
    analysisResult?.result?.faceShape || t('tryAi.colorPicker.none'),
    language,
    t('tryAi.colorPicker.none')
  );
  const hairCondition = localizeMetadataValue(
    analysisResult?.result?.hairCondition || analysisResult?.result?.hairType || t('tryAi.colorPicker.none'),
    language,
    t('tryAi.colorPicker.none')
  );
  const confidence = typeof analysisResult?.result?.confidence === 'number'
    ? `${(analysisResult.result.confidence * 100).toFixed(0)}%`
    : t('tryAi.colorPicker.none');

  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.insight.title')}</Text>
      <View style={styles.insightRow}>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('tryAi.insight.faceShape')}</Text>
          <Text style={styles.insightValue}>{faceShape}</Text>
        </View>
        <View style={[styles.insightItem, styles.insightItemBorder]}>
          <Text style={styles.insightLabel}>{t('tryAi.insight.hairCondition')}</Text>
          <Text style={styles.insightValue}>{hairCondition}</Text>
        </View>
        <View style={[styles.insightItem, styles.insightItemBorder]}>
          <Text style={styles.insightLabel}>{t('tryAi.insight.confidence')}</Text>
          <Text style={styles.insightValue}>{confidence}</Text>
        </View>
      </View>
    </Card>
  );
}

function PreviewResultCard({
  t,
  generateStatus,
  generateResult,
  generateError,
  selectedPhoto,
  selectedHairColorLabel,
  selectedStyle,
  comparisonView,
  onChangeComparisonView,
}) {
  const safePreviews = Array.isArray(generateResult?.previews) ? generateResult.previews : [];
  const previewImageSource = getPreviewImageSource(generateResult, safePreviews[0]);
  const originalImageSource = typeof selectedPhoto?.uri === 'string' ? selectedPhoto.uri.trim() : '';
  const showBefore = comparisonView === 'before';
  const activeImageSource = showBefore ? originalImageSource : previewImageSource;
  const activeFallback = showBefore
    ? t('tryAi.preview.missingBeforeImage')
    : t('tryAi.preview.missingAfterImage');

  if (generateStatus === 'idle' && !generateResult && !generateError) {
    return (
      <Card>
        <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
        <EmptyState title={t('tryAi.preview.emptyTitle')} message={t('tryAi.preview.emptyMessage')} />
      </Card>
    );
  }

  if (generateStatus === 'loading') {
    return (
      <Card>
        <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
        <LoadingState message={t('tryAi.preview.loadingMessage')} />
      </Card>
    );
  }

  if (generateStatus === 'error') {
    return (
      <Card>
        <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
        <ErrorState
          title={t('tryAi.preview.errorTitle')}
          message={getCustomerFacingErrorMessage(generateError, t('tryAi.preview.errorMessage'))}
        />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
      <StatusNotice
        tone="success"
        title={t('tryAi.preview.successTitle')}
        message={t('tryAi.preview.successMessage')}
      />
      <Text style={styles.betaDisclaimer}>{t('tryAi.preview.disclaimer')}</Text>
      <View style={styles.compareTabRow}>
        <CompareTabButton
          label={t('tryAi.preview.afterLabel')}
          active={comparisonView === 'after'}
          onPress={() => onChangeComparisonView?.('after')}
        />
        <CompareTabButton
          label={t('tryAi.preview.beforeLabel')}
          active={comparisonView === 'before'}
          onPress={() => onChangeComparisonView?.('before')}
        />
      </View>
      <View style={styles.previewCard}>
        <Text style={styles.previewTitle}>
          {showBefore
            ? t('tryAi.preview.beforeLabel')
            : generateResult?.styleName || safePreviews[0]?.styleName || selectedStyle?.title || t('tryAi.preview.afterLabel')}
        </Text>
        {canRenderPreviewImage(activeImageSource) ? (
          <Image source={{ uri: activeImageSource }} style={styles.previewImage} />
        ) : (
          <Text style={styles.previewMissingText}>{activeFallback}</Text>
        )}
        {!showBefore ? (
          <Text style={styles.previewMeta}>
            {t('tryAi.preview.hairColorLabel')}: {generateResult?.hairColor || selectedHairColorLabel || t('tryAi.colorPicker.none')}
          </Text>
        ) : null}
      </View>
      {generateResult?.notes ? <Text style={styles.bodyText}>{generateResult.notes}</Text> : null}
    </Card>
  );
}

function ResultDecisionCard({
  t,
  canSaveResult,
  onSaveResult,
  onTryAnotherColor,
  onTryAnotherStyle,
  onOpenProfile,
  saveMessage,
}) {
  const normalizedSaveMessage = getSaveFeedbackMessage(saveMessage, t);

  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.resultDecision.title')}</Text>
      <View style={styles.buttonStack}>
        <PrimaryButton
          label={canSaveResult ? t('tryAi.preview.saveButton') : t('tryAi.preview.savedButton')}
          onPress={onSaveResult}
          disabled={!canSaveResult}
        />
        <PrimaryButton
          label={t('tryAi.resultDecision.tryAnotherColor')}
          onPress={onTryAnotherColor}
          variant="secondary"
        />
        <PrimaryButton
          label={t('tryAi.resultDecision.tryAnotherStyle')}
          onPress={onTryAnotherStyle}
          variant="secondary"
        />
        <PrimaryButton
          label={`${t('tryAi.resultDecision.customHaircutStyle')} - ${t('tryAi.resultDecision.comingSoon')}`}
          onPress={() => {}}
          variant="secondary"
          disabled
        />
        {normalizedSaveMessage ? <Text style={styles.saveMessage}>{normalizedSaveMessage}</Text> : null}
        {normalizedSaveMessage && typeof onOpenProfile === 'function' ? (
          <PrimaryButton
            label={t('tryAi.resultDecision.viewSavedLook')}
            onPress={onOpenProfile}
            variant="secondary"
          />
        ) : null}
      </View>
    </Card>
  );
}

function BarberInstructionCard({
  language = 'en',
  t,
  hasGeneratedPreview,
  isExpanded,
  onViewBarberCard,
  selectedStyle,
  selectedHairColor,
  selectedHairColorLabel,
  selectedPhoto,
  generateResult,
  instructionStyleName,
}) {
  const safePreviews = Array.isArray(generateResult?.previews) ? generateResult.previews : [];
  const previewImageSource = getPreviewImageSource(generateResult, safePreviews[0]);
  const originalImageSource = typeof selectedPhoto?.uri === 'string' ? selectedPhoto.uri.trim() : '';
  const resolvedStyleName =
    generateResult?.styleName ||
    selectedStyle?.title ||
    selectedStyle?.name ||
    instructionStyleName ||
    t('tryAi.selectedLook.none');
  const resolvedHairColor =
    generateResult?.hairColor ||
    selectedHairColorLabel ||
    selectedHairColor?.title ||
    selectedHairColor?.name ||
    t('tryAi.colorPicker.none');
  const resolvedMaintenance = getLocalizedMaintenanceLabel(
    selectedStyle?.maintenanceLevel || selectedStyle?.maintenance || selectedHairColor?.maintenanceLevel || 'medium',
    t
  );
  const resolvedCategory = formatDisplayLabel(
    localizeMetadataValue(
      selectedStyle?.category || selectedStyle?.categories?.[0] || t('tryAi.recommendationCard.categoryFallback'),
      language,
      t('tryAi.recommendationCard.categoryFallback')
    ),
    t('tryAi.recommendationCard.categoryFallback')
  );
  const resolvedLength = getLocalizedLengthLabel(selectedStyle?.length || 'medium', t);
  const cuttingGuidance =
    localizeCustomerText(
      selectedStyle?.barberInstruction || t('tryAi.barberCard.cuttingFallback'),
      language
    );
  const stylingGuidance =
    localizeCustomerText(
      selectedStyle?.stylingNotes || t('tryAi.barberCard.stylingFallback'),
      language
    );
  const visualReferenceBody = t('tryAi.barberCard.visualReferenceBody');

  if (!hasGeneratedPreview) {
    return (
      <Card>
        <Text style={styles.cardTitle}>{t('tryAi.barberCard.title')}</Text>
        <Text style={styles.bodyText}>{t('tryAi.barberCard.lockedBody')}</Text>
        <PrimaryButton
          label={`${t('tryAi.barberCard.viewButton')} - ${t('tryAi.resultDecision.comingSoon')}`}
          onPress={() => {}}
          variant="secondary"
          disabled
        />
      </Card>
    );
  }

  if (!isExpanded) {
    return (
      <Card>
        <Text style={styles.cardTitle}>{t('tryAi.barberCard.title')}</Text>
        <Text style={styles.bodyText}>{t('tryAi.barberCard.showToBarber')}</Text>
        <Text style={styles.metaText}>
          {t('tryAi.barberCard.summaryBody', {
            styleName: resolvedStyleName,
            hairColor: resolvedHairColor,
          })}
        </Text>
        <PrimaryButton label={t('tryAi.barberCard.viewButton')} onPress={onViewBarberCard} variant="secondary" />
      </Card>
    );
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>{t('tryAi.barberCard.instructionTitle')}</Text>
      <StatusNotice
        tone="info"
        title={t('tryAi.barberCard.showToBarber')}
        message={t('tryAi.barberCard.summaryBody', {
          styleName: resolvedStyleName,
          hairColor: resolvedHairColor,
        })}
      />
      <View style={styles.barberMetaGrid}>
        <View style={styles.barberMetaCard}>
          <Text style={styles.insightLabel}>{t('tryAi.barberCard.hairstyle')}</Text>
          <Text style={styles.insightValue}>{resolvedStyleName}</Text>
        </View>
        <View style={styles.barberMetaCard}>
          <Text style={styles.insightLabel}>{t('tryAi.barberCard.hairColor')}</Text>
          <Text style={styles.insightValue}>{resolvedHairColor}</Text>
        </View>
        <View style={styles.barberMetaCard}>
          <Text style={styles.insightLabel}>{t('tryAi.barberCard.maintenance')}</Text>
          <Text style={styles.insightValue}>{resolvedMaintenance}</Text>
        </View>
        <View style={styles.barberMetaCard}>
          <Text style={styles.insightLabel}>{t('tryAi.barberCard.lengthCategory')}</Text>
          <Text style={styles.insightValue}>{`${resolvedCategory} - ${resolvedLength}`}</Text>
        </View>
      </View>
      <View style={styles.barberSection}>
        <Text style={styles.instructionTitle}>{t('tryAi.barberCard.cuttingGuidance')}</Text>
        <Text style={styles.bodyText}>{cuttingGuidance}</Text>
      </View>
      <View style={styles.barberSection}>
        <Text style={styles.instructionTitle}>{t('tryAi.barberCard.stylingGuidance')}</Text>
        <Text style={styles.bodyText}>{stylingGuidance}</Text>
      </View>
      <View style={styles.barberSection}>
        <Text style={styles.instructionTitle}>{t('tryAi.barberCard.whatToShow')}</Text>
        <Text style={styles.bodyText}>{visualReferenceBody}</Text>
      </View>
      <View style={styles.barberSection}>
        <Text style={styles.instructionTitle}>{t('tryAi.barberCard.visualReference')}</Text>
        <View style={styles.barberReferenceRow}>
          <View style={styles.barberReferenceCard}>
            <Text style={styles.previewMeta}>{t('tryAi.preview.beforeLabel')}</Text>
            {canRenderPreviewImage(originalImageSource) ? (
              <Image source={{ uri: originalImageSource }} style={styles.barberReferenceImage} />
            ) : (
              <Text style={styles.previewMissingText}>{t('tryAi.preview.missingBeforeImage')}</Text>
            )}
          </View>
          <View style={styles.barberReferenceCard}>
            <Text style={styles.previewMeta}>{t('tryAi.preview.afterLabel')}</Text>
            {canRenderPreviewImage(previewImageSource) ? (
              <Image source={{ uri: previewImageSource }} style={styles.barberReferenceImage} />
            ) : (
              <Text style={styles.previewMissingText}>{t('tryAi.preview.missingAfterImage')}</Text>
            )}
          </View>
        </View>
      </View>
      <Text style={styles.betaDisclaimer}>{t('tryAi.barberCard.referenceDisclaimer')}</Text>
    </Card>
  );
}

export function TryAiScreen({
  language = 'en',
  t = (key) => key,
  selectedStyle,
  selectedStyleId,
  selectedHairColor,
  selectedHairColorLabel,
  selectedPhoto,
  photoSession,
  photoError,
  photoConfirmationStatus,
  photoInputState,
  previewActionLabel,
  analysisStatus,
  analysisResult,
  analysisError,
  availableCredits,
  canRunAnalysis,
  canRunGenerate,
  canSaveResult,
  generateStatus,
  generateResult,
  generateError,
  hasInsufficientCredits,
  instructionStyleName,
  mockRecommendationGroups,
  recommendationGroups,
  saveMessage,
  selectionNotice,
  showPaywallPlaceholder,
  showInstructionCard,
  onTakePhoto,
  onUploadFromGallery,
  onConfirmPhoto,
  onResetPhoto,
  onRunAnalysis,
  onRunGenerate,
  onSaveResult,
  onSelectHairColor,
  onTryRecommendation,
  onOpenProfile,
}) {
  const [photoReviewStage, setPhotoReviewStage] = useState('source');
  const [focusTarget, setFocusTarget] = useState(null);
  const [comparisonView, setComparisonView] = useState('after');
  const [showBarberCard, setShowBarberCard] = useState(false);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoReviewStage('source');
      return;
    }

    if (photoSession) {
      setPhotoReviewStage('confirmed');
      return;
    }

    setPhotoReviewStage((current) => {
      if (current === 'confirm') {
        return current;
      }

      return 'framing';
    });
  }, [photoSession, selectedPhoto?.uri]);

  useEffect(() => {
    if (generateStatus === 'success' || generateResult) {
      setComparisonView('after');
    }
  }, [generateResult, generateStatus]);

  useEffect(() => {
    if (!(generateStatus === 'success' || generateResult)) {
      setShowBarberCard(false);
    }
  }, [generateResult, generateStatus]);

  const safeRecommendationGroups = (Array.isArray(recommendationGroups) ? recommendationGroups.filter(Boolean) : []).map((group) => ({
    ...group,
    title: getLocalizedGroupTitle(group, t),
    reason: getLocalizedGroupReason(group, t),
  }));
  const safeMockRecommendationGroups = (Array.isArray(mockRecommendationGroups) ? mockRecommendationGroups.filter(Boolean) : []).map((group) => ({
    ...group,
    title: getLocalizedGroupTitle(group, t),
    reason: getLocalizedGroupReason(group, t),
  }));
  const guidedRecommendations = useMemo(
    () => buildGuidedRecommendationSlots(safeRecommendationGroups, safeMockRecommendationGroups, t),
    [safeMockRecommendationGroups, safeRecommendationGroups, t]
  );

  const hasSelectedStyle = Boolean(selectedStyle?.title || selectedStyle?.name);
  const hasGeneratedPreview = generateStatus === 'success' || Boolean(generateResult);
  const isPhotoBusy = photoConfirmationStatus === 'loading';
  const hasReadableSelectedPhotoPayload = Boolean(
    selectedPhoto &&
      ((typeof selectedPhoto.uri === 'string' && selectedPhoto.uri.trim().length > 0) ||
        (typeof selectedPhoto.base64 === 'string' && selectedPhoto.base64.trim().length > 0) ||
        selectedPhoto.file)
  );
  const shouldShowPhotoError =
    Boolean(photoError) &&
    (photoConfirmationStatus === 'error' || !selectedPhoto || !hasReadableSelectedPhotoPayload);
  const showPhotoSource = !selectedPhoto;
  const showFramingStep = Boolean(selectedPhoto) && !photoSession && photoReviewStage === 'framing';
  const showConfirmStep = Boolean(selectedPhoto) && !photoSession && photoReviewStage === 'confirm';
  const showAnalyzeStep = Boolean(photoSession);
  const showRecommendations = analysisStatus === 'success' && guidedRecommendations.length > 0;
  const showSelectionStep = showAnalyzeStep && hasSelectedStyle;
  const showPreviewStep = showSelectionStep || generateStatus !== 'idle' || Boolean(generateResult) || Boolean(generateError);

  const localizedPhotoStatus = shouldShowPhotoError
    ? {
        tone: 'error',
        title: t('tryAi.photo.status.errorTitle'),
        message: getCustomerFacingErrorMessage(photoError, t('tryAi.photo.status.errorMessage')),
      }
    : !selectedPhoto
      ? {
          tone: 'info',
          title: t('tryAi.photo.status.emptyTitle'),
          message: t('tryAi.photo.status.emptyMessage'),
        }
      : isPhotoBusy
        ? {
            tone: 'info',
            title: t('tryAi.photo.status.confirmingTitle'),
            message: t('tryAi.photo.status.confirmingMessage'),
          }
        : photoSession
          ? {
              tone: 'success',
              title: t('tryAi.photo.status.confirmedTitle'),
              message: t('tryAi.photo.status.confirmedMessage'),
            }
          : {
              tone: 'info',
              title: t('tryAi.photo.status.selectedTitle'),
              message: t('tryAi.photo.status.selectedMessage'),
            };

  const localizedAnalysisStatusSummary =
    analysisStatus === 'loading'
      ? {
          tone: 'info',
          title: t('tryAi.analyze.status.loadingTitle'),
          message: t('tryAi.analyze.status.loadingMessage'),
        }
      : analysisStatus === 'error' && analysisError
        ? {
            tone: 'error',
            title: t('tryAi.analyze.status.errorTitle'),
            message: getCustomerFacingErrorMessage(analysisError, t('tryAi.analyze.status.errorMessage')),
          }
        : analysisStatus === 'success'
          ? {
              tone: 'success',
              title: t('tryAi.analyze.status.successTitle'),
              message: t('tryAi.analyze.status.successMessage'),
            }
          : {
              tone: 'info',
              title: t('tryAi.analyze.status.idleTitle'),
              message: t('tryAi.analyze.status.idleMessage'),
            };

  const localizedGenerateStatusSummary =
    hasInsufficientCredits && photoSession
      ? {
          tone: 'warning',
          title: t('tryAi.status.noRealCreditsTitle'),
          message: t('tryAi.status.noRealCreditsMessage'),
        }
      : generateStatus === 'loading'
        ? {
            tone: 'info',
            title: t('tryAi.preview.resultTitle'),
            message: t('tryAi.preview.loadingMessage'),
          }
        : generateStatus === 'error' && generateError
          ? {
              tone: 'error',
              title: t('tryAi.preview.errorTitle'),
              message: getCustomerFacingErrorMessage(generateError, t('tryAi.preview.errorMessage')),
            }
          : generateStatus === 'success'
            ? {
                tone: 'success',
                title: t('tryAi.preview.successTitle'),
                message: t('tryAi.preview.successMessage'),
              }
            : {
                tone: 'info',
                title: t('tryAi.preview.resultTitle'),
                message: t('tryAi.preview.emptyMessage'),
              };

  const localizedPreviewActionLabel = hasGeneratedPreview
    ? t('tryAi.preview.updateButton')
    : t('tryAi.preview.firstButton');

  const localizedSelectionNotice = hasSelectedStyle
    ? t('tryAi.selectedLook.guidanceSelected', {
        styleName: selectedStyle.title || selectedStyle.name || t('tryAi.selectedLook.none'),
      })
    : selectionNotice;

  function handleTryRecommendation(item) {
    setFocusTarget(null);
    onTryRecommendation?.(item);
  }

  function handleSelectHairColor(colorId) {
    setFocusTarget(null);
    onSelectHairColor?.(colorId);
  }

  function handleFocusColor() {
    setFocusTarget('color');
  }

  function handleFocusStyle() {
    setFocusTarget('style');
  }

  function handleViewBarberCard() {
    setShowBarberCard(true);
  }

  return (
    <ScreenContainer eyebrow={t('tryAi.eyebrow')} title={t('tryAi.title')} subtitle={t('tryAi.subtitle')}>
      <AnalysisOverlay visible={analysisStatus === 'loading'} t={t} />

      <FlowStep stepNumber={1} title={t('tryAi.steps.addPhoto.title')} description={t('tryAi.steps.addPhoto.description')} />

      {showPhotoSource ? (
        <PhotoSourceStepCard
          t={t}
          status={localizedPhotoStatus}
          onTakePhoto={onTakePhoto}
          onUploadFromGallery={onUploadFromGallery}
          isBusy={isPhotoBusy}
        />
      ) : null}

      {showFramingStep ? (
        <>
          <FlowStep stepNumber={2} title={t('tryAi.photo.reviewTitle')} description={t('tryAi.photo.reviewBody')} />
          <PhotoReviewCard
            title={t('tryAi.photo.reviewTitle')}
            body={t('tryAi.photo.reviewBody')}
            selectedPhoto={selectedPhoto}
            primaryLabel={t('tryAi.photo.continue')}
            secondaryLabel={t('tryAi.photo.retake')}
            onPrimary={() => setPhotoReviewStage('confirm')}
            onSecondary={onResetPhoto}
          />
        </>
      ) : null}

      {showConfirmStep ? (
        <>
          <FlowStep stepNumber={3} title={t('tryAi.photo.confirmStepTitle')} description={t('tryAi.photo.confirmStepBody')} />
          <PhotoReviewCard
            title={t('tryAi.photo.confirmStepTitle')}
            body={t('tryAi.photo.confirmStepBody')}
            selectedPhoto={selectedPhoto}
            status={localizedPhotoStatus}
            primaryLabel={isPhotoBusy ? t('tryAi.photo.confirming') : t('tryAi.photo.confirm')}
            secondaryLabel={t('tryAi.photo.retake')}
            onPrimary={onConfirmPhoto}
            onSecondary={onResetPhoto}
            primaryDisabled={isPhotoBusy}
          />
        </>
      ) : null}

      {showAnalyzeStep ? (
        <>
          <FlowStep stepNumber={4} title={t('tryAi.steps.analyze.title')} description={t('tryAi.steps.analyze.description')} />
          <ConfirmedPhotoCard t={t} selectedPhoto={selectedPhoto} onResetPhoto={onResetPhoto} />
          <Card>
            <Text style={styles.cardTitle}>{t('tryAi.analyze.cardTitle')}</Text>
            <Text style={styles.bodyText}>{t('tryAi.analyze.body')}</Text>
            <StatusNotice
              tone={localizedAnalysisStatusSummary.tone}
              title={localizedAnalysisStatusSummary.title}
              message={localizedAnalysisStatusSummary.message}
            />
            <PrimaryButton
              label={analysisStatus === 'loading' ? t('tryAi.analyze.buttonLoading') : t('tryAi.analyze.button')}
              onPress={onRunAnalysis}
              disabled={!canRunAnalysis}
            />
          </Card>
        </>
      ) : null}

      {showRecommendations ? (
        <>
          <FlowStep stepNumber={5} title={t('tryAi.steps.chooseStyle.title')} description={t('tryAi.steps.chooseStyle.description')} />
          <AnalysisSnapshotCard language={language} t={t} analysisResult={analysisResult} />
          <GuidedRecommendationRail
            language={language}
            t={t}
            recommendations={guidedRecommendations.slice(0, 3)}
            selectedStyleId={selectedStyleId}
            onTryLook={handleTryRecommendation}
            highlighted={focusTarget === 'style'}
          />
        </>
      ) : null}

      {showSelectionStep ? (
        <>
          <FlowStep stepNumber={6} title={t('tryAi.colorPicker.chooseTitle')} description={t('tryAi.colorPicker.body')} />
          <HairColorPicker
            t={t}
            selectedHairColor={selectedHairColor}
            onSelectHairColor={handleSelectHairColor}
            hasGeneratedPreview={hasGeneratedPreview}
            highlighted={focusTarget === 'color'}
          />
          <FlowStep stepNumber={7} title={t('tryAi.steps.generate.title')} description={t('tryAi.steps.generate.description')} />
          <SelectedLookCard
            t={t}
            selectedStyle={selectedStyle}
            selectedHairColorLabel={selectedHairColorLabel}
            selectionNotice={localizedSelectionNotice}
            generateStatusSummary={localizedGenerateStatusSummary}
            generateButtonLabel={localizedPreviewActionLabel || previewActionLabel}
            canRunGenerate={canRunGenerate}
            onRunGenerate={onRunGenerate}
            hasGeneratedPreview={hasGeneratedPreview}
          />
        </>
      ) : null}

      {showPreviewStep ? (
        <>
          <FlowStep stepNumber={8} title={t('tryAi.preview.resultTitle')} description={t('tryAi.preview.emptyMessage')} />
          <PreviewResultCard
            t={t}
            generateStatus={generateStatus}
            generateResult={generateResult}
            generateError={generateError}
            selectedPhoto={selectedPhoto}
            selectedHairColorLabel={selectedHairColorLabel}
            selectedStyle={selectedStyle}
            comparisonView={comparisonView}
            onChangeComparisonView={setComparisonView}
          />
          {hasGeneratedPreview ? (
            <>
              <ResultDecisionCard
                t={t}
                canSaveResult={canSaveResult}
                onSaveResult={onSaveResult}
                onTryAnotherColor={handleFocusColor}
                onTryAnotherStyle={handleFocusStyle}
                onOpenProfile={onOpenProfile}
                saveMessage={saveMessage}
              />
              <StyleSuggestionRail
                language={language}
                t={t}
                catalog={haircutStyles}
                currentStyleId={selectedStyleId}
                analysisResult={analysisResult}
                onTryRecommendation={handleTryRecommendation}
              />
            </>
          ) : null}
        </>
      ) : null}

      {showPaywallPlaceholder || hasInsufficientCredits ? (
        <Card>
          <Text style={styles.cardTitle}>{t('tryAi.status.noRealCreditsTitle')}</Text>
          <Text style={styles.bodyText}>{t('tryAi.status.noRealCreditsMessage')}</Text>
        </Card>
      ) : null}

      {showInstructionCard ? (
        <BarberInstructionCard
          language={language}
          t={t}
          hasGeneratedPreview={hasGeneratedPreview}
          isExpanded={showBarberCard}
          onViewBarberCard={handleViewBarberCard}
          selectedStyle={selectedStyle}
          selectedHairColor={selectedHairColor}
          selectedHairColorLabel={selectedHairColorLabel}
          selectedPhoto={selectedPhoto}
          generateResult={generateResult}
          instructionStyleName={instructionStyleName}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepPill: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTertiary,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  focusCard: {
    borderWidth: 2,
    borderColor: colors.forest,
  },
  photoReviewFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
  },
  photoReviewImage: {
    width: '100%',
    height: 360,
    backgroundColor: colors.bgMuted,
  },
  confirmedPhotoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  confirmedPhotoImage: {
    width: 112,
    height: 112,
    borderRadius: radius.lg,
    backgroundColor: colors.bgMuted,
  },
  confirmedPhotoCopy: {
    flex: 1,
    minWidth: 160,
    gap: spacing.sm,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 40, 32, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadow.cardStrong,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  overlayBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  insightRow: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  insightItem: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.bgSubtle,
  },
  insightItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  insightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  groupStack: {
    gap: spacing.md,
  },
  recommendationRail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  recommendationCard: {
    width: 300,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  recommendationCardSelected: {
    borderColor: colors.forest,
    borderWidth: 2,
    backgroundColor: colors.mintBg,
  },
  recommendationVisual: {
    minHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recommendationVisualText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  recommendationTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  suggestionRail: {
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  suggestionCard: {
    width: 200,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  suggestionPhotoContainer: {
    height: 110,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgMuted,
  },
  suggestionPhotoFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  suggestionPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 24, 16, 0.2)',
  },
  suggestionVisual: {
    height: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionInitial: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.forestMid,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 21,
  },
  suggestionBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  colorChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  colorChipActive: {
    borderColor: colors.forest,
    borderWidth: 2,
    backgroundColor: colors.bgCard,
  },
  colorChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  colorChipLabelActive: {
    color: colors.forest,
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  colorSwatchActive: {
    borderWidth: 2.5,
    borderColor: colors.forest,
  },
  previewCard: {
    backgroundColor: colors.bgSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compareTabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.full,
    padding: 4,
  },
  compareTabButton: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareTabButtonActive: {
    backgroundColor: colors.bgCard,
    ...shadow.card,
  },
  compareTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  compareTabLabelActive: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  previewMeta: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  previewMissingText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bgMuted,
  },
  barberMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  barberMetaCard: {
    flexGrow: 1,
    minWidth: 130,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    padding: spacing.md,
    gap: 4,
  },
  barberSection: {
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  barberReferenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  barberReferenceCard: {
    flexGrow: 1,
    minWidth: 130,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgSubtle,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  barberReferenceImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: colors.bgMuted,
  },
  betaDisclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  saveMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.success,
    fontWeight: '700',
  },
});
