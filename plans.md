# plans.md — Plans d'implémentation de `reca-operateur`

> Un plan est écrit **avant** toute tâche importante (nouvelle fonctionnalité, refonte,
> migration, changement d'architecture/schéma, moteur, synchronisation, State Machine, hors
> ligne). Voir `docs/10-Development-Standards.md`. Les plans terminés sont archivés ci-dessous.

## Plan actif

*(aucun — voir `tasks.md` pour le prochain sprint à choisir)*

## Archivé

### ✅ Migration SQLite versionnée + écran « Paramètres » (branche
`sprint-migrations-parametres`, 2026-08-03)

**Objectif** : deux tâches choisies avec le propriétaire — corriger le bug de migration SQLite
trouvé au test device (suivi ouvert depuis `memory.md`/`tasks.md`) et livrer l'écran
« Paramètres » (`docs/11` Écrans finaux).

**1. Migration SQLite versionnée** (`src/persistence/migrations.ts`) :
- `SCHEMA_VERSION` passe à 2. `columnExists`/`addColumnIfMissing` (lisent `PRAGMA table_info`,
  `ALTER TABLE ... ADD COLUMN` seulement si absente) — safe à rejouer sur une base neuve (colonnes
  déjà là via `CREATE TABLE`) comme sur une base ancienne.
- `migrateTo2` ajoute les 9 colonnes du Sprint 013-014 à `sync_operations`
  (`mission_id`/`mission_item_id`/`local_sequence`/`attempt_count`/`idempotency_key`/
  `last_attempt_at`/`next_attempt_at`/`last_error_code`/`last_error_message`) si absentes.
- `runMigrations` lit `schema_version` (0 si absent), exécute chaque migration dont la version
  cible dépasse la version courante, met à jour `schema_version` à la fin. Tableau `MIGRATIONS`
  ordonné — futures migrations = nouvelles entrées, jamais de réécriture d'une entrée existante.
- Test dédié (`tests/migrations.test.ts`) avec un faux `Db` qui suit vraiment les colonnes par
  table (`tests/testFakeDb.ts` ne le fait pas, jamais eu besoin jusqu'ici) — reproduit exactement
  le schéma cassé trouvé sur l'appareil réel.

**2. Écran « Paramètres »** (`docs/11` : voix/volume/carte/thème/préférences d'affichage/
confidentialité/compte/version — « contenir uniquement les options utiles ») : seuls les items
avec un vrai mécanisme derrière sont construits, le reste documenté hors scope plutôt qu'inventé
(même règle que chaque écran précédent) :
- **Voix** : `voiceEngine.setEnabled`/`isEnabled` (Sprint 016) existaient déjà, jamais exposés —
  nouveau `MissionContext.voiceEnabled`/`setVoiceEnabled`. Interrupteur réel.
- **Compte** : email (`useAuth()`, déjà utilisé par `NoMissionScreen`) + Déconnexion.
- **Version** : `package.json` (`resolveJsonModule` déjà activé, `expo/tsconfig.base` — pas de
  nouvelle dépendance).
- **Thème** : affichage statique « Sombre » — l'app n'a jamais eu de bascule de thème
  (`userInterfaceStyle` fixé dans `app.json`, `docs/01`), l'inventer serait une fonctionnalité non
  demandée.
- **Hors scope, non inventé** : volume (pas de mécanisme de contrôle applicatif — le volume
  matériel du téléphone s'applique déjà), carte (aucune préférence de style modélisée, un seul
  style Mapbox existe), préférences d'affichage, confidentialité (aucun contenu/mécanisme réel
  documenté nulle part).
- **Point d'entrée** : le hamburger (`AppHeader`/`MissionScreen.onMenu`) ouvre désormais
  `SettingsScreen` en permanence (au lieu de `DevScreen` en `__DEV__` uniquement, Sprint 019) —
  c'est la vraie destination attendue d'un hamburger. `DevScreen` reste accessible via un item
  « Mode développement » dans `SettingsScreen`, visible seulement si `__DEV__` (même barrière
  d'accès qu'avant, juste un niveau plus loin).

**Vérification** : tests purs/intégration (`migrations.test.ts`, contexte `voiceEnabled`) ;
`tsc`/`eslint`/`jest` verts ; `expo-doctor` ; vérifié sur device si possible (aucune nouvelle
dépendance native, JS + persistance uniquement).

**Réalisé conformément au plan, du premier coup** :
- Migration : `SCHEMA_VERSION` → 2, `columnExists`/`addColumnIfMissing`/`migrateTo2`/tableau
  `MIGRATIONS` ordonné, tel que décrit. `tests/migrations.test.ts` (nouveau, faux `Db`
  schema-aware dédié — `tests/testFakeDb.ts` ne suit pas de vraies colonnes) : 3 tests (install
  neuve, appareil bloqué sur l'ancien schéma `sync_operations` — reproduit exactement le schéma
  cassé trouvé sur le TECNO KL4 —, ré-exécution idempotente).
- Paramètres : `MissionContext.voiceEnabled`/`setVoiceEnabled` (câble `voiceEngine.setEnabled`,
  Sprint 016, jamais appelé jusqu'ici) ; `SettingsScreen.tsx` (Compte/Voix/Thème/Version + « Mode
  développement » si `__DEV__`) ; `LiveMissionScreen.tsx` — hamburger ouvre désormais
  `SettingsScreen` (remplace le branchement direct vers `DevScreen` du Sprint 019, déplacé un
  niveau plus loin dans les Paramètres). Vérifié en direct sur l'appareil (rechargement JS sans
  erreur, distance résidence toujours affichée) — **navigation vers Paramètres elle-même non
  vérifiée manuellement sur l'appareil** (mise de côté par le propriétaire pour avancer), couverte
  uniquement par les tests automatisés (`tests/settingsScreen.test.tsx`, 5 tests).
- **Vérification** : `tsc --noEmit`/`eslint .`/`npx jest` tous verts (171/171 tests, dont 3
  nouveaux `migrations.test.ts` + 2 nouveaux tests d'intégration `voiceEnabled` dans
  `missionContext.test.tsx` + 5 nouveaux `settingsScreen.test.tsx`), `npx expo-doctor` 19/20 (seul
  échec : dérive `react-native-gesture-handler` pré-existante, sans rapport, `package.json` non
  touché).

## Archivé

### ✅ Sprint — Écran « Mission active » (branche `sprint-mission-active-screen`, 2026-08-03)

**Objectif** (`docs/11-Roadmap.md` Écran « Mission active ») : consulter la mission, démarrer,
vérifier la préparation hors ligne, voir le nombre de résidences, voir les alertes importantes,
voir l'équipement. **Choisi comme prochain sprint avec le propriétaire** (alternatives écartées :
Paramètres — cosmétique, aucun gap fonctionnel ; Mode hors ligne dédié — l'overlay
`OfflineIndicator` couvre déjà l'essentiel). Résout au passage le gap documenté au Sprint 018 : la
mission de démo reste `READY` indéfiniment faute d'un bouton « démarrer » — cet écran en devient le
premier appelant réel (`requestMissionStart`, State Machine Sprint 009-010, jamais câblé jusqu'ici).

**Portée** : `requestMissionStart` (docs/09) n'autorise que `READY → IN_PROGRESS` — `ASSIGNED`
n'est produit nulle part dans ce repo (`seedDemoMissionIfEmpty` crée `READY` directement,
`fetchAssignedMission` mappe `IN_PROGRESS`/`READY` seulement), donc cet écran ne gère que le cas
`READY`. Pause/reprise (`requestMissionPause`/`requestMissionResume`, existent côté State Machine)
**non couverts** — `docs/11` ne les mentionne pas pour cet écran précis, aucune UI ne les expose
nulle part encore, les inventer ici serait hors mandat.

**Design** :
1. **`MissionContext.missionAlerts: MissionAlertRecord[]`** (nouveau) — chargé au montage via
   `missionAlertRepository.getAll()` filtré aux items de la mission sélectionnée (table jamais
   peuplée à ce jour, honnêtement vide plutôt qu'un état inventé — même esprit que `alerts: []`
   dans `deriveMissionScreenState.ts`).
2. **`MissionContext.startMission(): Promise<TransitionResult>`** (nouveau) — même patron que
   `closeMission()` : appelle `stateMachine.requestMissionStart(mission.id)`, recharge `mission`
   (le statut change, pas seulement les items) via `reloadMission` existant, retourne le
   `TransitionResult` brut pour un vrai message d'erreur.
3. **`deriveMissionActiveState.ts`** (nouveau, pur, testé) — `null` sauf `mission` chargée et
   `mission.status === 'READY'`. Retourne secteur/date, `equipment` (`Mission.equipment`, déjà
   dans le schéma), nombre de résidences (`allMissionItems.length`), préparation hors ligne
   (`synchronizationState`/`offlineState`, déjà réels), alertes (`missionAlerts` mappées
   niveau/texte).
4. **`MissionActiveScreen.tsx`** (nouveau, présentation pure) : logo, résumé mission, équipement,
   nombre de résidences, section « Préparation hors ligne » (état sync/réseau honnête, pas un
   nouveau mécanisme de téléchargement — les données sont déjà locales via `fetchAssignedMission`/
   seed), alertes importantes (liste ou état vide honnête), bouton « Démarrer la tournée » →
   `ctx.startMission()`.
5. **`LiveMissionScreen.tsx`** : nouvelle branche entre le repli « Aucune mission » et l'écran de
   travail — `mission.status === 'READY'` → `MissionActiveScreen`. Change le comportement actuel
   (une mission `READY` va aujourd'hui directement à l'écran de travail, sautant cette étape) —
   **changement de comportement assumé**, c'était un artefact de l'écran manquant, pas un choix de
   design délibéré.

**Hors scope, explicitement différé** : statut `ASSIGNED` (jamais produit dans ce repo) ; pause/
reprise de mission ; production d'alertes (aucun producteur n'existe, `mission_alerts` reste vide
en pratique) ; téléchargement explicite de cartes hors ligne (`docs/08`, déjà différé au
Sprint 015).

**Vérification** : tests purs (`deriveMissionActiveState` — éligibilité, mapping alertes/
équipement/décompte) ; test d'intégration (`missionContext.test.tsx` — `startMission` READY→
IN_PROGRESS réel, refus si transition invalide) ; `tsc`/`eslint`/`jest` verts ; `expo-doctor`.

**Réalisé conformément au plan, du premier coup** :
- Points 1-5 implémentés tels que décrits : `MissionContext.missionAlerts` (chargé au montage,
  filtré aux items de la mission sélectionnée) ; `MissionContext.startMission()` (même patron que
  `closeMission`) ; `deriveMissionActiveState.ts` (pur, testé) ; `MissionActiveScreen.tsx`
  (résumé/équipement/résidences/préparation hors ligne/alertes/bouton Démarrer) ;
  `LiveMissionScreen.tsx` insère la nouvelle branche entre « Aucune mission » et l'écran de
  travail.
- **Bonus non prévu au plan** : `startMission()` étant maintenant une vraie commande de contexte,
  le test `closeMission` existant (qui simulait `requestMissionStart` via une seconde instance de
  State Machine sur le même faux `Db`, faute de commande réelle à l'époque du Sprint 018) a pu être
  simplifié pour appeler `result.current.startMission()` directement — une dette de test de moins,
  découverte en écrivant ce sprint plutôt que planifiée.
- **Vérification** : `tsc --noEmit`/`eslint .`/`npx jest` tous verts (157/157 tests, dont 6
  nouveaux `tests/deriveMissionActiveState.test.ts` + 2 nouveaux tests d'intégration `startMission`
  dans `missionContext.test.tsx`), `npx expo-doctor` 20/20. **Non vérifié sur device réel** :
  aucune dépendance native ajoutée cette passe, mais pas testé physiquement sur l'appareil — suivi
  ouvert, même pattern que chaque sprint précédent.

## Archivé

### ✅ Sprint 017 (partie 2/N) — Capteurs réels + écran « Aucune mission » (branche
`sprint-017-partie-2-capteurs-reels`, 2026-08-03)

**Objectif** : dernier gros morceau différé depuis le Sprint 011-012 (« logique d'abord, capteur
ensuite », répété à chaque moteur) — brancher `expo-location` (GPS) et un vrai signal réseau
(`@react-native-community/netinfo`) derrière les interfaces déjà injectées (`GpsPosition`,
`NetworkStatusProvider`), sans toucher à la logique métier des moteurs (déjà testée). Livre aussi
l'écran « Aucune mission » (`docs/11` Écrans finaux), qui devient le foyer naturel de l'état
« mission fermée/absente » actuellement affiché par le repli générique de `LiveMissionScreen.tsx`.
**Choisi comme prochain sprint avec le propriétaire** (seule alternative restante de Phase 11 non
couverte par les Sprints 017-1/018/019).

**Portée** : capteur GPS foreground uniquement (`expo-location` premier plan — aucune exigence de
suivi arrière-plan documentée dans `docs/04`, l'inventer serait hors mandat et complique
significativement les permissions Android/Play Store) ; réseau = signal système
(`NetInfo.isConnected`/`isInternetReachable`), pas d'accessibilité serveur réelle
(`SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED` restent hors scope, décision déjà actée au
Sprint 015).

**Design** :
1. **`expo-location`** (`npx expo install expo-location`) — nouveau module natif, plugin
   `app.json` avec la chaîne de permission `locationWhenInUsePermission` (FR, cohérent avec le
   reste de l'UI). Même cycle que chaque dépendance native précédente (Voice/gesture-handler/
   async-storage) : `expo prebuild` + `gradlew installDebug` sur le laptop du propriétaire, **non
   vérifiable depuis ce VPS**.
