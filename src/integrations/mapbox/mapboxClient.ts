import Mapbox from '@rnmapbox/maps';

// Single point of contact for the Mapbox native module's global config —
// components import map components from src/components/map/, never
// `@rnmapbox/maps` directly (docs/02: "les composants ne connaissent jamais
// Mapbox directement"). Importing this module (side effect only) sets the
// public runtime token once at app startup.
//
// Missing token = the map silently fails to load tiles (Mapbox's own native
// placeholder), never a crash — no console logging here (no logging engine
// exists yet in this repo; see docs/10 "Journalisation").
const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
if (token) {
  Mapbox.setAccessToken(token);
}

export { Mapbox };
