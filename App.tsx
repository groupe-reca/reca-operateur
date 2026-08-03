import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppFonts } from '@/config/theme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MissionProvider } from '@/context/MissionContext';
import { LiveMissionScreen } from '@/screens/LiveMissionScreen';
import { LoginScreen } from '@/screens/LoginScreen';

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

  // Sprint 017 (partie 1/N) — LiveMissionScreen (real State Machine/GPS/
  // Sync/Offline/Voice engines via MissionContext) finally replaces
  // MissionScreenPreview here, honoring the swap promised since Sprint 004
  // ("reswitché vers un MissionScreen unique piloté par le vrai State
  // Machine une fois qu'il existera" — redifféré à chaque sprint moteur
  // depuis). MissionScreenPreview/the 4 static mocks stay in the repo for
  // reference (same status as ComponentGalleryScreen).
  return (
    <MissionProvider employeeId={auth.employeeId}>
      <LiveMissionScreen />
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
