import { useEffect, useMemo, useState } from 'react';

import { findHairColorById, getHaircutStyleById } from '../data/catalogHelpers.js';
import { hairColors } from '../data/hairColors.js';
import { haircutStyles } from '../data/haircutStyles.js';
import {
  buildMockStyleRecommendationGroups,
  buildRecommendationGroups,
  normalizeDiscoveryItem,
} from '../data/index.js';
import { aiService, photoService } from '../services/index.js';
import { PAYWALL_PLACEHOLDER, PHOTO_QUALITY_GUIDE } from '../mock/mockData.js';
import { getFriendlyErrorMessage } from '../utils/getFriendlyErrorMessage.js';

const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_INLINE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_HAIR_COLOR_ID = 'color-espresso-black';

function estimateBase64Bytes(base64Value) {
  if (typeof base64Value !== 'string' || base64Value.length === 0) {
    return 0;
  }

  const normalized = base64Value.replace(/\s+/g, '');
  const paddingMatches = normalized.match(/=+$/);
  const paddingLength = paddingMatches ? paddingMatches[0].length : 0;

  return Math.floor((normalized.length * 3) / 4) - paddingLength;
}

function mapServerRecommendationGroups(recommendationGroups) {
  if (!recommendationGroups || typeof recommendationGroups !== 'object') {
    return [];
  }

  const sourceGroups = [
    {
      key: 'server-best-fit',
      title: 'Paling Cocok',
      reason: 'These picks came from the real AI photo analysis and local haircut catalog grounding.',
      items: recommendationGroups.palingCocok,
    },
    {
      key: 'server-safe-alternatives',
      title: 'Alternatif Aman',
      reason: 'These are safer, easier-to-wear directions based on the real AI read of the photo.',
      items: recommendationGroups.alternatifAman,
    },
    {
      key: 'server-bolder-options',
      title: 'Lebih Berani',
      reason: 'These are stronger transformation options suggested by the real AI analysis.',
      items: recommendationGroups.lebihBerani,
    },
  ];

  return sourceGroups
    .map((group) => ({
      ...group,
      items: Array.isArray(group.items) ? group.items.filter(Boolean).slice(0, 3) : [],
    }))
    .filter((group) => group.items.length > 0);
}

function normalizeStyleIdentifier(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  return item.styleId || item.id || null;
}

function normalizeAvoidStyleSet(avoidStyles) {
  const safeList = Array.isArray(avoidStyles) ? avoidStyles : [];
  return new Set(
    safeList
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean)
  );
}

function isAvoidedStyleItem(item, avoidStyleSet) {
  if (!item || item.kind !== 'style' || !(avoidStyleSet instanceof Set) || avoidStyleSet.size === 0) {
    return false;
  }

  const styleKeys = [
    item.title,
    item.name,
    item.styleId,
    item.id,
  ]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean);

  return styleKeys.some((value) => avoidStyleSet.has(value));
}

function filterAvoidedStyleItems(items, avoidStyleSet) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  return safeItems.filter((item) => !isAvoidedStyleItem(item, avoidStyleSet));
}

function getFirstStyleFromGroups(groups, allowedTitles = []) {
  const safeGroups = Array.isArray(groups) ? groups : [];
  const allowedSet = new Set((Array.isArray(allowedTitles) ? allowedTitles : []).map((item) => String(item || '').trim().toLowerCase()));

  for (const title of ['Paling Cocok', 'Alternatif Aman']) {
    const group = safeGroups.find((entry) => entry?.title === title);
    const styleItem = (Array.isArray(group?.items) ? group.items : []).find((item) => {
      if (item?.kind !== 'style') {
        return false;
      }

      if (allowedSet.size === 0) {
        return true;
      }

      const nameKey = String(item.title || item.name || '').trim().toLowerCase();
      return !allowedSet.has(nameKey);
    });

    if (styleItem) {
      return styleItem;
    }
  }

  return null;
}

function getLocalPreviewFallbackStyle(avoidStyleSet) {
  const safeCatalog = Array.isArray(haircutStyles) ? haircutStyles : [];

  const fallbackStyle = [...safeCatalog]
    .filter((style) => {
      const normalizedStyle = normalizeDiscoveryItem(style);
      return (
        normalizedStyle?.kind === 'style' &&
        !isAvoidedStyleItem(normalizedStyle, avoidStyleSet) &&
        normalizedStyle.maintenance !== 'high' &&
        normalizedStyle.riskLevel !== 'high'
      );
    })
    .sort((left, right) => {
      const rightScore = Number(right?.trendScore || 0);
      const leftScore = Number(left?.trendScore || 0);
      return rightScore - leftScore;
    })[0];

  return fallbackStyle ? normalizeDiscoveryItem(fallbackStyle) : null;
}

