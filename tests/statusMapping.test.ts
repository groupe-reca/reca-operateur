import {
  toServerItemStatus,
  toServerItemStatutOperateur,
  toServerMissionStatus,
  UnsupportedStatusError,
} from '@/integrations/supabase/statusMapping';

describe('toServerItemStatutOperateur', () => {
  it('maps every local state to the granular server vocabulary', () => {
    expect(toServerItemStatutOperateur('WAITING')).toBe('en_attente');
    expect(toServerItemStatutOperateur('EN_ROUTE')).toBe('en_route');
    expect(toServerItemStatutOperateur('APPROACHING')).toBe('en_approche');
    expect(toServerItemStatutOperateur('IN_PROGRESS')).toBe('en_cours');
    expect(toServerItemStatutOperateur('COMPLETED')).toBe('terminee');
  });

  it('converges PROBLEM and SKIPPED to a_reprendre (owner decision, 2026-08-02)', () => {
    expect(toServerItemStatutOperateur('PROBLEM')).toBe('a_reprendre');
    expect(toServerItemStatutOperateur('SKIPPED')).toBe('a_reprendre');
  });

  it('throws for CANCELLED — an operator must never produce it', () => {
    expect(() => toServerItemStatutOperateur('CANCELLED')).toThrow(UnsupportedStatusError);
  });
});

describe('toServerItemStatus (rollup)', () => {
  it('collapses every "engaged" statut_operateur into en_cours', () => {
    expect(toServerItemStatus('en_route')).toBe('en_cours');
    expect(toServerItemStatus('en_approche')).toBe('en_cours');
    expect(toServerItemStatus('en_cours')).toBe('en_cours');
    expect(toServerItemStatus('depart')).toBe('en_cours');
  });

  it('passes through the terminal/waiting statuses unchanged', () => {
    expect(toServerItemStatus('en_attente')).toBe('en_attente');
    expect(toServerItemStatus('terminee')).toBe('terminee');
    expect(toServerItemStatus('a_reprendre')).toBe('a_reprendre');
  });
});

describe('toServerMissionStatus', () => {
  it('maps non-terminal states directly', () => {
    expect(toServerMissionStatus('ASSIGNED', false)).toBe('planifiee');
    expect(toServerMissionStatus('READY', false)).toBe('planifiee');
    expect(toServerMissionStatus('IN_PROGRESS', false)).toBe('en_cours');
    expect(toServerMissionStatus('PAUSED', false)).toBe('en_cours');
    expect(toServerMissionStatus('CANCELLED', false)).toBe('annulee');
  });

  it('flags terminee_avec_anomalies when unresolved items remain (supervisor follow-up)', () => {
    expect(toServerMissionStatus('COMPLETED', false)).toBe('terminee');
    expect(toServerMissionStatus('COMPLETED', true)).toBe('terminee_avec_anomalies');
  });
});
