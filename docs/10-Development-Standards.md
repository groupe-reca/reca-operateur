# 10-Development-Standards.md

# RECA Operator
## Standards de développement

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Ce document définit les règles obligatoires de développement de RECA Operator.

Il s’applique à :

- Claude Code;
- tout développeur humain;
- tout agent d’intelligence artificielle;
- toute contribution future;
- toute modification de l’architecture;
- toute correction;
- toute nouvelle fonctionnalité.

L’objectif est de garantir un projet :

- cohérent;
- compréhensible;
- maintenable;
- testable;
- documenté;
- sécuritaire;
- évolutif;
- fidèle à la vision officielle de RECA Operator.

---

# Principe fondamental

Le code ne constitue pas la seule source de vérité du projet.

La documentation, les décisions d’architecture, les fichiers de mémoire et le code doivent évoluer ensemble.

```text
Documentation
      ↓
Planification
      ↓
Implémentation
      ↓
Tests
      ↓
Mise à jour de la mémoire
      ↓
Mise à jour de la documentation
```

Une modification n’est pas considérée terminée si le code a changé, mais que la documentation ou la mémoire du projet est devenue incorrecte.

---

# Répertoires principaux

Structure recommandée :

```text
reca-operateur/
├── docs/
├── src/
├── assets/
├── tests/
├── scripts/
├── tasks.md
├── plans.md
├── file-index.md
├── memory.md
├── README.md
└── package.json
```

Les noms définitifs peuvent être adaptés à la structure technique retenue.

Les responsabilités décrites dans ce document doivent toutefois être conservées.

---

# Accès à RECA App

Le développeur ou l’agent de développement possède accès au projet :

```text
reca-app
```

RECA App représente l’application centrale de gestion.

RECA Operator doit être développé en tenant compte de son intégration avec RECA App.

Le développeur doit consulter RECA App lorsque cela est nécessaire pour comprendre :

- les entités existantes;
- les conventions de nommage;
- les tables Supabase;
- les types partagés;
- les missions;
- les MissionItems;
- les routes;
- les contrats;
- les opérateurs;
- les équipements;
- les règles d’authentification;
- les permissions;
- les formats de données;
- les mécanismes de synchronisation;
- les conventions API;
- les décisions déjà implantées.

---

# Utilisation de RECA App

RECA App doit être considérée comme une référence d’intégration.

Avant de créer une nouvelle structure de données dans RECA Operator, le développeur doit vérifier si une structure équivalente existe déjà dans RECA App.

Exemple :

```text
Besoin d’un type Mission
      ↓
Consulter reca-app
      ↓
Type existant ?
      ├── Oui → Réutiliser ou adapter de manière compatible
      └── Non → Documenter le nouveau type
```

Le développeur ne doit pas inventer inutilement une seconde convention incompatible.

---

# Limites d’accès à RECA App

L’accès à RECA App ne signifie pas que RECA Operator peut dépendre directement de son interface ou de son code interne.

RECA Operator reste une application indépendante.

Il peut partager ou respecter :

- modèles de données;
- contrats API;
- schémas;
- types communs;
- conventions;
- règles d’authentification.

Il ne doit pas créer de dépendance fragile vers :

- composants visuels internes de RECA App;
- chemins de fichiers instables;
- état React de RECA App;
- logique administrative non pertinente;
- fonctions privées non documentées.

---

# Vérification avant modification partagée

Avant de modifier une donnée ou une convention utilisée par les deux applications, le développeur doit :

1. consulter RECA App;
2. identifier les dépendances;
3. documenter l’impact;
4. proposer un plan de migration;
5. maintenir la compatibilité;
6. mettre à jour les deux documentations lorsque nécessaire.

---

# Système de mémoire obligatoire

Le projet doit posséder un système de mémoire persistant.

Les fichiers obligatoires sont :

```text
tasks.md
plans.md
file-index.md
memory.md
```

Ces fichiers doivent être créés dès le début du projet.

Ils doivent être consultés avant chaque session importante de développement.

Ils doivent être maintenus à jour pendant toute la durée du projet.

Ils ne doivent pas être considérés comme des notes temporaires jetables.

---

