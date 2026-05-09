import { filterHaircutStylesByGenderFit } from './catalogHelpers.js';
import { haircutStyles } from './haircutStyles.js';

export const unisexHaircutStyles = filterHaircutStylesByGenderFit(haircutStyles, 'unisex');
