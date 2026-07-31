import { CloudSnow, Crosshair, Footprints, Layers, Minus, Plus, Route, Tractor } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/controls/BottomTabBar';
import { FloatingActionButton } from '@/components/controls/FloatingActionButton';
import { AppHeader } from '@/components/mission/AppHeader';
import { CurrentResidenceProgressCard, type ProgressStep } from '@/components/mission/CurrentResidenceProgressCard';
import { CurrentResidenceSheet } from '@/components/mission/CurrentResidenceSheet';
import { MissionCard } from '@/components/mission/MissionCard';
import { ResidenceTasksCard, type ResidenceTask } from '@/components/mission/ResidenceTasksCard';
import { SimulatedMapBackground } from '@/components/map/SimulatedMapBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { Icon } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/Txt';
import { colors, screenMargin, spacing } from '@/config/theme';

// Sprint 003 — "Écran maître EN COURS" assembled from Sprint 002's components,
// fed by the exact example data from docs/11-Roadmap.md Phase 02 / mock-encours.png.
// Fixed layout (no ScrollView): the map fills the remaining space between a
// pinned header block and a pinned bottom block (docs/01: "aucun écran blanc,
// seulement des panneaux"). Static/simulated data only — no engines yet.
const PROGRESS_STEPS: ProgressStep[] = [
  { kind: 'done', label: 'EN ROUTE' },
  { kind: 'done', label: 'EN APPROCHE' },
  { kind: 'current', n: 3, label: 'EN COURS' },
  { kind: 'upcoming', n: 4, label: 'À venir' },
  { kind: 'upcoming', n: 5, label: 'À venir' },
];

const TASKS: ResidenceTask[] = [
  { icon: Tractor, label: 'Déneigement', status: 'Entrée principale' },
  { icon: Route, label: 'Allée', status: 'Complété' },
  { icon: Footprints, label: 'Trottoir', status: 'Complété' },
];

export function MissionScreen() {
  const insets = useSafeAreaInsets();

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
          missionId="24-01-15"
          secteur="Saint-Jérôme"
          index={3}
          total={28}
          progressPct={10}
          missionSeconds={1112}
          syncState="synced"
          etaLabel="1h 45 min (est.)"
        />
      </View>

      <View style={styles.mapArea}>
        <SimulatedMapBackground />

        <View
          style={[styles.leftColumn, { left: insets.left + screenMargin, top: spacing.lg }]}
        >
          <CurrentResidenceProgressCard stateLabel="EN COURS" address="224 rue Scott" steps={PROGRESS_STEPS} onProblem={() => {}} />
          <FloatingActionButton icon={Crosshair} label="Recentrer" onPress={() => {}} />
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
            <FloatingActionButton icon={Crosshair} size={44} onPress={() => {}} accessibilityLabel="Recentrer" />
            <FloatingActionButton icon={Layers} size={44} onPress={() => {}} accessibilityLabel="Couches" />
            <FloatingActionButton icon={Plus} size={44} onPress={() => {}} accessibilityLabel="Zoom avant" />
            <FloatingActionButton icon={Minus} size={44} onPress={() => {}} accessibilityLabel="Zoom arrière" />
          </View>
          <ResidenceTasksCard stateLabel="EN COURS" tasks={TASKS} estimatedTime="12:00" />
        </View>
      </View>

      <View style={[styles.bottomSection, { paddingLeft: insets.left + screenMargin, paddingRight: insets.right + screenMargin }]}>
        <CurrentResidenceSheet address="224 rue Scott" distanceLabel="1,2 km" etaLabel="3 min" />
        <View style={{ paddingBottom: insets.bottom }}>
          <BottomTabBar active="carte" alertsCount={2} voiceActive onVoicePress={() => {}} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topSection: { gap: spacing.md, paddingBottom: spacing.md },
  mapArea: { flex: 1 },
  leftColumn: { position: 'absolute', gap: spacing.md, width: 220 },
  rightColumn: { position: 'absolute', alignItems: 'flex-end', gap: spacing.md },
  mapControls: { gap: spacing.sm },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  bottomSection: { gap: spacing.sm },
});
