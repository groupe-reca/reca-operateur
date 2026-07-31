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

- [x] **Sprint 004 — Variantes opérationnelles** (branche `sprint-004-op-variants`, 2026-07-31).
  Décline l'écran maître (Phase 03) sans redessiner l'application : `MissionScreen` devient
  **piloté par les données** — un objet `MissionScreenState` (`src/screens/missionScreenState.ts`)
  au lieu de constantes codées en dur. **4 variantes** (`src/screens/missionScreenMocks.ts`) :
  EN ROUTE (bleu), EN APPROCHE (ambre), EN COURS (vert, adapté du Sprint 003), PROBLÈME (rouge
  **fonctionnel** `colors.danger`, jamais `colors.brand`). **Hors scope documenté** : MISSION
  ACTIVE et FIN DE MISSION sont des **écrans autonomes distincts** (Phase 11), pas des variantes
  de cet écran-carte. **Deux vraies lacunes du Sprint 003 comblées** (`PhaseTimer`/`AlertCard`
  jamais câblés malgré les Travaux explicites de la Phase 02) : `PhaseTimer` réintégré dans
  `CurrentResidenceProgressCard` (remplace l'icône décorative `CircleDashed`, ajoute une prop
  `color` désormais threadée partout au lieu de `colors.success` en dur) avec les valeurs de
  l'exemple `docs/01-Design-System.md` (04:37/00:08/03:41) ; groupement d'alertes (règle
  HANDOFF §5) = **1 `AlertCard` complète + chip « +N instructions »** (réutilise `Pill`), jamais
  une pile de N cartes — nouvelle sous-fonction `AlertsRow` dans `MissionScreen.tsx`. **Nouveau
  `ProblemStateCard`** (`src/components/mission/`) : remplace `CurrentResidenceProgressCard` au
  même emplacement quand l'état est PROBLÈME (contenu structurellement différent — type/note/
  chrono figé/2 actions — cohérent avec `docs/09-State-Machine.md`). **Mode hors ligne = overlay
  additif** (`OfflineIndicator`, déjà construit Sprint 002), pas une 5e variante — démontré sur
  le mock EN COURS. **Zoom suggéré et comportement du bottom sheet** : listés par la Roadmap
  comme axes de variation mais sans mécanisme réel disponible (pas de vrai Map Engine ni de
  gestes de sheet) → **non implémentés**, différés à leurs phases (04 et assemblage futur).
  **Outil de vérification temporaire** : `src/screens/MissionScreenPreview.tsx` (dev-only, même
  statut que `ComponentGalleryScreen`) affiche un sélecteur des 4 états ; `App.tsx` y bascule
  temporairement (sera reswitché vers un `MissionScreen` piloté par le vrai State Machine au
  Sprint 009-010). Vérifié sur le VPS : `tsc`/`eslint` propres, `jest` 13/13 verts (incluant
  `ProblemStateCard`, le groupement d'alertes, et la distinction PROBLÈME vs. panneau de
  tâches). Aucune nouvelle dépendance. **Non vérifié visuellement** (VPS sans émulateur, et
  aucune maquette pixel pour ces 3 nouveaux états — jugement visuel direct sur téléphone).

