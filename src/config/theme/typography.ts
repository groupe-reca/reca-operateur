// Type scale — Manrope. Source: HANDOFF §3.
import type { TextStyle } from 'react-native';

import { fontFamily } from './fonts';

export const typography = {
  // Big phase chronometer — tabular figures so digits don't jitter.
  timer: {
    fontFamily: fontFamily.extrabold,
    fontSize: 44,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  // Residence address — must read instantly.
  address: { fontFamily: fontFamily.extrabold, fontSize: 27 },
  cardTitle: { fontFamily: fontFamily.extrabold, fontSize: 15 },
  // Uppercase section labels (e.g. "MISSION ACTIVE", "EN COURS").
  labelCaps: {
    fontFamily: fontFamily.extrabold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  body: { fontFamily: fontFamily.semibold, fontSize: 13 },
  meta: { fontFamily: fontFamily.semibold, fontSize: 11 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
