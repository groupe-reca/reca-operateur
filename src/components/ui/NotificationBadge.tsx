import { StyleSheet, View } from 'react-native';

import { colors } from '@/config/theme';

import { Txt } from './Txt';

type Props = {
  count: number;
};

// Small red counter dot. Position it by wrapping in a `position: relative`
// container — this component only renders the absolute-positioned badge
// itself (nothing if count <= 0).
export function NotificationBadge({ count }: Props) {
  if (count <= 0) {
    return null;
  }
  return (
    <View style={styles.badge}>
      <Txt variant="meta" color={colors.textPrimary}>
        {String(count)}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
