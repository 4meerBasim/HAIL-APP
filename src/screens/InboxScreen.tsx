import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import Screen from '../components/Screen';
import Icon from '../components/Icon';
import { icons } from '../components/icons';
import Button from '../components/Button';
import Dialog from '../components/Dialog';
import PressScale from '../components/PressScale';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotifications } from '../state/NotificationsContext';
import type { RootStackScreenProps } from '../navigation/RootNavigator';

// What the app has told the customer, and nothing else. Which notices they want
// in the first place is a preference, and preferences live in Profile.
export default function InboxScreen({ navigation }: RootStackScreenProps<'Inbox'>) {
  const { t, isRTL } = useLanguage();
  const { items, markRead, clearAll } = useNotifications();
  const [clearing, setClearing] = useState(false);

  const readingSide = { textAlign: 'auto', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  const open = (id: string, to: 'Tracking' | 'Tabs' | 'PastOrders') => {
    markRead(id);
    navigation.navigate(to);
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
          <Text style={styles.title}>{t('profile.notifications')}</Text>
          <Text style={styles.subtitle}>{t('inbox.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon path={icons.bell} size={26} color={colors.faint} strokeWidth={1.6} />
            </View>
            <Text style={styles.emptyTitle}>{t('inbox.empty')}</Text>
            <Text style={styles.emptySub}>{t('inbox.empty.sub')}</Text>
          </View>
        ) : (
          items.map((n) => (
            <PressScale
              key={n.id}
              onPress={() => open(n.id, n.to)}
              scaleTo={0.985}
              accessibilityLabel={t(`notif.${n.id}.title`)}
              // Read rows recede rather than disappear: they are still the
              // record of what was sent, just no longer something to act on.
              style={[styles.item, shadow.card, n.read ? styles.itemRead : styles.itemUnread]}
            >
              <View
                style={[styles.tile, { backgroundColor: n.read ? colors.tile : n.tint }]}
              >
                <Icon
                  path={icons[n.icon]}
                  size={18}
                  color={n.read ? colors.faint : n.ink}
                  strokeWidth={2}
                />
              </View>

              <View style={styles.itemText}>
                <View style={styles.itemTop}>
                  <Text
                    style={[styles.itemTitle, n.read && styles.textRead, readingSide]}
                    numberOfLines={1}
                  >
                    {t(`notif.${n.id}.title`)}
                  </Text>
                  {n.read ? null : <View style={styles.dot} />}
                </View>
                <Text
                  style={[styles.itemBody, n.read && styles.textRead, readingSide]}
                  numberOfLines={2}
                >
                  {t(`notif.${n.id}.body`)}
                </Text>
                <Text style={[styles.itemTime, readingSide]}>{t(`notif.${n.id}.time`)}</Text>
              </View>
            </PressScale>
          ))
        )}

        {items.length > 0 ? (
          <Button
            label={t('inbox.clearAll')}
            variant="outline"
            size="md"
            full
            color={colors.coral}
            onPress={() => setClearing(true)}
            style={styles.clear}
          />
        ) : null}
      </ScrollView>

      <Dialog
        visible={clearing}
        title={t('inbox.clear.title')}
        message={t('inbox.clear.message')}
        primaryLabel={t('common.cancel')}
        onPrimary={() => setClearing(false)}
        secondaryLabel={t('inbox.clear.confirm')}
        onSecondary={() => {
          setClearing(false);
          clearAll();
        }}
        onClose={() => setClearing(false)}
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
  clear: {
    marginTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.giant,
    gap: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  // Unread carries a teal edge rather than a coloured fill: the tile already
  // says what kind of notice it is, and a second colour would fight it.
  itemUnread: {
    backgroundColor: colors.white,
    borderColor: colors.healthyBorder,
  },
  itemRead: {
    backgroundColor: colors.sandChip,
    borderColor: colors.sand,
  },
  tile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemTitle: {
    ...type.title,
    flex: 1,
    color: colors.ink,
  },
  textRead: {
    color: colors.muted2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
  },
  itemBody: {
    ...type.caption,
    fontSize: 12.5,
    color: colors.body,
  },
  itemTime: {
    ...type.caption,
    fontSize: 11.5,
    color: colors.faint,
    fontFamily: fonts.semibold,
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
});
