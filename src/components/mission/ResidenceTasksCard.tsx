import { Clock } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { GlassCard } from '../ui/GlassCard';
import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

export type ResidenceTask = {
  icon: ComponentType<LucideProps>;
  label: string;
  status: string;
};

type Props = {
  stateLabel: string; // e.g. "EN COURS"
  tasks: ResidenceTask[];
  estimatedTime: string;
};

// Floating right panel: services/tasks in progress for the active residence.
export function ResidenceTasksCard({ stateLabel, tasks, estimatedTime }: Props) {
  return (
    <GlassCard level="panel" radius="lg" style={styles.card}>
      <Txt variant="labelCaps" color={colors.success}>
        {stateLabel}
      </Txt>

      {tasks.map((task, index) => (
        <View key={index} style={styles.row}>
          <Icon icon={task.icon} color={colors.textSecondary} size={20} />
          <View>
            <Txt variant="body">{task.label}</Txt>
            <Txt variant="meta" color={colors.textSecondary}>
              {task.status}
            </Txt>
          </View>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Icon icon={Clock} color={colors.textSecondary} size={20} />
        <View>
          <Txt variant="meta" color={colors.textSecondary}>
            Temps estimé
          </Txt>
          <Txt variant="cardTitle">{estimatedTime}</Txt>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, width: 190 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.border },
});
