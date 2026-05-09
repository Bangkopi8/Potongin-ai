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
import { hairColors } from '../data/hairColors.js';
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

function FlowStep({ step, title, description }) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepEyebrow}>{step}</Text>
      <Text style={styles.stepTitle}>{title}</Text>
      {description ? <Text style={styles.stepDescription}>{description}</Text> : null}
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
          <ActivityIndicator size="large" color="#1b4332" />
          <Text style={styles.overlayTitle}>{t('tryAi.analyze.overlayTitle')}</Text>
          <Text style={styles.overlayBody}>{t('tryAi.analyze.overlayMessage')}</Text>
        </View>
      </View>
    </Modal>
  );
}

function PhotoSourceStepCard({
  t,
  status,
  onTakePhoto,
  onUploadFromGallery,
  isBusy,
}) {
  return (
    <Card accent="rose">
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
    <Card accent="sky">
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
    <Card accent="mint">
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
      <View style={[styles.colorSwatch, { backgroundColor: color?.hex || '#d7b998' }]} />
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
      <Card accent="amber" style={highlighted ? styles.focusCard : null}>
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
    <Card accent="rose">
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

function HairColorPicker({
  t,
  selectedHairColor,
  onSelectHairColor,
  hasGeneratedPreview,
  highlighted = false,
}) {
  const safeColors = Array.isArray(hairColors) ? hairColors.filter(Boolean) : [];

  return (
    <Card accent="sky" style={highlighted ? styles.focusCard : null}>
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

  return (
    <Card accent="mint">
      <Text style={styles.cardTitle}>{t('tryAi.insight.title')}</Text>
      <View style={styles.insightGrid}>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('tryAi.insight.faceShape')}</Text>
          <Text style={styles.insightValue}>
            {localizeMetadataValue(
              analysisResult?.result?.faceShape || t('tryAi.colorPicker.none'),
              language,
              t('tryAi.colorPicker.none')
            )}
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('tryAi.insight.hairCondition')}</Text>
          <Text style={styles.insightValue}>
            {localizeMetadataValue(
              analysisResult?.result?.hairCondition || analysisResult?.result?.hairType || t('tryAi.colorPicker.none'),
              language,
              t('tryAi.colorPicker.none')
            )}
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>{t('tryAi.insight.confidence')}</Text>
          <Text style={styles.insightValue}>
            {typeof analysisResult?.result?.confidence === 'number'
              ? `${(analysisResult.result.confidence * 100).toFixed(0)}%`
              : t('tryAi.colorPicker.none')}
          </Text>
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
      <Card accent="sky">
        <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
        <EmptyState title={t('tryAi.preview.emptyTitle')} message={t('tryAi.preview.emptyMessage')} />
      </Card>
    );
  }

  if (generateStatus === 'loading') {
    return (
      <Card accent="sky">
        <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
        <LoadingState message={t('tryAi.preview.loadingMessage')} />
      </Card>
    );
  }

  if (generateStatus === 'error') {
    return (
      <Card accent="sky">
        <Text style={styles.cardTitle}>{t('tryAi.preview.resultTitle')}</Text>
        <ErrorState
          title={t('tryAi.preview.errorTitle')}
          message={getCustomerFacingErrorMessage(generateError, t('tryAi.preview.errorMessage'))}
        />
      </Card>
    );
  }

  return (
    <Card accent="sky">
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
    <Card accent="mint">
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
      <Card accent="rose">
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
      <Card accent="rose">
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
    <Card accent="rose">
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

  const stepLabelPrefix = language === 'id' ? 'Langkah' : 'Step';
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

      <FlowStep
        step={`${stepLabelPrefix} 1`}
        title={t('tryAi.steps.addPhoto.title')}
        description={t('tryAi.steps.addPhoto.description')}
      />

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
          <FlowStep
            step={`${stepLabelPrefix} 2`}
            title={t('tryAi.photo.reviewTitle')}
            description={t('tryAi.photo.reviewBody')}
          />
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
          <FlowStep
            step={`${stepLabelPrefix} 3`}
            title={t('tryAi.photo.confirmStepTitle')}
            description={t('tryAi.photo.confirmStepBody')}
          />
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
          <FlowStep
            step={`${stepLabelPrefix} 4`}
            title={t('tryAi.steps.analyze.title')}
            description={t('tryAi.steps.analyze.description')}
          />
          <ConfirmedPhotoCard t={t} selectedPhoto={selectedPhoto} onResetPhoto={onResetPhoto} />
          <Card accent="mint">
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
          <FlowStep
            step={`${stepLabelPrefix} 5`}
            title={t('tryAi.steps.chooseStyle.title')}
            description={t('tryAi.steps.chooseStyle.description')}
          />
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
          <FlowStep
            step={`${stepLabelPrefix} 6`}
            title={t('tryAi.colorPicker.chooseTitle')}
            description={t('tryAi.colorPicker.body')}
          />
          <HairColorPicker
            t={t}
            selectedHairColor={selectedHairColor}
            onSelectHairColor={handleSelectHairColor}
            hasGeneratedPreview={hasGeneratedPreview}
            highlighted={focusTarget === 'color'}
          />
          <FlowStep
            step={`${stepLabelPrefix} 7`}
            title={t('tryAi.steps.generate.title')}
            description={t('tryAi.steps.generate.description')}
          />
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
          <FlowStep
            step={`${stepLabelPrefix} 8`}
            title={t('tryAi.preview.resultTitle')}
            description={t('tryAi.preview.emptyMessage')}
          />
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
            <ResultDecisionCard
              t={t}
              canSaveResult={canSaveResult}
              onSaveResult={onSaveResult}
              onTryAnotherColor={handleFocusColor}
              onTryAnotherStyle={handleFocusStyle}
              onOpenProfile={onOpenProfile}
              saveMessage={saveMessage}
            />
          ) : null}
        </>
      ) : null}

      {showPaywallPlaceholder || hasInsufficientCredits ? (
        <Card accent="amber">
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
    gap: 4,
  },
  stepEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 11,
    fontWeight: '800',
    color: '#c96f4a',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102a22',
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#56685f',
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
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7a6652',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  resultHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#132f26',
  },
  bulletLine: {
    fontSize: 14,
    lineHeight: 21,
    color: '#42564d',
  },
  buttonStack: {
    gap: 10,
  },
  focusCard: {
    borderWidth: 1,
    borderColor: '#1b4332',
  },
  photoReviewFrame: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eadac3',
    backgroundColor: '#f8f3eb',
    padding: 12,
  },
  photoReviewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    backgroundColor: '#eadac3',
  },
  confirmedPhotoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  confirmedPhotoImage: {
    width: 120,
    height: 120,
    borderRadius: 18,
    backgroundColor: '#eadac3',
  },
  confirmedPhotoCopy: {
    flex: 1,
    minWidth: 180,
    gap: 8,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: '#102a22aa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: '#fffaf3',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102a22',
    textAlign: 'center',
  },
  overlayBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#56685f',
    textAlign: 'center',
  },
  insightGrid: {
    gap: 10,
  },
  insightItem: {
    borderRadius: 16,
    backgroundColor: '#fffaf3',
    borderWidth: 1,
    borderColor: '#d7e9dd',
    padding: 12,
    gap: 4,
  },
  insightLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5f6f65',
    fontWeight: '700',
  },
  insightValue: {
    fontSize: 15,
    lineHeight: 21,
    color: '#14342b',
    fontWeight: '800',
  },
  groupStack: {
    gap: 12,
  },
  recommendationRail: {
    gap: 12,
    paddingRight: 20,
  },
  recommendationCard: {
    width: 284,
    backgroundColor: '#fffaf3',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#eadac3',
  },
  recommendationCardSelected: {
    borderColor: '#1b4332',
    backgroundColor: '#f3fbf6',
  },
  recommendationVisual: {
    minHeight: 132,
    borderRadius: 18,
    backgroundColor: '#f4efe6',
    borderWidth: 1,
    borderColor: '#eadac3',
    padding: 14,
    justifyContent: 'space-between',
    gap: 8,
  },
  recommendationVisualText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#56685f',
    fontWeight: '700',
  },
  recommendationTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
    color: '#102a22',
  },
  recommendationDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#46594f',
  },
  colorChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b9ccf3',
    backgroundColor: '#fffaf3',
  },
  colorChipActive: {
    borderColor: '#1b4332',
    backgroundColor: '#1b4332',
  },
  colorChipLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#375147',
  },
  colorChipLabelActive: {
    color: '#fffaf3',
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff66',
  },
  previewCard: {
    backgroundColor: '#f8f3eb',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#eadac3',
  },
  compareTabRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  compareTabButton: {
    flexGrow: 1,
    minWidth: 110,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#f1e8da',
    borderWidth: 1,
    borderColor: '#dfd0bd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compareTabButtonActive: {
    backgroundColor: '#14342b',
    borderColor: '#14342b',
  },
  compareTabLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#42594f',
  },
  compareTabLabelActive: {
    color: '#fffaf3',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102a22',
  },
  previewMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
  previewMissingText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8b4b3b',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#eadac3',
  },
  barberMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  barberMetaCard: {
    flexGrow: 1,
    minWidth: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eadac3',
    backgroundColor: '#fffaf3',
    padding: 12,
    gap: 4,
  },
  barberSection: {
    gap: 6,
  },
  instructionTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    color: '#102a22',
  },
  barberReferenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  barberReferenceCard: {
    flexGrow: 1,
    minWidth: 130,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eadac3',
    backgroundColor: '#fffaf3',
    padding: 10,
    gap: 8,
  },
  barberReferenceImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: '#eadac3',
  },
  betaDisclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
  },
  saveRow: {
    gap: 10,
  },
  saveMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#46594f',
    fontWeight: '700',
  },
});
