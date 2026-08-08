import { View } from 'react-native';
import { Navigation2 } from 'lucide-react-native';

import { colors } from '@/config/theme';

// Fixed on-screen navigation-arrow overlay — replaces the Kubota-style
// tractor illustration (propriétaire, 2026-08-08: "trop bébé"). Standard GPS
// heading-puck iconography (lucide's `Navigation2`, the same arrow shape
// Google Maps/Waze use for the user's own position), coloured with the same
// blue already used for EN ROUTE/the suggested route (`colors.navigation`) so
// it reads as one system. The map moves under it; rotation follows the
// displayed (validated, never raw-GPS) camera heading — same contract as the
// tractor it replaces.
type Props = {
  width?: number;
  headingDeg?: number;
};

export function NavigationArrow({ width = 132, headingDeg = 0 }: Props) {
  return (
    <View style={{ width, height: width, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${headingDeg}deg` }] }}>
      <Navigation2 size={width * 0.6} color={colors.navigation} fill={colors.navigation} strokeWidth={1.5} />
    </View>
  );
}
