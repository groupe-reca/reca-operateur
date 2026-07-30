# 09-State-Machine.md

# RECA Operator
## State Machine

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

La State Machine est responsable du cycle de vie des missions et des résidences dans RECA Operator.

Elle reçoit des événements provenant des autres moteurs.

Elle détermine si une transition est autorisée.

Elle applique les changements d’état.

Elle déclenche les conséquences nécessaires.

Elle garantit que le comportement de l’application demeure :

- déterministe;
- prévisible;
- testable;
- traçable;
- indépendant de l’interface.

La State Machine constitue l’autorité métier centrale de RECA Operator.

---

# Philosophie

Le GPS détecte.

La State Machine décide.

Le stockage local conserve.

La synchronisation transmet.

L’interface affiche.

La voix informe.

Aucun autre module ne doit modifier directement l’état métier d’une mission ou d’un MissionItem.

---

# Principe fondamental

Toute transition métier doit passer par la State Machine.

Exemple :

```text
GPS détecte une entrée dans le rayon de 30 mètres
      ↓
GPS Engine publie un événement
      ↓
State Machine vérifie l’état courant
      ↓
State Machine vérifie les conditions
      ↓
Transition autorisée ou refusée
      ↓
Écriture locale
      ↓
Mise à jour du MissionContext
      ↓
Événements secondaires
```

Le GPS Engine ne doit jamais modifier directement le statut d’un MissionItem.

---

# Responsabilités

La State Machine est responsable de :

- valider les transitions;
- empêcher les transitions invalides;
- appliquer les changements d’état;
- gérer le MissionItem actif;
- activer le MissionItem suivant;
- calculer les conséquences temporelles;
- déclencher les événements de synchronisation;
- déclencher les annonces vocales;
- journaliser les transitions;
- gérer les cas spéciaux;
- protéger l’intégrité des données;
- permettre les actions manuelles autorisées;
- maintenir la cohérence entre la Mission et ses MissionItems.

La State Machine n’est pas responsable de :

- lire directement le GPS;
- calculer une distance;
- dessiner la carte;
- jouer un son;
- écrire directement dans Supabase;
- déterminer la disponibilité du réseau;
- afficher une confirmation;
- calculer un itinéraire Mapbox.

---

# Sources des événements

La State Machine peut recevoir des événements provenant de :

- GPS Engine;
- Synchronization Engine;
- Offline Engine;
- interface opérateur;
- MissionContext;
- système d’authentification;
- système d’administration;
- reprise après redémarrage.

Exemples :

```text
MissionLoaded
MissionStartRequested
MissionPauseRequested
MissionResumeRequested
MissionCompleteRequested

ApproachRadiusEntered
WorkRadiusEntered
CompletionRadiusExited
NextResidenceRadiusEntered

ProblemReported
ProblemResolved
SkipRequested
ManualStartRequested
ManualCompleteRequested

GpsLost
GpsRecovered
NetworkLost
NetworkRecovered

AppStarted
AppResumed
AppRecovered
```

---

# Source de vérité

La State Machine travaille à partir de l’état local courant.

Elle ne lit jamais directement la base distante pour décider d’une transition immédiate.

Les données utilisées sont :

- Mission active;
- MissionItem actif;
- MissionItems suivants;
- état GPS;
- état réseau;
- paramètres;
- horodatage courant;
- événements reçus;
- contexte local persistant.

---

# Machine d’état de Mission

Une Mission peut être dans l’un des états suivants :

```text
ASSIGNED
READY
IN_PROGRESS
PAUSED
COMPLETED
CANCELLED
```

---

# État ASSIGNED

La mission a été assignée à l’opérateur.

Elle est disponible localement ou téléchargeable.

Aucune résidence n’est encore active.

Transitions possibles :

```text
ASSIGNED → READY
ASSIGNED → CANCELLED
```

---

# État READY

La mission est chargée et prête à démarrer.

Les MissionItems sont disponibles localement.

Le premier MissionItem actif n’a pas encore commencé.

Transitions possibles :

```text
READY → IN_PROGRESS
READY → CANCELLED
```

---

# État IN_PROGRESS

La mission est en cours d’exécution.

