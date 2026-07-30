import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

export type AlertLevel = 'danger' | 'warning' | 'info';

const LEVEL_COLOR: Record<AlertLevel, string> = {
  danger: colors.danger,
  warning: colors.warning,
  info: colors.navigation,
};

type Props = {
  level: AlertLevel;
  icon: ComponentType<LucideProps>;
  text: string;
};

// Important instruction. Always icon + level colour + text — never colour alone.
export function AlertCard({ level, icon, text }: Props) {
  const color = LEVEL_COLOR[level];
  return (
    <GlassCard level="panel" radius="md" style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <Icon icon={icon} color={color} size={20} />
      <Txt variant="body" style={styles.text}>
        {text}
      </Txt>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  text: { flex: 1 },
});
