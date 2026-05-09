import { StyleSheet, View } from 'react-native';

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
    backgroundColor: '#fffaf3',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e8dcc9',
    gap: 12,
  },
  cardAmber: {
    backgroundColor: '#fff2d6',
    borderColor: '#f3d39a',
  },
  cardMint: {
    backgroundColor: '#e7f8ef',
    borderColor: '#a8e0c0',
  },
  cardRose: {
    backgroundColor: '#ffe6e0',
    borderColor: '#efb6a8',
  },
  cardSky: {
    backgroundColor: '#e8f2ff',
    borderColor: '#b7d3ff',
  },
});
