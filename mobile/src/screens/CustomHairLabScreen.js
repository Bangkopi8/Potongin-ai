import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { BadgePill, Card, PrimaryButton, ScreenContainer } from '../components/index.js';
import {
  createCustomHairLabPreset,
  customHairLabDefaults,
  customHairLabOptions,
  customHairLabParameterSchema,
  findHairColorById,
  hairColors,
} from '../data/index.js';
import { localizeMetadataValue } from '../utils/localizeCustomerCopy.js';

const FALLBACK_DEFAULTS = {
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

const FALLBACK_OPTIONS = {
  fadeTypes: ['none', 'low taper', 'mid fade', 'skin'],
  taperLevels: ['soft', 'clean', 'sharp'],
  fringeStyles: ['none', 'soft curtain', 'textured fringe'],
  partings: ['natural', 'middle', 'soft side'],
  textures: ['natural', 'soft layered', 'piecey matte'],
  volumes: ['low', 'balanced', 'soft lift'],
  beardOptions: ['not-applicable', 'clean shave', 'stubble', 'short beard'],
  stylingPreferences: ['natural-finish', 'matte-texture', 'polished-salon'],
  maintenancePreferences: ['low', 'medium', 'high'],
};

const FALLBACK_SCHEMA = {
  frontLengthCm: { min: 0, max: 20, step: 0.5 },
  topLengthCm: { min: 1, max: 30, step: 0.5 },
  sideLengthMm: { min: 0, max: 50, step: 0.5 },
  backLengthMm: { min: 0, max: 80, step: 0.5 },
};

function formatLabel(value, fallback = 'Not set') {
  if (!value || typeof value !== 'string') {
    return fallback;
  }

  return value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function localizeLabOption(value, language = 'en') {
  if (!value || typeof value !== 'string') {
    return language === 'id' ? 'Belum diatur' : 'Not set';
  }

  if (language !== 'id') {
    return formatLabel(value);
  }

  const optionMap = {
    none: 'Tanpa fade',
    'low taper': 'Low taper',
    'mid fade': 'Mid fade',
    skin: 'Skin fade',
    soft: 'Lembut',
    clean: 'Rapi',
    sharp: 'Tegas',
    'soft curtain': 'Curtain lembut',
    'textured fringe': 'Poni bertekstur',
    natural: 'Natural',
    middle: 'Tengah',
    'soft side': 'Samping lembut',
    'soft layered': 'Layered lembut',
    'piecey matte': 'Matte bertekstur',
    balanced: 'Seimbang',
    'soft lift': 'Lift lembut',
    'not-applicable': 'Tidak berlaku',
    'clean shave': 'Cukur bersih',
    stubble: 'Jenggot tipis',
    'short beard': 'Jenggot pendek',
    'natural-finish': 'Hasil natural',
    'matte-texture': 'Tekstur matte',
    'polished-salon': 'Hasil salon rapi',
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
  };

  const normalizedValue = String(value || '').trim().toLowerCase();
  return optionMap[normalizedValue] || localizeMetadataValue(value, language, formatLabel(value));
}

function formatNumericValue(value, unit) {
  if (!Number.isFinite(value)) {
    return `0 ${unit}`;
  }

  const isInteger = Number.isInteger(value);
  return `${isInteger ? value : value.toFixed(1)} ${unit}`;
}

function clampValue(value, config) {
  const min = Number.isFinite(config?.min) ? config.min : 0;
  const max = Number.isFinite(config?.max) ? config.max : value;

  return Math.min(max, Math.max(min, value));
}

function getOptionList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function OptionChip({ label, active, colorSwatch, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionChip,
        active && styles.optionChipActive,
      ]}
    >
      {colorSwatch ? <View style={[styles.colorSwatch, { backgroundColor: colorSwatch }]} /> : null}
      <Text style={[styles.optionChipLabel, active && styles.optionChipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function StepperField({ label, unit, value, onDecrease, onIncrease }) {
  return (
    <Card accent="sky" style={styles.stepperCard}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={onDecrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <View style={styles.stepperValueWrap}>
          <Text style={styles.stepperValue}>{formatNumericValue(value, unit)}</Text>
        </View>
        <Pressable onPress={onIncrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function OptionSection({ language = 'en', title, value, options, onSelect }) {
  const safeOptions = getOptionList(options);

  return (
    <Card accent="mint">
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionWrap}>
        {safeOptions.map((option) => (
          <OptionChip
            key={option}
            label={localizeLabOption(option, language)}
            active={value === option}
            onPress={() => onSelect(option)}
          />
        ))}
      </View>
    </Card>
  );
}

function HairColorSection({ language = 'en', t = (key) => key, selectedColorId, colors, onSelect }) {
  const safeColors = Array.isArray(colors) ? colors.filter(Boolean) : [];

  return (
    <Card accent="rose">
      <Text style={styles.sectionTitle}>{t('customHair.hairColorTitle')}</Text>
      <Text style={styles.sectionSubcopy}>
        {t('customHair.hairColorBody')}
      </Text>
      <View style={styles.colorGrid}>
        {safeColors.map((color) => (
          <OptionChip
            key={color.id}
            label={color.name || t('common.color')}
            colorSwatch={color.hex || '#d7b998'}
            active={selectedColorId === color.id}
            onPress={() => onSelect(color.id)}
          />
        ))}
      </View>
    </Card>
  );
}

export function CustomHairLabScreen({ language = 'en', t = (key) => key, onBack }) {
  const safeDefaults = useMemo(
    () => ({
      ...FALLBACK_DEFAULTS,
      ...(customHairLabDefaults || {}),
    }),
    []
  );

  const safeOptions = useMemo(
    () => ({
      ...FALLBACK_OPTIONS,
      ...(customHairLabOptions || {}),
    }),
    []
  );

  const safeSchema = useMemo(
    () => ({
      ...FALLBACK_SCHEMA,
      ...(customHairLabParameterSchema || {}),
    }),
    []
  );

  const safeColors = useMemo(
    () => (Array.isArray(hairColors) ? hairColors.filter(Boolean) : []),
    []
  );

  const [draft, setDraft] = useState(() => createCustomHairLabPreset(safeDefaults));

  const selectedColor = useMemo(
    () => findHairColorById(safeColors, draft.hairColor),
    [draft.hairColor, safeColors]
  );
  const numericFields = useMemo(
    () => [
      { key: 'frontLengthCm', label: t('customHair.labels.frontLength'), unit: 'cm' },
      { key: 'topLengthCm', label: t('customHair.labels.topLength'), unit: 'cm' },
      { key: 'sideLengthMm', label: t('customHair.labels.sideLength'), unit: 'mm' },
      { key: 'backLengthMm', label: t('customHair.labels.backLength'), unit: 'mm' },
    ],
    [t]
  );

  const summaryLines = useMemo(
    () => [
      `${t('customHair.frontTop')}: ${formatNumericValue(draft.frontLengthCm, 'cm')} / ${formatNumericValue(draft.topLengthCm, 'cm')}`,
      `${t('customHair.sidesBack')}: ${formatNumericValue(draft.sideLengthMm, 'mm')} / ${formatNumericValue(draft.backLengthMm, 'mm')}`,
      `${t('customHair.fadeTaper')}: ${localizeLabOption(draft.fadeType, language)} / ${localizeLabOption(draft.taperLevel, language)}`,
      `${t('customHair.fringeParting')}: ${localizeLabOption(draft.fringeStyle, language)} / ${localizeLabOption(draft.parting, language)}`,
      `${t('customHair.textureVolume')}: ${localizeLabOption(draft.texture, language)} / ${localizeLabOption(draft.volume, language)}`,
      `${t('customHair.hairColorLine')}: ${selectedColor?.name || t('customHair.colorNotSet')}`,
      `${t('customHair.beardOptionLine')}: ${localizeLabOption(draft.beardOption, language)}`,
      `${t('customHair.styleMaintenance')}: ${localizeLabOption(draft.stylingPreference, language)} / ${localizeLabOption(draft.maintenancePreference, language)}`,
    ],
    [draft, language, selectedColor, t]
  );

  function updateNumericField(fieldKey, direction) {
    const config = safeSchema?.[fieldKey] || FALLBACK_SCHEMA[fieldKey] || { min: 0, max: 100, step: 1 };
    const currentValue = Number.isFinite(draft?.[fieldKey]) ? draft[fieldKey] : safeDefaults[fieldKey] || 0;
    const step = Number.isFinite(config?.step) ? config.step : 1;
    const nextValue = clampValue(currentValue + direction * step, config);

    setDraft((currentDraft) => ({
      ...currentDraft,
      [fieldKey]: Number(nextValue.toFixed(1)),
    }));
  }

  function updateOptionField(fieldKey, nextValue) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [fieldKey]: nextValue,
    }));
  }

  function resetDraft() {
    setDraft(createCustomHairLabPreset(safeDefaults));
  }

  return (
    <ScreenContainer
      eyebrow={t('customHair.eyebrow')}
      title={t('customHair.title')}
      subtitle={t('customHair.subtitle')}
    >
      <Card accent="amber">
        <Text style={styles.cardTitle}>{t('customHair.introTitle')}</Text>
        <Text style={styles.bodyText}>
          {t('customHair.introBody')}
        </Text>
        <View style={styles.badgeRow}>
          <BadgePill tone="amber" label={t('common.localOnly')} />
          <BadgePill tone="mint" label={t('common.noAiYet')} />
          <BadgePill tone="sky" label={t('common.betaV1')} />
        </View>
      </Card>

      <Card accent="sky">
        <Text style={styles.cardTitle}>{t('customHair.summaryTitle')}</Text>
        <Text style={styles.bodyText}>
          {t('customHair.summaryBody')}
        </Text>
        <View style={styles.summaryWrap}>
          {summaryLines.map((line) => (
            <Text key={line} style={styles.summaryLine}>
              - {line}
            </Text>
          ))}
        </View>
        <View style={styles.badgeRow}>
          <BadgePill tone="rose" label={selectedColor?.name || t('customHair.colorNotSet')} />
          <BadgePill tone="mint" label={`${t('customHair.maintenanceShort')}: ${localizeLabOption(draft.maintenancePreference, language)}`} />
          <BadgePill tone="sky" label={`${t('customHair.styleShort')}: ${localizeLabOption(draft.stylingPreference, language)}`} />
        </View>
      </Card>

      <Card accent="sky">
        <Text style={styles.cardTitle}>{t('customHair.lengthControlsTitle')}</Text>
        <Text style={styles.sectionSubcopy}>
          {t('customHair.lengthControlsBody')}
        </Text>
        <View style={styles.stepperGrid}>
          {numericFields.map((field) => (
            <StepperField
              key={field.key}
              label={field.label}
              unit={field.unit}
              value={draft?.[field.key] ?? safeDefaults[field.key] ?? 0}
              onDecrease={() => updateNumericField(field.key, -1)}
              onIncrease={() => updateNumericField(field.key, 1)}
            />
          ))}
        </View>
      </Card>

      <OptionSection
        language={language}
        title={t('customHair.sections.fadeType')}
        value={draft.fadeType}
        options={safeOptions.fadeTypes}
        onSelect={(nextValue) => updateOptionField('fadeType', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.taperLevel')}
        value={draft.taperLevel}
        options={safeOptions.taperLevels}
        onSelect={(nextValue) => updateOptionField('taperLevel', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.fringeStyle')}
        value={draft.fringeStyle}
        options={safeOptions.fringeStyles}
        onSelect={(nextValue) => updateOptionField('fringeStyle', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.parting')}
        value={draft.parting}
        options={safeOptions.partings}
        onSelect={(nextValue) => updateOptionField('parting', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.texture')}
        value={draft.texture}
        options={safeOptions.textures}
        onSelect={(nextValue) => updateOptionField('texture', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.volume')}
        value={draft.volume}
        options={safeOptions.volumes}
        onSelect={(nextValue) => updateOptionField('volume', nextValue)}
      />

      <HairColorSection
        language={language}
        t={t}
        selectedColorId={draft.hairColor}
        colors={safeColors}
        onSelect={(nextValue) => updateOptionField('hairColor', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.beardOption')}
        value={draft.beardOption}
        options={safeOptions.beardOptions}
        onSelect={(nextValue) => updateOptionField('beardOption', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.stylingPreference')}
        value={draft.stylingPreference}
        options={safeOptions.stylingPreferences}
        onSelect={(nextValue) => updateOptionField('stylingPreference', nextValue)}
      />

      <OptionSection
        language={language}
        title={t('customHair.sections.maintenancePreference')}
        value={draft.maintenancePreference}
        options={safeOptions.maintenancePreferences}
        onSelect={(nextValue) => updateOptionField('maintenancePreference', nextValue)}
      />

      <Card>
        <Text style={styles.cardTitle}>{t('customHair.nextTitle')}</Text>
        <Text style={styles.bodyText}>
          {t('customHair.nextBody')}
        </Text>
        <View style={styles.actionStack}>
          <PrimaryButton label={t('customHair.useSoon')} onPress={() => {}} disabled />
          <PrimaryButton label={t('customHair.reset')} onPress={resetDraft} variant="secondary" />
          <PrimaryButton label={t('customHair.backToDiscovery')} onPress={onBack} variant="secondary" />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102a22',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17392f',
  },
  sectionSubcopy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5f6f65',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stepperGrid: {
    gap: 12,
  },
  stepperCard: {
    paddingVertical: 14,
  },
  stepperLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#17392f',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b4332',
  },
  stepperButtonText: {
    color: '#fffaf3',
    fontSize: 24,
    fontWeight: '800',
    marginTop: -2,
  },
  stepperValueWrap: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: '#f8f3eb',
    borderWidth: 1,
    borderColor: '#d8e4fb',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#17392f',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c8d6cc',
    backgroundColor: '#fffaf3',
  },
  optionChipActive: {
    backgroundColor: '#1b4332',
    borderColor: '#1b4332',
  },
  optionChipLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: '#375147',
  },
  optionChipLabelActive: {
    color: '#fffaf3',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffffff66',
  },
  summaryWrap: {
    gap: 4,
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 21,
    color: '#41574d',
  },
  actionStack: {
    gap: 10,
  },
});
