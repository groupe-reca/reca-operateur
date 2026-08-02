import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OfficialLogo } from '@/components/brand/OfficialLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { colors, radii, spacing } from '@/config/theme';
import { useAuth } from '@/context/AuthContext';

// Minimal login screen — email/password via Supabase Auth, required for RLS
// on missions/mission_items (auth.uid()). No password reset / sign-up here:
// operator accounts are provisioned by an administrator in RECA App.
export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    }
  }

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg }]}>
      <OfficialLogo width={140} />

      <GlassCard level="panel" radius="lg" style={styles.card}>
        <Txt variant="cardTitle" style={styles.title}>
          Connexion opérateur
        </Txt>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Courriel"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          style={styles.input}
        />

        {error ? (
          <Txt variant="meta" color={colors.danger} style={styles.error}>
            {error}
          </Txt>
        ) : null}

        <PressableScale
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.submit, { opacity: canSubmit ? 1 : 0.5 }]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Txt variant="body" style={styles.submitLabel}>
              Se connecter
            </Txt>
          )}
        </PressableScale>
      </GlassCard>
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
  card: {
    width: '100%',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  error: {
    marginTop: spacing.xs,
  },
  submit: {
    marginTop: spacing.sm,
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
