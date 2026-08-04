# tasks.md — Suivi des tâches de `reca-operateur`

> Statuts : `[ ]` à faire · `[~]` en cours · `[x]` terminée. À mettre à jour en début et en
> fin de tâche (protocole `docs/10-Development-Standards.md`). Une tâche n'est pas « terminée »
> tant que code + tests + docs + mémoire ne sont pas cohérents.

## En cours

- (aucune)

## Terminé

- [x] **Refonte visuelle des écrans opérateur** (branche `PLAN-ECRANS-OPERATEUR-RECA`,
  2026-08-02) — 9 phases séquentielles, toutes terminées et vérifiées sur device (TECNO KL4).
  Détail complet dans `plans.md` (archivé). Source : `.input/PLAN-ECRANS-OPERATEUR-RECA.md`.
  Points marquants : header restauré (annule la simplification du même jour, nouvelle demande
  explicite) ; barre de navigation du bas retirée ; mission card compacte ; bottom sheet gestuel
  réel (`react-native-gesture-handler`+`react-native-reanimated` ajoutés) ; fusion Problème/
  Résidence. **2 bugs réels trouvés et corrigés en cours de route** (pas juste de la fidélité
  visuelle) : `AuthContext.getSession()` sans `.catch()` pouvait bloquer l'app indéfiniment ; texte
  invisible dans les boutons d'action du panneau Problème (`Txt` en enfant direct de
  `PressableScale` imbriqué dans l'Animated.View Reanimated de `BottomSheet` — voir memory.md).
  `tsc`/`eslint`/`jest` (91/91)/`expo-doctor` (20/20) verts.
- [x] **Suivi ouvert — bouton UI « Fermer la mission »** : livré au Sprint 018 —
  `EndOfMissionScreen`/`MissionContext.closeMission()`.
- [ ] **Suivi ouvert — contenu du bottom sheet en position ouverte** : au-delà des infos déjà
  exposées par `missionScreenState.ts`, le spec évoque photos/historique détaillé — données
  serveur qui n'existent pas encore, à étoffer seulement si un besoin réel se présente.

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
- [x] **Sprint 009-010 — State Machine** (Phase 06, 2026-08-01). Moteur pur
  (`src/engines/state-machine/`), aucun React, `Db`/`Clock` injectés. **Graphes de transitions**
  Mission (`ASSIGNED/READY/IN_PROGRESS/PAUSED/COMPLETED/CANCELLED`) et MissionItem
  (`WAITING/EN_ROUTE/APPROACHING/IN_PROGRESS/COMPLETED/PROBLEM/SKIPPED/CANCELLED`) repris
  verbatim de `docs/09`. **Commandes** : `startEnRoute`/`enterApproach`/`enterWork`/
  `completeItem`/`reportProblem`/`resolveProblem`/`skipItem`/`resumeSkipped`/
  `enterAdjacentResidence`/`requestMissionStart|Pause|Resume|Complete`/`recoverOnStartup` —
  chacune valide (invariant « une résidence active », dédoublonnage, mission en pause) puis écrit
  atomiquement (`Db.withTransactionAsync`) MissionItem/Mission + `StateTransition` +
  `SyncOperation` (file locale, aucun appel réseau). **Verrou** : file de promesses par mission
  (`Map<missionId, Promise>`), sérialise toute commande touchant la même mission. **Résidences
  adjacentes** : transaction unique A→COMPLETED + B→IN_PROGRESS (temps de trajet artificiel 5 s,
  marqué via le champ `reason` existant — aucune nouvelle colonne SQL). **Récupération** : aucun
  actif → active le premier WAITING admissible (source `RECOVERY`) ; plusieurs actifs → conserve
  le plus avancé, ramène les autres à `WAITING` (écriture administrative hors du graphe normal,
  toujours journalisée). **`ACTIVE_STATES` migrée** de `MissionContext.tsx` vers
  `itemTransitions.ts` (`ACTIVE_ITEM_STATES`) — source unique de la règle « résidence active ».
  **Portée volontairement exclue** : validation précision/délai GPS (responsabilité du futur GPS
  Engine, Sprint 011-012) ; mode simulation/UI développeur (Sprint 017-019) ; câblage dans
  `MissionContext`/`MissionScreen` (les commandes existent mais n'ont pas encore d'appelant réel —
  un futur sprint les branchera). Vérifié sur le VPS : `tsc`/`eslint` propres, `jest` 42/42 verts
  (5 suites, dont `tests/stateMachine.test.ts` — 15 tests : succès/refus/doublon/hors-ligne/
  journalisation par transition prioritaire + adjacence + pause/reprise + problème/résolution +
  skip/reprise + récupération 0/2 actifs).
