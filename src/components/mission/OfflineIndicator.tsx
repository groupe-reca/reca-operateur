import { CloudOff } from 'lucide-react-native';

import { colors } from '@/config/theme';

import { Pill } from '../ui/Pill';
import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

type Props = {
  // Number of local operations waiting to sync. Shown so the operator is
  // reassured nothing is lost — no function is ever blocked offline.
  pendingChanges: number;
};

export function OfflineIndicator({ pendingChanges }: Props) {
  return (
    <Pill accent={colors.warning}>
      <Icon icon={CloudOff} color={colors.warning} size={14} />
      <Txt variant="meta" color={colors.textPrimary}>
        Hors ligne{pendingChanges > 0 ? ` · ${pendingChanges} en attente` : ''}
      </Txt>
    </Pill>
  );
}
