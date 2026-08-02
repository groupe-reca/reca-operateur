import { act, fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/controls/BottomTabBar';
import { CurrentResidenceProgressCard, type ProgressStep } from '@/components/mission/CurrentResidenceProgressCard';
import { formatElapsedWithHours } from '@/components/mission/PhaseTimer';
import { ProblemStateCard } from '@/components/mission/ProblemStateCard';
import { MissionScreen } from '@/screens/MissionScreen';
import { APPROACHING_MOCK, IN_PROGRESS_MOCK, PROBLEM_MOCK } from '@/screens/missionScreenMocks';
import { colors } from '@/config/theme';

// react-native-safe-area-context's own `initialWindowMetrics` reads a native
// module constant that is always null under Jest (no real native side) — a
// plain synthetic metrics object is required so SafeAreaProvider renders its
// children synchronously instead of waiting for a native onInsetsChange event
// that never fires in tests.
const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

// MissionMapView's useSuggestedRoute always schedules a microtask (even for
// the synchronous no-token fallback, since fetchSuggestedRoute is declared
// async) — flushing it here avoids an "update not wrapped in act()" warning
// on every test that renders MissionScreen.
async function renderScreen(state: Parameters<typeof MissionScreen>[0]['state']) {
  const utils = render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <MissionScreen state={state} />
    </SafeAreaProvider>
  );
  await act(async () => {});
  return utils;
}

describe('formatElapsedWithHours', () => {
  it('always shows the hour segment', () => {
    expect(formatElapsedWithHours(1112)).toBe('00:18:32');
    expect(formatElapsedWithHours(3661)).toBe('01:01:01');
    expect(formatElapsedWithHours(0)).toBe('00:00:00');
  });
});

describe('CurrentResidenceProgressCard', () => {
  it('renders the phase timer and done/current/upcoming steps', () => {
    const steps: ProgressStep[] = [
      { kind: 'done', label: 'EN ROUTE' },
      { kind: 'current', n: 3, label: 'EN COURS' },
      { kind: 'upcoming', n: 4, label: 'À venir' },
    ];
    const { getByText, getAllByText } = render(
      <CurrentResidenceProgressCard
        stateLabel="EN COURS"
        timerSeconds={221}
        color={colors.success}
        address="224 rue Scott"
        steps={steps}
      />
    );
    expect(getByText('03:41')).toBeTruthy();
    expect(getByText('EN ROUTE')).toBeTruthy();
    // "EN COURS" appears twice: the PhaseTimer label + the current step row.
    expect(getAllByText('EN COURS').length).toBe(2);
    expect(getByText('À venir')).toBeTruthy();
  });
});

describe('ProblemStateCard', () => {
  it('shows the problem type, note and frozen timer', () => {
    const { getByText } = render(
      <ProblemStateCard
        address="224 rue Scott"
        problemType="Accès bloqué"
        note="Entrée obstruée."
        frozenSeconds={143}
      />
    );
    expect(getByText('Accès bloqué')).toBeTruthy();
    expect(getByText('Entrée obstruée.')).toBeTruthy();
    expect(getByText('02:23')).toBeTruthy();
  });
});

describe('BottomTabBar', () => {
  it('shows all tab labels and fires onTabPress', () => {
    const onTabPress = jest.fn();
    const { getByText, getByLabelText } = render(
      <BottomTabBar active="carte" alertsCount={2} onTabPress={onTabPress} />
    );
    expect(getByText('Carte')).toBeTruthy();
    expect(getByText('Mission')).toBeTruthy();
    expect(getByText('Alertes')).toBeTruthy();
    expect(getByText('Plus')).toBeTruthy();
    fireEvent.press(getByLabelText('Mission'));
    expect(onTabPress).toHaveBeenCalledWith('mission');
  });
});

describe('MissionScreen', () => {
  it('renders the IN_PROGRESS variant with tasks and the offline overlay', async () => {
    const { getByText, getAllByText } = await renderScreen(IN_PROGRESS_MOCK);
    expect(getByText('Mission 24-01-15')).toBeTruthy();
    expect(getAllByText('224', { exact: false }).length).toBeGreaterThan(0);
    expect(getByText('Déneigement')).toBeTruthy();
    expect(getByText('Hors ligne · 3 en attente')).toBeTruthy();
  });

  it('renders the PROBLEM variant with the problem card instead of the checklist', async () => {
    const { getByText, queryByText } = await renderScreen(PROBLEM_MOCK);
    expect(getByText('Accès bloqué')).toBeTruthy();
    // No task panel while a problem is active (only shown while IN_PROGRESS).
    expect(queryByText('Déneigement')).toBeNull();
  });

  it('groups alerts as one full card plus a "+N instructions" chip', async () => {
    const { getByText } = await renderScreen(APPROACHING_MOCK);
    expect(getByText('Plate-bande au fond')).toBeTruthy();
    expect(getByText('+2 instructions')).toBeTruthy();
  });
});
