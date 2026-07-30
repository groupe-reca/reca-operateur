# 11-Roadmap.md

# RECA Operator
## Roadmap de développement

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Ce document définit l’ordre officiel de développement de RECA Operator.

La roadmap doit permettre de construire l’application progressivement sans :

- mélanger les responsabilités;
- intégrer trop tôt les moteurs complexes;
- dépendre prématurément du réseau;
- créer une interface difficile à corriger;
- compromettre le fonctionnement hors ligne;
- perdre les décisions de conception;
- reproduire les erreurs de l’ancien prototype.

L’objectif n’est pas de produire toutes les fonctionnalités le plus rapidement possible.

L’objectif est de construire une base fiable qui permettra ensuite d’avancer rapidement sans refaire l’architecture.

---

# Philosophie

RECA Operator sera développé en couches.

```text
Documentation
      ↓
Fondations
      ↓
Interface statique
      ↓
Carte
      ↓
Données locales
      ↓
State Machine
      ↓
GPS Engine
      ↓
Synchronisation
      ↓
Mode hors ligne
      ↓
Voice Engine
      ↓
Intégration complète
      ↓
Tests terrain
      ↓
Production
```

Chaque couche doit être validée avant de construire la suivante.

---

# Principe fondamental

Le projet ne doit pas commencer par connecter directement :

- Supabase;
- Mapbox;
- GPS;
- synchronisation;
- logique métier;
- interface complète.

Il doit commencer par une reproduction visuelle fidèle avec des données simulées.

Ensuite, les moteurs sont intégrés un à la fois.

---

# Sources officielles

Le développement doit toujours respecter :

```text
/docs
tasks.md
plans.md
file-index.md
memory.md
reca-app
maquettes validées
assets officiels
```

La documentation doit être consultée avant chaque phase.

Si une décision change, les documents concernés doivent être mis à jour avant ou pendant l’implémentation.

---

# Dépendance avec RECA App

RECA Operator possède accès au projet :

```text
reca-app
```

RECA App doit être consultée afin de comprendre :

- les missions;
- les MissionItems;
- les routes;
- les contrats;
- les opérateurs;
- les équipements;
- les rôles;
- les règles d’authentification;
- les tables Supabase;
- les types existants;
- les conventions API;
- les données partagées.

RECA Operator demeure toutefois une application indépendante.

La roadmap doit éviter de créer une dépendance directe à l’interface interne de RECA App.

---

# Système de mémoire

Dès le premier sprint, créer et maintenir :

```text
tasks.md
plans.md
file-index.md
memory.md
```

Ces fichiers sont obligatoires pendant toute la roadmap.

Chaque sprint doit terminer par leur mise à jour.

---

# Phases principales

La roadmap est divisée en douze phases.

```text
Phase 00 — Initialisation
Phase 01 — Fondations visuelles
Phase 02 — Écran maître EN COURS
Phase 03 — Variantes opérationnelles
Phase 04 — Map Engine
Phase 05 — Données locales et MissionContext
Phase 06 — State Machine
Phase 07 — GPS Engine
Phase 08 — Synchronization Engine
Phase 09 — Offline Mode
Phase 10 — Voice Engine
Phase 11 — Intégration, tests et production
```

Chaque phase peut être divisée en plusieurs sprints.

---

# Phase 00 — Initialisation du projet

## Objectif

Créer le nouveau dépôt officiel et établir les règles de travail avant l’implémentation.

Nom du dépôt :

```text
reca-operateur
```

L’ancien dépôt ne doit pas être utilisé comme fondation automatique.

Il peut être consulté uniquement pour comprendre certaines idées ou récupérer des éléments explicitement validés.

---

## Travaux

- créer le dépôt;
- initialiser React Native;
- configurer TypeScript strict;
- configurer lint et formatage;
- configurer tests;
- créer le dossier `/docs`;
- ajouter toute la documentation officielle;
- ajouter les assets officiels;
- créer les fichiers de mémoire;
- créer la structure initiale des dossiers;
- documenter les dépendances;
- vérifier l’accès à `reca-app`;
- créer le premier plan d’implémentation;
- préparer les environnements de développement.

---

## Structure initiale

