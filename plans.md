# plans.md — Plans d'implémentation de `reca-operateur`

> Un plan est écrit **avant** toute tâche importante (nouvelle fonctionnalité, refonte,
> migration, changement d'architecture/schéma, moteur, synchronisation, State Machine, hors
> ligne). Voir `docs/10-Development-Standards.md`. Les plans terminés sont archivés ci-dessous.

## Plan actif

- (aucun — prochain : Sprint 005-006 (Map Engine), à planifier ici avant de coder)

## Archivé

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
