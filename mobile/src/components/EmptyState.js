import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({ title, message }) {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingVertical: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#28443a',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#63756b',
  },
});
