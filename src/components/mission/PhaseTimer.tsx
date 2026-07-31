import { View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { Txt } from '../ui/Txt';

// Formats a duration in seconds as mm:ss, or h:mm:ss past one hour.
// Pure helper (exported for tests). The timer only DISPLAYS — it never counts.
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// Same idea, but always shows the hour segment (e.g. "00:18:32") — used by
// the mission-wide elapsed time (MissionCard), distinct from the per-phase
// PhaseTimer above which drops a zero hour (mock-encours.png shows both
// conventions side by side: "TEMPS DE MISSION 00:18:32" vs a phase's "05:42").
export function formatElapsedWithHours(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

type Props = {
  label: string;
  seconds: number;
  // Functional colour of the current phase (from State Machine / GPS Engine).
  color?: string;
};

export function PhaseTimer({ label, seconds, color = colors.success }: Props) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Txt variant="labelCaps" color={color}>
        {label}
      </Txt>
      <Txt variant="timer">{formatDuration(seconds)}</Txt>
    </View>
  );
}
