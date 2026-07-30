import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useAppFonts } from '@/config/theme';
import { ComponentGalleryScreen } from '@/screens/ComponentGalleryScreen';

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

  // Sprint 002: the component gallery is the visual deliverable. The assembled
  // Mission Screen comes in Sprint 003.
  return (
    <>
      <StatusBar style="light" />
      <ComponentGalleryScreen />
    </>
  );
}
