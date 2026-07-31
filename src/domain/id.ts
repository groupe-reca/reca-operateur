import { randomUUID } from 'expo-crypto';

// docs/10-Development-Standards.md "Identifiants" — UUID stables, jamais un
// index de tableau, l'heure seule ou une valeur aléatoire faible.
export function generateId(): string {
  return randomUUID();
}
