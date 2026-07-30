import { colors } from '@/config/theme';

import { Txt } from '../ui/Txt';

// "OPÉRATEUR" sub-brand — text (Manrope 800, brand red), never a logo image.
export function Wordmark({ size = 16 }: { size?: number }) {
  return (
    <Txt variant="labelCaps" color={colors.brand} style={{ fontSize: size, letterSpacing: 2.6 }}>
      OPÉRATEUR
    </Txt>
  );
}
