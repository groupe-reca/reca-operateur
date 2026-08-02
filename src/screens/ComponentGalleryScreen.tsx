import { Accessibility, Crosshair, DoorClosed, Layers, Minus, Plus, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OfficialLogo } from '@/components/brand/OfficialLogo';
import { Wordmark } from '@/components/brand/Wordmark';
import { BottomSheet } from '@/components/controls/BottomSheet';
import { FloatingActionButton } from '@/components/controls/FloatingActionButton';
import { ProblemButton } from '@/components/controls/ProblemButton';
import { VoiceButton } from '@/components/controls/VoiceButton';
import { AlertCard } from '@/components/mission/AlertCard';
import { AppHeader } from '@/components/mission/AppHeader';
import { CurrentResidenceSheet } from '@/components/mission/CurrentResidenceSheet';
import { FixedTractor } from '@/components/mission/FixedTractor';
import { MissionCard } from '@/components/mission/MissionCard';
import { MissionCardCompact } from '@/components/mission/MissionCardCompact';
import { OfflineIndicator } from '@/components/mission/OfflineIndicator';
import { PhaseTimer } from '@/components/mission/PhaseTimer';
import { SyncIndicator } from '@/components/mission/SyncIndicator';
import { SystemStatus } from '@/components/mission/SystemStatus';
import { UpcomingResidenceRow } from '@/components/mission/UpcomingResidenceRow';
import { Txt } from '@/components/ui/Txt';
import { colors, screenMargin, spacing } from '@/config/theme';

// Sprint 002 preview: every priority component with mock data, to compare on
// device against mock-encours.png. Not a product screen.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Txt variant="labelCaps" color={colors.textSecondary}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

export function ComponentGalleryScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="En-tête">
        <AppHeader />
      </Section>

      <Section title="Carte mission">
        <MissionCard
          missionId="24-01-15"
          secteur="Saint-Jérôme"
          index={3}
          total={28}
          progressPct={10}
          missionSeconds={1112}
          syncState="synced"
          etaLabel="1h 45 min (est.)"
          onDetails={() => {}}
        />
        <MissionCardCompact missionId="24-01-15" index={3} total={28} progressPct={10} />
      </Section>

      <Section title="Chronomètre de phase">
        <View style={styles.timers}>
          <PhaseTimer label="En route" seconds={277} color={colors.navigation} />
          <PhaseTimer label="En approche" seconds={8} color={colors.warning} />
          <PhaseTimer label="En cours" seconds={221} color={colors.success} />
        </View>
      </Section>

      <Section title="Alertes">
        <AlertCard level="warning" icon={TriangleAlert} text="Plate-bande au fond" />
        <AlertCard level="danger" icon={DoorClosed} text="Ne pas bloquer la porte de garage" />
        <AlertCard level="info" icon={Accessibility} text="Client à mobilité réduite" />
      </Section>

      <Section title="Statut système">
        <SystemStatus gpsAccuracy={4} network="online" pendingChanges={2} />
        <View style={styles.rowWrap}>
          <SyncIndicator state="synced" />
          <SyncIndicator state="syncing" />
          <SyncIndicator state="pending" />
          <OfflineIndicator pendingChanges={3} />
        </View>
      </Section>

      <Section title="Résidence actuelle">
        <CurrentResidenceSheet address="224 rue Scott" distanceLabel="1,2 km" etaLabel="3 min" />
      </Section>

      <Section title="Prochaines résidences">
        <View style={styles.list}>
          <UpcomingResidenceRow n={3} state="IN_PROGRESS" address="224 rue Scott" distanceLabel="0 m" />
          <UpcomingResidenceRow n={4} state="EN_ROUTE" address="230 rue Scott" distanceLabel="180 m" />
          <UpcomingResidenceRow n={5} state="WAITING" address="12 rue Saint-Georges" distanceLabel="340 m" />
          <UpcomingResidenceRow n={2} state="PROBLEM" address="218 rue Scott" />
          <UpcomingResidenceRow n={1} state="COMPLETED" address="210 rue Scott" />
        </View>
      </Section>

      <Section title="Contrôles">
        <View style={styles.rowWrap}>
          <FloatingActionButton icon={Crosshair} label="Recentrer" />
          <FloatingActionButton icon={Layers} label="Couches" />
          <FloatingActionButton icon={Plus} />
          <FloatingActionButton icon={Minus} />
        </View>
        <ProblemButton onPress={() => {}} />
        <View style={styles.rowWrap}>
          <VoiceButton active onPress={() => {}} />
          <VoiceButton active={false} onPress={() => {}} label="Coupé" />
        </View>
      </Section>

      <Section title="Tracteur fixe">
        <View style={styles.center}>
          <FixedTractor width={132} />
        </View>
      </Section>

      <Section title="Marque">
        <View style={styles.center}>
          <OfficialLogo width={180} />
          <Wordmark size={18} />
        </View>
      </Section>

      <Section title="Bottom sheet (25 %)">
        <BottomSheet snap={25}>
          <Txt variant="body" color={colors.textSecondary}>
            Coquille de panneau — gestes ajoutés à l&apos;assemblage (Sprint 003).
          </Txt>
        </BottomSheet>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingTop: 56,
    paddingHorizontal: screenMargin,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: { gap: spacing.md },
  timers: { flexDirection: 'row', gap: spacing.xl, flexWrap: 'wrap' },
  rowWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flexWrap: 'wrap' },
  list: { gap: spacing.xs },
  center: { alignItems: 'center', gap: spacing.sm },
});
