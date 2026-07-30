import { TriangleAlert } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { colors, radii, spacing } from '@/config/theme';

import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';

// Permanent, always-in-the-same-place problem action. Functional red.
export function ProblemButton({
  onPress,
  label = 'Signaler un problème',
}: {
  onPress?: () => void;
  label?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.btn}
    >
      <Icon icon={TriangleAlert} color={colors.textPrimary} size={18} />
      <Txt variant="cardTitle">{label}</Txt>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
