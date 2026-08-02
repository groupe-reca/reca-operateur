import * as Speech from 'expo-speech';

import type { Speaker } from '@/engines/voice';

// Single point of contact for `expo-speech` — no component/engine imports it
// directly (docs/02). docs/06 "Synthèse vocale": prefer French Canadian,
// then generic French, then any French voice, else let the OS default voice
// speak — never invent a voice, and never block on this lookup forever (a
// single async probe at creation, cached).
async function pickPreferredVoice(): Promise<string | undefined> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const byLanguagePrefix = (prefix: string) =>
      voices.find((voice) => voice.language?.toLowerCase().startsWith(prefix));
    return (
      byLanguagePrefix('fr-ca')?.identifier ?? byLanguagePrefix('fr-fr')?.identifier ?? byLanguagePrefix('fr')?.identifier
    );
  } catch {
    return undefined;
  }
}

// docs/06 "Erreurs": a synthesis failure must never block the mission —
// `speak()` rejects, the Voice Engine logs it (VoiceFailed) and moves on to
// the next queued announcement, it never throws further up.
export function createExpoSpeaker(): Speaker {
  let available = true;
  const preferredVoice = pickPreferredVoice();

  return {
    isAvailable: () => available,
    speak(text: string): Promise<void> {
      return preferredVoice.then(
        (voice) =>
          new Promise<void>((resolve, reject) => {
            Speech.speak(text, {
              language: 'fr-CA',
              voice,
              onDone: () => resolve(),
              onStopped: () => resolve(),
              onError: (error: Error) => {
                available = false;
                reject(error);
              },
            });
          })
      );
    },
    stop(): void {
      Speech.stop();
    },
  };
}
