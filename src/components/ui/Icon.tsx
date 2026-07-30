import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';

import { colors } from '@/config/theme';

type Props = {
  icon: ComponentType<LucideProps>;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

// Thin wrapper around a lucide icon so size/colour come from tokens.
export function Icon({ icon: IconComponent, size = 20, color = colors.textPrimary, strokeWidth = 2 }: Props) {
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}
