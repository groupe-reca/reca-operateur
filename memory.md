# memory.md — Mémoire persistante de `reca-operateur`

> Décisions officielles, contraintes et pièges à ne jamais perdre entre les sessions.
> À lire **en entier** au début de chaque tâche (protocole : `docs/10-Development-Standards.md`).
> Ne pas transformer ce fichier en journal quotidien — n'y mettre que l'important et durable.

## Identité du projet

- **Client** : Groupe RECA. **Nom officiel affiché : « RÉCA OPÉRATEUR »** (accents inclus).
  Il est **interdit** d'écrire « RECA Operator » dans l'interface.
- **Produit** : assistant de travail **terrain** pour opérateurs (déneigement au départ).
  Ce n'est **pas** un CRM ni une interface d'admin. Le superviseur, lui, utilise **RECA App**.
- **Généricité** : base des futures apps terrain Signa → aucune logique métier propre au
  déneigement dans les composants/domaines de base.
- **Relation avec les autres dépôts** : `reca-operateur` est le **nouveau dépôt officiel**
  (dépôt `github.com/groupe-reca/reca-operateur`) qui **remplace le prototype web
  `/var/www/html/reca-operator`** (Vite/React, à consulter seulement pour des idées validées,
  jamais comme fondation). `/var/www/html/reca-app` reste le **système maître** de gestion et la
  **référence d'intégration** (Supabase, types, conventions).

## Décisions techniques officielles (et pourquoi)

- **Stack = React Native + Expo** (décision propriétaire 2026-07-30). Versions du scaffold :
  Expo SDK **57**, React Native **0.86.2**, React **19.2.3**, TypeScript **6** (strict). Template
  `blank-typescript`. Alias `@/* → src/*` (résolu par Metro et par `paths` du tsconfig, sans
  `baseUrl` — déprécié en TS 6).
- **Build = Android Studio local** sur le laptop du propriétaire, via `expo prebuild` → dossier
  natif `android/`. Le **code vit sur le VPS** (dev + typecheck/lint/tests headless) et se
  synchronise au laptop **par git**. Expo n'empêche pas le build Android Studio ; il l'outille
  (config plugins). Convertible en « bare » plus tard si besoin.
- **Workflow git** : une **branche par sprint** (`sprint-XXX-nom`), chacune construite sur la
  précédente → historique **linéaire**, merges en **fast-forward** dans `main` (jamais de merge
  commit ni de rebase à refaire). **Fusion du 2026-08-01** : Sprints 001 → 007-008 (12 commits,
  `f139f4e` → `24cbe52`) fusionnés et **poussés dans `origin/main`**, qui ne contenait jusque-là
  que le scaffold Vite initial. `main` est désormais la **référence à cloner sur le laptop**
  pour `expo prebuild`. Les branches sprint sont conservées (non supprimées). Avant tout merge :
  `npm run typecheck` + `npm run lint` + `npm test` doivent passer (au 2026-08-01 : 27 tests,
  4 suites, tout vert).
- **Carte = `@rnmapbox/maps`** (confirmé par le HANDOFF). **Installé au Sprint 005-006** —
  premier module natif du projet, **Expo Go ne fonctionne plus depuis lors** ; tout test
  runtime nécessite désormais un dev build (`expo prebuild` + Android Studio). Détails complets
  dans la section « Map Engine réel (Sprint 005-006) » plus bas.
- **Architecture modulaire stricte** (`docs/02` + `docs/10`) :
  - La **carte est l'application** (Map First) ; les panneaux flottent au-dessus.
  - **Les moteurs ne connaissent jamais React** ; ils communiquent par **événements**, reçoivent
    leurs dépendances par **injection** (horloge, stockage, logger, client API).
  - **Les composants ne touchent jamais Supabase ni Mapbox directement** et ne contiennent
    aucune transition d'état ni calcul GPS/temps.
  - **La State Machine est l'unique autorité** des transitions
    (`ATTENTE→ROUTE→APPROCHE→COURS→TERMINÉE`, aucun retour automatique). **Une seule résidence
    active** à la fois.
  - **Local-first** : toute action terrain est écrite localement **avant** synchronisation ;
    jamais d'attente de Supabase pour terminer/signaler/démarrer.
  - **Tracteur fixe** au centre de l'écran ; c'est la **carte qui tourne** dessous.
- **Langue** : code/types/fichiers/commentaires en **anglais** ; **interface en français**.
- **Tests = `jest-expo` + `@testing-library/react-native` (RNTL) v13.3.3** (voir piège ci-dessous).

## Design (référence : `docs/01-Design-System.md` + HANDOFF)

- Thème **sombre**, typographie **Manrope**. Tokens centralisés dans `src/config/theme/`
  (Sprint 002) — **source unique de vérité visuelle**, aucune couleur/espacement/rayon codé en
  dur ailleurs. Échelle typo exacte (HANDOFF §3) : timer 44/800 tabular, adresse 27/800,
  card-title 15/800, label-caps 11/800 +1.4, body 13/600, meta 11/600. Radii 8/14/18/26 (FAB
  plein). Glass 3 niveaux (chip .55/blur20, panel .72/blur30, sheet .88/blur45).
- Couleurs clés : fond `#0B1020` · panneau `#151C2E` · **rouge marque `#E63947`** · rouge
  fonctionnel `#EF4444` · bleu nav `#3B82F6` · vert `#4ADE80` · ambre `#F59E0B` · gris `#94A3B8`.
- **Assets officiels** (dans `assets/`, à ne jamais redessiner) : `logo-clair.svg`,
  `logo-sombre.svg`, `tractor.png`, `map-night.svg`. « OPÉRATEUR » est un **texte** (Manrope 800,
  `#E63947`), **pas** un logo. **Interdit** de recréer un faux logo au texte/à l'icône.
  `OfficialLogo`/`Wordmark` (`src/components/brand/`) sont les seuls points d'affichage de la
  marque — ne pas dupliquer ailleurs.
- **Icônes = lucide-react-native**, génériques (jamais d'icône métier déneigement dans les
  primitives de base — cohérent avec la généricité Signa).
- **`PhaseTimer` affiche, ne compte pas** : `formatDuration(seconds)` est une fonction pure
  (mm:ss, ou h:mm:ss après 1 h) — le calcul temps réel viendra du GPS Engine/State Machine.
- **Deux conventions d'horloge coexistent, volontairement** : `formatDuration` (chrono de phase,
  omet l'heure à zéro, ex. « 05:42 ») vs `formatElapsedWithHours` (Sprint 003, « TEMPS DE
  MISSION » de `MissionCard`, **toujours** `hh:mm:ss` même à zéro, ex. « 00:18:32 ») — les deux
  fonctions vivent dans `PhaseTimer.tsx`. Ne pas les fusionner : c'est `mock-encours.png` qui
  distingue explicitement les deux affichages, pas une incohérence à corriger.

## Écran maître (Sprint 003, `MissionScreen.tsx`)

- **`assets/map-night.svg` sert directement de carte simulée** (Phase 02, avant Mapbox) : rues +
  **tracé bleu suggéré déjà dessiné** dedans (`M400,1000 V580 H250 V260 H550 V100`, viewBox
  800×1000). `SimulatedMapBackground` ne fait que poser des marqueurs (`ResidenceMapMarker`) +
  `FixedTractor` par-dessus, positionnés en **fractions (0..1) du viewBox codées en dur** (mock
  data, pas de géométrie calculée) ; le SVG de fond est étiré `preserveAspectRatio="none"` pour
  que ces fractions s'alignent exactement quel que soit l'écran (acceptable : carte stylisée,
  pas une photo — une vraie photo satellite ne devrait, elle, jamais être étirée ainsi).
- **Décision — palette de marqueurs Sprint 003 ≠ palette du futur Map Engine** :
  `docs/05-Map-Engine.md` documente une palette **par rang** pour le vrai moteur (actif=vert,
  2e/3e=bleu, 4e/5e=gris), qui n'entre en vigueur qu'en **Phase 04** (Mapbox réel). La maquette
  statique de CE sprint est plus simple (seul l'actif a un halo vert+icône maison, tous les
  autres sont un badge neutre gris/blanc) — c'est ce qui est implémenté maintenant. **Ne pas
  confondre les deux au moment de la Phase 04** : le futur `MapMarker` du vrai Map Engine devra
  suivre `docs/05`, pas recopier `ResidenceMapMarker` tel quel.
- **Décision — barre d'onglets du bas (`BottomTabBar`, 5 items Carte/Mission/Annonce/Alertes/
  Plus) et panneau de tâches (`ResidenceTasksCard`) construits fidèlement à `mock-encours.png`**
  bien qu'absents de la liste de composants de `HANDOFF.md` §1. Aucune contradiction avec
  `docs/01`/`docs/02` (qui ne les interdisent pas, juste ne les nomment pas) ; la Roadmap exige
  une reproduction fidèle pour ce sprint précis. **Seuls Carte (écran actuel) et Annonce
  (bascule voix réelle, réutilise `VoiceButton`) sont fonctionnels** — Mission/Alertes/Plus
  restent des placeholders décoratifs (`onPress` no-op) tant qu'aucun second écran n'existe
  (Phase 11 leur donnera de vraies destinations). Précédent cohérent : le ☰ décoratif du repo
  frère `reca-operator` (même raisonnement, même utilisateur).
- **`BottomSheet` (coquille sans geste, construite au Sprint 002) reste sans geste de
  glissement** : `mock-encours.png` ne montre aucune poignée sur « RÉSIDENCE ACTUELLE » (carte à
  hauteur fixe) — `CurrentResidenceSheet` convient tel quel. Toujours aucune dépendance
  gesture-handler/reanimated dans le projet ; à réévaluer seulement si une future maquette montre
  un vrai geste de glissement (ex. l'onglet « Mission » ouvrant une liste complète).
- **Corrections de fidélité apportées aux composants Sprint 002** (découvertes en assemblant,
  pas des inventions) : `MissionCard` gagne `etaLabel` + split de la ligne méta en 2 lignes
  (« Secteur X » puis « N résidences · estimation ») et un vrai bouton « Détails » bordé
  (remplace l'ancien texte+chevron nu) ; `SyncIndicator` déplacé sous ce bouton (satisfait le
  contrat `syncState` de HANDOFF §4 sans concurrencer visuellement « Détails », qui occupe ce
  coin dans la maquette réelle).
- **Layout non scrollable** (`docs/01` : « aucun écran blanc, seulement des panneaux ») :
  `MissionScreen` est une colonne flex fixe, carte en `flex:1` entre un bloc haut (header +
  MissionCard) et un bloc bas (résidence actuelle + barre d'onglets), calques flottants gauche/
  droite en `position:absolute` par-dessus la carte.
- **Safe areas ajoutées** (`react-native-safe-area-context`) — lacune du Sprint 002 (listée comme
  livrable Phase 01 mais oubliée, la galerie en `ScrollView` s'en passait) : nécessaire dès qu'un
  écran a une mise en page fixe avec du contenu épinglé aux bords.

## Variantes opérationnelles (Sprint 004)

- **`MissionScreen` est piloté par les données** : une seule prop `state: MissionScreenState`
  (`src/screens/missionScreenState.ts`) — les 4 variantes (`missionScreenMocks.ts`) sont de
  simples objets différents rendus par le **même** écran, fidèle à « même structure, aucune
  nouvelle architecture » (Roadmap Phase 03). Ne jamais dupliquer `MissionScreen` par état.
- **Lacune Sprint 003 comblée** : `PhaseTimer` et `AlertCard` (construits Sprint 002, exigés par
  les Travaux explicites de la Phase 02) n'avaient **jamais été câblés**. Corrigé : `PhaseTimer`
  vit maintenant dans `CurrentResidenceProgressCard` (remplace l'icône `CircleDashed`
  décorative) ; les alertes sont groupées dans `MissionScreen` (`AlertsRow` interne).
- **Décision — portée des états** : seuls **EN ROUTE / EN APPROCHE / EN COURS / PROBLÈME** sont
  des variantes de cet écran-carte. **MISSION ACTIVE et FIN DE MISSION sont des écrans autonomes
  distincts** (section « Écrans finaux » de la Phase 11, Sprint 017-019) — ne jamais essayer de
  les construire comme une 5e/6e couleur de `MissionScreen`. **Mode hors ligne n'est pas un état
  de plus** : c'est un **overlay additif** (`OfflineIndicator`, déjà construit Sprint 002) qui
  peut se superposer à **n'importe lequel** des 4 états (`state.offline`, optionnel) — démontré
  sur le mock EN COURS.
- **Couleur fonctionnelle par état** : EN ROUTE = `colors.navigation` (bleu), EN APPROCHE =
  `colors.warning` (ambre), EN COURS = `colors.success` (vert), PROBLÈME = `colors.danger`
  (rouge **fonctionnel**). **Règle absolue** (critère explicite de la Roadmap Phase 03) : « le
  rouge de marque ne remplace pas les couleurs fonctionnelles » — `colors.brand` (`#E63947`,
  identité/logo) ne doit **jamais** servir à colorer l'état PROBLÈME ni aucun autre état ; c'est
  toujours `colors.danger` (`#EF4444`).
- **Sémantique du chronomètre par état** (`docs/09-State-Machine.md`, section Chronomètres) :
  EN ROUTE = « temps de déplacement », EN APPROCHE = « temps d'approche » (label choisi par
  cohérence de nommage, la doc ne détaille pas ce calcul précisément), EN COURS = « temps
  d'intervention », PROBLÈME = chronomètre **figé** (`docs/09` : « arrêter les chronomètres
  actifs » au signalement) — valeur statique affichée via `PhaseTimer` dans `ProblemStateCard`,
  pas de nouvelle logique de pause à inventer. Valeurs de mock reprises de l'exemple concret de
  `docs/01-Design-System.md` (04:37 / 00:08 / 03:41) pour la fidélité.
- **Nouveau `ProblemStateCard`** (pas une variante de props de `CurrentResidenceProgressCard`) :
  contenu structurellement différent (type de problème, note, chrono figé, actions « Passer à la
  suivante » / « Reprendre plus tard »), cohérent avec `docs/09` (`PROBLEM → EN_ROUTE/IN_PROGRESS`
  = transitions **manuelles uniquement**, jamais de reprise automatique). Rendu au **même
  emplacement** (colonne gauche) que `CurrentResidenceProgressCard`, choix conditionnel dans
  `MissionScreen` sur `state.activeState === 'PROBLEM'`.
- **Groupement des alertes** (règle HANDOFF §5) : **1 `AlertCard` complète + un chip « +N
  instructions »** (réutilise `Pill`) — jamais une pile de N cartes complètes. Le panneau de
  tâches (`ResidenceTasksCard`) n'est affiché **que** pour EN COURS (`state.tasks` optionnel,
  `undefined` ailleurs) : une résidence n'a pas de « tâches en cours » avant l'arrivée.
