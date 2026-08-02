import type { Clock } from '@/domain/clock';
import { buildAnnouncement, createVoiceEngine, normalizeAddressForSpeech } from '@/engines/voice';
import type { Speaker, VoiceEngineEvent } from '@/engines/voice';

function createMutableClock(start: Date): Clock & { advanceMs(ms: number): void } {
  let now = start;
  return { now: () => now, advanceMs: (ms: number) => (now = new Date(now.getTime() + ms)) };
}

function createFakeSpeaker(): Speaker & {
  spokenTexts: string[];
  resolveCurrent(): void;
  rejectCurrent(error: Error): void;
} {
  let currentResolve: (() => void) | null = null;
  let currentReject: ((error: Error) => void) | null = null;
  const spokenTexts: string[] = [];
  return {
    spokenTexts,
    isAvailable: () => true,
    speak(text: string) {
      spokenTexts.push(text);
      return new Promise<void>((resolve, reject) => {
        currentResolve = resolve;
        currentReject = reject;
      });
    },
    stop() {
      currentResolve?.();
      currentResolve = null;
    },
    resolveCurrent() {
      currentResolve?.();
      currentResolve = null;
    },
    rejectCurrent(error: Error) {
      currentReject?.(error);
      currentReject = null;
    },
  };
}

describe('normalizeAddressForSpeech', () => {
  it('expands dotted street-type abbreviations', () => {
    expect(normalizeAddressForSpeech('123 r. Principale')).toBe('123 rue Principale');
    expect(normalizeAddressForSpeech('456 boul. Saint-Jean')).toBe('456 boulevard Saint-Jean');
    expect(normalizeAddressForSpeech('18 ch. du Lac')).toBe('18 chemin du Lac');
    expect(normalizeAddressForSpeech('9 av. des Pins')).toBe('9 avenue des Pins');
  });

  it('expands a trailing cardinal-direction suffix only', () => {
    expect(normalizeAddressForSpeech('456 boul. Saint-Jean N.')).toBe('456 boulevard Saint-Jean nord');
    expect(normalizeAddressForSpeech('18 chemin du Lac O')).toBe('18 chemin du Lac ouest');
  });

  it('leaves proper nouns and addresses without abbreviations untouched', () => {
    expect(normalizeAddressForSpeech('224 rue Scott')).toBe('224 rue Scott');
    expect(normalizeAddressForSpeech('1 rue Napoléon')).toBe('1 rue Napoléon');
  });
});

describe('buildAnnouncement', () => {
  it('groups residence completed with the next residence (résidences rapprochées)', () => {
    const draft = buildAnnouncement({
      type: 'VOICE_RESIDENCE_COMPLETED',
      missionId: 'm1',
      missionItemId: 'i1',
      nextAddress: '228 rue Bellevue',
    });
    expect(draft?.text).toBe('Résidence terminée. Prochaine résidence, 228 rue Bellevue.');
  });

  it('includes a short alert in the next-residence announcement', () => {
    const draft = buildAnnouncement({
      type: 'VOICE_NEXT_RESIDENCE',
      missionId: 'm1',
      missionItemId: 'i1',
      address: '224 rue Scott',
      alertText: 'plate-bande au fond',
    });
    expect(draft?.text).toBe('Prochaine résidence, 224 rue Scott. Attention, plate-bande au fond.');
  });

  it('marks GPS lost as CRITICAL and non-interruptible', () => {
    const draft = buildAnnouncement({ type: 'VOICE_GPS_LOST', missionId: 'm1' });
    expect(draft?.priority).toBe('CRITICAL');
    expect(draft?.interruptible).toBe(false);
  });
});

