import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_GPS_THRESHOLDS } from '@/engines/gps';
import { SettingsScreen } from '@/screens/SettingsScreen';

// Same synthetic metrics as missionScreen.test.tsx/noMissionScreen.test.tsx.
const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// docs/11 "Paramètres" — only items with a real mechanism (voix/compte/
// version/thème) are built. `useAuth()` is mocked, same reasoning as
// noMissionScreen.test.tsx.
const mockLogout = jest.fn().mockResolvedValue(undefined);
let mockAuthState: { status: 'signedIn' | 'signedOut'; session?: { user: { email: string } } } = {
  status: 'signedIn',
  session: { user: { email: 'operateur@groupereca.ca' } },
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ ...mockAuthState, logout: mockLogout }),
}));

function makeCtx(
  overrides: Partial<{
    voiceEnabled: boolean;
    setVoiceEnabled: jest.Mock;
    detectionRadii: typeof DEFAULT_GPS_THRESHOLDS;
    setDetectionRadii: jest.Mock;
  }> = {}
) {
  return {
    voiceEnabled: true,
    setVoiceEnabled: jest.fn(),
    detectionRadii: DEFAULT_GPS_THRESHOLDS,
    setDetectionRadii: jest.fn().mockReturnValue({ success: true }),
    ...overrides,
  };
}

function renderScreen(props: {
  ctx: ReturnType<typeof makeCtx>;
  onClose: () => void;
  onOpenDevMode?: () => void;
}) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <SettingsScreen {...props} />
    </SafeAreaProvider>
  );
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    mockAuthState = { status: 'signedIn', session: { user: { email: 'operateur@groupereca.ca' } } };
    mockLogout.mockClear();
  });

  it('shows the signed-in user, the voice toggle, theme, and version', () => {
    const { getByText, getByTestId } = renderScreen({ ctx: makeCtx(), onClose: jest.fn() });

    expect(getByText('operateur@groupereca.ca')).toBeTruthy();
    expect(getByText('Sombre')).toBeTruthy();
    expect(getByTestId('voice-switch').props.value).toBe(true);
  });

  it('"Fermer" calls onClose', () => {
    const onClose = jest.fn();
    const { getByText } = renderScreen({ ctx: makeCtx(), onClose });

    fireEvent.press(getByText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('toggling the voice switch calls ctx.setVoiceEnabled', () => {
    const ctx = makeCtx();
    const { getByTestId } = renderScreen({ ctx, onClose: jest.fn() });

    fireEvent(getByTestId('voice-switch'), 'valueChange', false);
    expect(ctx.setVoiceEnabled).toHaveBeenCalledWith(false);
  });

  it('"Déconnexion" calls auth.logout when signed in', async () => {
    const { getByText } = renderScreen({ ctx: makeCtx(), onClose: jest.fn() });

    await act(async () => {
      fireEvent.press(getByText('Déconnexion'));
    });
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('shows "Mode développement" only when onOpenDevMode is provided (__DEV__ gate)', () => {
    const { queryByText, rerender } = renderScreen({ ctx: makeCtx(), onClose: jest.fn() });
    expect(queryByText('Mode développement')).toBeNull();

    const onOpenDevMode = jest.fn();
    rerender(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <SettingsScreen ctx={makeCtx()} onClose={jest.fn()} onOpenDevMode={onOpenDevMode} />
      </SafeAreaProvider>
    );
    fireEvent.press(queryByText('Mode développement') as never);
    expect(onOpenDevMode).toHaveBeenCalledTimes(1);
  });

  it('shows the current detection radii and saves valid changes via ctx.setDetectionRadii', () => {
    const ctx = makeCtx();
    const { getByTestId, getByText, queryByTestId } = renderScreen({ ctx, onClose: jest.fn() });

    expect(getByTestId('approach-radius-input').props.value).toBe(String(DEFAULT_GPS_THRESHOLDS.approachRadiusMeters));
    expect(getByTestId('work-radius-input').props.value).toBe(String(DEFAULT_GPS_THRESHOLDS.workRadiusMeters));

    fireEvent.changeText(getByTestId('approach-radius-input'), '80');
    fireEvent.changeText(getByTestId('work-radius-input'), '20');
    fireEvent.press(getByText('Enregistrer'));

    expect(ctx.setDetectionRadii).toHaveBeenCalledWith({ approachRadiusMeters: 80, workRadiusMeters: 20 });
    expect(queryByTestId('radii-error')).toBeNull();
    expect(getByTestId('radii-saved')).toBeTruthy();
  });

  it('shows the error message returned by ctx.setDetectionRadii and does not show "Enregistré"', () => {
    const ctx = makeCtx({
      setDetectionRadii: jest.fn().mockReturnValue({
        success: false,
        error: 'Le rayon « en cours » doit être plus petit que le rayon « en approche ».',
      }),
    });
    const { getByTestId, getByText, queryByTestId } = renderScreen({ ctx, onClose: jest.fn() });

    fireEvent.changeText(getByTestId('approach-radius-input'), '10');
    fireEvent.changeText(getByTestId('work-radius-input'), '50');
    fireEvent.press(getByText('Enregistrer'));

    expect(getByTestId('radii-error')).toHaveTextContent(
      'Le rayon « en cours » doit être plus petit que le rayon « en approche ».'
    );
    expect(queryByTestId('radii-saved')).toBeNull();
  });

  it('shows a validation error for non-numeric input without calling ctx.setDetectionRadii', () => {
    const ctx = makeCtx();
    const { getByTestId, getByText } = renderScreen({ ctx, onClose: jest.fn() });

    fireEvent.changeText(getByTestId('approach-radius-input'), 'abc');
    fireEvent.press(getByText('Enregistrer'));

    expect(ctx.setDetectionRadii).not.toHaveBeenCalled();
    expect(getByTestId('radii-error')).toHaveTextContent('Entrez des nombres valides.');
  });
});