# Objectif du système de mémoire

Le système de mémoire sert à éviter :

- la perte de décisions;
- les répétitions;
- les oublis;
- les fichiers dupliqués;
- les changements de direction non documentés;
- les implémentations contradictoires;
- les fonctionnalités commencées puis abandonnées;
- les suppositions incorrectes;
- la recréation de composants existants;
- l’invention de nouvelles architectures à chaque session.

---

# tasks.md

Le fichier `tasks.md` contient l’état opérationnel du travail.

Il doit permettre de savoir immédiatement :

- ce qui doit être fait;
- ce qui est en cours;
- ce qui est bloqué;
- ce qui est terminé;
- ce qui doit être vérifié;
- ce qui a été reporté.

Structure recommandée :

```markdown
# Tasks

## En cours

- [ ] Implémenter MissionContext
- [ ] Ajouter les tests de reprise hors ligne

## À faire

- [ ] Créer le composant PhaseTimer
- [ ] Intégrer le style Mapbox sombre

## Bloqué

- [ ] Synchronisation des médias
  - Raison : schéma serveur non finalisé

## À vérifier

- [ ] Tester les résidences adjacentes sur Android

## Terminé

- [x] Créer la structure initiale du projet
- [x] Ajouter les design tokens
```

---

# Règles de tasks.md

Chaque tâche doit être :

- précise;
- courte;
- vérifiable;
- reliée à un objectif;
- mise à jour après exécution.

Une tâche ne doit pas être marquée terminée si :

- le code n’est pas testé;
- la documentation nécessaire n’est pas mise à jour;
- les fichiers de mémoire sont incorrects;
- une erreur connue reste cachée;
- l’implémentation ne correspond pas aux critères prévus.

---

# plans.md

Le fichier `plans.md` contient les plans d’implémentation.

Il décrit comment une tâche importante doit être réalisée avant de modifier le code.

Il doit contenir :

- objectif;
- contexte;
- fichiers concernés;
- architecture;
- étapes;
- risques;
- tests;
- critères de réussite;
- impact sur la documentation.

Structure recommandée :

```markdown
# Plans

## Plan actif — Intégration du GPS Engine

### Objectif

Implémenter le moteur GPS indépendant de React.

### Fichiers concernés

- src/engines/gps/
- src/context/
- tests/gps/

### Étapes

1. Créer les types GPS.
2. Créer le filtre de précision.
3. Créer le calcul de distance.
4. Ajouter la validation des rayons.
5. Publier les événements.
6. Ajouter les tests unitaires.

### Risques

- Positions imprécises
- Événements dupliqués
- Consommation de batterie

### Critères de réussite

- Aucun changement d’état direct
- Tests de rayons réussis
- Fonctionnement sans réseau

### Documentation à mettre à jour

- 04-GPS-Engine.md
- file-index.md
- memory.md
```

---

# Règles de plans.md

Un plan est obligatoire avant :

- une nouvelle fonctionnalité majeure;
- une refonte;
- une migration;
- un changement de schéma;
- un changement d’architecture;
- une modification touchant plusieurs moteurs;
- une modification de la synchronisation;
- une modification de la State Machine;
- une modification du mode hors ligne;
- une modification d’un contrat partagé avec RECA App.

Les petites corrections locales peuvent utiliser un plan court.

---

# file-index.md

Le fichier `file-index.md` constitue l’index officiel du dépôt.

Il doit permettre de comprendre rapidement :

- où se trouve chaque responsabilité;
- quels fichiers sont importants;
- quels fichiers sont générés;
- quels fichiers ne doivent pas être modifiés;
- quels modules dépendent les uns des autres.

Structure recommandée :

```markdown
# File Index

## Documentation

- `docs/00-Vision.md`
  - Vision officielle du produit.

- `docs/04-GPS-Engine.md`
  - Architecture et règles du moteur GPS.

## Application

- `src/app/App.tsx`
  - Point d’entrée visuel principal.

## State Machine

- `src/domain/state-machine/state-machine.ts`
  - Autorité métier des transitions.

- `src/domain/state-machine/transitions.ts`
  - Définitions des transitions autorisées.

## GPS Engine

- `src/engines/gps/gps-engine.ts`
  - Traitement principal des positions GPS.

## Synchronisation

- `src/engines/sync/sync-engine.ts`
  - Traitement de la file de synchronisation.
```

