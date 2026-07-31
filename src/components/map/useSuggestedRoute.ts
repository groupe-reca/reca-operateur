import { useEffect, useState } from 'react';

import { fetchSuggestedRoute, type LngLat } from '@/integrations/mapbox/suggestedRoute';

type Resolved = { forWaypoints: LngLat[]; coordinates: LngLat[] };

// Straight-line fallback is computed at RENDER time (not via setState in the
// effect — react-hooks/set-state-in-effect) until the Directions API
// resolves for these exact waypoints, then upgraded. Mirrors the pattern
// already validated on the sibling reca-operator app for the same problem.
// Recomputes when the waypoint array reference changes; today that only
// happens on mock/state swaps — a real residence-set-change key (docs/05:
// "jamais à chaque position GPS") is a Sprint 011+ concern once a live feed
// exists.
export function useSuggestedRoute(waypoints: LngLat[]): LngLat[] {
  const [resolved, setResolved] = useState<Resolved | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSuggestedRoute(waypoints).then((result) => {
      if (!cancelled) {
        setResolved({ forWaypoints: waypoints, coordinates: result.coordinates });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [waypoints]);

  if (resolved && resolved.forWaypoints === waypoints) {
    return resolved.coordinates;
  }
  return waypoints;
}
