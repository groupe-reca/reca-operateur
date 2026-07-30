# 07-Synchronization.md

# RECA Operator
## Synchronization Engine

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Le Synchronization Engine est responsable de la transmission fiable des données entre RECA Operator et RECA App.

Il garantit que les actions effectuées sur le terrain sont conservées localement, puis transmises au serveur lorsque le réseau est disponible.

Son objectif principal est simple :

**Aucune donnée opérationnelle ne doit être perdue.**

Le moteur doit continuer de fonctionner pendant :

- une perte de réseau;
- une connexion instable;
- un redémarrage de l’application;
- un verrouillage de l’écran;
- une interruption temporaire du serveur;
- une synchronisation partielle;
- une fermeture inattendue de l’application.

---

# Philosophie

RECA Operator est une application **local-first**.

Cela signifie que l’action de l’opérateur est d’abord enregistrée localement.

La synchronisation vers le serveur se produit ensuite.

```text
Action opérateur
      ↓
Écriture locale
      ↓
Confirmation immédiate dans l’interface
      ↓
Ajout à la file de synchronisation
      ↓
Envoi au serveur
      ↓
Confirmation du serveur
```

L’interface ne doit jamais attendre le serveur pour confirmer une action normale.

---

# Principe fondamental

Une action métier ne doit jamais dépendre directement de la disponibilité du réseau.

Exemples :

- commencer une mission;
- entrer en approche;
- commencer une résidence;
- terminer une résidence;
- signaler un problème;
- ajouter une note;
- terminer une mission.

Toutes ces actions doivent fonctionner hors ligne.

---

# Responsabilités

Le Synchronization Engine est responsable de :

- enregistrer les opérations à synchroniser;
- maintenir une file locale persistante;
- détecter la disponibilité du réseau;
- envoyer les opérations au serveur;
- confirmer les opérations réussies;
- réessayer les opérations échouées;
- éviter les doublons;
- respecter l’ordre logique des opérations;
- résoudre les conflits simples;
- journaliser les synchronisations;
- exposer l’état de synchronisation à l’interface;
- continuer après un redémarrage;
- protéger l’intégrité des missions.

Le Synchronization Engine n’est pas responsable de :

- décider des transitions métier;
- calculer les distances GPS;
- choisir la résidence active;
- afficher les composants visuels;
- créer une mission;
- modifier la route;
- gérer la synthèse vocale;
- décider qu’une action opérateur est valide.

---

# Sources de données

Le moteur reçoit des opérations provenant principalement de :

- State Machine;
- MissionContext;
- GPS Engine;
- interface opérateur;
- système de problèmes;
- système de notes;
- fin de mission;
- reprise après redémarrage.

Il ne doit pas dépendre directement des composants React.

---

# Source de vérité locale

Pendant l’exécution d’une mission, la source de vérité immédiate est le stockage local de RECA Operator.

Le serveur reste la source de vérité centrale du système RECA.

Cependant, une action effectuée sur le terrain et enregistrée localement est considérée comme valide même si elle n’a pas encore été transmise.

```text
Pendant la mission
Source immédiate : stockage local

Après synchronisation
Source centrale : RECA App
```

---

# Données synchronisées

Le moteur doit pouvoir synchroniser au minimum :

## Mission

- démarrage réel;
- mise en pause;
- reprise;
- fin réelle;
- statut;
- opérateur;
- équipement;
- notes de mission.

## MissionItem

- statut;
- ordre actuel;
- heure EN ROUTE;
- heure EN APPROCHE;
- heure EN COURS;
- heure TERMINÉE;
- temps de déplacement;
- temps d’intervention;
- problème;
- notes;
- indicateur de temps fictif;
- méthode de transition;
- horodatage local.

## Problèmes

- code du problème;
- description;
- note;
- heure;
- résidence concernée;
- statut de résolution;
- média associé lorsque prévu.

## Événements

- transitions;
- perte GPS;
- retour GPS;
- passage hors ligne;
- retour en ligne;
- erreurs importantes;
- actions manuelles.

## Session

- heure d’ouverture;
- heure de fermeture;
- version de l’application;
- appareil;
- informations techniques utiles au diagnostic.

---

# File de synchronisation

Toutes les opérations à transmettre sont placées dans une file persistante.

Cette file doit survivre à :

