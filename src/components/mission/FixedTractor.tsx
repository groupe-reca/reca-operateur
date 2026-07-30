import { Image } from 'react-native';

// Fixed on-screen tractor overlay (top-view, blade + blower). The map moves
// under it; rotation follows the displayed camera heading. Official asset.
const tractor = require('../../../assets/tractor.png');

type Props = {
  width?: number;
  headingDeg?: number;
};

export function FixedTractor({ width = 132, headingDeg = 0 }: Props) {
  return (
    <Image
      source={tractor}
      resizeMode="contain"
      style={{ width, height: width, transform: [{ rotate: `${headingDeg}deg` }] }}
    />
  );
}
