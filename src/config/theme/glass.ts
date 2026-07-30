// Glassmorphism levels (translucent panels + blur). Source: HANDOFF §3.
// `intensity` feeds expo-blur's BlurView; `backgroundColor` is the tint drawn
// over the blur. Values are approximations of the CSS blur px from the mock.
import { colors } from './colors';

export const glass = {
  chip: {
    backgroundColor: 'rgba(21,28,46,0.55)',
    intensity: 20,
    borderColor: colors.border,
    borderWidth: 1,
  },
  panel: {
    backgroundColor: 'rgba(21,28,46,0.72)',
    intensity: 30,
    borderColor: colors.border,
    borderWidth: 1,
  },
  sheet: {
    backgroundColor: 'rgba(21,28,46,0.88)',
    intensity: 45,
    borderColor: colors.border,
    borderWidth: 1,
  },
} as const;

export type GlassLevel = keyof typeof glass;
