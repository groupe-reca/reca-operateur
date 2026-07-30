# plans.md — Plans d'implémentation de `reca-operateur`

> Un plan est écrit **avant** toute tâche importante (nouvelle fonctionnalité, refonte,
> migration, changement d'architecture/schéma, moteur, synchronisation, State Machine, hors
> ligne). Voir `docs/10-Development-Standards.md`. Les plans terminés sont archivés ci-dessous.

## Plan actif

- (aucun — prochain : Sprint 003, à planifier ici avant de coder)

## Archivé

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
