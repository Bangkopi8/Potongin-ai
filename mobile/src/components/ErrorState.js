import { StyleSheet, Text, View } from 'react-native';

export function ErrorState({ title = 'Something went wrong', message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fee2e2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#991b1b',
  },
});