```text
reca-operateur/
├── docs/
├── src/
│   ├── app/
│   ├── components/
│   ├── screens/
│   ├── domain/
│   ├── engines/
│   ├── context/
│   ├── persistence/
│   ├── integrations/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── config/
├── assets/
├── tests/
├── scripts/
├── tasks.md
├── plans.md
├── file-index.md
├── memory.md
└── README.md
```

---

## Critères de réussite

- le projet compile;
- les tests peuvent être exécutés;
- TypeScript strict est actif;
- la documentation est présente;
- le système de mémoire existe;
- le logo officiel est ajouté;
- le projet peut être lancé sur iOS ou Android;
- aucun moteur métier n’est encore implanté prématurément.

---

# Phase 01 — Fondations visuelles

## Objectif

Transformer le design Fable validé en système de composants réutilisables.

Cette phase ne contient :

- aucun GPS réel;
- aucune synchronisation réelle;
- aucune logique métier complète;
- aucune connexion directe à Supabase.

---

## Travaux

- intégrer les design tokens;
- créer le thème sombre;
- ajouter les couleurs officielles;
- ajouter la typographie;
- intégrer le vrai logo;
- créer les composants glassmorphism;
- créer les boutons;
- créer les indicateurs;
- créer les cartes;
- créer les marqueurs;
- créer les composants d’alertes;
- créer le chronomètre;
- créer le bottom sheet;
- ajouter les safe areas;
- ajouter les états pressé et désactivé;
- préparer les tailles adaptées aux gants.

---

## Composants prioritaires

```text
AppHeader
OfficialLogo
MissionCard
MissionCardCompact
PhaseTimer
AlertCard
SystemStatus
FloatingActionButton
ProblemButton
VoiceButton
BottomSheet
CurrentResidenceSheet
UpcomingResidenceRow
OfflineIndicator
SyncIndicator
```

---

## Données

Utiliser uniquement des données simulées.

Exemple :

```ts
const mockMission = {
  id: '24-01-15',
  sector: 'Saint-Jérôme',
  completedItems: 3,
  totalItems: 28,
  progress: 10,
}
```

---

## Critères de réussite

- les composants correspondent au design validé;
- les couleurs sont centralisées;
- aucun faux logo n’est utilisé;
- les tailles tactiles sont suffisantes;
- les composants fonctionnent sur plusieurs dimensions d’écran;
- les composants ne contiennent aucune logique métier importante.

---

# Phase 02 — Écran maître EN COURS

## Objectif

Reproduire fidèlement l’écran maître validé dans Fable.

L’écran doit être construit avec une carte simulée ou une image temporaire.

Mapbox ne doit pas encore être intégré si cela ralentit la reproduction visuelle.

---

## Travaux

- construire la structure complète;
- ajouter le panneau supérieur;
- ajouter la progression;
- afficher la résidence active;
- ajouter le chronomètre EN COURS;
- afficher la prochaine résidence;
- afficher les quatre résidences futures;
- ajouter l’alerte principale;
- ajouter les alertes secondaires;
- ajouter les boutons flottants;
- ajouter le tracteur;
- ajouter le bottom sheet;
- ajouter les indicateurs GPS et synchronisation simulés.

---

## Données d’exemple

```text
Mission : 24-01-15
Secteur : Saint-Jérôme
Progression : 3 / 28
Résidence active : 224 rue Scott
État : EN COURS
Chronomètre : 05:42
GPS : 4 m
Synchronisation : Synchronisé
```

---

## Comparaison visuelle

Après l’implémentation :

1. exécuter l’application;
2. prendre une capture;
3. comparer avec la maquette;
4. corriger les proportions;
5. corriger les espacements;
6. corriger les opacités;
7. corriger les rayons;
8. corriger la hiérarchie visuelle.

Cette boucle doit être répétée jusqu’à obtenir un résultat fidèle.

---

## Critères de réussite

- la carte reste la surface dominante;
- le chronomètre EN COURS est immédiatement visible;
- l’adresse active est immédiatement visible;
- le résultat ne ressemble pas à un CRM;
- l’écran fonctionne sur plusieurs appareils;
- les panneaux ne masquent pas excessivement la carte;
- aucune logique réelle n’est encore nécessaire.

