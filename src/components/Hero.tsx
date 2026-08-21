import React, { useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ImageViewer from './ImageViewer';
import { scrim } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

// Widest-to-tallest a hero is allowed to get. Raise it for a shorter band,
// lower it toward 1 to show more of a square photo.
export const HERO_MIN_ASPECT = 7 / 5;

const SCRIM = [scrim.heroFade, scrim.hero] as const;
const SCRIM_STOPS = [0.3, 1] as const;

// A hero is sized by the photo it holds, never by a magic number: the asset's
// own ratio, floored at HERO_MIN_ASPECT so a square offer shot can't eat half
// the screen. Below that floor `cover` trims the top and bottom instead of
// enlarging the photo, which is the least a rectangle can crop.
export function heroAspect(source: ImageSourcePropType): number {
  const meta = Image.resolveAssetSource(source);
  const natural = meta?.width && meta?.height ? meta.width / meta.height : 1;
  return Math.max(natural, HERO_MIN_ASPECT);
}

export interface HeroProps {
  source: ImageSourcePropType;
  // Teal fade over the lower half, for heroes that carry text on the photo.
  scrim?: boolean;
  // Tap to open the photo full-screen with pinch-to-zoom.
  zoomable?: boolean;
  style?: StyleProp<ViewStyle>;
  // Back buttons, titles, badges — anything drawn over the photo. Position
  // these absolutely; the hero itself only lays out the image.
  children?: React.ReactNode;
}

export default function Hero({
  source,
  scrim: withScrim = false,
  zoomable = true,
  style,
  children,
}: HeroProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.hero, { aspectRatio: heroAspect(source) }, style]}>
      <TouchableOpacity
        activeOpacity={zoomable ? 0.92 : 1}
        disabled={!zoomable}
        onPress={() => setOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={t('detail.viewPhoto')}
        accessibilityHint={t('detail.photoHint')}
        style={styles.fill}
      >
        <Image source={source} style={styles.fill} resizeMode="cover" />
      </TouchableOpacity>

      {/* Non-interactive, or it would swallow the tap meant for the photo. */}
      {withScrim ? (
        <LinearGradient
          colors={SCRIM}
          locations={SCRIM_STOPS}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}

      {children}

      {zoomable ? (
        <ImageViewer visible={open} source={source} onClose={() => setOpen(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexShrink: 0,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
});
