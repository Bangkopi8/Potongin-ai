import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, type } from '../theme.js';

export function ScreenContainer({ eyebrow, title, subtitle, children }) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.stack}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  eyebrow: {
    ...type.eyebrow,
    marginBottom: spacing.xs,
  },
  title: {
    ...type.h1,
  },
  subtitle: {
    ...type.body,
    marginTop: spacing.xs,
    maxWidth: 480,
  },
  stack: {
    gap: spacing.lg,
  },
});
