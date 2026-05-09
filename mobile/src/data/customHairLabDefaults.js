import { createCustomHairLabDraft } from './catalogHelpers.js';

export const customHairLabDefaults = {
  frontLengthCm: 5,
  topLengthCm: 8,
  sideLengthMm: 9,
  backLengthMm: 12,
  fadeType: 'none',
  taperLevel: 'soft',
  fringeStyle: 'soft curtain',
  parting: 'natural',
  texture: 'natural',
  volume: 'balanced',
  hairColor: 'color-espresso-black',
  beardOption: 'not-applicable',
  stylingPreference: 'natural-finish',
  maintenancePreference: 'medium',
};

export const customHairLabOptions = {
  fadeTypes: ['none', 'low taper', 'mid fade', 'skin', 'burst', 'disconnected'],
  taperLevels: ['soft', 'clean', 'sharp'],
  fringeStyles: [
    'none',
    'soft curtain',
    'see-through',
    'micro fringe',
    'textured fringe',
    'curly fringe',
  ],
  partings: ['natural', 'middle', 'soft side', 'deep side'],
  textures: ['natural', 'soft layered', 'piecey matte', 'defined curls', 'glass smooth'],
  volumes: ['low', 'balanced', 'soft lift', 'high'],
  beardOptions: ['not-applicable', 'clean shave', 'stubble', 'short beard', 'full beard'],
  stylingPreferences: ['natural-finish', 'matte-texture', 'polished-salon', 'editorial-bold'],
  maintenancePreferences: ['low', 'medium', 'high'],
};

export const customHairLabParameterSchema = {
  frontLengthCm: { min: 0, max: 20, step: 0.5 },
  topLengthCm: { min: 1, max: 30, step: 0.5 },
  sideLengthMm: { min: 0, max: 50, step: 0.5 },
  backLengthMm: { min: 0, max: 80, step: 0.5 },
};

export function createCustomHairLabPreset(overrides = {}) {
  return createCustomHairLabDraft(customHairLabDefaults, overrides);
}
