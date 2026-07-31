import { Home } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, fontFamily, radii } from '@/config/theme';

import { Icon } from '../ui/Icon';
import { Txt } from '../ui/Txt';

// Rank among the 5 residences shown on the map (1 = active), independent
// from the residence's absolute mission index shown elsewhere (e.g. "3/28"
// in MissionCard/CurrentResidenceProgressCard) — docs/05-Map-Engine.md only
// ever talks about relative rank for marker colour, never the mission index.
export type ResidenceRank = 1 | 2 | 3 | 4 | 5;

type Props = {
  n: number;
  rank: ResidenceRank;
};

const RANK_COLOR: Record<ResidenceRank, string> = {
  1: colors.success,
  2: colors.navigation,
  3: colors.navigation,
  4: colors.textSecondary,
  5: colors.textSecondary,
};

// Colour-by-rank map marker (docs/05-Map-Engine.md "Apparence des
// résidences") : rank 1 (active) = grand marqueur vert + halo + icône
// maison ; 2-3 = bleu ; 4-5 = gris. Only rank 1 gets the halo/house
// treatment ("grand marqueur") — the rest are plain numbered circles.
export function ResidenceMapMarker({ n, rank }: Props) {
  const color = RANK_COLOR[rank];

  if (rank === 1) {
    return (
      <View style={styles.haloWrap}>
        <View style={[styles.halo, { backgroundColor: `${color}30`, borderColor: `${color}66` }]} />
        <View style={[styles.activeDot, { backgroundColor: color }]}>
          <Icon icon={Home} color={colors.bg} size={20} strokeWidth={2.5} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.neutralDot, { borderColor: color }]}>
      <Txt style={[styles.neutralText, { color }]}>{String(n)}</Txt>
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
    borderWidth: 1,
  },
  activeDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutralDot: {
    width: DOT,
    height: DOT,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(21,28,46,0.9)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutralText: {
    fontFamily: fontFamily.extrabold,
    fontSize: 14,
  },
});
