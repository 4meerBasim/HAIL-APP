import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import AppTextInput from '../components/AppTextInput';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import PressScale from '../components/PressScale';
import DashedOutline from '../components/DashedOutline';
import SectionHeader from '../components/SectionHeader';
import SettingRow from '../components/SettingRow';
import { colors, fonts, ltrField, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import { DIAL_CODE, formatPhone, normalizePhone, phoneValid } from '../data/phone';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// 'change' replaces the primary outright — a new SIM, or the first number on
// an account opened with an email. 'add' appends a backup number and leaves the
// primary alone.
type Mode = 'change' | 'add';

// Shown in the local 0770 123 4567 grouping however the number was typed.
//
// The leading U+200E is a left-to-right mark: inside an Arabic paragraph the
// space-separated groups would otherwise be laid out last-to-first, so the mark
// pins the whole number into one LTR run. Alignment is left to the paragraph —
// the number still starts at the reading edge, which under Arabic is the right.
const display = (phone: string) => `\u200e${formatPhone(phone)}`;

export default function PhoneNumbersScreen({ navigation }: RootStackScreenProps<'PhoneNumbers'>) {
  const { t, isRTL } = useLanguage();
  const { user, changePrimary, addSecondary, removeSecondary, makePrimary } = useAuth();

  const [mode, setMode] = useState<Mode | null>(null);
  const [phone, setPhone] = useState('');
  const [duplicate, setDuplicate] = useState(false);

  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;
  // A dial code and its field read left-to-right together, so the row is
  // reversed back under RTL to keep +964 on the leading side.
  const phoneRowSide = { flexDirection: isRTL ? 'row-reverse' : 'row' } as const;
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;

  const toList = () => {
    setMode(null);
    setPhone('');
    setDuplicate(false);
  };

  // Back walks the flow one step at a time — number → list → Profile — so a
  // mistyped number costs one tap, not the whole screen.
  const onBack = () => {
    if (mode) toList();
    else navigation.goBack();
  };

  // Same rule as sign-in: an Iraqi mobile, 7 and nine more digits once the
  // country code and trunk zero are off.
  const phoneReady = phoneValid(phone);

  // No code step, the same as signing in: there is no API to send one, and a
  // code nobody sent that accepts any four digits verifies nothing. Stored in
  // the shape sign-in stores, so the two compare as one number.
  const onSave = () => {
    const value = `${DIAL_CODE}${normalizePhone(phone)}`;
    const saved = mode === 'change' ? changePrimary(value) : addSecondary(value);
    if (saved) toList();
    else setDuplicate(true);
  };

  // Only reachable from the signed-in hero, so there is always a user here; the
  // guard is what lets the rest of the render read it without a null check.
  if (!user) return null;

  // An account opened with an email has no number yet, so "change" would be
  // changing nothing — the same step is offered as adding one.
  const hasPrimary = user.phone !== '';

  const title = mode
    ? t(
        mode === 'add'
          ? 'phones.addTitle'
          : hasPrimary
            ? 'phones.changeTitle'
            : 'phones.addPrimaryTitle',
      )
    : t('phones.title');
  const subtitle = mode
    ? t(mode === 'change' ? 'phones.primary.sub' : 'phones.secondary.sub')
    : t('phones.subtitle');

  const addRow = (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setMode('add')}
      accessibilityRole="button"
      accessibilityLabel={t('phones.add')}
      style={[styles.addRow, shadow.card]}
    >
      <DashedOutline />
      <View style={styles.addTile}>
        <Icon path={icons.plus} size={18} color={colors.teal} strokeWidth={2.2} />
      </View>
      <View style={styles.addText}>
        <Text style={[styles.addLabel, readingSide]}>{t('phones.add')}</Text>
        <Text style={[styles.addSub, readingSide]}>{t('phones.empty')}</Text>
      </View>
      <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
    </TouchableOpacity>
  );

  return (
    <Screen scroll={false} texture>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={styles.backBtn}
        >
          <Icon path={icons.close} size={16} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {mode ? (
          <>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, readingSide]}>{t('phones.newLabel')}</Text>
              <View style={[styles.phoneRow, phoneRowSide]}>
                <View style={styles.prefix}>
                  {/* A leading LRM pins the "+" to the front: a bare writingDirection
                      does not hold on Android and the bidi algorithm renders "964+". */}
                  <Text style={styles.prefixText}>{`‎${DIAL_CODE}`}</Text>
                </View>
                <AppTextInput
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    setDuplicate(false);
                  }}
                  keyboardType="phone-pad"
                  autoFocus
                  placeholder="770 000 0000"
                  placeholderTextColor={colors.faint2}
                  accessibilityLabel={t('phones.newLabel')}
                  style={[styles.input, styles.phoneInput, duplicate && styles.inputError]}
                />
              </View>
              {duplicate ? (
                <Text style={[styles.error, readingSide]}>{t('phones.duplicate')}</Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Button
                label={t('common.continue')}
                variant="primary"
                size="lg"
                full
                disabled={!phoneReady}
                onPress={onSave}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={toList}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
              >
                <Text style={styles.link}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* The primary is the number the kitchen and the courier actually
                dial, so it gets a panel of its own rather than a row in a list
                where it would look like one option among several. */}
            <View style={styles.primary}>
              <View style={styles.primaryTop}>
                <View style={styles.primaryTile}>
                  <Icon path={icons.phone} size={17} color={colors.teal} strokeWidth={1.9} />
                </View>
                <Text style={[styles.primaryLabel, readingSide]}>{t('phones.primary')}</Text>
                <PressScale
                  onPress={() => setMode('change')}
                  scaleTo={0.94}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={t(hasPrimary ? 'phones.changeTitle' : 'phones.addPrimaryTitle')}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{t(hasPrimary ? 'common.change' : 'common.add')}</Text>
                </PressScale>
              </View>
              {hasPrimary ? (
                <Text style={[styles.primaryNumber, readingSide]} numberOfLines={1}>
                  {display(user.phone)}
                </Text>
              ) : (
                <Text style={[styles.primaryNone, readingSide]}>{t('phones.primary.none')}</Text>
              )}
              <Text style={[styles.primarySub, readingSide]}>
                {t(hasPrimary ? 'phones.primary.sub' : 'phones.primary.noneSub')}
              </Text>
            </View>

            <View style={styles.section}>
              <SectionHeader
                title={t('phones.secondary')}
                subtitle={t('phones.secondary.sub')}
              />
              {user.secondary.length === 0 ? (
                addRow
              ) : (
                <Card padding={0} style={styles.rows}>
                  {user.secondary.map((p, i) => (
                    <SettingRow
                      key={p}
                      first={i === 0}
                      icon="phone"
                      label={display(p)}
                      accessibilityLabel={display(p)}
                      trailing={
                        <View style={styles.rowActions}>
                          <PressScale
                            onPress={() => makePrimary(p)}
                            scaleTo={0.94}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={t('phones.makePrimary')}
                            style={styles.chip}
                          >
                            <Text style={styles.chipText}>{t('phones.makePrimary')}</Text>
                          </PressScale>
                          <PressScale
                            onPress={() => removeSecondary(p)}
                            scaleTo={0.88}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            accessibilityLabel={t('phones.remove')}
                            style={styles.remove}
                          >
                            <Icon
                              path={icons.close}
                              size={11}
                              color={colors.muted}
                              strokeWidth={2.6}
                            />
                          </PressScale>
                        </View>
                      }
                    />
                  ))}
                </Card>
              )}
            </View>

            {/* The empty state already carries its own add affordance, so the
                button would be the second one on the screen. */}
            {user.secondary.length > 0 ? (
              <Button
                label={t('phones.add')}
                variant="outline"
                size="lg"
                full
                onPress={() => setMode('add')}
              />
            ) : null}
          </>
        )}
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
  section: {
    gap: spacing.xl,
  },
  primary: {
    backgroundColor: colors.healthyBg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.healthyBorder,
    paddingHorizontal: spacing.huge,
    paddingVertical: spacing.huge,
    gap: spacing.sm,
  },
  primaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  primaryTile: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    ...type.captionStrong,
    flex: 1,
    color: colors.tealText,
  },
  primaryNumber: {
    ...type.h2,
    color: colors.ink,
  },
  primaryNone: {
    ...type.h2,
    color: colors.muted,
  },
  primarySub: {
    ...type.caption,
    color: colors.muted,
  },
  rows: {
    overflow: 'hidden',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  chip: {
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  chipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.tealText,
  },
  remove: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Dashed rather than solid, the same "nothing here yet, build it" shape the
  // plans grid uses for its custom box.
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  addTile: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    flex: 1,
    gap: 1,
  },
  addLabel: {
    ...type.title,
    color: colors.ink,
  },
  addSub: {
    ...type.caption,
    color: colors.muted2,
  },
  field: {
    gap: spacing.md,
  },
  fieldLabel: {
    ...type.captionStrong,
    color: colors.muted,
  },
  phoneRow: {
    gap: spacing.md,
  },
  prefix: {
    borderRadius: radius.control,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
    writingDirection: 'ltr',
  },
  input: {
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
    paddingVertical: 17,
    paddingHorizontal: spacing.huge,
    fontFamily: fonts.semibold,
    fontSize: 16.5,
    color: colors.ink,
  },
  phoneInput: {
    flex: 1,
    ...ltrField,
  },
  inputError: {
    borderColor: colors.coral,
  },
  error: {
    ...type.caption,
    color: colors.coral,
  },
  actions: {
    gap: spacing.xxl,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.tealText,
    textAlign: 'center',
  },
});
