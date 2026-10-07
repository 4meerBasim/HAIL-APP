import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import PressScale from '../components/PressScale';
import Reveal from '../components/Reveal';
import SettingRow from '../components/SettingRow';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useLocations } from '../state/LocationContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function AddressesScreen({ navigation }: RootStackScreenProps<'Addresses'>) {
  const { t } = useLanguage();
  const { locations, selected, selectLocation, toggleFavourite, removeLocation, hydrated } =
    useLocations();
  // A saved address can hold a gate code and a landmark that took a while to
  // pin, and the remove cross sits a thumb's width from the favourite star —
  // so it is asked rather than done.
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

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
        {!hydrated ? null : locations.length === 0 ? (
          <Reveal style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon path={icons.pin} size={28} color={colors.faint} strokeWidth={1.6} />
            </View>
            <Text style={styles.emptyTitle}>{t('addresses.empty.title')}</Text>
            <Text style={styles.emptySub}>{t('addresses.empty.sub')}</Text>
            <Button
              label={t('addresses.add')}
              size="md"
              onPress={() => navigation.navigate('Map')}
              style={styles.emptyBtn}
            />
          </Reveal>
        ) : (
          <>
            <Card padding={0} style={styles.rows}>
              {locations.map((l, i) => {
                const on = l.id === selected?.id;
                const name = l.label || t('location.pinned');
                return (
                  <SettingRow
                    key={l.id}
                    first={i === 0}
                    icon="pin"
                    label={name}
                    sub={l.address}
                    onPress={() => selectLocation(l.id)}
                    accessibilityLabel={`${name} · ${l.address}`}
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

                        <PressScale
                          onPress={() => setRemoving({ id: l.id, name })}
                          scaleTo={0.88}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          accessibilityLabel={t('addresses.remove')}
                          style={styles.remove}
                        >
                          <Icon path={icons.close} size={11} color={colors.muted} strokeWidth={2.6} />
                        </PressScale>

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
          </>
        )}
      </ScrollView>

      <Dialog
        visible={removing !== null}
        title={t('addresses.remove.title')}
        message={t('addresses.remove.message').replace('{name}', removing?.name ?? '')}
        primaryLabel={t('common.cancel')}
        onPrimary={() => setRemoving(null)}
        secondaryLabel={t('addresses.remove.confirm')}
        onSecondary={() => {
          if (removing) removeLocation(removing.id);
          setRemoving(null);
        }}
        onClose={() => setRemoving(null)}
      />
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
  empty: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.giant,
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    ...type.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySub: {
    ...type.body,
    color: colors.muted2,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.md,
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
