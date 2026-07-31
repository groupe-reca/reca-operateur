import { Check, CircleDashed } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/config/theme';

import { ProblemButton } from '../controls/ProblemButton';
import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

// A step is either already completed (checkmark), the current one
// (highlighted, numbered), or one of the next residences shown for context
// (numbered, dimmed "À venir"). Purely presentational — no state logic.
export type ProgressStep =
  | { kind: 'done'; label: string }
  | { kind: 'current'; n: number; label: string }
  | { kind: 'upcoming'; n: number; label: string };

type Props = {
  stateLabel: string; // e.g. "EN COURS"
  address: string;
  steps: ProgressStep[];
  onProblem?: () => void;
};

// Floating left column: current phase + address + a compact journey/next-up
// checklist + the permanent problem action.
export function CurrentResidenceProgressCard({ stateLabel, address, steps, onProblem }: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <View style={styles.header}>
        <Txt variant="labelCaps" color={colors.success}>
          {stateLabel}
        </Txt>
        <Icon icon={CircleDashed} color={colors.success} size={16} />
      </View>
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
                    ? { backgroundColor: colors.success, borderColor: colors.success }
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
                  ? colors.success
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
  card: { padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  steps: { gap: spacing.sm + 2 },
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
