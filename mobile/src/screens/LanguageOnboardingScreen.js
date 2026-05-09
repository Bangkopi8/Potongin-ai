import { StyleSheet, Text, View } from 'react-native';

import { Card, PrimaryButton, ScreenContainer } from '../components/index.js';

export function LanguageOnboardingScreen({
  t = (key) => key,
  onSelectLanguage,
}) {
  return (
    <ScreenContainer
      eyebrow={t('languageOnboarding.eyebrow')}
      title={t('languageOnboarding.title')}
      subtitle={t('languageOnboarding.subtitle')}
    >
      <Card accent="mint">
        <Text style={styles.prompt}>Pilih bahasa / Choose your language</Text>
        <View style={styles.buttonStack}>
          <PrimaryButton
            label={t('languageOnboarding.indonesianButton')}
            onPress={() => onSelectLanguage?.('id')}
          />
          <PrimaryButton
            label={t('languageOnboarding.englishButton')}
            onPress={() => onSelectLanguage?.('en')}
            variant="secondary"
          />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonStack: {
    gap: 12,
  },
});