Un seul MissionItem peut être actif.

Transitions possibles :

```text
IN_PROGRESS → PAUSED
IN_PROGRESS → COMPLETED
IN_PROGRESS → CANCELLED
```

---

# État PAUSED

La mission est temporairement suspendue.

Les chronomètres opérationnels sont mis en pause selon les règles définies.

La progression est conservée.

Transitions possibles :

```text
PAUSED → IN_PROGRESS
PAUSED → CANCELLED
```

---

# État COMPLETED

La mission est terminée localement.

Tous les MissionItems sont dans un état final compatible.

L’état est immuable, sauf procédure administrative exceptionnelle.

Aucune transition automatique n’est autorisée.

---

# État CANCELLED

La mission est annulée.

Les données déjà collectées sont conservées.

Aucune nouvelle intervention ne doit commencer.

Aucune transition automatique n’est autorisée.

---

# Machine d’état de MissionItem

Un MissionItem peut être dans l’un des états suivants :

```text
WAITING
EN_ROUTE
APPROACHING
IN_PROGRESS
COMPLETED
PROBLEM
SKIPPED
CANCELLED
```

Dans l’interface française :

```text
WAITING       = EN ATTENTE
EN_ROUTE      = EN ROUTE
APPROACHING   = EN APPROCHE
IN_PROGRESS   = EN COURS
COMPLETED     = TERMINÉE
PROBLEM       = PROBLÈME
SKIPPED       = IGNORÉE
CANCELLED     = ANNULÉE
```

---

# État WAITING

La résidence fait partie de la mission, mais elle n’est pas active.

Elle ne participe pas aux calculs GPS actifs.

Transitions possibles :

```text
WAITING → EN_ROUTE
WAITING → PROBLEM
WAITING → SKIPPED
WAITING → CANCELLED
```

---

# État EN_ROUTE

L’opérateur se dirige vers la résidence.

Le chronomètre de déplacement est actif.

Transitions possibles :

```text
EN_ROUTE → APPROACHING
EN_ROUTE → IN_PROGRESS
EN_ROUTE → PROBLEM
EN_ROUTE → SKIPPED
EN_ROUTE → CANCELLED
```

Le passage direct vers `IN_PROGRESS` peut être autorisé lorsqu’une résidence très rapprochée est détectée.

---

# État APPROACHING

L’opérateur est dans la zone d’approche.

Les alertes importantes peuvent être affichées ou prononcées.

Transitions possibles :

```text
APPROACHING → IN_PROGRESS
APPROACHING → PROBLEM
APPROACHING → SKIPPED
APPROACHING → CANCELLED
```

Le retour automatique vers `EN_ROUTE` est interdit.

Une sortie momentanée du rayon d’approche ne doit pas faire reculer l’état.

---

# État IN_PROGRESS

L’intervention est active.

Le chronomètre d’intervention est actif.

Transitions possibles :

```text
IN_PROGRESS → COMPLETED
IN_PROGRESS → PROBLEM
IN_PROGRESS → CANCELLED
```

Une résidence ne doit jamais retourner automatiquement à :

- APPROACHING;
- EN_ROUTE;
- WAITING.

---

# État COMPLETED

L’intervention est terminée.

Les temps sont calculés.

La résidence disparaît de la liste opérationnelle normale.

Aucune transition automatique n’est autorisée.

---

# État PROBLEM

Un problème empêche ou complique l’intervention.

La résidence reste visible dans la liste des problèmes.

Transitions possibles selon le contexte :

```text
PROBLEM → EN_ROUTE
PROBLEM → IN_PROGRESS
PROBLEM → COMPLETED
PROBLEM → SKIPPED
PROBLEM → CANCELLED
```

Ces transitions doivent être manuelles ou administratives.

Aucune reprise automatique ne doit être faite sans validation.

---

# État SKIPPED

La résidence a été volontairement ignorée pour le moment.

Elle peut rester dans une liste secondaire.

Transitions possibles selon la politique métier :

```text
SKIPPED → EN_ROUTE
SKIPPED → CANCELLED
```

La reprise doit être manuelle.

---

# État CANCELLED

La résidence ne doit plus être effectuée dans cette mission.

