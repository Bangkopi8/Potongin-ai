import { StyleSheet, Text } from 'react-native';

import { Card } from './Card.js';

export function PhotoQualityGuide({ items, title, description }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title || 'Photo quality guide'}</Text>
      <Text style={styles.bodyText}>
        {description || 'Use these simple checks before you confirm your beta photo.'}
      </Text>
      {items.map((item) => (
        <Text key={item} style={styles.bulletLine}>
          - {item}
        </Text>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102a22',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
  },
  bulletLine: {
    fontSize: 14,
    lineHeight: 21,
    color: '#42564d',
  },
});
