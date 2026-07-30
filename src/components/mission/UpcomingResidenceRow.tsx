import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii, spacing, statusTone } from '@/config/theme';
import { STATE_LABELS_FR, type MissionItemState } from '@/domain/status';

import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';

type Props = {
  n: number;
  state: MissionItemState;
  address: string;
  distanceLabel?: string;
  onPress?: () => void;
};

// One row in the upcoming residences list: numbered badge (tone by state),
// address, state/distance, chevron.
export function UpcomingResidenceRow({ n, state, address, distanceLabel, onPress }: Props) {
  const tone = statusTone[state];
  return (
    <PressableScale onPress={onPress} style={styles.row} accessibilityRole="button" accessibilityLabel={`Résidence ${n}, ${address}`}>
      <View style={[styles.badge, { borderColor: tone }]}>
        <Txt style={[styles.badgeText, { color: tone }]}>{String(n)}</Txt>
      </View>
      <View style={styles.text}>
        <Txt variant="cardTitle" numberOfLines={1}>
          {address}
        </Txt>
        <Txt variant="meta" color={colors.textSecondary}>
          {distanceLabel ? `${STATE_LABELS_FR[state]} · ${distanceLabel}` : STATE_LABELS_FR[state]}
        </Txt>
      </View>
      <Icon icon={ChevronRight} color={colors.textSecondary} size={18} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fontFamily.extrabold, fontSize: 13 },
  text: { flex: 1, gap: 2 },
});
