import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Sprint 001 placeholder screen. The real Mission Screen (map-first architecture)
// is built from Sprint 002 onward — see docs/11-Roadmap.md. UI text is French;
// "OPÉRATEUR" is a text sub-brand (Manrope 800), never a redrawn logo.
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.brand}>RÉCA</Text>
      <Text style={styles.sub}>OPÉRATEUR</Text>
      <Text style={styles.hint}>Sprint 001 — Initialisation</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1020',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sub: {
    color: '#E63947',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2.6,
  },
  hint: {
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
