import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppFonts } from '@/config/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MissionProvider } from '@/context/MissionContext';
import { LoginScreen } from '@/screens/LoginScreen';
import { MissionScreenPreview } from '@/screens/MissionScreenPreview';

// Keep the splash visible until Manrope is loaded (avoids a font flash).
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden */
});

function AuthGate() {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return null;
  }

  if (auth.status === 'signedOut') {
    return <LoginScreen />;
  }

  // Sprint 004: MissionScreenPreview (dev-only switcher over the 4
  // operational variants) is temporarily the entry point, same pattern as
  // Sprint 002's ComponentGalleryScreen. Swapped back to a single
  // MissionScreen fed by the real engine once the State Machine exists.
  //
  // Sprint 007-008: MissionProvider now wraps the tree (local SQLite
  // persistence + MissionContext). MissionScreen itself still reads its own
  // static mocks — see memory.md for the documented scope decision — this
  // only proves the persistence layer end-to-end via a small debug line in
  // MissionScreenPreview.
  return (
    <MissionProvider employeeId={auth.employeeId}>
      <MissionScreenPreview />
    </MissionProvider>
  );
}

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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
