import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import PressScale from '../components/PressScale';
import SettingRow from '../components/SettingRow';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { type SavedLocation, useLocations } from '../state/LocationContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function AddressesScreen({ navigation }: RootStackScreenProps<'Addresses'>) {
  const { t } = useLanguage();
  const { locations, selected, selectLocation, toggleFavourite, removeLocation } = useLocations();

  const labelOf = (l: SavedLocation) => (l.labelKey ? t(l.labelKey) : (l.label ?? ''));

  return (
    <Screen scroll={false} texture>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backBtn}
        >
          <Icon path={icons.close} size={16} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('profile.addresses')}</Text>
          <Text style={styles.subtitle}>{t('addresses.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={0} style={styles.rows}>
          {locations.map((l, i) => {
            const on = l.id === selected?.id;
            return (
              <SettingRow
                key={l.id}
                first={i === 0}
                icon="pin"
                label={labelOf(l)}
                sub={l.address}
                onPress={() => selectLocation(l.id)}
                accessibilityLabel={`${labelOf(l)} · ${l.address}`}
                trailing={
                  <View style={styles.actions}>
                    <PressScale
                      onPress={() => toggleFavourite(l.id)}
                      scaleTo={0.88}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel={t('location.markFavourite')}
                      accessibilityState={{ selected: l.favourite }}
                    >
                      <Icon
                        path={icons.star}
                        size={17}
                        color={l.favourite ? colors.gold : colors.faint2}
                        fill={l.favourite ? colors.gold : 'none'}
                        strokeWidth={1.9}
                      />
                    </PressScale>

                    {/* The last address is not removable — the cart, the plan
                        and the tracking map all read `selected`, and there is
                        no sane value for it once the list is empty. */}
                    {locations.length > 1 ? (
                      <PressScale
                        onPress={() => removeLocation(l.id)}
                        scaleTo={0.88}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={t('addresses.remove')}
                        style={styles.remove}
                      >
                        <Icon path={icons.close} size={11} color={colors.muted} strokeWidth={2.6} />
                      </PressScale>
                    ) : null}

                    <View style={[styles.tick, on && styles.tickOn]}>
                      {on ? (
                        <Icon path={icons.check} size={11} color={colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                  </View>
                }
              />
            );
          })}
        </Card>

        <Button
          label={t('addresses.add')}
          variant="primary"
          size="lg"
          full
          onPress={() => navigation.navigate('Map')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flexShrink: 1,
    gap: 2,
  },
  title: {
    ...type.h1,
    color: colors.ink,
  },
  subtitle: {
    ...type.caption,
    color: colors.muted2,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  rows: {
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  remove: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
});
