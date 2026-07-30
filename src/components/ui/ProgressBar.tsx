import { View } from 'react-native';

import { colors, radii } from '@/config/theme';

type Props = {
  // Progress in the range 0..1.
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
};

export function ProgressBar({
  progress,
  color = colors.success,
  trackColor = 'rgba(255,255,255,0.10)',
  height = 6,
}: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ height, borderRadius: radii.pill, backgroundColor: trackColor, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: radii.pill, backgroundColor: color }} />
    </View>
  );
}
