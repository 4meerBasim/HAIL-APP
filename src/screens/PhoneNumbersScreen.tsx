import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Button from '../components/Button';
import PressScale from '../components/PressScale';
import DashedOutline from '../components/DashedOutline';
import SectionHeader from '../components/SectionHeader';
import SettingRow from '../components/SettingRow';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../state/AuthContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const CODE_LENGTH = 4;
const DIAL_CODE = '+964';

// 'change' replaces the primary outright — a new SIM. 'add' appends a backup
// number and leaves the primary alone.
type Mode = 'change' | 'add';

// Numbers are stored as typed, so one may already carry the country code and
// the next a local trunk zero. They are shown in one shape.
//
// The leading U+200E is a left-to-right mark: inside an Arabic paragraph the
// digits are neutral and the '+' would be flung to the far end, so the mark
// pins the whole number into one LTR run. Alignment is left to the paragraph —
// the number still starts at the reading edge, which under Arabic is the right.
const display = (phone: string) => {
  const p = phone.trim();
  return `‎${p.startsWith('+') ? p : `${DIAL_CODE} ${p.replace(/^0/, '')}`}`;
};

export default function PhoneNumbersScreen({ navigation }: RootStackScreenProps<'PhoneNumbers'>) {
  const { t, isRTL } = useLanguage();
  const { user, hasPhone, changePrimary, addSecondary, removeSecondary, makePrimary } = useAuth();

  const [mode, setMode] = useState<Mode | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;
  // A dial code and its field read left-to-right together, so the row is
  // reversed back under RTL to keep +964 on the leading side.
  const phoneRowSide = { flexDirection: isRTL ? 'row-reverse' : 'row' } as const;
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;

  const toList = () => {
    setMode(null);
    setPhone('');
    setCode('');
    setSent(false);
    setDuplicate(false);
  };

  // Back walks the flow one step at a time — code → number → list → Profile —
  // so a mistyped number costs one tap, not the whole screen.
  const onBack = () => {
    if (sent) setSent(false);
    else if (mode) toList();
    else navigation.goBack();
  };

  const phoneReady = phone.replace(/\D/g, '').length >= 10;

  // Checked before the code is sent rather than after it is entered: there is
  // no point verifying a number the account already holds.
  const onSend = () => {
    if (hasPhone(phone)) {
      setDuplicate(true);
      return;
    }
    setDuplicate(false);
    setSent(true);
  };

  const onConfirm = () => {
    const saved = mode === 'change' ? changePrimary(phone) : addSecondary(phone);
    if (saved) toList();
    else {
      setSent(false);
      setDuplicate(true);
    }
  };

  // The screen is only reachable from the signed-in hero, but the session can
  // end underneath it — signing out while it is open pops back to Login.
  if (!user) return null;

  const title = mode
    ? t(mode === 'change' ? 'phones.changeTitle' : 'phones.addTitle')
    : t('phones.title');
  const subtitle = sent
    ? t('login.codeHint')
    : mode
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
          <Text style={styles.title}>{sent ? t('login.codeSent') : title}</Text>
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
            {sent ? (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, readingSide]}>{display(phone)}</Text>
                <TextInput
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, CODE_LENGTH))}
                  keyboardType="number-pad"
                  maxLength={CODE_LENGTH}
                  autoFocus
                  placeholder="••••"
                  placeholderTextColor={colors.faint2}
                  accessibilityLabel={t('login.codeHint')}
                  style={[styles.input, styles.codeInput]}
                />
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, readingSide]}>{t('phones.newLabel')}</Text>
                <View style={[styles.phoneRow, phoneRowSide]}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>{DIAL_CODE}</Text>
                  </View>
                  <TextInput
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
            )}

            <View style={styles.actions}>
              <Button
                label={t('common.continue')}
                variant="primary"
                size="lg"
                full
                disabled={sent ? code.length !== CODE_LENGTH : !phoneReady}
                onPress={sent ? onConfirm : onSend}
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
                  accessibilityLabel={t('phones.changeTitle')}
                  style={styles.chip}
                >
                  <Text style={styles.chipText}>{t('common.change')}</Text>
                </PressScale>
              </View>
              <Text style={[styles.primaryNumber, readingSide]} numberOfLines={1}>
                {display(user.phone)}
              </Text>
              <Text style={[styles.primarySub, readingSide]}>{t('phones.primary.sub')}</Text>
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
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 14,
    fontSize: 24,
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
