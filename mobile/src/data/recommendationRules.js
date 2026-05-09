import { deriveColorRiskLevel, mapColorFamilyToHex } from './catalogHelpers.js';
import { femaleHaircutStyles } from './femaleHaircutStyles.js';
import { hairColorOptions } from './hairColorOptions.js';
import { maleHaircutStyles } from './maleHaircutStyles.js';
import { unisexHaircutStyles } from './unisexHaircutStyles.js';

export const PUBLIC_BETA_FILTERS = [
  'Men',
  'Women',
  'Unisex',
  'Colors',
  'Trending',
  'Low Maintenance',
  'Professional',
  'Bold',
];

function normalizeStyle(style) {
  return {
    ...style,
    kind: 'style',
    title: style.name,
    subtitle: style.description,
    shortDescription: style.description,
    colorHex: null,
  };
}

function normalizeColor(color) {
  return {
    ...color,
    kind: 'color',
    title: color.name,
    subtitle: color.description,
    shortDescription: color.description,
    riskLevel: deriveColorRiskLevel(color),
    tags: [
      color.colorFamily.toLowerCase().replace(/\s+/g, '-'),
      color.tone,
      color.category.toLowerCase().replace(/\s+/g, '-'),
      ...color.skinToneFit,
    ],
    regionTrend: color.regionTrend,
    colorHex: mapColorFamilyToHex(color.colorFamily, color.hex || color.colorHex),
    barberInstruction: `Ask for a ${color.name.toLowerCase()} finish with a ${color.tone.toLowerCase()} tone and confirm the upkeep plan before bleaching or toning.`,
  };
}

export const allHaircutStyles = [
  ...maleHaircutStyles,
  ...femaleHaircutStyles,
  ...unisexHaircutStyles,
];

export const normalizedHaircutItems = allHaircutStyles.map(normalizeStyle);
export const normalizedColorItems = hairColorOptions.map(normalizeColor);
export const allDiscoveryItems = [...normalizedHaircutItems, ...normalizedColorItems];

export function normalizeDiscoveryItem(item) {
  if (!item) {
    return null;
  }

  if (item.kind === 'style' || item.kind === 'color' || item.kind === 'tip') {
    return item;
  }

  if (item.styleType === 'haircut' || item.genderTarget) {
    return normalizeStyle(item);
  }

  if (item.colorType === 'hair-color' || item.colorFamily) {
    return normalizeColor(item);
  }

  return {
    id: item.id || `legacy-${item.title || item.name || 'item'}`,
    kind: 'style',
    title: item.title || item.name || 'Discovery Pick',
    subtitle: item.subtitle || item.description || 'Curated beta inspiration pick.',
    shortDescription: item.subtitle || item.description || 'Curated beta inspiration pick.',
    category: item.category || 'Curated',
    maintenance: item.maintenance || 'medium',
    riskLevel: item.riskLevel || 'medium',
    regionTrend: item.regionTrend || 'Beta library',
    tags: item.tags || ['beta-pick'],
    colorHex: null,
    barberInstruction:
      item.barberInstruction ||
      'Use this curated inspiration as a reference point during the beta consultation flow.',
  };
}

function sortDiscoveryItems(items) {
  return [...items].sort((left, right) => {
    if (left.isTrending && !right.isTrending) {
      return -1;
    }
    if (!left.isTrending && right.isTrending) {
      return 1;
    }
    return left.title.localeCompare(right.title);
  });
}

export function getExploreItemsByFilter(filterLabel) {
  switch (filterLabel) {
    case 'Men':
      return sortDiscoveryItems(
        normalizedHaircutItems.filter((item) => item.genderTarget === 'men')
      );
    case 'Women':
      return sortDiscoveryItems(
        normalizedHaircutItems.filter((item) => item.genderTarget === 'women')
      );
    case 'Unisex':
      return sortDiscoveryItems(
        normalizedHaircutItems.filter((item) => item.genderTarget === 'unisex')
      );
    case 'Colors':
      return sortDiscoveryItems(normalizedColorItems);
    case 'Trending':
      return sortDiscoveryItems(allDiscoveryItems.filter((item) => item.isTrending));
    case 'Low Maintenance':
      return sortDiscoveryItems(allDiscoveryItems.filter((item) => item.maintenance === 'low'));
    case 'Professional':
      return sortDiscoveryItems(
        allDiscoveryItems.filter(
          (item) =>
            item.category === 'Professional' ||
            item.category === 'Professional beta' ||
            item.tags?.includes('professional')
        )
      );
    case 'Bold':
      return sortDiscoveryItems(
        allDiscoveryItems.filter(
          (item) =>
            item.riskLevel === 'high' ||
            item.tags?.includes('bold') ||
            item.category === 'Statement color'
        )
      );
    default:
      return sortDiscoveryItems(getExploreItemsByFilter('Trending'));
  }
}

function sharedTagCount(leftTags = [], rightTags = []) {
  return leftTags.filter((tag) => rightTags.includes(tag)).length;
}

