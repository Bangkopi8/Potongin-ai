function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeRange(value, fallback) {
  if (value && typeof value === 'object' && Number.isFinite(value.min) && Number.isFinite(value.max)) {
    return { min: value.min, max: value.max };
  }

  if (Array.isArray(value) && value.length >= 2) {
    return {
      min: Number(value[0]) || fallback.min,
      max: Number(value[1]) || fallback.max,
    };
  }

  if (Number.isFinite(value)) {
    return { min: value, max: value };
  }

  return { ...fallback };
}

function normalizeList(values, fallback = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return [...fallback];
  }

  return uniqueList(values.map((value) => String(value).trim()).filter(Boolean));
}

function normalizeEnum(value, allowedValues, fallback) {
  if (allowedValues.includes(value)) {
    return value;
  }

  return fallback;
}

function buildStyleDescription({
  name,
  categories,
  maintenanceLevel,
  faceShapesFit,
  popularityRegion,
  vibeTags,
}) {
  const categoryLabel = categories[0] || 'curated';
  const faceShapeLabel = faceShapesFit.join(', ');
  const vibeLabel = vibeTags.slice(0, 2).join(' and ');

  return `${name} is a ${maintenanceLevel} maintenance ${categoryLabel.toLowerCase()} style with a ${vibeLabel || 'beta-ready'} vibe. It is especially useful for ${faceShapeLabel} face shapes and is currently trending in ${popularityRegion}.`;
}

function buildBarberInstruction({
  name,
  length,
  topLengthCmRange,
  sideLengthMmRange,
  backLengthMmRange,
  fadeType,
  texture,
  fringeType,
  stylingNotes,
}) {
  return `Ask for ${name.toLowerCase()} with a ${length} outline, keep the top around ${topLengthCmRange.min}-${topLengthCmRange.max} cm, the sides around ${sideLengthMmRange.min}-${sideLengthMmRange.max} mm, and the back around ${backLengthMmRange.min}-${backLengthMmRange.max} mm. Use a ${fadeType} fade, keep the texture ${texture}, and finish the front with a ${fringeType} fringe. Styling note: ${stylingNotes}`;
}

function deriveStyleRiskLevel({ riskLevel, maintenanceLevel, vibeTags, fadeType, trendScore }) {
  if (riskLevel) {
    return riskLevel;
  }

  if (
    maintenanceLevel === 'high' ||
    vibeTags.includes('bold') ||
    ['skin', 'burst', 'disconnected'].includes(fadeType) ||
    trendScore >= 88
  ) {
    return 'high';
  }

  if (maintenanceLevel === 'low' && trendScore < 78) {
    return 'low';
  }

  return 'medium';
}

function buildRegionTrend(popularityRegion, categories, trendScore) {
  const leadCategory = categories[0] || 'beta';

  return `${popularityRegion} ${leadCategory.toLowerCase()} wave (${trendScore})`;
}

function deriveColorCategory({ workplaceSafe, boldnessLevel, category }) {
  if (category) {
    return category;
  }

  if (boldnessLevel === 'high') {
    return 'Statement color';
  }

  if (workplaceSafe) {
    return 'Professional beta';
  }

  return 'Salon polished';
}

function deriveColorTrendLabel({ colorFamily, boldnessLevel, regionTrend }) {
  if (regionTrend) {
    return regionTrend;
  }

  if (boldnessLevel === 'high') {
    return `Global ${String(colorFamily).toLowerCase()} statement mood`;
  }

  return `Global ${String(colorFamily).toLowerCase()} refresh`;
}

