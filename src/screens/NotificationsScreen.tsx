import React from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconName, icons } from '../components/icons';
import Card from '../components/Card';
import SettingRow from '../components/SettingRow';
import { colors, radius, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useStoredState } from '../state/useStoredState';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const TOPICS: { id: string; icon: IconName; on: boolean }[] = [
  // Order status is the one nobody should have to opt into — it is the whole
  // reason the app can be closed while food is on its way.
  { id: 'orders', icon: 'truck', on: true },
  { id: 'plan', icon: 'calendar', on: true },
  { id: 'offers', icon: 'star', on: false },
];

export default function NotificationsScreen({
  navigation,
}: RootStackScreenProps<'Notifications'>) {
  const { t } = useLanguage();
  const [on, setOn] = useStoredState<Record<string, boolean>>(
    '@jareesh/notifications',
    Object.fromEntries(TOPICS.map((topic) => [topic.id, topic.on])),
  );

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
          <Text style={styles.title}>{t('profile.notifications')}</Text>
          <Text style={styles.subtitle}>{t('notifications.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding={0} style={styles.rows}>
          {TOPICS.map((topic, i) => (
            <SettingRow
              key={topic.id}
              first={i === 0}
              icon={topic.icon}
              label={t(`notifications.${topic.id}`)}
              sub={t(`notifications.${topic.id}.sub`)}
              trailing={
                <Switch
                  value={on[topic.id] ?? topic.on}
                  onValueChange={(next) => setOn({ ...on, [topic.id]: next })}
                  trackColor={{ false: colors.sand, true: colors.teal }}
                  thumbColor={colors.white}
                  ios_backgroundColor={colors.sand}
                  accessibilityLabel={t(`notifications.${topic.id}`)}
                />
              }
            />
          ))}
        </Card>

        <Text style={styles.note}>{t('notifications.note')}</Text>
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
  note: {
    ...type.caption,
    color: colors.muted2,
    paddingHorizontal: spacing.xs,
  },
});
