import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfficialLogo } from '@/components/brand/OfficialLogo';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';
import { useAuth } from '@/context/AuthContext';
import type { MissionContextValue } from '@/context/MissionContext';

// Sprint 017 (partie 2/N) — docs/11-Roadmap.md Écran "Aucune mission" :
// logo officiel, utilisateur, état réseau, message clair, actualisation,
// déconnexion. "Il ne doit pas ressembler à un tableau de bord
// administratif" — pas de liste/tableau ici, juste ce que le spec demande.
type Props = {
  ctx: Pick<MissionContextValue, 'offlineState' | 'refreshAssignment'>;
};

const CONNECTIVITY_LABEL: Record<string, string> = {
  ONLINE: 'En ligne',
  DEGRADED: 'Réseau instable',
  OFFLINE: 'Hors ligne',
  RECOVERING: 'Reconnexion…',
};

export function NoMissionScreen({ ctx }: Props) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await ctx.refreshAssignment();
    setRefreshing(false);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <OfficialLogo width={140} />

      <View style={styles.info}>
        {auth.status === 'signedIn' ? (
          <Txt variant="meta" color={colors.textSecondary}>
            {auth.session.user.email}
          </Txt>
        ) : null}
        <Txt variant="meta" color={colors.textSecondary}>
          {CONNECTIVITY_LABEL[ctx.offlineState.status] ?? ctx.offlineState.status}
        </Txt>
      </View>

      <Txt variant="body" style={styles.message}>
        Aucune mission ne vous est assignée pour le moment.
      </Txt>

      <PressableScale onPress={handleRefresh} disabled={refreshing} style={[styles.button, styles.primaryButton]}>
        {refreshing ? (
          <ActivityIndicator color={colors.textPrimary} />
        ) : (
          <Txt variant="body" style={styles.primaryLabel}>
            Actualiser
          </Txt>
        )}
      </PressableScale>

      {auth.status === 'signedIn' ? (
        <PressableScale onPress={() => auth.logout()} style={styles.button}>
          <Txt variant="body" color={colors.textSecondary}>
            Déconnexion
          </Txt>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  info: { alignItems: 'center', gap: spacing.xs },
  message: { textAlign: 'center' },
  button: {
    width: '100%',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: { backgroundColor: colors.brand },
  primaryLabel: { color: colors.textPrimary, fontWeight: '700' },
});