---

# Règles de file-index.md

Le fichier doit être mis à jour lorsqu’un fichier important est :

- créé;
- supprimé;
- déplacé;
- renommé;
- fusionné;
- remplacé;
- déclaré obsolète.

Il n’est pas nécessaire d’indexer tous les fichiers triviaux.

Il faut indexer au minimum :

- points d’entrée;
- moteurs;
- contextes;
- services;
- modèles;
- bases de données;
- composants importants;
- tests critiques;
- fichiers de configuration;
- scripts;
- documentation;
- assets officiels.

---

# memory.md

Le fichier `memory.md` contient les décisions persistantes du projet.

Il doit répondre aux questions suivantes :

- pourquoi cette architecture a-t-elle été choisie;
- quelles décisions sont officielles;
- quelles solutions ont été rejetées;
- quelles contraintes ne doivent pas être oubliées;
- quelles conventions doivent être conservées;
- quelles erreurs ont déjà été rencontrées;
- quels compromis ont été acceptés;
- quelles directions ont changé.

Structure recommandée :

```markdown
# Project Memory

## Décisions officielles

### La carte est l’application

RECA Operator utilise une architecture Map First.

Les panneaux sont superposés au-dessus de Mapbox.

### Une seule résidence active

Le GPS Engine ne surveille qu’un seul MissionItem actif.

### Tracteur fixe

Le tracteur reste fixe à l’écran.

La carte se déplace sous le tracteur.

## Décisions rejetées

### Rotation continue de la carte

Rejetée à cause du bruit du cap GPS.

La rotation utilise un cap validé après temporisation.

## Contraintes

- L’application doit fonctionner hors ligne.
- Le vrai logo RÉCA doit toujours être utilisé.
- Le nom officiel est RÉCA OPÉRATEUR.
- Le rouge officiel est la couleur principale de marque.

## Problèmes connus

- Le routage distant peut être indisponible hors ligne.
- Les résidences adjacentes nécessitent une transition atomique.
```

---

# Règles de memory.md

Une décision doit être ajoutée à `memory.md` lorsqu’elle :

- modifie l’architecture;
- change une règle métier;
- résout une ambiguïté importante;
- rejette une solution;
- définit une convention permanente;
- corrige une erreur récurrente;
- impose une contrainte;
- change la direction visuelle;
- change l’intégration avec RECA App.

Le fichier ne doit pas devenir un journal quotidien illisible.

Il doit conserver les informations réellement importantes pour les sessions futures.

---

# Consultation obligatoire de la mémoire

Avant de commencer une tâche importante, le développeur doit consulter :

```text
tasks.md
plans.md
file-index.md
memory.md
```

Il doit également consulter les documents pertinents dans :

```text
/docs
```

Flux obligatoire :

```text
Nouvelle tâche
      ↓
Lire tasks.md
      ↓
Lire plans.md
      ↓
Lire memory.md
      ↓
Consulter file-index.md
      ↓
Consulter la documentation concernée
      ↓
Inspecter le code
      ↓
Créer ou mettre à jour le plan
      ↓
Implémenter
```

---

# Mise à jour obligatoire de la mémoire

Après une tâche importante, le développeur doit vérifier :

- `tasks.md`;
- `plans.md`;
- `file-index.md`;
- `memory.md`;
- la documentation technique concernée.

Une session ne doit pas se terminer avec un système de mémoire obsolète.

---

# Documentation officielle

La documentation du projet se trouve principalement dans :

```text
/docs
```

Documents actuels :

```text
00-Vision.md
01-Design-System.md
02-Application-Architecture.md
03-Data-Architecture.md
04-GPS-Engine.md
05-Map-Engine.md
06-Voice-Engine.md
07-Synchronization.md
08-Offline-Mode.md
09-State-Machine.md
10-Development-Standards.md
11-Roadmap.md
```

---

# Consultation permanente de la documentation

Le développeur doit consulter la documentation en tout temps.

