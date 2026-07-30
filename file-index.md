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
- `App.tsx` — écran **placeholder** Sprint 001 (marque RÉCA OPÉRATEUR). Remplacé par l'écran
  maître à partir du Sprint 002.
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

Chaque dossier a un `README.md` décrivant sa responsabilité unique. Vide de code au Sprint 001
(structure seulement) :

- `src/app/` — composition racine (providers, thème, montage).
- `src/screens/` — écrans complets (Mission, Connexion, Aucune mission, Fin, Paramètres, Dev).
- `src/components/` — UI présentationnelle pure.
- `src/domain/` — modèles/règles métier purs (états, transitions, géométrie), sans React/I/O.
- `src/engines/` — moteurs métier hors React (event-based, deps injectées) :
  - `state-machine/` (décide) · `gps/` (détecte) · `map/` (affiche, Mapbox) ·
    `voice/` (informe) · `sync/` (transmet) · `offline/` (continuité).
- `src/context/` — pont React (MissionContext), mince.
- `src/persistence/` — stockage local-first (schémas, repositories, transactions).
- `src/integrations/` — adaptateurs externes (Supabase, Mapbox, TTS) derrière interfaces.
- `src/services/` — orchestration (Authentication, Mission Loader…).
- `src/hooks/` — hooks React minces (adaptateurs de moteurs/contexte).
- `src/types/` — types partagés.
- `src/utils/` — helpers purs.
- `src/config/` — design tokens + constantes réglables des moteurs.

## Assets officiels (`assets/`)

- `logo-clair.svg`, `logo-sombre.svg` — logo officiel (ne jamais redessiner).
- `tractor.png` — tracteur vue de dessus (marqueur fixe de la carte).
- `map-night.svg` — référence de style carte nuit.
- `icon.png`, `splash-icon.png`, `android-icon-*.png`, `favicon.png` — **placeholders Expo**
  (à remplacer par les vrais visuels avant distribution).

## Tests & scripts

- `tests/App.test.tsx` — smoke test (rend `<App/>`, vérifie la marque).
- `scripts/` — scripts de dev (vide au Sprint 001).

## Dépendances critiques (à surveiller — `docs/10`)

- `expo` ~57 · `react-native` 0.86 · `react` 19.2.3 (versions liées).
- Tests : `jest-expo` ~57 · `@testing-library/react-native` **13.3.3** ·
  `react-test-renderer` **19.2.3 (exact)** — voir piège RNTL dans `memory.md`.
- À venir : `@rnmapbox/maps` (Phase 04), client Supabase, stockage local, TTS.
