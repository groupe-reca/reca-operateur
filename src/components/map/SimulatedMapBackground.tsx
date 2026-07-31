import { StyleSheet, View } from 'react-native';

import { FixedTractor } from '../mission/FixedTractor';
import { ResidenceMapMarker } from './ResidenceMapMarker';
import MapNightSvg from '../../../assets/map-night.svg';

// Sprint 003 static placeholder for the Map Engine (docs/05-Map-Engine.md).
// map-night.svg already bakes in the street grid + the suggested blue route
// (path M400,1000 V580 H250 V260 H550 V100, viewBox 800×1000) — this
// component only overlays residence markers + the fixed tractor along it.
// Replaced entirely by real Mapbox rendering in Phase 04 (Sprint 005-006).

// Marker positions as a fraction (0..1) of the 800×1000 viewBox, hand-picked
// along the baked-in route path (not computed — this is mock data, not
// geometry). Bottom → top: 1 (near the tractor) up to 5.
const MARKERS: { n: number; x: number; y: number; active?: boolean }[] = [
  { n: 1, x: 0.5, y: 0.92 },
  { n: 2, x: 0.5, y: 0.74 },
  { n: 3, x: 0.40625, y: 0.58, active: true },
  { n: 4, x: 0.3125, y: 0.4 },
  { n: 5, x: 0.6, y: 0.26 },
];

const TRACTOR_POSITION = { x: 0.5, y: 0.98 };

export function SimulatedMapBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Stretched to fill exactly (stylised map, not a photo — no visible
          distortion) so percentage-based marker positions always line up. */}
      <MapNightSvg width="100%" height="100%" preserveAspectRatio="none" />

      {MARKERS.map((marker) => (
        <View
          key={marker.n}
          style={[
            styles.markerAnchor,
            {
              left: `${marker.x * 100}%`,
              top: `${marker.y * 100}%`,
              marginLeft: marker.active ? -32 : -18,
              marginTop: marker.active ? -32 : -18,
            },
          ]}
        >
          <ResidenceMapMarker n={marker.n} active={marker.active} />
        </View>
      ))}

      <View
        style={[
          styles.markerAnchor,
          {
            left: `${TRACTOR_POSITION.x * 100}%`,
            top: `${TRACTOR_POSITION.y * 100}%`,
            marginLeft: -66,
            marginTop: -66,
          },
        ]}
      >
        <FixedTractor width={132} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerAnchor: { position: 'absolute' },
});
