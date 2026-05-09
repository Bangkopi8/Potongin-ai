import { StyleSheet, Text, View } from 'react-native';

export function StatusNotice({ tone = 'info', title, message }) {
  return (
    <View
      style={[
        styles.base,
        tone === 'success' && styles.success,
        tone === 'warning' && styles.warning,
        tone === 'error' && styles.error,
      ]}
    >
      <Text
        style={[
          styles.title,
          tone === 'success' && styles.successText,
          tone === 'warning' && styles.warningText,
          tone === 'error' && styles.errorText,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          tone === 'success' && styles.successText,
          tone === 'warning' && styles.warningText,
          tone === 'error' && styles.errorText,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#eef6ff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  success: {
    backgroundColor: '#e7f8ef',
    borderColor: '#a8e0c0',
  },
  warning: {
    backgroundColor: '#fff4dd',
    borderColor: '#f2d38f',
  },
  error: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1e3a8a',
  },
  successText: {
    color: '#166534',
  },
  warningText: {
    color: '#8a5d12',
  },
  errorText: {
    color: '#991b1b',
  },
});