- [x] **Sprint 005-006 — Map Engine** (branche `sprint-005-006-map-engine`, 2026-07-31).
  Remplace la carte simulée SVG (`SimulatedMapBackground`, supprimée) par une vraie carte
  **`@rnmapbox/maps`** (style standard `dark-v11`, pas un style Studio custom — hors de portée
  sans accès Studio, même choix pragmatique que le repo frère `reca-operator`). **Rupture
  importante** : module natif → **Expo Go ne suffit plus**, un dev build (Android Studio) est
  désormais requis pour tout test runtime. **Jetons** : le public (`pk.*`) est réutilisé depuis
  `reca-operator/.env.local` (même compte) ; le secret de téléchargement (`sk.*`, scope
  Downloads:Read) est **nouveau** (jamais requis par les 2 apps web sœurs) — lu directement par
  Gradle via `System.getenv('RNMAPBOX_MAPS_DOWNLOAD_TOKEN')`, **aucune conversion `app.json` →
  `app.config.ts` nécessaire** (cette version du plugin a déprécié la config JSON du token en
  faveur de la variable d'environnement seule). `.env.example` ajouté. **Nouveaux fichiers** :
  `src/engines/map/mapCameraConfig.ts` (constantes pures + `zoomForState`, testées),
  `src/integrations/mapbox/{mapboxClient,suggestedRoute}.ts` (point de contact unique + calcul
  d'itinéraire avec repli ligne droite, pattern repris du repo frère), `src/components/map/
  {MissionMapView,TractorMarker,ResidenceMarkerLayer,SuggestedRouteLayer,useSuggestedRoute}.tsx`.
  **`ResidenceMapMarker` mis à niveau** (pas supprimé comme prévu au plan initial — sa logique de
  badge restait utile) : couleurs par **rang** (`docs/05` : actif=vert grand marqueur+halo+icône
  maison, 2e/3e=bleu, 4e/5e=gris), remplace la simplification binaire du Sprint 003. **Décisions**
  consignées dans `memory.md` : réconciliation HANDOFF vs `docs/05` sur l'ancre du tracteur (24 %
  du bas retenu), tracteur ne tourne jamais lui-même (c'est la caméra qui tourne), tracé via
  Directions API avec repli. Vérifié sur le VPS : `tsc`/`eslint` propres, `expo-doctor` 20/20,
  `jest` 22/22 verts (dérivation de zoom, repli/succès de `fetchSuggestedRoute`, écran entier
  avec mock Jest de `@rnmapbox/maps`). **Non vérifié visuellement** : nécessite le dev build du
  propriétaire (jeton secret à créer, `expo prebuild`, Android Studio).
- [x] **Sprint 007-008 — Données locales & MissionContext** (branche
  `sprint-007-008-local-storage`, 2026-08-01). Couche locale (Phase 05) : **`expo-sqlite`**
  (vraie base relationnelle, transactions natives — choix dicté par le vocabulaire même de la
  Roadmap : « schémas », « migrations »). **7 tables** créées (`missions`, `mission_items`,
  `state_transitions`, `sync_operations`, `operator_sessions`, `problems`, `mission_alerts`),
  champs repris de `docs/03`/`docs/09` sans invention — seules `missions`/`mission_items`
  reçoivent des données de démo ce sprint, les 5 autres existent vides pour les moteurs futurs.
  **Surface SQL volontairement réduite** : chaque repository (`src/persistence/repositories/`)
  n'utilise que get-all/get-by-id/upsert/delete + une transaction, via un **factory générique**
  `createRepository<T>` (évite 7 implémentations quasi identiques à la main) ; toute logique
  « intéressante » (résidence active, tri) reste en TypeScript pur au-dessus
  (`deriveActiveAndNext`, testée isolément). **`MissionContext`** (`src/context/MissionContext.tsx`)
  charge au montage (migrations → seed démo si vide → session ouverte → lecture), expose la forme
  documentée par la Roadmap (`gpsState`/`synchronizationState`/`offlineState` en **placeholders
  typés**, aucun moteur réel derrière). **Horloge injectable** (`src/domain/clock.ts`) et
  **UUID** (`src/domain/id.ts`, `expo-crypto`) partout où un id/timestamp est créé.
  **Décision de portée** : `MissionScreen` **reste alimenté par les mocks statiques existants**
  (aucune régression) ; preuve d'intégration légère et additive dans `MissionScreenPreview`
  (ligne de debug : heure de session + nombre de résidences chargées depuis SQLite). Le
  remplacement complet des mocks par `MissionContext` reste un sprint futur explicite (voir
  ci-dessous). Vérifié sur le VPS : `tsc`/`eslint` propres, `expo-doctor` 20/20, `jest` 27/27
  verts (CRUD générique, seed idempotent, dérivation active/next) — via un **faux `Db` en
  mémoire** (`tests/testFakeDb.ts`, pas de vraie base sous Jest, module natif). **Piège trouvé** :
  `expo-crypto`'s `randomUUID()` retourne silencieusement `undefined` sous Jest (aucune erreur) →
  a fait planter le seed de test (5 résidences écrasées en 1 seule, même id `undefined`) — corrigé
  par un mock Jest dédié (`tests/__mocks__/expoCryptoMock.js`, vrai générateur UUID v4 en JS pur).
  **Non vérifié visuellement** : la vraie preuve de survie au redémarrage nécessite de fermer/
  rouvrir l'app sur le dev build du propriétaire (pas testable depuis ce VPS).
- [ ] **Sprint 009-010 — State Machine** (Phase 06) : transitions + invariants + résidences
  adjacentes, avec tests obligatoires (succès/refus/doublon/récupération/hors-ligne/journal).
- [ ] **Sprint 011-012 — GPS Engine** (Phase 07) : simulé puis réel.
- [ ] **Sprint 013-014 — Synchronization Engine + Intégration RECA App** (Phase 08).
- [ ] **Sprint 015 — Offline Mode** (Phase 09).
- [ ] **Sprint 016 — Voice Engine** (Phase 10).
- [ ] **Sprint 017-019 — Auth, mission assignée, fin de mission, mode développement** (Phase 11).
- [ ] **Sprint 020+ — Tests terrain, stabilisation, pilote, production** (Phases 12-15).

## À vérifier

- [x] **Jetons Mapbox créés** (2026-08-01) : `.env.local` sur ce VPS contient les 2 jetons
  (public + secret Downloads:Read, voir `.input/mapbox_key` côté propriétaire). **Reste à faire
  par le propriétaire** : recréer le même `.env.local` sur son **laptop** (là où `expo prebuild`/
  Android Studio s'exécutent — ce fichier n'est jamais commité ni synchronisé par git).
- [ ] **Builder l'app en dev build** sur le laptop : `npx expo prebuild` → ouvrir `android/` dans
  Android Studio → lancer sur l'appareil. **Expo Go ne fonctionne plus depuis le Sprint 005-006**
  (module natif Mapbox). Comparer visuellement la carte (style sombre, tracteur fixe, marqueurs
  colorés par rang, tracé bleu, recentrage) — aucune capture pixel de référence pour cette
  carte-ci, jugement direct sur téléphone.
- [ ] **Vérifier la survie au redémarrage** (Sprint 007-008) : sur le dev build, confirmer via la
  ligne de debug de `MissionScreenPreview` (session + nombre de résidences) que **fermer et
  rouvrir l'app** (kill process) ne réinitialise pas les données SQLite — c'est le vrai test qui
  compte, non reproductible depuis ce VPS.

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
- **`MissionScreen` ne consomme pas encore `MissionContext`** : il reste alimenté par
  `missionScreenMocks.ts` (Sprint 004). Le remplacement complet est un **sprint futur explicite**
  (pas fait en douce) — nécessitera de réconcilier le rang des marqueurs carte / les coordonnées
  simulées / les alertes / tâches avec le schéma persistant réel. Candidat naturel : Sprint
  009-010 (State Machine) ou un sprint dédié juste avant. (Sprint 007-008)
