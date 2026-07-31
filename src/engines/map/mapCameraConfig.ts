import type { MissionItemState } from '@/domain/status';

// Camera constants (docs/05-Map-Engine.md + HANDOFF §1). Kept out of
// components — the Map Engine owns these numbers, UI never hardcodes them.
export const CAMERA_PITCH = 52; // HANDOFF: 50–55°
export const CAMERA_ANIMATION_DURATION_MS = 600; // HANDOFF: cap rotation ~600ms

// 3-tier automatic zoom by active state (docs/05: EN ROUTE = vue large,
// EN APPROCHE = vue moyenne, EN COURS = zoom rapproché).
export const ZOOM_WIDE = 15;
export const ZOOM_MEDIUM = 16.5;
export const ZOOM_CLOSE = 17.5;

// Accepts the full domain MissionItemState (not just the 4 map-screen
// variants) so this stays a leaf module engines/screens can both depend on
// without screens→engines→screens cycles — see docs/02 dependency rules.
export function zoomForState(state: MissionItemState): number {
  switch (state) {
    case 'EN_ROUTE':
      return ZOOM_WIDE;
    case 'APPROACHING':
      return ZOOM_MEDIUM;
    case 'IN_PROGRESS':
    case 'PROBLEM':
      // docs/05 only defines the 3 EN_ROUTE/APPROACHING/EN_COURS tiers;
      // PROBLEM has no rule of its own — defaults to "close" since a problem
      // is almost always reported at or near the residence.
      return ZOOM_CLOSE;
    default:
      return ZOOM_WIDE;
  }
}

// Screen anchor of the fixed tractor overlay, as a fraction of the map
// container's height from the TOP. HANDOFF §1 gives "24% du bas de la zone
// carte" (= 0.76 from the top); docs/05-Map-Engine.md separately says
// "environ 60% de la hauteur" — the two disagree numerically. HANDOFF is
// followed here (written specifically for this integration, more precise);
// the divergence is recorded in memory.md rather than silently resolved.
export const TRACTOR_ANCHOR_FRACTION_FROM_TOP = 0.76;

// Derives the Camera's `paddingTop` (in points) needed so that, with
// paddingBottom = 0, the geographic centre visually lands at
// TRACTOR_ANCHOR_FRACTION_FROM_TOP instead of the middle of the screen.
// With an effective visible height of (H - paddingTop), the padded centre
// sits at (paddingTop + H) / 2 from the top; solving for that to equal
// anchor * H gives paddingTop = (2 * anchor - 1) * H.
export function cameraPaddingTopFor(containerHeight: number): number {
  const raw = (2 * TRACTOR_ANCHOR_FRACTION_FROM_TOP - 1) * containerHeight;
  return Math.max(0, Math.round(raw));
}
