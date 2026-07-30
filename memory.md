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
- **Carte = `@rnmapbox/maps`** (confirmé par le HANDOFF). Non installé avant la **Phase 04**
  (roadmap). Nécessitera un **dev build** (Expo Go ne charge pas le natif Mapbox).
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
