import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NoMissionScreen } from '@/screens/NoMissionScreen';

// Same synthetic metrics as missionScreen.test.tsx/devScreen.test.tsx.
const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// docs/11 "Aucune mission": logo, utilisateur, état réseau, message clair,
// actualisation, déconnexion. `useAuth()` is mocked (not a real
// AuthProvider) — this screen only reads it, never touches Supabase.
const mockLogout = jest.fn().mockResolvedValue(undefined);
let mockAuthState: { status: 'signedIn' | 'signedOut'; session?: { user: { email: string } } } = {
  status: 'signedIn',
  session: { user: { email: 'operateur@groupereca.ca' } },
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ ...mockAuthState, logout: mockLogout }),
}));

function makeCtx(overrides: Partial<{ refreshAssignment: jest.Mock }> = {}) {
  return {
    offlineState: { status: 'ONLINE' as const, since: '2026-08-02T10:00:00.000Z', lastOnlineAt: '2026-08-02T10:00:00.000Z' },
    refreshAssignment: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderScreen(ctx: ReturnType<typeof makeCtx>) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <NoMissionScreen ctx={ctx} />
    </SafeAreaProvider>
  );
}

describe('NoMissionScreen', () => {
  beforeEach(() => {
    mockAuthState = { status: 'signedIn', session: { user: { email: 'operateur@groupereca.ca' } } };
    mockLogout.mockClear();
  });

  it('shows the signed-in user, network state, and the clear message', () => {
    const { getByText } = renderScreen(makeCtx());

    expect(getByText('operateur@groupereca.ca')).toBeTruthy();
    expect(getByText('En ligne')).toBeTruthy();
    expect(getByText('Aucune mission ne vous est assignée pour le moment.')).toBeTruthy();
  });

  it('"Actualiser" calls ctx.refreshAssignment', async () => {
    const ctx = makeCtx();
    const { getByText } = renderScreen(ctx);

    await act(async () => {
      fireEvent.press(getByText('Actualiser'));
    });
    expect(ctx.refreshAssignment).toHaveBeenCalledTimes(1);
  });

  it('"Déconnexion" calls auth.logout when signed in', async () => {
    const { getByText } = renderScreen(makeCtx());

    await act(async () => {
      fireEvent.press(getByText('Déconnexion'));
    });
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('hides "Déconnexion" when not signed in', () => {
    mockAuthState = { status: 'signedOut' };
    const { queryByText } = renderScreen(makeCtx());

    expect(queryByText('Déconnexion')).toBeNull();
  });
});
