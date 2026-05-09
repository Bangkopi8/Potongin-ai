import { StyleSheet, View } from 'react-native';

import { colors, radius, shadow, spacing } from '../theme.js';

export function Card({ accent = 'default', children, style }) {
  return (
    <View
      style={[
        styles.card,
        accent === 'amber' && styles.cardAmber,
        accent === 'mint' && styles.cardMint,
        accent === 'rose' && styles.cardRose,
        accent === 'sky' && styles.cardSky,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.card,
  },
  cardAmber: {
    backgroundColor: colors.amberLight,
    borderColor: colors.amberBorder,
  },
  cardMint: {
    backgroundColor: colors.mintBg,
    borderColor: colors.successBorder,
  },
  cardRose: {
    backgroundColor: colors.roseBg,
    borderColor: '#fecdd3',
  },
  cardSky: {
    backgroundColor: colors.skyBg,
    borderColor: colors.infoBorder,
  },
});
