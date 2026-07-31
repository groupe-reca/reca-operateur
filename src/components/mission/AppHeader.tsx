import { Bell, Cloud, Menu } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/config/theme';

import { FloatingActionButton } from '../controls/FloatingActionButton';
import { OfficialLogo } from '../brand/OfficialLogo';
import { Wordmark } from '../brand/Wordmark';
import { NotificationBadge } from '../ui/NotificationBadge';

type Props = {
  onMenu?: () => void;
  onSync?: () => void;
  onNotifications?: () => void;
  notifications?: number;
};

// Always-visible top bar: menu · official logo + OPÉRATEUR · sync + notifications.
export function AppHeader({ onMenu, onSync, onNotifications, notifications = 0 }: Props) {
  return (
    <View style={styles.row}>
      <FloatingActionButton icon={Menu} size={44} onPress={onMenu} accessibilityLabel="Menu" />
      <View style={styles.brand}>
        <OfficialLogo width={120} />
        <Wordmark size={15} />
      </View>
      <View style={styles.right}>
        <FloatingActionButton icon={Cloud} size={44} iconColor={colors.success} onPress={onSync} accessibilityLabel="Synchronisation" />
        <View>
          <FloatingActionButton icon={Bell} size={44} onPress={onNotifications} accessibilityLabel="Notifications" />
          <NotificationBadge count={notifications} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  brand: { alignItems: 'center', gap: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