Il ne doit jamais se fier uniquement :

- à sa mémoire;
- au dernier prompt;
- au code actuel;
- à une supposition;
- à une ancienne implémentation;
- à une convention générique.

Avant de modifier un module, il doit lire le document correspondant.

Exemples :

```text
Modification du GPS Engine
      ↓
Lire 04-GPS-Engine.md
```

```text
Modification de Mapbox
      ↓
Lire 05-Map-Engine.md
```

```text
Modification des transitions
      ↓
Lire 09-State-Machine.md
```

```text
Modification hors ligne
      ↓
Lire 07-Synchronization.md
      ↓
Lire 08-Offline-Mode.md
```

---

# Modification de la documentation

Si une décision change pendant le développement, la documentation doit être modifiée.

Il est interdit de conserver une documentation connue comme fausse.

Exemple :

```text
Ancienne direction
Le chemin affiche trois résidences

Nouvelle direction
Le chemin affiche cinq résidences
```

Le développeur doit modifier :

- le document d’architecture concerné;
- `memory.md`;
- les tests;
- le code;
- le plan actif;
- les tâches associées.

---

# Documentation et code doivent correspondre

Après une modification, trois situations sont possibles.

## Le code est incorrect

Le code doit être corrigé pour respecter la documentation officielle.

## La documentation est dépassée

La documentation doit être modifiée pour représenter la nouvelle décision validée.

## La direction est ambiguë

Le développeur doit arrêter l’implémentation et demander une décision.

Il ne doit pas choisir silencieusement une nouvelle direction importante.

---

# Changement de direction

Un changement de direction doit être traité explicitement.

Flux recommandé :

```text
Nouvelle décision
      ↓
Identifier les documents affectés
      ↓
Mettre à jour plans.md
      ↓
Mettre à jour la documentation
      ↓
Mettre à jour memory.md
      ↓
Modifier le code
      ↓
Modifier les tests
      ↓
Mettre à jour tasks.md
```

---

# Historique des décisions

Les changements importants doivent conserver une trace.

La documentation peut contenir :

- version;
- date;
- statut;
- note de changement.

Exemple :

```markdown
Version : 1.1
Date : 2026-08-04

Changement :
La rotation de la carte utilise désormais un cap validé après trois secondes.
```

Il n’est pas nécessaire de conserver chaque correction mineure.

---

# Priorité des sources

En cas de contradiction, l’ordre de priorité est :

```text
1. Décision explicite la plus récente validée par le propriétaire du projet
2. Documentation officielle mise à jour
3. memory.md
4. plans.md
5. Code et tests actuels
6. Anciennes maquettes
7. Hypothèses du développeur
```

Une maquette ne remplace pas une règle métier documentée.

Le code existant ne devient pas automatiquement la bonne architecture parce qu’il fonctionne.

---

# Règle de non-invention

Le développeur ne doit pas inventer une fonctionnalité majeure sans validation.

Exemples :

- nouveau statut;
- nouvelle transition;
- nouvelle table;
- nouveau rôle;
- nouveau moteur;
- nouveau flux utilisateur;
- nouvelle dépendance centrale;
- modification importante de l’expérience;
- changement de stratégie hors ligne.

Il peut proposer une amélioration.

Il ne doit pas l’implémenter silencieusement.

---

# Architecture

RECA Operator doit conserver une architecture modulaire.

Séparation principale :

```text
Interface
Domain
Engines
Infrastructure
Persistence
Integrations
```

Exemple :

```text
src/
├── app/
├── components/
├── screens/
├── domain/
├── engines/
├── context/
├── services/
├── persistence/
├── integrations/
├── hooks/
├── types/
├── utils/
└── config/
```

---

# Règle de responsabilité unique

Un module doit posséder une responsabilité principale claire.

Exemples :

- GPS Engine : détecter;
- State Machine : décider;
- Map Engine : afficher la carte;
- Voice Engine : informer;
- Synchronization Engine : transmettre;
- Offline Mode : maintenir la continuité;
- React : afficher et recevoir les actions utilisateur.

---

# Logique métier dans React

Les composants React ne doivent pas contenir de logique métier importante.

Interdit :

