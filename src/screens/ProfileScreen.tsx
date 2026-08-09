import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { type IconName, icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import MacroRow from '../components/MacroRow';
import SectionHeader from '../components/SectionHeader';
import { colors, fonts, radius, spacing, type } from '../theme';
import { type Lang, useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import { toArabicDigits } from '../i18n/digits';
import type { TabScreenProps } from '../navigation/RootNavigator';

interface Row {
  key: string;
  icon: IconName;
  tint: string;
  color: string;
}

const ACCOUNT_ROWS: Row[] = [
  { key: 'addresses', icon: 'pin', tint: colors.healthyBg, color: colors.teal },
  { key: 'payments', icon: 'creditCard', tint: colors.regularBg, color: colors.amberIcon },
];

const SETTINGS_ROWS: Row[] = [
  { key: 'notifications', icon: 'bell', tint: colors.sandChip, color: colors.body },
  { key: 'support', icon: 'chat', tint: colors.sandChip, color: colors.body },
];

const LANGS: Lang[] = ['ar', 'en'];

export default function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const { t, lang, isRTL, setLang } = useLanguage();
  const { status, user, profile, targets, signOut } = useAuth();
  const authed = status === 'authed';
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;

  const renderRow = (row: Row, first: boolean) => (
    <View key={row.key}>
      {first ? null : <View style={styles.divider} />}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={t(`profile.${row.key}`)}
      >
        <View style={[styles.tile, { backgroundColor: row.tint }]}>
          <Icon path={icons[row.icon]} size={18} color={row.color} strokeWidth={1.9} />
        </View>
        <Text style={styles.rowLabel}>{t(`profile.${row.key}`)}</Text>
        <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon
            path={authed ? icons.user : icons.userPlus}
            size={28}
            color={colors.tealText}
            strokeWidth={1.7}
          />
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {authed ? user?.phone : t('profile.guest')}
          </Text>
          {profile ? (
            <Text style={styles.identitySub} numberOfLines={1}>
              {`${t(`goal.${profile.goal}`)} · ${t(`activity.${profile.activity}`)}`}
            </Text>
          ) : null}
        </View>
        {profile ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Onboarding')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={t('common.edit')}
          >
            <Text style={styles.editLink}>{t('common.edit')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {profile && targets ? (
        <Card
          background={colors.healthyBg}
          onPress={() => navigation.navigate('Onboarding')}
          accessibilityLabel={t('plans.yourTarget')}
          style={styles.body}
        >
          <View style={styles.bodyStats}>
            <View style={styles.stat}>
              <Icon path={icons.scale} size={18} color={colors.tealText} strokeWidth={1.8} />
              <Text style={styles.statValue}>
                {`${toArabicDigits(profile.weightKg, lang)} ${t('unit.kg')}`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Icon path={icons.ruler} size={18} color={colors.tealText} strokeWidth={1.8} />
              <Text style={styles.statValue}>
                {`${toArabicDigits(profile.heightCm, lang)} ${t('unit.cm')}`}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Icon path={icons.cake} size={18} color={colors.tealText} strokeWidth={1.8} />
              <Text style={styles.statValue}>
                {`${toArabicDigits(profile.age, lang)} ${t('unit.years')}`}
              </Text>
            </View>
          </View>
          <MacroRow macros={targets} />
        </Card>
      ) : (
        <Card
          onPress={() => navigation.navigate(authed ? 'Onboarding' : 'Login')}
          style={styles.prompt}
        >
          <View style={[styles.tile, { backgroundColor: colors.healthyBg }]}>
            <Icon path={icons.ruler} size={18} color={colors.teal} strokeWidth={1.9} />
          </View>
          <Text style={styles.rowLabel}>{t('plans.setupProfile')}</Text>
          <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
        </Card>
      )}

      <View style={styles.section}>
        <SectionHeader title={t('profile.account')} />
        <Card padding={0} style={styles.rows}>
          {ACCOUNT_ROWS.map((row, i) => renderRow(row, i === 0))}
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t('profile.settings')} />
        <Card padding={0} style={styles.rows}>
          {SETTINGS_ROWS.map((row, i) => renderRow(row, i === 0))}
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={[styles.tile, { backgroundColor: colors.sandChip }]}>
              <Icon path={icons.globe} size={18} color={colors.body} strokeWidth={1.9} />
            </View>
            <Text style={styles.rowLabel}>{t('profile.language')}</Text>
            <View style={styles.segment}>
              {LANGS.map((l) => {
                const on = lang === l;
                return (
                  <TouchableOpacity
                    key={l}
                    activeOpacity={0.8}
                    onPress={() => setLang(l)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={t(`lang.${l}`)}
                    style={[styles.segmentItem, on && styles.segmentItemOn]}
                  >
                    <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                      {t(`lang.${l}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>
      </View>

      {authed ? (
        <Button
          label={t('profile.signOut')}
          variant="outline"
          size="lg"
          full
          color={colors.coral}
          onPress={signOut}
        />
      ) : (
        <Button
          label={t('login.title')}
          variant="primary"
          size="lg"
          full
          onPress={() => navigation.navigate('Login')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.healthyBg,
    borderWidth: 2.5,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...type.h2,
    color: colors.ink,
  },
  identitySub: {
    ...type.caption,
    color: colors.muted2,
  },
  editLink: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.teal,
  },
  body: {
    gap: spacing.xxl,
  },
  bodyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: colors.healthyBorder,
  },
  statValue: {
    ...type.captionStrong,
    color: colors.tealText,
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  section: {
    gap: spacing.xl,
  },
  rows: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...type.title,
    color: colors.ink,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sandChip,
    marginHorizontal: spacing.xxl,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.sandChip,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 5,
  },
  segmentItemOn: {
    backgroundColor: colors.teal,
  },
  segmentText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.muted2,
  },
  segmentTextOn: {
    color: colors.white,
  },
});
