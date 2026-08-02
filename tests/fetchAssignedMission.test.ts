import { mapServerMissionToLocal } from '@/integrations/supabase/fetchAssignedMission';

describe('mapServerMissionToLocal', () => {
  const now = '2026-08-02T12:00:00.000Z';

  it('maps a freshly assigned mission (server ids preserved, not regenerated)', () => {
    const { mission, items } = mapServerMissionToLocal(
      { id: 'srv-mission-1', date: '2026-08-02', statut: 'planifiee', heure_debut: null, heure_fin: null },
      [
        {
          id: 'srv-item-1',
          contract_id: 'srv-contract-1',
          statut_operateur: null,
          heure_arrivee: null,
          heure_fin: null,
          duree_trajet_secondes: null,
          duree_intervention_secondes: null,
          contract: { adresse_geocodee: '224 rue Scott', latitude: 45.1, longitude: -73.9 },
        },
      ],
      now
    );

    expect(mission.id).toBe('srv-mission-1');
    expect(mission.status).toBe('READY');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'srv-item-1',
      missionId: 'srv-mission-1',
      contractId: 'srv-contract-1',
      address: '224 rue Scott',
      latitude: 45.1,
      longitude: -73.9,
      status: 'WAITING',
    });
  });

  it('maps statut = en_cours to Mission.status IN_PROGRESS', () => {
    const { mission } = mapServerMissionToLocal(
      { id: 'm', date: '2026-08-02', statut: 'en_cours', heure_debut: now, heure_fin: null },
      [],
      now
    );
    expect(mission.status).toBe('IN_PROGRESS');
    expect(mission.actualStartAt).toBe(now);
  });

  it('maps every statut_operateur to the matching local MissionItemState', () => {
    const rows = [
      ['en_attente', 'WAITING'],
      ['en_route', 'EN_ROUTE'],
      ['en_approche', 'APPROACHING'],
      ['en_cours', 'IN_PROGRESS'],
      ['depart', 'IN_PROGRESS'],
      ['terminee', 'COMPLETED'],
      ['a_reprendre', 'SKIPPED'],
      [null, 'WAITING'],
    ] as const;

    for (const [statutOperateur, expected] of rows) {
      const { items } = mapServerMissionToLocal(
        { id: 'm', date: '2026-08-02', statut: 'planifiee', heure_debut: null, heure_fin: null },
        [
          {
            id: 'i',
            contract_id: 'c',
            statut_operateur: statutOperateur,
            heure_arrivee: null,
            heure_fin: null,
            duree_trajet_secondes: null,
            duree_intervention_secondes: null,
            contract: null,
          },
        ],
        now
      );
      expect(items[0]?.status).toBe(expected);
    }
  });

  it('falls back to a placeholder address when the contract join is missing', () => {
    const { items } = mapServerMissionToLocal(
      { id: 'm', date: '2026-08-02', statut: 'planifiee', heure_debut: null, heure_fin: null },
      [
        {
          id: 'i',
          contract_id: 'c',
          statut_operateur: null,
          heure_arrivee: null,
          heure_fin: null,
          duree_trajet_secondes: null,
          duree_intervention_secondes: null,
          contract: null,
        },
      ],
      now
    );
    expect(items[0]?.address).toBe('Adresse inconnue');
    expect(items[0]?.latitude).toBeNull();
  });
});
