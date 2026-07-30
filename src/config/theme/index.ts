// Centralized theme tokens. Import from `@/config/theme`.
import { animation } from './animation';
import { colors } from './colors';
import { glass } from './glass';
import { radii } from './radii';
import { screenMargin, spacing } from './spacing';
import { typography } from './typography';

export { colors } from './colors';
export type { ColorToken } from './colors';
export { typography } from './typography';
export type { TypographyVariant } from './typography';
export { spacing, screenMargin } from './spacing';
export type { SpacingToken } from './spacing';
export { radii } from './radii';
export type { RadiusToken } from './radii';
export { glass } from './glass';
export type { GlassLevel } from './glass';
export { animation } from './animation';
export { statusTone } from './statusTone';
export { fontFamily, fontAssets } from './fonts';
export { useAppFonts } from './useAppFonts';

// Convenience aggregate for consumers that want the whole theme object.
export const theme = {
  colors,
  typography,
  spacing,
  screenMargin,
  radii,
  glass,
  animation,
} as const;
