import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme.js';

export function BadgePill({ tone = 'default', label }) {
  return (
    <View
      style={[
        styles.base,
        tone === 'mint' && styles.mint,
        tone === 'amber' && styles.amber,
        tone === 'rose' && styles.rose,
        tone === 'sky' && styles.sky,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'mint' && styles.mintText,
          tone === 'amber' && styles.amberText,
          tone === 'rose' && styles.roseText,
          tone === 'sky' && styles.skyText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mint: {
    backgroundColor: colors.mintBg,
    borderColor: colors.successBorder,
  },
  amber: {
    backgroundColor: colors.amberBg,
    borderColor: colors.amberBorder,
  },
  rose: {
    backgroundColor: colors.roseBg,
    borderColor: '#fecdd3',
  },
  sky: {
    backgroundColor: colors.skyBg,
    borderColor: colors.infoBorder,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  mintText: { color: colors.mintText },
  amberText: { color: colors.amberText },
  roseText: { color: colors.roseText },
  skyText: { color: colors.skyText },
});
