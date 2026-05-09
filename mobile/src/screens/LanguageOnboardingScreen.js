import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../theme.js';

const LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', sub: 'Pilih bahasa ini' },
  { code: 'en', label: 'English', flag: '🇺🇸', sub: 'Choose this language' },
];

export function LanguageOnboardingScreen({ t = (key) => key, onSelectLanguage }) {
  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandName}>Potongin AI</Text>
          <Text style={styles.prompt}>Pilih bahasa / Choose your language</Text>
        </View>

        {/* Language tiles */}
        <View style={styles.tiles}>
          {LANGUAGES.map(({ code, label, flag, sub }) => (
            <Pressable
              key={code}
              onPress={() => onSelectLanguage?.(code)}
              style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            >
              <Text style={styles.tileFlag}>{flag}</Text>
              <View style={styles.tileMeta}>
                <Text style={styles.tileLabel}>{label}</Text>
                <Text style={styles.tileSub}>{sub}</Text>
              </View>
              <Text style={styles.tileArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandName: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.forest,
    letterSpacing: -1,
  },
  prompt: {
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  tiles: {
    gap: spacing.md,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow.card,
  },
  tilePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  tileFlag: {
    fontSize: 32,
  },
  tileMeta: {
    flex: 1,
    gap: 2,
  },
  tileLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tileSub: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  tileArrow: {
    fontSize: 24,
    color: colors.textMuted,
    fontWeight: '300',
  },
});
