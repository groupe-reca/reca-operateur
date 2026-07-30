import { LocateFixed, UploadCloud, Wifi, WifiOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

type Props = {
  gpsAccuracy: number; // metres
  network: 'online' | 'offline';
  pendingChanges: number;
};

// Compact GPS / network / pending row. Problems are made more visible than
// normal states (colour + always-shown pending count).
export function SystemStatus({ gpsAccuracy, network, pendingChanges }: Props) {
  const gpsColor = gpsAccuracy <= 10 ? colors.success : colors.warning;
  const online = network === 'online';
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Icon icon={LocateFixed} color={gpsColor} size={14} />
        <Txt variant="meta" color={colors.textSecondary}>{`${gpsAccuracy} m`}</Txt>
      </View>
      <View style={styles.item}>
        <Icon icon={online ? Wifi : WifiOff} color={online ? colors.textSecondary : colors.danger} size={14} />
        <Txt variant="meta" color={online ? colors.textSecondary : colors.danger}>
          {online ? 'Connecté' : 'Hors ligne'}
        </Txt>
      </View>
      {pendingChanges > 0 ? (
        <View style={styles.item}>
          <Icon icon={UploadCloud} color={colors.warning} size={14} />
          <Txt variant="meta" color={colors.warning}>{`${pendingChanges} en attente`}</Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
});
