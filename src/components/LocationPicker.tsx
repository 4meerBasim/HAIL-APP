import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './AppText';
import Icon from './Icon';
import { icons } from './icons';
import { colors, radius, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useLocations, type SavedLocation } from '../state/LocationContext';

export interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onOpenMap: () => void;
}

export default function LocationPicker({ visible, onClose, onOpenMap }: LocationPickerProps) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { locations, selected, selectLocation, toggleFavourite } = useLocations();

  const labelOf = (l: SavedLocation) => (l.labelKey ? t(l.labelKey) : (l.label ?? ''));

  const pick = (id: string) => {
    selectLocation(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Scrim closes on tap; the sheet swallows its own presses so a tap on a
          row never reaches it. */}
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button">
        <Pressable
          style={[styles.sheet, { marginTop: insets.top + 64 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{t('location.deliverTo')}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {locations.map((l) => {
              const on = l.id === selected?.id;
              return (
                <TouchableOpacity
                  key={l.id}
                  activeOpacity={0.8}
                  onPress={() => pick(l.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={styles.row}
                >
                  <View style={[styles.tile, on && styles.tileOn]}>
                    <Icon
                      path={icons.pin}
                      size={16}
                      color={on ? colors.white : colors.body}
                      strokeWidth={1.9}
                    />
                  </View>

                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel} numberOfLines={1}>
                      {labelOf(l)}
                    </Text>
                    <Text style={styles.rowAddress} numberOfLines={1}>
                      {l.address}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleFavourite(l.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: l.favourite }}
                    accessibilityLabel={t('location.markFavourite')}
                  >
                    <Icon
                      path={icons.star}
                      size={17}
                      color={l.favourite ? colors.gold : colors.faint2}
                      strokeWidth={1.9}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              onClose();
              onOpenMap();
            }}
            accessibilityRole="button"
            style={styles.row}
          >
            <View style={[styles.tile, { backgroundColor: colors.tile }]}>
              <Icon path={icons.globe} size={16} color={colors.teal} strokeWidth={1.9} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('location.openMap')}</Text>
              <Text style={styles.rowAddress}>{t('location.openMap.sub')}</Text>
            </View>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(16,60,59,0.35)',
    paddingHorizontal: spacing.xxxl,
  },
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.sheet,
    padding: spacing.huge,
    gap: spacing.xl,
    ...shadow.raised,
  },
  title: {
    ...type.h3,
    color: colors.ink,
  },
  list: {
    maxHeight: 260,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.sandChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileOn: {
    backgroundColor: colors.teal,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  rowAddress: {
    ...type.caption,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.sand,
  },
});
