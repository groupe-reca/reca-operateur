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
  // Undefined/omitted = icon-only (refonte 2026-08-02: floats standalone
  // over the map, a visible label would collide with whatever sits below —
  // see MissionScreen.tsx). Only BottomTabBar's usage still passes one,
  // where the label sits inside the bar's own background.
  label?: string;
};

// Central voice/announcement FAB. Keeps the same function in every state.
export function VoiceButton({ active = true, onPress, size = 64, label }: Props) {
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
      {label ? (
        <Txt variant="meta" color={colors.textSecondary}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs + 2 },
  fab: { alignItems: 'center', justifyContent: 'center' },
});