- la fermeture de l’application;
- un redémarrage du téléphone;
- un plantage;
- une perte de batterie;
- une perte réseau prolongée.

Exemple :

```text
ITEM_STARTED
      ↓
Queue locale
      ↓
ITEM_COMPLETED
      ↓
Queue locale
      ↓
Réseau disponible
      ↓
Envoi dans l’ordre
```

---

# Structure d’une opération

Chaque opération de synchronisation doit posséder une structure similaire à celle-ci :

```ts
type SyncOperation = {
  id: string
  type: SyncOperationType

  missionId: string
  missionItemId?: string

  payload: Record<string, unknown>

  createdAt: string
  updatedAt: string

  localSequence: number
  attemptCount: number

  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'CONFIRMED'
    | 'FAILED'
    | 'BLOCKED'

  idempotencyKey: string

  lastAttemptAt?: string
  nextAttemptAt?: string

  lastErrorCode?: string
  lastErrorMessage?: string
}
```

---

# Identifiant unique

Chaque opération doit posséder un identifiant unique généré localement.

Cet identifiant ne doit jamais changer.

Il permet :

- d’éviter les doublons;
- de reprendre une opération;
- de reconnaître une opération déjà reçue;
- de diagnostiquer une erreur;
- d’assurer l’idempotence.

---

# Idempotence

Le serveur doit accepter qu’une même opération soit envoyée plusieurs fois sans créer plusieurs effets.

Exemple :

```text
ITEM_COMPLETED
Operation ID : abc-123
```

Si cette opération est reçue deux fois, le serveur doit répondre que l’opération est déjà traitée.

Il ne doit jamais :

- terminer deux fois une résidence;
- créer deux problèmes identiques;
- doubler les durées;
- dupliquer les événements.

---

# Ordre des opérations

Les opérations liées à une même mission doivent respecter leur ordre logique.

Exemple :

```text
ITEM_EN_ROUTE
      ↓
ITEM_EN_APPROACH
      ↓
ITEM_STARTED
      ↓
ITEM_COMPLETED
```

Le moteur ne doit pas envoyer `ITEM_COMPLETED` avant `ITEM_STARTED`.

Chaque opération possède un numéro de séquence local.

Exemple :

```text
101 ITEM_EN_ROUTE
102 ITEM_EN_APPROACH
103 ITEM_STARTED
104 ITEM_COMPLETED
```

---

# Ordre par MissionItem

L’ordre doit être garanti au minimum pour :

- une mission;
- un MissionItem;
- une séquence de transitions dépendantes.

Des opérations indépendantes peuvent être traitées séparément si cela améliore les performances.

---

# Écriture locale

Lorsqu’une action est validée :

```text
State Machine
      ↓
Écriture locale transactionnelle
      ↓
Mise à jour du MissionContext
      ↓
Ajout de SyncOperation
      ↓
Mise à jour de l’interface
```

L’écriture de la donnée métier et l’ajout à la file doivent idéalement se produire dans la même transaction locale.

Cela évite le cas où :

- l’interface affiche une action;
- mais aucune opération de synchronisation n’existe.

---

# Confirmation locale

L’opérateur ne doit pas attendre le serveur.

Exemple :

```text
Résidence terminée
      ↓
Enregistrement local réussi
      ↓
Interface mise à jour immédiatement
      ↓
Synchronisation en arrière-plan
```

Le succès affiché à l’opérateur correspond à la réussite de l’enregistrement local.

L’état de synchronisation est affiché séparément.

---

# États globaux de synchronisation

Le moteur expose les états suivants :

## Synchronisé

Aucune opération en attente.

```text
Synchronisé
```

## Synchronisation en cours

Une ou plusieurs opérations sont en transmission.

```text
Synchronisation…
```

## En attente

Des opérations attendent le retour du réseau.

```text
3 changements en attente
```

## Erreur temporaire

Une tentative a échoué, mais sera répétée.

```text
Synchronisation retardée
```

## Erreur nécessitant une intervention

Une ou plusieurs opérations sont bloquées.

```text
Synchronisation requise
```

---

# Détection du réseau

Le moteur doit distinguer :

- réseau disponible;
- réseau indisponible;
- réseau présent mais Internet inaccessible;
- serveur inaccessible;
- authentification expirée.

Une connexion Wi-Fi active ne signifie pas nécessairement que le serveur est joignable.

---

# Déclencheurs de synchronisation

