# CLAUDE.md

Guide pour Claude Code (et tout contributeur) travaillant dans ce dépôt.

## Ce qu'est `reca-operateur`

Application mobile **React Native + Expo** — assistant **terrain** pour opérateurs de
déneigement (base générique des futures apps terrain Signa). Nom officiel affiché :
**« RÉCA OPÉRATEUR »** (jamais « RECA Operator » dans l'UI). Le superviseur, lui, utilise
**RECA App** (`/var/www/html/reca-app`, système maître + référence d'intégration). Ce dépôt
**remplace** le prototype web `/var/www/html/reca-operator` (à ne pas utiliser comme fondation).

## Protocole obligatoire (à chaque tâche)

**Avant de coder :**
1. Lire `memory.md` en entier, puis `tasks.md`, `plans.md`, `file-index.md`.
2. Lire le(s) document(s) `docs/` concerné(s) par la tâche (ex. State Machine → `docs/09`,
   Mapbox → `docs/05`, hors ligne → `docs/07`+`docs/08`). Ne jamais se fier à la mémoire seule
   ou au dernier prompt.
3. Pour toute tâche non triviale : écrire son **plan** dans `plans.md` **avant** d'implémenter.
4. Consulter `reca-app` quand l'intégration de données l'exige (types/tables/conventions).

**Après la tâche :** mettre à jour `tasks.md`, `plans.md`, `file-index.md`, `memory.md` et les
`docs/` si une décision a changé. Une tâche non reflétée dans la mémoire **n'existe pas** pour la
session suivante. Ne jamais laisser une doc connue comme fausse.

## Commandes

```bash
npm run start       # Expo dev server (QR → Expo Go)
npm run android     # Expo + build/lancement Android
npm run prebuild    # génère android/ (ouvrir ensuite dans Android Studio)
npm run typecheck   # tsc --noEmit (TS strict)
npm run lint        # eslint (config Expo)
npm test            # jest (jest-expo)
```

**Build réel** : le code vit sur le VPS ; on synchronise par **git** vers le laptop, où
`expo prebuild` génère `android/` que l'on compile dans **Android Studio** et lance sur
l'appareil. **Ce VPS n'a ni GUI ni émulateur** → ici on ne garantit que compile + types + lint +
tests (headless) ; la validation **runtime/visuelle** se fait sur le laptop/téléphone.

## Invariants d'architecture (voir `docs/02` + `docs/10`)

- **Map First** : la carte est l'application ; le reste flotte au-dessus.
- **Les moteurs (`src/engines`) ne connaissent jamais React** ; ils communiquent par événements,
  reçoivent leurs dépendances par injection (horloge, stockage, logger, client).
- **Les composants ne touchent jamais Supabase ni Mapbox directement**, et ne contiennent aucune
  transition d'état ni calcul GPS/temps. Le Timer **affiche**, ne compte pas.
- **La State Machine est l'unique autorité** des transitions (`ATTENTE→ROUTE→APPROCHE→COURS→
  TERMINÉE`, aucun retour automatique). **Une seule résidence active** à la fois.
- **Local-first** : toute action terrain est écrite localement **avant** synchronisation.
- **Tracteur fixe** au centre ; c'est la **carte qui tourne** (cap validé après temporisation,
  jamais le cap GPS brut).

## Conventions

- **Langue** : code/types/fichiers/commentaires en **anglais** ; **UI en français**.
- **Nommage** : composants/types `PascalCase` · fonctions/variables `camelCase` · constantes
  globales `UPPER_SNAKE_CASE` · fichiers techniques `kebab-case` (`gps-engine.ts`).
- **TypeScript strict** ; éviter `any` (localisé + justifié si inévitable). Valider toute donnée
  externe. Horloge injectable pour les calculs temporels. UUID pour les identifiants.
- Un composant/module = **une** responsabilité (idéalement ≤ 250 lignes).

## Interdits

Faux logo (utiliser les SVG de `assets/`) · écrire « RECA Operator » dans l'UI · secret commité
(clés via env/EAS) · accès direct à Supabase/Mapbox depuis React · logique métier dans les
composants · masquer une erreur par une valeur fictive · inventer une règle métier (nouveau
statut/transition/table/rôle/moteur) sans validation · marquer une tâche terminée sans tests.

## Système de mémoire

Fichiers **à la racine** : `memory.md`, `tasks.md`, `plans.md`, `file-index.md` (ce n'est **pas**
un dossier `memory/` comme dans `reca-app`). Ils sont persistants et obligatoires.