- **Différé, pas oublié** : zoom suggéré par état et comportement du bottom sheet par état
  (axes de variation listés par la Roadmap Phase 03) n'ont **aucun mécanisme réel** à faire
  varier pour l'instant (pas de vrai Map Engine avant Phase 04, pas de gestes de sheet — décision
  Sprint 003 inchangée). Ne pas inventer un faux zoom/comportement pour combler cet axe ; à
  implémenter réellement quand ces moteurs existeront.
- **Outil de vérification temporaire** (`MissionScreenPreview.tsx`, dev-only) : `MissionScreen`
  reste « pur » (aucun contrôle technique baké dedans — respecte HANDOFF « aucun bouton
  technique »). Le sélecteur de variantes vit dans un écran **séparé**, même statut que
  `ComponentGalleryScreen` (jamais un écran produit). `App.tsx` y bascule temporairement ;
  repassera à un `MissionScreen` unique piloté par le vrai State Machine au Sprint 009-010 (même
  bascule que Galerie→MissionScreen entre Sprint 002 et 003) — **ne pas laisser ce switcher
  devenir une fonctionnalité permanente par inertie**.
- **Vérification des maquettes disponibles** (avant de coder ce sprint) : les 2 autres images de
  `.input/.../uploads/` ont été examinées — une planche de style antérieure (palette/police
  différentes : SF Pro, fond `#0B0E13`, tracé rouge, badge EN COURS rouge — un brouillon
  antérieur, supplanté par `mock-encours.png`/HANDOFF) et un écran de connexion (pertinent pour
  le futur Sprint 017, pas pour celui-ci). **Aucune des deux ne montre EN ROUTE/EN APPROCHE/
  PROBLÈME** — confirmé qu'aucune maquette pixel n'existe pour ces états à ce jour.

## Map Engine réel (Sprint 005-006)

- **Rupture Expo Go** : `@rnmapbox/maps` est un module natif → depuis ce sprint, **Expo Go ne
  peut plus afficher l'app**. Tout test runtime nécessite un dev build (`expo prebuild` +
  Android Studio) sur le laptop du propriétaire.