- [x] **Sprint 011-012 — GPS Engine** (Phase 07, 2026-08-01). Moteur pur (`src/engines/gps/`),
  aucun React, `StateMachine`/`Clock` injectés. **Calcul de distance** : `haversineDistanceMeters`
  (pur, testé). **Seuils par défaut** (`docs/04`) : approche 250 m, début intervention 30 m
  (remplacé par le `detectionRadiusMeters` propre à la résidence quand présent — interprétation
  retenue pour ce champ, `docs/03` ne précisait pas lequel des 3 rayons il représente), fin
  intervention 50 m, validation entrée/sortie rayon 5 s chacune, validation cap 3 s, trajet
  fictif adjacent 5 s. **2 hypothèses non chiffrées par `docs/04`, marquées comme telles** (à
  valider par le propriétaire) : précision GPS maximale acceptée (50 m par défaut) et délai de
  détection de perte de signal (15 s par défaut). **Machine à validation par délai** (`validate`) :
  un candidat de transition doit être revu identique après le délai requis avant d'être accepté —
  même schéma pour l'entrée en rayon (approche/travail/adjacence) et la stabilisation du cap.
  **Le moteur appelle directement** les commandes du State Machine (`enterApproach`/`enterWork`/
  `completeItem`/`enterAdjacentResidence`) une fois validé — jamais d'écriture directe. **Perte/
  retour GPS** (`checkTimeout`, appelé périodiquement par l'appelant — le moteur ne possède aucun
  timer propre) : événements `GpsLost`/`GpsRecovered` publiés, **aucune transition métier
  déclenchée** (conforme `docs/04`). **Simulateur** (`simulator.ts`, `createGpsSimulator`) :
  Travail explicite de cette phase (pas différé comme le mode simulation du State Machine) —
  réutilise le **même** moteur que la production. **Correction rétroactive découverte en testant**
  (pas un ajout de portée) : `docs/09` « Activation de la résidence suivante » n'avait **jamais
  été implémentée** au Sprint 009-010 — `completeItem` ne faisait que compléter l'item courant,
  sans activer le prochain WAITING admissible en EN_ROUTE. Corrigé dans `stateMachine.ts`
  (`activateNextAdmissibleItem`, même transaction que la complétion, via un nouveau hook
  `additionalWrites`) — le GPS Engine en dépend directement (il n'a pas besoin d'appeler
  `startEnRoute` lui-même après une complétion). **Portée exclue** : capteur `expo-location` réel,
  test sur appareil physique, câblage `MissionContext`/`MissionScreen` (même décision que le State
  Machine — commandes prêtes, sans appelant réel). Vérifié sur le VPS : `tsc`/`eslint` propres,
  `jest` 56/56 verts (6 suites, dont `tests/gpsEngine.test.ts` — 12 tests : distance, zones EN
  ROUTE→APPROCHE→EN COURS→TERMINÉE avec délais, rayon par résidence, adjacence, filtrage
  précision, stabilisation cap, perte/retour GPS, 2 via le simulateur ; `tests/stateMachine.test.ts`
  passé à 17/17 avec les 2 nouveaux tests d'activation automatique).
- [x] **Sprint 013-014 — Synchronization Engine** (Phase 08, 2026-08-02, **portée locale
  uniquement**). `reca-app` inaccessible sur cette machine (aucun autre dépôt cloné, aucune
  credential Supabase) → question posée au propriétaire, réponse : moteur local avec transport
  réseau **injecté** (`SyncTransport`), vrai câblage Supabase reporté à une tâche de suivi
  explicite (voir « À vérifier » ci-dessous) une fois `reca-app`/credentials accessibles. Moteur
  pur (`src/engines/sync/`), aucun React. **`SyncOperation` étendue** (`src/domain/entities.ts`,
  migration additive de `sync_operations`) : `missionId`/`missionItemId`/`localSequence`/
  `attemptCount`/`idempotencyKey` (= le même `id` local, pas de second identifiant)/
  `lastAttemptAt`/`nextAttemptAt`/`lastErrorCode`/`lastErrorMessage`, statut aligné sur `docs/07`
  (`PENDING/PROCESSING/CONFIRMED/FAILED/BLOCKED`, renommage de `SYNCED`→`CONFIRMED`). **State
  Machine ajusté en conséquence** (`buildSyncOperation` déplacée dans sa closure, devient async,
  calcule `localSequence` via un compteur en mémoire par mission réamorcé depuis le max persisté).
  **Le moteur ne fait que traiter la file** (`runSyncCycle`) — les producteurs (State Machine)
  écrivent déjà dans `sync_operations` au sein de leur propre transaction ; **décision retenue** :
  chaque transition écrit un **snapshot complet de l'entité** (pas un événement typé à grain fin
  comme `ITEM_STARTED` listé en exemple par `docs/07`) — naturellement idempotent, pas de
  mécanisme de résolution supplémentaire à inventer. **Ordre strict par mission** (`localSequence`),
  **priorité seulement entre missions indépendantes** (`selectBatch`, ne casse jamais l'ordre
  intra-mission). **Réessais** : attente progressive (0/5/15/30/60 s puis plafond) + gigue
  injectable, `BLOCKED` après `maxAttempts` ou erreur permanente immédiate (aucun réessai).
  **Récupération démarrage** : `PROCESSING`→`PENDING`. **`SynchronizationState`** exposée
  (`SYNCED/SYNCING/OFFLINE/PENDING/ERROR` + compteurs), `NetworkStatusProvider` injecté (pas de
  vrai `NetInfo`). **Portée explicitement exclue** (raisons : système absent ou dépendant du vrai
  serveur) : authentification expirée (pas de système d'auth, Sprint 017-019), médias (jamais
  implémentés), conflits de version (politique dépend du schéma `reca-app`), horloge appareil
  incorrecte (nécessite un round-trip serveur réel), espace disque faible (hors Travaux explicites
  de cette phase) ; pas de câblage `MissionContext`/`MissionScreen` (même décision que State
  Machine/GPS Engine). Vérifié sur le VPS : `tsc`/`eslint` propres, `jest` 72/72 verts (7 suites,
  dont `tests/syncEngine.test.ts` — 16 tests : backoff, priorité/ordre, mission en ligne/hors
  ligne, réseau intermittent, serveur indisponible→`BLOCKED`, opération invalide→`BLOCKED`
  immédiat, lot partiellement accepté, doublon/réponse perdue — effet réel compté 1 seule fois
  malgré 2 envois —, récupération `PROCESSING`, 250 opérations en lots ordonnés, réessai manuel,
  intégration bout-en-bout avec le State Machine réel sur le cas résidences adjacentes).