function scoreMockBestFit(style, selectedInspiration) {
  let score = Number(style?.trendScore || 0);

  if (style?.maintenance === 'low') {
    score += 10;
  }
  if (style?.maintenance === 'medium') {
    score += 6;
  }
  if (style?.tags?.includes('professional')) {
    score += 8;
  }
  if (style?.tags?.includes('safe-choice')) {
    score += 8;
  }
  if (selectedInspiration?.genderTarget && style?.genderTarget === selectedInspiration.genderTarget) {
    score += 10;
  }
  if (selectedInspiration?.length && style?.length === selectedInspiration.length) {
    score += 8;
  }
  if (selectedInspiration?.category && style?.category === selectedInspiration.category) {
    score += 6;
  }
  score += sharedTagCount(style?.tags || [], selectedInspiration?.tags || []) * 4;

  return score;
}

function scoreMockSafeAlternative(style, selectedInspiration) {
  let score = Number(style?.trendScore || 0);

  if (style?.maintenance === 'low') {
    score += 12;
  }
  if (style?.riskLevel === 'low') {
    score += 10;
  }
  if ((style?.faceShapeFit || []).length >= 3) {
    score += 8;
  }
  if ((style?.hairTypeFit || []).length >= 2) {
    score += 6;
  }
  if (style?.tags?.includes('professional') || style?.tags?.includes('classic')) {
    score += 8;
  }
  if (selectedInspiration?.genderTarget && style?.genderTarget === selectedInspiration.genderTarget) {
    score += 8;
  }

  return score;
}

function scoreMockBoldOption(style, selectedInspiration) {
  let score = Number(style?.trendScore || 0);

  if (style?.riskLevel === 'high') {
    score += 12;
  }
  if ((style?.tags || []).includes('bold') || (style?.vibeTags || []).includes('bold')) {
    score += 10;
  }
  if ((style?.vibeTags || []).includes('editorial')) {
    score += 8;
  }
  if (style?.maintenance === 'high') {
    score += 6;
  }
  if (selectedInspiration?.genderTarget && style?.genderTarget === selectedInspiration.genderTarget) {
    score += 6;
  }
  if (selectedInspiration?.length && style?.length === selectedInspiration.length) {
    score += 4;
  }

  return score;
}

function buildMockReason(style, selectedInspiration, tone) {
  const reasonParts = [];

  if (selectedInspiration?.genderTarget && style?.genderTarget === selectedInspiration.genderTarget) {
    reasonParts.push('matches your selected gender fit');
  }
  if (selectedInspiration?.length && style?.length === selectedInspiration.length) {
    reasonParts.push('keeps a similar length direction');
  }

  if (tone === 'safe') {
    if (style?.maintenance === 'low') {
      reasonParts.push('easy to maintain');
    }
    if (style?.riskLevel === 'low') {
      reasonParts.push('low-risk for a first change');
    }
  }

  if (tone === 'bold') {
    if ((style?.tags || []).includes('bold') || (style?.vibeTags || []).includes('bold')) {
      reasonParts.push('pushes the look in a bolder direction');
    }
    if ((style?.vibeTags || []).includes('editorial')) {
      reasonParts.push('adds more editorial energy');
    }
  }

  if (!reasonParts.length) {
    reasonParts.push('selected by the local beta recommendation rules');
  }

  return reasonParts.join(', ');
}

function scoreStyle(style, { faceShape, selectedInspiration }) {
  let score = 0;

  if (faceShape && style.faceShapeFit?.includes(faceShape)) {
    score += 4;
  }

  if (selectedInspiration) {
    if (selectedInspiration.kind === 'style') {
      if (
        style.genderTarget === selectedInspiration.genderTarget ||
        style.genderTarget === 'unisex' ||
        selectedInspiration.genderTarget === 'unisex'
      ) {
        score += 3;
      }

      if (style.category === selectedInspiration.category) {
        score += 2;
      }

      if (style.length === selectedInspiration.length) {
        score += 1;
      }
    }

    score += sharedTagCount(style.tags, selectedInspiration.tags || []) * 2;
  }

  if (style.isTrending) {
    score += 1;
  }

  if (style.maintenance === 'low') {
    score += 1;
  }

  return score;
}

function scoreColor(color, { selectedInspiration }) {
  let score = 0;

  if (color.isTrending) {
    score += 1;
  }

  if (selectedInspiration) {
    const tags = selectedInspiration.tags || [];

    if (tags.includes('professional') && color.category !== 'Statement color') {
      score += 2;
    }
    if (tags.includes('bold') && color.riskLevel === 'high') {
      score += 2;
    }
    if (
      tags.includes('korean-inspired') &&
      ['Korean Brown', 'Milk Tea Brown', 'Rose Brown'].includes(color.title)
    ) {
      score += 3;
    }
    if (
      tags.includes('japanese-inspired') &&
      ['Mushroom Brown', 'Smoky Ash Brown', 'Matcha Ash'].includes(color.title)
    ) {
      score += 3;
    }
    if (selectedInspiration.kind === 'color' && color.colorFamily === selectedInspiration.colorFamily) {
      score += 4;
    }
  }

  if (color.maintenance === 'low') {
    score += 1;
  }

  return score;
}