2. **`src/integrations/location/expoLocationProvider.ts`** (mirror `expoSpeaker.ts`) : demande
   `Location.requestForegroundPermissionsAsync()`, puis `Location.watchPositionAsync` (accuracy
   `Balanced`, `timeInterval`/`distanceInterval` — **valeurs non chiffrées par `docs/04`, marquées
   `@assumption`** comme `maxAccuracyMeters`/`gpsLostTimeoutSeconds` l'étaient déjà) mappé vers
   `GpsPosition` (`src/engines/gps/types.ts`, déjà le contrat attendu par le moteur — aucun
   changement de type). Permission refusée → callback d'erreur, jamais un crash ; le moteur GPS
   reste simplement sans position (comportement déjà supporté, c'était l'état par défaut jusqu'ici).
3. **`src/integrations/network/expoNetInfoProvider.ts`** — `@react-native-community/netinfo`
   (`npx expo install`), écoute `NetInfo.addEventListener`, expose un `NetworkStatusProvider`
   (`isOnline()`) adossé à une ref mise à jour par l'écouteur.
4. **`MissionContext.tsx`** : `networkStatus` (Sprint 019, ref mutable) devient
   `networkOverrideRef.current ?? realNetworkStatusRef.current ?? true` — **le mode dev
   (`dev.setNetworkOverride`) garde la priorité**, rien à retirer du Sprint 019. Le vrai fournisseur
   GPS pousse chaque fix dans `gpsEngineRef.current.updatePosition()` puis appelle `afterMutation`
   (même flux que `dev.gps`, une seule voie de mise à jour du contexte après un mouvement GPS,
   qu'il soit réel ou simulé). Un intervalle (`setInterval`, nettoyé au démontage) appelle
   `gpsEngine.checkTimeout(clock.now())` périodiquement — le moteur n'a aucun timer propre
   (`docs/04`), c'est à l'appelant de le fournir, exactement comme le Sync/Offline Engine
   attendaient déjà un déclencheur externe. `gpsState` (actuellement `{available: false}` en dur)
   reflète enfin la vraie disponibilité (`{available: true}` / `{available: false, reason}`).
   `getDbOverride`/`syncTransportOverride`/`speakerOverride` ont déjà établi le patron : nouveaux
   `locationProviderOverride`/`networkSensorOverride` injectables pour que
   `tests/missionContext.test.tsx` ne touche jamais `expo-location`/`NetInfo` réels.
5. **`NoMissionScreen.tsx`** (nouveau, `docs/11` Écran « Aucune mission ») : logo officiel,
   utilisateur (`useAuth().session.user.email`, `AuthContext` déjà accessible partout dans l'arbre),
   état réseau (`ctx.offlineState.status`), message clair, bouton Actualiser (nouvelle commande
   `MissionContext.refreshAssignment()` — rejoue `fetchAssignedMission` + rechargement, même flux
   que le montage), bouton Déconnexion (`useAuth().logout()`). `LiveMissionScreen.tsx` le rend
   quand `!ctx.mission` ou `ctx.mission.status === 'COMPLETED'` — remplace le repli générique
   texte pour ce cas précis (le repli générique existant reste pour l'edge case résiduel : mission
   chargée, pas fermée, mais sans aucun `MissionItem`).

**Hors scope, explicitement différé** : suivi GPS arrière-plan ; `SERVER_UNAVAILABLE`/
`AUTHENTICATION_DEGRADED` (ping serveur réel, toujours différé depuis le Sprint 015) ; UI dédiée
« capteur GPS indisponible » (aucune maquette/exigence documentée au-delà de l'état interne) ;
écrans Mission active/Paramètres/Mode hors ligne (Phase 11, restent hors scope).

**Vérification** : tests purs si extraction possible (mapping `Location.LocationObject` →
`GpsPosition`) ; test d'intégration (`missionContext.test.tsx` — provider GPS/réseau injecté en
faux, vérifie que `gpsState`/`offlineState` reflètent le fournisseur réel plutôt que le stub) ;
`tsc`/`eslint`/`jest` verts ; `expo-doctor` ; **non vérifiable sur device depuis ce VPS** (nouveau
module natif, nécessite le cycle prebuild/Android Studio du propriétaire) — noté comme suivi ouvert
comme à chaque sprint natif précédent.

**Réalisé conformément au plan, du premier coup pour la logique — la seule surprise a été dans les
tests, pas dans le design** :
- Points 1-5 implémentés tels que décrits : `expo-location`/`@react-native-community/netinfo`
  ajoutés (`npx expo install`) + plugin `app.json` ; `expoLocationProvider.ts`/
  `expoNetInfoProvider.ts` (mirror `expoSpeaker.ts`) ; `MissionContext.tsx` — `networkStatus`
  retombe sur `realNetworkStatusRef` derrière l'override dev, chaque fix réel appelle
  `gpsEngine.updatePosition()` + `afterMutation`, `setInterval` pour `checkTimeout`,
  `locationProviderOverride`/`networkSensorOverride` injectables, `gpsState` reflète enfin la vraie
  disponibilité ; `NoMissionScreen.tsx` (logo/utilisateur/état réseau/message/Actualiser/
  Déconnexion) + nouvelle commande `MissionContext.refreshAssignment()` ; `LiveMissionScreen.tsx`
  le rend quand `!mission` ou `mission.status === 'COMPLETED'`.
- **Test d'intégration existants cassés, corrigés** : les 8 tests `missionContext.test.tsx`
  préexistants instanciaient `MissionProvider` sans `locationProviderOverride`/
  `networkSensorOverride` — dès que ces branches de code existent, le montage appelle les vrais
  `expo-location`/`NetInfo`, qui plantent sous Jest (modules natifs absents). Fixé en ajoutant des
  fournisseurs factices par défaut à `renderMissionContext()` (même règle « jamais de vrai
  capteur/réseau touché en test » que chaque override précédent) ; 3 nouveaux tests dédiés
  (fournisseur GPS contrôlable poussant de vrais fix, `gpsState` `permission_denied`, écouteur
  réseau réel indépendant du mode dev) confirment le nouveau chemin sans jamais appeler les modules
  natifs.
- **Vérification** : `tsc --noEmit`/`eslint .`/`npx jest` tous verts (149/149 tests, dont 3
  nouveaux tests d'intégration capteurs dans `missionContext.test.tsx` + 4 nouveaux
  `tests/noMissionScreen.test.tsx`), `npx expo-doctor` 20/20. **Non vérifié sur device réel** :
  2 nouveaux modules natifs, nécessite le cycle `expo prebuild`/`gradlew installDebug` du
  propriétaire — suivi ouvert, même pattern que chaque sprint natif précédent (Voice/
  gesture-handler/async-storage).

## Archivé

### ✅ Sprint 019 — Mode développement (branche `sprint-019-mode-developpement`, 2026-08-03)

**Objectif** (`docs/11-Roadmap.md` Phase 11, écran « Développement ») : simuler GPS/réseau, voir
états/file/événements/seuils, exporter les journaux, tester les transitions — « ne doit pas être
accessible aux utilisateurs ordinaires ». **Choisi comme prochain sprint avec le propriétaire**
(alternative écartée : Sprint 017 partie 2/N, capteurs réels — plus gros, nouveaux modules
natifs). Contrairement à ce que son nom suggère, ce sprint **ne dépend pas** des capteurs réels :
le simulateur GPS existe déjà (Sprint 011-012, `createGpsSimulator`), jamais câblé à
`MissionContext` faute d'appelant — c'est exactement cet écran qui devient son appelant.

**Barrière d'accès** (« ne doit pas être accessible aux utilisateurs ordinaires ») : pas de système
de rôles dans ce repo — en inventer un serait une règle métier non validée. Utilisé à la place :
le flag natif `__DEV__` de React Native (faux en build release), point d'entrée = le hamburger de
`AppHeader` (`onMenu`, actuellement no-op partout) ouvre l'écran dev uniquement quand `__DEV__` est
vrai ; en production, `onMenu` reste le placeholder existant (aucune régression, aucune nouvelle
UI visible en prod).

**Design** :
1. **« Simuler le GPS »** : `MissionProvider` garde une instance stable de `createGpsSimulator`
   (Sprint 011-012) autour de `gpsEngineRef.current`. Exposée via `MissionContextValue.dev.gps`
   (`moveTo`/`advanceTime`/`loseSignal`/`recoverSignal`) — chaque appel déclenche déjà
   `afterMutation(mission.id)` en interne (même rechargement que
   `reportProblem`/`resolveProblem`/`skipItem`) pour que le contexte reflète immédiatement les
   transitions que le moteur GPS aurait déclenchées. **« Tester les transitions » se fait via ce
   simulateur** (déplacer vers la résidence active, avancer le temps) plutôt que d'exposer des
   boutons qui appelleraient direct les commandes internes du State Machine (`enterApproach`/
   `enterWork`/…) — plus fidèle au comportement réel, n'invente aucun raccourci qui n'existe pas
   en production.
2. **« Simuler le réseau »** : `STUB_NETWORK_STATUS` (constante figée à `true`) remplacé par un
   `NetworkStatusProvider` adossé à une ref mutable (`networkOverrideRef`, partagée par Sync et
   Offline, comme aujourd'hui). `dev.setNetworkOverride(online: boolean | null)` (`null` = réel/
   toujours en ligne, comportement actuel inchangé) — après un changement, relance
   `offlineEngine.checkConnectivity()` + `syncEngine.runSyncCycle()` pour refléter immédiatement.
3. **« Voir les états »** : `dev.getStates()` (synchrone) — `mission.status`, résumé des
   `MissionItem` par statut, `gpsEngine.getPhase()`, `synchronizationState`, `offlineState` (déjà
   tous dans le contexte, agrégés ici pour l'écran).
4. **« Voir la file »** : `dev.getSyncQueue(): Promise<SyncOperation[]>` — lit directement
   `syncOperationRepository.getAll()` (pas une nouvelle méthode moteur, juste une lecture repo,
   cohérent avec « les moteurs ne connaissent jamais React » — c'est le contexte qui lit, pas
   l'écran).
5. **« Voir les événements »** : `dev.getEvents()` (synchrone) — `getEvents()` de chacun des 4
   moteurs déjà instrumentés (GPS/Sync/Offline/Voice, tous l'exposent déjà depuis leurs sprints
   respectifs).
6. **« Voir les seuils »** : `DEFAULT_GPS_THRESHOLDS` (`src/engines/gps/types.ts`, Sprint 011-012)
   affiché tel quel — `MissionContext` n'a jamais configuré d'override, donc ce sont déjà les
   seuils réellement actifs, rien à recalculer.
7. **« Exporter les journaux »** : `dev.exportLogs(): Promise<string>` — assemble états+file+
   événements+transitions persistées (`stateTransitionRepository.getAll()`) en JSON, partagé via
   `Share.share()` (API core React Native, aucune nouvelle dépendance/permission).
8. **`DevScreen.tsx`** (nouveau, `src/screens/`, dev-only) : sections États/Simuler GPS/Simuler
   réseau/Seuils/File/Événements + bouton Exporter, bouton Fermer. `MissionScreen.tsx` gagne une
   prop `onMenu?` (déjà câblée à `AppHeader`, jusqu'ici toujours no-op) ; `LiveMissionScreen.tsx`
   la branche sur `setDevScreenOpen(true)` seulement si `__DEV__`, et rend `DevScreen` à la place
   de l'écran normal quand ouvert.

**Hors scope, explicitement différé** : capteurs GPS/réseau réels (Sprint 017 partie 2/N, toujours
hors scope) ; système de rôles/permissions serveur pour restreindre l'accès (aucun rôle
« développeur » n'existe dans `reca-app`, `__DEV__` suffit à l'exigence documentée) ; persistance
de l'état du simulateur entre sessions (le simulateur repart de zéro à chaque montage, comme tout
état de dev-tool).

**Vérification** : tests purs si extraction possible (seuils/format d'export) ; test d'intégration
(`missionContext.test.tsx` — `dev.gps.moveTo`/`advanceTime` déclenchent une vraie transition State
Machine et le contexte se met à jour ; `dev.setNetworkOverride` change `offlineState`/
`synchronizationState`) ; `tsc`/`eslint`/`jest` verts ; `DevScreen` non accessible dans un build de
production réel (`__DEV__` faux), non vérifiable depuis ce VPS sans build release — noté comme
limite si applicable.

**Réalisé conformément au plan, du premier coup** :
- Points 1-8 implémentés tels que décrits : `MissionContext.tsx` garde `gpsSimulatorRef`
  (`createGpsSimulator` autour du GPS Engine réel) et `networkOverrideRef` (remplace
  `STUB_NETWORK_STATUS`, partagé Sync/Offline) ; `MissionContextValue.dev` expose
  `gps`/`thresholds`/`getStates`/`getEvents`/`getSyncQueue`/`getTransitions`/
  `setNetworkOverride`/`exportLogs` ; `DevScreen.tsx` (sections États/Simuler GPS/Simuler réseau/
  Seuils/File/Événements/Historique + export via `Share.share()`) ; `MissionScreen.tsx` prop
  `onMenu?` câblée à `AppHeader` (remplace le `() => {}` en dur) ; `LiveMissionScreen.tsx` ouvre
  `DevScreen` seulement si `__DEV__ && devScreenOpen`.
- **Test d'intégration GPS notable** (`tests/missionContext.test.tsx`) : la mission de démo n'a pas
  de coordonnées (`seedDemoMission.ts`), donc le GPS Engine n'a jamais de résidence active tant
  qu'elles ne sont pas définies — le test écrit directement les coordonnées de l'item actif dans le
  faux `Db` partagé, puis un premier `dev.gps.moveTo` (no-op pour le moteur, mais recharge les
  items via `afterMutation`) ré-arme l'effet `setActiveResidence` de `MissionContext` avec les
  vraies coordonnées avant qu'un second `moveTo`+`advanceTime(5)` ne déclenche une vraie transition
  EN_ROUTE→APPROACHING validée par le State Machine réel.
- **Vérification** : `tsc --noEmit`/`eslint .`/`npx jest` tous verts (142/142 tests, dont 2
  nouveaux tests d'intégration `dev.gps`/`dev.setNetworkOverride` dans `missionContext.test.tsx` +
  3 nouveaux `tests/devScreen.test.tsx`), `npx expo-doctor` 20/20. **Non vérifié sur device réel** :
  aucune dépendance native ajoutée (donc aucun nouveau build requis), mais pas testé physiquement
  sur l'appareil cette passe ni en build release (pour confirmer `__DEV__` masque bien l'écran) —
  suivi ouvert, même pattern que les Sprints 017/018.

## Archivé

### ✅ Sprint 018 — Fin de mission (branche `sprint-018-fin-de-mission`, 2026-08-02)

**Objectif** (`docs/11-Roadmap.md` Phase 11, écran « Fin de mission » + suivi ouvert « bouton UI
Fermer la mission » déjà noté dans `tasks.md` depuis le câblage Supabase) : `requestMissionComplete`
(State Machine, Sprint 009-010) et son mapping serveur (`SupabaseSyncTransport`, câblage Supabase)
existent déjà et fonctionnent — il ne manque que l'écran et le bouton qui l'appellent. **Choisi
comme prochain sprint avec le propriétaire** (alternatives écartées : Sprint 017 partie 2/N
capteurs réels GPS/réseau — plus gros, nouveaux modules natifs ; Sprint 019 mode développement —
moins utile sans capteurs réels à simuler).

**Condition d'éligibilité** (ne pas dupliquer la règle métier — la lire directement de la même
source que `requestMissionComplete` : `isActiveItemState`, `src/engines/state-machine/
itemTransitions.ts`) : mission chargée, `mission.status !== 'COMPLETED'`, et aucun `MissionItem` en
`WAITING` ni dans `ACTIVE_ITEM_STATES` (`EN_ROUTE`/`APPROACHING`/`IN_PROGRESS`). Un item `PROBLEM`
ou `SKIPPED` restant **n'empêche pas** la fermeture — c'est exactement le cas
`terminee_avec_anomalies` déjà géré par `SupabaseSyncTransport` (règle métier confirmée au câblage
Supabase, pas réinventée ici).

**Design** :
1. **`deriveEndOfMissionState(ctx, now): EndOfMissionState | null`** (nouveau, pur, testé,
   `src/screens/deriveEndOfMissionState.ts`, même famille que `deriveMissionScreenState.ts`) —
   `null` tant que la condition d'éligibilité ci-dessus n'est pas remplie (mission encore active,
   ou déjà fermée/absente — ces derniers cas restent le repli générique existant, pas cet écran).
   Sinon retourne : secteur/date, total résidences, décompte par statut final
   (`COMPLETED`/`PROBLEM`/`SKIPPED`), liste des résidences à problème (adresse/`problemCode`/note,
   pour l'item « problèmes » du spec), durée de mission (`mission.actualStartAt` → `now`, même
   convention non-tickante que `deriveMissionScreenState`), `syncState`/`pendingOperations` (déjà
   exposés par `MissionContextValue.synchronizationState`, aucune donnée inventée).
2. **`EndOfMissionScreen.tsx`** (nouveau, présentation pure, `src/screens/`, même statut que
   `MissionScreen.tsx` — reçoit un `EndOfMissionState` + `onClose`/`closing`/`closeError` en props,
   aucun accès Supabase/State Machine direct) : résumé, résidences terminées, problèmes, durées,
   état de synchronisation (`SyncIndicator`), opérations en attente — les 7 éléments du spec
   `docs/11`. Bouton « Fermer la mission » (`PressableScale`+`Txt`, tokens existants, aucun nouveau
   composant générique). **Confirmation locale** (spec) : après succès, le bouton devient un état
   confirmé (« Mission fermée » + coche) plutôt qu'un blocage réseau — la fermeture est déjà écrite
   localement avant toute synchronisation (`docs/07` « écriture locale d'abord »), cohérent avec
   tous les moteurs existants.
3. **`closeMission(): Promise<void>`** ajouté à `MissionContextValue` (`MissionContext.tsx`), même
   patron que `reportProblem`/`resolveProblem`/`skipItem` : appelle
   `stateMachine.requestMissionComplete(mission.id)`, puis sur succès recharge **mission ET items**
   (`afterMutation` actuel ne recharge que les items — `mission.status` doit aussi être rafraîchi
   depuis `missionRepo.getById`, sinon l'écran ne verrait jamais son propre succès) + déclenche un
   cycle de sync immédiat (déjà fait par `afterMutation`, la fermeture est la feuille de temps,
   autant la pousser tout de suite si le réseau est là).
4. **`LiveMissionScreen.tsx`** : quand `deriveMissionScreenState` retourne `null`, essayer
   `deriveEndOfMissionState` avant le repli générique actuel — rend `EndOfMissionScreen` si non nul,
   sinon garde le message honnête existant (« Aucune résidence active pour le moment » — reste le
   repli pour mission absente/déjà fermée, l'écran « Aucune mission » réel du spec restant hors
   scope, différé comme documenté au Sprint 017).

**Hors scope, explicitement différé** : écran « Aucune mission » dédié (spec docs/11, différent de
« Fin de mission » — condition = pas de mission du tout, pas seulement mission fermée) ; capteur GPS
réel, capteur réseau réel (inchangé depuis le Sprint 017) ; écrans Paramètres/Développement (Sprint
019) ; export/impression du résumé de fin de mission (non listé par le spec) ; annulation de la
fermeture (`docs/09` : `CANCELLED` ne doit jamais être produit par l'opérateur, la fermeture n'est
donc pas réversible côté app — cohérent avec la règle métier déjà validée au câblage Supabase).

**Vérification** : tests purs (`deriveEndOfMissionState` — éligible/inéligible sur chaque cas :
item `WAITING` restant, item actif restant, mission déjà `COMPLETED`, décompte problèmes/durées) ;
test d'intégration (`missionContext.test.tsx` — `closeMission` avec State Machine réel : succès
quand éligible, refus sinon, `mission.status` rafraîchi côté contexte) ; `tsc`/`eslint`/`jest`
verts ; vérifié sur device si une mission dans cet état est disponible (sinon noté comme suivi
ouvert, même pattern que le Sprint 017).

**Réalisé conformément au plan, avec un écart découvert en testant (pas une déviation de
conception) :**
- Points 1/2/3/4 implémentés tels que décrits : `deriveEndOfMissionState.ts` (pur, testé,
  `tests/deriveEndOfMissionState.test.ts`) ; `EndOfMissionScreen.tsx` (résumé, résidences à
  reprendre, `SyncIndicator`+opérations en attente, bouton « Fermer la mission » avec état
  confirmé local) ; `MissionContext.closeMission()` (recharge `mission` via `missionRepo.getById`
  en plus des items, retourne le `TransitionResult` brut) ; `LiveMissionScreen.tsx` essaie
  `deriveEndOfMissionState` avant le repli générique existant.
- **Gap découvert en écrivant le test d'intégration de succès** : la mission de démo
  (`seedDemoMissionIfEmpty`) reste `READY` indéfiniment dans cet environnement — le graphe
  `docs/09` n'autorise `COMPLETED` que depuis `IN_PROGRESS`, et rien ne fait jamais cette
  transition (le bouton « démarrer » de l'écran Mission active, `docs/11`, reste hors scope depuis
  le Sprint 017). Une vraie mission Supabase n'a pas ce problème (`fetchAssignedMission.ts` mappe
  déjà `IN_PROGRESS` quand `statut === 'en_cours'` côté serveur). Pas corrigé dans le code
  (inventer un démarrage automatique aurait été une règle métier non validée) — le test
  d'intégration simule directement la transition `requestMissionStart` via une seconde instance de
  State Machine sur le même faux `Db`, documenté en commentaire dans le test. Limitation notée dans
  `tasks.md` comme suivi ouvert (environnement démo seulement, pas un bug de ce sprint).
- **Vérification** : `tsc --noEmit`/`eslint .`/`npx jest` tous verts (137/137 tests, dont 7
  nouveaux `deriveEndOfMissionState.test.ts` + 2 nouveaux tests d'intégration `closeMission` dans
  `missionContext.test.tsx`), `npx expo-doctor` 20/20. **Non vérifiée sur device** : aucune mission
  réelle actuellement dans l'état éligible (Mission #9 déjà `COMPLETED`) — suivi ouvert non
  bloquant, même pattern que le Sprint 017.

## Archivé

### ✅ Sprint 017 (partie 1/N) — Câblage réel de MissionContext (branche
`sprint-017-mission-context-wiring`, 2026-08-02)

**Objectif** (Phase 11 Roadmap « Intégration complète ») : la Phase 11 est énorme — relie tous
les moteurs au `MissionContext`/`MissionScreen` réels **et** demande 6 nouveaux écrans (Aucune
mission, Mission active, Fin de mission, Paramètres, Développement, Mode hors ligne). **Découpage
validé avec le propriétaire** : cette passe couvre uniquement le câblage technique des 5 moteurs
existants (State Machine, GPS, Sync, Offline, Voice) dans `MissionContext`, et le remplacement des
mocks statiques de `MissionScreen` par les vraies données — **pas de nouveaux écrans**, **pas de
capteurs natifs réels** (GPS/réseau système restent injectés en factice, même principe « logique
d'abord, capteur ensuite » déjà appliqué à chaque moteur).

**C'est le moment annoncé depuis le Sprint 004** : `MissionScreenPreview` (sélecteur de mocks
dev-only) devait être « reswitché vers un `MissionScreen` unique piloté par le vrai State Machine »
dès que celui-ci existerait (Sprint 009-010) — jamais fait, chaque sprint suivant l'a explicitement
redifféré. C'est cette passe qui honore enfin cette promesse.

**Bug latent corrigé au passage** : `MissionContext` prenait `missions[0]` de `getAll()` (ordre non
garanti) comme mission active — ambigu depuis que la vraie Mission #9 (Supabase) coexiste avec la
Mission de démo en base locale (suivi ouvert documenté au câblage Supabase). **Fix** : si
`fetchAssignedMission` a retourné une mission cette session, son id devient la source de vérité
(`missionId = assigned?.id ?? missions[0]?.id`), les items sont filtrés par ce `missionId` —
n'affecte jamais l'environnement de démo (une seule mission dans ce cas, comportement inchangé).

**Design** :
1. **Moteurs instanciés dans `MissionProvider`** (via `useMemo`/refs stables, pas recréés à
   chaque rendu) : `createStateMachine(db, clock)`, `createGpsEngine({stateMachine, clock})`,
   `createSynchronizationEngine({db, clock, transport: createSupabaseSyncTransport(), network})`,
   `createOfflineEngine({clock, networkStatus})`, `createVoiceEngine({clock, speaker:
   createExpoSpeaker()})`. `networkStatus`/GPS position restent de simples objets injectés
   (`{isOnline: () => true}` pour l'instant — **capteur réel explicitement différé**, pas oublié).
2. **Commandes exposées par le contexte**, câblées aux boutons déjà existants dans l'UI (jamais
   inventer un nouveau bouton) : `reportProblem`→`CurrentResidenceSheet.onProblem` (« Signaler »),
   `resolveProblem`→`ProblemStateCard.onResumeLater` (« Reprendre plus tard »),
   `skipItem`→`ProblemStateCard.onNext` (« Passer à la suivante »). Pas de bouton « Terminer » —
   la fin de résidence reste automatique via le GPS Engine (capteur réel différé), pas de nouveau
   flux manuel à inventer.
3. **Traducteur State Machine → Voice Engine** (`missionVoiceBridge.ts`, pur, testé) : mappe un
   sous-ensemble reconnu de transitions (`EN_ROUTE`/`APPROACHING`/`IN_PROGRESS`/`COMPLETED`/
   `PROBLEM`) vers les `VoiceInputEvent` correspondants ; le contexte s'abonne au log du State
   Machine et pousse dans `voiceEngine.handleEvent` + pompe `processNext()` en boucle légère
   (`useEffect`, un seul niveau, pas de minuterie dans le moteur lui-même).
4. **`gpsState`/`synchronizationState`/`offlineState` réels** (plus des placeholders) : mis à jour
   via `on()` de chaque moteur → `setState` React. Formes ajustées à ce que ces moteurs exposent
   réellement (pas exactement le TS d'exemple `docs/03`, qui datait d'avant que ces moteurs
   existent).
5. **`deriveMissionScreenState(ctx): MissionScreenState | null`** (nouveau, pur, testé) —
   traduit les champs réels de `MissionContextValue` vers la forme `MissionScreenState` déjà
   consommée par `MissionScreen` (aucun changement à `MissionScreen` lui-même). Retourne `null`
   si aucune résidence active (l'écran « Aucune mission » réel reste hors scope — un simple repli
   minimal est affiché en attendant).
6. **`App.tsx`** : remplace enfin `<MissionScreenPreview />` par `<MissionScreen>` alimenté par
   `deriveMissionScreenState`, avec repli minimal si `null`. `MissionScreenPreview` et les 4 mocks
   restent dans le repo (référence/tests), simplement plus le point d'entrée réel.

**Hors scope, explicitement différé** : capteur GPS réel (`expo-location`) ; capteur réseau réel
(NetInfo) ; les 6 nouveaux écrans (Mission active/Fin de mission/Paramètres/Développement/Aucune
mission/Mode hors ligne — sprints suivants de la Phase 11) ; bouton « Fermer la mission » (suivi
déjà ouvert) ; traduction voix exhaustive (seulement les transitions les plus utiles cette passe).

**Vérification** : tests d'intégration (State Machine réel → `deriveMissionScreenState` reflète
la transition) ; `tsc`/`eslint`/`jest` verts ; app vérifiée sur device (mission réelle si
disponible, sinon démo).

**Réalisé conformément au plan, avec deux écarts assumés et documentés (points 3 et « Vérification »
device) :**
- Points 1/2/4/5/6 implémentés tels que décrits : `MissionContext.tsx` instancie les 5 moteurs une
  fois par connexion DB (`useEffect`, refs stables) ; `reportProblem`/`resolveProblem`/`skipItem`
  câblés à `CurrentResidenceSheet.onProblem`/`ProblemStateCard.onResumeLater`/`ProblemStateCard.onNext`
  (`MissionScreen.tsx` reçoit 3 callbacks optionnels, no-op par défaut pour ne pas casser
  `MissionScreenPreview`) ; `gpsState`/`synchronizationState`/`offlineState` réels exposés (formes
  ajustées à ce que `docs/07`/`docs/08` moteurs exposent réellement) ; `deriveMissionScreenState.ts`
  (pur, testé, `tests/deriveMissionScreenState.test.ts`) traduit `MissionContextValue` →
  `MissionScreenState` sans toucher à `MissionScreen` ; `App.tsx` remplace enfin
  `<MissionScreenPreview />` par `<LiveMissionScreen />` (promesse honorée depuis le Sprint 004).
- **Écart point 3** : pas de `missionVoiceBridge.ts` séparé. Sans capteur GPS réel (différé,
  inchangé), les transitions `EN_ROUTE→APPROACHING→IN_PROGRESS→COMPLETED` ne se déclenchent jamais
  automatiquement cette passe (rien ne les fait avancer) — il n'y avait donc rien à traduire pour
  elles. Seul `VOICE_PROBLEM_RECORDED` est réellement déclenché (`reportProblem`, sur succès de la
  transition). Construire un traducteur générique pour des transitions qui ne peuvent pas encore
  se produire aurait été de la logique morte non testable honnêtement — différé au sprint qui
  câblera `expo-location` (le bridge aura alors de vrais événements à observer).
- **Vérification** : `tsc --noEmit`/`eslint .`/`npx jest` tous verts (128/128 tests, dont 8
  nouveaux `deriveMissionScreenState.test.ts` + 4 nouveaux `missionContext.test.tsx` d'intégration
  réelle State Machine → contexte → dérivation), `npx expo-doctor` 20/20. **Vérifiée sur device
  réel** (TECNO KL4, appareil branché en cours de tâche) : aucun nouveau build natif requis (aucune
  dépendance native ajoutée cette passe — `expo-speech`/gesture-handler/reanimated déjà présents
  depuis les sprints précédents), simple rechargement JS via Metro déjà actif. Session Supabase
  déjà authentifiée persistée (`AuthContext hydrate hasSession: true`), aucune erreur JS nouvelle
  dans les logs Metro, `<LiveMissionScreen />` s'affiche sans écran blanc/crash. La Mission #9
  réelle (déjà entièrement complétée lors du test de câblage Supabase du 2026-08-02) ne fournit
  plus d'item actif ni PROBLEM — l'écran affiche donc correctement le repli honnête « Aucune
  résidence active pour le moment » plutôt qu'un état inventé, exactement le comportement voulu
  par `deriveMissionScreenState`/`LiveMissionScreen`. Suivi ouvert (pas bloquant) : revalider avec
  une mission ayant encore des résidences WAITING/EN_ROUTE pour voir `MissionScreen` alimenté par
  de vraies données (carte/chronos/`reportProblem`/`resolveProblem`/`skipItem` en conditions
  réelles), par ex. via la mission de démo ou une nouvelle mission Supabase assignée.
- `MissionProvider` reçoit aussi `syncTransportOverride`/`speakerOverride` (en plus de
  `getDbOverride` déjà existant) — nécessaire pour que `tests/missionContext.test.tsx` ne touche
  jamais le vrai réseau Supabase ni un module natif de synthèse vocale (même règle que chaque
  moteur précédent, `memory.md`).
- `onReportProblem` (bouton « Signaler ») reste volontairement sans effet réel dans
  `LiveMissionScreen.tsx` : aucune UI n'existe pour choisir un `problemCode`, et aucune taxonomie
  n'est documentée (`docs/03`/`docs/07`/`docs/09`) — l'inventer aurait été une règle métier non
  validée. Documenté en commentaire dans le code, suivi ouvert pour un sprint futur.

## Archivé

### ✅ Sprint 016 — Voice Engine (branche `sprint-016-voice-engine`, 2026-08-02)

**Objectif** (Phase 10 Roadmap) : annonces vocales décrites par `docs/06-Voice-Engine.md`.
Contrairement au GPS/réseau (capteur réel différé dans leurs sprints respectifs), le Roadmap
liste explicitement « intégrer la synthèse vocale locale » dans les Travaux de cette phase —
**question posée au propriétaire, réponse : vraie synthèse maintenant** (nouveau module natif
`expo-speech`, même méthode de build que gesture-handler/reanimated).

**Portée retenue** :
- **Dedans** : moteur pur (file/priorité/anti-répétition/expiration/regroupement, `docs/06`),
  normalisation des adresses (abréviations `r./av./boul./ch./N/S/E/O`), intégration réelle
  `expo-speech` derrière une interface `Speaker` injectée (testable via un faux en test),
  répétition manuelle (`repeatCurrentContext`), mode silencieux (`setEnabled`).
- **Dehors, explicitement** : prononciation des nombres en toutes lettres (« deux cent
  vingt-quatre ») — les moteurs TTS embarqués prononcent déjà naturellement un nombre à 3 chiffres
  inséré dans une phrase normale sans le lire chiffre par chiffre ; construire un convertisseur
  français nombre→texte serait une grosse pièce de code à risque d'erreurs pour un gain minime,
  **décision pragmatique documentée, pas un oubli**. Audio ducking, interruption d'appel
  téléphonique réelle, comportement écran verrouillé (nécessitent des tests sur device réel en
  conditions réelles, difficiles à automatiser) ; détection gauche/droite de l'entrée (nécessite
  géométrie d'entrée non disponible actuellement) ; simulateur dev (`docs/06` "Interface de
  développement"/"Simulations", même différé que pour Offline Mode) ; câblage
  `MissionContext`/`VoiceButton` (même décision de portée que les 4 moteurs précédents — moteur
  prêt, pas encore d'appelant réel).

**Design** :
- `src/engines/voice/types.ts` — `VoiceAnnouncementType` (sous-ensemble curé des événements
  `docs/06`), `VoicePriority = 'CRITICAL'|'HIGH'|'NORMAL'|'LOW'`, `VoiceAnnouncement`
  (`id/type/priority/missionId?/missionItemId?/text/createdAt/expiresAt?/interruptible/
  deduplicationKey?/cooldownMs?/sourceEvent`), `Speaker` (interface injectée :
  `speak(text)`/`stop()`/`isAvailable()`), événements techniques (`VoiceQueued`/`VoiceStarted`/
  `VoiceCompleted`/`VoiceInterrupted`/`VoiceSkipped`/`VoiceFailed`).
- `src/engines/voice/textFormatting.ts` — `normalizeAddressForSpeech` (pure, testée) : développe
  les abréviations documentées, laisse les noms propres inchangés en l'absence de règle fiable.
- `src/engines/voice/messages.ts` — un constructeur pur par type d'événement reçu
  (`VOICE_MISSION_STARTED`/`VOICE_NEXT_RESIDENCE`/`VOICE_APPROACHING`/`VOICE_RESIDENCE_STARTED`/
  `VOICE_RESIDENCE_COMPLETED`/`VOICE_IMPORTANT_ALERT`/`VOICE_PROBLEM_RECORDED`/`VOICE_GPS_LOST`/
  `VOICE_GPS_RECOVERED`/`VOICE_OFFLINE`/`VOICE_ONLINE`/`VOICE_MISSION_COMPLETED`), phrasés repris
  verbatim des exemples `docs/06`. Regroupement résidence terminée + prochaine résidence en une
  seule annonce quand les deux événements arrivent ensemble (résidences rapprochées).
- `src/engines/voice/voiceEngine.ts` — `createVoiceEngine({ clock, speaker, cooldownMs=3000 })` :
  `handleEvent(event)` (dédup par règle `docs/06` — GPS_LOST une fois jusqu'au retour, etc. —
  puis enqueue), `processNext()` (l'appelant pompe, même principe « aucun timer propre » que les
  moteurs précédents), une annonce `CRITICAL` interrompt une annonce en cours (`speaker.stop()`),
  jamais entre annonces de même priorité, `repeatCurrentContext(snapshot)` (lecture manuelle
  détaillée, ignore le cooldown), `setEnabled(bool)` (mode silencieux : événements reçus/journalisés,
  rien lu), `getEvents()`/`on()`.
- `src/integrations/voice/expoSpeaker.ts` — implémentation réelle de `Speaker` via `expo-speech`
  (voix française canadienne si disponible, repli français générique puis signalement silencieux
  — `docs/06`), seul point de contact avec `expo-speech` hors ce fichier.
- Dépendance : `npx expo install expo-speech` → `expo prebuild` + `gradlew installDebug`
  (`arm64-v8a`, `plugins/withDevSingleAbi.js` déjà en place) → vérifier absence de régression.
- Tests : `tests/voiceEngine.test.ts` (file/priorité/interruption/anti-répétition/expiration/
  regroupement/mode silencieux/répétition manuelle) + normalisation d'adresse.

**Critères de réussite** : moteur testé isolément, aucune dépendance React ; `tsc`/`eslint`/`jest`
verts ; app vérifiée sans régression sur device après le nouveau build natif.

**Réalisé conformément au plan, du premier coup pour le moteur pur**. `src/engines/voice/`
(`types.ts`, `textFormatting.ts`, `messages.ts`, `voiceEngine.ts`, `index.ts`) +
`src/integrations/voice/expoSpeaker.ts`. Détails d'implémentation notables :
- `handleEvent()` gère l'invalidation croisée (`RESIDENCE_STARTED` retire un `APPROACHING` encore
  en file pour la même résidence) et la levée de dédoublonnage (`GPS_RECOVERED` efface la clé
  `gps-lost-*`, `ONLINE` efface `offline-*`) — pas de minuteur, tout déclenché par les événements
  eux-mêmes.
- Interruption implémentée via un drapeau `interruptRequested` posé de façon synchrone juste avant
  `speaker.stop()` dans `handleEvent` : comme `processNext()` est en train d'attendre la promesse
  de `speaker.speak()` au même moment, JS étant mono-thread, l'écriture du drapeau précède
  forcément la reprise de cette continuation (microtask) — évite un état partagé fragile ou un
  second mécanisme de communication entre les deux fonctions.
- Contrat `Speaker.speak()` : résout aussi bien sur fin naturelle (`onDone`) que sur arrêt
  (`onStopped`) — nécessaire pour que `speaker.stop()` débloque proprement un `await` en cours
  côté moteur.
- `repeatCurrentContext()` construit l'annonce puis force `cooldownMs: 0` sur l'objet en file
  (plutôt qu'un cas spécial dans `processNext`) — la répétition manuelle contourne le cooldown
  par construction, sans branche supplémentaire.
- **Piège de test découvert en écrivant `tests/voiceEngine.test.ts`** : un test de
  dédoublonnage GPS enchaînait 2 cycles parole/résolution avec le cooldown par défaut (3000 ms)
  actif — le 2e `processNext()` retournait `'waiting-cooldown'` sans jamais parler ni retirer
  l'annonce de la file, laissant un item orphelin et faisant échouer une assertion de longueur de
  file sans rapport apparent avec le cooldown. Fixé en passant `cooldownMs: 0` pour ce test
  précis (le cooldown lui-même est testé séparément) — réflexe à garder : un test qui enchaîne
  plusieurs `processNext()` doit soit avancer l'horloge, soit désactiver le cooldown.
- `expo-speech` ajouté sans reproduire les pièges de build des sprints précédents (daemon Gradle
  resté "BUSY" après un `--stop`, ou notification "killed" du harness alors que le build avait en
  réalité réussi en arrière-plan — vérifié via l'horodatage d'installation de l'app, pas fié à la
  seule notification).

`tsc`/`eslint`/`jest` (116/116, 12 suites)/`expo-doctor` (20/20) verts. App vérifiée sans
régression sur device (TECNO KL4) après le nouveau build natif. **Impact documentation** :
`tasks.md`, `file-index.md`.

## Archivé

### ✅ Sprint 015 — Offline Mode, portée noyau (branche `sprint-015-offline-mode`, 2026-08-02)

**Objectif** (Phase 09 Roadmap) : moteur de détection de connectivité décrit par
`docs/08-Offline-Mode.md` — le réseau ne doit jamais contrôler l'exécution de la mission.

**`docs/08` est volumineux** (détection réseau, cartes hors ligne Mapbox, médias, conflits
multi-appareils, simulateur dev, batterie/stockage faible). **Portée réduite validée avec le
propriétaire avant de coder** (question posée, réponse : « Noyau seulement ») :
- **Dedans** : moteur pur de détection de connectivité, 4 états (`ONLINE`/`DEGRADED`/`OFFLINE`/
  `RECOVERING` — réduit des 6 de `docs/08`, `SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED`
  explicitement hors de cette passe, voir ci-dessous).
- **Dehors, explicitement** : cartes hors ligne Mapbox (nécessite une vraie stratégie de
  téléchargement de tuiles, sprint dédié) ; médias (jamais implémentés dans ce repo, `docs/07`
  les diffère déjà) ; résolution de conflits multi-appareils (nécessite `reca-app`) ; simulateur
  dev (`docs/08` "Simulations") ; `SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED` (nécessiteraient
  un vrai ping serveur/refresh de jeton — le moteur ne teste que la connectivité réseau générale
  cette passe, pas l'accessibilité spécifique du serveur RECA ni Supabase Auth).

**Cohérence architecturale avec les moteurs existants** : comme le State Machine (Sprint 009-010),
le GPS Engine (Sprint 011-012) et le Sync Engine (Sprint 013-014), ce moteur est **pur, aucun
React, dépendances injectées**, testé isolément, **pas câblé dans `MissionContext`/`MissionScreen`
cette passe** — même décision de portée répétée à chaque moteur de ce repo, pas une régression.
Réutilise le `NetworkStatusProvider` déjà défini par le Sync Engine (`isOnline(): boolean`,
`src/engines/sync/types.ts`) plutôt que d'en inventer un second.

**Design** :
- `src/engines/offline/types.ts` — `ConnectivityStatus = 'ONLINE'|'DEGRADED'|'OFFLINE'|
  'RECOVERING'`, `OfflineEngineState { status, since, lastOnlineAt }` (volontairement minimal —
  `pendingOperations` reste la responsabilité du Sync Engine, `docs/08` dit explicitement que
  Offline Mode n'est pas responsable de « remplacer le Synchronization Engine » ; pas de
  duplication), événements (`OfflineModeActivated`/`OfflineModeDeactivated`/
  `ConnectivityDegraded`/`ConnectivityRecovered`, sous-ensemble pertinent de `docs/08`).
- `src/engines/offline/offlineEngine.ts` — `createOfflineEngine({ clock, networkStatus,
  consecutiveFailureThreshold, recoveryValidationDelaySeconds })`. **Aucun timer propre** (même
  principe que GPS Engine, `docs/04` : « le moteur ne possède aucun timer propre ») — deux points
  d'entrée appelés par l'appelant :
  - `checkConnectivity()` : lit `networkStatus.isOnline()`, gère les transitions
    ONLINE/DEGRADED↔OFFLINE↔RECOVERING↔ONLINE.
  - `recordOperationOutcome(success)` : à appeler après chaque tentative réseau réelle (ex. Sync
    Engine) — une seule requête échouée ne suffit pas (`docs/08` : « ne doit pas suffire »),
    `consecutiveFailureThreshold` échecs consécutifs avec réseau système "en ligne" → `DEGRADED`.
  - `OFFLINE → RECOVERING` dès que `networkStatus.isOnline()` redevient vrai ; `RECOVERING →
    ONLINE` seulement après validation (délai + un succès confirmé), jamais immédiat (`docs/08` :
    « ne doit pas afficher immédiatement En ligne avant cette validation »).
- `src/engines/offline/index.ts` — barrel.
- `tests/offlineEngine.test.ts` — transitions ONLINE→DEGRADED (échecs consécutifs, réseau système
  toujours dispo), →OFFLINE (réseau système indisponible, immédiat, pas besoin d'échecs
  consécutifs), OFFLINE→RECOVERING→ONLINE (validation avant confirmation), pas de flap sur un
  seul échec isolé, journalisation des transitions (`getEvents()`).

**Critères de réussite (adaptés à la portée noyau)** : transitions correctes et testées ; aucune
dépendance à React ; `tsc`/`eslint`/`jest` verts.

**Hors scope, suivi explicite** : câblage `MissionContext.offlineState` (actuellement un
placeholder typé, comme `gpsState`/`synchronizationState`) ; cartes hors ligne ; médias ; conflits
multi-appareils ; simulateur dev ; `SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED`.

**Réalisé conformément au plan, du premier coup** : `src/engines/offline/` (`types.ts`,
`offlineEngine.ts`, `index.ts`). `createOfflineEngine({clock, networkStatus,
consecutiveFailureThreshold=3, recoveryValidationDelaySeconds=5})` — chaque transition source
associée à un seul type d'événement (`RECOVERING` n'est atteignable que depuis `OFFLINE`, donc
`ONLINE`←`RECOVERING` suffit à savoir qu'une vraie période hors ligne vient de se terminer, pas
besoin d'un drapeau séparé). `recordOperationOutcome(true)` pendant `RECOVERING` confirme
`ONLINE` immédiatement (signal plus fort que le délai seul) plutôt que d'attendre
`recoveryValidationDelaySeconds`. 9 tests (`tests/offlineEngine.test.ts`, patron `createMutableClock`
repris de `tests/gpsEngine.test.ts`) : démarrage `ONLINE`, 1 échec insuffisant, N échecs
consécutifs → `DEGRADED`, succès après `DEGRADED` réinitialise le compteur, réseau système
indisponible → `OFFLINE` immédiat, cycle complet `OFFLINE→RECOVERING→ONLINE` avec délai respecté,
confirmation immédiate par succès réel pendant `RECOVERING`, `lastOnlineAt` figé pendant `OFFLINE`,
abonnement/désabonnement aux événements. `tsc`/`eslint`/`jest` (100/100, 11 suites)/`expo-doctor`
(20/20) verts. **Impact documentation** : `tasks.md`, `file-index.md`.

## Archivé

### ✅ Refonte visuelle des écrans opérateur — branche `PLAN-ECRANS-OPERATEUR-RECA` (2026-08-02)

**Source** : `.input/PLAN-ECRANS-OPERATEUR-RECA.md` (spec du propriétaire). **Hors roadmap
numérotée** (pas un sprint `docs/11`) — refonte de fidélité visuelle sur l'écran déjà livré
(Sprints 002-004), comparable en nature aux passes de calibrage du 2026-08-02 mais bien plus
large. Reprend/étend l'invariant Map First (`docs/02`) : carte plein écran sous le header, tout
le reste flotte au-dessus.

**Décisions prises avec le propriétaire avant de coder** :
1. **Découpage en phases séquentielles**, une seule branche/PR, vérification device après
   chaque phase (pas tout d'un coup).
2. **`react-native-gesture-handler` + `react-native-reanimated` ajoutés maintenant** (nouveaux
   modules natifs → nouveau `expo prebuild` + `gradlew installDebug`, ~10 min, même pattern que
   `@react-native-async-storage/async-storage` cette semaine) — nécessaires pour le vrai
   glissement du bottom sheet (25/50/75/100%), pas de solution de repli sans geste.
3. **Le header revient à sa forme complète** (hamburger + logo + « OPÉRATEUR » + sync + cloche
   d'alertes) — **annule explicitement** la simplification du 2026-08-02 (logo seul, décision
   validée à l'époque). Nouvelle demande explicite du propriétaire, pas une régression à corriger
   dans l'autre sens plus tard sans revalidation.

**État actuel étudié avant de planifier** (via exploration du code, voir aussi `memory.md`) :
- `MissionScreen.tsx` : 3 blocs empilés (topSection/mapArea/bottomSection), overlays absolus dans
  `mapArea` (topOverlay mesuré par `onLayout`, leftColumn PROBLEM-only, rightColumn contrôles+météo).
  `mapArea.minHeight:60` est un filet de sécurité **fragile** (voir passes de calibrage) — à ne
  jamais remonter.
- `AppHeader.tsx` actuel = logo seul, aucune prop. À réélargir (props `onMenu`/`onAlerts`/
  `alertsCount`/`syncState`).
- `MissionCard.tsx` (pleine, actuellement utilisée) vs `MissionCardCompact.tsx` (**existe déjà,
  inutilisée** — ligne unique ~40px, props `missionId/index/total/progressPct` seulement, pas de
  chip d'état/chrono) : à étendre avec `phaseLabel/phaseSeconds/phaseColor` pour matcher
  `3/28   10%   EN ROUTE · 04:37` du spec.
- `CurrentResidenceSheet.tsx` : contenu fixe (pas de geste) rendu directement dans
  `bottomSection` — pas dans le composant coquille `BottomSheet.tsx` (`components/controls/`,
  lui aussi sans geste, **jamais utilisé par MissionScreen** actuellement). Le vrai travail de
  cette passe : faire de `BottomSheet` un vrai conteneur gestuel (snap 25/50/75/100, `reanimated`
  shared value + `gesture-handler` Pan), et y rendre le contenu de `CurrentResidenceSheet` (état
  fermé) ou de `ProblemStateCard` (état PROBLEM — fusion demandée par le spec).
- `BottomTabBar.tsx` : rendue en bas de `bottomSection` aujourd'hui, **Mission/Alertes/Plus déjà
  documentées comme placeholders décoratifs** (aucune régression à ce niveau — leurs actions
  n'existent nulle part, se redistribuer vers header/hamburger ne perd donc rien de fonctionnel
  réel). Composant **retiré du rendu de `MissionScreen`** par cette passe (pas supprimé du repo —
  même précédent que `CurrentResidenceProgressCard`, `ComponentGalleryScreen` en référence).
- `VoiceButton.tsx` : actuellement niché dans `BottomTabBar` (`marginTop:-28` pour flotter
  au-dessus) — devient un flottant indépendant positionné par `MissionScreen` lui-même.
- Aucune table/valeur de « instruction principale + N instructions secondaires » n'existe
  aujourd'hui dans `missionScreenState.ts` — seul `alerts[]` (groupé via `AlertsRow`/`AlertCard`+
  `Pill`, Sprint 004) s'en approche ; le spec demande un composant distinct positionné sur la
  carte (pas dans le topOverlay), affichage single-instruction.

**Portée par phase** (une seule branche, commits séparés par phase, test device après chacune) :

1. **Dépendances natives** : `npx expo install react-native-gesture-handler react-native-reanimated`
   → `babel.config.js` (`react-native-reanimated/plugin`, **doit être le dernier plugin**) →
   `App.tsx` (`GestureHandlerRootView` à la racine) → mocks Jest (`react-native-reanimated` fournit
   son propre mock officiel à enregistrer via `jest.config` `setupFiles`, `react-native-gesture-handler`
   idem via `react-native-gesture-handler/jestSetup`) → `expo prebuild` + `gradlew installDebug` →
   vérifier que l'app démarre toujours (pas de régression, aucun changement fonctionnel visible).
2. **Header restauré** : `AppHeader.tsx` reprend hamburger (gauche) + logo centré + « OPÉRATEUR »
   (Wordmark) + statut sync + cloche alertes (droite), hauteur cible 11-13% écran. Props
   `onMenu?/onAlerts?/alertsCount?/syncState`. `onMenu`/`onAlerts` restent **no-op** pour l'instant
   (mêmes destinations placeholders que l'ancien `BottomTabBar` — Mission/Plus/Alertes n'ont
   toujours pas d'écran réel, Phase 11 roadmap).
3. **Retrait de la barre de navigation du bas** : `MissionScreen.tsx` ne rend plus `BottomTabBar`.
   `VoiceButton` devient un flottant positionné par `MissionScreen` (au-dessus du bottom sheet ou
   bas-droite, diamètre 64-72px, cohérent avec le composant existant).
4. **Mission card compacte** : `MissionCardCompact.tsx` étendue (chip d'état + chrono inline),
   remplace `MissionCard` (pleine) dans `MissionScreen.topSection`. Toucher ouvre toujours
   `onDetails` (no-op, comme avant).
5. **Bandeau d'instruction contextuelle sur la carte** : nouveau composant
   `InstructionBanner.tsx` (icône+texte principal + chip `+N instructions`, style proche
   `AlertCard`/`Pill` réutilisés) — affiché en EN APPROCHE/EN COURS seulement, positionné sous la
   mission card compacte (pas dans `topOverlay` actuel, qui reste pour `OfflineIndicator`).
   `missionScreenState.ts` gagne `primaryInstruction?: {icon, text}` +
   `secondaryInstructionsCount?: number`.
6. **Bottom sheet extensible réel** : `BottomSheet.tsx` (`components/controls/`) refondu avec
   `reanimated`/`gesture-handler` (snap 25/50/75/100, position fermée = contenu actuel de
   `CurrentResidenceSheet`). `MissionScreen` rend `BottomSheet` au lieu de `CurrentResidenceSheet`
   directement ; `CurrentResidenceSheet` devient le **contenu** de la position fermée (garde ses
   4 boutons Appeler/Note/Itinéraire/Signaler), la position ouverte affiche instructions/contact/
   photos/notes/historique (contenu minimal pour cette passe — pas de nouvelles données serveur à
   inventer, ce que `missionScreenState.ts` expose déjà suffit, étoffer plus tard si besoin réel).
7. **Fusion Problème/Résidence** : en état PROBLEM, le bottom sheet affiche le contenu de
   `ProblemStateCard` à la place de `CurrentResidenceSheet` (35-42% écran, semi-ouvert) —
   `leftColumn` (actuel emplacement de `ProblemStateCard`) retiré, plus de carte flottante séparée
   pour cet état.
8. **Calibrage des 4 écrans** : comparer chaque état aux répartitions cibles du spec (%
   header/mission/carte/résidence par écran) sur device réel (TECNO KL4), ajuster `spacing`/
   tokens existants (jamais de valeur inventée hors échelle `spacing`) comme lors des passes de
   calibrage précédentes.
9. **Mocks/tests** : `missionScreenMocks.ts` mis à jour (instructions des exemples du spec :
   « Plate-bande au fond », « Boîte aux lettres à droite de l'entrée »). Tests Jest mis à jour
   pour les nouveaux composants/props ; mock `reanimated`/`gesture-handler` ajoutés à la config
   Jest (même famille que les mocks `rnmapbox`/`lucide`/`async-storage` existants).

**Réalisé conformément au plan, phases 1-9 toutes terminées et vérifiées sur device (TECNO
KL4)** :
1. Dépendances natives ajoutées (`react-native-gesture-handler` ~2.32, `react-native-reanimated`
   4.5.1 + peer `react-native-worklets` 0.10.1) — build restreint à `reactNativeArchitectures=
   arm64-v8a` via nouveau plugin `plugins/withDevSingleAbi.js` (dev-only, sinon le build 4-ABI
   dépassait la limite de 10 min de l'outillage). Bug réel trouvé et corrigé au passage :
   `AuthContext.getSession()` sans `.catch()` pouvait bloquer l'app indéfiniment sur `'loading'`.
2. `AppHeader.tsx` restauré (hamburger/logo/OPÉRATEUR/sync/cloche), `syncState` threadé via
   `SYNC_STATE_META` exporté de `SyncIndicator.tsx` (pas de mapping dupliqué).
3. `BottomTabBar` retirée de `MissionScreen` (composant conservé, plus rendu) ; `VoiceButton`
   flottant indépendant (label texte rendu optionnel — chevauchait le contenu en dessous une fois
   sorti de la barre).
4. `MissionCardCompact.tsx` réécrite selon le spec exact ; remplace `MissionCard` pleine dans
   `MissionScreen`.
5. **Aucun code ajouté** — `alerts`/`AlertsRow`/`topOverlay` (Sprint 004) satisfaisaient déjà
   exactement le besoin, textes d'exemple identiques déjà dans les mocks. Vérifié avant de coder,
   pas de doublon créé.
6. `BottomSheet.tsx` refondu avec de vrais gestes (`Gesture.Pan` + `useSharedValue`/
   `useAnimatedStyle`/`withSpring`), snap 25/50/75/100, plein-bord. Cycle ouverture/fermeture
   vérifié sur device. Deux pièges Reanimated 4 corrigés (lecture `.value` pendant le rendu ;
   fonction JS plate appelée depuis un worklet sans directive `'worklet'`, crash
   `[Worklets] Tried to synchronously call a Remote Function`).
7. `leftColumn` (colonne PROBLEM étroite) retirée ; `ProblemStateCard` devient le contenu du
   sheet en état PROBLEM. **Bug de rendu réel trouvé et corrigé** : texte invisible dans les 2
   boutons d'action (confirmé non-logique via test Jest jetable) — `Txt` en enfant direct de
   `PressableScale` (Animated classique `react-native`) imbriqué dans l'Animated.View Reanimated
   de `BottomSheet` ne peignait pas sur ce device/GPU ; fixé en passant à `Pressable` brut pour
   ces 2 boutons (perte de l'animation scale, acceptable). Règle consignée dans `memory.md` pour
   la suite.
8. Les 4 écrans comparés sur device : nette amélioration de l'espace carte partout (retrait de la
   barre du bas + carte compacte). La limite déjà documentée (EN COURS + hors-ligne + alerte)
   persiste mais bien moins sévère qu'avant — pas une régression, pas retentée en boucle.
9. Mocks déjà conformes (découvert en Phase 5) ; tests Jest mis à jour (`missionScreen.test.tsx` :
   retrait de l'assertion sur l'ancien tab « Carte » disparu) ; mocks `react-native-worklets`
   (pas `react-native-reanimated` — son propre `mock.js` importe l'entrée réelle et plante sous
   Jest) + `react-native-gesture-handler/jestSetup.js` ajoutés à la config Jest.

`tsc`/`eslint`/`jest` (91/91, 10 suites)/`expo-doctor` (20/20) tous verts. **Impact
documentation** : `memory.md` (3 sections détaillées : Phase 1, Phases 2-6, Phase 7 — pièges
Reanimated 4, bug de rendu texte, technique de diagnostic), `tasks.md`, `file-index.md`.

**Hors scope, non inventé, suivis ouverts** : contenu réel du bottom sheet en position ouverte
au-delà de ce que `missionScreenState.ts` expose déjà (photos/historique détaillé = données
serveur qui n'existent
pas encore) ; vraies destinations Mission/Alertes/Plus (Phase 11 roadmap, inchangé) ; transitions
automatiques déclenchées par géolocalisation réelle (GPS Engine existe mais n'est pas câblé à
`MissionScreen`, décision de portée déjà actée plusieurs sprints — pas réouverte ici).

**Vérification** : `tsc`/`eslint`/`jest` verts après chaque phase ; comparaison visuelle sur
device réel (TECNO KL4) contre les répartitions % du spec pour les 4 écrans, à la fin.

## Archivé

### ✅ Intégration Supabase réelle — suivi explicite du Sprint 013-014 (2026-08-02)

**Déclencheur** : le propriétaire vient de rendre `reca-app` accessible sur cette machine
(cloné dans `/c/var/www/html/reca-app`) et a ajouté ses credentials Supabase (`.env`). C'est la
tâche de suivi promise dans `tasks.md`/`memory.md` au Sprint 013-014 (« vrai câblage Supabase
reporté dès que `reca-app`/credentials accessibles »).

**Étude du schéma réel** (`reca-app/supabase/migrations/2026072*missions*`,
`*mission_items_live_status*`, `*mission_items_durations*`) : `missions`/`mission_items`
existent avec RLS **opérateur-scopée** (`missions_update_admin_or_operator`,
`mission_items_update_admin_or_operator` — l'opérateur assigné, via
`employees.user_id = auth.uid()` puis `missions.operator_id`, peut **UPDATE** sa mission et ses
items ; **INSERT/DELETE restent admin-only**, aucune UI ne permet à l'opérateur de créer une
Mission). Colonnes pertinentes déjà en place : `missions.statut/heure_debut/heure_fin`,
`mission_items.statut/statut_operateur/heure_arrivee/heure_fin/duree_trajet_secondes/
duree_intervention_secondes`. **Aucune table `problems`/notes par item côté serveur** — le
Roadmap Phase 08 liste Problem/Note comme cibles de « première intégration serveur » mais le
schéma réel ne les supporte pas encore : **exclu explicitement de cette passe**, comme
`docs/07` exclut déjà les médias (« peuvent être ajoutés plus tard »).

**3 blocages soumis au propriétaire, réponses reçues** :
1. **Mission de test réelle** — le propriétaire va en créer une dans `reca-app` (admin,
   `operator_id` → son employé). Sans ça, toute écriture échoue (FK + RLS).
2. **Authentification** — écran de login minimal maintenant (email/mot de passe via Supabase
   Auth), plutôt qu'une session codée en dur. Anticipe une partie du Sprint 017-019 (Auth), mais
   c'est un vrai préalable RLS (`auth.uid()`), pas un détail cosmétique.
3. **Mapping de statut** — `PROBLEM`/`SKIPPED` (local) → `a_reprendre` (serveur, convergent).
   `CANCELLED` **ne doit jamais être produit par l'opérateur** (règle métier confirmée : une
   résidence infaisable reste `a_reprendre`, jamais annulée — seul un superviseur classe la
   mission `terminee_avec_anomalies` dans `reca-app`). Nouvelle règle métier découverte à cette
   occasion, **pas inventée** : à la fin d'une mission, l'opérateur reste actif durant son trajet
   retour au garage, puis appuie sur **« Fermer la mission »** (→ `requestMissionComplete`, déjà
   implémenté Sprint 009-010) — ceci écrit `heure_fin`/`statut` côté serveur et sert de feuille de
   temps (`heure_debut`/`heure_fin` existent déjà sur `missions`, aucune colonne à ajouter).
   Mapping mission : `statut = 'terminee'` si tous les items sont `terminee`, sinon
   `'terminee_avec_anomalies'` (au moins un `a_reprendre`) — dérivation automatique, cohérente
   avec la règle « signaler au superviseur » sans inventer de nouvelle colonne.

**Portée retenue pour cette passe** (le bouton UI « Fermer la mission » lui-même est un suivi
séparé — `Mission`/`Plus` restent des onglets placeholders, Sprint 003/004 — mais le câblage
serveur de `requestMissionComplete` est déjà couvert par la transport layer ci-dessous) :

1. **`@supabase/supabase-js`** ajouté. `src/integrations/supabase/supabaseClient.ts` — point de
   contact unique (mirror `mapboxClient.ts`), lit `EXPO_PUBLIC_SUPABASE_URL`/
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (`.env.local`/`.env.example` mis à jour — mêmes valeurs que
   `reca-app/.env`, même projet Supabase partagé, déjà documenté dans `memory.md`).
2. **`AuthContext`** (`src/context/AuthContext.tsx`) : session Supabase Auth (email/mot de passe),
   résout `employeeId` (`employees` où `user_id = auth.uid()`). **`LoginScreen`**
   (`src/screens/LoginScreen.tsx`, thème existant, aucun nouveau token). `App.tsx` : non
   authentifié → `LoginScreen`, sinon flux actuel inchangé (`MissionProvider`/
   `MissionScreenPreview`).
3. **Mapping de statut pur et testé** (`src/integrations/supabase/statusMapping.ts`) :
   `toServerItemStatus`/`toServerMissionStatus`. `CANCELLED` (jamais censé être produit par
   l'opérateur) lève une erreur explicite plutôt qu'un mapping silencieux — cohérent avec
   « erreurs permanentes » de `docs/07`.
4. **`SupabaseSyncTransport`** (`src/integrations/supabase/supabaseSyncTransport.ts`), implémente
   `SyncTransport.send()` : parse chaque `SyncOperation.payload` (snapshot `Mission`/
   `MissionItem` complet, déjà le modèle retenu au Sprint 013-014), construit un **UPDATE partiel**
   limité aux colonnes que l'opérateur possède légitimement (jamais `route_id`/`operator_id`/
   `date`/etc. — « les modifications administratives ont priorité », `docs/07`), classe les
   erreurs Postgres/réseau en `TEMPORARY`/`PERMANENT` pour le moteur existant. `NetworkStatusProvider`
   reste un stub injecté (pas de `NetInfo` réel cette passe — même principe « logique d'abord,
   capteur ensuite » que GPS/State Machine, décision déjà établie).
5. **`fetchAssignedMission`** (`src/integrations/supabase/fetchAssignedMission.ts`) : après
   connexion, cherche la Mission du jour assignée à l'employé (`operator_id`), ses `mission_items`
   joints à `contracts`/`clients` (mirror `missionsMap.service.ts` de `reca-app` pour
   adresse/lat/lng), mappe vers les entités locales **avec les vrais id serveur** (jamais de
   nouvel UUID généré pour une entité qui existe déjà côté serveur). `MissionContext` appelle ceci
   en priorité ; `seedDemoMissionIfEmpty` reste le repli **dev uniquement** quand aucune mission
   réelle n'est assignée (aucune régression pour le calibrage visuel en cours).
6. **Tests** : `statusMapping` (pur), `SupabaseSyncTransport` (client Supabase mocké, même famille
   que `rnmapboxMock.js`), mapping de `fetchAssignedMission` (fonction pure séparée de l'appel
   réseau, testée isolément).

**Hors scope, suivi explicite** : bouton UI « Fermer la mission » (nécessite un vrai écran
`Mission`, actuellement placeholder) ; `NetInfo` réel ; Problem/Note serveur (schéma absent) ;
médias ; conflits de version/horloge incorrecte (toujours différés depuis le Sprint 013-014).

**Réalisé conformément au plan**. Les 6 points livrés tels que décrits ci-dessus. **Pièges
rencontrés en implémentant** (non anticipés dans le plan initial) :
- `AsyncStorage` natif est `null` sous Jest dès qu'on importe `supabaseClient.ts` (chaîne
  d'imports : `MissionContext` → `fetchAssignedMission` → `supabaseClient`) — fixé par le mock
  officiel de la lib (`@react-native-async-storage/async-storage/jest/async-storage-mock.js`),
  mais **via `moduleNameMapper`, pas `setupFiles`** (le fichier ne s'auto-enregistre pas avec
  `jest.mock`, contrairement à ce que sa doc suggère à première lecture — même famille de piège
  que les mocks `.js` volontaires du Sprint 002/007-008).
- `process.env.EXPO_PUBLIC_*` est vide sous Jest : le chargement de `.env.local` est un mécanisme
  de la CLI `expo start`/`expo export`, jamais de `jest` seul (contrairement à `reca-app`, où
  Vite/Vitest le fait). Fixé par `tests/setupSupabaseEnv.js` (valeurs factices, aucun test ne
  touche le vrai réseau — `supabaseSyncTransport`/`fetchAssignedMission` reçoivent toujours un
  client injecté en test).
- `noUncheckedIndexedAccess` (déjà activé, `docs/10`) rend `const [x] = arr` potentiellement
  `undefined` en TS strict — pattern du repo (`tests/syncEngine.test.ts`) : `arr[0]?.prop` dans
  les `expect`, jamais de destructuration nue d'un tableau non garanti non-vide.
- Le faux `SupabaseClient` de test reproduit **exactement** les 2 formes d'appel utilisées par le
  transport réel (`.update().eq().select()` et `.select().eq().eq().is()`) plutôt que de mocker le
  SDK en entier — même philosophie que `tests/testFakeDb.ts` (Sprint 007-008).

`tsc`/`eslint`/`jest` (91/91, 10 suites)/`expo-doctor` (20/20) verts. **Non vérifié sur device
réel** : nécessite la Mission de test que le propriétaire va créer dans `reca-app`, puis une
connexion réelle via `LoginScreen` sur le dev build — suivi ouvert dans `tasks.md`.

**Impact documentation** : `memory.md` mis à jour (mapping de statut, règle métier « Fermer la
mission », convention id serveur=id local pour toute mission réelle, pièges Jest ci-dessus),
`tasks.md` (suivi Supabase clos + 2 nouveaux suivis ouverts : bouton fermer mission, vérif device),
`file-index.md` mis à jour.

---

### ✅ Sprint 013-014 — Synchronization Engine (2026-08-02)

**Objectif** (Phase 08 Roadmap) : implémenter le moteur de synchronisation décrit par
`docs/07-Synchronization.md` — file persistante, idempotence, ordre par mission, lots,
réessais avec attente progressive, erreurs temporaires vs bloquantes, indicateur d'état exposé au
MissionContext. Moteur pur (`src/engines/sync/`), aucun React, dépendances injectées.

**Blocage rencontré et décision du propriétaire** : le Roadmap demande explicitement « étudier les
structures dans `reca-app` » avant de définir le vrai contrat serveur (Phase 08 « Première
intégration serveur »). **`reca-app` n'est pas présent sur cette machine** (seul `reca-operateur`
y est cloné) et aucune credential Supabase n'existe dans ce dépôt. Question posée au propriétaire ;
réponse : **construire le moteur local uniquement**, avec un **transport réseau injecté** (interface
abstraite `SyncTransport`, pas de vrai client Supabase) — le câblage Supabase réel + schéma
`reca-app` devient une **tâche de suivi explicite** dès que `reca-app`/credentials sont
accessibles. Cette décision **exclut de facto** certains scénarios de tests obligatoires de
`docs/07` qui nécessitent un vrai serveur (authentification expirée — aucun système d'auth
n'existe encore, Sprint 017-019 ; médias — jamais implémentés, différé comme le prévoit `docs/07`
lui-même ; conflit de version — la politique de résolution dépend du schéma `reca-app`, différée ;
horloge appareil incorrecte — nécessite un round-trip serveur réel pour comparer ; espace disque
faible — hors Travaux explicites de cette phase).

**Contexte** : `sync_operations` existe déjà (Sprint 007-008, vide) mais avec un schéma
simplifié (`entityType`/`entityId`/`operation`/`payload`/`status: PENDING|SYNCED|FAILED`) très en
retrait du type `SyncOperation` documenté par `docs/07` (`localSequence`, `attemptCount`,
`idempotencyKey`, `status: PENDING|PROCESSING|CONFIRMED|FAILED|BLOCKED`,
`lastAttemptAt`/`nextAttemptAt`, `lastErrorCode`/`lastErrorMessage`). Le State Machine
(Sprint 009-010) écrit déjà une ligne `SyncOperation` par transition (**snapshot complet de
l'entité**, pas un événement métier typé finement comme `ITEM_STARTED`/`ITEM_COMPLETED` listés en
exemple dans `docs/07`) — **décision retenue : garder ce modèle** (upsert de snapshot) plutôt que
de refondre le State Machine en émetteur d'événements typés à grain fin, parce qu'un upsert de
snapshot complet est **naturellement idempotent** (rejouer la même ligne deux fois ne change rien)
sans mécanisme de résolution supplémentaire à inventer — simplification consciente, pas un manque
de compréhension de `docs/07`.

**Portée retenue** :
- `SyncOperation` (`src/domain/entities.ts`) étendue avec les champs manquants de `docs/07`
  (migration additive de `sync_operations`, sans mécanisme d'`ALTER TABLE` — le schéma n'a encore
  aucun utilisateur réel, une redéfinition de `CREATE TABLE` suffit, cohérent avec `docs/10`
  « pas d'abstraction prématurée »). `idempotencyKey` = le même `id` généré localement (déjà stable
  et unique — pas de second identifiant à inventer, `docs/07` n'exige pas qu'ils soient distincts).
- **Moteur = processeur de file, pas producteur** : `enqueue` reste la responsabilité des moteurs
  producteurs existants (State Machine ✅, futurs Problem/Note) qui écrivent déjà dans
  `sync_operations` au sein de leur propre transaction (`docs/07` « Écriture locale »). Le
  Synchronization Engine **lit** la file (`runSyncCycle()`), envoie par lots via `SyncTransport`
  injecté, applique réessais/priorités, expose `SynchronizationState`.
- **Ordre garanti par mission** (`localSequence` croissant), **priorité seulement entre missions
  indépendantes** — jamais à l'intérieur d'une même mission (`docs/07` : « les priorités ne
  doivent jamais briser l'ordre métier obligatoire »).
- **Réessais** : attente progressive (immédiat/5s/15s/30s/60s puis plafond croissant) + gigue
  aléatoire injectable (testable en désactivant la gigue) ; après un nombre d'échecs configurable
  → `BLOCKED` (reste conservé, jamais supprimé). Erreur permanente (via `SyncTransport`) → `BLOCKED`
  immédiatement, sans réessai.
- **Récupération au démarrage** : toute opération encore `PROCESSING` (app tuée pendant un envoi)
  repasse à `PENDING` (`docs/07` « Reprise après interruption »).
- **Hors ligne** : `NetworkStatusProvider` injecté (`isOnline(): boolean`) — aucun vrai module
  `NetInfo` câblé ce sprint (même principe que GPS/State Machine : logique d'abord, capteur réel
  ensuite). `runSyncCycle()` ne fait rien si hors ligne (état `OFFLINE`).

**Fichiers prévus** :
- `src/domain/entities.ts` — `SyncOperation` étendu, `SyncOperationStatus` aligné sur `docs/07`.
- `src/persistence/migrations.ts` — `sync_operations` redéfinie avec les nouvelles colonnes.
- `src/persistence/repositories/syncOperationRepository.ts` — mis à jour pour les nouveaux champs.
- `src/engines/sync/types.ts` — `SyncTransport`, `NetworkStatusProvider`, `SynchronizationState`,
  `SyncEngineEvent`.
- `src/engines/sync/backoff.ts` — `computeBackoffDelaySeconds` (pur, testé).
- `src/engines/sync/priority.ts` — tri de lot respectant l'ordre intra-mission.
- `src/engines/sync/syncEngine.ts` — `createSynchronizationEngine({ db, clock, transport, network,
  ... })` : `runSyncCycle`, `recoverOnStartup`, `retryOperation`, `getSynchronizationState`,
  `on`/`getEvents`.
- `src/engines/sync/index.ts` — barrel.
- `tests/syncEngine.test.ts` (nouveau) : mission en ligne, hors ligne, réseau intermittent
  (réessai avec délai), serveur indisponible (erreur temporaire), doublon (idempotence — renvoyer
  deux fois la même opération ne change rien), réponse serveur perdue (transport confirme après
  coup), lot partiellement accepté, opération invalide (erreur permanente → `BLOCKED`), fermeture
  pendant synchronisation (récupération `PROCESSING`→`PENDING`), résidences rapprochées (ordre
  préservé), plusieurs centaines d'opérations en attente (lots).

**Critères de réussite** (Roadmap Phase 08, adaptés à la portée locale) : les opérations
survivent à un redémarrage simulé ; les doublons ne créent aucun double effet (payload idempotent
+ opération confirmée jamais rejouée) ; l'ordre par mission est conservé ; le réseau absent ne
bloque rien ; `tsc`/`eslint`/`jest` verts.

**Limite assumée** : aucun vrai client Supabase (transport injecté, `FakeSyncTransport` en test) ;
schéma serveur réel/RLS/rôle opérateur à revalider avec `reca-app` avant le vrai câblage
(tâche de suivi explicite dans `tasks.md`) ; auth/médias/conflits de version/horloge/espace disque
différés (raisons ci-dessus) ; pas de câblage `MissionContext`/`MissionScreen` (même décision de
portée que State Machine/GPS Engine).

**Réalisé conformément au plan**. `SyncOperation` étendue (`missionId`/`missionItemId`/
`localSequence`/`attemptCount`/`idempotencyKey`/`lastAttemptAt`/`nextAttemptAt`/`lastErrorCode`/
`lastErrorMessage`), `sync_operations` redéfinie, `syncOperationRepository` mis à jour. Le State
Machine (Sprint 009-010) a dû être ajusté en conséquence : `buildSyncOperation` déplacée dans la
closure de `createStateMachine` (elle a besoin de `syncRepo` pour calculer `localSequence` — un
compteur en mémoire par mission, réamorcé depuis le max persisté au premier usage) et rendue
asynchrone ; les 4 sites d'appel (transition simple, activation automatique, résidences
adjacentes ×2, transition de mission) mis à jour en conséquence — tous les tests existants
(72/72 avant modification du domaine → toujours 72/72 après) sont restés verts sans changement de
leurs propres assertions, seule la forme interne a changé.

`src/engines/sync/` : `backoff.ts` (`computeBackoffDelaySeconds`, testé contre le palier exact de
`docs/07`), `priority.ts` (`selectBatch` — groupe par mission, trie chaque groupe par
`localSequence`, ordonne les groupes par priorité, ne casse jamais l'ordre intra-mission),
`syncEngine.ts` (`createSynchronizationEngine`), `types.ts`, `index.ts`.

16 tests dans `tests/syncEngine.test.ts` : backoff (palier exact + gigue), `selectBatch` (ordre
intra-mission jamais cassé, priorité inter-missions, troncature par lot), mission en ligne/hors
ligne, réseau intermittent (échec temporaire → réessai après délai → succès), serveur indisponible
(échecs répétés → `BLOCKED` après `maxAttempts`), opération invalide (erreur permanente → `BLOCKED`
immédiat, aucun réessai), lot partiellement accepté, doublon/réponse perdue (transport factice qui
compte les **effets réels** par `idempotencyKey`, indépendamment du nombre d'appels — prouve
qu'un renvoi ne double jamais l'effet), récupération `PROCESSING`→`PENDING` au démarrage, 250
opérations en attente traitées par lots en ordre strict, réessai manuel, et un test d'intégration
bout-en-bout (State Machine réel → 2 `SyncOperation` du cas résidences adjacentes → synchronisées
dans l'ordre exact où elles ont été écrites). `tsc`/`eslint`/`jest` (72/72, 7 suites) verts.

**Impact documentation** : `memory.md` mis à jour (blocage `reca-app` + décision du propriétaire,
modèle snapshot vs événements typés, champs `SyncOperation` étendus, ajustement rétroactif du
State Machine), `tasks.md` (dont une entrée de suivi explicite pour le vrai câblage Supabase dès
que `reca-app`/credentials sont accessibles), `file-index.md` mis à jour.

**Limite** : aucun vrai client Supabase ; schéma serveur réel/RLS/rôle opérateur à revalider avec
`reca-app` ; auth/médias/conflits de version/horloge appareil/espace disque différés (raisons
ci-dessus) ; pas de câblage `MissionContext`/`MissionScreen`.

## Archivé

### ✅ Sprint 011-012 — GPS Engine (2026-08-01)

**Objectif** (Phase 07 Roadmap) : implémenter le moteur GPS décrit par `docs/04-GPS-Engine.md` —
calcul de distance, seuils (approche/début/fin), délais de validation, stabilisation du cap,
détection perte/retour GPS, cas des résidences rapprochées — qui **appelle** les commandes du
State Machine (Sprint 009-010) une fois une transition validée, jamais l'inverse. Moteur pur
(`src/engines/gps/`), aucun React, dépendances injectées (`StateMachine`, `Clock`). **Simulation
obligatoire avant essais terrain** (Roadmap : « créer un simulateur permettant d'injecter des
positions, déplacer le véhicule, entrer/sortir des rayons, simuler précision faible/résidence
adjacente/perte GPS ») — contrairement au mode simulation du State Machine (différé au Sprint
017-019), celui-ci est un **Travail explicite de cette phase**, pas une UI développeur : il prend
la forme d'un petit harnais de test réutilisable (`simulator.ts`), pas d'un écran.

**Contexte** : `docs/04` définit les seuils par défaut (approche 250 m, début intervention 30 m,
fin intervention 50 m, validation cap ~3 s, validation entrée/sortie rayon 5 s chacune, temps de
déplacement fictif 5 s pour le cas adjacent — déjà implémenté côté State Machine). `MissionItem`
a déjà un champ `detectionRadiusMeters` (peuplé à 25 dans les données de démo) — `docs/03` ne
précise pas lequel des 3 rayons il représente ; **interprétation retenue** : c'est un
**remplacement optionnel du rayon de début d'intervention** (30 m) propre à cette résidence
(le nom « rayon de détection » colle le mieux à « entrée dans la zone de travail »), approche/fin
restent globales (aucun champ dédié dans le schéma). Le seuil de précision GPS acceptable
(« ignorer les positions dont la précision dépasse le seuil configuré ») et le délai de détection
de perte GPS n'ont **aucune valeur numérique donnée par `docs/04`** — valeurs par défaut choisies
et clairement marquées comme **hypothèses à valider par le propriétaire** (pas une règle métier
inventée, juste un paramètre par défaut manquant à documenter).

**Portée retenue** :
- Le moteur ne lit jamais la base ni Supabase (`docs/04`) — il reçoit la résidence active/suivante
  et ses coordonnées par injection (`setActiveResidence`), pas via `MissionContext` directement
  (le câblage React reste hors de portée, comme pour le State Machine — voir Sprint 009-010).
- **Une seule résidence surveillée à la fois** (+ la suivante, uniquement pour le cas adjacent).
- Le moteur **appelle directement** les commandes du State Machine (`enterApproach`, `enterWork`,
  `completeItem`, `enterAdjacentResidence`) une fois un délai de validation écoulé — pas de bus
  d'événements séparé à inventer ; il publie en plus ses propres événements d'observabilité
  (`HeadingChanged`, `GpsLost`, `GpsRecovered`, `GpsAccuracyChanged`) via un simple `on(listener)`,
  qui ne déclenchent **aucune** transition métier (conforme à `docs/04` : perte GPS ne termine
  jamais une résidence automatiquement).
- **Pas de vrai capteur `expo-location`** ce sprint : le moteur consomme des `GpsPosition` déjà
  formées (lat/lon/précision/cap/vitesse/horodatage), peu importe leur origine. Câbler le capteur
  réel (permissions, `expo-location`, tests sur appareil) est noté comme limite/à faire — cohérent
  avec le principe du projet « d'abord l'UI/logique simulée, puis les moteurs un à un ».

**Fichiers prévus** :
- `src/engines/gps/types.ts` — `GpsPosition`, `GpsThresholds` (+ défauts documentés/hypothèses),
  `GpsEngineEvent`.
- `src/engines/gps/distance.ts` — `haversineDistanceMeters` (pur, testé avec des distances
  connues).
- `src/engines/gps/gpsEngine.ts` — `createGpsEngine({ stateMachine, clock, thresholds? })` :
  `setActiveResidence`, `updatePosition`, `checkTimeout` (détection perte GPS), `on`/`getEvents`.
- `src/engines/gps/simulator.ts` — `createGpsSimulator(engine, clock)` : `moveTo`/`advanceTime`/
  `loseSignal`/`recoverSignal`, réutilise le **même** moteur (pas de logique dupliquée, exigé par
  `docs/09` « la simulation doit utiliser la même State Machine que la production »).
- `src/engines/gps/index.ts` — barrel.
- `tests/gpsEngine.test.ts` (nouveau) : distance, filtrage précision, EN_ROUTE→APPROACHING,
  APPROACHING→IN_PROGRESS (délai respecté/non respecté), IN_PROGRESS→COMPLETED (délai), résidence
  adjacente, stabilisation du cap, perte/retour GPS (aucune transition métier déclenchée),
  simulateur (mêmes assertions via l'API de simulation).

**Critères de réussite** (Roadmap Phase 07) : le GPS ne modifie jamais directement les états
(toujours via les commandes du State Machine) ; événements stables (délais respectés avant toute
transition) ; perte GPS ne termine aucune résidence ; changements de cap ne font pas osciller
(stabilisés 3 s) ; les tests utilisent la même logique que la production (moteur unique) ;
`tsc`/`eslint`/`jest` verts.

**Limite assumée** : pas de câblage `expo-location` réel ni de test sur appareil physique ce
sprint (capteur réel = étape « tester sur appareil réel » du Roadmap, nécessite permissions +
dev build) ; pas de câblage `MissionContext`/`MissionScreen` non plus (même décision de portée
que le State Machine).

**Réalisé conformément au plan**, avec une correction découverte en cours de route (pas un
changement de portée) : `docs/09` « Activation de la résidence suivante » n'avait **jamais été
implémentée** dans `completeItem` au Sprint 009-010 — un vrai manque, pas une décision de portée
(la section est explicite : « MissionItem courant → COMPLETED → recherche du prochain admissible
→ suivant → EN_ROUTE »). **Corrigé rétroactivement** dans `src/engines/state-machine/
stateMachine.ts` (`activateNextAdmissibleItem`, appelée depuis `completeItem` via un nouveau hook
`additionalWrites` sur `applyItemTransition`/`writeItemTransition`, dans la **même transaction**
que la complétion) — nécessaire car le GPS Engine s'appuie dessus (`completeItem` → l'item suivant
devient `EN_ROUTE` automatiquement, sans que ce moteur-ci ait besoin d'appeler `startEnRoute` lui-
même). 2 tests ajoutés à `tests/stateMachine.test.ts` (17/17 après correction, contre 15/15 avant).

12 tests dans `tests/gpsEngine.test.ts` : distance (valeur connue), EN_ROUTE→APPROACHING (délai
respecté/réinitialisé si sortie prématurée), APPROACHING→IN_PROGRESS puis →COMPLETED,
`detectionRadiusMeters` par résidence (remplace le rayon global de 30 m), résidence adjacente,
filtrage précision, stabilisation du cap, perte/retour GPS (aucune transition), 2 tests via
`GpsSimulator` (même moteur que la production). `tsc`/`eslint`/`jest` (56/56, 6 suites) verts.

**Impact documentation** : `memory.md` mis à jour (hypothèses de seuils à valider, interprétation
de `detectionRadiusMeters`, décisions de portée, correction rétroactive du State Machine),
`tasks.md`/`file-index.md` mis à jour.

**Limite** : pas de câblage `expo-location` réel, pas de test sur appareil physique, pas de
câblage `MissionContext`/`MissionScreen` — le moteur est prêt (commandes + simulateur testés) mais
sans appelant réel dans l'app pour l'instant.

### ✅ Sprint 009-010 — State Machine (2026-08-01)

**Objectif** (Phase 06 Roadmap) : implémenter l'autorité métier centrale décrite par
`docs/09-State-Machine.md` — états Mission/MissionItem, transitions (automatiques + manuelles),
invariants (une seule résidence active), verrou de transition, déduplication, écritures
atomiques, cas des résidences adjacentes, pause/reprise, problèmes, récupération après
redémarrage. Moteur pur (`src/engines/state-machine/`), **aucun React**, dépendances injectées
(`Db`, `Clock`) — appelé plus tard par `MissionContext`/GPS Engine/mode développement (pas cette
fois, voir portée).

**Contexte** : la couche persistante (Sprint 007-008) fournit déjà exactement ce dont la State
Machine a besoin — `MissionItemState`/`MissionStatus`/`StateTransition` (`src/domain/entities.ts`)
collent aux types d'exemple de `docs/09`, `state_transitions`/`sync_operations` existent déjà
vides en base, `Db`/repositories/horloge injectable/`generateId` sont réutilisables tels quels.
`MissionContext.tsx` a déjà une constante `ACTIVE_STATES` dupliquée à migrer vers le moteur
(source unique de la règle « une résidence active »).

**Portée retenue pour ce sprint** (décisions à documenter, pas d'invention en cours de route) :
- Le moteur expose des **commandes** (`startEnRoute`, `enterApproach`, `enterWork`,
  `completeItem`, `reportProblem`, `resolveProblem`, `skipItem`, `resumeSkipped`,
  `enterAdjacentResidence`, `requestMissionStart/Pause/Resume/Complete`, `recoverOnStartup`) —
  chacune valide + écrit atomiquement (`Db.withTransactionAsync`) MissionItem/Mission +
  `StateTransition` + `SyncOperation` (queue locale, pas d'appel réseau réel — Sync Engine =
  Sprint 013-014).
- **Pas de câblage GPS réel** (Sprint 011-012) : les commandes acceptent des options
  (`source`/`gpsAccuracyMeters`/`latitude`/`longitude`/`reason`) mais ne valident ni précision ni
  délai — ce calcul reste la responsabilité du futur GPS Engine (`docs/09` : la State Machine
  « n'est pas responsable de… calculer une distance »), qui appellera ces commandes une fois prêt.
- **Pas de mode simulation / UI développeur** cette fois (§ "Mode simulation" de `docs/09`) — ça
  correspond au sprint « mode développement » listé plus tard dans `tasks.md` (Sprint 017-019),
  pas à « implémenter le moteur » (Travaux de la Phase 06). Le moteur est testé directement en
  Jest (mêmes règles que la prod, comme l'exige `docs/09`).
- **`MissionScreen` reste sur les mocks** (décision déjà actée au Sprint 007-008, confirmée
  inchangée ici) : reconnecter l'écran nécessite de réconcilier rang carte/coordonnées/alertes/
  tâches avec le schéma réel, hors de portée d'un sprint qui doit déjà couvrir tout le graphe de
  transitions + verrou + dédup + adjacence + récupération. `MissionContext` n'est pas non plus
  élargi avec des méthodes de commande cette fois — juste sa constante `ACTIVE_STATES` migrée vers
  le moteur comme source unique.
- **`travelTimeSource`/`transitionSource` (vocabulaire `docs/09` pour le cas adjacent et la
  transition directe EN_ROUTE→IN_PROGRESS)** : pas de nouvelle colonne SQL — réutilise le champ
  `reason` (texte libre) déjà présent sur `StateTransition`, pour ne pas modifier le schéma cette
  fois (aucune règle métier nouvelle, juste la donnée qui existe déjà).
- **Récupération multi-actifs** : les MissionItems actifs en surnombre sont ramenés à `WAITING`
  par une écriture administrative explicite (source `SYSTEM`, `reason` documentant l'anomalie) —
  chemin volontairement en dehors du graphe normal de transitions (`docs/09` : « restaurer un seul
  MissionItem actif… conserver une trace de la correction », pas une régression silencieuse).

**Fichiers prévus** :
- `src/engines/state-machine/itemTransitions.ts` — graphe `MissionItemState`, `ACTIVE_ITEM_STATES`
  (remplace la constante dupliquée de `MissionContext.tsx`).
- `src/engines/state-machine/missionTransitions.ts` — graphe `MissionStatus`.
- `src/engines/state-machine/types.ts` — `TransitionResult`, codes d'erreur, options de commande.
- `src/engines/state-machine/stateMachine.ts` — `createStateMachine(db, clock)` : verrou par
  mission (file de promesses), déduplication (état cible déjà atteint → refus sans effet), toutes
  les commandes, journal en mémoire (`getLog()`).
- `src/engines/state-machine/recovery.ts` — `recoverOnStartup` (aucun actif / plusieurs actifs).
- `src/engines/state-machine/index.ts` — barrel.
- `src/context/MissionContext.tsx` — `ACTIVE_STATES` remplacée par l'import du moteur (seul
  changement dans ce fichier).
- `tests/stateMachine.test.ts` (nouveau) — succès/refus/doublon/hors-ligne/journalisation pour
  chaque transition prioritaire (`docs/11` Phase 06) + adjacence + pause/reprise + problème/
  résolution + skip/reprise + récupération (0 actif, 2 actifs).

**Tests obligatoires** (par transition prioritaire, `docs/11` Phase 06) : succès, refus (état
incompatible), doublon (même transition rejouée), récupération (démarrage avec état incohérent),
hors ligne (aucun appel réseau — `globalThis.fetch` jamais invoqué), journalisation (chaque
tentative, réussie ou non, apparaît dans `getLog()`).

**Critères de réussite** : une seule résidence active possible (vérifié par test), toute
transition passe par le moteur (aucune écriture directe ailleurs), transitions invalides
refusées sans effet de bord, écritures atomiques (transaction unique), transitions journalisées,
`tsc`/`eslint`/`jest` verts.

**Réalisé conformément au plan** — toutes les commandes prévues implémentées, verrou par mission
(file de promesses `Map<missionId, Promise>`), déduplication (même état cible → refus sans effet),
17 scénarios couverts dans `tests/stateMachine.test.ts` (15 tests, dont hors-ligne et
journalisation). **Ajustements découverts en écrivant les tests** (pas des changements de
portée) : deux des tests de refus initiaux ciblaient en fait des cas de doublon (ex. re-résoudre
un problème déjà résolu vers le même état = `DUPLICATE_TRANSITION`, pas `INVALID_TRANSITION`) ou
un état de départ déjà actif (`APPROACHING → IN_PROGRESS` sur un item déjà actif n'est **pas** un
« nouvel item actif », donc pas de conflit) — corrigés pour tester le bon scénario plutôt que de
changer le moteur. `tsc`/`eslint`/`jest` (42/42, 5 suites) verts.

**Impact documentation** : `memory.md` mis à jour (portée retenue, réutilisation de `reason`,
migration `ACTIVE_STATES` vers le moteur), `tasks.md`/`file-index.md` mis à jour.

**Limite** : commandes exposées par le moteur, mais **non câblées** dans `MissionContext`/
`MissionScreen` (décision de portée assumée) — un futur sprint (GPS Engine, mode développement,
ou un sprint de câblage dédié) branchera de vrais appelants sur ces commandes.

## Archivé

### ✅ Sprint 007-008 — Stockage local & MissionContext (2026-08-01)

**Objectif** : couche locale (Phase 05) alimentant l'app sans dépendre du serveur — stockage
persistant, schémas/migrations, `MissionContext`, repositories, horloge injectable, identifiants
stables, récupération après redémarrage.

**Contexte/décisions** : `expo-sqlite` retenu (vocabulaire Roadmap « schémas »/« migrations »
pointe vers du SQL, pas du key-value). Surface SQL volontairement réduite (get-all/get-by-id/
upsert/delete + 1 transaction) via un factory générique `createRepository<T>`, toute logique
« intéressante » en TypeScript pur au-dessus. 7 tables créées (entités prioritaires de la
Roadmap), seules `missions`/`mission_items` peuplées de données de démo ce sprint.
**`MissionScreen` reste alimenté par les mocks statiques** (décision explicite, pas de
réalignement risqué en un coup) — preuve d'intégration légère et additive dans
`MissionScreenPreview` uniquement.

**Fichiers concernés** : `src/domain/{entities,clock,id}.ts`, `src/persistence/{types,db,
migrations,seedDemoMission}.ts`, `src/persistence/repositories/*.ts` (factory générique + 7
repositories), `src/context/MissionContext.tsx`, `App.tsx` (`MissionProvider`),
`MissionScreenPreview.tsx` (ligne de debug), tests (`persistence.test.ts`, `testFakeDb.ts`).

**Étapes réalisées** : (1) branche `sprint-007-008-local-storage` ; (2) `expo-sqlite`/
`expo-crypto` installés ; (3) vérification de l'API `expo-sqlite` (execAsync/runAsync/
getAllAsync/getFirstAsync/withTransactionAsync) avant d'écrire le code ; (4) `Db` (interface
minimale, injectée) + migrations (7 tables) ; (5) `createRepository` générique + 7 repositories
spécifiques ; (6) `seedDemoMissionIfEmpty` (transaction atomique, idempotent) ; (7)
`MissionContext` (chargement + dérivation `activeMissionItem`/`nextMissionItems`, placeholders
GPS/Sync/Offline) ; (8) branchement `App.tsx` + ligne de debug `MissionScreenPreview` ; (9) faux
`Db` en mémoire (`testFakeDb.ts`) + tests CRUD/seed/dérivation.

**Risques rencontrés / traités** : le type `Db` avec `params` optionnel ne matchait pas les
surcharges réelles de `SQLiteDatabase.runAsync` (params obligatoire) → rendu obligatoire partout ;
`unknown[]` trop large pour `SQLiteBindValue` (`string|number|boolean|null`) → nouveau type
`SqlParam[]` utilisé partout à la place. **Piège majeur trouvé par les tests** : `expo-crypto`'s
`randomUUID()` retourne silencieusement `undefined` sous Jest (aucune erreur, aucun warning) →
le seed de test perdait 4 résidences sur 5 (même id `undefined`, écrasement dans la map) —
corrigé par un mock Jest dédié générant de vrais UUID v4 en JS pur.

**Critères de réussite** : 7 tables créées, repositories testés (CRUD + idempotence du seed),
`MissionContext` expose la forme documentée (avec placeholders), horloge/UUID injectés partout,
intégration légère sans toucher `MissionScreen`, `tsc`/`eslint`/`jest` (27/27) verts — **tous
atteints headless**. Survie réelle au redémarrage **en attente** (dev build du propriétaire).

**Impact documentation** : aucun changement des `docs/` officiels ; décision de portée
(MissionScreen non reconnecté) et piège `expo-crypto` consignés dans `memory.md` + `tasks.md`
(backlog explicite pour le sprint de reconnexion futur).

**Limite** : test de survie au redémarrage non reproductible sur ce VPS (nécessite kill/reopen
de l'app sur un vrai appareil).

### ✅ Sprint 005-006 — Map Engine (2026-07-31)

**Objectif** : remplacer la carte simulée SVG par une vraie carte `@rnmapbox/maps` (Phase 04),
position/résidences/tracé simulés (pas de GPS réel), style sombre, tracteur fixe, caméra,
marqueurs colorés par rang, recentrage.

**Contexte/découvertes** : rupture de compatibilité Expo Go dès ce sprint (module natif). Jeton
public réutilisé depuis `reca-operator/.env.local` (même compte) ; jeton secret Downloads:Read
nouveau (aucune des 2 apps sœurs web n'en avait besoin) — confirmé avec le propriétaire avant de
coder. Découverte en cours d'implémentation : cette version du plugin Expo de `@rnmapbox/maps` a
**déprécié** la config JSON du token de téléchargement au profit de la seule variable
d'environnement lue par Gradle — la conversion `app.json` → `app.config.ts` prévue au plan
**n'était finalement pas nécessaire**, simplification bienvenue actée en cours de route.

**Fichiers concernés** : `.env.example`, `src/engines/map/mapCameraConfig.ts`,
`src/integrations/mapbox/{mapboxClient,suggestedRoute}.ts`, `src/components/map/
{MissionMapView,TractorMarker,ResidenceMarkerLayer,SuggestedRouteLayer,useSuggestedRoute}.tsx`
(nouveaux), `ResidenceMapMarker.tsx` (mis à niveau, pas supprimé — révision du plan initial),
`SimulatedMapBackground.tsx` (supprimé), `missionScreenState.ts`/`missionScreenMocks.ts`
(données de carte simulées ajoutées), `MissionScreen.tsx` (branchement + recentrage via ref),
`package.json` (dépendance + mock Jest), tests (`mapEngine.test.ts`, mock `rnmapboxMock.js`).

**Étapes réalisées** : (1) branche `sprint-005-006-map-engine` ; (2) `npx expo install
@rnmapbox/maps` (a lui-même ajouté le plugin à `app.json`) ; (3) vérification de l'API TS
installée (Camera/MapView/PointAnnotation/ShapeSource/LineLayer/StyleURL) avant d'écrire le code,
découverte de la dépréciation du token JSON à cette occasion ; (4) `mapCameraConfig.ts` (constantes
pures + `zoomForState`, dépend de `domain/status` et non de `screens/` — sens de dépendance
architectural respecté) ; (5) `mapboxClient.ts` + `suggestedRoute.ts` ; (6) `ResidenceMapMarker`
mis à niveau (rang→couleur) ; (7) `TractorMarker`/`ResidenceMarkerLayer`/`SuggestedRouteLayer`/
`useSuggestedRoute`/`MissionMapView` ; (8) données mock de carte + branchement `MissionScreen` ;
(9) mock Jest de `@rnmapbox/maps` + tests (logique pure + écran entier).

**Risques rencontrés / traités** : erreur TS sur `key`/`id` de `PointAnnotation` (attend un
`string`, pas le `number` de `residence.n`) → corrigé ; `Mapbox.Camera` utilisé comme **type**
échouait (import par défaut, pas un namespace TS) → import direct du type `Camera` depuis
`@rnmapbox/maps` ; `react-hooks/set-state-in-effect` sur `useSuggestedRoute` (même piège que le
repo frère) → repli calculé au rendu, pas via `setState` synchrone dans l'effet ; avertissements
`act()` dans les tests (résolution microtask de la route après le rendu) → flush explicite dans
le helper de test ; `global.fetch` invalide en TS (pas de `@types/node` dans `tsconfig.types`) →
`globalThis.fetch`, plus portable de toute façon.

**Critères de réussite** : carte Mapbox intégrée et configurée, tracteur fixe + caméra suivant la
position simulée, 5 marqueurs par rang, tracé avec repli, recentrage, ancienne carte SVG
supprimée, `tsc`/`eslint`/`jest` (22/22) verts — **tous atteints headless**. Rendu visuel réel
**en attente** (dev build requis, jeton secret à créer par le propriétaire).

**Impact documentation** : aucun changement des `docs/` officiels ; divergence HANDOFF/`docs/05`
sur l'ancre du tracteur et tension architecturale (Map Engine "sans React" vs API `@rnmapbox/maps`
intrinsèquement basée sur des composants React) consignées dans `memory.md`.

**Limite** : rendu non vérifié visuellement (aucun émulateur sur ce VPS, module natif en plus).

### ✅ Sprint 004 — Variantes opérationnelles (2026-07-31)

**Objectif** : décliner l'écran maître (Phase 03) pour EN ROUTE/EN APPROCHE/EN COURS/PROBLÈME
sans redessiner l'application — même structure, seules couleur/texte/chrono/alertes/boutons
diffèrent.

**Contexte/découvertes** : vérification des 2 autres images du dossier `uploads/` (planche de
style antérieure + écran de connexion) — aucune ne montre les états manquants, la Roadmap
(texte) + `docs/09-State-Machine.md` (vocabulaire d'état, déjà conforme à `domain/status.ts`)
sont donc la source principale. Deux vraies lacunes du Sprint 003 trouvées en préparant ce
sprint : `PhaseTimer`/`AlertCard` jamais câblés dans `MissionScreen` malgré les Travaux explicites
de la Phase 02 — corrigées ici.

**Fichiers concernés** : `src/screens/missionScreenState.ts` (nouveau, type `MissionScreenState`),
`src/screens/missionScreenMocks.ts` (nouveau, 4 objets), `src/screens/MissionScreenPreview.tsx`
(nouveau, dev-only), `src/screens/MissionScreen.tsx` (refactor piloté par props),
`src/components/mission/CurrentResidenceProgressCard.tsx` (PhaseTimer + prop `color`),
`src/components/mission/ProblemStateCard.tsx` (nouveau), `App.tsx`, `tests/missionScreen.test.tsx`.

**Étapes réalisées** : (1) branche `sprint-004-op-variants` ; (2) `CurrentResidenceProgressCard`
généralisé (couleur threadée, `PhaseTimer` réel) ; (3) `ProblemStateCard` nouveau ; (4)
`MissionScreenState` (type) + `missionScreenMocks.ts` (4 variantes, valeurs de chrono fidèles à
`docs/01`) ; (5) `MissionScreen` refactoré (prop `state`, rangée d'alertes groupées, overlay
hors ligne, rendu conditionnel Problème vs. checklist) ; (6) `MissionScreenPreview` + bascule
`App.tsx` ; (7) tests mis à jour/étendus.

**Risques/décisions** : aucune maquette pixel pour ces états → jugement basé sur le texte
Roadmap + `docs/09`, décisions de portée documentées (MISSION ACTIVE/FIN DE MISSION exclus,
zoom/bottom-sheet différés, hors ligne = overlay pas 5e état).

**Critères de réussite** : 4 variantes fonctionnelles partageant la structure, couleur rouge
marque ≠ rouge problème respectée, chrono + alertes réellement câblés, `tsc`/`eslint`/`jest`
(13/13) verts — **tous atteints headless**. Comparaison visuelle **en attente** (pas de pixel
de référence pour ces états, jugement direct sur téléphone).

**Impact documentation** : aucun changement des `docs/` officiels ; décisions de portée et
gaps comblés consignés dans `memory.md`.

**Limite** : rendu non vérifié visuellement sur ce VPS ; zoom suggéré et comportement du bottom
sheet non implémentés (différés, pas de mécanisme réel disponible).

### ✅ Sprint 003 — Écran maître EN COURS statique (2026-07-31)

**Objectif** : assembler fidèlement les composants du Sprint 002 en l'écran maître réel (état
EN COURS, Phase 02 Roadmap), carte simulée (pas encore Mapbox), données de l'exemple officiel.

**Contexte/découvertes** : `assets/map-night.svg` s'est avéré directement exploitable comme
carte simulée (rues + tracé bleu déjà dessinés) — pas de nouveau tracé à construire, seulement
des marqueurs + le tracteur en overlay. La maquette contenait des éléments non listés dans
`HANDOFF.md` §1 (panneau de tâches, colonne de suivi de phase, barre d'onglets bas) : décision
prise de les construire fidèlement (Roadmap l'exige pour ce sprint précis) mais de garder
Mission/Alertes/Plus décoratifs (aucun second écran encore), cohérent avec le précédent du menu
☰ décoratif posé sur le repo frère `reca-operator`. `docs/05-Map-Engine.md` donne une palette de
rang (vert/bleu/gris) qui est la règle du **futur** Map Engine réel (Phase 04) — pas celle,
plus simple, de ce sprint statique (vert actif / neutre sinon).

**Fichiers concernés** : `src/screens/MissionScreen.tsx` (nouveau), `src/components/map/**`
(nouveau : `SimulatedMapBackground`, `ResidenceMapMarker`), `src/components/mission/
CurrentResidenceProgressCard.tsx` + `ResidenceTasksCard.tsx` (nouveaux),
`src/components/controls/BottomTabBar.tsx` (nouveau), `src/components/ui/NotificationBadge.tsx`
(nouveau, factorisé depuis `AppHeader`), corrections dans `MissionCard.tsx`/`PhaseTimer.tsx`
(fidélité), `App.tsx` (bascule vers `MissionScreen` + `SafeAreaProvider`), tests
(`tests/missionScreen.test.tsx`).

**Étapes réalisées** : (1) branche `sprint-003-mission-screen` ; (2) `react-native-safe-area-
context` installé (lacune Phase 01 corrigée) ; (3) `ResidenceMapMarker` + `SimulatedMapBackground`
(positions codées en dur sur le tracé existant du SVG) ; (4) `NotificationBadge` extrait +
`AppHeader` mis à jour ; (5) `CurrentResidenceProgressCard`, `ResidenceTasksCard`,
`BottomTabBar` ; (6) corrections de fidélité `MissionCard`/`PhaseTimer`
(`formatElapsedWithHours`) découvertes en assemblant contre la maquette réelle ; (7) `MissionScreen`
assemblé (layout fixe, pas de scroll) + `App.tsx` mis à jour ; (8) tests de rendu ajoutés.

**Risques rencontrés / traités** : `SafeAreaProvider` ne rend ses enfants qu'après un événement
natif `onInsetsChange` qui ne se déclenche jamais sous Jest (`children: null` observé) — et
l'export `initialWindowMetrics` de la lib lit une constante de module natif toujours `null` en
test ; résolu en fournissant des `initialMetrics` synthétiques dans le test.
`getByLabelText(...).props.onPress` ne fonctionne pas avec `Pressable` (ne remonte pas la prop
sur le nœud hôte) → utiliser `fireEvent.press(...)`.

**Critères de réussite** : structure complète, carte dominante, chrono/adresse visibles
immédiatement, aucune logique métier dans les composants, safe areas gérées, `tsc`/`eslint`/
`jest` verts (10/10), `expo-doctor` 20/20 — **tous atteints headless**. Comparaison visuelle
avec `mock-encours.png` **en attente** (laptop/téléphone du propriétaire).

**Impact documentation** : aucun changement de direction des `docs/` officiels ; décisions de
portée (barre d'onglets, panneau de tâches) et nuance Sprint003-vs-Phase04 consignées dans
`memory.md`.

**Limite** : rendu non vérifié visuellement sur ce VPS (pas d'émulateur).

### ✅ Sprint 002 — Design tokens & composants (2026-07-30)

**Objectif** : transformer le design Fable validé en tokens + composants réutilisables
(Phase 01 Roadmap), données simulées, sans GPS/Mapbox/Supabase/logique métier.

**Contexte** : source des tokens = HANDOFF §3 ; source visuelle = `mock-encours.png` ; règles =
`docs/01-Design-System.md` + `docs/10`. Décisions de portée : tous les composants prioritaires
dans ce sprint ; `BottomSheet` = coquille sans gestes (différés à l'assemblage) ; écran galerie
comme livrable vérifiable ; toutes les deps ajoutées restent Expo Go-compatibles (pas de dev
build ce sprint).

**Fichiers concernés** : `src/config/theme/**` (tokens), `src/domain/status.ts`,
`src/components/ui/**` (primitives), `src/components/brand/**`, `src/components/mission/**`,
`src/components/controls/**`, `src/screens/ComponentGalleryScreen.tsx`, `App.tsx` (chargement
polices + galerie), `metro.config.js`, `src/types/svg.d.ts`, `tests/components.test.tsx` +
mocks (`svgMock.tsx`, `lucideMock.js`).

**Étapes réalisées** : (1) branche `sprint-002-design-tokens` depuis `sprint-001-initialisation` ;
(2) deps (`expo-font`, `expo-asset`, `@expo-google-fonts/manrope`, `expo-blur`,
`react-native-svg(-transformer)`, `expo-splash-screen`, `lucide-react-native`) + `metro.config.js` ;
(3) tokens `src/config/theme/` ; (4) primitives UI ; (5) composants marque + mission + contrôles ;
(6) écran galerie + câblage `App.tsx` ; (7) config Jest (moduleNameMapper `@/*`, mocks svg/lucide,
`transformIgnorePatterns`) + tests (`formatDuration` pur + rendu de 3 composants).

**Risques rencontrés / traités** : `expo-font` nécessitait `expo-asset` (transitif manquant,
installé) ; lucide ESM non transformable par Jest → mocké (`lucideMock.js`, en `.js` pour
échapper au typecheck TS — `tsconfig.include` ne matche que `.ts`/`.tsx`) ; `react-hooks/refs`
(ESLint) sur `useRef(...).current` dans `PressableScale` → remplacé par `useMemo` ; ordre des
imports dans `theme/index.ts` → réordonné ; `@types/jest` 30 désaligné avec `jest` 29/SDK 57 →
épinglé 29.5.14 (`expo-doctor` 20/20 après correctif).

**Critères de réussite** : composants conformes à la doc/maquette (visuellement à confirmer sur
téléphone) · tokens centralisés (aucune couleur/valeur en dur ailleurs) · vrais assets ·
aucun métier dans les composants · `tsc`/`eslint`/`jest`/`expo-doctor` verts — **atteints
headless** ; comparaison visuelle **en attente** (VPS sans émulateur).

**Impact documentation** : aucun changement de direction des `docs/` ; mémoire mise à jour
(pièges Jest/RNTL/lint, dépendances, structure des tokens).

**Limite** : `BottomSheet` sans gestes ; rendu non vérifié visuellement sur ce VPS.

### ✅ Sprint 001 — Initialisation (2026-07-30)

**Objectif** : établir une base fiable React Native + Expo (TS strict, lint, tests, structure
modulaire, système de mémoire, docs/assets officiels) **sans** moteur métier, Mapbox ni Supabase.

**Contexte** : le dépôt officiel `reca-operateur` était un scaffold Vite + React vierge, alors
que la stack cible est React Native + `@rnmapbox/maps` (docs `11-Roadmap` Phase 00, `02`, `10`,
HANDOFF). Décisions propriétaire : React Native **natif**, **Expo** buildé en **Android Studio**
local (`expo prebuild`), synchronisation VPS→laptop par git.

**Fichiers concernés** : racine (`package.json`, `app.json`, `tsconfig.json`, `babel.config.js`,
`eslint.config.js`, `App.tsx`, `index.ts`, `.gitignore`, `CLAUDE.md`, `README.md`), `src/**`
(structure + README), `assets/**`, `tests/App.test.tsx`, fichiers mémoire.

**Étapes réalisées** : (1) branche `sprint-001-initialisation` ; (2) scaffold Expo
`blank-typescript` fusionné, fichiers Vite supprimés ; (3) TS strict + flags + alias ;
(4) structure `src/` + README de responsabilité ; (5) assets officiels ; (6) ESLint Expo ;
(7) jest-expo + RNTL 13 + smoke test ; (8) `app.json` (portrait/dark/scheme/ids) ; (9) mémoire ;
(10) `CLAUDE.md` ; (11) `.input/` gitignoré, `docs/` commités ; (12) commits conventionnels.

**Risques rencontrés / traités** : RNTL 14 incompatible → épinglé 13.3.3 + react-test-renderer
19.2.3 exact ; `baseUrl` déprimé TS6 → retiré ; globals jest non auto-inclus → `types` explicites ;
ESLint sur `.input` → ignoré.

**Critères de réussite** : compile · types · lint · test · TS strict · structure · docs · mémoire ·
assets officiels · aucun secret — **tous atteints** (vérifiés headless sur le VPS).

**Impact documentation** : aucun changement de direction des `docs/` ; mémoire créée.

**Limite** : runtime non vérifié (VPS sans émulateur) → à lancer sur le laptop/téléphone.

## Note de méthode (obligatoire)

Avant chaque sprint suivant : écrire ici son plan (objectif, contexte, fichiers, étapes, risques,
tests, critères, impact doc) **avant** d'implémenter, puis l'archiver une fois terminé.
