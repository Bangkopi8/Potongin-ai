import { StyleSheet, Text, View } from 'react-native';

import { Card, ScreenContainer } from '../components/index.js';
import { colors, radius, spacing, type } from '../theme.js';
import { localizeCustomerText } from '../utils/localizeCustomerCopy.js';

function StatusDot({ status }) {
  const isVerified = status === 'verified';
  return (
    <View style={styles.statusRow}>
      <View style={[styles.dot, isVerified ? styles.dotVerified : styles.dotPending]} />
      <Text style={[styles.statusText, isVerified ? styles.statusVerified : styles.statusPending]}>
        {isVerified ? 'Verified' : 'Pending'}
      </Text>
    </View>
  );
}

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
          <View style={styles.shopHeader}>
            <View style={styles.shopInitial}>
              <Text style={styles.shopInitialText}>
                {String(shop.name || '').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <StatusDot status={shop.status} />
            </View>
          </View>
          <Text style={styles.specialty}>
            {localizeCustomerText(shop.specialty || t('barbers.specialtyFallback'), language)}
          </Text>
          {shop.location ? (
            <View style={styles.locationRow}>
              <Text style={styles.locationPin}>📍</Text>
              <Text style={styles.locationText}>{shop.location}</Text>
            </View>
          ) : null}
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  shopInitial: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInitialText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  shopInfo: {
    flex: 1,
    gap: 4,
  },
  shopName: {
    ...type.h3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotVerified: {
    backgroundColor: colors.success,
  },
  dotPending: {
    backgroundColor: colors.textMuted,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusVerified: {
    color: colors.success,
  },
  statusPending: {
    color: colors.textMuted,
  },
  specialty: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationPin: {
    fontSize: 13,
  },
  locationText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
});