describe('voiceEngine', () => {
  function setup(cooldownMs = 3000) {
    const clock = createMutableClock(new Date('2026-08-02T08:00:00.000Z'));
    const speaker = createFakeSpeaker();
    const engine = createVoiceEngine({ clock, speaker, cooldownMs });
    return { clock, speaker, engine };
  }

  it('queues and speaks a single announcement', async () => {
    const { engine, speaker } = setup();
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' });

    const speaking = engine.processNext();
    expect(speaker.spokenTexts).toEqual(['Mission démarrée.']);
    speaker.resolveCurrent();
    expect(await speaking).toBe('spoke');

    const types = engine.getEvents().map((e: VoiceEngineEvent) => e.type);
    expect(types).toEqual(['VoiceQueued', 'VoiceStarted', 'VoiceCompleted']);
  });

  it('speaks CRITICAL before a lower-priority item queued first', async () => {
    const { engine, speaker } = setup();
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' }); // NORMAL
    engine.handleEvent({ type: 'VOICE_GPS_LOST', missionId: 'm1' }); // CRITICAL

    engine.processNext();
    expect(speaker.spokenTexts).toEqual(['Signal GPS perdu.']);
  });

  it('a CRITICAL announcement interrupts a playing lower-priority one', async () => {
    const { engine, speaker } = setup();
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' });

    const firstSpeak = engine.processNext();
    expect(speaker.spokenTexts).toEqual(['Mission démarrée.']);

    // A critical event arrives while still speaking the normal one.
    engine.handleEvent({ type: 'VOICE_GPS_LOST', missionId: 'm1' });
    expect(await firstSpeak).toBe('spoke');

    const types = engine.getEvents().map((e: VoiceEngineEvent) => e.type);
    expect(types).toContain('VoiceInterrupted');
    expect(types).not.toContain('VoiceCompleted');

    const secondSpeak = engine.processNext();
    expect(speaker.spokenTexts).toEqual(['Mission démarrée.', 'Signal GPS perdu.']);
    speaker.resolveCurrent();
    await secondSpeak;
  });

  it('never interrupts an announcement of the same priority', async () => {
    const { engine, speaker } = setup();
    engine.handleEvent({ type: 'VOICE_GPS_LOST', missionId: 'm1' }); // CRITICAL
    const firstSpeak = engine.processNext();
    expect(speaker.spokenTexts).toEqual(['Signal GPS perdu.']);

    engine.handleEvent({ type: 'VOICE_PROBLEM_RECORDED', missionId: 'm1', missionItemId: 'i1' }); // HIGH, not critical
    // Still speaking the first one, no interruption triggered.
    expect(engine.isSpeaking()).toBe(true);
    speaker.resolveCurrent();
    expect(await firstSpeak).toBe('spoke');
    expect(engine.getEvents().map((e) => e.type)).not.toContain('VoiceInterrupted');
  });

  it('deduplicates GPS_LOST until GPS_RECOVERED clears it', async () => {
    // cooldownMs: 0 — this test isn't about cooldown timing, just dedup.
    const { engine, speaker } = setup(0);
    engine.handleEvent({ type: 'VOICE_GPS_LOST', missionId: 'm1' });
    engine.handleEvent({ type: 'VOICE_GPS_LOST', missionId: 'm1' });
    expect(engine.getQueue()).toHaveLength(1);

    const speak1 = engine.processNext();
    speaker.resolveCurrent();
    await speak1;

    engine.handleEvent({ type: 'VOICE_GPS_RECOVERED', missionId: 'm1' });
    const speak2 = engine.processNext();
    speaker.resolveCurrent();
    await speak2;

    engine.handleEvent({ type: 'VOICE_GPS_LOST', missionId: 'm1' });
    expect(engine.getQueue()).toHaveLength(1);
  });

  it('removes a still-queued APPROACHING once the residence starts (docs/06 expiration)', () => {
    const { engine } = setup();
    engine.handleEvent({ type: 'VOICE_APPROACHING', missionId: 'm1', missionItemId: 'i1' });
    expect(engine.getQueue()).toHaveLength(1);

    engine.handleEvent({ type: 'VOICE_RESIDENCE_STARTED', missionId: 'm1', missionItemId: 'i1' });

    const queueTypes = engine.getQueue().map((a) => a.type);
    expect(queueTypes).toEqual(['VOICE_RESIDENCE_STARTED']);
    expect(engine.getEvents().some((e) => e.type === 'VoiceSkipped')).toBe(true);
  });

  it('respects the cooldown between two non-critical announcements', async () => {
    const { engine, speaker, clock } = setup(3000);
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' });
    const speak1 = engine.processNext();
    speaker.resolveCurrent();
    await speak1;

    engine.handleEvent({ type: 'VOICE_ONLINE', missionId: 'm1' });
    expect(await engine.processNext()).toBe('waiting-cooldown');
    expect(engine.getQueue()).toHaveLength(1);

    clock.advanceMs(3000);
    const speak2 = engine.processNext();
    speaker.resolveCurrent();
    expect(await speak2).toBe('spoke');
  });

  it('a manual repeat bypasses the cooldown', async () => {
    const { engine, speaker } = setup(3000);
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' });
    const speak1 = engine.processNext();
    speaker.resolveCurrent();
    await speak1;

    engine.repeatCurrentContext({
      missionId: 'm1',
      address: '224 rue Scott',
      phaseLabel: 'Intervention en cours',
      phaseSeconds: 342,
    });
    const speak2 = engine.processNext();
    expect(speaker.spokenTexts[1]).toBe('Résidence actuelle, 224 rue Scott. Intervention en cours depuis 5 minutes 42 secondes.');
    speaker.resolveCurrent();
    expect(await speak2).toBe('spoke');
  });

  it('silent mode drains the queue without speaking', async () => {
    const { engine, speaker } = setup();
    engine.setEnabled(false);
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' });

    expect(await engine.processNext()).toBe('idle');
    expect(speaker.spokenTexts).toEqual([]);
    expect(engine.getQueue()).toHaveLength(0);
    expect(engine.getEvents().some((e) => e.type === 'VoiceSkipped' && e.reason === 'silent-mode')).toBe(true);
  });

  it('logs VoiceFailed and keeps going when synthesis errors', async () => {
    const { engine, speaker } = setup();
    engine.handleEvent({ type: 'VOICE_MISSION_STARTED', missionId: 'm1' });
    const speak1 = engine.processNext();
    speaker.rejectCurrent(new Error('synthesis unavailable'));
    expect(await speak1).toBe('spoke');
    expect(engine.getEvents().some((e) => e.type === 'VoiceFailed')).toBe(true);
    expect(engine.isSpeaking()).toBe(false);
  });
});
