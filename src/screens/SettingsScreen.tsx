import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
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
  ctx: Pick<MissionContextValue, 'voiceEnabled' | 'setVoiceEnabled' | 'detectionRadii' | 'setDetectionRadii'>;
  onClose: () => void;
  // `__DEV__` uniquement côté appelant (LiveMissionScreen.tsx) — même
  // barrière d'accès que le Sprint 019, juste un niveau plus loin depuis
  // que le hamburger ouvre cet écran en premier.
  onOpenDevMode?: () => void;
};

export function SettingsScreen({ ctx, onClose, onOpenDevMode }: Props) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();

  // Sprint "Réglages du rayon de détection" — local text state (not derived
  // live from `ctx.detectionRadii` on every keystroke, an operator typing
  // "25" would otherwise get clobbered mid-edit) applied only on
  // "Enregistrer". `ctx.detectionRadii` is already correct by the time this
  // screen can be reached (loading gates every screen before it), so a
  // one-time initializer is enough — no sync effect needed.
  const [approachRadiusText, setApproachRadiusText] = useState(String(ctx.detectionRadii.approachRadiusMeters));
  const [workRadiusText, setWorkRadiusText] = useState(String(ctx.detectionRadii.workRadiusMeters));
  const [radiiError, setRadiiError] = useState<string | null>(null);
  const [radiiSaved, setRadiiSaved] = useState(false);

  function handleSaveRadii() {
    setRadiiSaved(false);
    const approachRadiusMeters = Number(approachRadiusText.replace(',', '.'));
    const workRadiusMeters = Number(workRadiusText.replace(',', '.'));
    if (!Number.isFinite(approachRadiusMeters) || !Number.isFinite(workRadiusMeters)) {
      setRadiiError('Entrez des nombres valides.');
      return;
    }
    const result = ctx.setDetectionRadii({ approachRadiusMeters, workRadiusMeters });
    if (result.success) {
      setRadiiError(null);
      setRadiiSaved(true);
    } else {
      setRadiiError(result.error ?? 'Valeurs invalides.');
    }
  }

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
        <Txt variant="cardTitle">Détection GPS</Txt>
        <View style={styles.row}>
          <Txt variant="body" color={colors.textSecondary}>
            Rayon en approche (m)
          </Txt>
          <TextInput
            testID="approach-radius-input"
            style={styles.radiusInput}
            keyboardType="numeric"
            value={approachRadiusText}
            onChangeText={setApproachRadiusText}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.row}>
          <Txt variant="body" color={colors.textSecondary}>
            Rayon en cours (m)
          </Txt>
          <TextInput
            testID="work-radius-input"
            style={styles.radiusInput}
            keyboardType="numeric"
            value={workRadiusText}
            onChangeText={setWorkRadiusText}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        {radiiError ? (
          <Txt testID="radii-error" variant="body" color={colors.danger}>
            {radiiError}
          </Txt>
        ) : null}
        {radiiSaved && !radiiError ? (
          <Txt testID="radii-saved" variant="body" color={colors.textSecondary}>
            Enregistré.
          </Txt>
        ) : null}
        <PressableScale testID="save-radii-button" onPress={handleSaveRadii} style={styles.rowButton}>
          <Txt variant="body" color={colors.brand}>
            Enregistrer
          </Txt>
        </PressableScale>
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
  radiusInput: {
    minWidth: 64,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  devButton: {
    alignSelf: 'center',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