```ts
if (distance < 30 && status === 'APPROACHING') {
  item.status = 'IN_PROGRESS'
}
```

Recommandé :

```ts
dispatch({
  type: 'WORK_RADIUS_ENTERED',
  missionItemId,
})
```

La State Machine décide ensuite de la transition.

---

# Accès direct à Supabase

Les composants ne doivent jamais accéder directement à Supabase.

Interdit :

```ts
await supabase
  .from('mission_items')
  .update(...)
```

dans un composant visuel.

L’accès distant doit passer par une couche dédiée :

```text
Component
      ↓
Command
      ↓
Domain
      ↓
Persistence locale
      ↓
Synchronization Engine
      ↓
API / Supabase
```

---

# Local-first

Toute action métier doit être écrite localement avant d’être synchronisée.

Le code ne doit jamais attendre Supabase pour :

- terminer une résidence;
- signaler un problème;
- commencer une mission;
- ajouter une note;
- passer à la résidence suivante.

---

# Types stricts

Le projet doit utiliser TypeScript en mode strict.

Configuration recommandée :

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

L’utilisation de `any` doit être évitée.

Lorsqu’elle est temporairement nécessaire, elle doit être :

- localisée;
- expliquée;
- accompagnée d’une tâche de correction.

---

# Modèles métier

Les modèles métier doivent utiliser des types explicites.

Exemple :

```ts
type MissionItemState =
  | 'WAITING'
  | 'EN_ROUTE'
  | 'APPROACHING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PROBLEM'
  | 'SKIPPED'
  | 'CANCELLED'
```

Éviter les chaînes libres dispersées dans le code.

---

# Validation des données

Toute donnée externe doit être validée.

Sources concernées :

- Supabase;
- API;
- stockage local;
- paramètres;
- deep links;
- données Mapbox;
- fichiers;
- données restaurées après redémarrage.

Une donnée externe ne doit jamais être présumée valide.

---

# Conventions de nommage

## Fichiers

Utiliser des noms cohérents.

Exemple recommandé :

```text
gps-engine.ts
state-machine.ts
mission-context.tsx
phase-timer.tsx
sync-operation.ts
```

## Composants

```text
PascalCase
```

Exemple :

```text
PhaseTimer
MissionCard
OfflineIndicator
```

## Fonctions et variables

```text
camelCase
```

## Constantes globales

```text
UPPER_SNAKE_CASE
```

## Types

```text
PascalCase
```

---

# Langue du code

Le code, les types, les noms de fichiers techniques et les commentaires doivent être principalement en anglais.

L’interface utilisateur doit être en français.

Exemple :

```ts
type MissionItemState = 'IN_PROGRESS'
```

Affichage :

```text
EN COURS
```

Cela facilite :

- la cohérence technique;
- l’intégration avec les bibliothèques;
- la maintenance;
- le recrutement futur;
- les tests.

---

# Commentaires

Les commentaires doivent expliquer :

- pourquoi;
- une contrainte;
- un compromis;
- une règle non évidente;
- une limitation de plateforme.

Ils ne doivent pas simplement répéter le code.

Mauvais commentaire :

```ts
// Increment count
count++
```

Bon commentaire :

```ts
// A five-second fallback is required for adjacent residences
// because no reliable travel interval exists between both geofences.
```

---

# Fonctions

Une fonction doit être :

- courte;
- testable;
- prévisible;
- nommée clairement;
- limitée à une responsabilité.

Les fonctions contenant plusieurs étapes métier doivent être divisées.

---

# Effets secondaires

Les effets secondaires doivent être isolés.

Exemples :

- accès au GPS;
- accès au stockage;
- requête réseau;
- synthèse vocale;
- Mapbox;
- journalisation;
- notifications.

La logique métier centrale doit pouvoir être testée sans ces services.

---

# Injection des dépendances

Les moteurs importants doivent recevoir leurs dépendances.

Exemple :

```ts
createSynchronizationEngine({
  storage,
  apiClient,
  networkMonitor,
  logger,
  clock,
})
```

Éviter les imports globaux cachés qui rendent les tests difficiles.

---

# Horloge injectable

Les calculs temporels doivent utiliser une abstraction d’horloge.

