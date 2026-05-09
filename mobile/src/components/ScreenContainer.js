import { StyleSheet, Text, View } from 'react-native';

export function ScreenContainer({ eyebrow, title, subtitle, children }) {
  return (
    <View style={styles.stack}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontSize: 11,
    fontWeight: '800',
    color: '#c96f4a',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#102a22',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#56685f',
    maxWidth: 720,
  },
});