- **Deux jetons Mapbox distincts, à ne jamais confondre** :
  - **Public** (`pk.*`, `EXPO_PUBLIC_MAPBOX_TOKEN`) — runtime, inliné dans le bundle JS (convention
    Expo `EXPO_PUBLIC_*`). **Réutilisé** depuis `reca-operator/.env.local` (`VITE_MAPBOX_TOKEN`,
    même compte Mapbox).
  - **Secret** (`sk.*`, scope **Downloads:Read**, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`) — authentifie le
    téléchargement du SDK natif (Maven/CocoaPods) **au moment du build**, jamais dans le bundle.
    **Nouveau** : ni `reca-app` ni `reca-operator` n'en avaient besoin (intégrations web). Le
    propriétaire doit le créer sur `account.mapbox.com/access-tokens`.
  - **Piège évité** : la version installée du plugin Expo (`@rnmapbox/maps` 10.3.5) a **déprécié**
    la config JSON du token de téléchargement (`RNMapboxMapsDownloadToken` dans `app.json`) au
    profit de la **seule** variable d'environnement, lue directement par Gradle
    (`System.getenv('RNMAPBOX_MAPS_DOWNLOAD_TOKEN')`). **Aucune conversion `app.json` →
    `app.config.ts` n'était donc nécessaire** (contrairement à ce que le plan initial supposait) —
    `app.json` reste statique, `npx expo install @rnmapbox/maps` y a lui-même ajouté le plugin en
    chaîne simple.
- **Style de carte = `dark-v11` standard Mapbox**, pas un style Studio entièrement custom (hors
  de portée sans accès à Mapbox Studio). Même choix pragmatique déjà validé par le repo frère
  `reca-operator` pour son propre Map Engine. Nos propres `LineLayer`/`SymbolLayer`/`PointAnnotation`
  (route, marqueurs) se posent par-dessus.
- **Divergence de doc réconciliée — ancre du tracteur** : `HANDOFF.md` §1 dit « 24 % du bas de la
  zone carte » (= 76 % depuis le haut) ; `docs/05-Map-Engine.md` dit « environ 60 % de la
  hauteur ». **HANDOFF retenu** (plus précis, écrit spécifiquement pour cette intégration) —
  constante unique `TRACTOR_ANCHOR_FRACTION_FROM_TOP = 0.76` (`src/engines/map/mapCameraConfig.ts`),
  utilisée à la fois pour la position à l'écran du `TractorMarker` et pour le calcul du
  `paddingTop` de la caméra (`cameraPaddingTopFor`, dérivé algébriquement : avec `paddingBottom=0`,
  `paddingTop = (2×ancre − 1) × hauteur`). **Ne pas réintroduire le chiffre de `docs/05`** sans
  trancher explicitement — la divergence n'est pas résolue dans les docs elles-mêmes.
- **Le tracteur ne tourne jamais lui-même** — c'est la **caméra** qui tourne (son `heading` suit
  la position simulée), `TractorMarker` reste visuellement fixe pointant « vers le haut » de
  l'écran. Décision alignée sur le repo frère `reca-operator` (même problème, même solution déjà
  validée) et sur la phrase de `docs/05` « le tracteur reste fixe à l'écran, la carte se déplace
  sous lui ». `HANDOFF.md` §1 (« rotation = cap affiché de la caméra ») est ambigu sur ce point
  précis — lu comme « aucune rotation propre à ajouter à l'icône », pas comme une double rotation.
- **Rangs des marqueurs ≠ index de mission** : `docs/05` numérote les 5 marqueurs visibles par
  **rang relatif** (1=actif/vert grand marqueur+halo+maison, 2-3=bleu, 4-5=gris) — un concept
  **indépendant** de l'index absolu de la résidence dans la mission (ex. « 3/28 » affiché ailleurs
  par `MissionCard`/`CurrentResidenceProgressCard`). Les deux numérotations ne sont **pas**
  réconciliées entre elles dans les mocks actuels (simplification illustrative assumée, pas un
  bug) — l'unification viendra naturellement une fois qu'un vrai `MissionContext` (Phase 05)
  alimentera les deux à partir d'une seule source.
- **Tracé suggéré = Mapbox Directions API + repli ligne droite** (`src/integrations/mapbox/
  suggestedRoute.ts` + hook `useSuggestedRoute.ts`), pattern **repris tel quel** du repo frère
  `reca-operator` (déjà validé en conditions réelles là-bas). Ne jamais laisser une erreur réseau/
  jeton manquant faire planter la carte — le repli est **toujours** disponible et retourné
  immédiatement, upgradé silencieusement si l'appel réussit.
- **Tension architecturale assumée, pas résolue** : `docs/02` dit « les moteurs ne connaissent
  jamais React ». L'API de `@rnmapbox/maps` est **intrinsèquement basée sur des composants React**
  (`<MapView>`, `<Camera>`, `<PointAnnotation>`…) — un vrai « Map Engine sans React » n'est donc
  pas réalisable tel que l'architecture l'envisage dans l'idéal. Compromis adopté : la partie
  **réellement pure** (constantes caméra, `zoomForState`, `cameraPaddingTopFor`) vit dans
  `src/engines/map/` comme prévu ; le **rendu Mapbox lui-même** (composants JSX) vit dans
  `src/components/map/`. Ne pas essayer de « corriger » ça en déplaçant les composants React dans
  `engines/` — ce serait pire (composants dans un dossier qui prétend ne jamais connaître React).
- **`ResidenceMapMarker` mis à niveau plutôt que supprimé** : le plan initial prévoyait de
  supprimer `SimulatedMapBackground` **et** `ResidenceMapMarker` (les deux « Sprint 003 SVG »).
  En pratique, seul `SimulatedMapBackground` (le fond SVG) était vraiment obsolète —
  `ResidenceMapMarker` (le badge React/View) restait directement réutilisable comme contenu d'un
  `PointAnnotation` Mapbox réel. Mis à jour (couleur par rang) plutôt que recréé.
- **Pièges Jest rencontrés** :
  - `@rnmapbox/maps` casse Jest par défaut (ESM non transformé + vues natives non instanciables).
    **Mocké** via `moduleNameMapper` → `tests/__mocks__/rnmapboxMock.js` (composants `View`
    passthrough + `Camera` en `forwardRef` avec méthodes no-op) — même famille de solution que le
    mock `lucide-react-native` du Sprint 002. La lib fournit un `setup-jest.js` officiel (mock des
    constantes `NativeModules.RNMBXModule`) mais je ne l'ai **pas** utilisé (mock manuel plus
    simple/prévisible pour nos besoins, aucun test de rendu Mapbox réel n'étant recherché ici).
  - `Mapbox.Camera` **utilisé comme type** (`useRef<Mapbox.Camera>`) échoue : `Mapbox` est un
    **import par défaut** (valeur), pas un namespace TS — la propriété `.Camera` n'y est pas
    accessible en position de type. **Fixé** en important le type `Camera` directement depuis
    `@rnmapbox/maps` (`import type { Camera as CameraRef } from '@rnmapbox/maps'`), séparé de
    l'import de valeur `Mapbox` (via notre wrapper `mapboxClient.ts`).
  - `PointAnnotation`'s `id`/`key` attendent un **`string`**, pas le `number` de `residence.n` —
    utiliser un gabarit de chaîne (``residence-${n}``) pour les deux.
  - `useSuggestedRoute` a retrouvé le piège **`react-hooks/set-state-in-effect`** déjà rencontré
    sur le repo frère : ne jamais appeler `setState` de façon synchrone en tête de corps d'effet
    pour réinitialiser un repli — le repli doit être **calculé au rendu** (comparaison de
    référence `resolved.forWaypoints === waypoints`), l'effet ne fait que **mettre à niveau**
    l'état une fois la vraie résolution arrivée.
  - Avertissements `act()` dans les tests qui rendent `MissionScreen` : `fetchSuggestedRoute` est
    `async` même dans son chemin de repli synchrone (pas de jeton) → la résolution arrive un tick
    après le rendu du test. Fixé par un `await act(async () => {})` après `render()` dans le
    helper de test partagé.
  - `global.fetch` invalide en TS ici (`@types/node` pas dans `tsconfig.types`, volontairement
    restreint à `["jest","react"]`) → utiliser **`globalThis.fetch`** (standard ECMAScript, pas de
    dépendance de types supplémentaire, de toute façon plus portable que `global`).

## Stockage local & MissionContext (Sprint 007-008)

- **Stockage = `expo-sqlite`** (décision, pas juste une option parmi d'autres) : le vocabulaire
  même de la Roadmap Phase 05 (« schémas », « migrations », entités liées par `mission_id`/
  `mission_item_id`) pointe vers une vraie base relationnelle avec transactions natives, pas du
  key-value (AsyncStorage/MMKV écartés pour cette raison).
- **Surface SQL volontairement minuscule** : chaque repository (`src/persistence/repositories/`)
  n'utilise que get-all/get-by-id/upsert/delete + une transaction — jamais de `WHERE`/`JOIN`
  complexe. Toute logique « intéressante » (résidence active, tri par ordre) vit en **TypeScript
  pur** au-dessus (`deriveActiveAndNext` dans `MissionContext.tsx`, exporté et testé isolément).
  **Ne pas** ajouter de requêtes SQL complexes plus tard sans très bonne raison — ça casserait le
  faux `Db` de test (`tests/testFakeDb.ts`) qui ne fait que du pattern-matching de regex simple,
  pas un vrai moteur SQL.
- **`Db` = interface minimale injectée** (`src/persistence/types.ts`), jamais `expo-sqlite`
  importé directement en dehors de `src/persistence/db.ts`. Permet de tester les repositories/
  `MissionContext` avec un faux en mémoire, sans module natif ni vraie base sous Jest (même
  contrainte que Mapbox — voir plus haut). **`SqlParam` (`string|number|boolean|null`)**, pas
  `unknown[]` : le vrai `SQLiteDatabase.runAsync` de `expo-sqlite` n'accepte que
  `SQLiteBindValue[]`, plus étroit — `unknown[]` n'aurait pas satisfait la vraie signature.
  `params` est **obligatoire** (pas optionnel) dans `Db` pour la même raison (les surcharges
  réelles n'ont pas de forme « zéro argument tableau »).
- **`db.ts` importe `expo-sqlite` dynamiquement** (`import('expo-sqlite')` dans le corps de
  `getDb()`, pas en haut du fichier) — pour que le simple fait d'importer `db.ts` (ex.
  transitivement via `MissionContext`) ne touche jamais le module natif. Les tests injectent leur
  propre faux `Db` via la prop `getDbOverride` de `MissionProvider` et n'appellent jamais
  `getDb()` du tout.
- **7 tables créées, seules 2 peuplées ce sprint** : `missions`/`mission_items` reçoivent les
  données de démo (`seedDemoMissionIfEmpty`, idempotent, transaction atomique) ; `state_transitions`/
  `sync_operations`/`operator_sessions`/`problems`/`mission_alerts` existent vides, prêtes pour
  les moteurs futurs (State Machine Sprint 009-010, Sync 013-014) — normal à ce stade, pas un
  oubli.
- **`MissionContext` reste en lecture** : charge (migrations → seed si vide → session ouverte →
  lecture) et expose, **aucune API de commande/mutation** encore. `gpsState`/
  `synchronizationState`/`offlineState` (forme exacte donnée par l'exemple `MissionContext` de la
  Roadmap) sont des **placeholders typés** sans moteur réel derrière — ne pas les faire évoluer
  avant que les moteurs correspondants existent réellement (Sprint 011-012/013-014/015).
- **Décision de portée — `MissionScreen` non reconnecté à `MissionContext` ce sprint** :
  volontaire, pas un oubli. `MissionScreen` continue de lire `missionScreenMocks.ts`
  (Sprint 004). La preuve d'intégration reste **additive et légère**, confinée à
  `MissionScreenPreview` (ligne de debug : session + nombre de résidences). Le remplacement
  complet est backlogué explicitement dans `tasks.md` (nécessitera de réconcilier rang carte/
  coordonnées/alertes/tâches avec le schéma persistant — pas fait à la légère).
- **Horloge injectable partout où un timestamp est écrit** (`src/domain/clock.ts`,
  `Clock`/`systemClock`) — jamais `new Date()` en dur dans la logique de seed/session.
- **Piège majeur — `expo-crypto`'s `randomUUID()` retourne silencieusement `undefined` sous
  Jest** (aucune erreur, aucun warning — le module natif est mocké en no-op par `jest-expo`).
  Conséquence concrète rencontrée : le seed de test perdait 4 résidences sur 5 (toutes avec le
  même id `undefined`, écrasement successif dans la table en mémoire — symptôme qui a permis de
  détecter le bug). **Fixé** par un mock Jest dédié (`tests/__mocks__/expoCryptoMock.js`, vrai
  générateur UUID v4 en JS pur). **Réflexe à garder** : si un test avec des entités générées par
  `generateId()` montre des doublons/écrasements inattendus, vérifier D'ABORD que `randomUUID()`
  n'est pas mocké en `undefined` silencieux avant de chercher ailleurs.

## Contraintes à ne jamais oublier

- L'app doit **fonctionner hors ligne** (mission complète sans réseau — critère de production).
- **Mobile portrait uniquement** (téléphone). Pas de tablette (`supportsTablet: false`).
- **Aucun secret commité** (clés Mapbox/Supabase → env / EAS, jamais dans le repo).
- **Ne pas connecter tous les moteurs en même temps** : d'abord l'UI simulée, puis les moteurs un
  à un (roadmap). Ne pas commencer par le GPS réel ni le Supabase direct.

## Décisions rejetées

- **Rotation continue de la carte** au cap GPS brut → rejetée (bruit). La rotation utilise un cap
  **validé après temporisation** (~2–3 s).
- Reprendre le prototype web `reca-operator` comme fondation → rejeté (nouveau dépôt propre).

## Pièges connus (résolus)

- **RNTL v14 incompatible avec ce socle** : `@testing-library/react-native@14` dépend d'un
  nouveau renderer (`test-renderer@^1`) hors du circuit `jest-expo` SDK 57 → `render()` ne
  renvoyait pas les requêtes. **Fixé** : RNTL épinglé à **13.3.3** + `react-test-renderer`
  **exactement 19.2.3** (doit matcher `react@19.2.3` d'Expo ; `^19.2.3` remontait en 19.2.8 et
  cassait la résolution des peers). Ne pas « mettre à jour » ces deux versions sans revérifier.
- **TS 6** : `baseUrl` est déprécié → ne pas l'utiliser ; les `paths` sont relatifs (`./src/*`).
  Les globals de test ne sont pas auto-inclus avec la résolution `bundler` d'Expo → `types` du
  tsconfig déclare explicitement `["jest", "react"]`.
- **ESLint** lintait le `support.js` du handoff → `.input/**` (et `*.config.cjs`) ignorés dans
  `eslint.config.js` ; `.input/` est aussi gitignoré.
- **`expo-font` exige `expo-asset`** (dépendance transitive non auto-installée par
  `npx expo install expo-font`) → jest échouait avec « Cannot find module 'expo-asset' ».
  Installé explicitement.
- **`lucide-react-native` (build ESM `.mjs`) casse sous Jest** (`SyntaxError: Unexpected token
  'export'`, hors du set `transformIgnorePatterns` habituel d'Expo). Les icônes étant purement
  décoratives dans les tests, **mocké** via `moduleNameMapper` → `tests/__mocks__/lucideMock.js`
  (Proxy renvoyant un composant no-op pour n'importe quel nom d'icône importé). **Fichier en
  `.js`** volontairement : un `.tsx` déclenchait une erreur `tsc` (`Cannot find name 'module'`,
  `types` du tsconfig restreint à `["jest","react"]`) — `tsconfig.include` ne matche que
  `.ts`/`.tsx`, donc un `.js` échappe proprement au typecheck sans élargir `types`.
  Même topologie pour `.svg` → `tests/__mocks__/svgMock.tsx` (celui-là passe le typecheck sans
  souci, gardé en `.tsx`).
  ESLint sur `.input` → ignoré.
- **`react-hooks/refs` (ESLint 9 / eslint-config-expo)** interdit de lire `useRef(...).current`
  pendant le rendu (ex. `useRef(new Animated.Value(1)).current`) → utiliser **`useMemo`** pour
  une valeur stable créée une fois (`PressableScale.tsx`).
- **`@types/jest` doit rester aligné sur la version de `jest`** (pas juste « la dernière ») :
  `jest@29.7` + `@types/jest@30` passait `tsc` mais `expo-doctor` le signalait en écart avec
  l'attente SDK 57 (`29.5.14`). Épinglé en exact.
- **`SafeAreaProvider` ne rend ses enfants qu'après un événement natif `onInsetsChange`** —
  qui ne se déclenche jamais sous Jest (aucun vrai natif) : un test qui monte `MissionScreen`
  sous `<SafeAreaProvider>` nu obtenait `children: null` (confirmé via `toJSON()`). L'export
  `initialWindowMetrics` de la lib (censé résoudre ça) est **lui-même toujours `null` sous
  Jest** (`InitialWindow.native.js` lit une constante de module natif absente en test). **Fixé**
  en passant des **métriques synthétiques maison** (`{ frame: {...}, insets: {...} }`) à la prop
  `initialMetrics` du `SafeAreaProvider` du test — ne pas essayer d'utiliser
  `initialWindowMetrics` importé de la lib dans un test, il ne fonctionne pas ici.
- **`getByLabelText(...).props.onPress` ne fonctionne pas avec `Pressable`** : `Pressable` ne
  remonte pas `onPress` comme prop directe sur le nœud hôte rendu (géré en interne via les
  responders tactiles) → `.props.onPress` est `undefined` même quand le composant fonctionne
  réellement. Utiliser **`fireEvent.press(element)`** (de `@testing-library/react-native`), qui
  simule correctement l'appui quel que soit le câblage interne.

## Intégration RECA App (à approfondir en Phase 08)

- **Même projet Supabase que RECA App** (partagé). RECA Operator ne connaît que **Mission** +
  **MissionItems** (jamais Contrats/Clients/Routes en tant que modules). Détails de schéma,
  rôle `operateur`, RLS et chaîne de résolution de l'opérateur : **à (re)vérifier dans `reca-app`
  au moment de la Phase 08** (ne pas présumer depuis le prototype `reca-operator`).

## Premier build device réel (2026-08-02)

- **Piège Gradle/AGP (Windows)** : les tâches `configureCMakeDebug[*]`/Prefab résolvent leur
  propre toolchain Java **indépendamment** du réglage IDE « Gradle JVM » (qui ne contrôle que le
  *daemon*). Si Gradle a un JDK 22+ auto-provisionné en cache (`~/.gradle/jdks`), il peut être
  choisi pour Prefab même si l'IDE est réglé sur 17 — un bug d'AGP
  (`GeneratePrefabPackagesKt.reportErrors`) traite alors le warning JEP 451 ("restricted method")
  comme une erreur fatale, faisant échouer le build avec un message qui ne mentionne aucune
  version de JDK. **Fix permanent** : `plugins/withGradleJdk17.js` (plugin de config Expo) écrit
  `org.gradle.java.installations.{paths,auto-download,auto-detect}` (lu depuis `JAVA_HOME` de la
  machine, jamais codé en dur) dans `android/gradle.properties` + `toolchainVersion=17` dans
  `android/gradle/gradle-daemon-jvm.properties` à chaque `expo prebuild` — nécessaire car
  `android/` est gitignored et regénéré à chaque fois. **Prérequis machine** : un JDK 17
  standalone doit être installé (ex. Eclipse Temurin) avec `JAVA_HOME` configuré — le plugin ne
  télécharge rien, il ne fait que pointer Gradle vers ce qui existe déjà.
- **Premier test visuel réel a révélé des pièges de mise en page** (jamais vus en aperçu/mock) :
  du contenu en `position: absolute` peut déborder silencieusement de son parent si celui-ci n'a
  pas `overflow: hidden` — sur un vrai écran, la hauteur réellement disponible peut être bien plus
  petite que celle supposée en développement. Et des offsets `bottom`/`top` codés en dur pour des
  overlays (ex. l'ancien sélecteur de dev de `MissionScreenPreview`) sont fragiles dès que le
  contenu réel en dessous change de hauteur d'un appareil à l'autre — préférer un vrai élément
  flex (qui prend sa place dans le flux) à un overlay absolument positionné deviné au pixel près,
  chaque fois que c'est possible.

## Deuxième calibrage visuel réel — device réel (2026-08-02)

- **Bug critique trouvé et corrigé** : `mapArea` avait `minHeight: 220` (`MissionScreen.tsx`).
  Sur un téléphone étroit/court réel (TECNO KL4 testé : 360×800dp), quand le bloc du haut
  (header + `MissionCard` + overlay hors-ligne + alerte) et le bloc du bas (`CurrentResidenceSheet`
  + `BottomTabBar`) réclament ensemble plus que la hauteur disponible, ce plancher forçait le
  total à dépasser la hauteur de l'écran — et comme l'écran n'est **pas** scrollable, l'excédent
  se retrouvait **hors de l'écran physique, invisible**, poussant la feuille résidence et **toute
  la barre d'onglets du bas hors champ**. **Fix** : plancher réduit à `minHeight: 60` (juste assez
  pour ne jamais afficher un écran totalement vide) — flexbox peut désormais réellement réduire
  la carte autant que nécessaire, garantissant que le panneau du bas (donc la navigation) reste
  **toujours** accessible. Levier structurel le plus important de cette passe.
- **`onDetails` jamais câblé** : `MissionScreen.tsx` appelait `<MissionCard ... />` sans le prop
  `onDetails`, donc le bouton « Détails » (bordé, prévu depuis le Sprint 003) ne s'affichait
  **jamais** — seul un pill « Synchronisé » apparaissait à sa place, contrairement à
  `mock-encours.png` qui montre uniquement « Détails ›». **Fixé** par un no-op `onDetails={() =>
  {}}` (même pattern que les autres placeholders décoratifs du projet — `BottomTabBar`, etc.).
- **`SyncIndicator` révisé** : ne s'affiche plus que pour les états `syncState !== 'synced'`
  (`MissionCard.tsx`). Sur la maquette de référence, l'état « synchronisé » (nominal) ne montre
  **aucun** second badge à côté de « Détails » — l'ancienne décision Sprint 003 (« SyncIndicator
  déplacé sous Détails ») empilait les deux pills en permanence, ce qui (a) ne correspond pas au
  PNG de référence et (b) ajoutait de la hauteur inutile au pire moment. Le contrat syncState
  (HANDOFF §4) reste respecté : dès que l'état sort du nominal (`pending`/`syncing`/`offline`/
  `error`), le badge redevient visible.
- **Retours à la ligne parasites corrigés** : sur cet écran étroit (360dp), le titre `Mission
  {id}` et la ligne méta `{total} résidences · {eta}` passaient sur 2 lignes (le second cas
  faisait même déborder juste `(est.)` sur sa propre ligne), et la valeur `TEMPS` (`00:22:20`,
  état PROBLÈME) débordait de sa colonne de 3. **Fixé** par `numberOfLines={1}` sur ces `Txt`
  (troncature nette plutôt qu'un wrap qui gonfle la hauteur de `MissionCard`) + `adjustsFontSizeToFit`
  sur la valeur `TEMPS` (rétrécit plutôt que tronque un chiffre, plus lisible pour une durée).
- **Resserrements de tokens légitimes** (aucune valeur inventée, juste un cran plus petit sur
  l'échelle `spacing` existante) pour redonner de la marge à la carte sur cet appareil :
  `topSection.gap`/`paddingBottom` (`sm`→`xs`), `leftColumn.gap` (`md`→`sm`),
  `CurrentResidenceProgressCard` (`padding` `lg`→`md`, `gap` `md`→`sm`, `steps.gap` `sm+2`→`sm`),
  `AlertCard` (`paddingVertical` `md`→`sm`, `paddingHorizontal` `lg`→`md`, `gap` `md`→`sm`),
  `CurrentResidenceSheet` (`padding` `lg`→`md`, `gap` `md`→`sm`), `BottomTabBar`
  (`paddingTop`/`paddingBottom` `sm`→`xs`).
- **Constat important, non « corrigé » à dessein** : même après tous ces resserrements, la
  variante **EN COURS combinée à l'overlay hors-ligne + l'alerte de démonstration** (décision
  intentionnelle du Sprint 004 : `IN_PROGRESS_MOCK.offline` + une alerte, choisis spécifiquement
  pour prouver que l'overlay hors-ligne peut se superposer à n'importe quel état — voir section
  Sprint 004 plus haut) ne laisse plus assez de hauteur à `mapArea` pour montrer l'intégralité de
  `CurrentResidenceProgressCard` (repères 4/5 « à venir » + bouton « Signaler un problème ») ni le
  FAB « Recentrer »/le widget météo du calque carte : seuls le libellé d'état et une partie du
  chrono restent visibles, le reste est proprement **coupé par le `overflow:hidden` de `mapArea`**
  (pas de chevauchement visuel cassé, juste invisible). **Vérifié que ce n'est PAS un bug
  généralisé** : les 3 autres variantes (EN ROUTE, EN APPROCHE, PROBLÈME — aucune n'a cette
  combinaison hors-ligne+alerte) s'affichent **intégralement**, feuille résidence et barre
  d'onglets toujours visibles, aucun chevauchement. Ce cas précis (EN COURS + démo hors-ligne +
  alerte, sur un écran de 360×800dp) reste donc une limite de densité de contenu connue et
  assumée, pas quelque chose à retenter en boucle — la revoir seulement si un vrai appareil plus
  large que 360dp montre encore un problème, ou si une prochaine maquette pixel couvre
  explicitement ce cas.
- **Repro/outillage** : `.input/mock-encours.png` n'existait plus à la racine de `.input/`
  (dossier gitignoré, recréé à chaque session) — retrouvé dans
  `.input/cran-ma-tre-r-ca-op-rateur/project/assets/mock-encours.png` (export du handoff Fable
  d'origine) et recopié à l'emplacement attendu. **`MissionScreenPreview`'s dev toolbar** n'avait
  pas de safe-area (`useSafeAreaInsets` ajouté) — sans ça, le sélecteur de variantes chevauchait
  la barre de statut Android et ses cibles tactiles réelles ne correspondaient pas à ce qui était
  visible à l'écran, rendant impossible la sélection fiable d'une variante par `adb shell input
  tap`. Ce fichier reste dev-only (même statut que documenté au Sprint 004), ce correctif est
  purement outillage de calibrage.
- **Piège adb/Git Bash** : `adb shell screencap`/`adb pull` avec un chemin `/sdcard/...` échoue
  silencieusement (converti en chemin Windows par Git Bash, ex. `C:/Program Files/Git/sdcard/...`)
  → nécessite `export MSYS_NO_PATHCONV=1` **dans le même appel** (les variables d'environnement
  ne survivent pas entre deux invocations d'outil Bash séparées ici).

## Troisième calibrage réel — correction du diagnostic EN COURS (2026-08-02)

- **Le constat « limite de densité connue » ci-dessus était incomplet** : l'utilisateur a
  recomparé lui-même le rendu à `mock-encours.png` et a eu raison de douter. Le vrai problème
  n'était pas juste « quelques éléments coupés en bas » — `OfflineIndicator` + `AlertsRow`
  vivaient **dans le flux normal** de `topSection` (avant ce fix), donc pour la variante EN COURS
  (seule à combiner les deux, démo Sprint 004) ils gonflaient `topSection` au point de réduire
  `mapArea` à une **simple bande quasi vide** (carte, tracteur, checklist, météo, FAB Recentrer,
  panneau de tâches — tout quasi invisible), très loin de `mock-encours.png`.
- **Cause racine** : violation de l'invariant « Map First : le reste flotte au-dessus »
  (`CLAUDE.md`/docs/02) — `OfflineIndicator`/`AlertsRow` n'étaient pas des overlays flottants
  mais des blocs empilés en flux, donc ils volaient de la hauteur à la carte au lieu de se
  superposer dessus.
- **Fix (`MissionScreen.tsx`)** : `OfflineIndicator`/`AlertsRow` déplacés hors de `topSection`,
  rendus en `position: 'absolute'` **à l'intérieur de `mapArea`** (nouveau style `topOverlay`),
  donc ils flottent au-dessus de la carte sans jamais agrandir `topSection`. Leur hauteur réelle
  est **mesurée** via `onLayout` (pas de valeur magique) et sert à décaler `leftColumn`/
  `rightColumn` (`columnsTop`) juste sous la bannière — sans ce décalage mesuré, la
  `CurrentResidenceProgressCard` démarre au même niveau que la bannière et son fond translucide
  laisse les deux textes se superposer illisiblement (repro observée avant fix).
  `mapArea.minHeight` remis à `60` (pas `220`) : un plancher plus haut que l'espace réellement
  laissé par `topSection`+`bottomSection` recrée exactement le bug du tout premier calibrage
  (dépassement hors écran, barre d'onglets poussée hors champ) — `flex: 1` suffit seul à occuper
  l'espace disponible, `minHeight` n'est qu'un filet de sécurité bas.
- **Résultat vérifié sur device (TECNO KL4, 360×800dp)** : plus de chevauchement de texte, barre
  d'onglets du bas toujours entièrement visible sur les 4 variantes (EN ROUTE/EN APPROCHE/EN
  COURS/PROBLÈME). La variante EN COURS + démo hors-ligne + alerte garde un espace carte plus
  réduit que les autres (repères 4/5, bouton « Signaler un problème », widget météo, contrôles
  zoom restent coupés par `overflow:hidden`) — mais **proprement**, sans chevauchement ni
  clipping de la navigation, contrairement à l'état trouvé en début de cette passe. Cette
  contrainte résiduelle reste liée au budget vertical réel de ce device combiné à cette démo
  précise (mock-encours.png ne montre pas ce cas hors-ligne+alerte simultané) — pas un bug de
  layout à retenter en boucle.
- `tsc --noEmit`, `eslint .`, `jest` (27/27, 4 suites) : tous verts après ce fix.

## Simplification du header — décision produit (2026-08-02)

- **Constat de l'utilisateur (validé)** : le header (`AppHeader.tsx`) dupliquait deux entrées de
  la `BottomTabBar` — le bouton `Menu` face à l'onglet `Plus`, le `Bell`/badge notifications face
  à l'onglet `Alertes` (les deux badges affichaient d'ailleurs le même compte mocké, `2`). Seul le
  `Cloud` (statut sync) était une info unique.
- **Décision** : `AppHeader` réduit au **logo seul** (`OfficialLogo`, largeur 120) — plus de
  `Menu`, `Bell`, `NotificationBadge`, ni **`Wordmark` (« OPÉRATEUR »)** en dessous (demande
  explicite : le libellé « RÉCA GROUPE » reste visible car il est **dans le SVG du logo**
  lui-même, seul le sous-texte séparé `OPÉRATEUR` a été retiré — pas de contradiction avec
  l'interdit `CLAUDE.md` sur le nom officiel affiché, qui reste lisible via le logo). Le composant
  `Wordmark` lui-même n'est pas supprimé (encore utilisé par `ComponentGalleryScreen`, dev-only).
- **`Cloud` déplacé dans `MissionCard`** (`headerRight`, à côté de « Détails ») : nuage vert simple
  quand `syncState === 'synced'`, sinon le `SyncIndicator` existant (contrat HANDOFF §4 inchangé).
- **`MissionCard` resserrée** : badge décoratif `ClipboardList` (carré rouge 44×44, purement
  visuel) supprimé ; `card.padding`/`gap` descendus à `spacing.sm`/`spacing.xs`. **Tentative
  annulée** : fusionner "Secteur {x}" et "{n} résidences · {eta}" sur une seule ligne tronquait
  l'ETA (`numberOfLines={1}` coupait le texte à « 1… », perte d'info silencieuse) — **revenu aux
  2 lignes distinctes**, aucune information affichée ne doit disparaître silencieusement pour
  gagner de la hauteur.
- **Résultat vérifié sur device** : espace carte visiblement agrandi sur les 4 variantes, aucune
  régression (pas de nouveau chevauchement, barre d'onglets toujours entièrement visible). La
  limite déjà documentée (EN COURS + démo hors-ligne + alerte) reste la même — pas aggravée, pas
  résolue par ce changement (ce n'était pas son objet). `tsc`/`eslint`/`jest` (27/27) verts.
- **Fichiers touchés** : `AppHeader.tsx` (réécrit, props `onMenu`/`onSync`/`onNotifications`/
  `notifications` retirées), `MissionCard.tsx`, `MissionScreen.tsx` (appel `<AppHeader />` sans
  props), `ComponentGalleryScreen.tsx` (même correction d'appel, dev-only).

## Retrait de `CurrentResidenceProgressCard` — décision produit (2026-08-02)

- **Constat de l'utilisateur (validé)** : la carte flottante `CurrentResidenceProgressCard`
  (état + chrono + adresse + checklist, superposée à la carte) faisait doublon avec
  `MissionCard` (état déjà visible via ses stats) et `CurrentResidenceSheet` (adresse déjà
  affichée en bas) — « cette carte-là je trouve qu'elle est de trop ». L'utilisateur note aussi
  que l'onglet `Mission` du bas peut porter les détails complets, donc l'écran carte n'a pas
  besoin de tout dupliquer.
- **Décision** : `CurrentResidenceProgressCard` **n'est plus rendue** par `MissionScreen.tsx`
  (le composant/fichier n'est pas supprimé — encore utilisé par `ComponentGalleryScreen`,
  dev-only — mais son rôle produit disparaît de l'écran maître).
  - **État + chrono** déplacés dans `MissionCard` : le 3e stat (auparavant « Temps » = temps
    total de mission) devient **l'état de la résidence actuelle + son chrono de phase**
    (`phaseLabel`/`phaseSeconds`/`phaseColor`, coloré selon l'état comme `PhaseTimer`). Le temps
    total de mission n'est plus affiché nulle part sur cet écran (jugé moins actionnable
    instant par instant — récupérable via `Mission` plus tard). Pour l'état `PROBLEM`,
    `phaseSeconds` utilise `state.problem.frozenSeconds` (le chrono normal est gelé/ignoré,
    voir `missionScreenState.ts`).
  - **Bouton « Signaler un problème »** déplacé dans `CurrentResidenceSheet`, en 4e position à
    côté d'Appeler/Note/Itinéraire (même style `FloatingActionButton`, icône rouge
    fonctionnelle `colors.danger`) plutôt que le style pilule pleine largeur de `ProblemButton`
    (resté disponible comme composant, plus utilisé ici).
  - **`CurrentResidenceSheet` réorganisée** : l'ancien layout en ligne (infos à gauche, 3
    boutons à droite) faisait wrapper « RÉSIDENCE ACTUELLE » sur 2 lignes faute de largeur.
    Nouveau layout en colonne : bloc infos pleine largeur en haut, rangée de 4 boutons en
    dessous — plus de wrap, et la 4e action tient sans re-serrer davantage.
  - **Tentative annulée** : fusionner secteur/résidences/ETA sur une ligne dans `MissionCard`
    tronquait l'ETA silencieusement — déjà documenté plus haut, toujours valable, pas retenté.
  - `ProblemStateCard` (état PROBLEM, contenu différent — type de problème/note/chrono figé,
    jamais dupliqué ailleurs) **reste affichée** : ce n'est pas la carte visée par la demande.
    Mais elle n'avait **jamais été resserrée** lors des passes précédentes (`padding: lg`/
    `gap: md`) et déborde de `mapArea` sur cet appareil étroit — chrono figé coupé, boutons
    « Reprendre plus tard »/« Passer à la suivante » **invisibles** (bug fonctionnel réel :
    aucun autre moyen d'agir sur l'état PROBLEM). **Partiellement corrigé** au passage : padding/
    gap resserrés (`md`/`sm`, même token que les autres cartes) + boutons passés en rangée
    (`flexDirection: 'row'`, `flex: 1` chacun) au lieu d'empilés — le chrono figé est maintenant
    entièrement visible, **mais les 2 boutons d'action restent coupés** sur ce device précis
    (contenu total encore trop haut pour l'espace laissé par `mapArea`). **Non résolu à ce
    stade** — solutions possibles pour une prochaine passe : déplacer ces 2 boutons dans
    `CurrentResidenceSheet` (même logique que « Signaler »), ou réduire la taille du chrono figé
    (`PhaseTimer` y est en taille "hero" 44px, peut-être excessif pour un chrono secondaire). À
    netraiter explicitement, pas oublié par accident.
- **Barre de dev de `MissionScreenPreview.tsx` passée en overlay absolu** (sur demande) :
  auparavant une vraie ligne en flux (fix de la session précédente contre une collision avec le
  bas d'écran) ; elle chevauche maintenant le logo pendant le développement seulement (jamais
  livré) — récupère la hauteur qu'elle prenait en flux. Aucun risque de récidive de l'ancien
  bug (qui venait d'un offset `bottom` codé en dur, pas de la position en flux elle-même).
- Vérifié sur device (TECNO KL4) : les 4 variantes affichent nettement plus de carte
  (tracteur/itinéraire/repères/météo/recentrer tous visibles), y compris EN COURS + démo
  hors-ligne+alerte (l'ancienne limite documentée est de facto résolue, la carte encombrante
  ayant disparu). `tsc`/`eslint`/`jest` (27/27) verts.
- **Fichiers touchés** : `MissionCard.tsx` (props `phaseLabel`/`phaseSeconds`/`phaseColor`
  remplacent `missionSeconds`), `CurrentResidenceSheet.tsx` (4e bouton + layout colonne),
  `MissionScreen.tsx` (retrait du rendu `CurrentResidenceProgressCard`, câblage des nouveaux
  props), `ProblemStateCard.tsx` (resserrement + actions en rangée), `MissionScreenPreview.tsx`
  (toolbar en overlay), `ComponentGalleryScreen.tsx`/`tests/components.test.tsx` (appels mis à
  jour pour les nouveaux props `MissionCard`).

## Doublon « Recentrer » + météo mal placée (2026-08-02)

- **Constat de l'utilisateur (validé)** : deux boutons « Recentrer » sur la carte —
  `leftColumn` avait un `FloatingActionButton` étiqueté « Recentrer », `rightColumn` avait déjà
  un bouton identique (icône seule) empilé avec Couches/Zoom+/Zoom−. Le widget météo (`-8°C ·
  Neige modérée`), lui aussi dans `leftColumn`, flottait seul par-dessus la carte sans lien
  logique avec le reste.
- **Fix (`MissionScreen.tsx`)** : le `FloatingActionButton` « Recentrer » de `leftColumn`
  supprimé (celui de `rightColumn`, dans la pile de contrôles carte, suffit). Le widget météo
  déplacé dans `rightColumn`, sous la pile Recentrer/Couches/Zoom, au-dessus de
  `ResidenceTasksCard` (quand présente) — regroupé avec les autres éléments utilitaires de la
  carte plutôt que seul à gauche.
- **Conséquence** : `leftColumn` ne flotte plus **que** pour l'état PROBLEM (`ProblemStateCard`)
  — rien ne flotte à gauche pour les 3 autres états, conforme à la demande de ne pas remplir
  l'écran d'éléments inutiles. Le style `leftColumn` (`position:absolute`, `width:220`) n'est
  donc conditionné que par ce rendu.
- **Vérifié sur device** : plus de doublon sur les 4 variantes. La météo, en bas de la colonne
  droite, est coupée proprement par `overflow:hidden` de `mapArea` sur EN COURS/PROBLÈME (peu
  d'espace vertical restant, même contrainte déjà documentée) — mais elle ne bloque plus rien
  quand elle est coupée, contrairement à avant où elle était seule et visible en plein milieu de
  la carte. `tsc`/`eslint`/`jest` (27/27) verts.

## Contrainte de vérification (ce VPS) — corrigée (2026-08-02)

- **Ancienne hypothèse invalidée** : ce dépôt tourne en réalité sur une **machine Windows** (pas
  un VPS Linux headless) qui a, de fait, le SDK Android complet (`adb`, `platform-tools`), un JDK
  17 standalone, et peut lancer `gradlew assembleDebug` + installer/piloter un **vrai téléphone
  Android branché en USB** directement depuis cet environnement — pas besoin systématique du
  laptop du propriétaire. Vérifié de bout en bout le 2026-08-02 : prebuild → build → install →
  Metro (`expo start --dev-client`) → `adb reverse` → capture d'écran (`adb shell screencap` +
  `adb pull`) → comparaison pixel avec une maquette de référence, boucle de calibrage itérative
  complète.
- **Ce qui reste vrai** : sans appareil **physiquement branché** à cette machine au moment de la
  session, la validation runtime/visuelle est toujours impossible d'ici (pas d'émulateur installé)
  — il faut alors demander au propriétaire de brancher un appareil (`adb devices` vide = bloqué,
  à vérifier **avant** de commencer toute tâche de calibrage visuel plutôt que de supposer que ce
  n'est jamais possible ici).
- **Workflow confirmé par le propriétaire (2026-08-02)** : le développement/build/calibrage se
  fait avec **Android Studio + adb**, appareil branché en USB sur cette même machine (pas de
  laptop distinct impliqué dans cette boucle). Séquence à suivre pour tout besoin de
  captures/vérification visuelle : `npm run start -- --dev-client` (jamais `npm run start` seul —
  Expo Go ne fonctionne plus depuis l'intégration Mapbox native, Sprint 005-006) → `adb reverse
  tcp:8081 tcp:8081` → si l'app est déjà installée, `adb shell am force-stop
  ca.groupereca.recaoperateur` puis relancer via `monkey -p ca.groupereca.recaoperateur -c
  android.intent.category.LAUNCHER 1` (un simple retour au premier plan d'une instance déjà
  résidente peut rester bloqué sur un bundle JS périmé/déconnecté — observé concrètement : écran
  bleu marine vide jusqu'au force-stop) → attendre la ligne `Android Bundled … index.ts` dans les
  logs Metro avant de capturer. Package réel : `ca.groupereca.recaoperateur` (un second package
  `com.anonymous.recaoperateur` traîne aussi sur l'appareil de test, obsolète, ne pas l'utiliser).

## State Machine (Sprint 009-010, 2026-08-01)

- **Moteur pur** (`src/engines/state-machine/`), aucun React, `Db`/`Clock` injectés (mêmes
  contraintes que la persistance Sprint 007-008) — appelé par un futur GPS Engine/mode
  développement, pas encore câblé nulle part côté React (`MissionContext`/`MissionScreen`
  inchangés à part la migration de `ACTIVE_STATES`, voir plus bas). **Ne pas** considérer ce
  sprint comme livrant une fonctionnalité visible dans l'app — c'est l'autorité métier, prête à
  être appelée.
- **Aucune validation GPS (précision/délai) dans ce moteur** — décision explicite, conforme à
  `docs/09` (« la State Machine n'est pas responsable de… calculer une distance »). Les commandes
  acceptent `gpsAccuracyMeters`/`latitude`/`longitude` en option (stockés tels quels sur la
  `StateTransition`) mais ne les valident pas ; ce sera la responsabilité du GPS Engine
  (Sprint 011-012) d'appeler la bonne commande au bon moment.
- **Verrou de transition = file de promesses par mission** (`Map<missionId, Promise>`), pas un
  vrai mutex OS (inutile en JS mono-thread) — suffisant pour sérialiser deux commandes concurrentes
  sur la même mission et empêcher une course sur l'invariant « une résidence active ».
- **Déduplication** : si l'état cible demandé est déjà l'état courant de l'item/mission → refus
  immédiat (`DUPLICATE_TRANSITION`), **aucun** effet de bord, avant même de vérifier le graphe de
  transitions. Un événement « obsolète » (ex. `ApproachRadiusEntered` reçu alors que l'item est
  déjà `IN_PROGRESS`) est naturellement rejeté par le graphe normal (`INVALID_TRANSITION`, car
  `IN_PROGRESS` n'autorise pas de retour vers `APPROACHING`) — **pas besoin d'un code d'erreur
  séparé** pour ce cas, le graphe suffit.
- **`ANOTHER_ITEM_ACTIVE` ne se déclenche que pour une *nouvelle* activation** : seulement quand
  l'item partait d'un état **non actif** (`WAITING`/`SKIPPED`/`PROBLEM`) vers un état actif. Un
  item déjà actif qui progresse (`APPROACHING → IN_PROGRESS`) n'est **pas** une nouvelle
  activation et ne redéclenche pas ce contrôle — piège trouvé en écrivant les tests (un premier
  jet du test créait volontairement deux items actifs en même temps pour tester ce refus, ce qui
  testait en réalité un état de départ déjà invalide, pas la règle elle-même).
- **`reason` réutilisé, pas de nouvelle colonne SQL** : le vocabulaire `docs/09` pour le cas
  adjacent (`travelTimeSource: 'ADJACENT_RESIDENCE_FALLBACK'`) et la transition directe
  EN_ROUTE→IN_PROGRESS (`transitionSource: 'ADJACENT_RESIDENCE'|'MANUAL'|'RECOVERY'|…`) décrit des
  champs **distincts** de `StateTransition.source` (qui reste `GPS|MANUAL|SYSTEM|RECOVERY|ADMIN`,
  tel que défini dans `src/domain/entities.ts` depuis le Sprint 007-008). Plutôt que d'inventer une
  colonne, cette information est stockée dans le champ `reason` (texte libre, déjà existant) —
  décision pour ne pas modifier le schéma sans nécessité avérée.
- **Résidences adjacentes** : une seule transaction (`Db.withTransactionAsync`) écrit A→COMPLETED
  et B→WAITING→IN_PROGRESS (temps de trajet fixé à 5 s), avec **deux** lignes `StateTransition`
  (une par item) plutôt qu'une seule — plus fidèle à « chaque décision doit pouvoir être
  expliquée » (`docs/09` Journalisation) que de fusionner les deux mouvements en une seule ligne.
- **Récupération après redémarrage** (`recoverOnStartup`) : le cas « plusieurs actifs » sort
  volontairement du graphe de transitions normal — les items actifs en surnombre sont ramenés à
  `WAITING` par une écriture directe (pas via `applyItemTransition`, qui refuserait
  `IN_PROGRESS → WAITING` comme non autorisé), source `SYSTEM`, `reason` documentant l'anomalie.
  Justifié par `docs/09` : « restaurer un seul MissionItem actif… conserver une trace de la
  correction » — c'est une correction administrative explicite et journalisée, pas une régression
  silencieuse au sens de l'invariant « un MissionItem terminé ne revient pas automatiquement en
  arrière » (ces items n'étaient pas terminés, juste en conflit d'invariant).
- **`ACTIVE_STATES` de `MissionContext.tsx` migrée** vers `ACTIVE_ITEM_STATES`/`isActiveItemState`
  dans `src/engines/state-machine/itemTransitions.ts` — c'était une règle métier dupliquée hors du
  moteur, maintenant source unique. `MissionContext.tsx` importe cette fonction, ne redéfinit plus
  rien.
- **Portée explicitement exclue de ce sprint** (à ne pas essayer de « corriger en passant ») :
  mode simulation / UI développeur (§ « Mode simulation » `docs/09`, correspond au Sprint 017-019
  « mode développement » de `tasks.md`) ; câblage réel dans `MissionContext` (méthodes de commande
  exposées aux composants) ou `MissionScreen` — les commandes existent et sont testées, mais
  aucun appelant réel ne les invoque encore dans l'app.

## GPS Engine (Sprint 011-012, 2026-08-01)

- **Moteur pur** (`src/engines/gps/`), aucun React, `StateMachine`/`Clock` injectés — appelle
  **directement** les commandes du State Machine (`enterApproach`/`enterWork`/`completeItem`/
  `enterAdjacentResidence`) une fois un délai de validation écoulé, jamais d'écriture directe
  (`docs/04` : le GPS Engine « ne modifie jamais directement le statut »).
- **Deux hypothèses non chiffrées par `docs/04`, à valider par le propriétaire** — la doc dit
  seulement « ignorer les positions dont la précision dépasse le seuil configuré » et « attendre
  le retour du signal » sans donner de nombre : **précision GPS max acceptée = 50 m** et **délai
  de détection de perte de signal = 15 s**, tous deux par défaut dans `DEFAULT_GPS_THRESHOLDS`
  (marqués `@assumption` dans `types.ts`). Ce n'est **pas** une règle métier inventée (le
  comportement — filtrer/détecter — est documenté), juste un paramètre par défaut manquant.
- **`MissionItem.detectionRadiusMeters` (Sprint 007-008, jamais expliqué depuis) interprété comme
  un remplacement optionnel du rayon de début d'intervention (30 m) propre à la résidence** — le
  nom « rayon de détection » (`docs/03`) colle le mieux à « entrée dans la zone de travail ». Les
  rayons d'approche (250 m) et de fin (50 m) restent globaux, aucun champ dédié dans le schéma.
  **À reconfirmer avec le propriétaire** si un jour ce champ s'avère représenter autre chose.
- **Validation par délai** : même schéma partout (entrée en rayon d'approche/travail/adjacence,
  sortie du rayon de fin, stabilisation du cap) — un candidat de transition doit être **revu
  identique** après le délai requis avant d'être accepté ; toute observation qui casse la
  condition avant l'échéance réinitialise le candidat (pas de mémoire partielle). Implémenté une
  seule fois (`validate()`/`resetPendingIfMatches()`), pas dupliqué par zone.
- **`setActiveResidence` prend une `startingPhase` explicite** (défaut `EN_ROUTE`, cohérent avec
  `docs/04` « Démarrage ») — piège trouvé en écrivant les tests : sans ce paramètre, reprendre la
  surveillance d'une résidence déjà `APPROACHING`/`IN_PROGRESS` (ex. après redémarrage) forçait
  incorrectement le moteur à repartir de `EN_ROUTE`, qui n'aurait jamais permis d'atteindre les
  seuils déjà dépassés dans la réalité.
- **Correction rétroactive du State Machine (Sprint 009-010)** : `docs/09` « Activation de la
  résidence suivante » n'avait **jamais été implémentée** — `completeItem` complétait l'item
  courant sans jamais chercher/activer le prochain `WAITING` admissible en `EN_ROUTE`, contrairement
  à la section dédiée de `docs/09` et à la responsabilité explicite « activer le MissionItem
  suivant » listée pour la State Machine. Corrigé dans `stateMachine.ts`
  (`activateNextAdmissibleItem`, appelée depuis `completeItem` via un nouveau hook générique
  `additionalWrites(missionId, occurredAt)` sur `applyItemTransition`/`writeItemTransition` —
  s'exécute **dans la même transaction** que la complétion). Le GPS Engine s'appuie directement
  sur ce comportement : après un `completeItem` réussi, il n'a **pas** besoin d'appeler
  `startEnRoute` lui-même pour la résidence suivante — le State Machine s'en charge. 2 tests
  ajoutés à `tests/stateMachine.test.ts` (17/17 après correction).
- **Simulateur = Travail explicite de cette phase** (`docs/11` Phase 07 « Simulation obligatoire »),
  contrairement au mode simulation du State Machine (différé au Sprint 017-019, § « Mode
  simulation » de `docs/09`) — distinction voulue : ici c'est un harnais de test réutilisable
  (`simulator.ts`, `createGpsSimulator`), pas un écran développeur. Réutilise le **même** moteur
  que la production (`docs/09` : « la simulation doit utiliser la même State Machine que la
  production »), jamais de logique dupliquée.
- **Portée explicitement exclue** (comme le State Machine) : capteur `expo-location` réel
  (permissions, test sur appareil physique — étape « tester sur appareil réel » du Roadmap),
  câblage dans `MissionContext`/`MissionScreen`. Le moteur est prêt (commandes + simulateur
  testés) mais sans appelant réel dans l'app pour l'instant.

## Intégration Supabase réelle (2026-08-02)

- **`reca-app` accessible sur cette machine** (`/c/var/www/html/reca-app`, cloné par le
  propriétaire) + credentials Supabase ajoutés dans `reca-operateur/.env.local` (préfixe renommé
  `VITE_*` → `EXPO_PUBLIC_*`, mêmes valeurs, même projet Supabase partagé). C'est la tâche de
  suivi promise au Sprint 013-014 — voir plan archivé dans `plans.md` pour le détail complet.
- **RLS réelle étudiée dans `reca-app/supabase/migrations/`** : `missions`/`mission_items`
  autorisent l'**UPDATE** de l'opérateur assigné (`employees.user_id = auth.uid()` →
  `missions.operator_id`), mais **INSERT/DELETE restent admin-only** — aucune Mission n'est
  jamais créée depuis `reca-operateur`. `mission_items.statut_operateur` (7 valeurs) +
  `heure_arrivee`/`heure_fin`/`duree_trajet_secondes`/`duree_intervention_secondes` existent déjà
  côté serveur, anticipant précisément notre State Machine granulaire. **Aucune table
  `problems`/notes par item côté serveur** → Problem/Note (listés par `docs/11` Phase 08) restent
  hors de portée tant que ce schéma n'existe pas, comme les médias.
- **Mapping de statut, décisions du propriétaire (2026-08-02, ne pas réinventer)** :
  `WAITING/EN_ROUTE/APPROACHING/IN_PROGRESS/COMPLETED` → `en_attente/en_route/en_approche/
  en_cours/terminee` (1:1). `PROBLEM`/`SKIPPED` → **convergent** vers `a_reprendre` (serveur n'a
  pas d'équivalent séparé). `CANCELLED` **ne doit jamais être produit par l'opérateur** —
  `toServerItemStatutOperateur` lève `UnsupportedStatusError` plutôt que de mapper silencieusement
  (`src/integrations/supabase/statusMapping.ts`). Rollup `mission_items.statut` dérivé de
  `statut_operateur` (règle du commentaire de migration : « en_cours pour tout état engagé »).
- **Nouvelle règle métier découverte à cette occasion (confirmée par le propriétaire, pas
  inventée)** : une résidence infaisable **ne s'annule jamais** — elle reste `a_reprendre`
  (« retourne en bas de la liste, retenter plus tard » ; si toujours impossible, un **superviseur**
  doit la traiter manuellement dans `reca-app`). Une fois toutes les résidences traitées,
  l'opérateur **reste en mission active** durant son trajet retour au garage, puis appuie sur
  **« Fermer la mission »** (backend déjà prêt : `requestMissionComplete` du Sprint 009-010) — ceci
  écrit `missions.heure_fin`/`statut` et sert de **feuille de temps** (`heure_debut`/`heure_fin`
  existaient déjà, aucune colonne ajoutée). `Mission.status === 'COMPLETED'` se traduit
  `'terminee'` si tous les items sont `terminee`, sinon **`'terminee_avec_anomalies'`** (au moins
  un `a_reprendre`) — c'est le mécanisme exact qui alerte le superviseur, dérivé automatiquement
  par `SupabaseSyncTransport` (une requête `count` sur `mission_items` avant l'update de Mission).
  **Le bouton UI « Fermer la mission » livré au Sprint 018** (`EndOfMissionScreen.tsx` +
  `MissionContext.closeMission()`) — voir plans.md pour le détail.
- **Convention id serveur = id local, sans exception, pour toute mission réelle** : contrairement
  au seed de démo (`seedDemoMissionIfEmpty`, UUID générés localement, jamais synchronisés),
  `fetchAssignedMission` écrit les entités locales avec les **id Supabase tels quels** — c'est ce
  qui permet à `SupabaseSyncTransport` de faire un simple `UPDATE ... WHERE id = <id local>` et de
  retrouver la bonne ligne. Ne jamais générer un nouvel id (`generateId()`) pour une
  Mission/MissionItem qui provient du serveur.
- **`heure_arrivee` interprétée comme `enCoursAt`** (début d'intervention, pas début d'approche) —
  `@assumption` du même type que les seuils du GPS Engine (`docs/04`) : le commentaire de
  migration reca-app (« entrée dans le rayon ») ne tranche pas explicitement entre approche et
  travail. À reconfirmer avec le propriétaire si `reca-app` affiche un jour cette valeur de façon
  visible et qu'elle semble fausse.
- **`fetchAssignedMission`/`SupabaseSyncTransport` ne créent ni ne suppriment jamais rien** côté
  serveur (cohérent avec la RLS admin-only sur INSERT/DELETE) — uniquement des `SELECT`/`UPDATE`
  sur des lignes qui doivent déjà exister. Si `fetchAssignedMission` ne trouve aucune Mission
  assignée (`operator_id` + `statut in (planifiee, en_cours)`), `MissionContext` retombe sur
  `seedDemoMissionIfEmpty` (**dev uniquement** — aucune régression pour le calibrage visuel).
- **Auth minimale ajoutée en avance sur le Sprint 017-019** : `AuthContext`/`LoginScreen`
  (email/mot de passe via Supabase Auth) — décision du propriétaire, pas une improvisation : RLS
  sur `missions`/`mission_items` dépend de `auth.uid()`, donc un vrai préalable, pas un détail
  cosmétique à reporter. Pas d'écran d'inscription/réinitialisation — comptes provisionnés par un
  admin dans `reca-app`.
- **Pièges Jest rencontrés** :
  - `@react-native-async-storage/async-storage` (requis par la persistance de session Supabase)
    casse Jest (`NativeModule: AsyncStorage is null`) dès que `supabaseClient.ts` est importé
    (chaîne `MissionContext` → `fetchAssignedMission` → `supabaseClient`, donc **tout** test qui
    touche `MissionContext`, même indirectement). Le mock officiel de la lib
    (`.../jest/async-storage-mock.js`) **ne s'auto-enregistre pas** — il faut le brancher via
    `moduleNameMapper` (`^@react-native-async-storage/async-storage$` → ce fichier), pas
    `setupFiles` (testé, ne fonctionne pas — le fichier ne contient aucun `jest.mock()`).
  - `process.env.EXPO_PUBLIC_*` est **vide sous Jest** : le chargement de `.env.local` est un
    mécanisme de la CLI `expo start`/`expo export` (`@expo/env`), pas de `jest` seul —
    contrairement à `reca-app` où Vite/Vitest le fait. Fixé par `tests/setupSupabaseEnv.js`
    (`jest.setupFiles`, valeurs factices `??=` — jamais de vrai réseau touché en test, chaque test
    qui a besoin du client Supabase l'injecte lui-même en fake).
  - Le faux `SupabaseClient` de test (`tests/supabaseSyncTransport.test.ts`) reproduit **les 2
    formes d'appel exactes** utilisées par le transport réel (`.update().eq().select()` et
    `.select().eq().eq().is()`, chaque maillon renvoyant le même objet thenable) plutôt que de
    mocker le SDK Supabase en entier — même philosophie que `tests/testFakeDb.ts` (faux, pas mock
    générique).

## Vérification sur device réel — Mission #9 (2026-08-02)

- **`@react-native-async-storage/async-storage` est un module natif** (pas juste une lib JS) :
  ajouté au `package.json` de cette passe, mais le dev build déjà installé sur l'appareil ne le
  contenait pas → premier lancement post-install : `[runtime not ready] NativeModule:
  AsyncStorage is null` (même famille de piège que Mapbox au Sprint 005-006 : tout nouveau module
  natif exige un nouveau `expo prebuild` + build Gradle, jamais juste un reload Metro).
- **`local.properties` (`android/`, gitignored, régénéré par `prebuild`) doit utiliser des
  slashs (`/`), pas des antislashs** : `sdk.dir=C:\Users\...` fait échouer Gradle (« La syntaxe du
  nom de fichier... est incorrecte ») — un fichier `.properties` interprète `\` comme un
  caractère d'échappement. Utiliser `sdk.dir=C:/Users/Francis/AppData/Local/Android/Sdk`.
- **`ANDROID_HOME` n'est pas exporté par défaut dans ce shell**, bien que `adb` soit sur le PATH
  (`adb.exe` vit dans `C:\Program Files\platform-tools`, un emplacement standalone — le **vrai**
  SDK avec `build-tools`/`platforms` est sous
  `C:\Users\Francis\AppData\Local\Android\Sdk`). Il faut l'exporter explicitement
  (`export ANDROID_HOME=...`) **dans le même appel** que `./gradlew` (pas de persistance entre
  deux appels Bash séparés ici — même contrainte que `MSYS_NO_PATHCONV` déjà documentée).
- **Un `./gradlew installDebug` tué par un timeout d'outil (10 min) laisse des daemons Gradle/
  processus `java.exe` orphelins qui continuent d'écrire sur le disque** — relancer immédiatement
  une 2e commande dans le même dossier de build cause un échec `mergeDebugNativeLibs` (« Unable to
  delete directory… New files were found… process is still writing »). **Fix** : `./gradlew
  --stop` puis vérifier qu'aucun `java.exe` ne reste (`tasklist`, `taskkill /F` si nécessaire)
  avant de relancer. Pour un premier build natif complet (comprend la compilation CMake du SDK
  Mapbox), prévoir **5-10 minutes** — lancer en arrière-plan plutôt que dans le timeout par défaut.
- **Metro (`expo start`) segfault (`Segmentation fault`, code de sortie 139) s'il tourne en même
  temps qu'un build Gradle avec compilation CMake/ninja active** (contention CPU/mémoire sur cette
  machine) — observé de façon reproductible 2 fois. **Ne pas lancer Metro et un build natif en
  parallèle** ; attendre la fin du build Gradle avant de (re)démarrer Metro. Un « Error while
  reading cache, falling back to a full crawl » au redémarrage suivant est bénin (cache Metro
  invalidé par le crash précédent, pas une régression).
- **Technique de vérification sans instrumenter le code** : pour confirmer qu'une donnée a bien
  été écrite dans la base SQLite locale d'un dev build **sans** ajouter de `console.log` ni
  reconstruire l'app, extraire le fichier directement depuis le stockage privé de l'app (build
  debuggable) : `adb exec-out run-as <package> cat /data/data/<package>/files/SQLite/<db>.db >
  local-copy.db` (**`exec-out`, pas `shell ... > file`** — la redirection de shell classique via
  `run-as` a produit un fichier tronqué/corrompu ici, `sqlite3` refusait de l'ouvrir : « database
  disk image is malformed ») puis interroger avec le `sqlite3` fourni par `platform-tools`.
  **Toujours supprimer le fichier extrait immédiatement après inspection** (ne jamais le laisser
  traîner dans le repo — il contient des données réelles, même en dev).
- **Confirmé fonctionnel bout-en-bout** : connexion `operateur@groupereca.ca` → `fetchAssignedMission`
  a écrit la vraie Mission #9 (id serveur `cd37ac3c-9dc6-4c0c-9b4b-3ffb690d127c`, `route`/
  `operator` = `null` — signature qui la distingue de la Mission de démo) + ses 5 `mission_items`
  avec adresses géocodées réelles et `contract_id` réels, tous `WAITING`.
- **Limite découverte, pas corrigée cette passe** : la Mission de démo (créée lors d'une session
  précédente, avant que l'auth existe) **coexiste** maintenant avec la vraie Mission #9 dans la
  base locale — `seedDemoMissionIfEmpty` ne s'exécute que si la base est vide, donc il ne l'a pas
  remplacée. `MissionContext` prend `missions[0]` de `missionRepo.getAll()` (ordre non garanti) :
  ambigu tant qu'aucune vraie politique de sélection de mission active n'existe. À traiter avant
  de brancher `MissionScreen` sur `MissionContext` (suivi dans `tasks.md`).
- **Non vérifié cette passe** : le chemin d'écriture (transitions locales → `SupabaseSyncTransport`
  → `reca-app`) — seul le téléchargement (lecture) a été testé sur device. `MissionScreen` ne lit
  toujours pas `MissionContext`, donc aucune action opérateur réelle ne peut encore déclencher une
  transition sur la vraie Mission #9 depuis l'UI.

## Refonte visuelle — Phase 1 : dépendances natives (branche `PLAN-ECRANS-OPERATEUR-RECA`, 2026-08-02)

- **`react-native-gesture-handler` + `react-native-reanimated` (v4.5.1) + `react-native-worklets`
  ajoutés** (`npx expo install`, `expo-doctor` signale `react-native-worklets` comme peer
  dépendance **requise séparément** par Reanimated v4 — pas auto-installée). `babel.config.js` :
  `react-native-reanimated/plugin` ajouté (**doit être le dernier plugin de la liste**). `App.tsx` :
  `GestureHandlerRootView` à la racine (englobe `SafeAreaProvider`).
- **Piège de build critique — durée dépasse la limite de 10 min des tâches d'outillage** :
  compiler les 4 ABI (armeabi-v7a/arm64-v8a/x86/x86_64) pour reanimated/gesture-handler/worklets
  (C++ CMake lourd, en plus d'`expo-modules-core`) a fait échouer **4 tentatives consécutives**
  de `./gradlew installDebug` en arrière-plan (statut « killed », pas un vrai timeout Gradle — le
  process JVM du daemon Gradle continue de tourner en arrière-plan après que l'outil ait « tué »
  sa commande, ce qui a bien failli causer une corruption par accès concurrent quand une 2e
  tentative a démarré alors que la 1re tournait encore — toujours `./gradlew --stop` + vérifier
  qu'aucun `java.exe` ne reste avant de relancer). **Fix retenu** : restreindre `gradle.properties`
  à `reactNativeArchitectures=arm64-v8a` (le seul ABI du TECNO KL4, seul appareil de test sur
  cette machine) — a réduit le build de >10 min (jamais terminé) à **~5 min** (`installDebug`
  réussi du premier coup une fois restreint). **Rendu durable** via un nouveau plugin de config
  Expo `plugins/withDevSingleAbi.js` (même pattern que `withGradleJdk17.js` — `android/` est
  gitignored/régénéré par `expo prebuild`, donc ce fix doit survivre au prebuild, pas juste être
  un edit à la main). **Marqué explicitement dev-only** : à retirer/conditionner avant tout build
  multi-appareils ou de distribution réelle.
- **Faux positif de blocage total au premier lancement post-install** : après le build réussi, le
  premier `am force-stop` + relance a montré un écran bleu marine totalement vide pendant
  plusieurs minutes (aucune erreur logcat, process vivant, `libreanimated.so` chargé avec succès,
  Mapbox initialisé) — **piégeant car indiscernable du splash screen** (`app.json` :
  `backgroundColor: "#0B1020"` = exactement `colors.bg`, donc un splash jamais caché a le même
  rendu visuel qu'un écran d'app bloqué). Logs `.expo/dev/logs/start.log` ont confirmé un vrai
  hang côté Metro (« connection terminated... after not responding for 60 seconds »). **Résolu
  par un second relaunch** (force-stop + monkey) — logs de diagnostic temporaires ont confirmé
  que la 2e tentative a chargé les polices, cache le splash et résolu `getSession()` normalement
  en <1s ; jamais reproduit depuis. Cause probable : condition de course au tout premier cold
  start après un install natif majeur (nouveau runtime worklets à initialiser), pas un bug de
  code. **Vrai bug trouvé au passage et corrigé** : `AuthContext.tsx` — `supabase.auth
  .getSession().then(...)` n'avait **aucun `.catch()`** ; un rejet (lecture AsyncStorage cassée,
  etc.) aurait laissé l'état bloqué sur `'loading'` **pour toujours** (silencieusement, aucune
  UI ne s'affiche jamais) — fixé par un repli explicite vers `'signedOut'` en cas d'échec.
  **Réflexe à garder** : face à un écran bleu marine totalement vide sans erreur logcat, vérifier
  D'ABORD `.expo/dev/logs/start.log` (contient les `console.log`/erreurs JS même sans redbox
  visible) avant de supposer un bug de rendu — et se rappeler que le splash et le fond d'écran
  réel sont **visuellement identiques** dans cette app.
- **Vérifié fonctionnel** : app démarre, se connecte (session persistée réutilisée), affiche
  l'écran mission complet (mocks `MissionScreenPreview`) sans régression visible avec les 3
  nouveaux modules natifs actifs. `tsc`/`eslint`/`jest` (91/91) verts.

## Refonte visuelle — Phases 2-6 (branche `PLAN-ECRANS-OPERATEUR-RECA`, 2026-08-02)

- **Header restauré** (`AppHeader.tsx`) : repris quasi verbatim de la version pré-simplification
  (`git show 18e6bcb^:...`), avec `syncState` désormais threadé (icône colorée via
  `SYNC_STATE_META`, exporté depuis `SyncIndicator.tsx` pour ne pas dupliquer le mapping état→
  icône/couleur entre le header et `MissionCard`).
- **Mission card compacte** (`MissionCardCompact.tsx` réécrite) : contenu resserré exactement
  selon le spec (titre+Détails / secteur / une seule ligne résidences+%+état·chrono + barre fine
  3px) — le statut sync n'y est plus dupliqué (vit maintenant uniquement dans le header).
- **Phase 5 (bandeau d'instruction) : aucun code ajouté, déjà satisfait** — `alerts`/`AlertsRow`/
  `topOverlay` (Sprint 004) faisaient déjà exactement ce que demandait le spec, jusqu'aux textes
  d'exemple identiques déjà présents dans `missionScreenMocks.ts` (« Plate-bande au fond »,
  « Boîte aux lettres à droite de l'entrée »). Toujours vérifier les mocks existants avant de
  construire un nouveau composant qui pourrait dupliquer un mécanisme déjà en place.
- **`VoiceButton` affichait toujours un label texte** (« Annonce ») même en usage icône-seule —
  invisible dans `BottomTabBar` (fond de la barre) mais chevauchait le contenu en dessous une
  fois flottant indépendamment. `label` rendu optionnel (`undefined` = pas de texte) ;
  `BottomTabBar` passe explicitement `label="Annonce"` pour ne pas régresser son propre rendu.
- **`BottomSheet.tsx` refondu avec de vrais gestes** (`react-native-gesture-handler` `Gesture.Pan`
  + `react-native-reanimated` `useSharedValue`/`useAnimatedStyle`/`withSpring`) : le doigt pilote
  directement une hauteur animée pendant le drag, un `withSpring` claque au snap (25/50/75/100)
  le plus proche au relâchement. Vérifié sur device (TECNO KL4) : cycle ouverture+fermeture par
  glissement fonctionne, `adb shell input swipe` suffit pour simuler (mais un swipe qui commence
  **sur** le `VoiceButton` flottant — superposé en `zIndex:10` — est intercepté par son propre
  `Pressable` au lieu d'atteindre le `GestureDetector` derrière ; démarrer le swipe ailleurs sur
  le sheet).
  - **Piège Reanimated 4 #1** : `useSharedValue(otherSharedValue.value)` **pendant le rendu**
    déclenche un warning strict-mode (« Reading from `value` during component render ») — même
    juste pour initialiser une seconde shared value avec la même valeur de départ. Fix : calculer
    la valeur initiale indépendamment (même expression source), jamais lire `.value` d'une autre
    shared value hors d'un worklet/effet.
  - **Piège Reanimated 4 #2 (plus sérieux, crash réel)** : appeler une fonction JS "plate" (définie
    hors composant, sans directive `'worklet'`) depuis l'intérieur d'un callback de geste (`onEnd`,
    qui s'exécute sur le UI thread) lève **`[Worklets] Tried to synchronously call a Remote
    Function`** — architecture v4 (Worklets séparé de Reanimated) refuse maintenant ce qui aurait
    pu être une conversion silencieuse en v3. **Fix** : ajouter explicitement `'worklet';` en
    première ligne de toute fonction utilitaire pure appelée à la fois depuis le JS thread (rendu)
    et depuis un worklet (callback de geste) — ici `pctToPx` dans `BottomSheet.tsx`.
  - **Test Jest** : mocker `react-native-worklets` (pas `react-native-reanimated` — son propre
    `mock.js` réexporte `./src/mock` qui importe `./index` en entier et plante sous Jest, module
    natif absent) via `moduleNameMapper` → `react-native-worklets/src/mock.ts` (le module fournit
    son propre mock officiel, contrairement à `async-storage` qui n'en avait pas d'auto-enregistré
    — voir plus haut). `react-native-gesture-handler/jestSetup.js` déjà branché en Phase 1 reste
    nécessaire en plus.

## Refonte visuelle — Phase 7 : fusion Problème/Résidence (2026-08-02)

- **`leftColumn` (colonne flottante étroite, 220px) retirée** — `ProblemStateCard` (props
  `bare` ajoutée, même convention que `CurrentResidenceSheet`) devient le contenu du
  `BottomSheet` gestuel en état PROBLEM, `CurrentResidenceSheet` sinon. Corrige de facto le
  suivi ouvert du 2026-08-02 (boutons d'action coupés sur écran étroit) — le sheet plein-bord a
  bien plus d'espace que l'ancienne colonne.
- **Bug de rendu réel découvert et corrigé — texte invisible dans les boutons d'action** : après
  la fusion, « Reprendre plus tard »/« Passer à la suivante » s'affichaient comme des pilules
  vides (bordure/fond visibles, **aucun texte**), reproductible à tous les snaps (25/50/75/100),
  avec ou sans geste de glissement. **Vérifié via un test Jest jetable que ce n'était pas un bug
  de logique** : `getByText` trouvait le texte dans l'arbre — le composant était correct, seul le
  rendu natif était en cause. **Cause isolée par comparaison structurelle** : `PressableScale`
  (`components/ui/`) utilise l'API `Animated` **classique** de `react-native` (pas Reanimated) ;
  partout où elle fonctionne dans l'app (`FloatingActionButton`, `VoiceButton`), le `Txt` de
  label est un **frère** du `PressableScale`, jamais un enfant direct. `ProblemStateCard` était le
  **seul** endroit à mettre le `Txt` en enfant direct de `PressableScale` — invisible seulement
  une fois nichée dans l'`Animated.View` piloté par **Reanimated** de `BottomSheet` (Phase 6) :
  un `Animated.View` classique (`react-native`) imbriqué dans un `Animated.View` Reanimated dont
  la taille change ne peint pas toujours le texte de ses enfants directs sur ce device/GPU (Mali).
  **Fix** : remplacé `PressableScale` par un `Pressable` brut pour ces 2 boutons précis (perte de
  l'animation de pression scale, acceptable pour ce cas) — **rétabli et vérifié** sur device.
  **Règle à retenir pour la suite de cette refonte** : ne jamais mettre un `Txt` en enfant direct
  d'un `PressableScale` à l'intérieur de `BottomSheet` (ou de tout futur ancêtre animé par
  Reanimated) — toujours en frère, comme le fait déjà `FloatingActionButton`/`VoiceButton`.

## Sprint 017 (partie 1/N) — Câblage réel de MissionContext (2026-08-02)

- **Découpage validé avec le propriétaire** (Phase 11 « Intégration complète » est énorme — tous
  les moteurs + 6 nouveaux écrans) : cette passe ne couvre que le câblage technique des 5 moteurs
  existants (State Machine/GPS/Sync/Offline/Voice) dans `MissionContext`, plus le remplacement des
  mocks statiques de `MissionScreen` par les vraies données. Pas de nouveaux écrans, pas de
  capteurs natifs réels (`expo-location`/NetInfo) — même principe « logique d'abord, capteur
  ensuite » déjà appliqué à chaque moteur précédent.
- **`App.tsx` remplace enfin `<MissionScreenPreview />` par `<LiveMissionScreen />`** — promesse
  faite depuis le Sprint 004 (« reswitché vers un `MissionScreen` unique piloté par le vrai State
  Machine une fois qu'il existera »), redifférée à chaque sprint moteur suivant (009-010, 011-012,
  013-014, 015, 016). C'est cette passe qui l'honore.
- **Bug latent corrigé** : `MissionContext` prenait `missions[0]` de `getAll()` (ordre non
  garanti par le faux `Db`/SQLite) comme mission active — devenu ambigu dès que la vraie Mission
  #9 Supabase coexiste avec la mission de démo en local. Fix : `selectedMissionId = assigned?.id
  ?? missions[0]?.id`, les items filtrés par ce `missionId`. N'affecte jamais l'environnement de
  démo pur (une seule mission, comportement inchangé).
- **`PROBLEM` est exclu de `ACTIVE_ITEM_STATES`** (`itemTransitions.ts`, décision du Sprint
  009-010) — donc `MissionContext.activeMissionItem` ne peut **jamais** lui-même être un item
  PROBLEM. `deriveMissionScreenState.ts` et `LiveMissionScreen.tsx` cherchent explicitement un
  item `PROBLEM` dans `allMissionItems` en plus de `activeMissionItem` — piège facile à
  reproduire si un futur code lit seulement `activeMissionItem` en pensant couvrir tous les cas.
- **Pas de `missionVoiceBridge.ts` séparé** (écart au plan initial, assumé) : sans capteur GPS
  réel, les transitions automatiques `EN_ROUTE→APPROACHING→IN_PROGRESS→COMPLETED` ne se
  produisent jamais cette passe — rien à traduire pour elles. Seul `VOICE_PROBLEM_RECORDED` est
  réellement déclenché (`reportProblem`, sur succès). Un traducteur générique aura de vrais
  événements à observer une fois `expo-location` câblé — à construire à ce moment-là, pas avant.
- **`onReportProblem` (bouton « Signaler ») reste sans effet réel** dans `LiveMissionScreen.tsx` —
  aucune UI n'existe pour choisir un `problemCode`, et aucune taxonomie n'est documentée
  (`docs/03`/`docs/07`/`docs/09`). Inventer une liste de codes ici aurait été une règle métier non
  validée. Suivi ouvert, documenté en commentaire de code — pas un oubli.
- **`MissionProvider` prend `syncTransportOverride`/`speakerOverride`** en plus du
  `getDbOverride` déjà existant (Sprint 007-008) — nécessaires pour que
  `tests/missionContext.test.tsx` ne déclenche jamais un vrai appel réseau Supabase ni un module
  natif de synthèse vocale quand il exerce `reportProblem`/`resolveProblem`/`skipItem` (qui
  appellent `runSyncCycle()`/`voiceEngine.processNext()` en interne). Même règle « jamais de vrai
  réseau touché en test » que chaque moteur précédent.
- **`act()` requis autour de chaque commande mutante dans les tests `renderHook`** :
  `reportProblem`/`resolveProblem`/`skipItem` déclenchent des `setState` React (via
  `afterMutation`) après leur `await` — sans les envelopper dans `await act(async () => {…})`,
  Jest émet un warning « update not wrapped in act(...) » (pas un échec de test, mais un bruit
  systématique à éviter).
- **Vérifiée sur device réel** (TECNO KL4) une fois l'appareil branché en cours de tâche : aucun
  nouveau build natif requis (aucune dépendance native ajoutée cette passe), simple rechargement
  JS via Metro déjà actif (`adb shell am force-stop` + relance). Aucune nouvelle erreur JS dans
  les logs Metro (`.expo/dev/logs/start.log`), session Supabase déjà authentifiée persistée.
  `<LiveMissionScreen />` affiche le repli honnête « Aucune résidence active pour le moment » —
  **comportement voulu**, pas un bug : la Mission #9 réelle avait déjà tous ses items
  COMPLETED/SKIPPED depuis le test de câblage Supabase antérieur (2026-08-02), donc plus aucun
  item actif ni PROBLEM à afficher. `tsc`/`eslint`/`jest` (128/128)/`expo-doctor` (20/20) tous
  verts. **Suivi ouvert, non bloquant** : revalider avec une mission ayant encore des résidences
  WAITING/EN_ROUTE (démo ou nouvelle assignation Supabase) pour voir `MissionScreen` réellement
  peuplé (carte/chronos/boutons) plutôt que seulement le repli.

## Sprint 018 — Fin de mission (2026-08-02)

- **Choisi comme prochain sprint avec le propriétaire** (alternatives écartées : Sprint 017
  partie 2/N capteurs réels GPS/réseau — plus gros, nouveaux modules natifs ; Sprint 019 mode
  développement — moins utile sans capteurs réels à simuler). Ferme le suivi ouvert « bouton UI
  Fermer la mission » (`requestMissionComplete` déjà câblé côté serveur depuis le câblage
  Supabase, restait sans appelant UI).
- **Un item `PROBLEM`/`SKIPPED` restant n'empêche PAS de fermer la mission** — c'est exactement le
  cas `terminee_avec_anomalies` (règle métier confirmée au câblage Supabase, voir plus haut), pas
  une erreur à bloquer. Seuls `WAITING` et les états actifs (`EN_ROUTE`/`APPROACHING`/
  `IN_PROGRESS`) bloquent, exactement la condition déjà encodée dans
  `requestMissionComplete` — `deriveEndOfMissionState.ts` la lit de `isActiveItemState` plutôt que
  de la dupliquer, pour que les deux ne puissent jamais diverger.
- **Piège découvert en écrivant le test d'intégration `closeMission` (succès)** : la mission de
  démo (`seedDemoMissionIfEmpty`) reste `status: 'READY'` pour toujours dans cet environnement —
  le graphe `docs/09` n'autorise `COMPLETED` que depuis `IN_PROGRESS`, et **rien dans le repo
  actuel ne fait jamais cette transition** : le bouton « démarrer » qui l'appellerait vit sur
  l'écran « Mission active » (`docs/11` Écrans finaux), toujours hors scope. Une vraie mission
  Supabase n'a pas ce problème : `fetchAssignedMission.ts` la mappe déjà `IN_PROGRESS` si
  `statut === 'en_cours'` côté serveur. **À garder en tête pour le sprint qui livrera l'écran
  Mission active** : sans son bouton « démarrer », toute mission créée localement (démo ou future)
  reste bloquée en `READY` et ne pourra jamais être fermée via `EndOfMissionScreen`.
- **`MissionContext.closeMission()` recharge `mission` en plus des items** — contrairement à
  `reportProblem`/`resolveProblem`/`skipItem` (qui ne mutent qu'un `MissionItem`, `afterMutation`
  suffisait), fermer la mission mute la `Mission` elle-même. Sans `missionRepo.getById` après le
  succès, `MissionContext.mission.status` resterait périmé en mémoire React et l'écran ne verrait
  jamais son propre succès malgré une écriture DB réussie.
- **`closeMission` retourne le `TransitionResult` brut** (pas juste `Promise<void>` comme les 3
  autres commandes) — `EndOfMissionScreen` a besoin d'un vrai message d'erreur si la fermeture est
  refusée (ex. item encore actif détecté entre la dérivation de l'écran et le clic), plutôt
  qu'un échec silencieux.

## Système de mémoire

- Fichiers **à la racine** du repo (imposé par `docs/`) : `memory.md`, `tasks.md`, `plans.md`,
  `file-index.md`. **Ce n'est PAS un dossier `memory/`** (ça, c'est la convention de `reca-app`).
- Lire ces 4 fichiers + les `docs/` pertinents **avant** chaque tâche ; les mettre à jour
  **après**. Une tâche non reflétée ici n'existe pas pour la session suivante.
