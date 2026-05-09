import { StyleSheet, Text, View } from 'react-native';

export function BadgePill({ tone = 'default', label }) {
  return (
    <View
      style={[
        styles.base,
        tone === 'mint' && styles.mint,
        tone === 'amber' && styles.amber,
        tone === 'rose' && styles.rose,
        tone === 'sky' && styles.sky,
      ]}
    >
      <Text
        style={[
          styles.label,
          tone === 'mint' && styles.mintText,
          tone === 'amber' && styles.amberText,
          tone === 'rose' && styles.roseText,
          tone === 'sky' && styles.skyText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#efe5d8',
  },
  mint: {
    backgroundColor: '#ddf4e6',
  },
  amber: {
    backgroundColor: '#fff0d0',
  },
  rose: {
    backgroundColor: '#ffe1d8',
  },
  sky: {
    backgroundColor: '#e4eefc',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#42564d',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mintText: {
    color: '#166534',
  },
  amberText: {
    color: '#9a5c15',
  },
  roseText: {
    color: '#a14831',
  },
  skyText: {
    color: '#1e4ea3',
  },
});
