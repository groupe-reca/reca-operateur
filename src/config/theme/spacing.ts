// Spacing scale (base 4) + screen margin. Source: HANDOFF §3.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Outer horizontal margin of floating panels against the screen edge.
export const screenMargin = 14;

export type SpacingToken = keyof typeof spacing;
