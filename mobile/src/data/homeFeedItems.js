import { createHomeFeedItem } from './catalogHelpers.js';
import { barberTips } from './barberTips.js';
import { normalizedColorItems, normalizedHaircutItems } from './recommendationRules.js';

export const HOME_SECTION_ORDER = [
  'Continue Your Look',
  'Trending in Indonesia',
  'Trending Globally',
  'Popular Men’s Haircuts',
  'Popular Women’s Haircuts',
  'Hair Color Ideas',
  'Low Maintenance Looks',
  'Professional Looks',
  'Bold Transformations',
  'Korean/Japanese Inspired',
  'Barber Tips',
];

const men = normalizedHaircutItems.filter((item) => item.genderTarget === 'men');
const women = normalizedHaircutItems.filter((item) => item.genderTarget === 'women');
const unisex = normalizedHaircutItems.filter((item) => item.genderTarget === 'unisex');
const colors = normalizedColorItems;

function pickItem(list, index) {
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }

  return list[index % list.length];
}

function pickMany(list, indexes) {
  return indexes.map((index) => pickItem(list, index)).filter(Boolean);
}

function normalizeTip(tip) {
  return {
    ...tip,
    kind: 'tip',
    title: tip.title,
    subtitle: tip.body,
    shortDescription: tip.body,
    category: 'Barber Tip',
    maintenance: 'guide',
    riskLevel: 'n/a',
    tags: [tip.focus, 'beta-tip'],
    colorHex: null,
  };
}

const tipItems = barberTips.map(normalizeTip);

const sectionBlueprints = [
  {
    section: 'Continue Your Look',
    items: [pickItem(men, 0), pickItem(women, 1), pickItem(unisex, 0), pickItem(colors, 1)],
  },
  {
    section: 'Trending in Indonesia',
    items: [pickItem(men, 4), pickItem(women, 4), pickItem(unisex, 6), pickItem(colors, 5)],
  },
  {
    section: 'Trending Globally',
    items: [pickItem(men, 2), pickItem(women, 2), pickItem(unisex, 0), pickItem(colors, 12)],
  },
  {
    section: 'Popular Men’s Haircuts',
    items: pickMany(men, [0, 1, 3, 7]),
  },
  {
    section: 'Popular Women’s Haircuts',
    items: pickMany(women, [0, 1, 3, 7]),
  },
  {
    section: 'Hair Color Ideas',
    items: pickMany(colors, [2, 5, 9, 16]),
  },
  {
    section: 'Low Maintenance Looks',
    items: [
      ...men.filter((item) => item.maintenance === 'low').slice(0, 1),
      ...women.filter((item) => item.maintenance === 'low').slice(0, 1),
      ...unisex.filter((item) => item.maintenance === 'low').slice(0, 1),
      ...colors.filter((item) => item.maintenance === 'low').slice(0, 1),
    ],
  },
  {
    section: 'Professional Looks',
    items: [
      ...men.filter((item) => item.tags?.includes('professional')).slice(0, 1),
      ...women.filter((item) => item.tags?.includes('professional')).slice(0, 1),
      ...unisex.filter((item) => item.tags?.includes('professional')).slice(0, 1),
      ...colors.filter((item) => item.category === 'Professional beta').slice(0, 1),
    ],
  },
  {
    section: 'Bold Transformations',
    items: [
      ...men.filter((item) => item.riskLevel === 'high').slice(0, 1),
      ...women.filter((item) => item.riskLevel === 'high').slice(0, 1),
      ...unisex.filter((item) => item.riskLevel === 'high').slice(0, 1),
      ...colors.filter((item) => item.riskLevel === 'high').slice(0, 1),
    ],
  },
  {
    section: 'Korean/Japanese Inspired',
    items: [
      ...men.filter((item) => item.tags?.includes('korean-inspired')).slice(0, 1),
      ...women.filter((item) => item.tags?.includes('korean-inspired')).slice(0, 1),
      ...women.filter((item) => item.tags?.includes('japanese-inspired')).slice(0, 1),
      ...colors.filter((item) => item.name === 'Milk Tea Brown').slice(0, 1),
    ],
  },
  {
    section: 'Barber Tips',
    items: [tipItems[0], tipItems[4], tipItems[12], tipItems[18]],
  },
];

export const homeFeedItems = sectionBlueprints.flatMap((sectionEntry) =>
  (sectionEntry.items || [])
    .filter(Boolean)
    .map((item, itemIndex) =>
      createHomeFeedItem({
        id: `home-${sectionEntry.section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${itemIndex + 1}`,
        section: sectionEntry.section,
        item,
        contentType: item.kind,
        subtitle: item.shortDescription,
        ctaLabel:
          item.kind === 'color'
            ? 'Try This Color'
            : item.kind === 'tip'
              ? 'Read Tip'
              : 'Try This Look',
        secondaryCtaLabel: item.kind === 'tip' ? 'View Tip' : 'View Detail',
      })
    )
);
