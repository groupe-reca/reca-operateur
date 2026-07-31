import { CloudSnow, Crosshair, Layers, Minus, Plus } from 'lucide-react-native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/controls/BottomTabBar';
import { FloatingActionButton } from '@/components/controls/FloatingActionButton';
import { AlertCard } from '@/components/mission/AlertCard';
import { AppHeader } from '@/components/mission/AppHeader';
import { CurrentResidenceProgressCard } from '@/components/mission/CurrentResidenceProgressCard';
import { CurrentResidenceSheet } from '@/components/mission/CurrentResidenceSheet';
import { MissionCard } from '@/components/mission/MissionCard';
import { OfflineIndicator } from '@/components/mission/OfflineIndicator';
import { ProblemStateCard } from '@/components/mission/ProblemStateCard';
import { ResidenceTasksCard } from '@/components/mission/ResidenceTasksCard';
import { MissionMapView, type MissionMapViewHandle } from '@/components/map/MissionMapView';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Txt } from '@/components/ui/Txt';
import { colors, screenMargin, spacing } from '@/config/theme';

import type { MissionScreenState } from './missionScreenState';

// Sprint 003/004/005-006 — "Écran maître" assembled from Sprint 002's
// components, data-driven by a single MissionScreenState (Phase 03: the 4
// operational variants are just different mock objects rendered by this
// exact screen — "même structure de composants", docs/11-Roadmap.md). Fixed
// layout (no ScrollView): the map fills the remaining space between a
// pinned header block and a pinned bottom block (docs/01: "aucun écran
// blanc, seulement des panneaux"). Position/route are still simulated
// (Phase 04 Roadmap: "ne pas connecter immédiatement le GPS réel").
type Props = {
  state: MissionScreenState;
};

export function MissionScreen({ state }: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MissionMapViewHandle>(null);
  const handleRecenter = () => mapRef.current?.recenter();

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.topSection,
          { paddingTop: insets.top + spacing.sm, paddingLeft: insets.left + screenMargin, paddingRight: insets.right + screenMargin },
        ]}
      >
        <AppHeader notifications={2} />
        <MissionCard
          missionId={state.mission.missionId}
          secteur={state.mission.secteur}
          index={state.mission.index}
          total={state.mission.total}
          progressPct={state.mission.progressPct}
          missionSeconds={state.mission.missionSeconds}
          syncState={state.mission.syncState}
          etaLabel={state.mission.totalEtaLabel}
        />
        {state.offline ? <OfflineIndicator pendingChanges={state.offline.pendingOperations} /> : null}
        <AlertsRow alerts={state.alerts} />
      </View>

      <View style={styles.mapArea}>
        <MissionMapView
          ref={mapRef}
          position={state.map.position}
          residences={state.map.residences}
          routeWaypoints={state.map.routeWaypoints}
          activeState={state.activeState}
        />

        <View style={[styles.leftColumn, { left: insets.left + screenMargin, top: spacing.lg }]}>
          {state.activeState === 'PROBLEM' && state.problem ? (
            <ProblemStateCard
              address={state.address}
              problemType={state.problem.type}
              note={state.problem.note}
              frozenSeconds={state.problem.frozenSeconds}
              onNext={() => {}}
              onResumeLater={() => {}}
            />
          ) : (
            <CurrentResidenceProgressCard
              stateLabel={state.stateLabel}
              timerSeconds={state.timerSeconds}
              color={state.color}
              address={state.address}
              steps={state.progressSteps ?? []}
              onProblem={() => {}}
            />
          )}
          <FloatingActionButton icon={Crosshair} label="Recentrer" onPress={handleRecenter} />
          <GlassCard level="chip" radius="lg" style={styles.weatherPill}>
            <Icon icon={CloudSnow} color={colors.textSecondary} size={20} />
            <View>
              <Txt variant="cardTitle">-8°C</Txt>
              <Txt variant="meta" color={colors.textSecondary}>
                Neige modérée
              </Txt>
            </View>
          </GlassCard>
        </View>

        <View style={[styles.rightColumn, { right: insets.right + screenMargin, top: spacing.lg }]}>
          <View style={styles.mapControls}>
            <FloatingActionButton icon={Crosshair} size={44} onPress={handleRecenter} accessibilityLabel="Recentrer" />
            <FloatingActionButton icon={Layers} size={44} onPress={() => {}} accessibilityLabel="Couches" />
            <FloatingActionButton icon={Plus} size={44} onPress={() => {}} accessibilityLabel="Zoom avant" />
            <FloatingActionButton icon={Minus} size={44} onPress={() => {}} accessibilityLabel="Zoom arrière" />
          </View>
          {state.tasks ? (
            <ResidenceTasksCard stateLabel={state.stateLabel} tasks={state.tasks} estimatedTime={state.estimatedTaskTime ?? ''} />
          ) : null}
        </View>
      </View>

      <View style={[styles.bottomSection, { paddingLeft: insets.left + screenMargin, paddingRight: insets.right + screenMargin }]}>
        <CurrentResidenceSheet
          address={state.address}
          distanceLabel={state.residenceDistanceLabel}
          etaLabel={state.residenceEtaLabel}
        />
        <View style={{ paddingBottom: insets.bottom }}>
          <BottomTabBar active="carte" alertsCount={2} voiceActive onVoicePress={() => {}} />
        </View>
      </View>
    </View>
  );
}

// HANDOFF §5: 1 alert shown in full + a "+N instructions" chip for the rest —
// never a stack of N full cards.
function AlertsRow({ alerts }: { alerts: MissionScreenState['alerts'] }) {
  if (alerts.length === 0) {
    return null;
  }
  const [primary, ...rest] = alerts;
  if (!primary) {
    return null;
  }
  return (
    <View style={styles.alertsRow}>
      <AlertCard level={primary.level} icon={primary.icon} text={primary.text} />
      {rest.length > 0 ? (
        <Pill>
          <Txt variant="meta" color={colors.textSecondary}>{`+${rest.length} instructions`}</Txt>
        </Pill>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topSection: { gap: spacing.md, paddingBottom: spacing.md },
  alertsRow: { gap: spacing.sm },
  mapArea: { flex: 1 },
  leftColumn: { position: 'absolute', gap: spacing.md, width: 220 },
  rightColumn: { position: 'absolute', alignItems: 'flex-end', gap: spacing.md },
  mapControls: { gap: spacing.sm },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  bottomSection: { gap: spacing.sm },
});
