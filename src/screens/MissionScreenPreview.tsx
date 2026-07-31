import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
  if (!current) {
    return null;
  }

  return (
    <View style={styles.root}>
      <MissionScreen state={current.state} />
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
      <View style={styles.debugBanner}>
        <Txt variant="meta" color={colors.textSecondary}>
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
  switcher: {
    position: 'absolute',
    bottom: 118,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.warning,
    borderRadius: radii.pill,
    padding: spacing.xs,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.pill,
  },
  chipActive: { backgroundColor: colors.warning },
  debugBanner: {
    position: 'absolute',
    bottom: 76,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
  },
});
