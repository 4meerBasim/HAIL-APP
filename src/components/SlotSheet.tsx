import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from './AppText';
import Button from './Button';
import TimePicker from './TimePicker';
import { colors, fonts, radius, scrim, shadow, spacing, type } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';
import { DEFAULT_SLOT_TIME } from '../data/menu';

export interface SlotDraft {
  name: string;
  time: number;
}

export interface SlotSheetProps {
  visible: boolean;
  /** The slot being edited, or null when adding a new one. */
  initial: SlotDraft | null;
  onClose: () => void;
  onSave: (draft: SlotDraft) => void;
  /** Absent on the last remaining slot — a day with no meal times is not a plan. */
  onDelete?: () => void;
}

/**
 * Names a meal time and says when it should arrive — the one place both are
 * edited, so adding a slot and correcting one are the same form rather than two
 * flows that drift.
 *
 * The draft is local until Save: spinning the wheels re-prices the plan on every
 * tick otherwise, and backing out would leave the change behind.
 */
export default function SlotSheet({ visible, initial, onClose, onSave, onDelete }: SlotSheetProps) {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [time, setTime] = useState(DEFAULT_SLOT_TIME);

  // Reset from the slot each time it opens rather than on mount: the sheet
  // stays mounted between edits, so a second open would otherwise still be
  // holding the first slot's name.
  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setTime(initial?.time ?? DEFAULT_SLOT_TIME);
  }, [visible, initial]);

  const ready = name.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* The dismiss target is a sibling behind the card, not its parent. A
            Pressable wrapping the card claims the touch on press-in and never
            hands it back, which is what stopped the time wheels scrolling. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel={t('common.close')}
        />
        <View style={[styles.card, shadow.sheet]}>
          <Text style={styles.title}>{t(initial ? 'slot.edit' : 'slot.add')}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>{t('slot.name')}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('builder.slotName')}
              placeholderTextColor={colors.faint}
              returnKeyType="done"
              maxLength={24}
              accessibilityLabel={t('slot.name')}
              style={[styles.input, { writingDirection: isRTL ? 'rtl' : 'ltr' }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('slot.time')}</Text>
            <TimePicker value={time} onChange={setTime} />
          </View>

          <View style={styles.actions}>
            <Button
              label={t('slot.save')}
              size="md"
              full
              disabled={!ready}
              onPress={() => onSave({ name: name.trim(), time })}
            />
            <Button label={t('builder.slotCancel')} variant="ghost" size="md" full onPress={onClose} />
          </View>

          {onDelete ? (
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={t('slot.delete')}
              hitSlop={8}
            >
              <Text style={styles.delete}>{t('slot.delete')}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: scrim.dialog,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.cream,
    borderRadius: radius.sheet,
    padding: spacing.huge,
    gap: spacing.xl,
  },
  title: {
    ...type.h3,
    color: colors.ink,
    textAlign: 'auto',
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...type.caption,
    color: colors.muted2,
    textAlign: 'auto',
  },
  input: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.sand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    textAlign: 'auto',
  },
  actions: {
    gap: spacing.sm,
  },
  delete: {
    ...type.caption,
    color: colors.coral,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