---

# Phase 03 — Variantes opérationnelles

## Objectif

Décliner l’écran maître sans redessiner l’application.

États à créer :

```text
MISSION ACTIVE
EN ROUTE
EN APPROCHE
EN COURS
PROBLÈME
FIN DE MISSION
MODE HORS LIGNE
```

---

## Règle

Tous les états utilisent la même structure de composants.

Les différences concernent uniquement :

- couleur fonctionnelle;
- texte;
- chronomètre;
- priorité de l’information;
- alertes;
- boutons disponibles;
- zoom suggéré;
- comportement du bottom sheet.

---

## État EN ROUTE

Afficher :

- prochaine adresse;
- distance;
- ETA;
- temps de déplacement;
- route suggérée;
- progression;
- alertes importantes à venir.

Couleur fonctionnelle :

```text
Bleu
```

---

## État EN APPROCHE

Afficher :

- adresse;
- distance courte;
- instructions prioritaires;
- côté de la rue si fiable;
- état EN APPROCHE;
- chronomètre ou compte de proximité.

Couleur fonctionnelle :

```text
Ambre ou orange
```

---

## État EN COURS

Afficher :

- adresse active;
- chronomètre d’intervention;
- alertes;
- bouton Problème;
- prochaine résidence.

Couleur fonctionnelle :

```text
Vert
```

---

## État PROBLÈME

Afficher :

- type de problème;
- résidence;
- notes;
- actions possibles;
- passage à la suivante;
- reprise future.

Couleur fonctionnelle :

```text
Rouge
```

---

## Mode hors ligne

Afficher :

- indicateur ambre;
- nombre d’opérations en attente;
- confirmation que les données sont enregistrées;
- aucune interruption de mission.

---

## Critères de réussite

- aucune nouvelle architecture visuelle n’est inventée;
- les composants sont partagés;
- les transitions visuelles sont cohérentes;
- les boutons conservent leur position;
- les états sont immédiatement reconnaissables;
- le rouge de marque ne remplace pas les couleurs fonctionnelles.

---

# Phase 04 — Map Engine

## Objectif

Remplacer la carte simulée par Mapbox.

---

## Travaux

- installer et configurer Mapbox;
- créer le style sombre officiel;
- créer la caméra inclinée;
- positionner le tracteur fixe;
- afficher la position GPS simulée;
- afficher les cinq résidences;
- afficher le tracé suggéré;
- créer les marqueurs;
- créer les couches;
- créer le recentrage;
- créer les animations de zoom;
- créer la rotation stabilisée simulée;
- préparer le mode développement.

---

## Première intégration

Commencer avec des coordonnées simulées.

Ne pas connecter immédiatement le GPS réel.

Exemple :

```text
Position simulée
      ↓
Caméra
      ↓
Route
      ↓
Marqueurs
      ↓
Tracteur fixe
```

---

## Style Mapbox

Le style doit respecter :

- fond bleu nuit;
- rues discrètes;
- bâtiments légers;
- contraste suffisant;
- route visible;
- aucune surcharge;
- perspective professionnelle.

---

## Tracteur

Pour la première version :

- utiliser un asset transparent;
- le placer au-dessus de Mapbox;
- le garder fixe à l’écran;
- faire tourner la carte sous le tracteur.

Un modèle 3D complet n’est pas requis pour la V1.

---

## Route suggérée

La route doit :

- suivre les rues;
- relier les cinq prochaines résidences;
- être recalculée uniquement lors d’un événement pertinent;
- ne pas se recalculer à chaque position.

---

## Critères de réussite

- la carte est fluide;
- le tracteur reste fixe;
- la caméra est stable;
- les marqueurs restent lisibles;
- la route suit les rues;
- les composants React ne sont pas recréés à chaque position;
- l’apparence demeure fidèle à Fable.

---

# Phase 05 — Données locales et MissionContext

## Objectif

Créer la couche locale qui alimentera l’application sans dépendre directement du serveur.

---

## Travaux

- choisir le stockage local;
- créer les schémas locaux;
- créer les migrations;
- créer MissionContext;
- créer les repositories;
- créer les données simulées persistantes;
- créer la récupération après redémarrage;
- créer les transactions locales;
- créer les abstractions d’horloge;
- créer les identifiants locaux.

