import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export function FilterTabs({ filters, activeFilter, onSelectFilter, labelMap = {} }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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
    gap: 8,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#efe5d8',
  },
  tabActive: {
    backgroundColor: '#1b4332',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#42564d',
  },
  labelActive: {
    color: '#fffaf3',
  },
});
