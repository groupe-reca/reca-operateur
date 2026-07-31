import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/controls/BottomTabBar';
import { CurrentResidenceProgressCard, type ProgressStep } from '@/components/mission/CurrentResidenceProgressCard';
import { formatElapsedWithHours } from '@/components/mission/PhaseTimer';
import { MissionScreen } from '@/screens/MissionScreen';

// react-native-safe-area-context's own `initialWindowMetrics` reads a native
// module constant that is always null under Jest (no real native side) — a
// plain synthetic metrics object is required so SafeAreaProvider renders its
// children synchronously instead of waiting for a native onInsetsChange event
// that never fires in tests.
const TEST_SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('formatElapsedWithHours', () => {
  it('always shows the hour segment', () => {
    expect(formatElapsedWithHours(1112)).toBe('00:18:32');
    expect(formatElapsedWithHours(3661)).toBe('01:01:01');
    expect(formatElapsedWithHours(0)).toBe('00:00:00');
  });
});

describe('CurrentResidenceProgressCard', () => {
  it('renders done/current/upcoming steps', () => {
    const steps: ProgressStep[] = [
      { kind: 'done', label: 'EN ROUTE' },
      { kind: 'current', n: 3, label: 'EN COURS' },
      { kind: 'upcoming', n: 4, label: 'À venir' },
    ];
    const { getByText, getAllByText } = render(
      <CurrentResidenceProgressCard stateLabel="EN COURS" address="224 rue Scott" steps={steps} />
    );
    expect(getByText('EN ROUTE')).toBeTruthy();
    // "EN COURS" appears twice: the card's own state header + the current step row.
    expect(getAllByText('EN COURS').length).toBe(2);
    expect(getByText('À venir')).toBeTruthy();
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
  it('renders the mission and active residence without crashing', () => {
    // initialMetrics lets SafeAreaProvider render its children synchronously
    // under Jest, which otherwise waits for a native onInsetsChange event
    // that never fires in the test environment.
    const { getByText, getAllByText } = render(
      <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
        <MissionScreen />
      </SafeAreaProvider>
    );
    expect(getByText('Mission 24-01-15')).toBeTruthy();
    expect(getAllByText('224', { exact: false }).length).toBeGreaterThan(0);
    expect(getByText('Carte')).toBeTruthy();
  });
});
