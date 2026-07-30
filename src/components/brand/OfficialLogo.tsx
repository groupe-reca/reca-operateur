import LogoSombre from '../../../assets/logo-sombre.svg';

// Official "RÉCA GROUPE" logo (dark-background variant). Never redraw it.
// viewBox 32022×11391 → aspect ratio locked so it never distorts.
const LOGO_RATIO = 32022 / 11391;

export function OfficialLogo({ width = 140 }: { width?: number }) {
  return <LogoSombre width={width} height={width / LOGO_RATIO} />;
}