Elle reste conservée dans l’historique.

Aucune transition automatique n’est autorisée.

---

# États finaux

Les états finaux sont :

```text
COMPLETED
CANCELLED
```

Les états semi-finaux nécessitant une décision sont :

```text
PROBLEM
SKIPPED
```

Une mission ne peut être déclarée terminée automatiquement si des MissionItems sont encore dans un état non final non résolu, sauf règle administrative explicite.

---

# Résidence active

Une seule résidence peut être active à la fois.

Les états considérés actifs sont :

```text
EN_ROUTE
APPROACHING
IN_PROGRESS
```

La State Machine doit empêcher que deux MissionItems soient simultanément dans un état actif.

Exception contrôlée :

Lors de la transition entre deux résidences très rapprochées, l’écriture locale peut contenir deux changements dans la même transaction.

Cependant, après validation :

- la précédente est `COMPLETED`;
- la suivante est `IN_PROGRESS`.

Il ne doit jamais subsister deux résidences actives après la transaction.

---

# MissionItem courant

Le MissionItem courant est déterminé par :

1. l’état actif;
2. l’ordre de mission;
3. la cohérence locale.

Exemple :

```text
MissionItem 3 = IN_PROGRESS
MissionItem 4 = WAITING
MissionItem 5 = WAITING
```

Le MissionItem courant est le 3.

---

# Activation de la résidence suivante

Lorsqu’un MissionItem est terminé :

```text
MissionItem courant → COMPLETED
      ↓
Recherche du prochain MissionItem admissible
      ↓
MissionItem suivant → EN_ROUTE
      ↓
Mise à jour du MissionContext
```

Un MissionItem est admissible s’il est :

- dans l’ordre courant;
- non suspendu;
- non annulé;
- non terminé;
- non exclu par une règle métier.

---

# Contrats suspendus

Les contrats suspendus ne doivent pas être copiés dans une nouvelle mission.

Si un MissionItem déjà présent devient suspendu depuis le serveur pendant la mission :

- ne pas l’annuler silencieusement;
- appliquer une règle de conflit;
- conserver l’état local;
- informer l’opérateur ou l’administration si nécessaire.

---

# Transitions automatiques

Les transitions automatiques principales sont :

```text
WAITING → EN_ROUTE
EN_ROUTE → APPROACHING
APPROACHING → IN_PROGRESS
IN_PROGRESS → COMPLETED
```

Elles sont déclenchées à partir d’événements validés.

---

# Transition WAITING vers EN_ROUTE

Conditions :

- Mission en cours;
- aucun autre MissionItem actif;
- MissionItem admissible;
- MissionItem suivant selon l’ordre;
- aucune exclusion active.

Conséquences :

- enregistrer l’heure `EN_ROUTE`;
- démarrer le chronomètre de déplacement;
- mettre à jour le MissionContext;
- publier l’événement vocal;
- ajouter l’opération de synchronisation;
- journaliser.

---

# Transition EN_ROUTE vers APPROACHING

Déclencheur typique :

```text
ApproachRadiusEntered
```

Conditions :

- MissionItem courant;
- état actuel `EN_ROUTE`;
- distance validée;
- précision GPS acceptable;
- délai de validation respecté;
- mission non pausée.

Conséquences :

- enregistrer l’heure `APPROACHING`;
- publier l’état;
- afficher les alertes pertinentes;
- préparer l’annonce vocale;
- mettre à jour la caméra.

---

# Transition APPROACHING vers IN_PROGRESS

Déclencheur typique :

```text
WorkRadiusEntered
```

Conditions :

- MissionItem courant;
- état actuel `APPROACHING`;
- présence validée dans le rayon;
- précision GPS acceptable;
- délai de validation respecté;
- mission non pausée.

Conséquences :

- enregistrer l’heure `IN_PROGRESS`;
- calculer le temps de déplacement;
- démarrer le chronomètre d’intervention;
- publier l’annonce vocale;
- mettre à jour le MissionContext;
- créer l’opération de synchronisation.

---

# Transition directe EN_ROUTE vers IN_PROGRESS

Cette transition est permise uniquement dans des cas explicites.

Exemples :

