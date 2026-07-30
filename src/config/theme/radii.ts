// Corner radii. Source: HANDOFF §3 (8/14/18/26 ; FAB = full round).
export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 26,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