Une tentative de synchronisation peut être déclenchée lors de :

- ajout d’une opération;
- retour du réseau;
- ouverture de l’application;
- retour au premier plan;
- intervalle périodique;
- demande manuelle;
- fin de mission;
- fermeture contrôlée de session.

La synchronisation doit rester économe en batterie.

---

# Synchronisation immédiate

Lorsque le réseau est stable, le moteur peut tenter de synchroniser rapidement après chaque opération.

Cependant, il ne doit pas créer une requête distincte inutile pour chaque événement mineur.

Il peut utiliser :

- regroupement;
- envoi par lot;
- courte fenêtre d’attente;
- priorité.

---

# Envoi par lot

Les opérations peuvent être envoyées par petits lots.

Exemple :

```text
Lot de 10 opérations
```

Avantages :

- moins de requêtes;
- meilleure efficacité;
- meilleure autonomie;
- reprise plus simple.

Le lot ne doit pas être trop grand afin d’éviter qu’une seule erreur bloque une longue séquence.

---

# Priorités

Les opérations peuvent avoir différents niveaux de priorité.

## Critique

- fin de mission;
- problème important;
- changement d’opérateur;
- opération bloquante.

## Élevée

- début d’intervention;
- fin d’intervention;
- statut de résidence.

## Normale

- notes;
- événements système;
- statistiques.

## Faible

- diagnostics;
- événements techniques secondaires.

Les priorités ne doivent jamais briser l’ordre métier obligatoire.

---

# Réessais

Une opération échouée doit être réessayée automatiquement.

Utiliser une stratégie d’attente progressive.

Exemple :

```text
Tentative 1 : immédiate
Tentative 2 : 5 secondes
Tentative 3 : 15 secondes
Tentative 4 : 30 secondes
Tentative 5 : 1 minute
Tentatives suivantes : intervalle croissant plafonné
```

Ajouter une variation aléatoire légère afin d’éviter que plusieurs appareils réessaient exactement au même moment.

---

# Limite des réessais

Une opération importante ne doit pas être supprimée parce qu’elle a échoué plusieurs fois.

Après un certain nombre d’échecs :

```text
PENDING
      ↓
FAILED
      ↓
BLOCKED
```

L’opération reste conservée localement.

Elle doit pouvoir être :

- réessayée automatiquement;
- réessayée manuellement;
- inspectée dans le mode Développement;
- exportée pour diagnostic.

---

# Erreurs temporaires

Exemples :

- absence de réseau;
- serveur indisponible;
- délai dépassé;
- erreur 500;
- coupure pendant l’envoi.

Ces erreurs déclenchent un réessai automatique.

---

# Erreurs permanentes

Exemples :

- mission inexistante;
- opération invalide;
- données corrompues;
- utilisateur non autorisé;
- version de données incompatible.

Ces erreurs doivent :

- bloquer l’opération;
- être journalisées;
- afficher un indicateur;
- être conservées;
- nécessiter une stratégie de résolution.

---

# Authentification expirée

Si la session d’authentification expire :

```text
Opération en attente
      ↓
Rafraîchissement du jeton
      ↓
Nouvelle tentative
```

Si le rafraîchissement échoue :

- les opérations restent locales;
- la mission continue;
- l’utilisateur est averti;
- aucune donnée n’est supprimée.

L’expiration de session ne doit pas interrompre une mission active.

---

# Conflits

Un conflit apparaît lorsque le serveur contient une version différente de la donnée locale.

Exemples :

- mission modifiée par le répartiteur;
- ordre modifié pendant l’exécution;
- résidence suspendue après téléchargement;
- problème modifié depuis RECA App;
- mission réassignée.

---

# Politique de conflit

Les données d’exécution terrain ont généralement priorité pour les événements déjà effectués.

Exemples :

- heure réelle de début;
- heure réelle de fin;
- statut terminé;
- problème enregistré;
- notes de l’opérateur.

Les modifications administratives du serveur ont priorité pour :

- informations contractuelles;
- nom de route;
- données du client;
- configuration;
- permissions.

Chaque type de donnée doit posséder une règle de conflit explicite.

---

# Aucun écrasement silencieux

Le moteur ne doit jamais écraser silencieusement une donnée importante.

Lorsqu’un conflit ne peut pas être résolu automatiquement :

