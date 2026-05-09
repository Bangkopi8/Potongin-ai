import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme.js';

export function ErrorState({ title = 'Something went wrong', message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.error,
  },
});
