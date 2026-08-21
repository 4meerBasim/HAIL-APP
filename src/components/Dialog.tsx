import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';
import Button from './Button';
import { colors, radius, scrim, shadow, spacing, type } from '../theme';

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose: () => void;
}

// A question the app asks in its own voice — same cream sheet, same buttons as
// the rest of the flow, rather than the platform Alert's grey system chrome.
export default function Dialog({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Swallows taps so a press inside the card never dismisses it. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.actions}>
            <Button label={primaryLabel} variant="primary" size="lg" full onPress={onPrimary} />
            {secondaryLabel && onSecondary ? (
              <Button
                label={secondaryLabel}
                variant="outline"
                size="lg"
                full
                onPress={onSecondary}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
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
    gap: spacing.md,
    ...shadow.sheet,
  },
  title: {
    ...type.h2,
    color: colors.ink,
  },
  message: {
    ...type.body,
    color: colors.body,
  },
  actions: {
    gap: spacing.lg,
    paddingTop: spacing.md,
  },
});
