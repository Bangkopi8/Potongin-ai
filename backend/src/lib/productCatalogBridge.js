const path = require('path');
const { pathToFileURL } = require('url');

let cachedCatalogPromise = null;

function resolveMobileDataModule(relativeSegments) {
  return path.resolve(__dirname, '..', '..', '..', 'mobile', 'src', 'data', ...relativeSegments);
}

async function importMobileModule(relativeSegments) {
  const modulePath = resolveMobileDataModule(relativeSegments);
  const moduleUrl = pathToFileURL(modulePath).href;
  return import(moduleUrl);
}

function buildSafeStyleSummary(style) {
  if (!style || typeof style !== 'object') {
    return null;
  }

  return {
    id: style.id,
    name: style.name,
    genderFit: style.genderFit || style.genderTarget || 'unisex',
    categories: Array.isArray(style.categories) ? style.categories.slice(0, 3) : [],
    length: style.length || 'medium',
    maintenanceLevel: style.maintenanceLevel || style.maintenance || 'medium',
    faceShapesFit: Array.isArray(style.faceShapesFit)
      ? style.faceShapesFit.slice(0, 4)
      : Array.isArray(style.faceShapeFit)
        ? style.faceShapeFit.slice(0, 4)
        : [],
    hairTypesFit: Array.isArray(style.hairTypesFit)
      ? style.hairTypesFit.slice(0, 4)
      : Array.isArray(style.hairTypeFit)
        ? style.hairTypeFit.slice(0, 4)
        : [],
    popularityRegion: style.popularityRegion || style.regionTrend || 'Global',
    trendScore: Number.isFinite(style.trendScore) ? style.trendScore : 0,
    vibeTags: Array.isArray(style.vibeTags) ? style.vibeTags.slice(0, 4) : [],
    recommendationTags: Array.isArray(style.recommendationTags)
      ? style.recommendationTags.slice(0, 4)
      : [],
    riskLevel: style.riskLevel || 'medium',
    stylingNotes: style.stylingNotes || '',
    barberInstruction: style.barberInstruction || '',
  };
}

function buildSafeColorSummary(color) {
  if (!color || typeof color !== 'object') {
    return null;
  }

  return {
    id: color.id,
    name: color.name,
    colorFamily: color.colorFamily,
    hex: color.hex || '#7c543f',
    undertone: color.undertone || 'neutral',
    maintenanceLevel: color.maintenanceLevel || color.maintenance || 'medium',
    workplaceSafe: Boolean(color.workplaceSafe),
    boldnessLevel: color.boldnessLevel || 'medium',
    notes: color.notes || '',
  };
}

async function loadProductCatalog() {
  if (!cachedCatalogPromise) {
    cachedCatalogPromise = Promise.all([
      importMobileModule(['haircutStyles.js']),
      importMobileModule(['hairColors.js']),
    ])
      .then(([stylesModule, colorsModule]) => {
        const haircutStyles = Array.isArray(stylesModule?.haircutStyles)
          ? stylesModule.haircutStyles
          : [];
        const hairColors = Array.isArray(colorsModule?.hairColors)
          ? colorsModule.hairColors
          : [];

        return {
          haircutStyles,
          hairColors,
        };
      })
      .catch(() => ({
        haircutStyles: [],
        hairColors: [],
      }));
  }

  return cachedCatalogPromise;
}

async function getHaircutCatalogSummary() {
  const catalog = await loadProductCatalog();
  return (catalog.haircutStyles || []).map(buildSafeStyleSummary).filter(Boolean);
}

async function getHairColorCatalogSummary() {
  const catalog = await loadProductCatalog();
  return (catalog.hairColors || []).map(buildSafeColorSummary).filter(Boolean);
}

async function getHaircutStyleById(styleId) {
  if (!styleId) {
    return null;
  }

  const catalog = await loadProductCatalog();
  return (catalog.haircutStyles || []).find((style) => style?.id === styleId) || null;
}

async function getHairColorById(colorId) {
  if (!colorId) {
    return null;
  }

  const catalog = await loadProductCatalog();
  return (catalog.hairColors || []).find((color) => color?.id === colorId) || null;
}

module.exports = {
  getHairColorById,
  getHairColorCatalogSummary,
  getHaircutCatalogSummary,
  getHaircutStyleById,
};
