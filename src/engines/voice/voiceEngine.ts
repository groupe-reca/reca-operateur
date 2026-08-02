import type { Clock } from '@/domain/clock';
import { generateId } from '@/domain/id';

import { buildAnnouncement } from './messages';
import type { Speaker, VoiceAnnouncement, VoiceEngineEvent, VoiceEventListener, VoiceInputEvent, VoicePriority } from './types';

export type VoiceEngineDependencies = {
  clock: Clock;
  speaker: Speaker;
  // docs/06 "Cooldown global" — minimum delay between two non-critical
  // announcements. Critical announcements always ignore it.
  cooldownMs?: number;
};

const PRIORITY_RANK: Record<VoicePriority, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
const DEFAULT_COOLDOWN_MS = 3000;

// Pure engine (docs/02), no timer of its own — same "caller pumps"
// convention as the GPS/Offline engines: `handleEvent` enqueues, the caller
// repeatedly awaits `processNext()` (e.g. right after it resolves, or
// whenever the app wants to check) to actually speak the next queued item.
export function createVoiceEngine({ clock, speaker, cooldownMs = DEFAULT_COOLDOWN_MS }: VoiceEngineDependencies) {
  let enabled = true;
  const queue: VoiceAnnouncement[] = [];
  let speaking: VoiceAnnouncement | null = null;
  let lastSpokenAt: Date | null = null;
  let interruptRequested = false;
  // docs/06 "Anti-répétition" — persistent per-key "already announced" set.
  // Cleared explicitly by the events that make the original announcement
  // stale (GPS recovered clears the "GPS lost" key, etc.), never by a timer.
  const announcedKeys = new Set<string>();

  const listeners: VoiceEventListener[] = [];
  const events: VoiceEngineEvent[] = [];

  function emit(event: VoiceEngineEvent): void {
    events.push(event);
    listeners.forEach((listener) => listener(event));
  }

  function removeFromQueue(predicate: (a: VoiceAnnouncement) => boolean, reason: string): void {
    for (let i = queue.length - 1; i >= 0; i -= 1) {
      const item = queue[i];
      if (item && predicate(item)) {
        queue.splice(i, 1);
        emit({ type: 'VoiceSkipped', at: clock.now().toISOString(), announcementId: item.id, reason });
      }
    }
  }

  function handleEvent(event: VoiceInputEvent): void {
    // docs/06 "Expiration" — starting the intervention makes a still-queued
    // "approaching" announcement for the same residence stale.
    if (event.type === 'VOICE_RESIDENCE_STARTED') {
      removeFromQueue(
        (a) => a.type === 'VOICE_APPROACHING' && a.missionItemId === event.missionItemId,
        'residence started — approaching no longer relevant'
      );
    }
    // "Une seule annonce tant que le GPS n'est pas rétabli" / "... hors ligne" —
    // recovery clears the key so the next loss/offline can announce again.
    if (event.type === 'VOICE_GPS_RECOVERED') {
      announcedKeys.delete(`gps-lost-${event.missionId}`);
    }
    if (event.type === 'VOICE_ONLINE') {
      announcedKeys.delete(`offline-${event.missionId}`);
    }

    const draft = buildAnnouncement(event);
    if (!draft) return;

    if (draft.deduplicationKey && announcedKeys.has(draft.deduplicationKey)) {
      emit({ type: 'VoiceSkipped', at: clock.now().toISOString(), announcementId: draft.deduplicationKey, reason: 'duplicate' });
      return;
    }

    const announcement: VoiceAnnouncement = { ...draft, id: generateId(), createdAt: clock.now().toISOString() };
    if (announcement.deduplicationKey) {
      announcedKeys.add(announcement.deduplicationKey);
    }

    queue.push(announcement);
    emit({ type: 'VoiceQueued', at: announcement.createdAt, announcementId: announcement.id });

    // docs/06 "Interruption" — only a CRITICAL announcement may interrupt a
    // currently-playing one, and only if that one isn't itself CRITICAL
    // ("les annonces de même priorité ne s'interrompent pas entre elles").
    if (announcement.priority === 'CRITICAL' && speaking && speaking.priority !== 'CRITICAL') {
      interruptRequested = true;
      speaker.stop();
    }
  }

  // docs/06 "Bouton Voix" — manual repeat always allowed (no dedup key),
  // bypasses the cooldown (cooldownMs: 0) since the operator explicitly
  // asked for it right now.
  function repeatCurrentContext(context: {
    missionId: string;
    address: string;
    phaseLabel: string;
    phaseSeconds: number;
    alertText?: string;
  }): void {
    handleEvent({ type: 'VOICE_REPEAT_CURRENT_CONTEXT', ...context });
    const last = queue[queue.length - 1];
    if (last && last.sourceEvent === 'VOICE_REPEAT_CURRENT_CONTEXT') {
      last.cooldownMs = 0;
    }
  }

  function pickNext(): VoiceAnnouncement | null {
    if (queue.length === 0) return null;
    const sorted = [...queue].sort((a, b) => {
      const rankDiff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (rankDiff !== 0) return rankDiff;
      return a.createdAt.localeCompare(b.createdAt);
    });
    return sorted[0] ?? null;
  }

  async function processNext(): Promise<'spoke' | 'idle' | 'waiting-cooldown'> {
    if (speaking) return 'idle';

    const next = pickNext();
    if (!next) return 'idle';

    if (!enabled) {
      queue.splice(queue.indexOf(next), 1);
      emit({ type: 'VoiceSkipped', at: clock.now().toISOString(), announcementId: next.id, reason: 'silent-mode' });
      return 'idle';
    }

    if (next.priority !== 'CRITICAL' && lastSpokenAt) {
      const elapsedMs = clock.now().getTime() - lastSpokenAt.getTime();
      const requiredCooldownMs = next.cooldownMs ?? cooldownMs;
      if (elapsedMs < requiredCooldownMs) {
        return 'waiting-cooldown';
      }
    }

    queue.splice(queue.indexOf(next), 1);
    speaking = next;
    emit({ type: 'VoiceStarted', at: clock.now().toISOString(), announcementId: next.id });

    try {
      await speaker.speak(next.text);
      emit({
        type: interruptRequested ? 'VoiceInterrupted' : 'VoiceCompleted',
        at: clock.now().toISOString(),
        announcementId: next.id,
      });
    } catch (err) {
      emit({ type: 'VoiceFailed', at: clock.now().toISOString(), announcementId: next.id, error: String(err) });
    } finally {
      interruptRequested = false;
      lastSpokenAt = clock.now();
      speaking = null;
    }

    return 'spoke';
  }

  function setEnabled(next: boolean): void {
    enabled = next;
  }

  function on(listener: VoiceEventListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  }

  return {
    handleEvent,
    repeatCurrentContext,
    processNext,
    setEnabled,
    isEnabled: (): boolean => enabled,
    isSpeaking: (): boolean => speaking !== null,
    getQueue: (): VoiceAnnouncement[] => [...queue],
    on,
    getEvents: (): VoiceEngineEvent[] => [...events],
  };
}

export type VoiceEngine = ReturnType<typeof createVoiceEngine>;
