import type { Feature, LineString } from 'geojson';

import { colors } from '@/config/theme';
import { Mapbox } from '@/integrations/mapbox/mapboxClient';
import type { LngLat } from '@/integrations/mapbox/suggestedRoute';

type Props = {
  coordinates: LngLat[];
};

// Suggested path only — never real navigation (docs/05: "aucune instruction
// de navigation, aucune flèche, aucune indication de voie"). Two-pass line
// (soft glow + solid core), HANDOFF §1: "16 px @ 22% + 7 px opaque, #3B82F6".
export function SuggestedRouteLayer({ coordinates }: Props) {
  if (coordinates.length < 2) {
    return null;
  }

  const shape: Feature<LineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates },
  };

  return (
    <Mapbox.ShapeSource id="suggested-route" shape={shape}>
      <Mapbox.LineLayer
        id="suggested-route-glow"
        style={{
          lineColor: colors.navigation,
          lineWidth: 16,
          lineOpacity: 0.22,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <Mapbox.LineLayer
        id="suggested-route-core"
        style={{
          lineColor: colors.navigation,
          lineWidth: 7,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    </Mapbox.ShapeSource>
  );
}
