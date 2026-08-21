import { Image, StyleSheet, View } from 'react-native';

// The girih medallion lifted straight off the offer sheets — the four-petal
// rosette inside a pointed lozenge that the printed slides stack in the corner
// of every page. It replaces the gold lozenge patches this file used to draw:
// those were a generic tile, this is the mark the brand actually prints.
//
// The layout follows the sheets: a stacked pair in the top corner, then two
// oversized ones bled off the opposite edges so a long scroll never runs out of
// ornament. Everything is one flat teal asset, so weight is set purely by
// opacity — the corner pair is the only one meant to be noticed.
const MEDALLION = require('../../assets/girih-medallion.png');

function Mark({ size, opacity, style }: { size: number; opacity: number; style: object }) {
  return (
    <Image
      source={MEDALLION}
      resizeMode="contain"
      style={[styles.mark, style, { width: size, height: size, opacity }]}
    />
  );
}

export default function Texture() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* the stacked corner pair, exactly as the slides set it — on the trailing
          side, because on a phone the leading side of the header is the title */}
      <Mark size={44} opacity={0.16} style={styles.cornerTop} />

      <Mark size={44} opacity={0.16} style={styles.cornerBottom} />

      <Mark size={210} opacity={0.07} style={styles.midLead} />
      <Mark size={260} opacity={0.06} style={styles.footTrail} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    position: 'absolute',
  },
  // Logical edges throughout: React Native mirrors `left`/`right` under RTL, so
  // `start` is the physical right under Arabic and the composition flips with
  // the language the way the printed sheet does.
  cornerTop: {
    top: 12,
    end: 14,
  },
  cornerBottom: {
    top: 58,
    end: 14,
  },
  midLead: {
    top: '36%',
    start: -92,
  },
  footTrail: {
    bottom: -108,
    end: -106,
  },
});
