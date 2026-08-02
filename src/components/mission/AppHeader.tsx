import { StyleSheet, View } from 'react-native';

import { OfficialLogo } from '../brand/OfficialLogo';

// Minimal brand mark only — menu and notifications duplicated the bottom
// tab bar's "Plus"/"Alertes" tabs, and sync moved into MissionCard next to
// "Détails" (see memory.md, header simplification pass).
export function AppHeader() {
  return (
    <View style={styles.row}>
      <OfficialLogo width={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center' },
});