---

## Entités prioritaires

```text
Mission
MissionItem
MissionEvent
StateTransition
SyncOperation
OperatorSession
Problem
MissionAlert
```

---

## MissionContext

Le MissionContext doit exposer uniquement les données utiles à l’interface.

Il ne doit pas devenir une copie complète de la base.

Exemple :

```ts
type MissionContext = {
  mission: Mission
  activeMissionItem?: MissionItem
  nextMissionItems: MissionItem[]
  phaseElapsedSeconds: number
  gpsState: GpsState
  synchronizationState: SynchronizationState
  offlineState: OfflineState
  alerts: MissionAlert[]
}
```

---

## Critères de réussite

- les données survivent à un redémarrage;
- l’écran fonctionne sans réseau;
- les composants ne lisent pas directement la base locale;
- les transactions sont atomiques;
- les données simulées peuvent être remplacées progressivement.

---

# Phase 06 — State Machine

## Objectif

Implémenter l’autorité métier centrale.

---

## Travaux

- définir les états;
- définir les commandes;
- définir les événements;
- définir les transitions;
- créer les invariants;
- créer les verrous;
- créer la déduplication;
- créer les transitions atomiques;
- créer le cas des résidences adjacentes;
- créer les transitions manuelles;
- créer la pause;
- créer la reprise;
- créer les problèmes;
- créer la récupération après redémarrage.

---

## Transitions prioritaires

```text
WAITING → EN_ROUTE
EN_ROUTE → APPROACHING
APPROACHING → IN_PROGRESS
IN_PROGRESS → COMPLETED
```

Puis :

```text
IN_PROGRESS → PROBLEM
PROBLEM → EN_ROUTE
WAITING → SKIPPED
SKIPPED → EN_ROUTE
```

---

## Tests obligatoires

Chaque transition doit posséder :

- test de succès;
- test de refus;
- test de doublon;
- test de récupération;
- test hors ligne;
- test de journalisation.

---

## Résidences adjacentes

Ce scénario doit être implanté et testé avant le GPS réel.

```text
A = IN_PROGRESS
B = WAITING
      ↓
NextResidenceRadiusEntered
      ↓
A = COMPLETED
B = IN_PROGRESS
Travel time B = 5 secondes
```

---

## Critères de réussite

- une seule résidence peut être active;
- toutes les transitions passent par la State Machine;
- les transitions invalides sont refusées;
- les écritures sont atomiques;
- les événements sont journalisés;
- les tests couvrent les invariants.

---

# Phase 07 — GPS Engine

## Objectif

Connecter la position réelle à la State Machine.

---

## Travaux

- demander les permissions;
- configurer le GPS;
- créer le filtre de précision;
- créer le calcul de distance;
- créer les seuils;
- créer les délais de validation;
- créer la stabilisation du cap;
- créer la détection de perte GPS;
- créer la détection de retour GPS;
- publier les événements;
- tester en simulation;
- tester sur appareil réel.

---

## Seuils initiaux

```text
Approche : 250 m
Début intervention : 30 m
Fin intervention : 50 m
Validation entrée : 5 s
Validation sortie : 5 s
Validation cap : environ 3 s
```

Toutes les valeurs doivent être configurables.

---

## Simulation obligatoire

Avant les essais terrain, créer un simulateur permettant :

- injecter des positions;
- déplacer le véhicule;
- entrer dans les rayons;
- sortir des rayons;
- simuler une précision faible;
- simuler une résidence adjacente;
- simuler une perte GPS.

---

## Critères de réussite

- le GPS ne modifie jamais directement les états;
- les événements sont stables;
- les faux positifs sont limités;
- la perte GPS ne termine aucune résidence;
- les changements de cap ne font pas osciller la carte;
- les tests utilisent la même logique que la production.

---

# Phase 08 — Synchronization Engine

## Objectif

Connecter les données locales à RECA App sans rendre la mission dépendante du réseau.

---

## Travaux

