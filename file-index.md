# file-index.md — Index officiel du dépôt `reca-operateur`

> Où se trouve chaque responsabilité. À mettre à jour quand un fichier important est créé/
> supprimé/déplacé/renommé. On n'indexe pas les fichiers triviaux (protocole `docs/10`).

## Configuration & points d'entrée

- `package.json` — dépendances et scripts (`start`/`android`/`ios`/`web`/`prebuild`/
  `typecheck`/`lint`/`test`). Preset jest `jest-expo`.
- `app.json` — config Expo (nom « RÉCA Opérateur », portrait, thème sombre, `scheme`,
  ids `ca.groupereca.recaoperateur`, icônes).
- `tsconfig.json` — TS strict + flags (`docs/10`), `types: [jest, react]`, alias `@/* → src/*`.
- `babel.config.js` — preset `babel-preset-expo` (requis par le transform jest).
- `eslint.config.js` — flat config `eslint-config-expo` (+ ignores `.input`, natifs, config cjs).
- `index.ts` — enregistre le composant racine (`registerRootComponent(App)`).
- `App.tsx` — charge les polices Manrope (`useAppFonts`) puis affiche `MissionScreen` dans un
  `SafeAreaProvider` (Sprint 003). `ComponentGalleryScreen` reste dans le repo (référence/tests)
  mais n'est plus le point d'entrée.
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
  - `MissionScreen.tsx` — **écran produit** (Sprint 003) : assemble tous les composants en
    l'écran maître EN COURS, mise en page fixe (pas de scroll), mock data de l'exemple Roadmap.
  - `ComponentGalleryScreen.tsx` — galerie de tous les composants (mock data), référence de
    comparaison visuelle, plus le point d'entrée de `App.tsx` depuis le Sprint 003.
- `src/components/` — UI présentationnelle pure.
  - `ui/` — primitives : `Txt`, `GlassCard`, `PressableScale`, `Icon`, `ProgressBar`,
    `StatusDot`, `Pill`, `NotificationBadge` (Sprint 003, factorisé depuis `AppHeader`).
  - `brand/` — `OfficialLogo` (SVG officiel), `Wordmark` (texte « OPÉRATEUR »).
  - `mission/` — `AppHeader`, `MissionCard` (+ `etaLabel`, bouton « Détails » bordé — corrigé
    Sprint 003), `MissionCardCompact`, `PhaseTimer` (+ `formatDuration` et
    `formatElapsedWithHours` purs, testés), `AlertCard`, `SystemStatus`, `OfflineIndicator`,
    `SyncIndicator`, `CurrentResidenceSheet`, `UpcomingResidenceRow`, `FixedTractor`,
    `CurrentResidenceProgressCard` (Sprint 003, colonne gauche EN COURS), `ResidenceTasksCard`
    (Sprint 003, panneau droit tâches).
  - `controls/` — `FloatingActionButton`, `ProblemButton`, `VoiceButton`, `BottomSheet`
    (coquille, gestes de glissement toujours différés — la maquette n'en montre pas le besoin),
    `BottomTabBar` (Sprint 003 ; seuls Carte/Annonce fonctionnels, voir `memory.md`).
  - `map/` (Sprint 003, nouveau) — `SimulatedMapBackground` (fond `map-night.svg` + marqueurs +
    tracteur, **placeholder statique remplacé par le vrai Map Engine en Phase 04**),
    `ResidenceMapMarker` (badge neutre / halo vert+maison si actif).
- `src/domain/`
  - `status.ts` — `MissionItemState` (union) + `STATE_LABELS_FR`. Pur, sans React/I/O.
- `src/engines/` — moteurs métier hors React (event-based, deps injectées). Vide (Sprint 006+) :
  - `state-machine/` (décide) · `gps/` (détecte) · `map/` (affiche, Mapbox) ·
    `voice/` (informe) · `sync/` (transmet) · `offline/` (continuité).
- `src/context/` — pont React (MissionContext), mince. Vide (Sprint 007+).
- `src/persistence/` — stockage local-first (schémas, repositories, transactions). Vide.
- `src/integrations/` — adaptateurs externes (Supabase, Mapbox, TTS) derrière interfaces. Vide.
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
- `tests/missionScreen.test.tsx` (Sprint 003) — `formatElapsedWithHours` (pur) + rendu
  `CurrentResidenceProgressCard`/`BottomTabBar` (dont un `fireEvent.press`) + `MissionScreen`
  (avec `SafeAreaProvider` + métriques synthétiques — voir piège dans `memory.md`).
- `tests/__mocks__/svgMock.tsx` — stub Jest pour les imports `.svg`.
- `tests/__mocks__/lucideMock.js` — stub Jest pour `lucide-react-native` (Proxy → icône no-op ;
  fichier `.js` volontairement, hors du typecheck TS — voir `tsconfig.include`).
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
- À venir : `@rnmapbox/maps` (Phase 04), client Supabase, stockage local, TTS.