- résidences adjacentes;
- intervention démarrée manuellement;
- rayon d’approche dépassé trop rapidement;
- récupération après redémarrage avec preuve locale suffisante.

La raison doit être enregistrée.

Exemple :

```ts
transitionSource:
  | 'GPS_NORMAL'
  | 'ADJACENT_RESIDENCE'
  | 'MANUAL'
  | 'RECOVERY'
```

---

# Transition IN_PROGRESS vers COMPLETED

Déclencheur normal :

```text
CompletionRadiusExited
```

Conditions :

- état actuel `IN_PROGRESS`;
- distance supérieure au seuil;
- délai de validation respecté;
- aucune entrée immédiate dans la prochaine résidence;
- mission non pausée.

Conséquences :

- enregistrer l’heure `COMPLETED`;
- calculer le temps d’intervention;
- arrêter le chronomètre;
- écrire l’événement local;
- créer l’opération de synchronisation;
- annoncer la fin;
- activer la résidence suivante.

---

# Cas des résidences rapprochées

Ce cas est essentiel.

Situation :

- résidence A en cours;
- résidence B immédiatement voisine;
- l’opérateur entre dans le rayon de B;
- l’opérateur n’a pas encore dépassé le rayon de fin de A.

Flux :

```text
A = IN_PROGRESS
      ↓
NextResidenceRadiusEntered pour B
      ↓
Validation du cas adjacent
      ↓
Transaction atomique
      ├── A → COMPLETED
      └── B → IN_PROGRESS
```

Conséquences :

Résidence A :

- heure de fin enregistrée;
- temps d’intervention calculé;
- événement `ITEM_COMPLETED`.

Résidence B :

- heure `EN_ROUTE` générée;
- heure `IN_PROGRESS` enregistrée;
- temps de déplacement fixé à 5 secondes;
- source du temps marquée comme artificielle;
- événement `ITEM_STARTED`.

Exemple :

```ts
travelTimeSeconds: 5
travelTimeSource: 'ADJACENT_RESIDENCE_FALLBACK'
```

---

# Validation du cas adjacent

La transition automatique entre résidences rapprochées doit vérifier :

- B est le prochain MissionItem admissible;
- B est dans le rayon de début;
- A est toujours en cours;
- les positions sont suffisamment précises;
- aucun autre MissionItem n’est candidat;
- l’événement est stable pendant le délai configuré.

Le moteur ne doit pas choisir arbitrairement la résidence la plus proche.

---

# Actions manuelles

Certaines transitions peuvent être demandées manuellement.

Exemples :

- démarrer la mission;
- mettre en pause;
- reprendre;
- commencer une résidence;
- terminer une résidence;
- signaler un problème;
- ignorer une résidence;
- reprendre une résidence;
- terminer la mission.

Toute action manuelle doit être validée par la State Machine.

---

# Démarrage manuel d’une résidence

Le démarrage manuel est permis lorsque :

- le GPS est indisponible;
- la précision GPS est insuffisante;
- l’adresse est mal géolocalisée;
- l’opérateur confirme être sur place;
- une procédure de récupération est nécessaire.

Conséquences :

- demander une confirmation;
- enregistrer la transition comme manuelle;
- journaliser l’utilisateur et l’heure;
- ne pas masquer l’origine manuelle;
- poursuivre normalement.

---

# Fin manuelle d’une résidence

La fin manuelle est permise lorsque :

- le GPS ne détecte pas correctement la sortie;
- le téléphone est resté immobile;
- l’intervention est réellement terminée;
- une anomalie technique est présente.

La State Machine doit :

- vérifier l’état `IN_PROGRESS`;
- demander une confirmation;
- enregistrer la méthode;
- calculer les temps;
- activer la suivante.

---

# Signalement d’un problème

Déclencheur :

```text
ProblemReported
```

Conditions :

- MissionItem existant;
- état compatible;
- code problème valide;
- note facultative ou obligatoire selon le type.

Transition :

```text
WAITING → PROBLEM
EN_ROUTE → PROBLEM
APPROACHING → PROBLEM
IN_PROGRESS → PROBLEM
```

Conséquences :

