import { filterHaircutStylesByGenderFit } from './catalogHelpers.js';
import { haircutStyles } from './haircutStyles.js';

export const femaleHaircutStyles = filterHaircutStylesByGenderFit(haircutStyles, 'women');
