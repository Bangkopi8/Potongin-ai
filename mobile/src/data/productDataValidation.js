import { hairColors } from './hairColors.js';
import { haircutStyles } from './haircutStyles.js';

const REQUIRED_STYLE_FIELDS = [
  'id',
  'name',
  'genderFit',
  'categories',
  'length',
  'topLengthCmRange',
  'sideLengthMmRange',
  'backLengthMmRange',
  'fringeType',
  'fadeType',
  'texture',
  'volume',
  'maintenanceLevel',
  'faceShapesFit',
  'hairTypesFit',
  'vibeTags',
  'suitableFor',
  'avoidIf',
  'stylingNotes',
  'barberInstruction',
  'exampleImageUrl',
  'modelImageUrl',
  'popularityRegion',
  'trendScore',
  'recommendationTags',
];

const REQUIRED_COLOR_FIELDS = [
  'id',
  'name',
  'colorFamily',
  'hex',
  'undertone',
  'skinToneFit',
  'maintenanceLevel',
  'workplaceSafe',
  'boldnessLevel',
  'notes',
];

function collectDuplicateIds(items) {
  const counts = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    counts.set(item.id, (counts.get(item.id) || 0) + 1);
  });

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

function collectMissingFieldErrors(items, requiredFields, itemLabel) {
  return (Array.isArray(items) ? items : []).flatMap((item) =>
    requiredFields
      .filter((field) => item[field] === undefined || item[field] === null || item[field] === '')
      .map((field) => `${itemLabel}:${item.id}:missing:${field}`)
  );
}

export function validateProductCatalogData({
  styles = haircutStyles,
  colors = hairColors,
} = {}) {
  const duplicateStyleIds = collectDuplicateIds(styles);
  const duplicateColorIds = collectDuplicateIds(colors);
  const styleErrors = collectMissingFieldErrors(styles, REQUIRED_STYLE_FIELDS, 'style');
  const colorErrors = collectMissingFieldErrors(colors, REQUIRED_COLOR_FIELDS, 'color');
  const errors = [
    ...duplicateStyleIds.map((id) => `style:duplicate-id:${id}`),
    ...duplicateColorIds.map((id) => `color:duplicate-id:${id}`),
    ...styleErrors,
    ...colorErrors,
  ];

  return {
    styleCount: styles.length,
    colorCount: colors.length,
    duplicateStyleIds,
    duplicateColorIds,
    styleErrors,
    colorErrors,
    errors,
    isValid: errors.length === 0,
  };
}

export function getCatalogValidationSummary() {
  return validateProductCatalogData();
}
