import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme.js';

export function StatusNotice({ tone = 'info', title, message }) {
  return (
    <View
      style={[
        styles.base,
        tone === 'success' && styles.success,
        tone === 'warning' && styles.warning,
        tone === 'error' && styles.error,
      ]}
    >
      {title ? (
        <Text
          style={[
            styles.title,
            tone === 'success' && styles.successText,
            tone === 'warning' && styles.warningText,
            tone === 'error' && styles.errorText,
          ]}
        >
          {title}
        </Text>
      ) : null}
      {message ? (
        <Text
          style={[
            styles.message,
            tone === 'success' && styles.successText,
            tone === 'warning' && styles.warningText,
            tone === 'error' && styles.errorText,
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.infoBg,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    gap: spacing.xs,
  },
  success: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  warning: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  error: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.info,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.info,
  },
  successText: { color: colors.success },
  warningText: { color: colors.warning },
  errorText: { color: colors.error },
});
