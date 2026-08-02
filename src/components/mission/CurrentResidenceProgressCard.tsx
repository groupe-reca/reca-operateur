import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/config/theme';

import { ProblemButton } from '../controls/ProblemButton';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';
import { PhaseTimer } from './PhaseTimer';

// A step is either already completed (checkmark, always "success" green —
// a past phase stays a success regardless of the active state's colour), the
// current one (highlighted in the active state's functional colour), or one
// of the next residences shown for context (numbered, dimmed "À venir").
// Purely presentational — no state logic.
export type ProgressStep =
  | { kind: 'done'; label: string }
  | { kind: 'current'; n: number; label: string }
  | { kind: 'upcoming'; n: number; label: string };

type Props = {
  stateLabel: string; // e.g. "EN COURS" — also the PhaseTimer's label
  timerSeconds: number;
  // Functional colour of the active state (docs/11 Phase 03: bleu EN ROUTE,
  // ambre EN APPROCHE, vert EN COURS). Drives the timer and the "current" step.
  color: string;
  address: string;
  steps: ProgressStep[];
  onProblem?: () => void;
};

// Floating left column: phase timer + address + a compact journey/next-up
// checklist + the permanent problem action.
export function CurrentResidenceProgressCard({
  stateLabel,
  timerSeconds,
  color,
  address,
  steps,
  onProblem,
}: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <PhaseTimer label={stateLabel} seconds={timerSeconds} color={color} />
      <Txt variant="address" numberOfLines={1}>
        {address}
      </Txt>

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepRow}>
            {step.kind === 'done' ? (
              <View style={styles.doneBadge}>
                <Icon icon={Check} color={colors.success} size={14} strokeWidth={3} />
              </View>
            ) : (
              <View
                style={[
                  styles.numberBadge,
                  step.kind === 'current'
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: 'rgba(255,255,255,0.3)' },
                ]}
              >
                <Txt
                  style={styles.numberText}
                  color={step.kind === 'current' ? colors.bg : colors.textSecondary}
                >
                  {String(step.n)}
                </Txt>
              </View>
            )}
            <Txt
              variant={step.kind === 'current' ? 'cardTitle' : 'body'}
              color={
                step.kind === 'current'
                  ? color
                  : step.kind === 'upcoming'
                    ? colors.textSecondary
                    : colors.textPrimary
              }
            >
              {step.label}
            </Txt>
          </View>
        ))}
      </View>

      {onProblem ? <ProblemButton onPress={onProblem} /> : null}
    </GlassCard>
  );
}

const BADGE = 24;

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.sm },
  steps: { gap: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doneBadge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontFamily: fontFamily.extrabold, fontSize: 12 },
});
