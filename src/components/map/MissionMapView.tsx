import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import type { Camera as CameraRef } from '@rnmapbox/maps';

import type { MissionItemState } from '@/domain/status';
import { CAMERA_ANIMATION_DURATION_MS, CAMERA_PITCH, cameraPaddingTopFor, zoomForState } from '@/engines/map/mapCameraConfig';
import { Mapbox } from '@/integrations/mapbox/mapboxClient';
import type { LngLat } from '@/integrations/mapbox/suggestedRoute';

import { ResidenceMarkerLayer, type MapResidence } from './ResidenceMarkerLayer';
import { SuggestedRouteLayer } from './SuggestedRouteLayer';
import { TractorMarker } from './TractorMarker';
import { useSuggestedRoute } from './useSuggestedRoute';

// Standard Mapbox dark style (not a fully custom Studio style — out of
// reach without Studio access; matches the sibling reca-operator app's own
// pragmatic choice for the same problem).
const DARK_STYLE_URL = 'mapbox://styles/mapbox/dark-v11';

export type MapPosition = {
  longitude: number;
  latitude: number;
  heading: number;
};

export type MissionMapViewHandle = {
  recenter: () => void;
};

type Props = {
  position: MapPosition;
  residences: MapResidence[];
  routeWaypoints: LngLat[];
  activeState: MissionItemState;
};

// Phase 04 Map Engine surface: dark map, fixed tractor overlay, camera
// following a (simulated, for now) position, residence markers, suggested
// route. Mirrors docs/05-Map-Engine.md's "Map Engine controls Mapbox
// entirely — panels are not part of it" split: this component owns
// everything Mapbox-related; MissionScreen only passes data in.
export const MissionMapView = forwardRef<MissionMapViewHandle, Props>(function MissionMapView(
  { position, residences, routeWaypoints, activeState },
  ref
) {
  const cameraRef = useRef<CameraRef>(null);
  const zoomLevel = zoomForState(activeState);
  const routeCoordinates = useSuggestedRoute(routeWaypoints);

  const paddingTop = useMemo(() => cameraPaddingTopFor(Dimensions.get('window').height), []);
  const padding = useMemo(
    () => ({ paddingTop, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }),
    [paddingTop]
  );

  useImperativeHandle(ref, () => ({
    recenter: () => {
      cameraRef.current?.setCamera({
        centerCoordinate: [position.longitude, position.latitude],
        heading: position.heading,
        pitch: CAMERA_PITCH,
        zoomLevel,
        padding,
        animationDuration: CAMERA_ANIMATION_DURATION_MS,
      });
    },
  }));

  // Bug found testing on a real device (2026-08-03): `<Mapbox.Camera>`'s
  // declarative props only apply the very first time the map mounts —
  // `@rnmapbox/maps` does not re-animate the camera on its own when
  // `centerCoordinate`/`heading` change on a later render. Without this,
  // the camera stayed frozen at whichever position existed at mount time
  // (the residence's own coordinate, since no GPS fix has arrived yet at
  // first render) and only ever moved when the operator tapped "Recentrer"
  // — the map never actually followed the tractor. docs/02 "Map First":
  // "c'est la carte qui tourne" is a continuous behaviour, not manual-only.
  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: [position.longitude, position.latitude],
      heading: position.heading,
      pitch: CAMERA_PITCH,
      zoomLevel,
      padding,
      animationDuration: CAMERA_ANIMATION_DURATION_MS,
    });
  }, [position.longitude, position.latitude, position.heading, zoomLevel, padding]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFill}
        styleURL={DARK_STYLE_URL}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <Mapbox.Camera
          ref={cameraRef}
          centerCoordinate={[position.longitude, position.latitude]}
          heading={position.heading}
          pitch={CAMERA_PITCH}
          zoomLevel={zoomLevel}
          padding={padding}
          animationDuration={CAMERA_ANIMATION_DURATION_MS}
        />
        <SuggestedRouteLayer coordinates={routeCoordinates} />
        <ResidenceMarkerLayer residences={residences} />
      </Mapbox.MapView>
      <TractorMarker />
    </View>
  );
});
