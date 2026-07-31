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

- [x] **Sprint 002 — Design tokens & composants** (branche `sprint-002-design-tokens`, 2026-07-30)
  Fondation visuelle complète, données simulées uniquement, aucun moteur/Mapbox/Supabase.
  **Tokens** (`src/config/theme/`) : `colors`, `typography` (Manrope, échelle HANDOFF §3 —
  timer 44/800 tabular, adresse 27/800, card-title 15/800, label-caps 11/800 +1.4, body 13/600,
  meta 11/600), `spacing`/`screenMargin`, `radii`, `glass` (3 niveaux chip/panel/sheet),
  `animation` (durées HANDOFF), `statusTone` (state → couleur, UI seulement), `fonts` +
  `useAppFonts` (chargement Manrope 600/700/800 via `@expo-google-fonts/manrope`), agrégées
  dans `theme`. **Domaine** : `src/domain/status.ts` (`MissionItemState` + libellés FR).
  **Primitives** (`src/components/ui/`) : `Txt`, `GlassCard` (BlurView + tint + bordure),
  `PressableScale` (retour pressé 90 ms), `Icon` (wrapper lucide), `ProgressBar`, `StatusDot`,
  `Pill`. **Marque** (`src/components/brand/`) : `OfficialLogo` (SVG officiel via
  react-native-svg-transformer), `Wordmark` (texte « OPÉRATEUR »). **Composants prioritaires**
  (`src/components/mission/` + `controls/`) : `AppHeader`, `MissionCard`+`MissionCardCompact`,
  `PhaseTimer` (+ `formatDuration` pur/testé), `AlertCard`, `SystemStatus`, `OfflineIndicator`,
  `SyncIndicator`, `CurrentResidenceSheet`, `UpcomingResidenceRow`, `FixedTractor`,
  `FloatingActionButton`, `ProblemButton`, `VoiceButton`, `BottomSheet` (coquille, gestes
  différés). **Écran galerie** (`src/screens/ComponentGalleryScreen.tsx`) branché dans
  `App.tsx` (charge les polices puis affiche la galerie) — remplace le placeholder Sprint 001.
  **Dépendances ajoutées** : `expo-font`, `expo-asset` (requis transitivement par expo-font),
  `@expo-google-fonts/manrope`, `expo-blur`, `react-native-svg` (+ `-transformer` en dev),
  `expo-splash-screen`, `lucide-react-native`. `metro.config.js` créé (import `.svg` en
  composants). Vérifié sur le VPS : `tsc --noEmit` OK, `eslint .` OK, `jest` 6/6 verts
  (`formatDuration` + rendu `PhaseTimer`/`AlertCard`/`MissionCard`), `expo-doctor` 20/20.
  **Non vérifié visuellement** (VPS sans émulateur) : à comparer à `mock-encours.png` sur le
  laptop/téléphone via Expo Go. `BottomSheet` sans gestes de glissement (Sprint 003).

