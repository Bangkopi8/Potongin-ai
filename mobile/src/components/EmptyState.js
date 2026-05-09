import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme.js';

export function EmptyState({ title, message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✦</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  icon: {
    fontSize: 24,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textTertiary,
    textAlign: 'center',
    maxWidth: 280,
  },
});
