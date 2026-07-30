import type { ReactNode } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { radii, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';

export type SnapPoint = 25 | 50 | 75 | 100;

type Props = {
  // Height as a fraction of the screen (Apple-Maps style positions).
  snap?: SnapPoint;
  children?: ReactNode;
};

// Sprint 002: presentational shell only (handle + snap height). Drag gestures
// (gesture-handler/reanimated) are wired at screen assembly (Sprint 003).
export function BottomSheet({ snap = 50, children }: Props) {
  const height = (Dimensions.get('window').height * snap) / 100;
  return (
    <GlassCard level="sheet" radius="xl" style={[styles.sheet, { height }]}>
      <View style={styles.handle} />
      <View style={styles.content}>{children}</View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  sheet: {
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
