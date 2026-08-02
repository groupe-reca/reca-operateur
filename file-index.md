# file-index.md — Index officiel du dépôt `reca-operateur`

> Où se trouve chaque responsabilité. À mettre à jour quand un fichier important est créé/
> supprimé/déplacé/renommé. On n'indexe pas les fichiers triviaux (protocole `docs/10`).

## Configuration & points d'entrée

- `package.json` — dépendances et scripts (`start`/`android`/`ios`/`web`/`prebuild`/
  `typecheck`/`lint`/`test`). Preset jest `jest-expo`.
- `app.json` — config Expo (nom « RÉCA Opérateur », portrait, thème sombre, `scheme`,
  ids `ca.groupereca.recaoperateur`, icônes, plugins dont `@rnmapbox/maps` depuis Sprint 005-006 —
  le jeton de téléchargement natif n'y figure **pas**, lu directement par Gradle via
  `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`, voir `.env.example`) et `./plugins/withGradleJdk17` (2026-08-02).
- `plugins/withGradleJdk17.js` (2026-08-02) — plugin de config Expo, réécrit
  `android/gradle.properties`/`gradle-daemon-jvm.properties` à chaque `expo prebuild` pour forcer
  Gradle à utiliser le JDK 17 de `JAVA_HOME` (contourne un bug AGP/Prefab avec JDK 22+, voir
  `memory.md`). Nécessaire car `android/` est gitignored/regénéré — pas un fichier à éditer à la
  main sur chaque machine.