- étudier les structures dans `reca-app`;
- définir les contrats de synchronisation;
- créer la file persistante;
- créer les opérations;
- créer les identifiants d’idempotence;
- créer l’ordre de séquence;
- créer les lots;
- créer les réessais;
- créer les erreurs temporaires;
- créer les erreurs bloquantes;
- créer les conflits;
- créer l’indicateur de synchronisation;
- tester les doublons;
- tester les reprises.

---

## Première intégration serveur

Commencer avec :

```text
Mission
MissionItem
StateTransition
Problem
Note
```

Les médias peuvent être ajoutés plus tard.

---

## Règle

L’intégration serveur ne doit jamais remplacer le stockage local comme source immédiate pendant la mission.

---

## Critères de réussite

- les opérations survivent à un redémarrage;
- les doublons sont évités;
- l’ordre est conservé;
- le réseau absent ne bloque rien;
- une réponse perdue ne crée pas de duplication;
- RECA App reçoit correctement les transitions.

---

# Phase 09 — Offline Mode

## Objectif

Valider officiellement qu’une mission complète peut être exécutée sans réseau.

---

## Travaux

- créer la détection de connectivité;
- créer les états Offline;
- créer l’état de préparation d’une mission;
- créer la restauration locale;
- créer les cartes hors ligne lorsque possible;
- créer les messages;
- créer les indicateurs;
- créer la reprise automatique;
- créer les politiques de stockage;
- créer la gestion de session hors ligne;
- créer la fin locale de mission.

---

## Mission prête hors ligne

Une mission doit être considérée prête uniquement si elle possède :

- Mission;
- MissionItems;
- coordonnées;
- ordre;
- alertes;
- paramètres;
- stockage fonctionnel.

---

## Scénario obligatoire

```text
Télécharger une mission
      ↓
Couper Internet
      ↓
Redémarrer l’application
      ↓
Démarrer la mission
      ↓
Effectuer toutes les résidences
      ↓
Terminer la mission
      ↓
Redémarrer le téléphone
      ↓
Rétablir Internet
      ↓
Synchroniser
```

Ce scénario doit réussir avant la production.

---

## Critères de réussite

- aucune donnée n’est perdue;
- l’application ne bloque pas;
- les chronomètres survivent;
- les états sont restaurés;
- la mission se synchronise au retour;
- les erreurs de stockage sont distinctes des erreurs réseau.

---

# Phase 10 — Voice Engine

## Objectif

Ajouter les annonces vocales après que les états métier sont fiables.

---

## Travaux

- intégrer la synthèse vocale locale;
- créer la file d’annonces;
- créer les priorités;
- créer l’anti-répétition;
- créer les expirations;
- créer les regroupements;
- créer la répétition manuelle;
- créer les annonces GPS;
- créer les annonces d’alertes;
- créer les annonces hors ligne;
- tester les appels téléphoniques;
- tester l’arrière-plan.

---

## Annonces prioritaires

```text
Prochaine résidence
Résidence en approche
Intervention démarrée
Alerte importante
Résidence terminée
Problème enregistré
GPS perdu
Mode hors ligne
Mission terminée
```

---

## Critères de réussite

- les annonces sont courtes;
- les annonces ne se répètent pas;
- les alertes critiques interrompent les annonces normales;
- la voix fonctionne hors ligne;
- une erreur vocale ne bloque jamais la mission;
- le bouton Voix conserve la même fonction.

---

# Phase 11 — Intégration complète

## Objectif

Relier tous les modules et remplacer les données simulées.

---

## Flux final

```text
Authentification
      ↓
Mission téléchargée
      ↓
Stockage local
      ↓
MissionContext
      ↓
State Machine
      ↓
GPS Engine
      ↓
Map Engine
      ↓
Voice Engine
      ↓
Synchronization Engine
      ↓
RECA App
```

---

## Travaux

- connecter l’authentification;
- charger la mission assignée;
- restaurer la mission locale;
- brancher les composants au MissionContext;
- connecter les événements;
- connecter la carte;
- connecter la voix;
- connecter la synchronisation;
- gérer l’absence de mission;
- gérer la fin de mission;
- gérer la déconnexion;
- gérer les erreurs;
- vérifier la sécurité;
- vérifier les performances.

---

# Écrans finaux

