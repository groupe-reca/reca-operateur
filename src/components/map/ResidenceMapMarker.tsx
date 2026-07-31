import { Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii } from '@/config/theme';

import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

type Props = {
  n: number;
  // Active = current residence: green halo + house icon (no number).
  // Sprint 003 fidelity to mock-encours.png only distinguishes active vs.
  // neutral — the future real Map Engine's green/blue/gray rank palette
  // (docs/05-Map-Engine.md) applies once Mapbox lands (Phase 04).
  active?: boolean;
};

export function ResidenceMapMarker({ n, active = false }: Props) {
  if (active) {
    return (
      <View style={styles.haloWrap}>
        <View style={styles.halo} />
        <View style={styles.activeDot}>
          <Icon icon={Home} color={colors.bg} size={20} strokeWidth={2.5} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.neutralDot}>
      <Txt style={styles.neutralText}>{String(n)}</Txt>
    </View>
  );
}

const DOT = 36;
const HALO = 64;

const styles = StyleSheet.create({
  haloWrap: {
    width: HALO,
    height: HALO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: 'rgba(74,222,128,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.4)',
  },
  activeDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutralDot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(21,28,46,0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutralText: {
    fontFamily: fontFamily.extrabold,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
