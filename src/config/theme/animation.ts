// Animation durations (ms) + easing. Source: HANDOFF §3.
// Only informative motion is allowed — no bounce, no decorative zoom (docs/01).
export const animation = {
  fade: 200,
  slide: 260,
  sheet: 300,
  press: 90,
  halo: 2400, // active-residence halo pulse
  // cubic-bezier(.2,.8,.2,1)
  easing: [0.2, 0.8, 0.2, 1] as const,
} as const;
