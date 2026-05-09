import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, StatusNotice } from '../components/index.js';
import { colors, radius, shadow, spacing, type } from '../theme.js';

const DEMO_EMAIL = 'fiankimubox@gmail.com';

export function DemoAuthScreen({ t = (key) => key, onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isSignup = mode === 'signup';

  function handleSubmit() {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();
    if (!normalizedEmail) { setErrorMessage(t('auth.missingEmail')); return; }
    if (!normalizedPassword) { setErrorMessage(t('auth.missingPassword')); return; }
    setErrorMessage('');
    onLogin?.({ email: normalizedEmail, mode });
    setPassword('');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* Brand mark */}
        <View style={styles.brand}>
          <Text style={styles.brandName}>Potongin AI</Text>
          <Text style={styles.brandTagline}>{t('auth.subtitle')}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Mode toggle */}
          <View style={styles.modeRow}>
            {['login', 'signup'].map((value) => {
              const active = mode === value;
              const label = value === 'login' ? t('auth.loginTab') : t('auth.signupTab');
              return (
                <Pressable
                  key={value}
                  onPress={() => setMode(value)}
                  style={[styles.modeTab, active && styles.modeTabActive]}
                >
                  <Text style={[styles.modeTabLabel, active && styles.modeTabLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Notice */}
          {errorMessage ? (
            <StatusNotice tone="error" title={t('auth.eyebrow')} message={errorMessage} />
          ) : (
            <StatusNotice tone="info" title={t('auth.successTitle')} message={isSignup ? t('auth.signupNote') : t('auth.demoOnly')} />
          )}

          {/* Fields */}
          <View style={styles.fieldStack}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('auth.emailLabel')}</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder={DEMO_EMAIL}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('auth.passwordLabel')}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholder={t('auth.passwordPlaceholder')}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <PrimaryButton
            label={isSignup ? t('auth.createButton') : t('auth.continueButton')}
            onPress={handleSubmit}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgBase,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    gap: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.forest,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.lg,
    ...shadow.cardStrong,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgMuted,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.bgCard,
    ...shadow.card,
  },
  modeTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  modeTabLabelActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  fieldStack: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
});
