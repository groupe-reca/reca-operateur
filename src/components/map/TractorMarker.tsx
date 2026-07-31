import { StyleSheet, View } from 'react-native';

import { TRACTOR_ANCHOR_FRACTION_FROM_TOP } from '@/engines/map/mapCameraConfig';

import { FixedTractor } from '../mission/FixedTractor';

// Screen-fixed overlay — NOT a geographic marker. HANDOFF §1: "PNG
// transparent fixe (overlay écran), centre horizontal, ancre à 24% du bas de
// la zone carte". The map moves under it; the icon itself never rotates —
// the Camera's own heading conveys direction (docs/05: "le tracteur reste
// fixe à l'écran, la carte se déplace sous lui" — same resolved approach
// already validated on the sibling reca-operator app for the same problem).
export function TractorMarker() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <FixedTractor width={132} />
    </View>
  );
}

const SIZE = 132;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: '50%',
    top: `${TRACTOR_ANCHOR_FRACTION_FROM_TOP * 100}%`,
    marginLeft: -SIZE / 2,
    marginTop: -SIZE / 2,
  },
});
