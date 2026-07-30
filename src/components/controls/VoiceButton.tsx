import { Mic, MicOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/config/theme';

import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Txt } from '../ui/Txt';

type Props = {
  // Whether voice announcements are on (brand red) or muted (neutral panel).
  active?: boolean;
  onPress?: () => void;
  size?: number;
  label?: string;
};

// Central voice/announcement FAB. Keeps the same function in every state.
export function VoiceButton({ active = true, onPress, size = 64, label = 'Annonce' }: Props) {
  return (
    <View style={styles.wrap}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={active ? 'Annonce vocale activée' : 'Annonce vocale coupée'}
      >
        <View
          style={[
            styles.fab,
            {
              width: size,
              height: size,
              borderRadius: radii.pill,
              backgroundColor: active ? colors.brand : colors.panel,
            },
          ]}
        >
          <Icon icon={active ? Mic : MicOff} color={colors.textPrimary} size={Math.round(size * 0.4)} />
        </View>
      </PressableScale>
      <Txt variant="meta" color={colors.textSecondary}>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs + 2 },
  fab: { alignItems: 'center', justifyContent: 'center' },
});
