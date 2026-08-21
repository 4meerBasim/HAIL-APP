import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { type IconName, icons } from './icons';
import { colors, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface SettingRowProps {
  icon: IconName;
  label: string;
  sub?: string;
  // Whatever sits at the trailing edge — a Switch, a tick, a pair of controls.
  // Left out, the row gets a chevron, which is the promise that it opens
  // something; a row that only toggles must not make that promise.
  trailing?: React.ReactNode;
  onPress?: () => void;
  first?: boolean;
  accessibilityLabel?: string;
}

// One row shape for every list of settings in the app — Profile's four entries
// and each of the screens they open. They were the same eleven lines of JSX
// copied five times, and the copies had already started to drift on padding.
export default function SettingRow({
  icon,
  label,
  sub,
  trailing,
  onPress,
  first = false,
  accessibilityLabel,
}: SettingRowProps) {
  const { isRTL } = useLanguage();
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;

  // 'auto' resolves against the paragraph's own direction; a physical 'right'
  // would be mirrored back to the left by RN's RTL swap.
  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  const body = (
    <>
      <Icon path={icons[icon]} size={19} color={colors.muted} strokeWidth={1.9} />
      <View style={styles.text}>
        <Text style={[styles.label, readingSide]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.sub, readingSide]} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
      {trailing ?? <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />}
    </>
  );

  return (
    <View>
      {first ? null : <View style={styles.divider} />}
      {onPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          style={styles.row}
        >
          {body}
        </TouchableOpacity>
      ) : (
        <View style={styles.row} accessibilityLabel={accessibilityLabel ?? label}>
          {body}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  label: {
    ...type.title,
    color: colors.ink,
  },
  sub: {
    ...type.caption,
    color: colors.muted2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sandChip,
    marginHorizontal: spacing.xxl,
  },
});
