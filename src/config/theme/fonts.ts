// Manrope font assets + family name tokens. Weights loaded: 600/700/800
// (the type scale only uses SemiBold, Bold and ExtraBold).
import {
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

// Passed to `useFonts` at startup (see useAppFonts.ts).
export const fontAssets = {
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

// With per-weight font files, weight is selected via fontFamily (not fontWeight).
export const fontFamily = {
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;
