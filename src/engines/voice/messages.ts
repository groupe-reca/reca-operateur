import { normalizeAddressForSpeech } from './textFormatting';
import type { VoiceAnnouncement, VoiceInputEvent, VoicePriority } from './types';

// docs/06 "Structure d'une annonce" minus the fields the engine itself owns
// (id/createdAt) — messages.ts only decides text/priority/dedup/expiry.
export type DraftAnnouncement = Omit<VoiceAnnouncement, 'id' | 'createdAt'>;

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

// Number-to-words is deliberately out of scope (see textFormatting.ts) — the
// digits are left as-is, embedded TTS reads a small number naturally.
function formatDurationForSpeech(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds} ${pluralize(seconds, 'seconde', 'secondes')}`;
  }
  return `${minutes} ${pluralize(minutes, 'minute', 'minutes')} ${seconds} ${pluralize(seconds, 'seconde', 'secondes')}`;
}

// Pure — one draft per received event type (docs/06 "Types d'annonces",
// phrasing taken verbatim from its examples). Returns `null` for nothing to
// say (none currently — every event in VoiceInputEvent has a defined
// announcement; kept as a return type for future event types that might be
// silent by design, e.g. routine sync events docs/06 says stay silent).
export function buildAnnouncement(event: VoiceInputEvent): DraftAnnouncement | null {
  const base = { missionId: event.missionId, sourceEvent: event.type };

  switch (event.type) {
    case 'VOICE_MISSION_STARTED':
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        text: 'Mission démarrée.',
        interruptible: true,
        deduplicationKey: `mission-started-${event.missionId}`,
      };

    case 'VOICE_NEXT_RESIDENCE': {
      const address = normalizeAddressForSpeech(event.address);
      const text = event.alertText
        ? `Prochaine résidence, ${address}. Attention, ${event.alertText}.`
        : `Prochaine résidence, ${address}.`;
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        missionItemId: event.missionItemId,
        text,
        interruptible: true,
        deduplicationKey: `next-residence-${event.missionItemId}`,
      };
    }

    case 'VOICE_APPROACHING':
      return {
        ...base,
        type: event.type,
        priority: 'HIGH',
        missionItemId: event.missionItemId,
        text: 'Résidence en approche.',
        interruptible: true,
        deduplicationKey: `approaching-${event.missionItemId}`,
      };

    case 'VOICE_RESIDENCE_STARTED':
      return {
        ...base,
        type: event.type,
        priority: 'HIGH',
        missionItemId: event.missionItemId,
        text: 'Intervention démarrée.',
        interruptible: true,
        deduplicationKey: `residence-started-${event.missionItemId}`,
      };

    case 'VOICE_RESIDENCE_COMPLETED': {
      // docs/06 "Résidences rapprochées" — grouped into one announcement
      // rather than "Résidence terminée." + "Prochaine résidence." separately.
      const text = event.nextAddress
        ? `Résidence terminée. Prochaine résidence, ${normalizeAddressForSpeech(event.nextAddress)}.`
        : 'Résidence terminée.';
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        missionItemId: event.missionItemId,
        text,
        interruptible: true,
        deduplicationKey: `residence-completed-${event.missionItemId}`,
      };
    }

    case 'VOICE_IMPORTANT_ALERT':
      return {
        ...base,
        type: event.type,
        priority: 'HIGH',
        missionItemId: event.missionItemId,
        text: `Attention, ${event.text}.`,
        interruptible: true,
        deduplicationKey: `alert-${event.missionItemId}-${event.text}`,
      };

    case 'VOICE_PROBLEM_RECORDED':
      return {
        ...base,
        type: event.type,
        priority: 'HIGH',
        missionItemId: event.missionItemId,
        text: 'Problème enregistré. Résidence conservée dans la liste des problèmes.',
        interruptible: true,
        deduplicationKey: `problem-${event.missionItemId}`,
      };

    case 'VOICE_GPS_LOST':
      return {
        ...base,
        type: event.type,
        priority: 'CRITICAL',
        text: 'Signal GPS perdu.',
        interruptible: false,
        deduplicationKey: `gps-lost-${event.missionId}`,
      };

    case 'VOICE_GPS_RECOVERED':
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        text: 'Signal GPS rétabli.',
        interruptible: true,
        deduplicationKey: `gps-recovered-${event.missionId}`,
      };

    case 'VOICE_OFFLINE':
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        text: 'Mode hors ligne activé.',
        interruptible: true,
        deduplicationKey: `offline-${event.missionId}`,
      };

    case 'VOICE_ONLINE':
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        text: 'Connexion rétablie.',
        interruptible: true,
        deduplicationKey: `online-${event.missionId}`,
      };

    case 'VOICE_MISSION_COMPLETED':
      return {
        ...base,
        type: event.type,
        priority: 'NORMAL',
        text: 'Mission terminée. Toutes les résidences ont été traitées.',
        interruptible: true,
        deduplicationKey: `mission-completed-${event.missionId}`,
      };

    case 'VOICE_REPEAT_CURRENT_CONTEXT': {
      const address = normalizeAddressForSpeech(event.address);
      const duration = formatDurationForSpeech(event.phaseSeconds);
      const parts = [`Résidence actuelle, ${address}.`, `${event.phaseLabel} depuis ${duration}.`];
      if (event.alertText) {
        parts.push(`Attention, ${event.alertText}.`);
      }
      return {
        ...base,
        type: event.type,
        priority: 'LOW',
        text: parts.join(' '),
        interruptible: true,
        // No deduplication key — a manual repeat is always allowed again.
      };
    }
  }
}

export type { VoicePriority };
