import { render } from '@testing-library/react-native';
import { TriangleAlert } from 'lucide-react-native';

import { AlertCard } from '@/components/mission/AlertCard';
import { MissionCard } from '@/components/mission/MissionCard';
import { formatDuration, PhaseTimer } from '@/components/mission/PhaseTimer';

describe('formatDuration', () => {
  it('formats mm:ss under an hour', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(8)).toBe('00:08');
    expect(formatDuration(277)).toBe('04:37');
  });

  it('formats h:mm:ss past an hour', () => {
    expect(formatDuration(1112)).toBe('18:32');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('never goes negative', () => {
    expect(formatDuration(-5)).toBe('00:00');
  });
});

describe('components render', () => {
  it('PhaseTimer shows the label and formatted time', () => {
    const { getByText } = render(<PhaseTimer label="En cours" seconds={221} />);
    expect(getByText('En cours')).toBeTruthy();
    expect(getByText('03:41')).toBeTruthy();
  });

  it('AlertCard shows its text', () => {
    const { getByText } = render(
      <AlertCard level="warning" icon={TriangleAlert} text="Plate-bande au fond" />
    );
    expect(getByText('Plate-bande au fond')).toBeTruthy();
  });

  it('MissionCard shows mission id and progress', () => {
    const { getByText } = render(
      <MissionCard
        missionId="24-01-15"
        secteur="Saint-Jérôme"
        index={3}
        total={28}
        progressPct={10}
        missionSeconds={1112}
        syncState="synced"
      />
    );
    expect(getByText('Mission 24-01-15')).toBeTruthy();
    expect(getByText('10%')).toBeTruthy();
  });
});
