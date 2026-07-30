import { useFonts } from 'expo-font';

import { fontAssets } from './fonts';

// Loads the Manrope weights at startup. Returns whether they are ready.
export function useAppFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, error] = useFonts(fontAssets);
  return { loaded, error };
}
