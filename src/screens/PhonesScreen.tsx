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
import { formatNumber } from '../i18n/digits';
import { formatPhone } from '../data/phone';
import { useAuth } from '../state/AuthContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

export default function PhonesScreen({ navigation }: RootStackScreenProps<'Phones'>) {
  const { t } = useLanguage();
  const { user, phones, setPrimaryPhone, removePhone } = useAuth();

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
          <Text style={styles.title}>{t('profile.phones')}</Text>
          <Text style={styles.subtitle}>{t('phones.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={0} style={styles.rows}>
          {phones.map((phone, i) => {
            const primary = phone === user?.phone;
            const label = formatNumber(formatPhone(phone));
            return (
              <SettingRow
                key={phone}
                first={i === 0}
                icon="phone"
                label={label}
                sub={t(primary ? 'phones.primary' : 'phones.secondary')}
                // The primary is already the one in use, so tapping it would be
                // a no-op; its row action is the replacement flow instead.
                onPress={primary ? undefined : () => setPrimaryPhone(phone)}
                accessibilityLabel={`${label} · ${t(primary ? 'phones.primary' : 'phones.secondary')}`}
                trailing={
                  <View style={styles.actions}>
                    {primary ? (
                      <PressScale
                        onPress={() => navigation.navigate('AddPhone', { asPrimary: true })}
                        scaleTo={0.88}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={t('phones.change')}
                        style={styles.action}
                      >
                        <Icon path={icons.refresh} size={14} color={colors.muted} strokeWidth={2.2} />
                      </PressScale>
                    ) : (
                      <PressScale
                        onPress={() => removePhone(phone)}
                        scaleTo={0.88}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel={t('phones.remove')}
                        style={styles.action}
                      >
                        <Icon path={icons.close} size={11} color={colors.muted} strokeWidth={2.6} />
                      </PressScale>
                    )}

                    <View style={[styles.tick, primary && styles.tickOn]}>
                      {primary ? (
                        <Icon path={icons.check} size={11} color={colors.white} strokeWidth={3} />
                      ) : null}
                    </View>
                  </View>
                }
              />
            );
          })}
        </Card>

        <Text style={styles.note}>{t('phones.note')}</Text>

        <Button
          label={t('phones.add')}
          variant="primary"
          size="lg"
          full
          onPress={() => navigation.navigate('AddPhone', { asPrimary: false })}
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
    gap: spacing.xxl,
  },
  rows: {
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  action: {
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
  note: {
    ...type.caption,
    color: colors.muted2,
  },
});
