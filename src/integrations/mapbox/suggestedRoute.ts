// [longitude, latitude] — GeoJSON/Mapbox coordinate order (not [lat, lng]).
export type LngLat = [number, number];

export type SuggestedRouteResult = {
  coordinates: LngLat[];
  isFallback: boolean;
};

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/driving';

// Fetches a driving route through the given waypoints via Mapbox's Directions
// API (docs/05-Map-Engine.md: "le calcul est confié au moteur de routage de
// Mapbox", never a straight line under normal conditions). Falls back to
// straight lines between the same waypoints on any failure — missing token,
// network error, non-OK response, malformed body — this must never throw or
// leave the map without a path. Recompute only on residence-set changes
// (docs/05: "jamais à chaque position GPS") — the caller decides when to
// call this, not this function.
export async function fetchSuggestedRoute(waypoints: LngLat[]): Promise<SuggestedRouteResult> {
  const fallback: SuggestedRouteResult = { coordinates: waypoints, isFallback: true };

  const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  if (!token || waypoints.length < 2) {
    return fallback;
  }

  const coordsParam = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `${DIRECTIONS_BASE}/${coordsParam}?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return fallback;
    }
    const data = (await response.json()) as {
      routes?: { geometry?: { coordinates?: unknown } }[];
    };
    const geometry = data.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(geometry) || geometry.length < 2) {
      return fallback;
    }
    return { coordinates: geometry as LngLat[], isFallback: false };
  } catch {
    return fallback;
  }
}
