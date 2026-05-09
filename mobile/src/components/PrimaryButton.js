import { Pressable, StyleSheet, Text } from 'react-native';

export function PrimaryButton({ label, onPress, disabled, variant = 'primary' }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' ? styles.secondary : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.secondaryLabel : styles.primaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#1b4332',
  },
  secondary: {
    backgroundColor: '#e8dcc9',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  primaryLabel: {
    color: '#fffaf3',
  },
  secondaryLabel: {
    color: '#1f352d',
  },
});
