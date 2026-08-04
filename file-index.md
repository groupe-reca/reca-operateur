# file-index.md — Index officiel du dépôt `reca-operateur`

> Où se trouve chaque responsabilité. À mettre à jour quand un fichier important est créé/
> supprimé/déplacé/renommé. On n'indexe pas les fichiers triviaux (protocole `docs/10`).

## Configuration & points d'entrée

- `package.json` — dépendances et scripts (`start`/`android`/`ios`/`web`/`prebuild`/
  `typecheck`/`lint`/`test`). Preset jest `jest-expo`.
- `app.json` — config Expo (nom « RÉCA Opérateur », portrait, thème sombre, `scheme`,
  ids `ca.groupereca.recaoperateur`, icônes, plugins dont `@rnmapbox/maps` depuis Sprint 005-006 —
  le jeton de téléchargement natif n'y figure **pas**, lu directement par Gradle via
  `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`, voir `.env.example`), `expo-location` (2026-08-03, Sprint 017
  partie 2/N — chaîne de permission FR `locationWhenInUsePermission`, foreground uniquement),
  `./plugins/withGradleJdk17` (2026-08-02), `./plugins/withDevSingleAbi` (2026-08-02).
- `plugins/withGradleJdk17.js` (2026-08-02) — plugin de config Expo, réécrit
  `android/gradle.properties`/`gradle-daemon-jvm.properties` à chaque `expo prebuild` pour forcer
  Gradle à utiliser le JDK 17 de `JAVA_HOME` (contourne un bug AGP/Prefab avec JDK 22+, voir
  `memory.md`). Nécessaire car `android/` est gitignored/regénéré — pas un fichier à éditer à la
  main sur chaque machine.
- `plugins/withDevSingleAbi.js` (2026-08-02) — **dev-only**, restreint
  `reactNativeArchitectures` à `arm64-v8a` (seul ABI du TECNO KL4 de test) : un build 4-ABI de
  `react-native-reanimated`/`gesture-handler`/`worklets` dépassait la limite de 10 min de
  l'outillage de build utilisé ici. **À retirer/conditionner avant un vrai build multi-appareils
  ou de distribution** (voir `memory.md`).
