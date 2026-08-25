import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Text from './AppText';
import Icon from './Icon';
import { type IconName, icons } from './icons';
import PressScale from './PressScale';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

export interface BuildRowProps {
  label: string;
  sub?: string;
  /** Shown at the trailing edge, e.g. "+ 2,500 د.ع". */
  price?: string;
  icon?: IconName;
  /** Stands in for the icon tile once something with a photo is chosen. */
  image?: ImageSourcePropType;
  selected?: boolean;
  /** A tick when the row toggles, a chevron when it opens a page, a turning
   *  caret when it opens onto its own choices. */
  action: 'toggle' | 'open' | 'dropdown';
  /** Only for 'dropdown': which way the caret points. */
  expanded?: boolean;
  /** Drops the row's own card, for when it sits inside one. */
  flat?: boolean;
  onPress: () => void;
  /** Clears a chosen item instead of opening the page again. */
  onClear?: () => void;
  clearLabel?: string;
  style?: StyleProp<ViewStyle>;
}

// Every buildable thing on the meal page wears this row, so one glance teaches
// the whole screen: a filled teal mark means it is on the meal, an outline
// means it is not, and a chevron means the choices are on a page of their own.
export default function BuildRow({
  label,
  sub,
  price,
  icon,
  image,
  selected = false,
  action,
  expanded = false,
  flat = false,
  onPress,
  onClear,
  clearLabel,
  style,
}: BuildRowProps) {
  const { t, isRTL } = useLanguage();
  const turn = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(turn, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, turn]);
  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;
  const chevron = isRTL ? icons.chevronLeft : icons.chevronRight;

  return (
    <PressScale
      onPress={onPress}
      scaleTo={0.985}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[
        styles.row,
        flat ? styles.flat : [selected && styles.rowOn, shadow.card],
        style,
      ]}
    >
      {image ? (
        <Image source={image} style={styles.thumb} resizeMode="cover" />
      ) : icon ? (
        <View style={[styles.tile, selected && styles.tileOn]}>
          <Icon
            path={icons[icon]}
            size={17}
            color={selected ? colors.white : colors.teal}
            strokeWidth={1.9}
          />
        </View>
      ) : null}

      <View style={styles.text}>
        <Text style={[styles.label, readingSide]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.sub, readingSide]} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>

      {price ? <Text style={[styles.price, selected && styles.priceOn]}>{price}</Text> : null}

      {onClear ? (
        <PressScale
          onPress={onClear}
          scaleTo={0.88}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={clearLabel ?? t('common.close')}
          style={styles.clear}
        >
          <Icon path={icons.close} size={11} color={colors.muted} strokeWidth={2.6} />
        </PressScale>
      ) : action === 'dropdown' ? (
        <Animated.View
          style={{
            transform: [
              {
                rotate: turn.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Icon
            path={icons.chevronDown}
            size={15}
            color={selected ? colors.tealText : colors.faint2}
            strokeWidth={2.4}
          />
        </Animated.View>
      ) : action === 'toggle' ? (
        // An empty circle reads as "not yet", a filled one as "on the meal" —
        // the same mark the app uses wherever something is chosen.
        <View style={[styles.mark, selected && styles.markOn]}>
          <Icon
            path={selected ? icons.check : icons.plus}
            size={12}
            color={selected ? colors.white : colors.teal}
            strokeWidth={3}
          />
        </View>
      ) : (
        <Icon path={chevron} size={15} color={colors.faint2} strokeWidth={2.2} />
      )}
    </PressScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.sand,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  rowOn: {
    borderColor: colors.teal,
    backgroundColor: colors.white,
  },
  // Inside a card of its own already: no second border, no second shadow.
  flat: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.healthyBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: {
    backgroundColor: colors.teal,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.tile,
  },
  text: {
    flex: 1,
    gap: 1,
  },
  label: {
    ...type.title,
    fontSize: 15,
    color: colors.ink,
  },
  sub: {
    ...type.caption,
    fontSize: 12.5,
    color: colors.muted2,
  },
  price: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.muted2,
  },
  priceOn: {
    fontFamily: fonts.bold,
    color: colors.tealText,
  },
  mark: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  clear: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
