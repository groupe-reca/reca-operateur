import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_GPS_THRESHOLDS } from '@/engines/gps';
import type { DevTools, MissionContextValue } from '@/context/MissionContext';
import { DevScreen } from '@/screens/DevScreen';

// Same synthetic metrics as missionScreen.test.tsx — SafeAreaProvider only
// renders children once it has real (or test-provided) insets.
const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function makeDev(overrides: Partial<DevTools> = {}): DevTools {
  return {
    gps: {
      moveTo: jest.fn().mockResolvedValue(undefined),
      advanceTime: jest.fn().mockResolvedValue(undefined),
      loseSignal: jest.fn(),
      recoverSignal: jest.fn().mockResolvedValue(undefined),
    },
    thresholds: DEFAULT_GPS_THRESHOLDS,
    getStates: () => ({
      missionStatus: 'READY',
      itemsByStatus: { EN_ROUTE: 1, WAITING: 2 },
      gpsPhase: 'EN_ROUTE',
      synchronizationState: { status: 'SYNCED', pendingCount: 0, failedCount: 0 },
      offlineState: { status: 'ONLINE', since: '2026-08-02T10:00:00.000Z', lastOnlineAt: '2026-08-02T10:00:00.000Z' },
    }),
    getEvents: () => ({ gps: [], sync: [], offline: [], voice: [] }),
    getSyncQueue: jest.fn().mockResolvedValue([]),
    getTransitions: jest.fn().mockResolvedValue([]),
    setNetworkOverride: jest.fn().mockResolvedValue(undefined),
    exportLogs: jest.fn().mockResolvedValue('{}'),
    ...overrides,
  };
}

function makeCtx(overrides: Partial<MissionContextValue> = {}): MissionContextValue {
  return {
    loading: false,
    mission: null,
    activeMissionItem: null,
    nextMissionItems: [],
    allMissionItems: [],
    gpsState: { available: false, reason: 'no_mission' },
    synchronizationState: { status: 'SYNCED', pendingCount: 0, failedCount: 0 },
    offlineState: { status: 'ONLINE', since: '2026-08-02T10:00:00.000Z', lastOnlineAt: '2026-08-02T10:00:00.000Z' },
    session: null,
    reportProblem: jest.fn(),
    resolveProblem: jest.fn(),
    skipItem: jest.fn(),
    closeMission: jest.fn(),
    refreshAssignment: jest.fn(),
    dev: makeDev(),
    ...overrides,
  };
}

function renderDevScreen(ctx: MissionContextValue, onClose: () => void) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <DevScreen ctx={ctx} onClose={onClose} />
    </SafeAreaProvider>
  );
}

describe('DevScreen', () => {
  it('renders the states/thresholds sections from dev.getStates()/dev.thresholds, no residence to simulate', () => {
    const { getByText } = renderDevScreen(makeCtx(), jest.fn());

    expect(getByText('READY')).toBeTruthy();
    expect(getByText('EN_ROUTE')).toBeTruthy();
    expect(getByText('Aucune résidence à simuler (pas de coordonnées).')).toBeTruthy();
    expect(getByText(String(DEFAULT_GPS_THRESHOLDS.approachRadiusMeters))).toBeTruthy();
  });

  it('calls onClose when "Fermer" is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = renderDevScreen(makeCtx(), onClose);

    fireEvent.press(getByText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('offers GPS simulation controls once a target residence with coordinates exists', async () => {
    const ctx = makeCtx({
      activeMissionItem: {
        id: 'item-1',
        missionId: 'mission-1',
        contractId: null,
        ordre: 1,
        address: '224 rue Scott',
        latitude: 45.78,
        longitude: -73.95,
        detectionRadiusMeters: null,
        status: 'EN_ROUTE',
        enRouteAt: null,
        enApprocheAt: null,
        enCoursAt: null,
        termineeAt: null,
        travelTimeSeconds: null,
        interventionTimeSeconds: null,
        notes: null,
        problemCode: null,
        createdAt: '2026-08-02T10:00:00.000Z',
        updatedAt: '2026-08-02T10:00:00.000Z',
      },
    });
    const { getByText } = renderDevScreen(ctx, jest.fn());

    await act(async () => {
      fireEvent.press(getByText('Aller à la cible'));
    });
    expect(ctx.dev.gps.moveTo).toHaveBeenCalledWith({ latitude: 45.78, longitude: -73.95 });
  });
});
