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

## Contrainte de vérification (ce VPS)

- Le VPS **n'a ni GUI ni émulateur** : ici on garantit seulement **compile + types + lint +
  tests** (headless). La validation **runtime/visuelle** se fait sur le **laptop/téléphone** du
  propriétaire (`expo start` + Expo Go pour l'UI ; dev build Android Studio dès Mapbox).

## Système de mémoire

- Fichiers **à la racine** du repo (imposé par `docs/`) : `memory.md`, `tasks.md`, `plans.md`,
  `file-index.md`. **Ce n'est PAS un dossier `memory/`** (ça, c'est la convention de `reca-app`).
- Lire ces 4 fichiers + les `docs/` pertinents **avant** chaque tâche ; les mettre à jour
  **après**. Une tâche non reflétée ici n'existe pas pour la session suivante.