function getPreviewImageUri(result) {
  if (!result || typeof result !== 'object') {
    return null;
  }

  if (typeof result.previewUrl === 'string' && result.previewUrl.trim().length > 0) {
    return result.previewUrl.trim();
  }

  if (typeof result.previewBase64 === 'string' && result.previewBase64.trim().length > 0) {
    const normalizedBase64 = result.previewBase64.trim();
    return normalizedBase64.startsWith('data:image')
      ? normalizedBase64
      : `data:image/png;base64,${normalizedBase64}`;
  }

  const firstPreview = Array.isArray(result.previews) ? result.previews.find((item) => typeof item?.imageUrl === 'string' && item.imageUrl.trim().length > 0) : null;

  return firstPreview?.imageUrl || null;
}

function getDefaultHairColorItem() {
  const preferredColor = findHairColorById(hairColors, DEFAULT_HAIR_COLOR_ID);
  const fallbackColor = preferredColor || (Array.isArray(hairColors) ? hairColors[0] : null);

  return fallbackColor ? normalizeDiscoveryItem(fallbackColor) : null;
}

function hasReadablePhotoPayload(photo) {
  if (!photo || typeof photo !== 'object') {
    return false;
  }

  return (
    (typeof photo.uri === 'string' && photo.uri.trim().length > 0) ||
    (typeof photo.base64 === 'string' && photo.base64.trim().length > 0) ||
    Boolean(photo.file)
  );
}

function normalizeImagePickerAsset(asset) {
  if (!asset || typeof asset !== 'object') {
    return null;
  }

  const uri =
    typeof asset.uri === 'string' && asset.uri.trim().length > 0
      ? asset.uri.trim()
      : typeof asset.localUri === 'string' && asset.localUri.trim().length > 0
        ? asset.localUri.trim()
        : null;

  if (!uri) {
    return null;
  }

  const mimeType =
    typeof asset.mimeType === 'string' && asset.mimeType.trim().length > 0
      ? asset.mimeType.trim()
      : typeof asset.type === 'string' && /^image\//i.test(asset.type.trim())
        ? asset.type.trim()
        : undefined;

  const base64Value =
    typeof asset.base64 === 'string' && asset.base64.trim().length > 0
      ? asset.base64.trim()
      : undefined;

  return {
    uri,
    width: Number.isFinite(asset.width) ? asset.width : 0,
    height: Number.isFinite(asset.height) ? asset.height : 0,
    fileName:
      typeof asset.fileName === 'string' && asset.fileName.trim().length > 0
        ? asset.fileName.trim()
        : typeof asset.file?.name === 'string' && asset.file.name.trim().length > 0
          ? asset.file.name.trim()
          : undefined,
    mimeType,
    base64: base64Value,
    file: asset.file || null,
  };
}

function getPhotoDebugShape(photo) {
  return {
    hasUri: Boolean(typeof photo?.uri === 'string' && photo.uri.trim().length > 0),
    hasBase64: Boolean(typeof photo?.base64 === 'string' && photo.base64.trim().length > 0),
    width: Number.isFinite(photo?.width) ? photo.width : 0,
    height: Number.isFinite(photo?.height) ? photo.height : 0,
    source: photo?.sourceType || null,
  };
}