Les écrans ou états suivants doivent être terminés :

```text
1. Aucune mission
2. Écran de connexion
3. Mission active
4. En route
5. En approche
6. En cours
7. Problème
8. Fin de mission
9. Paramètres
10. Développement
11. Mode hors ligne
```

---

# Écran Aucune mission

Doit afficher :

- logo officiel;
- utilisateur;
- état réseau;
- message clair;
- actualisation;
- déconnexion.

Il ne doit pas ressembler à un tableau de bord administratif.

---

# Écran de connexion

Doit afficher :

- vrai logo;
- nom RÉCA OPÉRATEUR;
- formulaire simple;
- état de connexion;
- gestion des erreurs;
- première connexion nécessitant Internet.

---

# Mission active

Doit permettre :

- consulter la mission;
- démarrer;
- vérifier la préparation hors ligne;
- voir le nombre de résidences;
- voir les alertes importantes;
- voir l’équipement.

---

# Fin de mission

Doit afficher :

- résumé;
- résidences terminées;
- problèmes;
- durées;
- état de synchronisation;
- confirmation locale;
- opérations en attente.

---

# Paramètres

Doit contenir uniquement les options utiles :

- voix;
- volume;
- carte;
- thème;
- préférences d’affichage;
- confidentialité;
- compte;
- version.

---

# Développement

Doit permettre :

- simuler le GPS;
- simuler le réseau;
- voir les états;
- voir la file;
- voir les événements;
- voir les seuils;
- exporter les journaux;
- tester les transitions.

Cet écran ne doit pas être accessible aux utilisateurs ordinaires.

---

# Phase 12 — Tests terrain

## Objectif

Valider le système dans les conditions réelles.

---

## Étapes

### Tests à pied

- suivre un petit parcours;
- entrer dans les rayons;
- vérifier les transitions;
- vérifier la rotation;
- vérifier les alertes;
- vérifier la voix.

### Tests en véhicule

- installer le téléphone;
- tester les vibrations;
- tester les boutons;
- tester la lisibilité;
- tester l’arrière-plan;
- tester les changements rapides.

### Tests de routes résidentielles

- rues normales;
- maisons rapprochées;
- coins de rue;
- entrées communes;
- cul-de-sac;
- immeubles;
- GPS imprécis.

### Tests de tempête

- faible visibilité;
- neige;
- nuit;
- réseau instable;
- appareil branché;
- mission longue.

---

## Données à observer

- précision GPS;
- faux débuts;
- fausses fins;
- temps de réaction;
- stabilité du cap;
- consommation de batterie;
- fluidité de carte;
- durée de synchronisation;
- taux d’erreurs;
- actions manuelles;
- annonces inutiles.

---

# Phase 13 — Stabilisation

## Objectif

Corriger les problèmes découverts avant le lancement.

---

## Travaux

- corriger les erreurs terrain;
- ajuster les seuils;
- ajuster les délais;
- réduire la consommation;
- optimiser Mapbox;
- améliorer les journaux;
- corriger les migrations;
- renforcer les tests;
- vérifier les conflits;
- vérifier les reprises;
- vérifier les appareils Android;
- vérifier les appareils iOS.

---

# Phase 14 — Préproduction

## Objectif

Préparer une version utilisée par un petit groupe réel.

---

## Travaux

- créer un environnement de préproduction;
- configurer les comptes de test;
- configurer les organisations;
- préparer les politiques de données;
- préparer les builds;
- préparer la distribution;
- activer les rapports d’erreurs;
- définir les métriques;
- documenter le support;
- créer la procédure de récupération.

---

# Version pilote

La version pilote doit être limitée à :

- quelques opérateurs;
- quelques routes;
- une organisation;
- une période contrôlée.

L’objectif est de valider :

- fiabilité;
- simplicité;
- compréhension;
- taux d’actions manuelles;
- qualité des données;
- synchronisation;
- autonomie.

---

# Phase 15 — Production

## Conditions minimales

La production ne doit pas commencer tant que :

