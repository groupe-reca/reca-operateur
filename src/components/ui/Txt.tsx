import { Text, type TextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/config/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

// Text with a typography variant from the scale + a colour token.
export function Txt({ variant = 'body', color = colors.textPrimary, style, ...rest }: Props) {
  return <Text {...rest} style={[typography[variant], { color }, style]} />;
}