```text
Conflit détecté
      ↓
Conserver les deux versions
      ↓
Marquer pour résolution
      ↓
Informer RECA App
```

La mission doit continuer lorsque possible.

---

# Versions

Les entités synchronisées doivent idéalement posséder :

- `version`;
- ou `updated_at`;
- ou un identifiant de révision.

Exemple :

```ts
type VersionedEntity = {
  id: string
  version: number
  updatedAt: string
}
```

Le serveur peut refuser une mise à jour basée sur une version obsolète.

---

# Horodatage

Tous les événements doivent utiliser un horodatage précis.

Le moteur doit conserver :

- heure locale de création;
- heure UTC;
- heure de réception serveur;
- fuseau horaire;
- éventuel décalage détecté.

Le serveur ne doit pas remplacer l’heure réelle d’une action par l’heure de synchronisation.

Exemple :

```text
Résidence terminée à 08:21
Synchronisée à 09:04
```

L’heure officielle de fin reste 08:21.

---

# Horloge incorrecte

Le moteur doit pouvoir détecter une horloge appareil manifestement incorrecte.

Dans ce cas :

- conserver l’heure locale;
- ajouter un indicateur de fiabilité;
- enregistrer l’heure serveur lors de la synchronisation;
- signaler l’anomalie.

Il ne doit pas inventer silencieusement une heure.

---

# Compression des opérations

Certaines opérations peuvent être regroupées avant envoi.

Exemple :

```text
NOTE_UPDATED
NOTE_UPDATED
NOTE_UPDATED
```

Si les trois concernent la même note non encore synchronisée, seule la dernière version peut être envoyée.

Cette compression ne doit pas être utilisée pour les transitions métier.

Ne jamais supprimer :

- un début d’intervention;
- une fin d’intervention;
- un problème;
- une transition;
- un événement critique.

---

# Synchronisation de la position GPS

RECA Operator ne doit pas transmettre chaque point GPS brut par défaut.

Cela consommerait :

- batterie;
- données mobiles;
- stockage;
- bande passante.

Le moteur peut synchroniser :

- événements de position importants;
- position au changement d’état;
- position lors d’un problème;
- position au début et à la fin;
- résumés de trajet;
- points espacés selon une politique configurable.

La collecte continue complète doit être une fonction explicitement activée.

---

# Médias

Les photos ou pièces jointes doivent utiliser une file séparée ou une sous-file spécialisée.

Une opération de média contient :

- fichier local;
- type;
- taille;
- MissionItem;
- checksum;
- statut;
- progression;
- nombre de tentatives.

Le problème métier peut être synchronisé avant le média.

Exemple :

```text
Problème créé
      ↓
Synchronisation du problème
      ↓
Téléversement de la photo
      ↓
Association de la photo
```

Un échec de photo ne doit pas supprimer le problème.

---

# Taille et réseau

Les médias peuvent être limités selon :

- réseau cellulaire;
- Wi-Fi;
- batterie;
- taille du fichier;
- préférence utilisateur.

Les données métier textuelles doivent toujours avoir priorité sur les médias.

---

# Reprise après interruption

Si l’application ferme pendant une synchronisation :

```text
PROCESSING
      ↓
Redémarrage
      ↓
Retour à PENDING
      ↓
Nouvelle tentative
```

Aucune opération ne doit rester bloquée définitivement dans `PROCESSING`.

---

# Démarrage de l’application

Au démarrage :

```text
Ouverture du stockage local
      ↓
Vérification de l’intégrité
      ↓
Récupération des opérations incomplètes
      ↓
Réinitialisation des opérations PROCESSING
      ↓
Vérification du réseau
      ↓
Synchronisation
```

L’interface peut se charger avant la fin de la synchronisation.

---

# Fin de mission

La fin de mission est enregistrée localement immédiatement.

Ensuite, le moteur tente une synchronisation prioritaire.

Si des opérations restent en attente :

```text
Mission terminée localement
3 changements à synchroniser
```

L’opérateur peut quitter l’écran.

La mission ne doit pas être présentée comme entièrement synchronisée avant confirmation du serveur.

---

# Fermeture de session

La déconnexion ne doit pas supprimer les données non synchronisées.

Si des opérations sont en attente :

- informer l’utilisateur;
- conserver la file;
- tenter une dernière synchronisation;
- permettre une reprise ultérieure;
- protéger les données locales.

