import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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

function makeCtx(overrides: Partial<{ voiceEnabled: boolean; setVoiceEnabled: jest.Mock }> = {}) {
  return {
    voiceEnabled: true,
    setVoiceEnabled: jest.fn(),
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
});