- arrêter les chronomètres actifs selon la politique;
- enregistrer le problème;
- conserver la résidence dans la liste;
- synchroniser;
- annoncer la confirmation;
- activer la suivante si l’opérateur le demande.

---

# Résolution d’un problème

Une résidence en problème peut être reprise.

Exemple :

```text
PROBLEM → EN_ROUTE
```

ou :

```text
PROBLEM → IN_PROGRESS
```

La reprise doit toujours être explicite.

Le problème initial reste dans l’historique.

---

# Ignorer une résidence

Déclencheur :

```text
SkipRequested
```

Conditions :

- MissionItem non terminé;
- raison valide;
- confirmation opérateur.

Transition :

```text
WAITING → SKIPPED
EN_ROUTE → SKIPPED
APPROACHING → SKIPPED
```

Pour `IN_PROGRESS`, le système doit généralement demander de signaler un problème plutôt que d’ignorer.

---

# Mise en pause de la mission

Déclencheur :

```text
MissionPauseRequested
```

Conditions :

- mission `IN_PROGRESS`;
- aucune transition atomique en cours;
- stockage local disponible.

Transition :

```text
IN_PROGRESS → PAUSED
```

Conséquences :

- arrêter ou suspendre les chronomètres;
- conserver le MissionItem courant;
- désactiver les transitions automatiques GPS;
- maintenir l’affichage;
- synchroniser;
- journaliser.

---

# Reprise de mission

Déclencheur :

```text
MissionResumeRequested
```

Transition :

```text
PAUSED → IN_PROGRESS
```

Conséquences :

- reprendre les chronomètres;
- réactiver l’analyse GPS;
- restaurer le MissionItem courant;
- vérifier la cohérence de la position;
- synchroniser;
- journaliser.

---

# Chronomètres

La State Machine contrôle les phases temporelles métier.

## Temps de déplacement

```text
EN_ROUTE → IN_PROGRESS
```

Calcul :

```text
startedAt - enRouteAt
```

## Temps d’intervention

```text
IN_PROGRESS → COMPLETED
```

Calcul :

```text
completedAt - startedAt
```

## Temps de mission

```text
Mission IN_PROGRESS → Mission COMPLETED
```

Les périodes de pause doivent être exclues ou conservées séparément selon les règles officielles.

---

# Horodatage

Chaque transition doit enregistrer :

- heure locale;
- heure UTC;
- fuseau horaire;
- source de l’événement;
- méthode;
- précision GPS si applicable;
- version de l’état précédent;
- version de l’état suivant.

Exemple :

```ts
type StateTransition = {
  id: string
  missionId: string
  missionItemId?: string

  fromState: string
  toState: string

  source:
    | 'GPS'
    | 'MANUAL'
    | 'SYSTEM'
    | 'RECOVERY'
    | 'ADMIN'

  occurredAtUtc: string
  occurredAtLocal: string
  timezone: string

  gpsAccuracyMeters?: number
  latitude?: number
  longitude?: number

  reason?: string
}
```

---

# Transition atomique

Une transition métier doit être appliquée de manière atomique.

Exemple :

```text
Mise à jour de MissionItem
Création de l’événement
Création de SyncOperation
Mise à jour du MissionContext
```

Ces opérations doivent réussir ensemble ou échouer ensemble.

L’application ne doit jamais se retrouver dans un état partiellement modifié.

---

# Verrou de transition

Une seule transition peut être appliquée à la fois pour un MissionItem.

Lorsqu’une transition est en cours :

```text
Transition lock
      ↓
Validation
      ↓
Écriture
      ↓
Publication
      ↓
Déverrouillage
```

Les événements concurrents doivent être :

- mis en attente;
- dédupliqués;
- ignorés s’ils sont devenus obsolètes.

---

# Déduplication

Deux événements identiques ne doivent pas produire deux transitions.

Exemple :

```text
WorkRadiusEntered
WorkRadiusEntered
WorkRadiusEntered
```

Un seul passage vers `IN_PROGRESS` doit être enregistré.

La State Machine doit utiliser :

- l’état courant;
- un identifiant d’événement;
- un délai;
- une clé de déduplication.

---

# Événements obsolètes

Un événement devient obsolète lorsque l’état a déjà progressé.

Exemple :

