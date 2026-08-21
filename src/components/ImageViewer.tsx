import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  type ImageSourcePropType,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PanGestureHandler,
  type PanGestureHandlerStateChangeEvent,
  PinchGestureHandler,
  type PinchGestureHandlerStateChangeEvent,
  State,
  TapGestureHandler,
  type TapGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { icons } from './icons';
import { colors, radius, scrim, shadow } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

export interface ImageViewerProps {
  visible: boolean;
  source: ImageSourcePropType;
  onClose: () => void;
}

// Full-screen photo viewer with pinch-to-zoom, drag-to-pan and double-tap.
// Built on the gesture-handler + RN Animated pair rather than Reanimated: this
// app deliberately keeps Reanimated uninstalled, and `useNativeDriver` still
// runs the transform off the JS thread here.
export default function ImageViewer({ visible, source, onClose }: ImageViewerProps) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [zoomed, setZoomed] = useState(false);

  const pinchRef = useRef(null);
  const panRef = useRef(null);

  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // The gesture handlers report deltas, so the committed value lives here and
  // the Animated.Values carry only the in-flight part of the current gesture.
  const lastScale = useRef(1);
  const lastPan = useRef({ x: 0, y: 0 });

  const reset = useCallback(() => {
    lastScale.current = 1;
    lastPan.current = { x: 0, y: 0 };
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setOffset(0);
    translateX.setValue(0);
    translateY.setOffset(0);
    translateY.setValue(0);
    setZoomed(false);
  }, [baseScale, pinchScale, translateX, translateY]);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const onPinch = Animated.event([{ nativeEvent: { scale: pinchScale } }], {
    useNativeDriver: true,
  });

  const onPinchEnd = (e: PinchGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.oldState !== State.ACTIVE) return;
    const next = Math.min(Math.max(lastScale.current * e.nativeEvent.scale, 1), MAX_SCALE);
    lastScale.current = next;
    baseScale.setValue(next);
    pinchScale.setValue(1);
    if (next === 1) reset();
    else setZoomed(true);
  };

  const onPan = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true },
  );

  const onPanEnd = (e: PanGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.oldState !== State.ACTIVE) return;
    lastPan.current = {
      x: lastPan.current.x + e.nativeEvent.translationX,
      y: lastPan.current.y + e.nativeEvent.translationY,
    };
    translateX.setOffset(lastPan.current.x);
    translateX.setValue(0);
    translateY.setOffset(lastPan.current.y);
    translateY.setValue(0);
  };

  const onDoubleTap = (e: TapGestureHandlerStateChangeEvent) => {
    if (e.nativeEvent.state !== State.ACTIVE) return;
    if (lastScale.current > 1) {
      reset();
      return;
    }
    lastScale.current = DOUBLE_TAP_SCALE;
    setZoomed(true);
    Animated.spring(baseScale, {
      toValue: DOUBLE_TAP_SCALE,
      useNativeDriver: true,
      friction: 7,
    }).start();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <PanGestureHandler
          ref={panRef}
          enabled={zoomed}
          simultaneousHandlers={pinchRef}
          onGestureEvent={onPan}
          onHandlerStateChange={onPanEnd}
        >
          <Animated.View style={styles.fill}>
            <PinchGestureHandler
              ref={pinchRef}
              simultaneousHandlers={panRef}
              onGestureEvent={onPinch}
              onHandlerStateChange={onPinchEnd}
            >
              <Animated.View style={styles.fill}>
                <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
                  <Animated.Image
                    source={source}
                    resizeMode="contain"
                    style={[
                      styles.image,
                      { transform: [{ translateX }, { translateY }, { scale }] },
                    ]}
                  />
                </TapGestureHandler>
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={close}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          style={[styles.close, { top: insets.top + 12 }]}
        >
          <Icon path={icons.close} size={16} color={colors.ink} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: scrim.photo,
  },
  fill: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    end: 16,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
