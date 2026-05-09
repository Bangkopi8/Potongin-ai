import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, PrimaryButton, ScreenContainer, StatusNotice } from '../components/index.js';

const DEMO_EMAIL = 'fiankimubox@gmail.com';

export function DemoAuthScreen({
  t = (key) => key,
  onLogin,
}) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isSignup = mode === 'signup';
  const passwordPlaceholder = t('auth.passwordPlaceholder');
  const buttonLabel = isSignup ? t('auth.createButton') : t('auth.continueButton');
  const helperMessage = isSignup ? t('auth.signupNote') : t('auth.demoOnly');
  function handleSubmit() {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();

    if (!normalizedEmail) {
      setErrorMessage(t('auth.missingEmail'));
      return;
    }

    if (!normalizedPassword) {
      setErrorMessage(t('auth.missingPassword'));
      return;
    }

    setErrorMessage('');
    onLogin?.({
      email: normalizedEmail,
      mode,
    });
    setPassword('');
  }

  return (
    <ScreenContainer
      eyebrow={t('auth.eyebrow')}
      title={t('auth.title')}
      subtitle={t('auth.subtitle')}
    >
      <Card accent="mint">
        <View style={styles.modeRow}>
          {['login', 'signup'].map((value) => {
            const active = mode === value;
            const label = value === 'login' ? t('auth.loginTab') : t('auth.signupTab');

            return (
              <Pressable
                key={value}
                onPress={() => setMode(value)}
                style={[styles.modeButton, active && styles.modeButtonActive]}
              >
                <Text style={[styles.modeButtonLabel, active && styles.modeButtonLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.helperText}>{helperMessage}</Text>

        {errorMessage ? (
          <StatusNotice tone="error" title={t('auth.eyebrow')} message={errorMessage} />
        ) : (
          <StatusNotice tone="info" title={t('auth.successTitle')} message={t('auth.emailHint')} />
        )}

        <View style={styles.fieldStack}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t('auth.emailLabel')}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={DEMO_EMAIL}
              placeholderTextColor="#8a8479"
              style={styles.input}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>{t('auth.passwordLabel')}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder={passwordPlaceholder}
              placeholderTextColor="#8a8479"
              style={styles.input}
            />
          </View>
        </View>

        <PrimaryButton label={buttonLabel} onPress={handleSubmit} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f2e8d8',
    borderWidth: 1,
    borderColor: '#e0d2bc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#14342b',
    borderColor: '#14342b',
  },
  modeButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3f554b',
  },
  modeButtonLabelActive: {
    color: '#fffaf3',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#46594f',
  },
  fieldStack: {
    gap: 14,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14342b',
  },
  input: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d8cab5',
    backgroundColor: '#fffaf3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1b4332',
  },
});