```text
APPROACHING event reçu
```

alors que le MissionItem est déjà :

```text
IN_PROGRESS
```

L’événement doit être ignoré et journalisé.

---

# Transitions irréversibles

Les transitions automatiques sont irréversibles.

Exemple :

```text
IN_PROGRESS → COMPLETED
```

ne doit jamais revenir automatiquement vers :

```text
IN_PROGRESS
```

Une correction administrative exceptionnelle doit créer un événement distinct.

Elle ne doit pas modifier silencieusement l’historique.

---

# Transition invalide

Lorsqu’une transition est invalide :

```text
Événement reçu
      ↓
Validation échouée
      ↓
Aucun changement métier
      ↓
Journalisation
      ↓
Événement technique facultatif
```

Exemple :

```text
COMPLETED → APPROACHING
```

doit être refusé.

---

# MissionContext

La State Machine met à jour le MissionContext.

Exemple :

```ts
type MissionContext = {
  mission: Mission
  activeMissionItem?: MissionItem
  nextMissionItems: MissionItem[]

  missionState: MissionState
  activeItemState?: MissionItemState

  phaseStartedAt?: string
  phaseElapsedSeconds: number

  gpsState: GpsState
  networkState: NetworkState
  synchronizationState: SynchronizationState

  alerts: MissionAlert[]
}
```

Les composants React lisent le MissionContext.

Ils ne modifient jamais directement les états métier.

---

# Événements publiés

Après une transition, la State Machine peut publier :

```text
MissionStateChanged
MissionItemStateChanged
ActiveMissionItemChanged
ProgressChanged
PhaseTimerStarted
PhaseTimerStopped
MissionCompleted
ProblemStateChanged
```

Elle peut aussi produire des commandes destinées aux autres moteurs :

```text
QueueSynchronization
RequestVoiceAnnouncement
UpdateMapState
PersistMissionContext
```

---

# Commandes et événements

Il est recommandé de distinguer :

## Commande

Une demande d’action.

Exemple :

```text
CompleteMissionItem
```

## Événement

Un fait accompli.

Exemple :

```text
MissionItemCompleted
```

La commande peut échouer.

L’événement représente une transition déjà appliquée.

---

# Exemple de commande

```ts
type CompleteMissionItemCommand = {
  missionId: string
  missionItemId: string
  source: 'GPS' | 'MANUAL'
  requestedAt: string
  location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
}
```

---

# Exemple de résultat

```ts
type TransitionResult = {
  success: boolean
  transition?: StateTransition
  events?: DomainEvent[]
  errorCode?: string
  errorMessage?: string
}
```

---

# Récupération après redémarrage

Au démarrage de l’application :

```text
Chargement de la mission locale
      ↓
Chargement des MissionItems
      ↓
Vérification de cohérence
      ↓
Recherche de l’état actif
      ↓
Reconstruction du MissionContext
      ↓
Reprise des chronomètres
      ↓
Réactivation des moteurs
```

La State Machine doit détecter :

- aucun MissionItem actif;
- plusieurs MissionItems actifs;
- mission terminée avec item actif;
- horodatages manquants;
- transition locale incomplète.

---

# Plusieurs MissionItems actifs

Cette situation est invalide.

Stratégie :

1. arrêter les transitions automatiques;
2. journaliser l’anomalie;
3. déterminer le dernier état cohérent;
4. utiliser les séquences et horodatages;
5. restaurer un seul MissionItem actif;
6. conserver une trace de la correction.

Aucune donnée ne doit être supprimée silencieusement.

---

# Aucun MissionItem actif

Si la mission est en cours et aucun MissionItem n’est actif :

- rechercher le premier MissionItem admissible;
- l’activer en `EN_ROUTE`;
- marquer la transition comme récupération;
- journaliser.

---

# Mode hors ligne

La State Machine continue de fonctionner normalement hors ligne.

Les transitions sont :

- validées localement;
- enregistrées localement;
- ajoutées à la file de synchronisation;
- affichées immédiatement.

Le mode hors ligne ne modifie pas les règles métier.

Il modifie uniquement la manière dont les résultats sont transmis.

---

# GPS perdu

Lorsqu’un événement `GpsLost` est reçu :

