import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfficialLogo } from '@/components/brand/OfficialLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';
import { useAuth } from '@/context/AuthContext';
import type { MissionContextValue } from '@/context/MissionContext';

import packageJson from '../../package.json';

const appVersion: string = packageJson.version;

// Sprint « Paramètres » — docs/11-Roadmap.md écran « Paramètres » : « ne
// contenir que les options utiles ». Seuls les items avec un vrai mécanisme
// derrière sont construits ici — voix (Voice Engine, déjà réel), compte
// (AuthContext, déjà réel), version (package.json), thème (affichage
// honnête, l'app n'a jamais eu de bascule de thème). Volume/carte/
// préférences d'affichage/confidentialité n'ont aucun mécanisme réel dans
// ce repo — délibérément absents plutôt qu'inventés (docs/10).
type Props = {
  ctx: Pick<MissionContextValue, 'voiceEnabled' | 'setVoiceEnabled'>;
  onClose: () => void;
  // `__DEV__` uniquement côté appelant (LiveMissionScreen.tsx) — même
  // barrière d'accès que le Sprint 019, juste un niveau plus loin depuis
  // que le hamburger ouvre cet écran en premier.
  onOpenDevMode?: () => void;
};

export function SettingsScreen({ ctx, onClose, onOpenDevMode }: Props) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
      ]}
    >
      <View style={styles.headerRow}>
        <OfficialLogo width={110} />
        <PressableScale onPress={onClose} style={styles.closeButton}>
          <Txt variant="body" color={colors.textSecondary}>
            Fermer
          </Txt>
        </PressableScale>
      </View>

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Compte</Txt>
        {auth.status === 'signedIn' ? (
          <Txt variant="body" color={colors.textSecondary}>
            {auth.session.user.email}
          </Txt>
        ) : null}
        {auth.status === 'signedIn' ? (
          <PressableScale onPress={() => auth.logout()} style={styles.rowButton}>
            <Txt variant="body" color={colors.danger}>
              Déconnexion
            </Txt>
          </PressableScale>
        ) : null}
      </GlassCard>

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Voix</Txt>
        <View style={styles.row}>
          <Txt variant="body" color={colors.textSecondary}>
            Annonces vocales
          </Txt>
          <Switch
            testID="voice-switch"
            value={ctx.voiceEnabled}
            onValueChange={ctx.setVoiceEnabled}
            trackColor={{ false: colors.border, true: colors.brand }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </GlassCard>

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Thème</Txt>
        <Txt variant="body" color={colors.textSecondary}>
          Sombre
        </Txt>
      </GlassCard>

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle">Version</Txt>
        <Txt variant="body" color={colors.textSecondary}>
          {appVersion}
        </Txt>
      </GlassCard>

      {onOpenDevMode ? (
        <PressableScale onPress={onOpenDevMode} style={styles.devButton}>
          <Txt variant="body" color={colors.textSecondary}>
            Mode développement
          </Txt>
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { gap: spacing.md, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeButton: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  card: { gap: spacing.sm, padding: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowButton: { alignSelf: 'flex-start' },
  devButton: {
    alignSelf: 'center',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