- une mission complète hors ligne n’a pas été réussie;
- les résidences adjacentes ont été testées;
- la reprise après redémarrage fonctionne;
- la synchronisation évite les doublons;
- les données sont visibles dans RECA App;
- les erreurs critiques sont gérées;
- les journaux peuvent être exportés;
- les maquettes sont fidèlement reproduites;
- les tests principaux passent;
- les permissions sont sécurisées.

---

# Version 1.0

La version 1.0 doit se concentrer sur :

- connexion;
- mission assignée;
- carte;
- cinq prochaines résidences;
- GPS;
- états automatiques;
- chronomètres;
- problèmes;
- fonctionnement hors ligne;
- synchronisation;
- voix essentielle;
- fin de mission;
- mode développement.

---

# Fonctions exclues de la V1

À moins d’une décision différente, les fonctions suivantes ne doivent pas retarder la V1 :

- navigation vocale complète;
- modèle 3D avancé du tracteur;
- intelligence artificielle prédictive;
- optimisation automatique complète des routes;
- vidéo;
- suivi GPS haute fréquence permanent;
- discussion intégrée;
- analyses avancées;
- gestion administrative complète;
- édition de contrats;
- édition de routes;
- gestion de la paie;
- fonctions CRM.

Ces fonctions appartiennent principalement à RECA App ou aux versions futures.

---

# Roadmap après la V1

## Version 1.1

- amélioration des cartes hors ligne;
- meilleure gestion des médias;
- amélioration des diagnostics;
- ajustements des seuils;
- optimisation batterie;
- meilleur support tablette.

## Version 1.2

- téléchargement automatique des zones cartographiques;
- meilleure détection des côtés de rue;
- statistiques opérateur;
- amélioration des alertes;
- historique local.

## Version 2.0

- optimisation intelligente des routes;
- estimation prédictive des durées;
- détection d’anomalies;
- recommandations basées sur l’historique;
- meilleure gestion multi-équipement;
- supervision en temps réel.

## Version future

- intégration de capteurs de véhicule;
- télémétrie;
- caméra;
- données d’équipement;
- maintenance prédictive;
- navigation spécialisée déneigement;
- intelligence artificielle opérationnelle.

---

# Ordre recommandé des sprints

```text
Sprint 001 — Initialisation
Sprint 002 — Design tokens et composants
Sprint 003 — Écran EN COURS statique
Sprint 004 — Variantes opérationnelles
Sprint 005 — Mapbox et carte simulée
Sprint 006 — Marqueurs, route et caméra
Sprint 007 — Stockage local
Sprint 008 — MissionContext
Sprint 009 — State Machine de base
Sprint 010 — Cas problèmes et résidences adjacentes
Sprint 011 — GPS Engine simulé
Sprint 012 — GPS réel
Sprint 013 — Synchronization Queue
Sprint 014 — Intégration RECA App
Sprint 015 — Offline Mode
Sprint 016 — Voice Engine
Sprint 017 — Authentification et mission assignée
Sprint 018 — Fin de mission
Sprint 019 — Mode développement
Sprint 020 — Tests terrain
Sprint 021 — Stabilisation
Sprint 022 — Pilote
```

Cet ordre peut être ajusté.

Toute modification importante doit être documentée dans :

```text
plans.md
memory.md
tasks.md
11-Roadmap.md
```

---

# Règles de sprint

Chaque sprint doit posséder :

- un objectif unique;
- un périmètre limité;
- des critères de réussite;
- des fichiers identifiés;
- des tests;
- une mise à jour documentaire;
- un résumé final.

---

# Contenu d’un sprint

Structure recommandée :

```markdown
# Sprint XXX

## Objectif

## Contexte

## Documentation à lire

## Fichiers concernés

## Travaux

## Tests

## Critères de réussite

## Hors périmètre

## Documentation à mettre à jour
```

---

# Définition de terminé d’un sprint

Un sprint est terminé lorsque :

```text
[ ] Le code compile
[ ] Les types passent
[ ] Le lint passe
[ ] Les tests passent
[ ] Les critères sont validés
[ ] La documentation est exacte
[ ] tasks.md est à jour
[ ] plans.md est à jour
[ ] file-index.md est à jour
[ ] memory.md est à jour
[ ] Les limites sont documentées
[ ] Aucun secret n’est commité
```

---

# Dépendances entre phases