- `.env.example` (Sprint 005-006) — `EXPO_PUBLIC_MAPBOX_TOKEN` (public, runtime) +
  `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (secret, build natif uniquement). `.env.local` gitignored.
- `tsconfig.json` — TS strict + flags (`docs/10`), `types: [jest, react]`, alias `@/* → src/*`.
- `babel.config.js` — preset `babel-preset-expo` (requis par le transform jest).
- `eslint.config.js` — flat config `eslint-config-expo` (+ ignores `.input`, natifs, config cjs).
- `index.ts` — enregistre le composant racine (`registerRootComponent(App)`).
- `App.tsx` — charge les polices Manrope (`useAppFonts`) puis, dans `SafeAreaProvider` +
  `AuthProvider`, un `AuthGate` interne : non authentifié → `LoginScreen`, sinon
  `MissionProvider` (Sprint 007-008 — SQLite/`MissionContext`, `employeeId` passé depuis
  `useAuth()`) → `MissionScreenPreview` (temporaire, comme avant). `ComponentGalleryScreen` reste
  dans le repo (référence/tests) mais n'est plus le point d'entrée.
- `metro.config.js` — Metro Expo par défaut + `react-native-svg-transformer` (import `.svg`
  officiels comme composants React).
- `.gitignore` — Expo + natifs générés + `.input/` + `ecosystem.config.cjs`.

## Documentation officielle

- `docs/00-Vision.md … 11-Roadmap.md` — vision, design system, architecture, data, moteurs
  (GPS/Map/Voice), synchronisation, hors ligne, State Machine, standards, roadmap. **À consulter
  avant de toucher au module correspondant.**

## Système de mémoire (racine)

- `memory.md` — décisions officielles, contraintes, pièges (à lire en entier avant une tâche).
- `tasks.md` — état des tâches (fait / à faire / à vérifier).
- `plans.md` — plans d'implémentation (actif + archivés).
- `file-index.md` — ce fichier.

## Code applicatif (`src/`)

Chaque dossier a un `README.md` décrivant sa responsabilité unique.

- `src/app/` — composition racine (providers, thème, montage). Vide.
- `src/screens/`
  - `MissionScreen.tsx` — **écran produit**, désormais **piloté par les données**
    (Sprint 004) : accepte une prop `state: MissionScreenState`, assemble tous les composants,
    mise en page fixe (pas de scroll), rend `CurrentResidenceProgressCard` ou `ProblemStateCard`
    selon l'état, groupe les alertes (`AlertsRow` interne : 1 complète + chip « +N »).
  - `missionScreenState.ts` (Sprint 004) — type `MissionScreenState`/`ActiveResidenceState`/
    `MissionScreenAlert`, source de vérité de ce qui varie entre les 4 variantes opérationnelles.
    Champ `map` (Sprint 005-006) : position simulée + 5 résidences (`n`/`rank`/`coordinate`) +
    `routeWaypoints` — numérotation de rang **indépendante** de l'index de mission (`mission.index`).
  - `missionScreenMocks.ts` (Sprint 004) — 4 objets mock (`EN_ROUTE_MOCK`/`APPROACHING_MOCK`/
    `IN_PROGRESS_MOCK`/`PROBLEM_MOCK`), valeurs de chrono fidèles à `docs/01`. Partagent tous
    `MOCK_MAP` (Sprint 005-006, boucle simulée près de Saint-Jérôme, QC).
  - `MissionScreenPreview.tsx` (Sprint 004, **dev-only**, jamais un écran produit) — sélecteur
    des 4 variantes, point d'entrée temporaire de `App.tsx` en attendant le vrai State Machine.
    Depuis Sprint 007-008 : ligne de debug additive (`useMissionContext()` — session + nombre de
    résidences chargées depuis SQLite), preuve d'intégration légère qui ne touche pas
    `MissionScreen`.
  - `ComponentGalleryScreen.tsx` — galerie de tous les composants (mock data), référence de
    comparaison visuelle. N'est plus le point d'entrée depuis le Sprint 003.
- `src/components/` — UI présentationnelle pure.
  - `ui/` — primitives : `Txt`, `GlassCard`, `PressableScale`, `Icon`, `ProgressBar`,
    `StatusDot`, `Pill`, `NotificationBadge` (Sprint 003, factorisé depuis `AppHeader`).
  - `brand/` — `OfficialLogo` (SVG officiel), `Wordmark` (texte « OPÉRATEUR »).
  - `mission/` — `AppHeader`, `MissionCard` (+ `etaLabel`, bouton « Détails » bordé — corrigé
    Sprint 003), `MissionCardCompact`, `PhaseTimer` (+ `formatDuration` et
    `formatElapsedWithHours` purs, testés), `AlertCard`, `SystemStatus`, `OfflineIndicator`,
    `SyncIndicator`, `CurrentResidenceSheet`, `UpcomingResidenceRow`, `FixedTractor`,
    `CurrentResidenceProgressCard` (colonne gauche ; Sprint 004 : `PhaseTimer` réel + prop
    `color` threadée au lieu de `colors.success` en dur), `ResidenceTasksCard` (panneau droit
    tâches, seulement pour EN COURS), `ProblemStateCard` (Sprint 004, remplace
    `CurrentResidenceProgressCard` au même emplacement pour l'état PROBLÈME).
  - `controls/` — `FloatingActionButton`, `ProblemButton`, `VoiceButton`, `BottomSheet`
    (coquille, gestes de glissement toujours différés — la maquette n'en montre pas le besoin),
    `BottomTabBar` (Sprint 003 ; seuls Carte/Annonce fonctionnels, voir `memory.md`).
  - `map/` — **carte réelle Mapbox** (Sprint 005-006, remplace `SimulatedMapBackground`
    supprimé) : `MissionMapView.tsx` (MapView + Camera + style `dark-v11`, expose `recenter()`
    via ref), `TractorMarker.tsx` (overlay écran fixe, ancre HANDOFF 24 % du bas), `ResidenceMarkerLayer.tsx`
    (5 `PointAnnotation`), `SuggestedRouteLayer.tsx` (`ShapeSource`+`LineLayer` 2 passes),
    `useSuggestedRoute.ts` (hook, repli ligne droite → upgrade Directions API). `ResidenceMapMarker.tsx`
    mis à niveau (couleur par **rang** 1-5 selon `docs/05`, pas juste actif/neutre).
- `src/domain/`
  - `status.ts` — `MissionItemState` (union) + `STATE_LABELS_FR`. Pur, sans React/I/O.
  - `entities.ts` (Sprint 007-008) — `Mission`/`MissionItem`/`StateTransition`/`SyncOperation`/
    `OperatorSession`/`Problem`/`MissionAlertRecord`, champs repris de `docs/03`/`docs/09`.
  - `clock.ts` (Sprint 007-008) — `Clock`/`systemClock` (horloge injectable, `docs/10`).
  - `id.ts` (Sprint 007-008) — `generateId()` (UUID via `expo-crypto`).
- `src/engines/` — moteurs métier hors React (event-based, deps injectées) :
  - `state-machine/` (Sprint 009-010) — autorité métier centrale (`docs/09`), **aucun React**,
    `Db`/`Clock` injectés : `itemTransitions.ts` (graphe `MissionItemState` + `ACTIVE_ITEM_STATES`,
    source unique de « résidence active », remplace l'ancienne constante dupliquée dans
    `MissionContext.tsx`), `missionTransitions.ts` (graphe `MissionStatus`), `types.ts`
    (`TransitionResult`, codes d'erreur, `TransitionOptions`), `stateMachine.ts`
    (`createStateMachine(db, clock)` : verrou par mission, déduplication, écritures atomiques
    MissionItem/Mission + `StateTransition` + `SyncOperation`, toutes les commandes, journal en
    mémoire `getLog()`. `completeItem` appelle `activateNextAdmissibleItem` — Sprint 011-012,
    correction rétroactive de `docs/09` « Activation de la résidence suivante », absente du
    Sprint 009-010 — dans la même transaction, via le hook générique `additionalWrites` sur
    `applyItemTransition`/`writeItemTransition`), `recovery.ts` (`recoverOnStartup` — aucun actif
    / plusieurs actifs), `index.ts` (barrel). **Pas encore câblé** dans
    `MissionContext`/`MissionScreen` (commandes prêtes, sans appelant réel) — le GPS Engine
    (Sprint 011-012) est le premier vrai appelant de ces commandes.
  - `gps/` (Sprint 011-012) — logique GPS pure (`docs/04`), aucun React, `StateMachine`/`Clock`
    injectés : `types.ts` (`GpsPosition`, `GpsThresholds` + `DEFAULT_GPS_THRESHOLDS` — 2 valeurs
    marquées `@assumption`, non chiffrées par `docs/04`), `distance.ts` (`haversineDistanceMeters`,
    pur/testé), `gpsEngine.ts` (`createGpsEngine({ stateMachine, clock, thresholds? })` :
    `setActiveResidence`/`setNextResidence`/`updatePosition`/`checkTimeout`/`on`/`getEvents` —
    valide chaque franchissement de rayon par délai avant d'appeler les commandes du State
    Machine), `simulator.ts` (`createGpsSimulator` — Travail explicite de cette phase, réutilise
    le même moteur que la production), `index.ts` (barrel). **Pas encore câblé** dans
    `MissionContext`/`MissionScreen`, pas de capteur `expo-location` réel (même limite que le
    State Machine).
  - `voice/` (informe) · `sync/` (transmet) · `offline/` (continuité) — encore vides (sprints
    futurs).
  - `map/mapCameraConfig.ts` (Sprint 005-006) — **seule partie du Map Engine réellement « sans
    React »** : constantes caméra (pitch, durées, paliers de zoom), `zoomForState` (pur, testé),
    `cameraPaddingTopFor` (dérive l'offset caméra pour l'ancre du tracteur). Le rendu Mapbox
    lui-même vit dans `src/components/map/` (composants React) — tension architecturale avec
    l'idéal « moteur sans React » de `docs/02`, notée dans `memory.md` (API `@rnmapbox/maps`
    intrinsèquement basée sur des composants).
- `src/context/`
  - `MissionContext.tsx` (Sprint 007-008, étendu 2026-08-02) — `MissionProvider`/
    `useMissionContext()` : charge au montage (migrations → **`fetchAssignedMission` si
    `employeeId` fourni, sinon/en repli seed démo si vide** → session ouverte → lecture), expose
    `mission`/`activeMissionItem`/`nextMissionItems`/`gpsState`/`synchronizationState`/
    `offlineState` (3 derniers = **placeholders typés**, aucun moteur réel derrière).
    `deriveActiveAndNext` (exporté, pur, testé) : résidence active + suivantes, indépendant de
    React/DB — utilise `isActiveItemState` du State Machine (Sprint 009-010) plutôt qu'une
    constante dupliquée.
  - `AuthContext.tsx` (2026-08-02) — `AuthProvider`/`useAuth()` : session Supabase Auth
    (email/mot de passe), résout `employeeId` (`employees.user_id = auth.uid()`) une fois par
    session. Seul point d'entrée authentification — aucun composant n'appelle
    `supabase.auth.*` directement.
- `src/persistence/` (Sprint 007-008, stockage local-first via **`expo-sqlite`**) :
  - `types.ts` — `Db`/`SqlParam` : surface minimale injectée (get-all/get-by-id/upsert/delete +
    transaction), jamais `expo-sqlite` importé ailleurs que dans `db.ts`.
  - `db.ts` — connexion singleton (`getDb()`), import **dynamique** d'`expo-sqlite` (évite de
    toucher le module natif rien qu'en important ce fichier — utile sous Jest).
  - `migrations.ts` — création des 7 tables (`CREATE TABLE IF NOT EXISTS`, idempotent),
    `schema_version`.
  - `repositories/createRepository.ts` — factory générique CRUD (get-all/get-by-id/upsert/
    delete), réutilisé par les 7 repositories spécifiques (`mission`, `missionItem`,
    `stateTransition`, `syncOperation`, `operatorSession`, `problem`, `missionAlert`).
  - `seedDemoMission.ts` — `seedDemoMissionIfEmpty` : Mission + 5 MissionItems de démo (même
    narratif que `missionScreenMocks.ts` — « 224 rue Scott » etc., **pas encore reliés**),
    idempotent, transaction atomique.
- `src/integrations/`
  - `mapbox/mapboxClient.ts` (Sprint 005-006) — point de contact unique du token public, seul
    endroit hors `components/map/` qui importe `@rnmapbox/maps` directement.
  - `mapbox/suggestedRoute.ts` — appel Directions API + repli ligne droite, pur/testable.
  - `supabase/supabaseClient.ts` (2026-08-02) — point de contact unique du client Supabase
    (même projet que RECA App), session persistée via `AsyncStorage`. Seul endroit hors ce
    dossier qui importe `@supabase/supabase-js` directement.
  - `supabase/statusMapping.ts` — traduction pure et testée statut local ↔ serveur
    (`toServerItemStatutOperateur`/`toServerItemStatus`/`toServerMissionStatus`). `CANCELLED`
    (jamais censé être produit par l'opérateur, règle métier confirmée 2026-08-02) lève
    `UnsupportedStatusError` plutôt qu'un mapping silencieux.
  - `supabase/supabaseSyncTransport.ts` — `SyncTransport` réel pour le Sync Engine
    (Sprint 013-014) : UPDATE partiel `missions`/`mission_items` (jamais INSERT/DELETE — RLS
    admin-only), classification erreurs Postgres `TEMPORARY`/`PERMANENT`.
  - `supabase/fetchAssignedMission.ts` — télécharge la Mission assignée à l'opérateur (+
    `mission_items` joints à `contracts`/`clients`) et la seed localement avec les **vrais id
    serveur** (jamais régénérés). `mapServerMissionToLocal` exportée séparément (pure, testée).
  - TTS : vide, sprint futur.
- `src/services/` — orchestration (Authentication, Mission Loader…). Vide.
- `src/hooks/` — hooks React minces (adaptateurs de moteurs/contexte). Vide.
- `src/types/`
  - `sync.ts` — `SyncState` (présentation uniquement).
  - `svg.d.ts` — déclaration de module pour importer les `.svg` comme composants React.
- `src/utils/` — helpers purs. Vide.
- `src/config/`
  - `theme/` — **design tokens**, source unique de vérité visuelle (HANDOFF §3) :
    `colors.ts`, `typography.ts`, `spacing.ts`, `radii.ts`, `glass.ts`, `animation.ts`,
    `statusTone.ts` (état → couleur, UI seulement), `fonts.ts` + `useAppFonts.ts`
    (chargement Manrope), `index.ts` (ré-exports + objet agrégé `theme`).

## Assets officiels (`assets/`)

- `logo-clair.svg`, `logo-sombre.svg` — logo officiel (ne jamais redessiner).
- `tractor.png` — tracteur vue de dessus (marqueur fixe de la carte).
- `map-night.svg` — référence de style carte nuit.
- `icon.png`, `splash-icon.png`, `android-icon-*.png`, `favicon.png` — **placeholders Expo**
  (à remplacer par les vrais visuels avant distribution).

## Tests & scripts

- `tests/components.test.tsx` — `formatDuration` (pur) + rendu `PhaseTimer`/`AlertCard`/
  `MissionCard`.
- `tests/missionScreen.test.tsx` — `formatElapsedWithHours` (pur) + rendu
  `CurrentResidenceProgressCard`/`ProblemStateCard`/`BottomTabBar` (dont un `fireEvent.press`) +
  `MissionScreen` sur plusieurs variantes (`IN_PROGRESS_MOCK`/`PROBLEM_MOCK`/`APPROACHING_MOCK` —
  Sprint 004, dont le groupement d'alertes) avec `SafeAreaProvider` + métriques synthétiques
  (voir piège dans `memory.md`).
- `tests/mapEngine.test.ts` (Sprint 005-006) — `zoomForState`/`cameraPaddingTopFor` (purs) +
  `fetchSuggestedRoute` (repli sans jeton/hors ligne/réponse non-OK, succès avec géométrie réelle).
- `tests/persistence.test.ts` (Sprint 007-008) — `createRepository` générique (CRUD sur une
  entité factice), `seedDemoMissionIfEmpty` (peuplement + idempotence), `deriveActiveAndNext`
  (résidence active + suivantes).
- `tests/testFakeDb.ts` (Sprint 007-008) — faux `Db` en mémoire (pas un mock Jest auto — importé
  directement dans les tests), assez de logique réelle (Map par table, upsert = overwrite) pour
  tester le vrai comportement des repositories sans base ni module natif.
- `tests/stateMachine.test.ts` (Sprint 009-010, étendu Sprint 011-012) — 17 tests du moteur State
  Machine : succès/refus/doublon/hors-ligne (`globalThis.fetch` jamais appelé)/journalisation
  (`getLog()`) pour chaque transition prioritaire de `docs/11` Phase 06, plus résidences
  adjacentes, pause/reprise Mission, problème/résolution, skip/reprise, récupération après
  redémarrage (0 actif / 2 actifs), activation automatique de la résidence suivante après
  complétion (2 tests ajoutés au Sprint 011-012).
- `tests/gpsEngine.test.ts` (Sprint 011-012) — 12 tests du moteur GPS : distance connue, zones
  EN ROUTE→APPROCHE→EN COURS→TERMINÉE avec délais de validation (respectés/réinitialisés si sortie
  prématurée), `detectionRadiusMeters` par résidence, résidence adjacente, filtrage de précision,
  stabilisation du cap, perte/retour GPS (aucune transition métier), 2 tests via `GpsSimulator`.
- `tests/__mocks__/svgMock.tsx` — stub Jest pour les imports `.svg`.
- `tests/__mocks__/lucideMock.js` — stub Jest pour `lucide-react-native` (Proxy → icône no-op ;
  fichier `.js` volontairement, hors du typecheck TS — voir `tsconfig.include`).
- `tests/__mocks__/rnmapboxMock.js` (Sprint 005-006) — stub Jest pour `@rnmapbox/maps` (vues
  natives non rendables sous Jest) : `MapView`/`PointAnnotation`/`ShapeSource`/`LineLayer` en
  simples `View` passthrough (rendent leurs enfants), `Camera` en `forwardRef` avec méthodes
  no-op, `setAccessToken` no-op.
- `tests/__mocks__/expoCryptoMock.js` (Sprint 007-008) — stub Jest pour `expo-crypto` : le vrai
  `randomUUID()` natif retourne silencieusement `undefined` sous Jest (aucune erreur) — ce mock
  génère de vrais UUID v4 en JS pur.
- `tests/statusMapping.test.ts` (2026-08-02) — mapping pur local↔serveur, dont `CANCELLED` →
  `UnsupportedStatusError` et `terminee`/`terminee_avec_anomalies` selon items non résolus.
- `tests/supabaseSyncTransport.test.ts` (2026-08-02) — client Supabase factice minimal (mêmes
  2 formes d'appel exactes que le transport réel, pas le SDK mocké en entier) : succès, RLS
  (42501)→PERMANENT, 0 ligne mise à jour→PERMANENT, erreur inconnue→TEMPORARY, `CANCELLED`
  jamais envoyé au réseau, dérivation `terminee`/`terminee_avec_anomalies`.
- `tests/fetchAssignedMission.test.ts` (2026-08-02) — `mapServerMissionToLocal` pure : ids serveur
  préservés, mapping `statut`→`Mission.status`, les 7 `statut_operateur`→`MissionItemState`,
  repli adresse quand le join `contracts` est absent.
- `tests/setupSupabaseEnv.js` (2026-08-02, `jest.setupFiles`) — fournit des valeurs factices pour
  `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` sous Jest (l'auto-loading `.env.local` est un mécanisme
  `expo start`, pas du simple `jest`).
- `scripts/` — scripts de dev (vide).

## Dépendances critiques (à surveiller — `docs/10`)

- `expo` ~57 · `react-native` 0.86 · `react` 19.2.3 (versions liées).
- Tests : `jest-expo` ~57 · `@testing-library/react-native` **13.3.3** ·
  `react-test-renderer` **19.2.3 (exact)** · `@types/jest` **29.5.14** (aligné SDK 57, pas 30) —
  voir pièges dans `memory.md`.
- Visuel (Sprint 002) : `expo-font` + `expo-asset` (transitif) + `@expo-google-fonts/manrope`,
  `expo-blur`, `react-native-svg` (+ `-transformer` en dev), `expo-splash-screen`,
  `lucide-react-native`.
- Layout (Sprint 003) : `react-native-safe-area-context`.
- **Carte (Sprint 005-006)** : `@rnmapbox/maps` — **premier module natif du projet**, casse la
  compatibilité Expo Go. Nécessite 2 jetons distincts (voir `.env.example` + `memory.md`) : public
  réutilisé de `reca-operator`, secret Downloads:Read nouveau (build natif uniquement).
- **Stockage (Sprint 007-008)** : `expo-sqlite` (base locale, native mais ne casse rien de plus —
  Expo Go déjà hors-jeu depuis Mapbox), `expo-crypto` (UUID — voir piège Jest dans `memory.md`).
- **Supabase (2026-08-02)** : `@supabase/supabase-js`, `@react-native-async-storage/async-storage`
  (persistance de session — mock Jest requis, voir `memory.md`), `react-native-url-polyfill`
  (requis par le SDK Supabase en environnement RN, importé en side-effect dans
  `supabaseClient.ts`). Même projet Supabase que RECA App.
- À venir : TTS.
