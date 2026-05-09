import { StyleSheet, Text, View } from 'react-native';

import { BadgePill } from './BadgePill.js';
import { Card } from './Card.js';
import { PrimaryButton } from './PrimaryButton.js';

export function RecommendationGroupCard({ group, onTryLook, selectedStyleId, labels = {} }) {
  if (!group) {
    return null;
  }

  const items = Array.isArray(group.items) ? group.items.filter(Boolean) : [];

  return (
    <Card accent="mint">
      <Text style={styles.title}>{group.title || labels.fallbackTitle || 'Recommendation group'}</Text>
      <Text style={styles.reason}>{group.reason || labels.fallbackReason || 'Curated beta recommendation group.'}</Text>

      {items.map((item) => {
        const isSelected =
          item?.kind === 'style' && (item.styleId || item.id) === selectedStyleId;

        return (
          <View key={item.id} style={[styles.itemBlock, isSelected && styles.itemBlockSelected]}>
            <Text style={styles.itemTitle}>{item.title || 'Recommendation'}</Text>
            <View style={styles.badges}>
              <BadgePill tone="amber" label={item.category || labels.categoryFallback || 'Curated'} />
              <BadgePill
                tone="mint"
                label={(labels.maintenanceLabel || 'Maint: {value}').replace(
                  '{value}',
                  item.maintenance || 'medium'
                )}
              />
              {isSelected ? <BadgePill tone="rose" label={labels.selectedBadge || 'Selected for Preview'} /> : null}
            </View>
            <Text style={styles.itemReason}>{item.reason || labels.fallbackReason || 'Selected by beta rules.'}</Text>
            {item.kind !== 'tip' ? (
              <PrimaryButton
                label={item.kind === 'color' ? labels.tryColor || 'Try This Color' : labels.tryLook || 'Try This Look'}
                onPress={() => onTryLook?.(item)}
              />
            ) : null}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#102a22',
  },
  reason: {
    fontSize: 14,
    lineHeight: 21,
    color: '#456154',
  },
  itemBlock: {
    gap: 8,
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#fffaf3',
    borderWidth: 1,
    borderColor: '#d7e9dd',
  },
  itemBlockSelected: {
    borderColor: '#1b4332',
    backgroundColor: '#f3fbf6',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14342b',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  itemReason: {
    fontSize: 13,
    lineHeight: 19,
    color: '#56685f',
  },
});
