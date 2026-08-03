import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useMissionContext } from '@/context/MissionContext';
import { colors, spacing } from '@/config/theme';

import { deriveEndOfMissionState } from './deriveEndOfMissionState';
import { deriveMissionScreenState } from './deriveMissionScreenState';
import { DevScreen } from './DevScreen';
import { EndOfMissionScreen } from './EndOfMissionScreen';
import { MissionScreen } from './MissionScreen';
import { NoMissionScreen } from './NoMissionScreen';
import { Txt } from '../components/ui/Txt';

// Sprint 017 (partie 1/N) — the real entry point promised since Sprint 004
// ("reswitché vers un MissionScreen unique piloté par le vrai State Machine
// une fois qu'il existera"). Replaces MissionScreenPreview as what App.tsx
// renders; the preview/mocks stay in the repo for reference (same status as
// ComponentGalleryScreen).
export function LiveMissionScreen() {
  const ctx = useMissionContext();
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  const [devScreenOpen, setDevScreenOpen] = useState(false);

  // Deliberately not a live ticker (see deriveMissionScreenState.ts) —
  // re-derived only when the underlying mission data actually changes, not
  // every render. Depends on the individual fields, not `ctx` itself (a new
  // object every MissionProvider render regardless of real changes).
  const screenState = useMemo(
    () => deriveMissionScreenState(ctx, new Date()),
    [ctx.mission, ctx.activeMissionItem, ctx.allMissionItems, ctx.synchronizationState, ctx.offlineState] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const endOfMissionState = useMemo(
    () => deriveEndOfMissionState(ctx, new Date()),
    [ctx.mission, ctx.allMissionItems, ctx.synchronizationState] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const problemItem = ctx.allMissionItems.find((item) => item.status === 'PROBLEM') ?? null;
  const targetItemId = problemItem?.id ?? ctx.activeMissionItem?.id ?? null;

  async function handleCloseMission() {
    setClosing(true);
    setCloseError(null);
    const result = await ctx.closeMission();
    setClosing(false);
    if (result.success) {
      setClosed(true);
    } else {
      setCloseError(result.errorMessage ?? 'La fermeture de la mission a échoué.');
    }
  }

  if (ctx.loading) {
    return (
      <View style={styles.fallback}>
        <Txt variant="body" color={colors.textSecondary}>
          Chargement de la mission…
        </Txt>
      </View>
    );
  }

  // Sprint 019 — docs/11 "Développement" écran : gated by `__DEV__` (false
  // in a release build) rather than an invented user role — see
  // MissionScreen.tsx's `onMenu` prop, the only real caller of
  // `setDevScreenOpen(true)`.
  if (__DEV__ && devScreenOpen) {
    return <DevScreen ctx={ctx} onClose={() => setDevScreenOpen(false)} />;
  }

  // Sprint 018 — no residence left to work on: show the real "Fin de
  // mission" screen when the mission is eligible to close (see
  // deriveEndOfMissionState.ts), not the generic fallback below.
  if (endOfMissionState) {
    return (
      <EndOfMissionScreen
        state={endOfMissionState}
        onClose={handleCloseMission}
        closing={closing}
        closed={closed}
        closeError={closeError}
      />
    );
  }

  // Sprint 017 (partie 2/N) — docs/11 "Aucune mission" : no mission at all,
  // or the current one is already COMPLETED (closeMission just succeeded,
  // or a stale session). deriveEndOfMissionState.ts already excludes
  // COMPLETED from its own eligibility, so this never fights with
  // EndOfMissionScreen above for the same state.
  if (!ctx.mission || ctx.mission.status === 'COMPLETED') {
    return <NoMissionScreen ctx={ctx} />;
  }

  // No active/problem residence and mission not closed/absent (edge case:
  // a loaded mission with zero MissionItems) — minimal honest fallback,
  // not a dedicated screen (nothing in docs/11 describes this specific
  // combination).
  if (!screenState || !targetItemId) {
    return (
      <View style={styles.fallback}>
        <Txt variant="body" color={colors.textSecondary}>
          Aucune résidence active pour le moment.
        </Txt>
      </View>
    );
  }

  return (
    <MissionScreen
      state={screenState}
      onResolveProblem={() => {
        ctx.resolveProblem(targetItemId, 'EN_ROUTE');
      }}
      onSkipItem={() => {
        ctx.skipItem(targetItemId);
      }}
      // "Signaler" reste sans effet réel cette passe : aucune UI n'existe
      // encore pour choisir un type de problème, et `problemCode` n'a aucune
      // taxonomie documentée (docs/03/docs/09/docs/07) — en inventer une ici
      // serait une règle métier non validée. Suivi ouvert, pas un oubli.
      onMenu={__DEV__ ? () => setDevScreenOpen(true) : undefined}
    />
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: spacing.lg },
});
