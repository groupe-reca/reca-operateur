import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radii, spacing } from '@/config/theme';

import { GlassCard } from './GlassCard';

type Props = {
  children: ReactNode;
  // Optional coloured left accent (e.g. amber for offline).
  accent?: string;
};

// Small rounded glass chip with a horizontal layout. Used by status indicators.
export function Pill({ children, accent }: Props) {
  return (
    <GlassCard level="chip" radius="pill" style={styles.pill}>
      {accent ? <View style={[styles.accent, { backgroundColor: accent }]} /> : null}
      <View style={styles.row}>{children}</View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  accent: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
