import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';
import { useMissionContext } from '@/context/MissionContext';

import { MissionScreen } from './MissionScreen';
import { APPROACHING_MOCK, EN_ROUTE_MOCK, IN_PROGRESS_MOCK, PROBLEM_MOCK } from './missionScreenMocks';
import type { MissionScreenState } from './missionScreenState';

const VARIANTS: { key: string; label: string; state: MissionScreenState }[] = [
  { key: 'en_route', label: 'En route', state: EN_ROUTE_MOCK },
  { key: 'approaching', label: 'En approche', state: APPROACHING_MOCK },
  { key: 'in_progress', label: 'En cours', state: IN_PROGRESS_MOCK },
  { key: 'problem', label: 'Problème', state: PROBLEM_MOCK },
];

// Sprint 004 dev-only preview harness — same status as Sprint 002's
// ComponentGalleryScreen (never a product screen, never shipped as the real
// entry point). Lets the 4 operational variants be compared on-device
// without a real State Machine yet. The dashed/amber switcher is a visible
// reminder it's temporary; MissionScreen itself stays "pure" (data-driven,
// no technical control baked in — HANDOFF's "aucun bouton technique" rule).
// Swapped back to a single MissionScreen fed by the real engine once the
// State Machine exists (Sprint 009-010), mirroring the Gallery→MissionScreen
// swap already done between Sprint 002 and Sprint 003.
export function MissionScreenPreview() {
  const [selected, setSelected] = useState(0);
  const current = VARIANTS[selected] ?? VARIANTS[0];
  const { loading, session, mission, activeMissionItem, nextMissionItems } = useMissionContext();
  const itemCount = nextMissionItems.length + (activeMissionItem ? 1 : 0);
  const insets = useSafeAreaInsets();
  if (!current) {
    return null;
  }

  return (
    <View style={styles.root}>
      <View style={styles.screen}>
        <MissionScreen state={current.state} />
      </View>
      {/* Dev-only toolbar as an absolute overlay on top of MissionScreen
          (previously a real flex row pushing the screen down — see
          memory.md). It's fine for it to cover the logo during dev: this
          harness never ships, and reclaiming that flow height matters more
          for calibrating the real screen. top: insets.top keeps it clear of
          the status bar only (no bottom-offset guesswork this time, so no
          risk of the earlier bottom-UI collision). */}
      <View style={[styles.devToolbar, { top: insets.top }]}>
        <View style={styles.switcher}>
          {VARIANTS.map((variant, index) => (
            <PressableScale
              key={variant.key}
              onPress={() => setSelected(index)}
              style={[styles.chip, index === selected ? styles.chipActive : null]}
              accessibilityRole="button"
              accessibilityLabel={`Aperçu ${variant.label}`}
            >
              <Txt variant="meta" color={index === selected ? colors.bg : colors.textPrimary}>
                {variant.label}
              </Txt>
            </PressableScale>
          ))}
        </View>
        {/* Sprint 007-008 proof of persistence — dev-only, additive, does not
            feed MissionScreen itself (see memory.md scope decision). */}
        <Txt variant="meta" color={colors.textSecondary} numberOfLines={1}>
          {loading
            ? 'SQLite : chargement…'
            : `SQLite : session ${session ? formatTime(session.openedAt) : '—'} · ${mission ? '1 mission' : '0 mission'} · ${itemCount} résidences`}
        </Txt>
      </View>
    </View>
  );
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  devToolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  screen: { flex: 1 },
  switcher: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
  },
  chipActive: { backgroundColor: colors.warning },
});
