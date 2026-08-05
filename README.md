# RÉCA OPÉRATEUR

Application mobile **React Native + Expo** — assistant terrain pour opérateurs de déneigement
(Groupe RECA / plateforme Signa). Le superviseur utilise **RECA App** ; cette app est un
terminal terrain map-first, pensé pour une charge mentale minimale.

> Documentation officielle : `docs/` (Vision → Roadmap). Décisions & état du projet :
> `memory.md`, `tasks.md`, `plans.md`, `file-index.md`. Contrat de travail : `CLAUDE.md`.

## Stack

Expo SDK 57 · React Native 0.86 · React 19.2 · TypeScript 6 (strict) · `@rnmapbox/maps`
(carte, dès la Phase 04) · jest-expo + `@testing-library/react-native` (tests).

## Prérequis

- Node ≥ 20 (développé sous Node 22).
- Pour builder localement : **Android Studio** (SDK Android) sur le poste de build.

## Scripts

```bash
npm install         # dépendances
npm run start       # serveur Expo (QR → app Expo Go)
npm run android     # build debug + lancement Android (JS servi par Metro, nécessite l'ordinateur)
npm run android:release  # build release + lancement (JS embarqué dans l'APK, autonome)
npm run prebuild    # génère le dossier natif android/
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # jest
```

## Workflow de développement (VPS → laptop)

Le code est développé sur le serveur (typecheck / lint / tests headless). Pour l'exécuter :

1. `git pull` la branche sur le laptop, puis `npm install`.
2. **Phases UI** (avant Mapbox) : `npx expo start` → scanner le QR avec **Expo Go** sur le
   téléphone. Rechargement à chaud, aucun build natif requis.
3. **Dès la carte (Phase 04)** : `@rnmapbox/maps` est du natif → **dev build** nécessaire :
   `npx expo prebuild` puis ouvrir `android/` dans **Android Studio** et lancer sur l'appareil
   (ou `npx expo run:android`).

Les clés (Mapbox, Supabase) passent par des variables d'environnement / EAS — **jamais** commitées.

## Build release (tests terrain — app autonome, sans ordinateur)

Un build **debug** (`npm run android`) sert son JS en direct par Metro (`adb reverse tcp:8081`) —
l'app cesse de fonctionner sans une connexion active à l'ordinateur qui a lancé `expo start`. Pour
les tests terrain, où l'app doit tourner seule sur le téléphone de l'opérateur, il faut un build
**release** : le JS est compilé et embarqué directement dans l'APK à la compilation, aucune
dépendance à Metro/l'ordinateur une fois installé.

```bash
cd android && ./gradlew assembleRelease   # ou : npm run android:release
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

Signé avec le keystore de debug généré par `expo prebuild` (suffisant pour un test terrain interne
— **pas** pour une distribution Play Store, qui nécessiterait un vrai keystore de production via
EAS). `.env.local` doit être présent au moment du build (`EXPO_PUBLIC_*`/
`RNMAPBOX_MAPS_DOWNLOAD_TOKEN`) — ces valeurs sont embarquées dans le bundle, pas lues à
l'exécution, donc un `.env.local` changé après coup nécessite un nouveau build.

## Structure

```
docs/            documentation officielle (source de vérité)
src/
  app/           composition racine
  screens/       écrans complets
  components/    UI présentationnelle pure
  domain/        modèles & règles métier purs (sans React/I/O)
  engines/       moteurs hors React (state-machine, gps, map, voice, sync, offline)
  context/       pont React (MissionContext)
  persistence/   stockage local-first
  integrations/  adaptateurs externes (Supabase, Mapbox, TTS)
  services/      orchestration (auth, mission loader)
  hooks/ types/ utils/ config/
assets/          logo, tracteur, style carte (officiels)
tests/           tests
```

## État

**Sprint 001 — Initialisation** terminé (fondation Expo, structure, mémoire, tests). Voir
`tasks.md` pour la suite (Sprint 002 : design tokens & composants).
