import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';

type Props = {
  icon: ComponentType<LucideProps>;
  onPress?: () => void;
  label?: string;
  size?: number;
  iconColor?: string;
  accessibilityLabel?: string;
};

// Round glass action button, optional caption below. Base for map controls
// and residence actions. Touch target stays large (glove-friendly).
export function FloatingActionButton({
  icon,
  onPress,
  label,
  size = 52,
  iconColor = colors.textPrimary,
  accessibilityLabel,
}: Props) {
  return (
    <View style={styles.wrap}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
      >
        <GlassCard level="panel" radius="pill" style={[styles.fab, { width: size, height: size }]}>
          <Icon icon={icon} color={iconColor} size={Math.round(size * 0.42)} />
        </GlassCard>
      </PressableScale>
      {label ? (
        <Txt variant="meta" color={colors.textSecondary} style={styles.label}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs + 2 },
  fab: { alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center' },
});