function createReason(item, faceShape, selectedInspiration) {
  const reasonParts = [];

  if (item.faceShapeFit?.includes(faceShape)) {
    reasonParts.push(`works for ${faceShape} face shapes`);
  }

  if (selectedInspiration?.category && item.category === selectedInspiration.category) {
    reasonParts.push(`keeps the ${selectedInspiration.category.toLowerCase()} direction`);
  }

  if (selectedInspiration?.tags?.length) {
    const overlap = sharedTagCount(item.tags, selectedInspiration.tags);
    if (overlap > 0) {
      reasonParts.push(`matches ${overlap} of your inspiration tags`);
    }
  }

  if (!reasonParts.length) {
    reasonParts.push(`fits the current beta recommendation rules`);
  }

  return reasonParts.join(', ');
}

export function buildRecommendationGroups({ analysisResult, selectedInspiration } = {}) {
  if (!analysisResult?.result) {
    return [];
  }

  const faceShape = analysisResult.result.faceShape;

  const scoredStyles = normalizedHaircutItems
    .map((item) => ({
      ...item,
      score: scoreStyle(item, { faceShape, selectedInspiration }),
      reason: createReason(item, faceShape, selectedInspiration),
    }))
    .sort((left, right) => right.score - left.score);

  const safestStyles = scoredStyles.filter(
    (item) => item.riskLevel !== 'high' && item.maintenance !== 'high'
  );
  const boldStyles = scoredStyles.filter(
    (item) => item.riskLevel === 'high' || item.tags.includes('bold')
  );

  const scoredColors = normalizedColorItems
    .map((item) => ({
      ...item,
      score: scoreColor(item, { selectedInspiration }),
      reason:
        item.maintenance === 'low'
          ? 'easy color upkeep for beta users'
          : `adds a ${item.tone} ${item.colorFamily.toLowerCase()} mood to the look`,
    }))
    .sort((left, right) => right.score - left.score);

  return [
    {
      key: 'best-fit',
      title: 'Paling Cocok',
      reason:
        'These picks balance your confirmed inspiration, face-shape reading, and practical day-to-day wear.',
      items: scoredStyles.slice(0, 3),
    },
    {
      key: 'safe-alternatives',
      title: 'Alternatif Aman',
      reason:
        'These options stay cleaner, easier to maintain, and safer for a first beta haircut change.',
      items: safestStyles.slice(0, 3),
    },
    {
      key: 'bolder-options',
      title: 'Lebih Berani',
      reason:
        'These are stronger statements if you want more edge, more trend energy, or a sharper transformation.',
      items: boldStyles.slice(0, 3),
    },
    {
      key: 'recommended-colors',
      title: 'Recommended Hair Colors',
      reason:
        'These shades are paired by trend mood, maintenance level, and the overall vibe of your selected inspiration.',
      items: scoredColors.slice(0, 4),
    },
  ];
}

export function buildMockStyleRecommendationGroups({ selectedInspiration } = {}) {
  if (!selectedInspiration || selectedInspiration.kind !== 'style') {
    return [];
  }

  const candidatePool = normalizedHaircutItems.filter(
    (item) => item?.id && item.id !== selectedInspiration.id
  );

  const bestFitItems = candidatePool
    .filter((item) => item.maintenance !== 'high' && item.riskLevel !== 'high')
    .map((item) => ({
      ...item,
      score: scoreMockBestFit(item, selectedInspiration),
      reason: buildMockReason(item, selectedInspiration, 'best'),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const safeItems = candidatePool
    .filter((item) => item.maintenance === 'low' || item.riskLevel === 'low')
    .map((item) => ({
      ...item,
      score: scoreMockSafeAlternative(item, selectedInspiration),
      reason: buildMockReason(item, selectedInspiration, 'safe'),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  const boldItems = candidatePool
    .filter(
      (item) =>
        item.riskLevel === 'high' ||
        item.tags?.includes('bold') ||
        item.vibeTags?.includes('bold') ||
        item.vibeTags?.includes('editorial')
    )
    .map((item) => ({
      ...item,
      score: scoreMockBoldOption(item, selectedInspiration),
      reason: buildMockReason(item, selectedInspiration, 'bold'),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return [
    {
      key: 'mock-best-fit',
      title: 'Paling Cocok',
      reason: 'Local beta picks that feel versatile, trend-aware, and practical for daily wear.',
      items: bestFitItems,
    },
    {
      key: 'mock-safe-alternatives',
      title: 'Alternatif Aman',
      reason: 'Lower-risk options that stay classic, easier to maintain, and broadly flattering.',
      items: safeItems,
    },
    {
      key: 'mock-bolder-options',
      title: 'Lebih Berani',
      reason: 'Stronger statements if you want more edge, more fashion energy, or a sharper transformation.',
      items: boldItems,
    },
  ].filter((group) => Array.isArray(group.items) && group.items.length > 0);
}
