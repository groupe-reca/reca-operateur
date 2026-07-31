import { Mapbox } from '@/integrations/mapbox/mapboxClient';

import type { LngLat } from '@/integrations/mapbox/suggestedRoute';

import { ResidenceMapMarker, type ResidenceRank } from './ResidenceMapMarker';

export type MapResidence = {
  n: number;
  rank: ResidenceRank;
  coordinate: LngLat;
};

type Props = {
  residences: MapResidence[];
};

// docs/05-Map-Engine.md: "le Map Engine affiche uniquement la résidence
// active et les quatre suivantes" — the caller is responsible for only ever
// passing those 5 (this component does not filter). Billboard markers
// (PointAnnotation always faces the screen, matches HANDOFF §1 "jamais
// inclinés").
export function ResidenceMarkerLayer({ residences }: Props) {
  return (
    <>
      {residences.map((residence) => (
        <Mapbox.PointAnnotation
          key={`residence-${residence.n}`}
          id={`residence-${residence.n}`}
          coordinate={residence.coordinate}
        >
          <ResidenceMapMarker n={residence.n} rank={residence.rank} />
        </Mapbox.PointAnnotation>
      ))}
    </>
  );
}