- conserver l’état courant;
- ne pas terminer automatiquement une résidence;
- ne pas faire reculer l’état;
- suspendre les transitions GPS dépendantes;
- permettre les actions manuelles;
- afficher l’état GPS;
- journaliser.

Le chronomètre peut continuer.

---

# GPS rétabli

Lorsqu’un événement `GpsRecovered` est reçu :

- reprendre l’analyse;
- ne pas rejouer les transitions passées;
- vérifier la cohérence avec l’état courant;
- ignorer les événements anciens;
- journaliser.

---

# Changement d’ordre

Si l’ordre des MissionItems est modifié :

- ne jamais changer la résidence active sans validation;
- appliquer la modification uniquement aux résidences futures;
- conserver les résidences terminées;
- recalculer les cinq prochaines;
- mettre à jour le chemin suggéré.

---

# Modification serveur en cours de mission

Les changements distants compatibles peuvent être appliqués.

Exemples :

- nouvelle alerte;
- note ajoutée;
- correction d’instruction;
- modification d’un MissionItem futur.

Les changements sensibles doivent déclencher une décision explicite.

Exemples :

- retrait de la résidence active;
- suppression de mission;
- réassignation d’opérateur;
- annulation d’un MissionItem en cours.

---

# Fin de mission

Une Mission peut passer à `COMPLETED` lorsque :

- aucun MissionItem actif ne reste;
- tous les MissionItems sont dans un état final ou résolu;
- aucune transition n’est en cours;
- l’opérateur confirme si des problèmes restent ouverts;
- les données locales sont enregistrées.

La synchronisation complète n’est pas obligatoire pour terminer localement la mission.

---

# Mission avec problèmes non résolus

Si des MissionItems sont encore en `PROBLEM` :

```text
Terminer la mission ?
2 résidences restent en problème.
```

La politique peut permettre :

- revenir aux problèmes;
- terminer avec problèmes ouverts;
- annuler la fin.

La décision doit être enregistrée.

---

# Progression

La progression doit être calculée selon une règle explicite.

Exemple recommandé :

```text
MissionItems COMPLETED
÷
MissionItems admissibles
```

Les MissionItems annulés ou exclus peuvent être retirés du dénominateur selon la politique métier.

Les MissionItems en problème ne comptent pas comme terminés tant qu’ils ne sont pas résolus ou clôturés.

---

# Journalisation

Chaque décision de la State Machine doit pouvoir être expliquée.

Le journal doit contenir :

- événement reçu;
- état précédent;
- état demandé;
- résultat;
- conditions validées;
- conditions refusées;
- source;
- heure;
- MissionItem;
- données GPS pertinentes;
- conséquence produite.

Exemple :

```text
08:15:34
WorkRadiusEntered
MissionItem 3
APPROACHING → IN_PROGRESS
AUTHORIZED
Accuracy: 4 m
Distance: 22 m
Validation: 5 s
```

---

# Codes d’erreur

Exemples :

```text
INVALID_TRANSITION
MISSION_NOT_ACTIVE
MISSION_ITEM_NOT_FOUND
ANOTHER_ITEM_ACTIVE
GPS_ACCURACY_TOO_LOW
VALIDATION_DELAY_NOT_REACHED
MISSION_PAUSED
ITEM_ALREADY_COMPLETED
ITEM_CANCELLED
TRANSITION_LOCKED
LOCAL_WRITE_FAILED
```

Ces codes doivent être stables et documentés.

---

# Observabilité

Le mode Développement doit permettre d’afficher :

- état de la mission;
- MissionItem actif;
- état courant;
- dernière transition;
- prochain événement attendu;
- verrou actif;
- événements ignorés;
- événements dédupliqués;
- source de la transition;
- chronomètres;
- paramètres de seuil;
- historique récent.

---

# Mode simulation

Le mode Développement doit permettre de simuler :

- entrée dans le rayon d’approche;
- entrée dans le rayon de travail;
- sortie du rayon de fin;
- résidence adjacente;
- perte GPS;
- retour GPS;
- problème;
- pause;
- reprise;
- fin manuelle;
- redémarrage.

La simulation doit utiliser la même State Machine que la production.

