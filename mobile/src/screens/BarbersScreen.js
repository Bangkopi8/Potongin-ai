import { StyleSheet, Text } from 'react-native';

import { Card, ScreenContainer } from '../components/index.js';
import { localizeCustomerText } from '../utils/localizeCustomerCopy.js';

export function BarbersScreen({ language = 'en', t = (key) => key, barbershops }) {
  const safeBarbershops = Array.isArray(barbershops) ? barbershops : [];

  return (
    <ScreenContainer
      eyebrow={t('barbers.eyebrow')}
      title={t('barbers.title')}
      subtitle={t('barbers.subtitle')}
    >
      {safeBarbershops.map((shop) => (
        <Card key={shop.id}>
          <Text style={styles.cardTitle}>{shop.name}</Text>
          <Text style={styles.bodyText}>
            {localizeCustomerText(shop.specialty || t('barbers.specialtyFallback'), language)}
          </Text>
          <Text style={styles.metaText}>{shop.location}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102a22',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#46594f',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7a6652',
  },
});
