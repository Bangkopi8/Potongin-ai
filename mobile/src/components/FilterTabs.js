import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing } from '../theme.js';

export function FilterTabs({ filters, activeFilter, onSelectFilter, labelMap = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {filters.map((filter) => {
        const isActive = filter === activeFilter;
        const visibleLabel = labelMap?.[filter] || filter;

        return (
          <Pressable
            key={filter}
            onPress={() => onSelectFilter(filter)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{visibleLabel}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.bgMuted,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  labelActive: {
    color: '#ffffff',
  },
});