Exemple :

```ts
type Clock = {
  now(): Date
}
```

Cela facilite les tests :

- chronomètres;
- délais;
- transitions;
- réessais;
- expirations;
- mode hors ligne.

---

# Identifiants

Les identifiants doivent être générés de manière stable.

Utiliser des UUID ou un format officiellement défini.

Ne pas utiliser :

- index de tableau;
- heure seule;
- valeur aléatoire faible;
- adresse comme identifiant.

---

# Transactions locales

Les changements métier liés doivent être atomiques.

Exemple :

```text
MissionItem mis à jour
Transition enregistrée
SyncOperation créée
```

Ces écritures doivent réussir ensemble.

---

# Journalisation

Les moteurs doivent utiliser un système de journalisation commun.

Chaque entrée doit pouvoir contenir :

- module;
- niveau;
- événement;
- mission;
- MissionItem;
- heure;
- détails;
- erreur.

Exemple :

```ts
logger.info('MissionItemCompleted', {
  missionId,
  missionItemId,
  source: 'GPS',
})
```

---

# Niveaux de journalisation

```text
DEBUG
INFO
WARN
ERROR
CRITICAL
```

Les journaux de production ne doivent pas contenir d’informations sensibles inutiles.

---

# Gestion des erreurs

Les erreurs doivent utiliser des codes stables.

Exemple :

```ts
type DomainErrorCode =
  | 'INVALID_TRANSITION'
  | 'MISSION_NOT_FOUND'
  | 'LOCAL_WRITE_FAILED'
  | 'GPS_UNAVAILABLE'
```

Éviter de baser la logique sur le texte d’un message d’erreur.

---

# Erreurs récupérables

Exemples :

- réseau absent;
- serveur temporairement indisponible;
- synthèse vocale indisponible;
- carte non chargée.

L’application doit continuer lorsque possible.

---

# Erreurs critiques

Exemples :

- stockage local impossible;
- données métier corrompues;
- plusieurs MissionItems actifs non résolus;
- mission impossible à restaurer.

Ces erreurs doivent être :

- visibles;
- journalisées;
- protégées contre la perte;
- accompagnées d’un chemin de récupération.

---

# Tests

Toute logique métier importante doit posséder des tests.

Types de tests :

- unitaires;
- intégration;
- composants;
- end-to-end;
- récupération;
- hors ligne;
- performance.

---

# Tests unitaires prioritaires

Priorité maximale pour :

- State Machine;
- GPS Engine;
- calculs de distance;
- délais de validation;
- chronomètres;
- synchronisation;
- idempotence;
- conflits;
- mode hors ligne;
- résidences adjacentes.

---

# Tests déterministes

Les tests ne doivent pas dépendre :

- du réseau réel;
- de l’heure réelle;
- du GPS réel;
- de Supabase réel;
- de Mapbox réel;
- d’une voix système réelle.

Utiliser des abstractions et des mocks.

---

# Tests de régression

Tout bogue métier corrigé doit idéalement recevoir un test de régression.

Exemple :

```text
Bogue :
Deux résidences actives après une transition adjacente.

Correction :
Ajouter un test qui garantit une seule résidence active.
```

---

# Qualité visuelle

Les composants doivent respecter :

- le Design System;
- les maquettes validées;
- les design tokens;
- les tailles tactiles;
- les safe areas;
- les contrastes;
- le vrai logo officiel;
- le nom RÉCA OPÉRATEUR.

Claude Code ne doit pas réinventer la direction visuelle.

---

# Assets officiels

Les assets officiels doivent être réutilisés.

Exemples :

- logo;
- tracteur;
- icônes approuvées;
- images;
- polices;
- couleurs.

Il est interdit de recréer approximativement le logo avec du texte ou une icône générique.

---

# Design tokens

Les valeurs visuelles doivent être centralisées.

Exemple :

```ts
export const colors = {
  background: '#07111F',
  surface: 'rgba(10, 24, 40, 0.82)',
  brand: '#C9202F',
  success: '#45D483',
  navigation: '#3F8CFF',
  warning: '#F2A93B',
}
```

Éviter les couleurs écrites directement dans plusieurs composants.