Il ne doit pas exister une logique métier distincte pour les tests.

---

# Tests unitaires obligatoires

Chaque transition doit être testée.

Exemples :

- WAITING vers EN_ROUTE;
- EN_ROUTE vers APPROACHING;
- APPROACHING vers IN_PROGRESS;
- IN_PROGRESS vers COMPLETED;
- EN_ROUTE vers IN_PROGRESS;
- IN_PROGRESS vers PROBLEM;
- PROBLEM vers EN_ROUTE;
- SKIPPED vers EN_ROUTE;
- mission READY vers IN_PROGRESS;
- mission IN_PROGRESS vers PAUSED;
- mission PAUSED vers IN_PROGRESS;
- mission IN_PROGRESS vers COMPLETED.

---

# Tests de refus obligatoires

Exemples :

- COMPLETED vers IN_PROGRESS;
- CANCELLED vers EN_ROUTE;
- WAITING vers COMPLETED automatiquement;
- deuxième MissionItem actif;
- transition pendant mission en pause;
- fin sans enregistrement local;
- événement GPS obsolète;
- doublon de transition;
- transition avec MissionItem inexistant.

---

# Tests de scénarios

Scénarios complets à tester :

- mission normale;
- résidence sans approche détectée;
- résidences adjacentes;
- GPS imprécis;
- GPS perdu pendant EN ROUTE;
- GPS perdu pendant IN_PROGRESS;
- démarrage manuel;
- fin manuelle;
- problème puis reprise;
- problème puis passage à la suivante;
- pause au milieu d’une résidence;
- redémarrage pendant EN COURS;
- synchronisation absente;
- ordre modifié;
- mission terminée avec problèmes;
- deux événements concurrents;
- plusieurs centaines de MissionItems.

---

# Invariants

Les invariants suivants doivent toujours être vrais :

```text
Une seule Mission active par session.
```

```text
Un seul MissionItem actif par Mission.
```

```text
Un MissionItem terminé ne revient pas automatiquement en arrière.
```

```text
Toute transition est journalisée.
```

```text
Toute transition métier est enregistrée localement.
```

```text
Toute transition synchronisable crée une SyncOperation.
```

```text
L’interface ne modifie jamais directement l’état.
```

```text
Le GPS Engine ne modifie jamais directement l’état.
```

```text
Une transition invalide ne produit aucun effet métier.
```

---

# Flux complet d’une transition

```text
Événement ou commande
      ↓
Validation de la mission
      ↓
Validation du MissionItem
      ↓
Validation de l’état courant
      ↓
Validation des conditions
      ↓
Acquisition du verrou
      ↓
Création de la transition
      ↓
Transaction locale
      ├── Entité mise à jour
      ├── Événement enregistré
      └── SyncOperation créée
      ↓
Mise à jour du MissionContext
      ↓
Publication des événements
      ↓
Libération du verrou
      ↓
Interface, voix, carte et synchronisation réagissent
```

---

# Règles importantes

La State Machine est la seule autorité métier.

Toute transition passe par elle.

Une seule résidence peut être active.

Les transitions automatiques ne reculent jamais.

Les actions manuelles sont toujours identifiées.

Les transitions sont atomiques.

Les doublons sont ignorés.

Les événements obsolètes sont ignorés.

Une perte réseau n’empêche aucune transition locale.

Une perte GPS ne termine jamais automatiquement une résidence.

Les données terrain ne sont jamais écrasées silencieusement.

Chaque décision doit pouvoir être expliquée.

---

# Objectif final

La State Machine doit garantir qu’une mission RECA Operator se déroule toujours selon des règles claires.

Elle doit rendre impossible la majorité des états incohérents.

Elle doit permettre :

- une exécution fiable;
- des transitions déterministes;
- un fonctionnement hors ligne;
- une reprise après erreur;
- une traçabilité complète;
- des tests automatisés;
- une évolution contrôlée du produit.

La State Machine doit rester indépendante :

- du GPS;
- de Mapbox;
- de l’interface;
- du réseau;
- de Supabase;
- de la synthèse vocale.

Elle reçoit des faits.

Elle applique des règles.

Elle produit un état cohérent.