La politique exacte de changement de compte doit empêcher qu’un autre opérateur envoie accidentellement les opérations du premier.

---

# Changement d’opérateur

Lorsqu’un autre opérateur se connecte sur le même appareil :

- les files doivent être séparées par utilisateur;
- les missions doivent être isolées;
- aucune opération ne doit être mélangée;
- les données sensibles du premier opérateur doivent rester protégées.

---

# État de synchronisation dans l’interface

L’interface doit afficher un indicateur discret.

Exemples :

```text
● Synchronisé
```

```text
↻ Synchronisation
```

```text
☁ 3 en attente
```

```text
⚠ Synchronisation requise
```

Un état normal ne doit pas attirer fortement l’attention.

Une erreur durable doit être visible.

---

# Mode hors ligne

Lorsque le réseau est perdu :

```text
Réseau indisponible
      ↓
Mode hors ligne
      ↓
Actions enregistrées localement
      ↓
File en attente
```

Au retour du réseau :

```text
Réseau disponible
      ↓
Validation de la connexion
      ↓
Reprise de la synchronisation
      ↓
Confirmation
```

Le détail complet du fonctionnement hors ligne est défini dans :

```text
08-Offline-Mode.md
```

---

# Communication avec MissionContext

Le moteur expose au MissionContext :

```ts
type SynchronizationState = {
  status:
    | 'SYNCED'
    | 'SYNCING'
    | 'OFFLINE'
    | 'PENDING'
    | 'ERROR'

  pendingCount: number
  failedCount: number
  lastSuccessfulSyncAt?: string
  lastError?: string
}
```

Les composants visuels lisent cet état.

Ils ne lisent jamais directement la file de synchronisation.

---

# Événements reçus

Exemples :

```text
MissionStarted
MissionPaused
MissionResumed
MissionCompleted

ItemEnRoute
ItemApproaching
ItemStarted
ItemCompleted
ItemProblem

NoteCreated
NoteUpdated
ProblemCreated
ProblemResolved

NetworkLost
NetworkRecovered
AppStarted
AppForegrounded
ManualSyncRequested
```

---

# Événements publiés

Exemples :

```text
SyncQueued
SyncStarted
SyncOperationConfirmed
SyncBatchCompleted
SyncFailed
SyncBlocked
SyncIdle

NetworkUnavailable
NetworkAvailable

ConflictDetected
ConflictResolved
```

Le moteur ne publie aucune transition métier.

---

# Journalisation

Chaque tentative doit être journalisée.

Informations minimales :

- operationId;
- type;
- mission;
- MissionItem;
- tentative;
- heure;
- résultat;
- code HTTP;
- durée;
- erreur;
- prochaine tentative.

Exemple :

```text
09:04:12
ITEM_COMPLETED
Operation abc-123
Attempt 2
CONFIRMED
Duration 342 ms
```

---

# Observabilité

Le mode Développement doit permettre de consulter :

- nombre d’opérations en attente;
- opérations échouées;
- dernière synchronisation;
- prochaine tentative;
- taille de la file;
- réseau détecté;
- durée moyenne;
- derniers codes d’erreur;
- conflits;
- stockage utilisé.

Il doit aussi permettre :

- forcer une synchronisation;
- simuler une perte réseau;
- réessayer une opération;
- exporter le journal;
- inspecter le payload;
- vider uniquement les données de test.

Les données de production ne doivent pas pouvoir être supprimées facilement.

---

# Sécurité

Toutes les communications doivent utiliser HTTPS.

Le moteur ne doit jamais journaliser :

- jeton d’authentification complet;
- mot de passe;
- informations de paiement;
- données sensibles inutiles.

Les opérations locales doivent être protégées selon les capacités de la plateforme.

---

# Protection des données

La file locale peut contenir :

- adresses;
- notes;
- événements;
- problèmes;
- coordonnées GPS.

Elle doit être stockée dans un espace privé de l’application.

Elle ne doit pas être exposée dans un stockage public accessible aux autres applications.

---

# Nettoyage

Une opération confirmée peut être supprimée de la file active.

Cependant, un résumé peut être conservé dans le journal.

Politique possible :

```text
Opérations confirmées dans la queue : suppression rapide
Journaux techniques : conservation limitée
Données métier : conservation selon la mission
```

La politique finale doit être configurable.

---

# Limites de stockage

Le moteur doit surveiller la taille du stockage local.

