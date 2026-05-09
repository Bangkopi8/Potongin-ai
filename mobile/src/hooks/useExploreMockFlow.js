import { useCallback, useEffect, useMemo, useState } from 'react';

import { haircutStyles } from '../data/index.js';

const EXPLORE_STYLE_FILTERS = ['All', 'Men', 'Women', 'Unisex'];

function titleCase(value, fallback) {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createExploreStyleCard(style) {
  const safeStyle = style && typeof style === 'object' ? style : {};
  const safeCategories = Array.isArray(safeStyle.categories)
    ? safeStyle.categories.filter(Boolean)
    : [];
  const safeVibeTags = Array.isArray(safeStyle.vibeTags)
    ? safeStyle.vibeTags.filter(Boolean)
    : [];
  const safeFaceShapes = Array.isArray(safeStyle.faceShapesFit)
    ? safeStyle.faceShapesFit.filter(Boolean)
    : [];
  const safeHairTypes = Array.isArray(safeStyle.hairTypesFit)
    ? safeStyle.hairTypesFit.filter(Boolean)
    : [];
  const resolvedGenderFit = safeStyle.genderFit || safeStyle.genderTarget || 'unisex';
  const resolvedLength = safeStyle.length || 'medium';
  const resolvedMaintenance = safeStyle.maintenanceLevel || safeStyle.maintenance || 'medium';
  const resolvedRegion = safeStyle.popularityRegion || safeStyle.regionTrend || 'Global';
  const resolvedTrendScore = Number.isFinite(safeStyle.trendScore) ? safeStyle.trendScore : 0;
  const categoryLabel = safeCategories[0] || 'Curated Style';
  const vibeSummary = safeVibeTags.length
    ? safeVibeTags
        .slice(0, 3)
        .map((tag) => tag.replace(/-/g, ' '))
        .join(' · ')
    : 'Public beta style';
  const fitSummary = [
    safeFaceShapes[0] ? `Face: ${safeFaceShapes[0]}` : null,
    safeHairTypes[0] ? `Hair: ${safeHairTypes[0]}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const shortDescription =
    safeStyle.description ||
    safeStyle.stylingNotes ||
    `A ${resolvedMaintenance} maintenance ${categoryLabel.toLowerCase()} with a ${vibeSummary.toLowerCase()} direction.`;

  return {
    id: safeStyle.id || `style-${resolvedGenderFit}-${resolvedLength}-${categoryLabel.toLowerCase()}`,
    styleId: safeStyle.id || null,
    kind: 'style',
    title: safeStyle.name || 'Curated haircut style',
    subtitle: shortDescription,
    shortDescription,
    description: shortDescription,
    genderFit: resolvedGenderFit,
    genderTarget: resolvedGenderFit,
    length: resolvedLength,
    category: categoryLabel,
    maintenance: resolvedMaintenance,
    maintenanceLevel: resolvedMaintenance,
    riskLevel: safeStyle.riskLevel || 'medium',
    regionTrend: resolvedRegion,
    popularityRegion: resolvedRegion,
    tags:
      Array.isArray(safeStyle.tags) && safeStyle.tags.length
        ? safeStyle.tags
        : [...safeCategories, ...safeVibeTags].map((tag) => String(tag).toLowerCase().replace(/\s+/g, '-')),
    vibeTags: safeVibeTags,
    faceShapeFit: safeFaceShapes,
    hairTypeFit: safeHairTypes,
    barberInstruction:
      safeStyle.barberInstruction ||
      'Use this selected style as a salon conversation starter during the beta flow.',
    exampleImage:
      safeStyle.exampleImage ||
      safeStyle.exampleImageUrl ||
      `placeholder://styles/${safeStyle.id || 'style'}`,
    exampleImageUrl: safeStyle.exampleImageUrl || null,
    modelImageUrl: safeStyle.modelImageUrl || null,
    trendScore: resolvedTrendScore,
    isTrending:
      typeof safeStyle.isTrending === 'boolean' ? safeStyle.isTrending : resolvedTrendScore >= 84,
    detailMetaLine: `${titleCase(resolvedGenderFit, 'Unisex')} · ${titleCase(resolvedLength, 'Medium')} · Trend ${resolvedTrendScore}`,
    vibeSummary,
    fitSummary,
  };
}

function sortExploreItems(items) {
  return [...items].sort((left, right) => {
    const trendDelta = (right?.trendScore || 0) - (left?.trendScore || 0);

    if (trendDelta !== 0) {
      return trendDelta;
    }

    return String(left?.title || '').localeCompare(String(right?.title || ''));
  });
}

function getStylesByFilter(filterLabel) {
  const styles = Array.isArray(haircutStyles) ? haircutStyles : [];
  const normalizedItems = styles.map(createExploreStyleCard);

  switch (filterLabel) {
    case 'Men':
      return sortExploreItems(normalizedItems.filter((item) => item.genderFit === 'men'));
    case 'Women':
      return sortExploreItems(normalizedItems.filter((item) => item.genderFit === 'women'));
    case 'Unisex':
      return sortExploreItems(normalizedItems.filter((item) => item.genderFit === 'unisex'));
    case 'All':
    default:
      return sortExploreItems(normalizedItems);
  }
}

export function useExploreMockFlow() {
  const [status, setStatus] = useState('idle');
  const [activeFilter, setActiveFilter] = useState(EXPLORE_STYLE_FILTERS[0]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const loadStyles = useCallback(() => {
    try {
      setStatus('loading');
      setError('');
      const nextItems = getStylesByFilter(activeFilter);
      setItems(nextItems);
      setStatus('success');
    } catch (caughtError) {
      setItems([]);
      setError(caughtError?.message || 'Unable to load the public beta discovery catalog.');
      setStatus('error');
    }
  }, [activeFilter]);

  useEffect(() => {
    loadStyles();
  }, [loadStyles]);

  return useMemo(
    () => ({
      status,
      items,
      error,
      filters: EXPLORE_STYLE_FILTERS,
      activeFilter,
      setActiveFilter,
      loadStyles,
    }),
    [activeFilter, error, items, loadStyles, status]
  );
}