- [x] **Sprint 003 — Écran maître EN COURS statique** (branche `sprint-003-mission-screen`,
  2026-07-31). Assemble les composants du Sprint 002 en l'écran maître réel, fidèle à
  `mock-encours.png` (Phase 02), données de l'exemple Roadmap (Mission 24-01-15, Saint-Jérôme,
  3/28, 10 %, 00:18:32, 224 rue Scott). **`src/screens/MissionScreen.tsx`** : mise en page fixe
  (pas de `ScrollView` — carte `flex:1` entre un bloc haut et un bloc bas, cohérent avec « aucun
  écran blanc, seulement des panneaux »), `SafeAreaProvider`/`useSafeAreaInsets` (**lacune
  Sprint 002 corrigée** : les *safe areas* étaient un livrable Phase 01 manqué). **Carte
  simulée** : `src/components/map/SimulatedMapBackground.tsx` réutilise directement
  `assets/map-night.svg` (rues + **tracé bleu déjà dessiné dedans**) et positionne juste des
  marqueurs (`ResidenceMapMarker.tsx`, badge neutre ou halo vert+maison si actif) + `FixedTractor`
  en pourcentages du viewBox (SVG étiré `preserveAspectRatio="none"`). **Nouveaux composants**
  mission : `CurrentResidenceProgressCard` (colonne gauche : état/adresse/repères
  done-current-upcoming + `ProblemButton`), `ResidenceTasksCard` (panneau droit : tâches +
  temps estimé). **Nouveau contrôle** : `BottomTabBar` (5 onglets Carte/Mission/Annonce/Alertes/
  Plus — voir décision ci-dessous) + `NotificationBadge` factorisé (`src/components/ui/`,
  dédoublonne le badge déjà présent dans `AppHeader`). **Décision de portée** (documentée,
  cohérente avec le précédent du ☰ décoratif sur `reca-operator`) : la maquette contient des
  éléments non nommés dans `HANDOFF.md` §1 (panneau de tâches, colonne de suivi, barre
  d'onglets) — construits **fidèlement** (Roadmap l'exige explicitement pour ce sprint) mais
  **seuls Carte et Annonce sont fonctionnels** ; Mission/Alertes/Plus restent des placeholders
  décoratifs (`onPress` no-op), aucun second écran n'existe encore. **Corrections de fidélité
  découvertes en assemblant** (dans les composants Sprint 002) : `MissionCard` affichait
  « Secteur X · N résidences » sur une ligne au lieu de deux + n'avait pas de bouton « Détails »
  visuellement distinct (ajout `etaLabel`, split en 2 lignes méta, « Détails » devient un vrai
  bouton bordé, `SyncIndicator` déplacé sous ce bouton) ; nouveau `formatElapsedWithHours`
  (`PhaseTimer.tsx`) car le « TEMPS DE MISSION » de la maquette montre toujours l'heure
  (« 00:18:32 »), contrairement au chrono de phase qui l'omet à zéro. **`BottomSheet` toujours
  sans geste** : la maquette ne montre pas de poignée sur « RÉSIDENCE ACTUELLE » (carte à hauteur
  fixe) — `CurrentResidenceSheet` (déjà construit sans geste) convenait tel quel, aucune
  dépendance gesture-handler/reanimated nécessaire. `App.tsx` rend désormais `MissionScreen`
  (plus `ComponentGalleryScreen`, qui reste dans le repo pour référence/tests). Dépendance
  ajoutée : `react-native-safe-area-context`. Vérifié sur le VPS : `tsc`/`eslint`/`expo-doctor`
  (20/20) propres, `jest` 10/10 verts (dont un piège noté : `SafeAreaProvider` ne rend ses
  enfants qu'avec des `initialMetrics` de test explicites, l'export `initialWindowMetrics` de la
  lib étant toujours `null` sous Jest — voir `memory.md`). **Non vérifié visuellement** (VPS
  sans émulateur) : comparaison à `mock-encours.png` à faire sur le laptop/téléphone.

## À faire — prochains sprints (ordre roadmap `docs/11-Roadmap.md`)

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

- [ ] **Lancer l'app en runtime** sur le laptop/téléphone (`npx expo start` + Expo Go) : comparer
  l'écran galerie du Sprint 002 à `mock-encours.png` (proportions, opacités, rayons, hiérarchie),
  itérer si besoin (VPS headless = non vérifiable ici).

## Suivi / limitations déclarées

- **Icône/splash = placeholders Expo** (SVG officiels non convertis en PNG 1024) → tâche de
  suivi, à faire avant un vrai build de distribution. Aucun faux logo intégré entre-temps.
  (Sprint 001)
- **Aucun test runner « natif »** au-delà de jest (unitaire) : les tests moteurs viendront avec
  les moteurs (State Machine/GPS en priorité, `docs/10`). (Sprint 001)
- **`BottomSheet` sans gestes de glissement** (coquille + snap en props seulement) : le
  glissement (gesture-handler/reanimated) sera câblé à l'assemblage de l'écran maître
  (Sprint 003). (Sprint 002)
- **Rendu visuel non vérifié** sur le VPS (pas d'émulateur) : à valider sur laptop/téléphone
  contre `mock-encours.png`. (Sprint 002)
