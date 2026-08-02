import type { ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { radii, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';

export type SnapPoint = 25 | 50 | 75 | 100;

type Props = {
  // Height as a fraction of the screen (Apple-Maps style positions).
  snapPoints?: SnapPoint[];
  initialSnap?: SnapPoint;
  onSnapChange?: (snap: SnapPoint) => void;
  children?: ReactNode;
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Marked 'worklet' explicitly — called from both plain JS (initial height)
// and from the Pan gesture's UI-thread callbacks below. Reanimated 4's
// split Worklets runtime throws ("Tried to synchronously call a Remote
// Function") if a plain JS function is called from a worklet without this.
const pctToPx = (pct: number) => {
  'worklet';
  return (SCREEN_HEIGHT * pct) / 100;
};

// Refonte 2026-08-02 (.input/PLAN-ECRANS-OPERATEUR-RECA.md, "Panneau
// inférieur extensible") — remplace la coquille sans geste du Sprint 002
// (voir memory.md : gestes explicitement différés jusqu'à ce qu'une maquette
// en exige un — c'est désormais le cas). Glissement réel via
// react-native-gesture-handler + react-native-reanimated : le doigt pilote
// directement la hauteur pendant le drag (`onUpdate`, pas d'animation tant
// que le doigt bouge), puis un `withSpring` claque au point de snap le plus
// proche au relâchement — jamais de valeur intermédiaire arbitraire.
export function BottomSheet({ snapPoints = [25, 50, 75, 100], initialSnap = 25, onSnapChange, children }: Props) {
  const height = useSharedValue(pctToPx(initialSnap));
  // Independently initialized (not `height.value`) — reading a shared
  // value's `.value` during render is flagged by Reanimated's strict mode
  // (only worklets/effects should read it); both start at the same value by
  // construction since they share `initialSnap`.
  const startHeight = useSharedValue(pctToPx(initialSnap));
  const minHeight = pctToPx(snapPoints[0] ?? 25);
  const maxHeight = pctToPx(snapPoints[snapPoints.length - 1] ?? 100);

  const pan = Gesture.Pan()
    .onStart(() => {
      startHeight.value = height.value;
    })
    .onUpdate((event) => {
      const next = startHeight.value - event.translationY;
      height.value = Math.max(minHeight, Math.min(maxHeight, next));
    })
    .onEnd(() => {
      let nearest = snapPoints[0] ?? 25;
      let smallestDiff = Number.POSITIVE_INFINITY;
      for (const point of snapPoints) {
        const diff = Math.abs(pctToPx(point) - height.value);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          nearest = point;
        }
      }
      height.value = withSpring(pctToPx(nearest), { damping: 20, stiffness: 200 });
      if (onSnapChange) {
        runOnJS(onSnapChange)(nearest);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <GlassCard level="sheet" radius="xl" style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.content}>{children}</View>
        </GlassCard>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: spacing.sm,
  },
  content: { flex: 1, paddingHorizontal: spacing.lg },
});