function getShortPhotoFailureReason(error) {
  const message = String(
    error?.code ||
      error?.message ||
      error?.response?.error?.code ||
      error?.response?.error?.message ||
      'unknown'
  ).trim();

  if (!message) {
    return 'unknown';
  }

  return message
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

export function useTryAiMockFlow({
  language = 'en',
  t = (key) => key,
  availableCredits = 0,
  onConsumeGenerateCredit,
  onSaveGeneratedResult,
} = {}) {
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedHairColor, setSelectedHairColor] = useState(() => getDefaultHairColorItem());
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoSession, setPhotoSession] = useState(null);
  const [photoConfirmationStatus, setPhotoConfirmationStatus] = useState('idle');
  const [photoError, setPhotoError] = useState('');

  const [analysisStatus, setAnalysisStatus] = useState('idle');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  const [generateStatus, setGenerateStatus] = useState('idle');
  const [generateResult, setGenerateResult] = useState(null);
  const [generateError, setGenerateError] = useState('');
  const [showPaywallPlaceholder, setShowPaywallPlaceholder] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasSavedCurrentResult, setHasSavedCurrentResult] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState('');
  const [hasGeneratedPreviewOnce, setHasGeneratedPreviewOnce] = useState(false);

  function resolveSelectedStyle(nextItem) {
    if (!nextItem) {
      return null;
    }

    if (nextItem.kind === 'style' && typeof nextItem.styleId === 'string') {
      const resolvedStyle = getHaircutStyleById(haircutStyles, nextItem.styleId);

      if (resolvedStyle) {
        return normalizeDiscoveryItem(resolvedStyle);
      }

      if (nextItem.title || nextItem.name || nextItem.description || nextItem.subtitle) {
        return normalizeDiscoveryItem(nextItem);
      }

      return null;
    }

    return normalizeDiscoveryItem(nextItem);
  }

  function resolveSelectedColor(nextItem) {
    if (!nextItem) {
      return null;
    }

    if (typeof nextItem === 'string') {
      const resolvedColor = findHairColorById(hairColors, nextItem);
      return resolvedColor ? normalizeDiscoveryItem(resolvedColor) : null;
    }

    const normalizedItem = normalizeDiscoveryItem(nextItem);

    if (normalizedItem?.kind === 'color') {
      return normalizedItem;
    }

    return null;
  }

  function resetGenerateStateOnly() {
    setGenerateStatus('idle');
    setGenerateResult(null);
    setGenerateError('');
    setShowPaywallPlaceholder(false);
    setSaveMessage('');
    setHasSavedCurrentResult(false);
  }

  function selectInspiration(nextItem) {
    const resolvedColor = resolveSelectedColor(nextItem);

    if (resolvedColor) {
      setSelectedHairColor(resolvedColor);
      clearTransientPhotoMessages();
      resetGenerateStateOnly();
      setSelectionNotice(
        language === 'id'
          ? `Warna diganti ke ${resolvedColor.title || resolvedColor.name || 'pilihan Anda'}.`
          : `Color updated to ${resolvedColor.title || resolvedColor.name || 'your selection'}.`
      );
      return;
    }

    const resolvedStyle = resolveSelectedStyle(nextItem);

    if (!resolvedStyle) {
      setGenerateStatus('error');
      setGenerateError(
        language === 'id'
          ? 'Gaya rambut ini belum bisa dipakai untuk preview. Silakan pilih gaya lain.'
          : 'We could not load that haircut for try-on. Please choose another style.'
      );
      return;
    }

    setSelectedStyle(resolvedStyle);
    clearTransientPhotoMessages();
    resetGenerateStateOnly();
    setSelectionNotice(
      language === 'id'
        ? `${resolvedStyle.title || resolvedStyle.name || 'Gaya pilihan'} dipilih. Ketuk Buat Preview untuk lanjut.`
        : `${resolvedStyle.title || resolvedStyle.name || 'Selected style'} selected. Tap Preview This Style to generate.`
    );
  }

  function resetAnalysisAndGenerateState() {
    setAnalysisStatus('idle');
    setAnalysisResult(null);
    setAnalysisError('');
    setGenerateStatus('idle');
    setGenerateResult(null);
    setGenerateError('');
    setShowPaywallPlaceholder(false);
    setSaveMessage('');
    setHasSavedCurrentResult(false);
    setHasGeneratedPreviewOnce(false);
    setSelectionNotice('');
  }

  function clearTransientPhotoMessages() {
    setPhotoError('');
    setAnalysisError('');
    setGenerateError('');
  }

  function getFriendlyPickerError(sourceType) {
    if (language === 'id') {
      return sourceType === 'camera'
        ? 'Akses kamera belum tersedia saat ini. Coba lagi di build Expo yang mendukung.'
        : 'Akses galeri belum tersedia saat ini. Coba lagi di build Expo yang mendukung.';
    }

    return sourceType === 'camera'
      ? 'Camera access is not available right now. Try again on a supported Expo device build.'
      : 'Gallery access is not available right now. Try again on a supported Expo device build.';
  }

  function createSelectedPhoto(asset, sourceType) {
    const normalizedAsset = normalizeImagePickerAsset(asset);

    if (!normalizedAsset) {
      return null;
    }

    const base64Value = normalizedAsset.base64;
    const estimatedInlineBytes = estimateBase64Bytes(base64Value);
    const resolvedMimeType =
      normalizedAsset.mimeType ||
      (typeof normalizedAsset.uri === 'string' && /\.png(\?|$)/i.test(normalizedAsset.uri)
        ? 'image/png'
        : typeof normalizedAsset.uri === 'string' && /\.webp(\?|$)/i.test(normalizedAsset.uri)
          ? 'image/webp'
          : 'image/jpeg');

    return {
      uri: normalizedAsset.uri,
      width: normalizedAsset.width || 0,
      height: normalizedAsset.height || 0,
      sourceType,
      fileName: normalizedAsset.fileName,
      mimeType: resolvedMimeType,
      base64: base64Value,
      estimatedInlineBytes,
      base64TooLarge: estimatedInlineBytes > MAX_INLINE_IMAGE_BYTES,
      unsupportedMimeType: Boolean(
        resolvedMimeType &&
          !SUPPORTED_INLINE_MIME_TYPES.has(resolvedMimeType)
      ),
      file: normalizedAsset.file || null,
    };
  }

  async function loadImagePicker() {
    try {
      const module = await import('expo-image-picker');

      if (
        !module ||
        typeof module.launchCameraAsync !== 'function' ||
        typeof module.launchImageLibraryAsync !== 'function'
      ) {
        return null;
      }

      return module;
    } catch {
      return null;
    }
  }

  function buildPickerOptions(ImagePicker) {
    return {
      allowsEditing: true,
      base64: true,
      quality: 0.65,
      mediaTypes: ImagePicker.MediaTypeOptions?.Images,
    };
  }

  function applySelectedPhoto(asset, sourceType) {
    const nextSelectedPhoto = createSelectedPhoto(asset, sourceType);

    if (!nextSelectedPhoto) {
      setPhotoError(
        language === 'id'
          ? 'Foto tidak bisa dibaca. Coba pilih foto lain.'
          : 'We could not read that photo. Please choose another one.'
      );
      return;
    }

    console.info('[try-ai][photo] selected', getPhotoDebugShape(nextSelectedPhoto));

    if (photoError) {
      console.info('[try-ai][photo] clearing stale error');
    }

    setSelectedPhoto(nextSelectedPhoto);
    setPhotoSession(null);
    setPhotoConfirmationStatus('idle');
    clearTransientPhotoMessages();
    resetAnalysisAndGenerateState();
  }

  async function takePhoto() {
    const ImagePicker = await loadImagePicker();

    if (!ImagePicker) {
      setPhotoError(getFriendlyPickerError('camera'));
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        setPhotoError(
          language === 'id'
            ? 'Izin kamera ditolak. Izinkan akses kamera untuk mengambil foto.'
            : 'Camera permission was denied. Please allow camera access to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync(buildPickerOptions(ImagePicker));

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        setPhotoError(
          language === 'id'
            ? 'Foto dari kamera tidak berhasil dipakai. Coba lagi.'
            : 'No photo was returned from the camera. Please try again.'
        );
        return;
      }

      applySelectedPhoto(asset, 'camera');
    } catch {
      setPhotoError(getFriendlyPickerError('camera'));
    }
  }

  async function uploadFromGallery() {
    const ImagePicker = await loadImagePicker();

    if (!ImagePicker) {
      setPhotoError(getFriendlyPickerError('gallery'));
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setPhotoError(
          language === 'id'
            ? 'Izin galeri ditolak. Izinkan akses galeri untuk memilih foto.'
            : 'Gallery permission was denied. Please allow photo library access to choose an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync(buildPickerOptions(ImagePicker));

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset?.uri) {
        setPhotoError(
          language === 'id'
            ? 'Foto dari galeri tidak berhasil dipakai. Coba lagi.'
            : 'No image was returned from the gallery. Please try again.'
        );
        return;
      }

      applySelectedPhoto(asset, 'gallery');
    } catch {
      setPhotoError(getFriendlyPickerError('gallery'));
    }
  }

  async function confirmPhoto() {
    if (!selectedPhoto) {
      return;
    }

    try {
      console.info('[try-ai][photo] confirm starting', {
        hasUri: Boolean(typeof selectedPhoto?.uri === 'string' && selectedPhoto.uri.trim().length > 0),
        hasBase64: Boolean(typeof selectedPhoto?.base64 === 'string' && selectedPhoto.base64.trim().length > 0),
      });

      if (!hasReadablePhotoPayload(selectedPhoto)) {
        throw new Error(
          language === 'id'
            ? 'Foto tidak memiliki data yang bisa dipakai.'
            : 'The photo does not contain usable image data.'
        );
      }

      setPhotoConfirmationStatus('loading');
      setPhotoError('');
      setPhotoSession(null);
      resetAnalysisAndGenerateState();

      const confirmedSession = await photoService.confirmUpload(selectedPhoto);

      setPhotoSession(confirmedSession);
      setPhotoConfirmationStatus('success');
      clearTransientPhotoMessages();
      console.info('[try-ai][photo] confirm success', {
        photoSessionId: confirmedSession?.photoSessionId || null,
      });
    } catch (caughtError) {
      setPhotoConfirmationStatus('error');
      setPhotoSession(null);
      console.warn('[try-ai][photo] confirm failed', {
        reason: getShortPhotoFailureReason(caughtError),
      });
      const friendlyErrorMessage = getFriendlyErrorMessage(caughtError);
      setPhotoError(
        typeof friendlyErrorMessage === 'string' &&
          friendlyErrorMessage.trim().length > 0 &&
          !/invalid|openai|backend|network|http|stack/i.test(friendlyErrorMessage)
          ? friendlyErrorMessage
          : t('tryAi.photo.status.confirmFailedMessage')
      );
    }
  }

  function clearPhotoSelection() {
    setSelectedPhoto(null);
    setPhotoSession(null);
    setPhotoConfirmationStatus('idle');
    setPhotoError('');
    resetAnalysisAndGenerateState();
  }

  async function runAnalysis() {
    if (!selectedPhoto || !photoSession) {
      setAnalysisError(t('tryAi.analyze.hint.confirmPhoto'));
      setAnalysisStatus('error');
      return;
    }

    if (selectedPhoto.base64TooLarge) {
      setAnalysisError(
        language === 'id'
          ? 'Ukuran foto terlalu besar untuk dianalisis saat ini. Coba gunakan foto yang lebih kecil atau lebih ringan.'
          : 'Selected image is too large for AI analysis right now. Please use a smaller or more compressed photo.'
      );
      setAnalysisStatus('error');
      return;
    }

    if (selectedPhoto.unsupportedMimeType) {
      setAnalysisError(
        language === 'id'
          ? 'Format foto belum didukung untuk analisis AI. Gunakan foto JPEG, PNG, atau WebP.'
          : 'Selected image format is not supported for AI analysis. Please use a JPEG, PNG, or WebP photo.'
      );
      setAnalysisStatus('error');
      return;
    }

    try {
      setAnalysisStatus('loading');
      setAnalysisError('');
      const response = await aiService.analyzePhoto({
        photoSessionId: photoSession.photoSessionId,
        imageBase64: selectedPhoto.base64,
        mimeType: selectedPhoto.mimeType || 'image/jpeg',
        width: selectedPhoto.width,
        height: selectedPhoto.height,
        source: selectedPhoto.sourceType,
        selectedStyleId: selectedStyle?.styleId || selectedStyle?.id,
        selectedHairColor: selectedHairColor?.id,
        notes: selectedStyle
          ? `Use ${selectedStyle.title} as the inspiration direction from the confirmed ${selectedPhoto.sourceType} upload.`
          : `Use a versatile public-beta haircut direction from the confirmed ${selectedPhoto.sourceType} upload.`,
      });
      setAnalysisResult(response);
      setAnalysisStatus('success');
    } catch (caughtError) {
      const friendlyErrorMessage = getFriendlyErrorMessage(caughtError);
      setAnalysisError(
        typeof friendlyErrorMessage === 'string' &&
          friendlyErrorMessage.trim().length > 0 &&
          !/openai|backend|json|stack|http/i.test(friendlyErrorMessage)
          ? friendlyErrorMessage
          : t('tryAi.analyze.status.errorMessage')
      );
      setAnalysisStatus('error');
    }
  }

  function resolvePreviewStyle(styleOverride) {
    const explicitStyle = resolveSelectedStyle(styleOverride);

    if (explicitStyle && !isAvoidedStyleItem(explicitStyle, avoidStyleSet)) {
      return explicitStyle;
    }

    if (selectedStyle && !isAvoidedStyleItem(selectedStyle, avoidStyleSet)) {
      return selectedStyle;
    }

    const groupedFallback = getFirstStyleFromGroups(recommendationGroups, Array.from(avoidStyleSet));

    if (groupedFallback) {
      return resolveSelectedStyle(groupedFallback);
    }

    return getLocalPreviewFallbackStyle(avoidStyleSet);
  }

  function resolvePreviewColor(colorOverride) {
    return (
      resolveSelectedColor(colorOverride) ||
      selectedHairColor ||
      getDefaultHairColorItem() ||
      null
    );
  }

  async function generateWithSelection({ styleOverride, colorOverride } = {}) {
    if (!selectedPhoto || !photoSession) {
      setGenerateError(
        language === 'id'
          ? 'Konfirmasi foto terlebih dahulu agar preview bisa dibuat.'
          : 'Confirm a photo first so we can prepare a preview.'
      );
      setGenerateStatus('error');
      return;
    }

    if (availableCredits <= 0) {
      setShowPaywallPlaceholder(true);
      setGenerateError('');
      setGenerateStatus('idle');
      return;
    }

    if (selectedPhoto.base64TooLarge) {
      setGenerateError(
        language === 'id'
          ? 'Ukuran foto terlalu besar untuk preview saat ini. Coba gunakan foto yang lebih kecil atau lebih ringan.'
          : 'Selected image is too large for AI preview right now. Please use a smaller or more compressed photo.'
      );
      setGenerateStatus('error');
      return;
    }

    if (selectedPhoto.unsupportedMimeType) {
      setGenerateError(
        language === 'id'
          ? 'Format foto belum didukung untuk preview AI. Gunakan foto JPEG, PNG, atau WebP.'
          : 'Selected image format is not supported for AI preview. Please use a JPEG, PNG, or WebP photo.'
      );
      setGenerateStatus('error');
      return;
    }

    const resolvedPreviewStyle = resolvePreviewStyle(styleOverride);
    const resolvedPreviewColor = resolvePreviewColor(colorOverride);

    if (!resolvedPreviewStyle) {
      setGenerateError(
        language === 'id'
          ? 'Pilih gaya rambut terlebih dahulu agar preview bisa dibuat.'
          : 'Choose a haircut first so we can generate a try-on preview.'
      );
      setGenerateStatus('error');
      return;
    }

    try {
      setShowPaywallPlaceholder(false);
      setGenerateStatus('loading');
      setGenerateError('');
      setSaveMessage('');

      if (normalizeStyleIdentifier(selectedStyle) !== normalizeStyleIdentifier(resolvedPreviewStyle)) {
        setSelectedStyle(resolvedPreviewStyle);
      }

      if (resolvedPreviewColor && selectedHairColor?.id !== resolvedPreviewColor.id) {
        setSelectedHairColor(resolvedPreviewColor);
      }

      const response = await aiService.generatePreview({
        prompt: `Preview a haircut inspired by ${resolvedPreviewStyle.title || resolvedPreviewStyle.name || 'the selected style'} on the confirmed photo`,
        analysisId: analysisResult?.analysisId || photoSession.photoSessionId,
        photoSessionId: photoSession.photoSessionId,
        imageBase64: selectedPhoto.base64,
        mimeType: selectedPhoto.mimeType || 'image/jpeg',
        source: selectedPhoto.sourceType,
        selectedStyleId: resolvedPreviewStyle?.styleId || resolvedPreviewStyle?.id,
        selectedStyleName: resolvedPreviewStyle?.title || resolvedPreviewStyle?.name,
        selectedHairColor: resolvedPreviewColor?.id,
        variations: 2,
      });
      const previewImageUri = getPreviewImageUri(response);

      if (response?.modeUsed === 'real' && !previewImageUri) {
        setGenerateResult(null);
        setGenerateError(
          language === 'id'
            ? 'Preview selesai dibuat, tetapi gambar belum tersedia.'
            : 'Preview finished but no image was returned.'
        );
        setGenerateStatus('error');
        return;
      }

      setGenerateResult(response);
      setGenerateStatus('success');
      setHasSavedCurrentResult(false);
      setHasGeneratedPreviewOnce(true);
      setSelectionNotice(
        language === 'id'
          ? `${resolvedPreviewStyle?.title || resolvedPreviewStyle?.name || 'Look pilihan'} dipilih. Preview siap.`
          : `${resolvedPreviewStyle?.title || resolvedPreviewStyle?.name || 'Selected look'} selected. Preview ready.`
      );
      onConsumeGenerateCredit?.();
    } catch (caughtError) {
      const friendlyErrorMessage = getFriendlyErrorMessage(caughtError);
      setGenerateError(
        typeof friendlyErrorMessage === 'string' &&
          friendlyErrorMessage.trim().length > 0 &&
          !/openai|backend|json|stack|http/i.test(friendlyErrorMessage)
          ? friendlyErrorMessage
          : t('tryAi.preview.errorMessage')
      );
      setGenerateStatus('error');
    }
  }

  async function runGenerate() {
    return generateWithSelection();
  }

  async function tryThisLook(nextItem, { autoGenerateIfReady = false } = {}) {
    const resolvedStyle = resolveSelectedStyle(nextItem);

    if (!resolvedStyle) {
      setGenerateStatus('error');
      setGenerateError(
        language === 'id'
          ? 'Gaya rambut ini belum bisa dipakai untuk preview. Silakan pilih gaya lain.'
          : 'We could not load that haircut for try-on. Please choose another style.'
      );
      return;
    }

    if (isAvoidedStyleItem(resolvedStyle, avoidStyleSet)) {
      setGenerateStatus('error');
      setGenerateError(
        language === 'id'
          ? `${resolvedStyle.title || resolvedStyle.name || 'Gaya ini'} sedang disarankan untuk dihindari. Silakan pilih rekomendasi lain terlebih dahulu.`
          : `${resolvedStyle.title || resolvedStyle.name || 'That style'} is currently marked as a style to avoid. Please choose another recommendation first.`
      );
      return;
    }

    const resolvedColor = resolvePreviewColor();

    setSelectedStyle(resolvedStyle);

    if (resolvedColor && selectedHairColor?.id !== resolvedColor.id) {
      setSelectedHairColor(resolvedColor);
    }

    clearTransientPhotoMessages();
    resetGenerateStateOnly();
    setSelectionNotice(
      language === 'id'
        ? `${resolvedStyle.title || resolvedStyle.name || 'Gaya pilihan'} dipilih. Ketuk Buat Preview untuk lanjut.`
        : `${resolvedStyle.title || resolvedStyle.name || 'Selected style'} selected. Tap Preview This Style to generate.`
    );

    const canAutoGenerateNow =
      autoGenerateIfReady &&
      Boolean(selectedPhoto) &&
      Boolean(photoSession) &&
      !hasInsufficientCredits &&
      !selectedPhoto.base64TooLarge &&
      !selectedPhoto.unsupportedMimeType;

    if (canAutoGenerateNow) {
      await generateWithSelection({
        styleOverride: resolvedStyle,
        colorOverride: resolvedColor,
      });
    }
  }

  async function saveResult() {
    if (!generateResult || hasSavedCurrentResult) {
      return null;
    }

    try {
      const savedItem = await onSaveGeneratedResult?.({
        generateResult,
        instructionStyleName,
        selectedHairColorLabel,
        selectedStyle,
      });

      if (savedItem) {
        setHasSavedCurrentResult(true);
        setSaveMessage(t('tryAi.preview.saveSuccess'));
      }

      return savedItem;
    } catch (caughtError) {
      setSaveMessage(getFriendlyErrorMessage(caughtError));
      return null;
    }
  }

  const instructionStyleName = useMemo(
    () => selectedStyle?.title || generateResult?.previews?.[0]?.styleName || 'Recommended Look',
    [generateResult, selectedStyle]
  );

  const selectedHairColorLabel = useMemo(
    () => selectedHairColor?.title || selectedHairColor?.name || null,
    [selectedHairColor]
  );

  const mockRecommendationGroups = useMemo(
    () =>
      buildMockStyleRecommendationGroups({
        selectedInspiration: selectedStyle,
      }),
    [selectedStyle]
  );

  const avoidStyleSet = useMemo(
    () => normalizeAvoidStyleSet(analysisResult?.result?.avoidStyles),
    [analysisResult]
  );

  const recommendationGroups = useMemo(
    () => {
      const serverGroups = mapServerRecommendationGroups(analysisResult?.result?.recommendationGroups)
        .map((group) => ({
          ...group,
          items: filterAvoidedStyleItems(group.items, avoidStyleSet),
        }))
        .filter((group) => Array.isArray(group.items) && group.items.length > 0);

      if (serverGroups.length > 0) {
        return serverGroups;
      }

      return buildRecommendationGroups({
        analysisResult,
        selectedInspiration: selectedStyle,
      })
        .map((group) => ({
          ...group,
          items: filterAvoidedStyleItems(group.items, avoidStyleSet),
        }))
        .filter((group) => Array.isArray(group.items) && group.items.length > 0);
    },
    [analysisResult, avoidStyleSet, selectedStyle]
  );

  useEffect(() => {
    if (analysisStatus !== 'success' || selectedStyle) {
      return;
    }

    const nextDefaultStyle =
      getFirstStyleFromGroups(recommendationGroups, Array.from(avoidStyleSet)) ||
      getLocalPreviewFallbackStyle(avoidStyleSet);

    if (nextDefaultStyle) {
      const resolvedDefaultStyle = resolveSelectedStyle(nextDefaultStyle);

      if (resolvedDefaultStyle) {
        setSelectedStyle(resolvedDefaultStyle);
        setSelectionNotice(
          language === 'id'
            ? `${resolvedDefaultStyle.title || resolvedDefaultStyle.name || 'Gaya pilihan'} dipilih. Ketuk Buat Preview untuk lanjut.`
            : `${resolvedDefaultStyle.title || resolvedDefaultStyle.name || 'Selected style'} selected. Tap Preview This Style to generate.`
        );
      }
    }
  }, [analysisStatus, avoidStyleSet, language, recommendationGroups, selectedStyle]);

  const isPhotoBusy = photoConfirmationStatus === 'loading';
  const isAnalysisBusy = analysisStatus === 'loading';
  const isGenerateBusy = generateStatus === 'loading';
  const hasConfirmedPhoto = Boolean(selectedPhoto) && Boolean(photoSession);
  const hasInsufficientCredits = availableCredits <= 0;
  const isAnyActionBusy = isPhotoBusy || isAnalysisBusy || isGenerateBusy;
  const hasSelectedPhotoPayload = hasReadablePhotoPayload(selectedPhoto);

  useEffect(() => {
    if (
      selectedPhoto &&
      hasSelectedPhotoPayload &&
      photoError &&
      photoConfirmationStatus !== 'error'
    ) {
      console.info('[try-ai][photo] clearing stale error');
      setPhotoError('');
    }
  }, [hasSelectedPhotoPayload, photoConfirmationStatus, photoError, selectedPhoto]);

  const photoInputState = useMemo(() => {
    if (!selectedPhoto) {
      return 'empty';
    }

    if (photoConfirmationStatus === 'loading') {
      return 'confirming';
    }

    return photoSession ? 'confirmed' : 'selected';
  }, [photoConfirmationStatus, photoSession, selectedPhoto]);

  const photoStatus = useMemo(() => {
    const shouldShowPhotoError =
      Boolean(photoError) &&
      (photoConfirmationStatus === 'error' || !selectedPhoto || !hasSelectedPhotoPayload);

    if (shouldShowPhotoError) {
      return {
        tone: 'error',
        title: 'Photo action needs attention',
        message: photoError,
      };
    }

    if (!selectedPhoto) {
      return {
        tone: 'info',
        title: 'No photo selected yet',
        message: 'Take a photo or upload one from the gallery to begin your beta look preview.',
      };
    }

    if (photoConfirmationStatus === 'loading') {
      return {
        tone: 'info',
        title: 'Confirming your photo',
        message: 'We are creating a lightweight upload session before analysis begins.',
      };
    }

    if (photoSession) {
      return {
        tone: 'success',
        title: 'Photo confirmed',
        message: `Upload session ready: ${photoSession.photoSessionId}`,
      };
    }

    return {
      tone: 'info',
      title: 'Photo ready to confirm',
      message: 'Review the photo, then confirm it so Analyze My Look can unlock.',
    };
  }, [hasSelectedPhotoPayload, photoConfirmationStatus, photoError, photoSession, selectedPhoto]);

  const analysisStatusSummary = useMemo(() => {
    if (analysisStatus === 'loading') {
      return {
        tone: 'info',
        title: 'Analyzing your look',
        message: 'We are using the confirmed beta photo session to prepare recommendation groups.',
      };
    }

    if (analysisStatus === 'error' && analysisError) {
      return {
        tone: 'error',
        title: 'Analysis needs attention',
        message: analysisError,
      };
    }

    if (analysisStatus === 'success') {
      return {
        tone: 'success',
        title: 'Analysis complete',
        message: 'Your first recommendation groups are ready below.',
      };
    }

    return {
      tone: 'info',
      title: 'Analysis not started',
      message: 'Confirm a photo first, then analyze your look for the beta recommendation layer.',
    };
  }, [analysisError, analysisStatus]);

  const generateStatusSummary = useMemo(() => {
    if (hasInsufficientCredits && hasConfirmedPhoto) {
      return {
        tone: 'warning',
        title: 'Insufficient credits',
        message: 'Preview generation is paused until credits are restored. Payment is not active in this beta.',
      };
    }

    if (generateStatus === 'loading') {
      return {
        tone: 'info',
        title: 'Preparing your preview',
        message: 'The preview step is running now. Credits only deduct after a successful result.',
      };
    }

    if (generateStatus === 'error' && generateError) {
      return {
        tone: 'error',
        title: 'Preview needs attention',
        message: generateError,
      };
    }

    if (generateStatus === 'success') {
      return {
        tone: 'success',
        title: 'Preview ready',
        message: 'Your preview result is ready and one beta credit was consumed after success.',
      };
    }

    return {
      tone: 'info',
      title: 'Preview not started',
      message: 'Preview This Style is still beta-only and uses 1 credit after a successful response.',
    };
  }, [generateError, generateStatus, hasConfirmedPhoto, hasInsufficientCredits]);

  const analysisActionHint = useMemo(() => {
    if (isAnyActionBusy) {
      return 'Please wait for the current step to finish.';
    }

    if (!selectedPhoto) {
      return 'Select a photo first.';
    }

    if (!photoSession) {
      return 'Confirm the selected photo first.';
    }

    return 'Ready to analyze your look.';
  }, [isAnyActionBusy, photoSession, selectedPhoto]);

  const generateActionHint = useMemo(() => {
    if (isAnyActionBusy) {
      return 'Please wait for the current step to finish.';
    }

    if (!selectedPhoto) {
      return 'Add and confirm a photo first.';
    }

    if (!photoSession) {
      return 'Add and confirm a photo first.';
    }

    if (!selectedStyle) {
      return 'Choose a hairstyle from the recommendations.';
    }

    if (hasInsufficientCredits) {
      return 'No beta credits left right now.';
    }

    return 'Ready to generate a real try-on preview using 1 credit after success.';
  }, [hasInsufficientCredits, isAnyActionBusy, photoSession, selectedPhoto, selectedStyle]);

  const previewActionLabel = useMemo(
    () => (hasGeneratedPreviewOnce ? 'Generate Updated Look' : 'Preview This Style'),
    [hasGeneratedPreviewOnce]
  );

  const selectedStyleId = useMemo(
    () => normalizeStyleIdentifier(selectedStyle),
    [selectedStyle]
  );

  return {
    analysisError,
    analysisResult,
    analysisStatus,
    analysisStatusSummary,
    analysisActionHint,
    availableCredits,
    canSaveResult: Boolean(generateResult) && !hasSavedCurrentResult,
    canRunAnalysis: Boolean(selectedPhoto) && Boolean(photoSession) && !isAnyActionBusy,
    canRunGenerate:
      Boolean(selectedPhoto) &&
      Boolean(photoSession) &&
      Boolean(selectedStyle) &&
      !isAnyActionBusy &&
      !hasInsufficientCredits,
    clearPhotoSelection,
    confirmPhoto,
    generateActionHint,
    takePhoto,
    uploadFromGallery,
    generateError,
    generateResult,
    generateStatus,
    generateStatusSummary,
    hasInsufficientCredits,
    instructionStyleName,
    mockRecommendationGroups,
    paywallMessage: PAYWALL_PLACEHOLDER.message,
    paywallTitle: PAYWALL_PLACEHOLDER.title,
    photoConfirmationStatus,
    photoError,
    photoInputState,
    photoQualityGuide: PHOTO_QUALITY_GUIDE,
    photoSession,
    photoStatus,
    previewActionLabel,
    recommendationGroups,
    saveMessage,
    selectionNotice,
    selectedHairColor,
    selectedHairColorLabel,
    selectedStyleId,
    selectedStyle,
    selectedPhoto,
    setSelectedHairColorById: (colorId) => {
      const resolvedColor = resolveSelectedColor(colorId);

      if (!resolvedColor) {
        return;
      }

      setSelectedHairColor(resolvedColor);
      clearTransientPhotoMessages();
      resetGenerateStateOnly();
      setSelectionNotice(
        language === 'id'
          ? `Warna diganti ke ${resolvedColor.title || resolvedColor.name || 'pilihan Anda'}.`
          : `Color updated to ${resolvedColor.title || resolvedColor.name || 'your selection'}.`
      );
    },
    selectInspiration,
    showInstructionCard: Boolean(analysisResult || generateResult || selectedStyle),
    showPaywallPlaceholder,
    runAnalysis,
    runGenerate,
    saveResult,
    tryThisLook,
  };
}
