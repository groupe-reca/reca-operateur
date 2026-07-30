// Design tokens — colours. Source of truth: HANDOFF §3 (Fable mock section D).
// Do not hard-code colours in components; import from here.
export const colors = {
  bg: '#0B1020', // full-screen background (under the map)
  panel: '#151C2E', // opaque panel surface
  brand: '#E63947', // identity red — logo, "OPÉRATEUR", MISSION ACTIVE label
  danger: '#EF4444', // functional red — problem state / problem button
  navigation: '#3B82F6', // RECA blue — EN ROUTE, suggested route
  success: '#4ADE80', // green — EN COURS / completed
  warning: '#F59E0B', // amber — EN APPROCHE / offline pill
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  border: 'rgba(255,255,255,0.08)',
} as const;

export type ColorToken = keyof typeof colors;