---

# Accessibilité

Les composants doivent respecter :

- grandes cibles tactiles;
- contrastes;
- labels accessibles;
- texte adaptable;
- icônes accompagnées lorsque nécessaire;
- aucune information critique uniquement par couleur.

---

# Performance

L’application doit éviter :

- rendus React inutiles;
- recalculs GPS excessifs;
- reconstruction complète des couches Mapbox;
- écritures locales inutiles;
- synchronisations trop fréquentes;
- animations coûteuses;
- chargement d’assets lourds non optimisés.

---

# Performance de la carte

Mapbox doit être géré par le Map Engine.

Éviter :

- recréer les sources;
- recréer le style;
- modifier toutes les couches à chaque position;
- recalculer la route à chaque seconde;
- utiliser des dizaines de composants React pour les marqueurs.

---

# Mise à jour GPS

Une nouvelle position GPS ne doit pas provoquer le rendu complet de l’application.

Les données fréquentes doivent être isolées.

Le MissionContext ne doit pas devenir un objet géant recréé à chaque mouvement.

---

# Dépendances

Toute nouvelle dépendance doit être justifiée.

Avant de l’ajouter, vérifier :

- maintenance;
- licence;
- compatibilité React Native;
- support iOS;
- support Android;
- fonctionnement hors ligne;
- taille;
- sécurité;
- fréquence de mise à jour;
- nécessité réelle.

---

# Dépendances critiques

Les dépendances critiques doivent être documentées dans :

- `file-index.md`;
- `memory.md`;
- la documentation technique concernée.

Exemples :

- Mapbox;
- stockage local;
- GPS;
- synthèse vocale;
- Supabase;
- navigation;
- gestion d’état.

---

# Secrets

Aucun secret ne doit être commité.

Exemples :

- clés API;
- mot de passe;
- jetons;
- clés Supabase sensibles;
- secrets Mapbox privés.

Utiliser :

- variables d’environnement;
- stockage sécurisé;
- configuration de déploiement.

---

# Sécurité des journaux

Ne jamais journaliser :

- mot de passe;
- jeton complet;
- secret API;
- informations de paiement;
- données personnelles inutiles;
- photos en base64;
- payload sensible complet.

---

# Commits

Les commits doivent être petits et cohérents.

Exemples :

```text
feat(gps): add approach radius validation
fix(sync): preserve pending operations after restart
docs(map): document compact mission header
test(state): cover adjacent residence transition
```

Éviter les commits du type :

```text
updates
fix stuff
changes
final
```

---

# Branche principale

La branche principale doit toujours rester :

- compilable;
- testable;
- cohérente;
- documentée.

Une fonctionnalité incomplète doit utiliser :

- une branche;
- un feature flag;
- une isolation claire.

---

# Revue avant fin de tâche

Avant de considérer une tâche terminée, vérifier :

```text
[ ] Le code compile
[ ] Les tests passent
[ ] Le lint passe
[ ] Les types passent
[ ] La fonctionnalité respecte la documentation
[ ] La documentation est encore exacte
[ ] tasks.md est à jour
[ ] plans.md est à jour
[ ] file-index.md est à jour
[ ] memory.md est à jour
[ ] Aucun secret n’a été ajouté
[ ] Aucun accès direct interdit à Supabase
[ ] La logique métier reste hors des composants React
```

---

# Fin de session obligatoire

À la fin d’une session importante, le développeur doit produire un résumé contenant :

- travail effectué;
- fichiers créés;
- fichiers modifiés;
- tests ajoutés;
- tests exécutés;
- problèmes connus;
- décisions prises;
- tâches restantes;
- documentation modifiée.

Ce résumé doit être reporté dans les fichiers de mémoire appropriés.

---

# Procédure de reprise

Au début d’une nouvelle session :

```text
1. Lire memory.md
2. Lire tasks.md
3. Lire plans.md
4. Lire file-index.md
5. Lire les documents concernés
6. Vérifier le statut Git
7. Inspecter les derniers changements
8. Continuer le plan actif
```

Le développeur ne doit pas recommencer l’analyse de zéro lorsque la mémoire contient déjà les décisions nécessaires.

