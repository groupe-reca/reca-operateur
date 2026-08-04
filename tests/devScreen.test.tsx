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
    realGpsPaused: false,
    setRealGpsPaused: jest.fn(),
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
    missionAlerts: [],
    gpsState: { available: false, reason: 'no_mission' },
    synchronizationState: { status: 'SYNCED', pendingCount: 0, failedCount: 0 },
    offlineState: { status: 'ONLINE', since: '2026-08-02T10:00:00.000Z', lastOnlineAt: '2026-08-02T10:00:00.000Z' },
    session: null,
    voiceEnabled: true,
    setVoiceEnabled: jest.fn(),
    detectionRadii: DEFAULT_GPS_THRESHOLDS,
    setDetectionRadii: jest.fn(),
    reportProblem: jest.fn(),
    resolveProblem: jest.fn(),
    skipItem: jest.fn(),
    closeMission: jest.fn(),
    startMission: jest.fn(),
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

  it('pauses the real GPS sensor on mount and resumes it on unmount', () => {
    const ctx = makeCtx();
    const { unmount } = renderDevScreen(ctx, jest.fn());

    expect(ctx.dev.setRealGpsPaused).toHaveBeenCalledWith(true);
    expect(ctx.dev.setRealGpsPaused).toHaveBeenCalledTimes(1);

    unmount();
    expect(ctx.dev.setRealGpsPaused).toHaveBeenCalledWith(false);
    expect(ctx.dev.setRealGpsPaused).toHaveBeenCalledTimes(2);
  });

  it('shows "Reprendre le capteur réel" and lets it resume the sensor early, while paused', () => {
    const setRealGpsPaused = jest.fn();
    const ctx = makeCtx({ dev: makeDev({ realGpsPaused: true, setRealGpsPaused }) });
    const { getByText } = renderDevScreen(ctx, jest.fn());

    expect(getByText('Capteur réel en pause (simulation active).')).toBeTruthy();
    fireEvent.press(getByText('Reprendre le capteur réel'));
    expect(setRealGpsPaused).toHaveBeenCalledWith(false);
  });

  it('does not show "Reprendre le capteur réel" while the real sensor is already active', () => {
    const ctx = makeCtx({ dev: makeDev({ realGpsPaused: false }) });
    const { getByText, queryByText } = renderDevScreen(ctx, jest.fn());

    expect(getByText('Capteur réel actif.')).toBeTruthy();
    expect(queryByText('Reprendre le capteur réel')).toBeNull();
  });
});
