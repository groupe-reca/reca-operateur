// docs/06-Voice-Engine.md "Événements reçus" — curated subset actually
// producible by the engines that exist in this repo today (State Machine,
// GPS Engine, Offline Engine). Manual repeat included per "Bouton Voix".
export type VoiceInputEvent =
  | { type: 'VOICE_MISSION_STARTED'; missionId: string }
  | { type: 'VOICE_NEXT_RESIDENCE'; missionId: string; missionItemId: string; address: string; alertText?: string }
  | { type: 'VOICE_APPROACHING'; missionId: string; missionItemId: string }
  | { type: 'VOICE_RESIDENCE_STARTED'; missionId: string; missionItemId: string }
  | {
      type: 'VOICE_RESIDENCE_COMPLETED';
      missionId: string;
      missionItemId: string;
      // Present when the next residence activates in the same beat (docs/06
      // "Résidences rapprochées") — grouped into one announcement instead of two.
      nextAddress?: string;
    }
  | { type: 'VOICE_IMPORTANT_ALERT'; missionId: string; missionItemId: string; text: string }
  | { type: 'VOICE_PROBLEM_RECORDED'; missionId: string; missionItemId: string }
  | { type: 'VOICE_GPS_LOST'; missionId: string }
  | { type: 'VOICE_GPS_RECOVERED'; missionId: string }
  | { type: 'VOICE_OFFLINE'; missionId: string }
  | { type: 'VOICE_ONLINE'; missionId: string }
  | { type: 'VOICE_MISSION_COMPLETED'; missionId: string }
  | {
      // docs/06 "Commande vocale manuelle" — caller supplies the current
      // context snapshot; the engine never reads mission state itself
      // (docs/06: "ne choisit jamais la résidence active").
      type: 'VOICE_REPEAT_CURRENT_CONTEXT';
      missionId: string;
      address: string;
      phaseLabel: string;
      phaseSeconds: number;
      alertText?: string;
    };

export type VoicePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

// docs/06 "Structure d'une annonce" — verbatim shape.
export type VoiceAnnouncement = {
  id: string;
  type: VoiceInputEvent['type'];
  priority: VoicePriority;
  missionId?: string;
  missionItemId?: string;
  text: string;
  createdAt: string;
  expiresAt?: string;
  interruptible: boolean;
  deduplicationKey?: string;
  cooldownMs?: number;
  sourceEvent: string;
};

// Injected — never `expo-speech` imported here (docs/02: engines never know
// React/native modules directly). Real implementation:
// src/integrations/voice/expoSpeaker.ts.
export type Speaker = {
  speak(text: string): Promise<void>;
  stop(): void;
  isAvailable(): boolean;
};

// docs/06 "Événements publiés" — the engine never publishes a business
// transition, only technical playback events.
export type VoiceEngineEvent =
  | { type: 'VoiceQueued'; at: string; announcementId: string }
  | { type: 'VoiceStarted'; at: string; announcementId: string }
  | { type: 'VoiceCompleted'; at: string; announcementId: string }
  | { type: 'VoiceInterrupted'; at: string; announcementId: string }
  | { type: 'VoiceSkipped'; at: string; announcementId: string; reason: string }
  | { type: 'VoiceFailed'; at: string; announcementId: string; error: string };

export type VoiceEventListener = (event: VoiceEngineEvent) => void;