- [x] **Sprint 015 — Offline Mode, portée noyau** (Phase 09, branche `sprint-015-offline-mode`,
  2026-08-02, **portée réduite validée avec le propriétaire** — `docs/08` couvre aussi les cartes
  hors ligne/médias/conflits multi-appareils/simulateur dev, tous explicitement hors de cette
  passe, voir `plans.md`). Moteur pur `src/engines/offline/` (aucun timer propre, même principe
  que le GPS Engine) : 4 états `ONLINE/DEGRADED/OFFLINE/RECOVERING` (réduit des 6 de `docs/08` —
  `SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED` différés, nécessiteraient un vrai ping serveur/
  refresh de jeton). `checkConnectivity()` (lit `NetworkStatusProvider`, réutilisé du Sync Engine
  plutôt que dupliqué) gère OFFLINE/RECOVERING/ONLINE ; `recordOperationOutcome()` (appelé par
  l'appelant après chaque tentative réseau réelle) gère ONLINE↔DEGRADED — une seule requête
  échouée ne suffit jamais (`consecutiveFailureThreshold`). Retour en ligne validé (délai ou
  succès réel confirmé), jamais immédiat. **Hors scope, non câblé** : `MissionContext.offlineState`
  reste un placeholder typé — même décision de portée que State Machine/GPS/Sync Engine (moteur
  prêt et testé, aucun appelant réel encore). Vérifié : `tsc`/`eslint`/`jest` (100/100, 11 suites,
  dont `tests/offlineEngine.test.ts` — 9 tests)/`expo-doctor` (20/20) verts.
- [x] **Sprint 016 — Voice Engine** (Phase 10, branche `sprint-016-voice-engine`, 2026-08-02).
  Contrairement au GPS/réseau (capteur réel différé dans leurs sprints), la roadmap demande
  explicitement « intégrer la synthèse vocale locale » — **question posée au propriétaire,
  réponse : vraie synthèse maintenant** (`expo-speech` ajouté, nouveau build natif arm64-v8a).
  Moteur pur `src/engines/voice/` (`docs/06`), aucun timer propre : `types.ts`
  (`VoiceInputEvent`/`VoicePriority`/`VoiceAnnouncement`/`Speaker` injecté),
  `textFormatting.ts` (`normalizeAddressForSpeech` — abréviations `r./av./boul./ch./N/S/E/O`,
  **prononciation des nombres en toutes lettres volontairement hors scope** — les TTS embarqués
  lisent déjà naturellement un petit nombre inséré dans une phrase, convertisseur français
  nombre→texte jugé disproportionné pour le gain), `messages.ts` (un constructeur pur par type
  d'événement, phrasés `docs/06` verbatim, regroupement résidence terminée + prochaine résidence),
  `voiceEngine.ts` (`createVoiceEngine({clock, speaker, cooldownMs?})` : file triée
  priorité→heure de création, anti-répétition par clé persistante, expiration croisée
  (`RESIDENCE_STARTED` retire un `APPROACHING` encore en file pour la même résidence), interruption
  uniquement par une annonce `CRITICAL` sur une non-critique en cours, cooldown global contournable
  (répétition manuelle), mode silencieux). `src/integrations/voice/expoSpeaker.ts` — implémentation
  réelle (voix française canadienne → française générique → toute voix française → défaut système,
  jamais inventée). **Hors scope, non câblé** : `MissionContext`/`VoiceButton` (même décision que
  les 4 moteurs précédents) ; audio ducking, interruption d'appel téléphonique réelle, écran
  verrouillé (nécessitent des tests device difficiles à automatiser) ; détection gauche/droite de
  l'entrée (géométrie non disponible) ; simulateur dev. Vérifié : `tsc`/`eslint`/`jest`
  (116/116, 12 suites, dont `tests/voiceEngine.test.ts` — 16 tests)/`expo-doctor` (20/20) verts,
  app sans régression sur device (TECNO KL4) après le nouveau build natif.
- [x] **Sprint 017-019 — Auth, mission assignée, fin de mission, mode développement** (Phase 11,
  les 4 sujets nommés par ce titre). **Reste de la Phase 11 non couvert par ce titre** (donc pas
  marqué ici) : écrans « Mission active »/« Paramètres »/« Mode hors ligne » — voir Sprint 017
  partie 2/N ci-dessous pour les capteurs GPS/réseau réels et l'écran « Aucune mission », livrés
  après ce titre.
  - [x] **Sprint 017 (partie 1/N) — Câblage réel de MissionContext** (branche
    `sprint-017-mission-context-wiring`, 2026-08-02, PR :
    https://github.com/groupe-reca/reca-operateur/pull/1). Découpage validé avec le propriétaire : cette
    passe câble uniquement les 5 moteurs existants (State Machine, GPS, Sync, Offline, Voice) dans
    `MissionContext.tsx` et remplace les mocks statiques de `MissionScreen` par les vraies données
    — pas de nouveaux écrans, pas de capteurs natifs réels (GPS/réseau système restent injectés en
    factice). `App.tsx` remplace enfin `<MissionScreenPreview />` par `<LiveMissionScreen />`
    (promesse faite depuis le Sprint 004, redifférée à chaque sprint moteur suivant). Bug latent
    corrigé au passage : `missions[0]` ambigu (ordre non garanti de `getAll()`) une fois la vraie
    Mission #9 Supabase coexistant avec la mission de démo en local — `selectedMissionId =
    assigned?.id ?? missions[0]?.id` résout désormais la mission active sans ambiguïté.
    `deriveMissionScreenState.ts` (nouveau, pur, testé) traduit `MissionContextValue` → la forme
    `MissionScreenState` déjà consommée par `MissionScreen` (`MissionScreen` lui-même inchangé, 3
    callbacks optionnels ajoutés : `onReportProblem`/`onResolveProblem`/`onSkipItem`). **Écarts
    assumés** : pas de `missionVoiceBridge.ts` séparé — sans capteur GPS réel, les transitions
    automatiques EN_ROUTE→…→COMPLETED ne se produisent jamais cette passe, donc rien à traduire
    pour elles (seul `VOICE_PROBLEM_RECORDED` est réellement déclenché, sur `reportProblem`) ;
    « Signaler » (`onReportProblem`) reste sans effet réel — aucune UI/taxonomie de `problemCode`
    documentée, inventer une règle métier aurait été hors mandat. **Hors scope, différé** : capteur
    GPS réel (`expo-location`), capteur réseau réel (NetInfo), les 6 nouveaux écrans (Aucune
    mission/Mission active/Fin de mission/Paramètres/Développement/Mode hors ligne), bouton
    « Fermer la mission ». Vérifié : `tsc`/`eslint`/`jest` verts (128/128, 14 suites, dont 8
    nouveaux tests `tests/deriveMissionScreenState.test.ts` + 4 nouveaux tests d'intégration réelle
    `tests/missionContext.test.tsx`)/`expo-doctor` (20/20). **Vérifié sur device** (TECNO KL4,
    rechargement JS via Metro, aucun nouveau build natif requis) : aucune erreur JS, repli honnête
    « Aucune résidence active » affiché correctement (Mission #9 réelle déjà entièrement
    complétée) — comportement voulu, pas un bug. Suivi ouvert non bloquant : revalider avec une
    mission ayant encore des résidences actives pour voir `MissionScreen` alimenté en conditions
    réelles.
  - [x] **Sprint 018 — Fin de mission** (branche `sprint-018-fin-de-mission`, 2026-08-02). Choisi
    comme prochain sprint avec le propriétaire (alternatives écartées : Sprint 017 partie 2/N
    capteurs réels — plus gros ; Sprint 019 mode développement — moins utile sans capteurs réels à
    simuler). Ferme le suivi ouvert « bouton UI Fermer la mission » (`requestMissionComplete`,
    déjà câblé côté serveur depuis le câblage Supabase, restait sans appelant UI) et livre l'écran
    « Fin de mission » de `docs/11` Écrans finaux. **`deriveEndOfMissionState.ts`** (nouveau, pur,
    testé) : `null` sauf mission chargée, `status !== 'COMPLETED'`, aucun item `WAITING`/actif
    restant (même condition que `requestMissionComplete`, lue de `isActiveItemState` — jamais
    dupliquée) ; un item `PROBLEM`/`SKIPPED` restant **n'empêche pas** la fermeture (cas
    `terminee_avec_anomalies`, règle déjà confirmée). **`EndOfMissionScreen.tsx`** (nouveau,
    présentation pure) : résumé/résidences à reprendre/état de sync/opérations en attente + bouton
    « Fermer la mission » (confirmation locale : devient « Mission fermée » après succès, pas
    bloqué par le réseau). **`MissionContext.closeMission()`** (nouveau) : appelle
    `requestMissionComplete`, puis recharge `mission` (pas seulement les items, contrairement à
    `afterMutation` existant — sinon l'écran ne verrait jamais son propre succès), retourne le
    `TransitionResult` brut pour un vrai message d'erreur. `LiveMissionScreen.tsx` essaie
    `deriveEndOfMissionState` avant le repli générique existant. **Gap découvert en testant** (pas
    un bug introduit ici) : la mission de démo reste `READY` pour toujours dans cet environnement
    — rien ne l'a jamais fait passer `IN_PROGRESS` (le bouton « démarrer » de l'écran Mission
    active, `docs/11`, reste hors scope), et `requestMissionComplete` exige `IN_PROGRESS`. Une
    vraie mission Supabase n'a pas ce problème (`fetchAssignedMission` la mappe déjà `IN_PROGRESS`
    quand `statut === 'en_cours'`) — documenté comme limitation connue de l'environnement démo,
    pas corrigé ici (inventer un démarrage automatique aurait été une règle métier non validée).
    **Hors scope, différé** : écran « Aucune mission » dédié, écrans Paramètres/Développement
    (Sprint 019), capteurs GPS/réseau réels (inchangé), export/impression du résumé, annulation de
    la fermeture (`CANCELLED` ne doit jamais être produit par l'opérateur). Vérifié :
    `tsc`/`eslint`/`jest` verts (137/137, 15 suites, dont 7 nouveaux
    `tests/deriveEndOfMissionState.test.ts` + 2 nouveaux tests d'intégration `closeMission` dans
    `tests/missionContext.test.tsx`)/`expo-doctor` (20/20). **Non vérifié sur device** : aucune
    mission réelle actuellement dans l'état éligible (Mission #9 déjà `COMPLETED`) — suivi ouvert,
    même pattern que le Sprint 017.
  - [x] **Sprint 019 — Mode développement** (branche `sprint-019-mode-developpement`,
    2026-08-03, PR : https://github.com/groupe-reca/reca-operateur/pull/3). Choisi comme prochain
    sprint avec le propriétaire (alternative écartée : Sprint 017 partie 2/N, capteurs réels —
    plus gros). Contrairement à ce que son nom suggère, ne
    dépendait pas des capteurs réels : le simulateur GPS existait déjà (Sprint 011-012,
    `createGpsSimulator`), jamais câblé à `MissionContext` faute d'appelant — ce sprint devient son
    appelant. **Barrière d'accès** : pas de système de rôles dans ce repo (en inventer un aurait
    été une règle métier non validée) — utilisé à la place le flag natif `__DEV__` de React Native
    (faux en build release), point d'entrée = le hamburger de `AppHeader` (`onMenu`, no-op partout
    ailleurs). **`MissionContext.dev`** (nouveau) : `gps` (enveloppe `createGpsSimulator` autour du
    vrai GPS Engine, recharge le contexte après chaque appel comme les autres commandes),
    `thresholds` (`DEFAULT_GPS_THRESHOLDS`, jamais overridé dans ce repo — déjà les seuils
    réellement actifs), `getStates`/`getEvents` (agrègent ce que les 4 moteurs exposent déjà),
    `getSyncQueue`/`getTransitions` (lecture directe des repositories, pas de nouvelle méthode
    moteur), `setNetworkOverride` (remplace la constante figée `STUB_NETWORK_STATUS` par une ref
    mutable partagée Sync/Offline), `exportLogs` (JSON, partagé via `Share.share()` — API core RN,
    aucune nouvelle dépendance). **`DevScreen.tsx`** (nouveau) : sections États/Simuler GPS/Simuler
    réseau/Seuils/File/Événements/Historique + export. **« Tester les transitions » réalisé via le
    simulateur GPS** (déplacer vers la résidence cible + avancer le temps) plutôt que des boutons
    qui appelleraient direct les commandes internes du State Machine — plus fidèle au comportement
    réel de production. **Hors scope, différé** : capteurs GPS/réseau réels (inchangé), système de
    rôles serveur pour restreindre l'accès (`__DEV__` suffit à l'exigence documentée). Vérifié :
    `tsc`/`eslint`/`jest` verts (142/142, 16 suites, dont 2 nouveaux tests d'intégration
    `dev.gps`/`dev.setNetworkOverride` dans `tests/missionContext.test.tsx` + 3 nouveaux
    `tests/devScreen.test.tsx`)/`expo-doctor` (20/20). **Non vérifié sur device** : aucun nouveau
    build natif requis (aucune dépendance native ajoutée), mais pas testé physiquement sur
    l'appareil cette passe — suivi ouvert, même pattern que les Sprints 017/018.
  - [x] **Sprint 017 (partie 2/N) — Capteurs réels + écran « Aucune mission »** (branche
    `sprint-017-partie-2-capteurs-reels`, 2026-08-03, PR :
    https://github.com/groupe-reca/reca-operateur/pull/4). Dernier gros morceau différé depuis le
    Sprint 011-012 (« logique d'abord, capteur ensuite ») — choisi comme prochain sprint avec le
    propriétaire (seule alternative restante de la Phase 11 non couverte par 017-1/018/019).
    **`expo-location`** (foreground uniquement — aucune exigence de suivi arrière-plan documentée
    par `docs/04`, l'inventer aurait complexifié les permissions Android sans gain documenté) +
    **`@react-native-community/netinfo`** ajoutés, plugin `app.json` avec la chaîne de permission
    FR. `src/integrations/location/expoLocationProvider.ts` (mirror `expoSpeaker.ts`) — demande
    `requestForegroundPermissionsAsync`, `watchPositionAsync` (`timeInterval`/`distanceInterval`
    non chiffrés par `docs/04`, marqués `@assumption` comme `maxAccuracyMeters`/
    `gpsLostTimeoutSeconds` l'étaient déjà) mappé vers `GpsPosition`, aucun nouveau type.
    `src/integrations/network/expoNetInfoProvider.ts` — `NetInfo.addEventListener` combine
    `isConnected`/`isInternetReachable` (`docs/08` : « ne doit pas se fier uniquement à l'icône
    réseau »), reste un signal *appareil*, pas une accessibilité serveur réelle
    (`SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED` restent hors scope, Sprint 015). **`MissionContext`** :
    `networkStatus.isOnline()` devient `networkOverrideRef ?? realNetworkStatusRef ?? true` — le
    mode dev (Sprint 019) garde la priorité, rien retiré. Chaque fix réel pousse dans
    `gpsEngine.updatePosition()` puis `afterMutation` (même chemin que `dev.gps`, un seul code de
    rechargement qu'un mouvement soit réel ou simulé). `setInterval` (nettoyé au démontage) appelle
    `gpsEngine.checkTimeout()` — le moteur n'a aucun timer propre (`docs/04`). `gpsState` reflète
    enfin la vraie disponibilité (`{available:true}` / `{available:false, reason}` — jamais
    `{available:false}` figé comme avant). `locationProviderOverride`/`networkSensorOverride`
    injectables (tests). **`NoMissionScreen.tsx`** (nouveau, `docs/11` Écran « Aucune mission ») :
    logo, utilisateur (`useAuth()`), état réseau, message clair, bouton Actualiser (nouvelle
    commande `MissionContext.refreshAssignment()` — relance `fetchAssignedMission` sans redémarrer
    capteurs/session), bouton Déconnexion. `LiveMissionScreen.tsx` le rend quand `!mission` ou
    `mission.status === 'COMPLETED'` (remplace le repli générique texte pour ce cas précis).
    **Hors scope, différé** : suivi GPS arrière-plan, `SERVER_UNAVAILABLE`/
    `AUTHENTICATION_DEGRADED`, UI dédiée « capteur indisponible » (aucune exigence documentée),
    écrans Mission active/Paramètres/Mode hors ligne. Vérifié : `tsc`/`eslint`/`jest` verts
    (149/149, 17 suites, dont 3 nouveaux tests d'intégration capteurs réels dans
    `tests/missionContext.test.tsx` + 4 nouveaux `tests/noMissionScreen.test.tsx`)/`expo-doctor`
    (20/20). **Non vérifiable sur device depuis ce VPS** : 2 nouveaux modules natifs, nécessite le
    cycle `expo prebuild`/Android Studio du propriétaire — suivi ouvert, même pattern que chaque
    sprint ayant ajouté une dépendance native (Voice/gesture-handler/async-storage).
- [x] **Écran « Mission active »** (branche `sprint-mission-active-screen`, 2026-08-03, PR :
  https://github.com/groupe-reca/reca-operateur/pull/5, `docs/11-Roadmap.md` Écran « Mission
  active »). Choisi comme prochain sprint avec le propriétaire
  (alternatives écartées : Paramètres — cosmétique ; Mode hors ligne dédié — l'overlay
  `OfflineIndicator` couvre déjà l'essentiel). **Résout le gap documenté au Sprint 018** : la
  mission de démo restait `READY` indéfiniment faute d'un bouton « démarrer » — cet écran en
  devient le premier appelant réel de `requestMissionStart` (State Machine, Sprint 009-010).
  **`MissionContext.missionAlerts`** (nouveau) : chargé au montage
  via `missionAlertRepository.getAll()` filtré aux items de la mission sélectionnée (table jamais
  peuplée à ce jour — honnêtement vide, pas un état inventé). **`MissionContext.startMission()`**
  (nouveau) : même patron que `closeMission` — `requestMissionStart`, recharge `mission` sur
  succès, retourne le `TransitionResult` brut. **`deriveMissionActiveState.ts`** (nouveau, pur,
  testé) : `null` sauf mission chargée et `status === 'READY'` (`ASSIGNED` jamais produit dans ce
  repo, `requestMissionStart` n'autorise que READY→IN_PROGRESS — hors scope, non géré). Retourne
  secteur/date/équipement/nombre de résidences/préparation hors ligne (sync/réseau réels)/alertes
  mappées. **`MissionActiveScreen.tsx`** (nouveau, présentation pure) : résumé mission, équipement,
  résidences, préparation hors ligne, alertes (ou état vide honnête), bouton « Démarrer la
  tournée ». `LiveMissionScreen.tsx` : nouvelle branche entre « Aucune mission » et l'écran de
  travail — **changement de comportement assumé** (une mission `READY` allait auparavant
  directement à l'écran de travail, artefact de l'écran manquant, pas un choix délibéré). **Hors
  scope, différé** : statut `ASSIGNED`, pause/reprise de mission (existent côté State Machine,
  aucune UI ne les expose, `docs/11` ne les mentionne pas pour cet écran), production d'alertes
  (aucun producteur n'existe). Vérifié : `tsc`/`eslint`/`jest` verts (157/157, 18 suites, dont 6
  nouveaux tests purs `tests/deriveMissionActiveState.test.ts` + 2 nouveaux tests d'intégration
  `startMission` dans `tests/missionContext.test.tsx` — a aussi permis de simplifier le test
  `closeMission` existant, qui simulait `requestMissionStart` via une State Machine annexe faute de
  commande de contexte, désormais réelle)/`expo-doctor` (20/20). **Non vérifié sur device** :
  aucune dépendance native ajoutée, mais pas testé physiquement sur l'appareil cette passe — suivi
  ouvert, même pattern que chaque sprint précédent.
- [x] **Premier test réel de bout en bout sur device** (TECNO KL4, 2026-08-03, après merge des
  PR #4/#5) — build/install exécutés **depuis ce VPS** (adb/JDK 17/Android SDK confirmés présents
  et un appareil connecté, contrairement à l'hypothèse par défaut de `CLAUDE.md` — voir
  `memory.md`). **2 bugs réels trouvés** :
  - [ ] **Suivi ouvert, non résolu** — migration SQLite manquante : `sync_operations` (`CREATE
    TABLE IF NOT EXISTS`) n'ajoute jamais les colonnes du Sprint 013-014 sur un appareil ayant déjà
    une base locale antérieure (`table sync_operations has no column named mission_id`).
    Contourné pour ce test (`adb shell pm clear`), pas corrigé — un vrai mécanisme de migration
    versionnée reste à construire avant un pilote multi-appareils.
  - [x] **Corrigé** — `recoverOnStartup` (State Machine, Sprint 009-010) n'était jamais appelé
    dans `MissionContext.tsx` (invisible car la mission de démo pré-active toujours son premier
    item) : après « Démarrer la tournée » sur une vraie mission (tous les items `WAITING`),
    l'écran restait bloqué sur le repli générique. Câblé au montage + dans `startMission()`.
    Vérifié en direct sur l'appareil (carte Mapbox + résidence EN ROUTE affichées immédiatement
    après démarrage) + nouveau test de régression `tests/missionContext.test.tsx`. `tsc`/`eslint`/
    `jest` verts (158/158, 18 suites).
- [ ] **Sprint 020+ — Tests terrain, stabilisation, pilote, production** (Phases 12-15).

## À vérifier

- [x] **Jetons Mapbox créés** (2026-08-01) : `.env.local` sur ce VPS contient les 2 jetons
  (public + secret Downloads:Read, voir `.input/mapbox_key` côté propriétaire). **Reste à faire
  par le propriétaire** : recréer le même `.env.local` sur son **laptop** (là où `expo prebuild`/
  Android Studio s'exécutent — ce fichier n'est jamais commité ni synchronisé par git).
- [x] **Builder l'app en dev build** sur le laptop (2026-08-02) : `npx expo prebuild` → Android
  Studio → build réussi et lancé sur un vrai téléphone. Cause racine du long blocage Gradle :
  AGP résout le toolchain Java des tâches `configureCMakeDebug`/Prefab **indépendamment** du
  réglage IDE « Gradle JVM » — sur cette machine Gradle avait un JDK 25 auto-provisionné en
  cache (`~/.gradle/jdks`), et JDK 22+ émet un warning JEP 451 qu'un bug de
  `GeneratePrefabPackagesKt.reportErrors` traite à tort comme fatal. Fix : JDK 17 standalone
  (Temurin) installé + `org.gradle.java.installations.{paths,auto-download,auto-detect}` dans
  `android/gradle.properties` + `toolchainVersion=17` dans
  `android/gradle/gradle-daemon-jvm.properties`. **Rendu durable** via un plugin de config Expo
  (`plugins/withGradleJdk17.js`, lit `JAVA_HOME` à la volée — portable, pas de chemin codé en
  dur) au lieu de re-éditer `android/` (gitignored, effacé par `prebuild --clean`) à chaque fois.
  Carte Mapbox comparée visuellement sur l'appareil : conforme (style sombre, tracteur, marqueurs,
  tracé, recentrage).
- [x] **Vérifier la survie au redémarrage** (Sprint 007-008, 2026-08-02) : ligne de debug de
  `MissionScreenPreview` confirmée fonctionnelle sur l'appareil (session + résidences depuis
  SQLite). Redémarrage complet de l'app pas encore explicitement re-testé après les ajustements
  de mise en page ci-dessous, mais la persistance SQLite elle-même est déjà prouvée en marche.
- [x] **Premier calibrage visuel réel** (2026-08-02) : premier test sur vrai téléphone a révélé
  des chevauchements — `leftColumn` (carte de progression flottante) débordait par-dessus le
  panneau du bas faute d'`overflow: hidden`/hauteur minimale sur `mapArea` (`MissionScreen.tsx`) ;
  `MissionCard` trop haute (paddings resserrés, label « Progression » qui wrappait) ; le
  sélecteur de variantes + bandeau debug de `MissionScreenPreview` (dev-only) utilisaient des
  offsets `bottom` codés en dur qui entraient en collision avec le vrai panneau du bas sur cet
  écran — remplacés par une vraie barre flex en haut d'écran (plus de pixel deviné). Reste
  possible : widget météo/bouton recentrer coupés si l'espace carte est encore serré sur d'autres
  tailles d'écran — à surveiller au prochain test.
- [x] **Deuxième calibrage visuel réel — TECNO KL4 (360×800dp)** (2026-08-02) : boucle complète
  prebuild/build/install/Metro/capture/comparaison contre `mock-encours.png` (variante « En
  cours »), exécutée entièrement depuis cette machine (voir correction dans `memory.md` — ce
  n'est pas un VPS headless, `adb`/JDK 17/SDK Android y sont disponibles). **Bug critique
  trouvé et corrigé** : `mapArea.minHeight: 220` (`MissionScreen.tsx`) pouvait forcer le total du
  layout à dépasser la hauteur d'écran quand header+`MissionCard`+overlays du haut et feuille
  résidence+barre d'onglets du bas réclamaient déjà tout l'espace — poussant **la barre
  d'onglets entière hors de l'écran physique** (layout non scrollable). Réduit à `minHeight: 60`
  → le panneau du bas (donc la navigation) reste désormais **toujours** accessible, quel que soit
  le contenu du haut. Corrigé aussi : `onDetails` jamais câblé sur `MissionCard` (bouton
  « Détails » absent, remplacé par un pill « Synchronisé » permanent, contrairement à la
  maquette) ; `SyncIndicator` masqué à l'état nominal `synced` (ne s'affiche que si
  `pending`/`syncing`/`offline`/`error`) ; retours à la ligne parasites sur le titre/la ligne méta
  de `MissionCard` et débordement de la valeur `TEMPS` (état PROBLÈME) — tous corrigés par
  `numberOfLines`/`adjustsFontSizeToFit`. Resserrements de tokens `spacing` existants (un cran
  plus petit, aucune valeur inventée) sur `MissionCard`/`CurrentResidenceProgressCard`/
  `AlertCard`/`CurrentResidenceSheet`/`BottomTabBar`/`MissionScreen`. **Limite assumée,
  documentée dans `memory.md`** : la combinaison spécifique EN COURS + overlay hors-ligne +
  alerte de démo (Sprint 004, intentionnelle) reste trop dense pour que
  `CurrentResidenceProgressCard` s'affiche en entier sur cet écran de 360×800dp (repères 4/5 +
  bouton Signaler + FAB/météo coupés proprement par `overflow:hidden`, sans chevauchement cassé) —
  vérifié que les 3 autres variantes (sans cette combinaison) s'affichent, elles, intégralement.
  Vérifié : `tsc`/`eslint` propres, `jest` 27/27 verts.
- [x] **Troisième calibrage — correction du diagnostic EN COURS** (2026-08-02) : l'utilisateur a
  recomparé au rendu réel et signalé que ça ne ressemblait pas à `mock-encours.png` — à raison :
  le constat « limite de densité connue » de la passe précédente sous-estimait le problème.
  Cause racine réelle : `OfflineIndicator`/`AlertsRow` vivaient en flux normal dans `topSection`
  au lieu de flotter au-dessus de la carte (violation de l'invariant Map First), donc pour EN
  COURS (seule variante à combiner les deux, démo Sprint 004) ils écrasaient `mapArea` à une
  bande quasi vide, avec en plus un chevauchement de texte illisible entre la bannière et
  `CurrentResidenceProgressCard`. **Fix** : bannières déplacées en overlay `position:absolute`
  dans `mapArea` (hauteur mesurée par `onLayout`, pas de valeur magique) décalant
  `leftColumn`/`rightColumn` juste en dessous ; `mapArea.minHeight` remis à `60` (un `220` recrée
  le bug de débordement hors écran du tout premier calibrage). Vérifié sur device : plus de
  chevauchement, barre d'onglets toujours visible sur les 4 variantes. La limite résiduelle
  (repères 4/5, bouton Signaler, météo, zoom coupés pour EN COURS+hors-ligne+alerte) est
  désormais propre (juste `overflow:hidden`, sans superposition cassée) — détail dans
  `memory.md`. `tsc`/`eslint`/`jest` (27/27) verts.
- [x] **Simplification du header** (2026-08-02) : sur signalement de l'utilisateur, retrait des
  doublons `AppHeader`/`BottomTabBar` (`Menu`≈`Plus`, `Bell`≈`Alertes`) — `AppHeader` réduit au
  logo seul (plus de `Wordmark` « OPÉRATEUR » sous le logo, sur demande explicite ; « RÉCA
  GROUPE » reste visible car intégré au SVG du logo). `Cloud` (statut sync) déplacé dans
  `MissionCard` à côté de « Détails ». `MissionCard` resserrée (badge décoratif retiré,
  padding/gap réduits) ; fusion des lignes méta secteur/résidences/ETA essayée puis **annulée**
  (tronquait l'ETA silencieusement) — restée sur 2 lignes. Vérifié sur device : plus d'espace
  carte sur les 4 variantes, aucune régression. `tsc`/`eslint`/`jest` (27/27) verts.
- [x] **Retrait de `CurrentResidenceProgressCard`** (2026-08-02) : sur signalement de
  l'utilisateur (carte flottante jugée redondante avec `MissionCard`+`CurrentResidenceSheet`),
  n'est plus rendue par `MissionScreen.tsx`. État+chrono déplacés dans le 3e stat de
  `MissionCard` (remplace le temps total de mission) ; bouton « Signaler un problème » déplacé
  en 4e position dans `CurrentResidenceSheet` (avec Appeler/Note/Itinéraire), qui passe en
  layout colonne (infos pleine largeur puis rangée de boutons) pour ne plus wrapper le texte.
  Barre de dev de `MissionScreenPreview` passée en overlay absolu sur le logo (récupère l'espace
  qu'elle prenait en flux, sans risque de récidive de l'ancien bug — voir `memory.md`). Vérifié
  sur device : les 4 variantes montrent beaucoup plus de carte. `tsc`/`eslint`/`jest` (27/27)
  verts. **Suivi ouvert** : `ProblemStateCard` (état PROBLEM) resserrée au passage mais ses 2
  boutons d'action restent coupés par `overflow:hidden` sur cet appareil étroit — chrono figé
  visible, boutons « Reprendre plus tard »/« Passer à la suivante » non — voir détail et pistes
  dans `memory.md`.
- [x] **Doublon « Recentrer » + météo mal placée** (2026-08-02) : sur signalement de
  l'utilisateur, retrait du `FloatingActionButton` « Recentrer » en double dans `leftColumn`
  (celui de la pile de contrôles carte `rightColumn` suffit). Widget météo déplacé dans
  `rightColumn`, sous cette pile. `leftColumn` ne flotte plus que pour l'état PROBLEM. Vérifié
  sur device : plus de doublon sur les 4 variantes. `tsc`/`eslint`/`jest` (27/27) verts.
- [x] **Câblage Supabase réel — suivi explicite du Sprint 013-014** (2026-08-02) : `reca-app`
  rendu accessible + credentials Supabase fournis par le propriétaire. Voir plan archivé
  `plans.md` pour le détail complet (mapping de statut, 3 blocages soumis au propriétaire,
  réponses reçues, dont la nouvelle règle métier « Fermer la mission »). Livré : écran de login
  minimal (`AuthContext`/`LoginScreen`), `fetchAssignedMission` (télécharge la vraie Mission
  assignée + ses `mission_items` avec les **vrais id serveur**), `SupabaseSyncTransport` (UPDATE
  partiel `missions`/`mission_items`, classification erreurs Postgres), `statusMapping.ts` pur et
  testé. `tsc`/`eslint`/`jest` (91/91, 10 suites)/`expo-doctor` (20/20) verts.
  **Vérifié sur device réel (2026-08-02)** : connexion avec `operateur@groupereca.ca` sur la
  Mission #9 réelle (créée par le propriétaire dans `reca-app`) → inspection directe du fichier
  SQLite pull depuis l'appareil (`adb exec-out run-as ... cat`, DB toujours privée à l'app,
  jamais dans le repo) confirme que `fetchAssignedMission` a bien écrit la vraie Mission (id
  serveur `cd37ac3c-...`, `route`/`operator` = `null` — signature du mapping réel, jamais démo)
  et ses 5 `mission_items` avec adresses géocodées réelles (148/168/220/305/725 Rue Scott,
  Saint-Jérôme) et `contract_id` réels, tous `WAITING`. Authentification → résolution
  `employeeId` → requête RLS-protégée → écriture locale fonctionnent bout-en-bout. **Piège de
  build rencontré** : `@react-native-async-storage/async-storage` (ajouté cette passe) est un
  module natif — le dev build existant sur l'appareil ne le contenait pas
  (`NativeModule: AsyncStorage is null` au premier lancement), a nécessité un nouveau
  `expo prebuild` + `gradlew installDebug` (voir `memory.md` pour les pièges de build rencontrés).
- [x] **Suivi ouvert — bouton « Fermer la mission »** : livré au Sprint 018 —
  `EndOfMissionScreen`/`MissionContext.closeMission()`, voir détail dans la section Sprint 018.
- [x] **Vérification sur device avec une vraie Mission** (2026-08-02) : fait, voir ci-dessus —
  Mission #9 confirmée téléchargée avec succès. **Reste ouvert** : n'a vérifié que le
  téléchargement (lecture) ; la synchronisation retour (écriture — transitions locales vers
  `reca-app`) n'a **pas** été testée bout-en-bout sur device (nécessite de faire progresser la
  Mission via `MissionScreen`, qui ne lit pas encore `MissionContext` — voir suivi ci-dessous).
- [ ] **Suivi ouvert — deux Missions coexistent en local (Mission démo + Mission #9 réelle)** :
  `seedDemoMissionIfEmpty` ne s'est pas déclenché (base déjà non-vide depuis une session
  précédente), donc la Mission de démo (`Route 12A`/« Opérateur Démo ») reste dans la base à
  côté de la vraie Mission #9. `MissionContext` prend `missions[0]` de `missionRepo.getAll()`
  (ordre non garanti, probablement insertion) — ambigu tant qu'un vrai mécanisme de sélection
  n'existe pas. Pas un bug de cette passe (portée = câblage transport, pas gestion du cycle de
  vie multi-mission), mais à traiter avant que `MissionScreen` consomme réellement
  `MissionContext`.

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
