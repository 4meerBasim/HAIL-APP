import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import Reveal from '../components/Reveal';
import PressScale from '../components/PressScale';
import { colors, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { formatNumber } from '../i18n/digits';
import { useAuth } from '../state/AuthContext';
import {
  type OccasionKey,
  GUEST_STEP,
  MAX_GUESTS,
  MIN_GUESTS,
  cateringHero,
  cateringTrays,
  currencyMark,
  formatPrice,
  getTray,
  groupNumber,
  occasionKeys,
  suggestTrays,
} from '../data/menu';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

const SCRIM = [scrim.heroFade, scrim.hero] as const;

export default function CateringScreen({ navigation }: RootStackScreenProps<'Catering'>) {
  const { t, lang } = useLanguage();
  const { status } = useAuth();

  const [occasion, setOccasion] = useState<OccasionKey>('wake');
  const [guests, setGuests] = useState(50);
  const [qty, setQty] = useState<Record<string, number>>(() => suggestTrays(50));
  const [sent, setSent] = useState(false);

  const setTray = (id: string, next: number) =>
    setQty((prev) => {
      const clamped = Math.max(0, Math.min(99, next));
      if (clamped === 0) {
        const { [id]: _drop, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: clamped };
    });

  const { total, covered } = useMemo(
    () =>
      Object.entries(qty).reduce(
        (acc, [id, n]) => {
          const tray = getTray(id);
          return tray
            ? { total: acc.total + tray.price * n, covered: acc.covered + tray.serves * n }
            : acc;
        },
        { total: 0, covered: 0 },
      ),
    [qty],
  );

  const trayCount = Object.values(qty).reduce((a, b) => a + b, 0);
  const short = Math.max(0, guests - covered);
  const mark = currencyMark(lang);

  const onRequest = () => {
    if (status !== 'authed') {
      navigation.navigate('Login');
      return;
    }
    setSent(true);
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
        <Text style={styles.title}>{t('catering.title')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={0} style={styles.hero}>
          <Image source={{ uri: cateringHero }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={SCRIM} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>{t('catering.hero')}</Text>
            <Text style={styles.heroSub}>{t('catering.heroSub')}</Text>
          </View>
        </Reveal>

        <Reveal index={1} style={styles.group}>
          <Text style={styles.groupLabel}>{t('catering.occasion')}</Text>
          <View style={styles.occasionRow}>
            {occasionKeys.map((key) => (
              <Chip
                key={key}
                label={t(`occasion.${key}`)}
                selected={occasion === key}
                onPress={() => setOccasion(key)}
                shape="rounded"
                full
              />
            ))}
          </View>
        </Reveal>

        <Reveal index={2} style={styles.group}>
          <Card padding={spacing.xxl}>
            <Stepper
              icon={icons.user}
              label={t('catering.guests')}
              value={guests}
              suffix={t('catering.guestsUnit')}
              onDecrement={() => setGuests((g) => Math.max(MIN_GUESTS, g - GUEST_STEP))}
              onIncrement={() => setGuests((g) => Math.min(MAX_GUESTS, g + GUEST_STEP))}
              canDecrement={guests > MIN_GUESTS}
              canIncrement={guests < MAX_GUESTS}
            />
          </Card>
        </Reveal>

        <Reveal index={3} style={styles.group}>
          <View style={styles.groupHead}>
            <Text style={styles.groupLabel}>{t('catering.trays')}</Text>
            <PressScale
              onPress={() => setQty(suggestTrays(guests))}
              scaleTo={0.94}
              accessibilityLabel={t('catering.suggest')}
              style={styles.suggestBtn}
            >
              <Text style={styles.suggestText}>{t('catering.suggest')}</Text>
            </PressScale>
          </View>

          <View style={styles.trays}>
            {cateringTrays.map((tray) => {
              const n = qty[tray.id] ?? 0;
              return (
                <View key={tray.id} style={[styles.tray, shadow.card, n > 0 && styles.trayOn]}>
                  <Image source={{ uri: tray.image }} style={styles.trayImage} />
                  <View style={styles.trayBody}>
                    <Text style={styles.trayName} numberOfLines={2}>
                      {t(`tray.${tray.id}`)}
                    </Text>
                    <Text style={styles.trayMeta}>
                      {`${formatPrice(groupNumber(tray.price), lang)} · ${t('catering.serves')} ${formatNumber(tray.serves)}`}
                    </Text>
                    <Stepper
                      icon={icons.box}
                      value={n}
                      onDecrement={() => setTray(tray.id, n - 1)}
                      onIncrement={() => setTray(tray.id, n + 1)}
                      canDecrement={n > 0}
                      style={styles.trayStepper}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </Reveal>
      </ScrollView>

      <Reveal index={4} style={styles.footer}>
        {sent ? (
          <View style={styles.sent}>
            <Text style={styles.sentTitle}>{t('catering.sentTitle')}</Text>
            <Text style={styles.sentBody}>{t('catering.sentBody')}</Text>
            <Button
              label={t('catering.done')}
              variant="primary"
              size="lg"
              full
              onPress={() => navigation.goBack()}
            />
          </View>
        ) : (
          <>
            <View style={styles.totalRow}>
              <View style={styles.totalText}>
                <Text style={styles.totalLabel}>{t('catering.total')}</Text>
                <Text style={styles.coverage}>
                  {trayCount === 0
                    ? t('catering.needTrays')
                    : short > 0
                      ? t('catering.short').replace('{n}', formatNumber(short))
                      : t('catering.enough')}
                </Text>
              </View>
              <View style={styles.totalValue}>
                <Text style={styles.total}>{groupNumber(total)}</Text>
                <Text style={styles.totalUnit}>{mark}</Text>
              </View>
            </View>
            <Button
              label={t('catering.request')}
              variant="primary"
              size="lg"
              full
              disabled={trayCount === 0}
              onPress={onRequest}
            />
          </>
        )}
      </Reveal>
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
  title: {
    ...type.h1,
    color: colors.ink,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.giant,
  },
  hero: {
    height: 168,
    borderRadius: radius.card,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroText: {
    padding: spacing.huge,
    gap: spacing.xs,
  },
  heroTitle: {
    ...type.h2,
    color: colors.white,
  },
  heroSub: {
    ...type.caption,
    color: colors.white,
    opacity: 0.9,
  },
  group: {
    gap: spacing.xl,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  groupLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  suggestBtn: {
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  suggestText: {
    ...type.captionStrong,
    color: colors.tealText,
  },
  occasionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trays: {
    gap: spacing.xl,
  },
  tray: {
    flexDirection: 'row',
    gap: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.card,
  },
  trayOn: {
    borderColor: colors.teal,
  },
  trayImage: {
    width: 86,
    height: 86,
    borderRadius: radius.sm,
    backgroundColor: colors.sand,
  },
  trayBody: {
    flex: 1,
    gap: spacing.sm,
  },
  trayName: {
    ...type.title,
    color: colors.ink,
  },
  trayMeta: {
    ...type.caption,
    color: colors.muted,
  },
  trayStepper: {
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.cream,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  totalText: {
    flexShrink: 1,
    gap: 2,
  },
  totalLabel: {
    ...type.caption,
    color: colors.muted2,
  },
  coverage: {
    ...type.captionStrong,
    color: colors.tealText,
  },
  totalValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  total: {
    ...type.money,
    fontSize: 26,
    lineHeight: 38,
    color: colors.ink,
  },
  totalUnit: {
    ...type.caption,
    color: colors.muted,
  },
  sent: {
    gap: spacing.lg,
  },
  sentTitle: {
    ...type.h2,
    color: colors.ink,
  },
  sentBody: {
    ...type.body,
    color: colors.body,
  },
});
