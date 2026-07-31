import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppFonts } from '@/config/theme';
import { MissionScreenPreview } from '@/screens/MissionScreenPreview';

// Keep the splash visible until Manrope is loaded (avoids a font flash).
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden */
});

export default function App() {
  const { loaded, error } = useAppFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {
        /* no-op */
      });
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  // Sprint 004: MissionScreenPreview (dev-only switcher over the 4
  // operational variants) is temporarily the entry point, same pattern as
  // Sprint 002's ComponentGalleryScreen. Swapped back to a single
  // MissionScreen fed by the real engine once the State Machine exists.
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MissionScreenPreview />
    </SafeAreaProvider>
  );
}