Si l’espace devient insuffisant :

1. conserver les données métier;
2. supprimer les caches reconstruisibles;
3. réduire les journaux;
4. différer les médias;
5. avertir l’utilisateur.

Ne jamais supprimer automatiquement une opération métier non synchronisée.

---

# Cas des résidences rapprochées

Lorsqu’une transition automatique termine une résidence et démarre immédiatement la suivante :

```text
ITEM_COMPLETED A
      ↓
ITEM_STARTED B
```

Les deux opérations doivent être écrites localement dans le bon ordre.

Le temps de déplacement fictif de cinq secondes doit être synchronisé avec un indicateur explicite.

Exemple :

```ts
{
  travelTimeSeconds: 5,
  travelTimeSource: 'ADJACENT_RESIDENCE_FALLBACK'
}
```

Le serveur ne doit pas interpréter ce temps comme une mesure GPS normale.

---

# Cas d’un problème

Lorsqu’un problème est enregistré :

```text
Problème local
      ↓
MissionItem = PROBLÈME
      ↓
SyncOperation créée
      ↓
Résidence conservée dans la liste
```

Si l’opérateur continue vers la résidence suivante, les opérations doivent conserver l’ordre exact.

---

# Cas d’une modification serveur

Si RECA App modifie une mission pendant son exécution :

- ne pas remplacer silencieusement le contexte local;
- télécharger les changements compatibles;
- appliquer uniquement ce qui ne contredit pas les opérations effectuées;
- signaler les changements importants;
- conserver les données terrain.

Exemples de changements compatibles :

- nouvelle note;
- alerte ajoutée;
- correction d’une instruction;
- ajout d’une résidence future.

Exemples de changements sensibles :

- retrait de la résidence active;
- réassignation de mission;
- changement d’opérateur;
- suppression d’une mission en cours.

Ces changements doivent être traités explicitement.

---

# Tests obligatoires

Le Synchronization Engine doit être testé dans les scénarios suivants :

- mission entièrement en ligne;
- mission entièrement hors ligne;
- réseau intermittent;
- serveur indisponible;
- authentification expirée;
- fermeture pendant une synchronisation;
- redémarrage de l’appareil;
- doublon de requête;
- réponse serveur perdue;
- lot partiellement accepté;
- opération invalide;
- conflit de version;
- résidences rapprochées;
- problème avec photo;
- espace disque faible;
- horloge appareil incorrecte;
- changement d’opérateur;
- fin de mission avec file non vide;
- retour réseau après plusieurs heures;
- plusieurs centaines d’opérations en attente.

---

# Règles importantes

Toute action métier est enregistrée localement avant synchronisation.

L’interface ne dépend jamais de la réponse du serveur.

Chaque opération possède un identifiant unique.

Chaque opération doit être idempotente.

L’ordre métier doit être respecté.

Une erreur réseau ne supprime jamais une opération.

Une opération confirmée ne doit pas être rejouée comme nouvelle.

Aucun conflit important ne doit être résolu silencieusement.

La mission doit pouvoir continuer hors ligne.

La synchronisation doit reprendre automatiquement.

Les données métier sont prioritaires sur les médias et les diagnostics.

---

# Flux complet

```text
Action
      ↓
Validation par la State Machine
      ↓
Transaction locale
      ├── Mise à jour de l’entité
      └── Création de SyncOperation
      ↓
Mise à jour du MissionContext
      ↓
Interface mise à jour
      ↓
Synchronization Engine
      ↓
Réseau disponible ?
      ├── Non → Attente
      └── Oui
            ↓
        Envoi
            ↓
        Confirmation serveur
            ↓
        Opération confirmée
            ↓
        Mise à jour de l’état global
```

---

# Objectif final

Le Synchronization Engine doit rendre la connexion réseau presque invisible pour l’opérateur.

L’opérateur doit pouvoir effectuer une mission complète sans se demander si chaque action a été transmise immédiatement.

Le moteur doit garantir :

- continuité de travail;
- intégrité des données;
- reprise automatique;
- absence de doublons;
- ordre cohérent;
- traçabilité;
- fonctionnement hors ligne;
- résolution contrôlée des erreurs.

La synchronisation ne doit jamais devenir un obstacle à l’exécution de la mission.

Elle doit travailler silencieusement en arrière-plan et protéger chaque action effectuée sur le terrain.