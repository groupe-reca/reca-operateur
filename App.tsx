import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppFonts } from '@/config/theme';
import { MissionScreen } from '@/screens/MissionScreen';

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

  // Sprint 003: the assembled Mission Screen (EN COURS) is now the entry
  // point. ComponentGalleryScreen (Sprint 002) stays in the repo for
  // reference/tests but is no longer wired here.
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MissionScreen />
    </SafeAreaProvider>
  );
}