```text
Fondations visuelles
      ↓
Écran maître
      ↓
Variantes
      ↓
Map Engine
      ↓
Données locales
      ↓
State Machine
      ↓
GPS Engine
      ↓
Synchronisation
      ↓
Offline Mode
      ↓
Voice Engine
      ↓
Intégration
```

Une phase peut être préparée en parallèle.

Elle ne doit pas être intégrée avant que ses dépendances essentielles soient stables.

---

# Risques principaux

## Risque visuel

Claude Code produit une interface générique.

Réponse :

- utiliser Fable comme référence;
- intégrer les tokens;
- comparer par capture;
- corriger par composant.

## Risque Mapbox

La carte devient instable ou trop lourde.

Réponse :

- limiter les couches;
- isoler les mises à jour;
- éviter les rendus React;
- tester sur appareils réels.

## Risque GPS

Les transitions automatiques sont imprécises.

Réponse :

- utiliser des délais;
- filtrer la précision;
- créer un simulateur;
- prévoir les actions manuelles;
- journaliser.

## Risque hors ligne

Une action est affichée, mais non sauvegardée.

Réponse :

- transaction locale obligatoire;
- écriture avant confirmation;
- tests de redémarrage.

## Risque synchronisation

Des doublons ou conflits apparaissent.

Réponse :

- idempotence;
- séquences;
- file persistante;
- règles de conflit;
- tests de réponse perdue.

## Risque de dérive

Le projet s’éloigne de la documentation.

Réponse :

- mémoire obligatoire;
- lecture des docs;
- mise à jour après changement;
- revue de fin de sprint.

---

# Indicateurs de qualité

Le projet doit suivre au minimum :

- taux de transitions automatiques réussies;
- taux de transitions manuelles;
- faux positifs GPS;
- opérations non synchronisées;
- erreurs de synchronisation;
- reprises après redémarrage;
- consommation batterie;
- mémoire utilisée;
- FPS de la carte;
- plantages;
- durée moyenne d’une mission;
- problèmes par résidence.

---

# Critères de succès de la V1

RECA Operator V1 est considérée réussie si :

- l’application reproduit la direction visuelle validée;
- l’opérateur comprend immédiatement l’état courant;
- une mission peut être exécutée sans réseau;
- les transitions sont fiables;
- les résidences adjacentes sont correctement gérées;
- aucune action n’est perdue;
- les données arrivent dans RECA App;
- la carte demeure stable;
- la voix reste utile et discrète;
- la reprise après redémarrage fonctionne;
- l’interface peut être utilisée avec des gants;
- le système est suffisamment documenté pour poursuivre son évolution.

---

# Règles importantes

Ne pas connecter tous les moteurs en même temps.

Ne pas intégrer Supabase directement dans les composants.

Ne pas commencer par le GPS réel.

Ne pas commencer par le mode hors ligne complet.

Valider d’abord l’interface.

Valider ensuite la logique avec des simulations.

Connecter le matériel et le réseau seulement après.

Maintenir la documentation et la mémoire à chaque sprint.

Consulter RECA App avant toute décision de données partagées.

Ne jamais considérer une fonctionnalité terminée sans tests.

---

# Flux officiel de livraison

```text
Documentation
      ↓
Plan
      ↓
Maquette
      ↓
Composants
      ↓
Implémentation statique
      ↓
Tests visuels
      ↓
Moteurs simulés
      ↓
Moteurs réels
      ↓
Stockage local
      ↓
Synchronisation
      ↓
Tests hors ligne
      ↓
Tests terrain
      ↓
Pilote
      ↓
Production
```

---

# Objectif final

Cette roadmap doit permettre de transformer la vision de RECA Operator en un produit fiable sans sacrifier :

- le design;
- la stabilité;
- la sécurité;
- le fonctionnement hors ligne;
- la qualité des données;
- la maintenabilité.

Le projet doit avancer par étapes mesurables.

Chaque phase doit réduire le risque de la suivante.

L’interface doit être validée avant les moteurs.

Les moteurs doivent être validés avant le terrain.

Le terrain doit être validé avant la production.

RECA Operator ne doit pas seulement être beau.

Il doit rester fiable pendant toute une tempête.