export function createHaircutStyle({
  id,
  name,
  genderFit,
  genderTarget,
  categories,
  category,
  length,
  topLengthCmRange,
  sideLengthMmRange,
  backLengthMmRange,
  fringeType = 'none',
  fadeType = 'none',
  texture = 'natural',
  volume = 'balanced',
  maintenanceLevel,
  maintenance,
  faceShapesFit,
  faceShapeFit,
  hairTypesFit,
  hairTypeFit,
  vibeTags = [],
  suitableFor = [],
  avoidIf = [],
  stylingNotes,
  barberInstruction,
  exampleImageUrl,
  modelImageUrl,
  popularityRegion = 'Global',
  trendScore = 72,
  recommendationTags = [],
  riskLevel,
  regionTrend,
  description,
  isTrending,
  isBeta = true,
}) {
  const styleId = id || `style-${slugify(name)}`;
  const resolvedGenderFit = genderFit || genderTarget || 'unisex';
  const resolvedCategories = normalizeList(categories, category ? [category] : ['Curated']);
  const resolvedLength = normalizeEnum(length, ['short', 'medium', 'long'], 'medium');
  const resolvedMaintenance = normalizeEnum(
    maintenanceLevel || maintenance,
    ['low', 'medium', 'high'],
    'medium'
  );
  const resolvedFaceShapes = normalizeList(faceShapesFit || faceShapeFit, ['oval']);
  const resolvedHairTypes = normalizeList(hairTypesFit || hairTypeFit, ['straight']);
  const resolvedVibeTags = normalizeList(vibeTags, ['beta']);
  const resolvedRecommendationTags = normalizeList(recommendationTags, resolvedVibeTags);
  const resolvedTopRange = normalizeRange(topLengthCmRange, { min: 4, max: 8 });
  const resolvedSideRange = normalizeRange(sideLengthMmRange, { min: 1, max: 6 });
  const resolvedBackRange = normalizeRange(backLengthMmRange, { min: 2, max: 8 });
  const resolvedRiskLevel = deriveStyleRiskLevel({
    riskLevel,
    maintenanceLevel: resolvedMaintenance,
    vibeTags: resolvedVibeTags,
    fadeType,
    trendScore,
  });
  const resolvedRegionTrend = regionTrend || buildRegionTrend(popularityRegion, resolvedCategories, trendScore);
  const resolvedExampleImageUrl = exampleImageUrl || `placeholder://styles/${styleId}`;
  const resolvedModelImageUrl = modelImageUrl || `placeholder://models/${resolvedGenderFit}-${styleId}`;
  const resolvedDescription =
    description ||
    buildStyleDescription({
      name,
      categories: resolvedCategories,
      maintenanceLevel: resolvedMaintenance,
      faceShapesFit: resolvedFaceShapes,
      popularityRegion,
      vibeTags: resolvedVibeTags,
    });
  const resolvedStylingNotes =
    stylingNotes ||
    `Use a ${texture} finish with ${volume} volume and keep the routine ${resolvedMaintenance}.`;
  const resolvedBarberInstruction =
    barberInstruction ||
    buildBarberInstruction({
      name,
      length: resolvedLength,
      topLengthCmRange: resolvedTopRange,
      sideLengthMmRange: resolvedSideRange,
      backLengthMmRange: resolvedBackRange,
      fadeType,
      texture,
      fringeType,
      stylingNotes: resolvedStylingNotes,
    });
  const legacyTags = uniqueList([
    ...resolvedCategories.map((item) => slugify(item)),
    ...resolvedVibeTags,
    ...resolvedRecommendationTags,
    `${resolvedLength}-length`,
    resolvedRiskLevel,
    popularityRegion.toLowerCase(),
  ]);

  return {
    id: styleId,
    name,
    genderFit: resolvedGenderFit,
    categories: resolvedCategories,
    length: resolvedLength,
    topLengthCmRange: resolvedTopRange,
    sideLengthMmRange: resolvedSideRange,
    backLengthMmRange: resolvedBackRange,
    fringeType,
    fadeType,
    texture,
    volume,
    maintenanceLevel: resolvedMaintenance,
    faceShapesFit: resolvedFaceShapes,
    hairTypesFit: resolvedHairTypes,
    vibeTags: resolvedVibeTags,
    suitableFor: normalizeList(suitableFor),
    avoidIf: normalizeList(avoidIf),
    stylingNotes: resolvedStylingNotes,
    barberInstruction: resolvedBarberInstruction,
    exampleImageUrl: resolvedExampleImageUrl,
    modelImageUrl: resolvedModelImageUrl,
    popularityRegion,
    trendScore,
    recommendationTags: resolvedRecommendationTags,
    riskLevel: resolvedRiskLevel,
    isTrending: typeof isTrending === 'boolean' ? isTrending : trendScore >= 84,
    isBeta,
    genderTarget: resolvedGenderFit,
    category: resolvedCategories[0],
    maintenance: resolvedMaintenance,
    faceShapeFit: resolvedFaceShapes,
    hairTypeFit: resolvedHairTypes,
    regionTrend: resolvedRegionTrend,
    tags: legacyTags,
    description: resolvedDescription,
    exampleImage: `style-${styleId}`,
    styleType: 'haircut',
    badgeKey: slugify(resolvedCategories[0]),
  };
}

