import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconName, icons } from '../components/icons';
import Card from '../components/Card';
import SettingRow from '../components/SettingRow';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// No website row: the only site there is still carries the old brand's domain,
// and linking a Hail customer to it reads as a different restaurant. It comes
// back when a Hail domain exists.
const CHANNELS: { id: string; icon: IconName; url: string }[] = [
  { id: 'call', icon: 'phone', url: `tel:${SUPPORT_PHONE}` },
  { id: 'whatsapp', icon: 'chat', url: `https://wa.me/${SUPPORT_WHATSAPP}` },
];

export default function SupportScreen({ navigation }: RootStackScreenProps<'Support'>) {
  const { t } = useLanguage();

  // Silently ignored when nothing on the device can open it — a simulator with
  // no dialler should not throw an unhandled rejection at a support screen.
  const open = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

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
          <Text style={styles.title}>{t('profile.support')}</Text>
          <Text style={styles.subtitle}>{t('support.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={0} style={styles.rows}>
          {CHANNELS.map((c, i) => (
            <SettingRow
              key={c.id}
              first={i === 0}
              icon={c.icon}
              label={t(`support.${c.id}`)}
              sub={t(`support.${c.id}.sub`)}
              onPress={() => open(c.url)}
            />
          ))}
        </Card>

        <View style={styles.hours}>
          <Icon path={icons.clock} size={17} color={colors.tealText} strokeWidth={2} />
          <Text style={styles.hoursText}>{t('support.hours')}</Text>
        </View>
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
  hours: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.healthyBg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  hoursText: {
    ...type.bodyStrong,
    flex: 1,
    color: colors.tealText,
  },
});