- `.env.example` — `EXPO_PUBLIC_MAPBOX_TOKEN`/`RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (Sprint 005-006) +
  `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` (2026-08-02, même projet que
  `reca-app`). `.env.local` gitignored.
- `tsconfig.json` — TS strict + flags (`docs/10`), `types: [jest, react]`, alias `@/* → src/*`.
- `babel.config.js` — preset `babel-preset-expo` + `react-native-reanimated/plugin` (2026-08-02,
  doit rester le dernier plugin listé).
- `eslint.config.js` — flat config `eslint-config-expo` (+ ignores `.input`, natifs, config cjs).
- `index.ts` — enregistre le composant racine (`registerRootComponent(App)`).
- `App.tsx` — charge les polices Manrope (`useAppFonts`) puis, dans `GestureHandlerRootView`
  (2026-08-02, requis par `react-native-gesture-handler`) → `SafeAreaProvider` +
  `AuthProvider`, un `AuthGate` interne : non authentifié → `LoginScreen`, sinon
  `MissionProvider` (Sprint 007-008 — SQLite/`MissionContext`, `employeeId` passé depuis
  `useAuth()`) → **`LiveMissionScreen`** (Sprint 017 partie 1/N, 2026-08-02 — remplace enfin
  `MissionScreenPreview`, promesse faite depuis le Sprint 004 ; rend aussi `EndOfMissionScreen`
  depuis le Sprint 018 quand la mission est éligible à la fermeture). `MissionScreenPreview`/
  `ComponentGalleryScreen` restent dans le repo (référence/tests) mais ne sont plus le point
  d'entrée.
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
  - `LiveMissionScreen.tsx` (Sprint 017 partie 1/N, 2026-08-02, **nouveau point d'entrée réel** ;
    étendu Sprints 018/019/017-partie-2/Mission-active/Paramètres) — `useMissionContext()` →
    `deriveMissionScreenState(ctx, new Date())` (mémoïsé sur les champs utiles, pas sur `ctx`
    entier) → `MissionScreen`. Ordre de priorité : `loading` → `__DEV__ && devScreenOpen`
    (Sprint 019, `DevScreen`, état local mis à `true` via « Mode développement » dans
    `SettingsScreen`, jamais en build release) → `settingsOpen` (Sprint « Paramètres »,
    `SettingsScreen` — **vraie destination du hamburger désormais**, remplace le branchement
    direct vers `DevScreen`) → `deriveEndOfMissionState(ctx, new Date())` non nul (Sprint 018,
    `EndOfMissionScreen` — mission éligible à la fermeture) → `!mission || mission.status ===
    'COMPLETED'` (Sprint 017 partie 2/N, `NoMissionScreen` — vrai écran « Aucune mission »
    `docs/11`, remplace l'ancien repli générique pour ce cas précis) → `missionActiveState` non nul
    (Sprint « Mission active », `mission.status === 'READY'`, `MissionActiveScreen` — **change le
    comportement précédent** : une mission `READY` allait auparavant directement à l'écran de
    travail, artefact de l'écran manquant) → `screenState`/`MissionScreen` → repli minimal texte
    résiduel (mission `IN_PROGRESS` sans aucun `MissionItem` — combinaison non décrite par
    `docs/11`). Câble `onResolveProblem`/`onSkipItem` aux commandes réelles du contexte ;
    **`onReportProblem` volontairement sans
    effet** — aucune UI/taxonomie de `problemCode` documentée, voir `memory.md`.
    `handleCloseMission` (Sprint 018)/`handleStartMission` (Sprint « Mission active ») gèrent leur
    état `closing`/`closed`/`closeError`/`starting`/`startError` local, appellent
    `ctx.closeMission()`/`ctx.startMission()`.
  - `deriveMissionScreenState.ts` (Sprint 017 partie 1/N, pur, testé
    `tests/deriveMissionScreenState.test.ts` ; corrigé 2026-08-03) — traduit `MissionContextValue`
    (mission/résidence active/items/sync/offline/**gpsState**) vers `MissionScreenState` sans
    toucher `MissionScreen`. Cherche un item `PROBLEM` dans `allMissionItems` (exclu de
    `ACTIVE_ITEM_STATES`, donc jamais `activeMissionItem`) séparément. `map.position` = le vrai fix
    GPS (`ctx.gpsState.position`) quand disponible — **bug réel trouvé/corrigé sur device** : ça
    retombait toujours sur la coordonnée de la résidence, même capteur réel câblé (voir
    `memory.md`) ; ne retombe sur la résidence que tant qu'aucun fix n'est encore arrivé. Champs
    sans source de donnée réelle encore laissés en placeholder honnête plutôt qu'inventés
    (`residenceDistanceLabel`/`residenceEtaLabel`/`totalEtaLabel`/`alerts`/`tasks`) — `docs/10`
    « ne jamais masquer une erreur par une valeur fictive ». `missionSeconds`/`timerSeconds`
    calculés une fois à la dérivation, pas un ticker.
  - `deriveEndOfMissionState.ts` (Sprint 018, pur, testé
    `tests/deriveEndOfMissionState.test.ts`) — `null` sauf si la mission est éligible à la
    fermeture : chargée, `status !== 'COMPLETED'`, aucun `MissionItem` `WAITING` ni actif
    (`isActiveItemState`, même source que `requestMissionComplete` côté State Machine — jamais
    dupliquée). Un item `PROBLEM`/`SKIPPED` restant **n'empêche pas** l'éligibilité (cas
    `terminee_avec_anomalies`, règle métier confirmée au câblage Supabase). Sinon retourne
    résumé/décompte/liste des résidences à problème/durée de mission/état de sync/opérations en
    attente — tout lu de `MissionContextValue`, rien d'inventé.
  - `EndOfMissionScreen.tsx` (Sprint 018) — écran « Fin de mission » (`docs/11` Écrans finaux) :
    présentation pure (props `state`/`onClose`/`closing`/`closed`/`closeError`), aucun accès
    Supabase/State Machine direct. Résumé + résidences à reprendre + `SyncIndicator`/opérations en
    attente + bouton « Fermer la mission » (confirmation locale : devient « Mission fermée » après
    succès, pas un blocage réseau).
  - `DevScreen.tsx` (Sprint 019, testé `tests/devScreen.test.tsx`) — écran « Développement »
    (`docs/11` Écrans finaux), gardé par `__DEV__` côté appelant (`LiveMissionScreen.tsx`), pas de
    logique d'accès ici. Props `ctx: MissionContextValue`/`onClose`. Sections États (`dev.getStates()`)
    /Simuler GPS (`dev.gps` — cible = `activeMissionItem`/premier `nextMissionItems`, boutons
    Aller à la cible/+5s/+30s/Perdre-Retrouver le signal ; « tester les transitions » se fait via
    ce simulateur, pas des boutons State Machine bruts)/Simuler réseau (`dev.setNetworkOverride`)/
    Seuils (`dev.thresholds`)/File (`dev.getSyncQueue()`)/Événements (`dev.getEvents()`)/Historique
    des transitions (`dev.getTransitions()`) + bouton Exporter (`dev.exportLogs()` →
    `Share.share()`, API core React Native).
  - `NoMissionScreen.tsx` (Sprint 017 partie 2/N, testé `tests/noMissionScreen.test.tsx`) — écran
    « Aucune mission » (`docs/11` Écrans finaux) : logo officiel, utilisateur (`useAuth()` lu
    directement — `AuthProvider` enveloppe déjà tout l'arbre, aucun threading de prop nécessaire),
    état réseau (`ctx.offlineState.status`), message clair, bouton Actualiser
    (`ctx.refreshAssignment()`), bouton Déconnexion (`useAuth().logout()`, masqué si non
    authentifié). « Ne doit pas ressembler à un tableau de bord administratif » — pas de
    liste/tableau, juste ce que `docs/11` demande.
  - `SettingsScreen.tsx` (Sprint « Migration SQLite versionnée + écran Paramètres », 2026-08-03,
    étendu Sprint « Réglages du rayon de détection » 2026-08-04, testé
    `tests/settingsScreen.test.tsx`) — écran « Paramètres » (`docs/11` Écrans finaux) : seuls les
    items avec un vrai mécanisme sont construits — Voix (`ctx.voiceEnabled`/`setVoiceEnabled`,
    `Switch`), Compte (email + Déconnexion via `useAuth()`), **Détection GPS** (2 `TextInput`
    numériques « Rayon en approche »/« Rayon en cours », état texte local appliqué seulement au
    bouton « Enregistrer » — pas de sync live sur `ctx.detectionRadii` pour ne pas écraser une
    saisie en cours —, erreur inline `testID="radii-error"` ou confirmation `testID="radii-saved"`,
    appelle `ctx.setDetectionRadii()`), Thème (affichage statique « Sombre »), Version
    (`package.json`). Volume/carte/préférences d'affichage/confidentialité délibérément absents
    (aucun mécanisme réel, voir `memory.md`). Item « Mode développement » (ouvre `DevScreen`)
    affiché seulement si `onOpenDevMode` est fourni — `__DEV__` côté appelant. **Point d'entrée réel
    du hamburger** (`AppHeader`/`MissionScreen.onMenu`) depuis le Sprint Paramètres — remplace le
    branchement direct vers `DevScreen` du Sprint 019.
  - `MissionActiveScreen.tsx` (Sprint « Mission active », 2026-08-03) — écran « Mission active »
    (`docs/11` Écrans finaux) : résumé mission (secteur/date), équipement (`Mission.equipment`),
    nombre de résidences, section « Préparation hors ligne » (état sync/réseau réels, pas un
    nouveau mécanisme de téléchargement — les données sont déjà locales), alertes importantes
    (`ctx.missionAlerts` ou état vide honnête — la table n'a encore aucun producteur), bouton
    « Démarrer la tournée » → `ctx.startMission()`. Présentation pure, props `state`/`onStart`/
    `starting`/`startError`.
  - `deriveMissionActiveState.ts` (Sprint « Mission active », pur, testé
    `tests/deriveMissionActiveState.test.ts`) — `null` sauf mission chargée et
    `mission.status === 'READY'` (`ASSIGNED` jamais produit dans ce repo, hors scope). Traduit
    `MissionContextValue` → secteur/date/équipement/décompte résidences/état sync-réseau/alertes,
    rien d'inventé.
  - `MissionScreen.tsx` — **écran produit**, désormais **piloté par les données**
    (Sprint 004) : accepte une prop `state: MissionScreenState` + 3 callbacks optionnels
    (`onReportProblem`/`onResolveProblem`/`onSkipItem`, Sprint 017 partie 1/N, no-op par défaut) +
    `onMenu?` (Sprint 019, câblé à `AppHeader` — remplace le `() => {}` en dur, seul appelant réel
    aujourd'hui = `LiveMissionScreen.tsx` ouvrant `DevScreen` en `__DEV__`), assemble tous les
    composants, mise en page fixe (pas de scroll), rend `CurrentResidenceProgressCard` ou
    `ProblemStateCard` selon l'état, groupe les alertes (`AlertsRow` interne : 1 complète + chip
    « +N »).
  - `missionScreenState.ts` (Sprint 004) — type `MissionScreenState`/`ActiveResidenceState`/
    `MissionScreenAlert`, source de vérité de ce qui varie entre les 4 variantes opérationnelles.
    Champ `map` (Sprint 005-006) : position simulée + 5 résidences (`n`/`rank`/`coordinate`) +
    `routeWaypoints` — numérotation de rang **indépendante** de l'index de mission (`mission.index`).
  - `missionScreenMocks.ts` (Sprint 004) — 4 objets mock (`EN_ROUTE_MOCK`/`APPROACHING_MOCK`/
    `IN_PROGRESS_MOCK`/`PROBLEM_MOCK`), valeurs de chrono fidèles à `docs/01`. Partagent tous
    `MOCK_MAP` (Sprint 005-006, boucle simulée près de Saint-Jérôme, QC).
  - `MissionScreenPreview.tsx` (Sprint 004, **dev-only**, jamais un écran produit, **plus le
    point d'entrée depuis Sprint 017 partie 1/N**) — sélecteur des 4 variantes, gardé comme
    référence/tests. Ligne de debug additive (`useMissionContext()`, Sprint 007-008).
  - `ComponentGalleryScreen.tsx` — galerie de tous les composants (mock data), référence de
    comparaison visuelle. N'est plus le point d'entrée depuis le Sprint 003.
- `src/components/` — UI présentationnelle pure.
  - `ui/` — primitives : `Txt`, `GlassCard`, `PressableScale`, `Icon`, `ProgressBar`,
    `StatusDot`, `Pill`, `NotificationBadge` (Sprint 003, factorisé depuis `AppHeader`).
  - `brand/` — `OfficialLogo` (SVG officiel), `Wordmark` (texte « OPÉRATEUR »).
  - `mission/` — `AppHeader` (refonte 2026-08-02 : hamburger/logo+OPÉRATEUR/sync/cloche restaurés,
    props `onMenu/onAlerts/alertsCount/syncState`, annule la simplification "logo seul" du même
    jour), `MissionCard` (pleine, plus utilisée par `MissionScreen` depuis la refonte — gardée
    pour `ComponentGalleryScreen`), `MissionCardCompact` (réécrite 2026-08-02 selon
    `.input/PLAN-ECRANS-OPERATEUR-RECA.md` : titre+Détails/secteur/ligne résidences+%+état·chrono
    + barre 3px — remplace `MissionCard` dans `MissionScreen`), `PhaseTimer` (+ `formatDuration`
    et `formatElapsedWithHours` purs, testés), `AlertCard`, `SystemStatus`, `OfflineIndicator`,
    `SyncIndicator` (exporte aussi `SYNC_STATE_META`, réutilisé par `AppHeader`),
    `CurrentResidenceSheet` (prop `bare` 2026-08-02 : contenu nu sans `GlassCard` propre, pour
    vivre dans `BottomSheet`), `UpcomingResidenceRow`, `FixedTractor`,
    `CurrentResidenceProgressCard` (colonne gauche ; Sprint 004 : `PhaseTimer` réel + prop
    `color` threadée au lieu de `colors.success` en dur), `ResidenceTasksCard` (panneau droit
    tâches, seulement pour EN COURS), `ProblemStateCard` (prop `bare` 2026-08-02, remplace
    `CurrentResidenceSheet` comme contenu du `BottomSheet` en état PROBLÈME — plus de colonne
    flottante étroite ; actions en `Pressable` brut, pas `PressableScale`, voir `memory.md`
    pour le bug de rendu texte contourné).
  - `controls/` — `FloatingActionButton`, `ProblemButton`, `VoiceButton` (label texte optionnel
    depuis 2026-08-02 — flotte désormais seul, hors `BottomTabBar`), `BottomSheet` (**refondue
    2026-08-02** : vrais gestes `react-native-gesture-handler`+`react-native-reanimated`, snap
    25/50/75/100 réel, plein-bord), `BottomTabBar` (Sprint 003 ; **plus rendue par
    `MissionScreen`** depuis la refonte 2026-08-02 — conservée pour `ComponentGalleryScreen`,
    seuls Carte/Annonce fonctionnels, voir `memory.md`).
  - `map/` — **carte réelle Mapbox** (Sprint 005-006, remplace `SimulatedMapBackground`
    supprimé) : `MissionMapView.tsx` (MapView + Camera + style `dark-v11`, expose `recenter()`
    via ref ; **corrigé 2026-08-03** — `<Mapbox.Camera>` n'applique ses props que sur le premier
    montage, un `useEffect` rappelle désormais `setCamera()` à chaque changement de `position`,
    sinon la carte ne suivait jamais le tracteur automatiquement, voir `memory.md`),
    `TractorMarker.tsx` (overlay écran fixe, ancre HANDOFF 24 % du bas), `ResidenceMarkerLayer.tsx`
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
    / plusieurs actifs), `index.ts` (barrel). **Câblé dans `MissionContext`** depuis Sprint 017
    partie 1/N (2026-08-02) : `reportProblem`/`resolveProblem`/`skipItem` exposés au contexte,
    câblés aux boutons existants de l'UI.
  - `gps/` (Sprint 011-012) — logique GPS pure (`docs/04`), aucun React, `StateMachine`/`Clock`
    injectés : `types.ts` (`GpsPosition`, `GpsThresholds` + `DEFAULT_GPS_THRESHOLDS` — 2 valeurs
    marquées `@assumption`, non chiffrées par `docs/04`), `distance.ts` (`haversineDistanceMeters`,
    pur/testé), `gpsEngine.ts` (`createGpsEngine({ stateMachine, clock, thresholds? })` :
    `setActiveResidence`/`setNextResidence`/`updatePosition`/`checkTimeout`/`on`/`getEvents` —
    valide chaque franchissement de rayon par délai avant d'appeler les commandes du State
    Machine ; `thresholds` mutable depuis le Sprint « Réglages du rayon de détection »
    (2026-08-04) — `getThresholds()`/`setThresholds(update)` permettent de changer les rayons en
    direct sans recréer le moteur, donc sans perdre l'état de mission en cours), `simulator.ts`
    (`createGpsSimulator` — Travail explicite de cette phase, réutilise le même moteur que la
    production), `index.ts` (barrel). **Câblé dans `MissionContext`** depuis Sprint 017 partie
    1/N (2026-08-02) : `setActiveResidence` appelé à chaque changement de résidence active,
    capteur `expo-location` réel câblé depuis Sprint 017 partie 2/N. Rayons persistés/réglables
    depuis Paramètres (voir `src/integrations/settings/detectionRadiiStorage.ts` ci-dessous).
  - `sync/` (Sprint 013-014) — moteur pur de synchronisation (`docs/07`), aucun React, `Db`/
    `Clock`/`transport`/`network` injectés : `backoff.ts` (`computeBackoffDelaySeconds`, testé),
    `priority.ts` (`selectBatch` — ordre intra-mission jamais cassé), `syncEngine.ts`
    (`createSynchronizationEngine` : `runSyncCycle`/`recoverOnStartup`/`retryOperation`/
    `getSynchronizationState`/`on`/`getEvents`), `types.ts`, `index.ts`. Transport réel :
    `src/integrations/supabase/supabaseSyncTransport.ts`. **Câblé dans `MissionContext`** depuis
    Sprint 017 partie 1/N (2026-08-02) : `runSyncCycle()` après chaque mutation + au montage,
    `synchronizationState` exposé réel (`network` reste un stub `{isOnline: () => true}` — capteur
    NetInfo réel différé).
  - `offline/` (Sprint 015, 2026-08-02, **portée noyau** — voir `plans.md`) — moteur pur de
    détection de connectivité (`docs/08`), aucun timer propre (même principe que le GPS Engine) :
    `types.ts` (`ConnectivityStatus` = 4 états `ONLINE/DEGRADED/OFFLINE/RECOVERING`, réduit des 6
    de `docs/08` — `SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED` différés), `offlineEngine.ts`
    (`createOfflineEngine({clock, networkStatus, consecutiveFailureThreshold?,
    recoveryValidationDelaySeconds?})` : `checkConnectivity()`/`recordOperationOutcome()`/
    `getState()`/`on()`/`getEvents()` — réutilise `NetworkStatusProvider` du Sync Engine, pas de
    second contrat réseau inventé), `index.ts`. **Câblé dans `MissionContext.offlineState`**
    depuis Sprint 017 partie 1/N (2026-08-02) : `checkConnectivity()` au montage, `offlineState`
    exposé réel (même stub réseau que le Sync Engine — capteur réel différé).
  - `voice/` (Sprint 016, 2026-08-02) — moteur pur d'annonces vocales (`docs/06`), aucun timer
    propre : `types.ts` (`VoiceInputEvent`/`VoicePriority`/`VoiceAnnouncement`/`Speaker` injecté/
    `VoiceEngineEvent`), `textFormatting.ts` (`normalizeAddressForSpeech` — abréviations
    `r./av./boul./ch./N/S/E/O`, prononciation des nombres en toutes lettres volontairement hors
    scope, voir `memory.md`), `messages.ts` (`buildAnnouncement` — un constructeur pur par type
    d'événement, phrasés `docs/06` verbatim, regroupe résidence terminée + prochaine résidence),
    `voiceEngine.ts` (`createVoiceEngine({clock, speaker, cooldownMs?})` :
    `handleEvent`/`processNext`/`repeatCurrentContext`/`setEnabled`/`on`/`getEvents` — file
    triée priorité→heure, anti-répétition par clé, expiration croisée, interruption uniquement
    par du `CRITICAL`, cooldown contournable pour la répétition manuelle), `index.ts` (barrel).
    Intégration réelle : `src/integrations/voice/expoSpeaker.ts`. **Partiellement câblé dans
    `MissionContext`** depuis Sprint 017 partie 1/N (2026-08-02) : `reportProblem` pousse
    `VOICE_PROBLEM_RECORDED` puis pompe `processNext()` en boucle légère après chaque mutation —
    pas de traducteur générique pour les autres événements (`EN_ROUTE`/`APPROACHING`/…) car sans
    capteur GPS réel ces transitions ne se produisent jamais automatiquement cette passe, voir
    `plans.md`. Toujours **pas câblé** à `VoiceButton` (bouton reste no-op).
  - `map/mapCameraConfig.ts` (Sprint 005-006) — **seule partie du Map Engine réellement « sans
    React »** : constantes caméra (pitch, durées, paliers de zoom), `zoomForState` (pur, testé),
    `cameraPaddingTopFor` (dérive l'offset caméra pour l'ancre du tracteur). Le rendu Mapbox
    lui-même vit dans `src/components/map/` (composants React) — tension architecturale avec
    l'idéal « moteur sans React » de `docs/02`, notée dans `memory.md` (API `@rnmapbox/maps`
    intrinsèquement basée sur des composants).
- `src/context/`
  - `MissionContext.tsx` (Sprint 007-008, réécrit Sprint 017 partie 1/N — 2026-08-02 ; étendu
    Sprints 018/019/017-partie-2/Mission-active) — `MissionProvider`/`useMissionContext()` : au
    montage, instancie les 5 moteurs réels (State Machine/GPS/Sync/Offline/Voice, refs stables)
    puis charge (migrations → **`fetchAssignedMission` si `employeeId` fourni, sinon/en repli seed
    démo si vide** → mission sélectionnée sans ambiguïté via `assigned?.id ?? missions[0]?.id` →
    alertes de la mission chargées (Sprint « Mission active », `missionAlertRepository.getAll()`
    filtré aux items sélectionnés) → session ouverte → démarre le capteur GPS réel si une mission
    existe (Sprint 017 partie 2/N) →
    `offlineEngine.checkConnectivity()`/`syncEngine.recoverOnStartup()`/`runSyncCycle()`). Expose
    `mission`/`activeMissionItem`/`nextMissionItems`/`allMissionItems`/`missionAlerts` (Sprint
    « Mission active », chargé une fois au montage — aucun producteur n'écrit encore dans
    `mission_alerts`, jamais rafraîchi par `afterMutation`)/`gpsState` (**réel** depuis le Sprint
    017 partie 2/N — `{available:true}` ou `{available:false, reason}`, jamais figé)/
    `synchronizationState`/`offlineState` (réels depuis leurs sprints respectifs) + les commandes
    `reportProblem`/`resolveProblem`/`skipItem`/**`closeMission`** (Sprint 018 : voir plus bas) +
    **`startMission`** (Sprint « Mission active » — `requestMissionStart`, même patron que
    `closeMission`, recharge `mission` sur succès **et appelle
    `recoverOnStartup` du State Machine** — bug réel trouvé/corrigé sur device le 2026-08-03, voir
    `memory.md` : sans ça, une vraie mission dont tous les items sont encore `WAITING` n'avait
    aucun écran à afficher après démarrage) + **`refreshAssignment`** (Sprint 017 partie 2/N
    — relance `fetchAssignedMission` sans redémarrer capteurs/session, appelée par
    `NoMissionScreen`) + **`voiceEnabled`/`setVoiceEnabled`** (Sprint « Paramètres » — câble
    `voiceEngine.setEnabled`/`isEnabled` du Sprint 016, jamais appelé jusqu'ici, appelé par
    `SettingsScreen`) + **`detectionRadii`/`setDetectionRadii`** (Sprint « Réglages du rayon de
    détection », 2026-08-04 — `detectionRadii` : état React miroir de `gpsEngine.getThresholds()`,
    initialisé depuis `detectionRadiiStorage.load()` avant même la création du GPS Engine
    (`thresholds: persistedRadii` passé à `createGpsEngine`) ; `setDetectionRadii(update)` valide
    (rayons positifs, rayon « en cours » < rayon « en approche »), appelle `gpsEngine.
    setThresholds()`, persiste via `detectionRadiiStorage.save()`, met à jour l'état React —
    `detectionRadiiStorageOverride` injectable) + **`dev`** (Sprint 019, `DevTools` — `gps`
    enveloppe `createGpsSimulator` autour de `gpsEngineRef` avec rechargement `afterMutation`
    intégré ; `thresholds` lit désormais `detectionRadii` (état React live, plus la constante
    figée `DEFAULT_GPS_THRESHOLDS`) — reflète les vrais seuils actifs, y compris après un
    changement utilisateur ; `getStates`/`getEvents` agrègent ce que les 4 moteurs exposent déjà ;
    `getSyncQueue`/`getTransitions` lisent les repositories directement ; `setNetworkOverride`
    pilote `networkOverrideRef`, garde priorité sur le signal réseau réel ; `exportLogs` assemble
    tout en JSON pour `Share.share()`, `thresholds` y reflète aussi `detectionRadii`).
    `closeMission` : `requestMissionComplete`, puis — contrairement aux autres commandes — recharge
    aussi `mission` via `missionRepo.getById`, pas seulement les items, sinon l'écran ne verrait
    jamais son propre succès ; retourne le `TransitionResult` brut. **Réseau** (Sprint 017 partie
    2/N) : `networkStatus.isOnline()` = `networkOverrideRef.current ?? realNetworkStatusRef.current`
    — `realNetworkStatusRef` mis à jour par `createNetInfoSensor()` (écouteur indépendant, propre
    `useEffect`), remplace l'ancienne constante figée `STUB_NETWORK_STATUS`, toujours partagée
    Sync/Offline. **GPS réel** : chaque fix poussé par `createExpoLocationProvider()` appelle
    `gpsEngine.updatePosition()` puis `afterMutation` — **même chemin** que `dev.gps` (un seul code
    de rechargement, réel ou simulé) ; `setInterval` (nettoyé au démontage) appelle
    `gpsEngine.checkTimeout()` (le moteur n'a aucun timer propre, `docs/04`).
    `deriveActiveAndNext` (exporté, pur, testé) : résidence active + suivantes, indépendant de
    React/DB — utilise `isActiveItemState` du State Machine (Sprint 009-010) plutôt qu'une
    constante dupliquée. `getDbOverride`/`syncTransportOverride`/`speakerOverride`/
    `locationProviderOverride`/`networkSensorOverride` injectables (tests uniquement — la règle
    « jamais de vrai réseau/capteur touché en test » s'applique à tous, voir
    `tests/missionContext.test.tsx`).
  - `AuthContext.tsx` (2026-08-02) — `AuthProvider`/`useAuth()` : session Supabase Auth
    (email/mot de passe), résout `employeeId` (`employees.user_id = auth.uid()`) une fois par
    session. Seul point d'entrée authentification — aucun composant n'appelle
    `supabase.auth.*` directement.
- `src/persistence/` (Sprint 007-008, stockage local-first via **`expo-sqlite`**) :
  - `types.ts` — `Db`/`SqlParam` : surface minimale injectée (get-all/get-by-id/upsert/delete +
    transaction), jamais `expo-sqlite` importé ailleurs que dans `db.ts`.
  - `db.ts` — connexion singleton (`getDb()`), import **dynamique** d'`expo-sqlite` (évite de
    toucher le module natif rien qu'en important ce fichier — utile sous Jest).
  - `migrations.ts` (versionné depuis 2026-08-03, testé `tests/migrations.test.ts`) — création des
    7 tables (`CREATE TABLE IF NOT EXISTS`, idempotent mais seulement pour une table qui n'existe
    pas encore), `schema_version` réellement utilisé maintenant : `SCHEMA_VERSION = 2`, tableau
    `MIGRATIONS` ordonné, `migrateTo2` ajoute les 9 colonnes du Sprint 013-014 à `sync_operations`
    (`ALTER TABLE ADD COLUMN` via `addColumnIfMissing`/`PRAGMA table_info`) — **bug réel
    trouvé/corrigé sur device** : un appareil ayant une base antérieure au Sprint 013-014 plantait
    sur chaque écriture (`table sync_operations has no column named mission_id`), voir `memory.md`.
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
  - `voice/expoSpeaker.ts` (Sprint 016, 2026-08-02) — implémentation réelle de l'interface
    `Speaker` du Voice Engine via `expo-speech` (voix française canadienne → française générique
    → toute voix française → défaut système, jamais inventée ; `speak()` résout sur fin naturelle
    **ou** arrêt, requis pour que `stop()` débloque proprement le moteur). Seul endroit hors ce
    fichier qui importe `expo-speech` directement.
  - `location/expoLocationProvider.ts` (Sprint 017 partie 2/N, 2026-08-03, mirror `expoSpeaker.ts`)
    — seul endroit qui importe `expo-location` directement. `createExpoLocationProvider()` :
    `requestForegroundPermissionsAsync` puis `watchPositionAsync` (`timeInterval`/
    `distanceInterval` non chiffrés par `docs/04`, `@assumption`) mappé vers `GpsPosition`
    (`src/engines/gps/types.ts`, aucun nouveau type). Foreground uniquement, permission refusée →
    `{granted: false}`, jamais un crash.
  - `network/expoNetInfoProvider.ts` (Sprint 017 partie 2/N, 2026-08-03) — seul endroit qui importe
    `@react-native-community/netinfo` directement. `createNetInfoSensor()` : combine
    `isConnected`/`isInternetReachable` (`docs/08` « ne doit pas se fier uniquement à l'icône
    réseau ») — signal *appareil*, pas d'accessibilité serveur réelle.
  - `settings/detectionRadiiStorage.ts` (Sprint « Réglages du rayon de détection », 2026-08-04,
    mirror `expoSpeaker.ts`) — point de contact unique pour persister le réglage opérateur des
    rayons de détection GPS via `@react-native-async-storage/async-storage`.
    `createAsyncStorageDetectionRadii()` : `load()`/`save({approachRadiusMeters?,
    workRadiusMeters?})`, clé `@reca-operateur/detectionRadii`, échec de lecture/parsing → objet
    vide (jamais un crash). Volontairement hors `src/persistence/` : préférence d'appareil, pas
    donnée de mission SQLite local-first.
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
- **Mocks Jest gesture-handler/reanimated (2026-08-02)** : `react-native-gesture-handler/
  jestSetup.js` (`jest.setupFiles`) + `moduleNameMapper` `^react-native-worklets$` →
  `react-native-worklets/src/mock.ts` (**pas** `react-native-reanimated/mock.js`, qui réimporte
  l'entrée réelle et plante sous Jest — voir `memory.md`).
- `tests/offlineEngine.test.ts` (Sprint 015, 2026-08-02) — 9 tests du moteur Offline : démarrage
  `ONLINE`, seuil d'échecs consécutifs avant `DEGRADED`, succès réinitialise le compteur, réseau
  système indisponible → `OFFLINE` immédiat, cycle `OFFLINE→RECOVERING→ONLINE` avec délai de
  validation respecté, confirmation immédiate par succès réel pendant `RECOVERING`,
  `lastOnlineAt` figé hors ligne, abonnement/désabonnement.
- `tests/voiceEngine.test.ts` (Sprint 016, 2026-08-02) — 16 tests : normalisation d'adresse,
  phrasés `buildAnnouncement`, file/priorité (`CRITICAL` avant le reste), interruption (une seule
  fois, jamais entre même priorité), anti-répétition GPS avec levée par retour, expiration croisée
  `APPROACHING`→`RESIDENCE_STARTED`, cooldown respecté puis contourné par avance d'horloge,
  répétition manuelle bypass le cooldown, mode silencieux, échec de synthèse journalisé sans
  bloquer.
- `tests/deriveMissionScreenState.test.ts` (Sprint 017 partie 1/N, 2026-08-02) — 8 tests purs :
  `null` sans mission/sans résidence active-ni-problème, dérivation EN_ROUTE/APPROACHING/
  IN_PROGRESS (timer par état, index/total/%), item `PROBLEM` trouvé via `allMissionItems` même
  s'il ne peut pas être `activeMissionItem`, priorité PROBLEM sur un item actif si les deux
  existent, `offline` présent seulement hors `ONLINE`, résidences carte plafonnées à 5 en filtrant
  celles sans coordonnées.
- `tests/missionContext.test.tsx` (Sprint 017 partie 1/N, 2026-08-02 ; étendu Sprints
  018/019/017-partie-2/Mission-active/Paramètres) — 15 tests d'intégration réelle
  (`MissionProvider` sur un faux `Db`/transport Sync/`Speaker`/`LocationProvider`/`NetworkSensor`
  injectés — jamais de vrai réseau/synthèse/capteur, voir `getDbOverride`/`syncTransportOverride`/
  `speakerOverride`/`locationProviderOverride`/`networkSensorOverride`) : chargement de la mission
  de démo (premier item EN_ROUTE actif), `reportProblem` → `PROBLEM` + `activeMissionItem`
  redevient `null`, `resolveProblem` → retour à un état actif, `skipItem` → `SKIPPED` + opération
  de sync mise en file, `startMission` READY→IN_PROGRESS réel puis refus (transition dupliquée) si
  déjà `IN_PROGRESS`, `closeMission` refusé tant qu'un item `WAITING`/actif subsiste, `closeMission`
  réussit une fois `startMission` appelé et tous les items résolus (`SKIPPED` autorisé),
  `dev.setNetworkOverride(false)`/`(null)` force `offlineState` OFFLINE puis RECOVERING,
  `dev.gps.moveTo`/`advanceTime` déclenchent une vraie transition EN_ROUTE→APPROACHING via le State
  Machine réel (écrit d'abord les coordonnées de l'item actif dans le faux `Db`, la mission de démo
  n'en a pas — voir `memory.md`), **un vrai fournisseur GPS contrôlable**
  (`locationProviderOverride`) pousse des fix qui déclenchent la même transition par le chemin
  capteur réel (`gpsState` reflète `{available:true}`), `gpsState` `permission_denied` quand le
  fournisseur refuse, **un écouteur réseau réel** (indépendant du mode dev) met à jour
  `realNetworkStatusRef`, `dev.setNetworkOverride(null)` retombe dessus, `voiceEnabled` par défaut
  `true`/`setVoiceEnabled` bascule (Sprint « Paramètres »). Mutations enveloppées dans `act()`
  (State Machine → contexte → re-render, comme tout hook React testé).
- `tests/deriveMissionActiveState.test.ts` (Sprint « Mission active », 2026-08-03) — 6 tests purs :
  `null` sans mission, `null` si `status !== 'READY'` (`IN_PROGRESS`/`COMPLETED`), éligible pour
  `READY` avec décompte/équipement/alertes vides, mapping `missionAlerts` → niveau/texte, reflet
  honnête d'un état sync/réseau réel (`PENDING`/`OFFLINE`).
- `tests/deriveEndOfMissionState.test.ts` (Sprint 018, 2026-08-02) — 7 tests purs : `null` sans
  mission, `null` mission déjà `COMPLETED`, `null` tant qu'un item `WAITING` ou actif subsiste,
  éligible avec un item `PROBLEM`/`SKIPPED` restant (n'empêche pas la fermeture), décompte/durée/
  état de sync/opérations en attente dérivés sans valeur inventée.
- `tests/devScreen.test.tsx` (Sprint 019, 2026-08-03) — 3 tests de rendu (`ctx: MissionContextValue`
  factice, `dev` avec des jest.fn()) : sections États/Seuils affichent bien `dev.getStates()`/
  `dev.thresholds`, message honnête « Aucune résidence à simuler » sans coordonnées, bouton
  « Fermer » appelle `onClose`, bouton « Aller à la cible » appelle `dev.gps.moveTo` avec les
  coordonnées de la résidence cible une fois disponible.
- `tests/noMissionScreen.test.tsx` (Sprint 017 partie 2/N, 2026-08-03) — 4 tests de rendu
  (`useAuth()` mocké via `jest.mock('@/context/AuthContext')`, `ctx` factice) : affiche
  l'utilisateur connecté/l'état réseau/le message clair, « Actualiser » appelle
  `ctx.refreshAssignment()`, « Déconnexion » appelle `auth.logout()`, masqué quand non authentifié.
- `tests/settingsScreen.test.tsx` (Sprint « Migration SQLite versionnée + écran Paramètres »,
  2026-08-03) — 5 tests de rendu (`useAuth()` mocké) : affiche utilisateur/thème/version/état du
  `Switch` voix, « Fermer » appelle `onClose`, bascule du `Switch` appelle `ctx.setVoiceEnabled`,
  « Déconnexion » appelle `auth.logout()`, « Mode développement » visible/cliquable seulement si
  `onOpenDevMode` est fourni (`__DEV__` côté appelant).
- `tests/migrations.test.ts` (2026-08-03) — 3 tests avec un faux `Db` schema-aware dédié (suit
  vraiment les colonnes par table, contrairement à `tests/testFakeDb.ts`) : une install neuve
  obtient toutes les colonnes de `sync_operations`, un appareil bloqué sur le schéma d'avant le
  Sprint 013-014 (reproduit exactement le schéma cassé trouvé sur le TECNO KL4, voir `memory.md`)
  reçoit les colonnes manquantes, ré-exécuter `runMigrations` est un no-op idempotent.
- `scripts/` — scripts de dev (vide).

## Dépendances critiques (à surveiller — `docs/10`)

- `expo` ~57 · `react-native` 0.86 · `react` 19.2.3 (versions liées).
- Tests : `jest-expo` ~57 · `@testing-library/react-native` **13.3.3** ·
  `react-test-renderer` **19.2.3 (exact)** · `@types/jest` **29.5.14** (aligné SDK 57, pas 30) —
  voir pièges dans `memory.md`.
- Visuel (Sprint 002) : `expo-font` + `expo-asset` (transitif) + `@expo-google-fonts/manrope`,
  `expo-blur`, `react-native-svg` (+ `-transformer` en dev), `expo-splash-screen`,
  `lucide-react-native`.
- **Gestes/animations (2026-08-02)** : `react-native-gesture-handler` ~2.32,
  `react-native-reanimated` 4.5.1 + peer requis `react-native-worklets` 0.10.1 (`expo-doctor` le
  signale si absent). Build natif restreint à `arm64-v8a` en dev (`plugins/withDevSingleAbi.js`).
- **Voix (Sprint 016, 2026-08-02)** : `expo-speech` — synthèse vocale locale, aucun paramètre
  natif additionnel requis au-delà du build.
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
- **Capteurs réels (Sprint 017 partie 2/N, 2026-08-03)** : `expo-location` (GPS foreground,
  permission `locationWhenInUsePermission` dans `app.json`), `@react-native-community/netinfo`
  (réseau appareil). Nouveaux modules natifs — nécessitent `expo prebuild`/`gradlew installDebug`,
  non vérifiables depuis ce VPS.