export function createHairColor({
  id,
  name,
  colorFamily,
  hex,
  undertone = 'neutral',
  skinToneFit = [],
  maintenanceLevel,
  maintenance,
  workplaceSafe = true,
  boldnessLevel = 'medium',
  notes,
  category,
  regionTrend,
  isTrending,
  isBeta = true,
}) {
  const colorId = id || `color-${slugify(name)}`;
  const resolvedMaintenance = normalizeEnum(
    maintenanceLevel || maintenance,
    ['low', 'medium', 'high'],
    'medium'
  );
  const resolvedCategory = deriveColorCategory({
    workplaceSafe,
    boldnessLevel,
    category,
  });
  const resolvedRegionTrend = deriveColorTrendLabel({
    colorFamily,
    boldnessLevel,
    regionTrend,
  });
  const resolvedNotes =
    notes ||
    `${name} is a ${resolvedMaintenance} maintenance ${String(colorFamily).toLowerCase()} direction with a ${undertone} undertone.`;

  return {
    id: colorId,
    name,
    colorFamily,
    hex,
    undertone,
    skinToneFit: normalizeList(skinToneFit),
    maintenanceLevel: resolvedMaintenance,
    workplaceSafe,
    boldnessLevel,
    notes: resolvedNotes,
    tone: undertone,
    category: resolvedCategory,
    maintenance: resolvedMaintenance,
    description: resolvedNotes,
    regionTrend: resolvedRegionTrend,
    isTrending: typeof isTrending === 'boolean' ? isTrending : boldnessLevel === 'high',
    isBeta,
    colorType: 'hair-color',
    exampleImage: `color-${colorId}`,
    colorHex: hex,
  };
}

export function deriveColorRiskLevel(color) {
  if (color?.boldnessLevel === 'high' || color?.maintenanceLevel === 'high') {
    return 'high';
  }

  if (color?.boldnessLevel === 'medium' || color?.maintenanceLevel === 'medium') {
    return 'medium';
  }

  if (color?.maintenance === 'high' || String(color?.category || '').toLowerCase().includes('statement')) {
    return 'high';
  }

  if (color?.maintenance === 'medium' || color?.tone === 'cool') {
    return 'medium';
  }

  return 'low';
}

export function createHomeFeedItem({
  id,
  section,
  item,
  contentType,
  subtitle,
  ctaLabel,
  secondaryCtaLabel,
}) {
  return {
    id,
    section,
    contentType,
    title: item.title,
    subtitle: subtitle || item.subtitle || item.description,
    ctaLabel: ctaLabel || (contentType === 'color' ? 'Try This Color' : 'Try This Look'),
    secondaryCtaLabel: secondaryCtaLabel || 'View Detail',
    item,
  };
}

export function mapColorFamilyToHex(colorFamily, fallbackHex = null) {
  if (typeof fallbackHex === 'string' && fallbackHex.startsWith('#')) {
    return fallbackHex;
  }

  const family = String(colorFamily || '').toLowerCase();

  if (family.includes('black')) {
    return '#1f1b1b';
  }
  if (family.includes('brown')) {
    return '#6f4a32';
  }
  if (family.includes('blonde')) {
    return '#d8b26e';
  }
  if (family.includes('auburn') || family.includes('copper')) {
    return '#b85c38';
  }
  if (family.includes('red') || family.includes('burgundy')) {
    return '#8f2d3a';
  }
  if (family.includes('purple') || family.includes('lavender')) {
    return '#8b73be';
  }
  if (family.includes('blue')) {
    return '#314d7a';
  }
  if (family.includes('green') || family.includes('olive') || family.includes('matcha')) {
    return '#617a49';
  }
  if (family.includes('silver') || family.includes('grey') || family.includes('gray')) {
    return '#9aa0a6';
  }
  if (family.includes('rose') || family.includes('peach') || family.includes('pink')) {
    return '#d88a8a';
  }

  return '#8a6a4c';
}

export function filterHaircutStylesByGenderFit(styles, genderFit) {
  return (Array.isArray(styles) ? styles : []).filter((style) => style.genderFit === genderFit);
}

export function getHaircutStyleById(styles, styleId) {
  if (!styleId || !Array.isArray(styles)) {
    return null;
  }

  return styles.find((style) => style?.id === styleId) || null;
}

export function getStylesByPopularityRegion(styles, region) {
  return (Array.isArray(styles) ? styles : []).filter((style) => style.popularityRegion === region);
}

export function getTrendingHaircutStyles(styles, minimumTrendScore = 84) {
  return (Array.isArray(styles) ? styles : []).filter((style) => style.trendScore >= minimumTrendScore);
}

export function findHairColorById(colors, id) {
  return (Array.isArray(colors) ? colors : []).find((color) => color.id === id) || null;
}

export function createCustomHairLabDraft(defaults, overrides = {}) {
  return {
    ...(defaults || {}),
    ...(overrides || {}),
  };
}

export function cycle(list, index) {
  return list[index % list.length];
}

export function uniqueList(values) {
  return [...new Set((values || []).filter(Boolean))];
}
