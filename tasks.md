# tasks.md — Suivi des tâches de `reca-operateur`

> Statuts : `[ ]` à faire · `[~]` en cours · `[x]` terminée. À mettre à jour en début et en
> fin de tâche (protocole `docs/10-Development-Standards.md`). Une tâche n'est pas « terminée »
> tant que code + tests + docs + mémoire ne sont pas cohérents.

## En cours

- (aucune)

## Terminé

- [x] **Sprint 001 — Initialisation** (branche `sprint-001-initialisation`, 2026-07-30)
  Pivot du scaffold Vite vers **React Native + Expo** (SDK 57 / RN 0.86 / React 19.2 / TS 6
  strict, template `blank-typescript`). Fait : suppression des fichiers Vite ; `app.json`
  (RÉCA Opérateur, portrait, thème sombre, `scheme`, ids `ca.groupereca.recaoperateur`) ;
  `tsconfig` strict + flags `docs/10` + alias `@/*` ; **structure `src/`** modulaire (app,
  components, screens, domain, engines/{gps,state-machine,map,voice,offline,sync}, context,
  persistence, integrations, services, hooks, types, utils, config) + `tests/`, `scripts/`,
  chacun avec un README de responsabilité ; **assets officiels** intégrés (logo clair/sombre,
  tracteur, map-night) ; **ESLint** (config Expo flat) ; **tests** `jest-expo` + RNTL 13 +
  smoke test ; **système de mémoire** (`memory.md`/`tasks.md`/`plans.md`/`file-index.md`) ;
  `CLAUDE.md` projet ; `README.md` (workflow VPS→laptop) ; `.input/` gitignoré.
  Vérifié sur le VPS : `tsc --noEmit` OK, `eslint .` OK, `jest` vert, `expo config` valide.
  **Non exécuté runtime** (pas d'émulateur ici) : à lancer sur le laptop/téléphone (`expo start`
  + Expo Go). Aucun moteur métier / Mapbox / Supabase implanté (volontaire, roadmap).

## À faire — prochains sprints (ordre roadmap `docs/11-Roadmap.md`)

- [ ] **Sprint 002 — Design tokens & composants** (Phase 01) : thème sombre, tokens couleurs/
  typo/espacements/rayons dans `src/config`, logo officiel intégré, composants glassmorphism de
  base (`AppHeader`, `MissionCard`, `PhaseTimer`, `AlertCard`, `BottomSheet`, `FloatingActionButton`,
  `ProblemButton`, `VoiceButton`, indicateurs GPS/Sync/Offline…). Données simulées uniquement.
- [ ] **Sprint 003 — Écran maître EN COURS statique** (Phase 02) : reproduire la maquette Fable
  (carte simulée/image), comparer par capture, corriger proportions/espacements/opacités.
- [ ] **Sprint 004 — Variantes opérationnelles** (Phase 03) : EN ROUTE / EN APPROCHE / EN COURS /
  PROBLÈME / FIN / HORS LIGNE — même structure, seules changent couleur/libellé/chrono/alertes.
- [ ] **Sprint 005-006 — Map Engine** (Phase 04) : intégrer `@rnmapbox/maps`, style nuit, caméra
  inclinée, tracteur fixe, 5 résidences, tracé suggéré, marqueurs, recentrage. **Dev build requis.**
- [ ] **Sprint 007-008 — Données locales & MissionContext** (Phase 05).
- [ ] **Sprint 009-010 — State Machine** (Phase 06) : transitions + invariants + résidences
  adjacentes, avec tests obligatoires (succès/refus/doublon/récupération/hors-ligne/journal).
- [ ] **Sprint 011-012 — GPS Engine** (Phase 07) : simulé puis réel.
- [ ] **Sprint 013-014 — Synchronization Engine + Intégration RECA App** (Phase 08).
- [ ] **Sprint 015 — Offline Mode** (Phase 09).
- [ ] **Sprint 016 — Voice Engine** (Phase 10).
- [ ] **Sprint 017-019 — Auth, mission assignée, fin de mission, mode développement** (Phase 11).
- [ ] **Sprint 020+ — Tests terrain, stabilisation, pilote, production** (Phases 12-15).

## À vérifier

- [ ] **Lancer l'app en runtime** sur le laptop/téléphone (`npx expo start` + Expo Go) pour
  confirmer que le placeholder Sprint 001 s'affiche (VPS headless = non vérifiable ici).

## Suivi / limitations déclarées (Sprint 001)

- **Icône/splash = placeholders Expo** (SVG officiels non convertis en PNG 1024) → tâche de
  suivi, à faire avant un vrai build de distribution. Aucun faux logo intégré entre-temps.
- **Aucun test runner « natif »** au-delà de jest (unitaire) : les tests moteurs viendront avec
  les moteurs (State Machine/GPS en priorité, `docs/10`).