---

# Procédure en cas d’incertitude

Lorsqu’une direction n’est pas claire :

1. vérifier la documentation;
2. vérifier `memory.md`;
3. vérifier RECA App;
4. inspecter le code existant;
5. identifier les options;
6. demander une décision.

Ne jamais cacher une incertitude sous une implémentation arbitraire.

---

# Procédure de modification d’architecture

Avant un changement d’architecture :

```text
1. Identifier la raison
2. Documenter le problème
3. Proposer les options
4. Évaluer les impacts
5. Obtenir la validation
6. Mettre à jour plans.md
7. Mettre à jour les documents
8. Mettre à jour memory.md
9. Implémenter
10. Tester
11. Mettre à jour file-index.md
```

---

# Définition de terminé

Une fonctionnalité est terminée lorsque :

- elle respecte les critères;
- elle est testée;
- elle fonctionne hors ligne lorsque requis;
- elle ne brise pas les invariants;
- elle est intégrée au système de mémoire;
- la documentation est exacte;
- les fichiers sont indexés;
- les erreurs importantes sont gérées;
- les limitations sont déclarées;
- le code est compréhensible.

---

# Interdictions

Il est interdit de :

- modifier une direction importante sans mettre à jour la documentation;
- ignorer les fichiers de mémoire;
- recréer une architecture déjà documentée;
- créer une seconde source de vérité;
- accéder directement à Supabase depuis React;
- placer les transitions métier dans les composants;
- masquer une erreur avec une valeur fictive;
- supprimer une opération non synchronisée;
- utiliser un faux logo;
- écrire RECA Operator dans l’interface;
- ajouter une dépendance centrale sans justification;
- laisser des fichiers importants non indexés;
- marquer une tâche terminée sans tests;
- terminer une session avec une documentation connue comme fausse.

---

# Règles obligatoires pour Claude Code

Claude Code doit toujours :

1. consulter la documentation avant de coder;
2. consulter `tasks.md`;
3. consulter `plans.md`;
4. consulter `file-index.md`;
5. consulter `memory.md`;
6. consulter RECA App lorsque l’intégration l’exige;
7. créer un plan avant une modification importante;
8. respecter les responsabilités des moteurs;
9. mettre à jour les tests;
10. mettre à jour la documentation lorsque la direction change;
11. mettre à jour le système de mémoire;
12. expliquer les limitations et les risques;
13. ne jamais inventer silencieusement une règle métier.

---

# Flux officiel de développement

```text
Demande
      ↓
Consultation de la mémoire
      ↓
Consultation de la documentation
      ↓
Consultation de RECA App si nécessaire
      ↓
Inspection du code
      ↓
Création du plan
      ↓
Validation de l’approche
      ↓
Implémentation
      ↓
Tests
      ↓
Comparaison avec la documentation
      ↓
Mise à jour de la documentation
      ↓
Mise à jour de tasks.md
      ↓
Mise à jour de plans.md
      ↓
Mise à jour de file-index.md
      ↓
Mise à jour de memory.md
      ↓
Résumé final
```

---

# Règles importantes

La documentation est toujours consultée.

La documentation est mise à jour lorsque la direction change.

RECA App est accessible comme référence d’intégration.

Le système de mémoire est obligatoire.

Les fichiers de mémoire sont persistants.

Le code et la documentation doivent correspondre.

La logique métier ne réside pas dans React.

La State Machine demeure l’autorité métier.

Toutes les actions terrain sont local-first.

Les tests protègent les règles officielles.

Une tâche non documentée n’est pas complètement terminée.

---

# Objectif final

Les standards de développement doivent permettre à plusieurs développeurs ou agents d’intelligence artificielle de travailler sur RECA Operator sans perdre la vision du projet.

Chaque session doit pouvoir reprendre avec une compréhension claire de :

- l’état du projet;
- l’architecture;
- les décisions;
- les tâches;
- les fichiers;
- les risques;
- les prochaines étapes.

Le projet ne doit jamais dépendre de la mémoire temporaire d’une conversation.

La mémoire doit être écrite.

La documentation doit rester vraie.

Le code doit respecter les décisions officielles.