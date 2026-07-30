# 08-Offline-Mode.md

# RECA Operator
## Offline Mode

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Le mode hors ligne permet à RECA Operator de poursuivre une mission complète sans connexion Internet.

L’application doit rester opérationnelle lorsque :

- le réseau cellulaire est absent;
- le signal est faible;
- la connexion est intermittente;
- le serveur est temporairement indisponible;
- l’appareil est connecté à un réseau sans accès Internet;
- l’authentification ne peut pas être rafraîchie immédiatement.

La perte du réseau ne doit jamais empêcher l’opérateur :

- de consulter sa mission;
- de voir les résidences;
- d’utiliser le GPS;
- de suivre le chemin suggéré déjà disponible;
- de commencer une résidence;
- de terminer une résidence;
- de signaler un problème;
- d’ajouter une note;
- d’entendre les annonces vocales locales;
- de terminer la mission.

L’objectif principal est simple :

**Une tempête ne doit jamais être interrompue par une panne de réseau.**

---

# Philosophie

RECA Operator est une application local-first.

Le réseau améliore l’expérience.

Il ne contrôle pas l’exécution de la mission.

```text
Mission téléchargée
      ↓
Données conservées localement
      ↓
Réseau perdu
      ↓
Mission continue normalement
      ↓
Actions enregistrées localement
      ↓
Réseau rétabli
      ↓
Synchronisation automatique
```

Le mode hors ligne ne constitue pas une version réduite de l’application.

Il constitue un mode normal prévu dès l’architecture.

---

# Principe fondamental

Une mission commencée doit toujours pouvoir être terminée localement.

Le système ne doit jamais afficher un écran bloquant du type :

```text
Connexion requise pour continuer
```

pendant une mission active, sauf si une donnée absolument indispensable n’a jamais été téléchargée.

---

# Responsabilités

Le système Offline Mode est responsable de :

- détecter la perte réelle de connectivité;
- activer l’état hors ligne;
- conserver toutes les actions localement;
- informer discrètement l’opérateur;
- rendre accessibles les données de mission;
- maintenir les chronomètres;
- maintenir la State Machine;
- maintenir le GPS Engine;
- maintenir le Voice Engine local;
- maintenir la file de synchronisation;
- utiliser les ressources cartographiques disponibles;
- reprendre automatiquement les communications;
- éviter les changements brusques d’interface;
- protéger les données pendant une longue interruption.

Le système Offline Mode n’est pas responsable de :

- décider des transitions métier;
- modifier directement un MissionItem;
- calculer les distances;
- résoudre les conflits de synchronisation;
- créer une mission distante;
- télécharger une mission jamais mise en cache;
- remplacer le Synchronization Engine.

---

# Modules concernés

Le mode hors ligne concerne tous les modules suivants :

```text
MissionContext
GPS Engine
State Machine
Map Engine
Voice Engine
Synchronization Engine
Stockage local
Interface utilisateur
Authentification
Journalisation
```

Chaque module doit définir explicitement son comportement sans réseau.

---

# Détection du mode hors ligne

Le système ne doit pas se fier uniquement à l’icône réseau du téléphone.

Les états suivants doivent être distingués :

```text
ONLINE
DEGRADED
OFFLINE
SERVER_UNAVAILABLE
AUTHENTICATION_DEGRADED
RECOVERING
```

---

# État ONLINE

Le réseau et le serveur sont accessibles.

Les opérations peuvent être synchronisées normalement.

```text
Connexion active
Synchronisé
```

---

# État DEGRADED

Une connexion existe, mais elle est instable ou trop lente.

Exemples :

- pertes fréquentes;
- temps de réponse très élevé;
- requêtes interrompues;
- faible signal;
- plusieurs erreurs temporaires.

L’application continue de travailler localement.

Elle peut réduire la fréquence des tentatives de synchronisation.

---

# État OFFLINE

Aucune connexion Internet fonctionnelle n’est disponible.

Toutes les actions sont enregistrées localement.

Aucune action métier n’est bloquée.

---

# État SERVER_UNAVAILABLE

Internet fonctionne, mais le serveur RECA est inaccessible.

Ce cas doit être traité comme un mode hors ligne opérationnel.

L’interface peut afficher :

```text
Serveur temporairement inaccessible
```

Les actions continuent localement.

---

# État AUTHENTICATION_DEGRADED

La session locale existe, mais le jeton distant ne peut pas être renouvelé.

Pendant une mission déjà chargée :

- la mission continue;
- les actions restent locales;
- les tentatives de synchronisation sont suspendues ou réessayées;
- l’utilisateur n’est pas déconnecté brutalement.

---

# État RECOVERING

Le réseau vient de revenir.

Le système vérifie :

- la connectivité réelle;
- l’accès au serveur;
- l’authentification;
- la file de synchronisation;
- les changements distants.

L’application ne doit pas afficher immédiatement `En ligne` avant cette validation.

---

# Activation du mode hors ligne

Le passage hors ligne suit ce flux :

```text
Échec réseau détecté
      ↓
Vérification secondaire
      ↓
Connexion réellement indisponible ?
      ├── Non → Conserver l’état actuel
      └── Oui
            ↓
        Offline Mode activé
            ↓
        MissionContext mis à jour
            ↓
        Interface informée
            ↓
        Synchronisation suspendue
            ↓
        Mission continue localement
```

---

# Validation de la perte réseau

Une seule requête échouée ne doit pas suffire à déclarer l’application hors ligne.

Le moteur peut utiliser :

- état réseau du système;
- test d’accès Internet;
- test d’accès au serveur;
- plusieurs échecs consécutifs;
- temporisation;
- dernier succès connu.

Les valeurs exactes doivent être configurables.

---

# Interface hors ligne

L’état hors ligne doit être visible, mais non bloquant.

Exemples :

```text
Hors ligne
```

```text
3 changements en attente
```

```text
Données enregistrées sur l’appareil
```

L’indicateur peut apparaître dans le panneau supérieur compact.

Il ne doit pas masquer la carte.

---

# Couleur de l’état hors ligne

Le mode hors ligne est un état d’attention, pas nécessairement une erreur critique.

Couleur recommandée :

- ambre;
- orange;
- jaune contrôlé.

Le rouge doit être réservé à une situation réellement critique :

- stockage local indisponible;
- données non enregistrées;
- mission corrompue;
- perte de données potentielle.

---

# Message initial

Lors du passage hors ligne, afficher un message court.

Exemple :

```text
Mode hors ligne
La mission continue sur cet appareil.
```

Le message disparaît automatiquement après quelques secondes.

Un indicateur compact demeure visible.

---

# Annonce vocale

Le Voice Engine peut annoncer une seule fois :

```text
Mode hors ligne activé.
```

Cette annonce ne doit pas être répétée tant que le réseau ne revient pas.

---

# Données requises avant une mission

Avant qu’une mission puisse être considérée prête hors ligne, les données suivantes doivent être disponibles localement :

- mission;
- MissionItems;
- ordre des résidences;
- adresses;
- coordonnées GPS;
- zones de détection;
- alertes;
- instructions opérationnelles;
- paramètres GPS;
- informations de l’opérateur;
- informations d’équipement nécessaires;
- état initial de la mission;
- assets essentiels de l’interface;
- configuration vocale;
- données cartographiques prévues lorsque disponibles.

---

# État de préparation hors ligne

Chaque mission doit posséder un état de préparation.

```text
NOT_AVAILABLE
DOWNLOADING
PARTIALLY_READY
READY
ERROR
```

---

# État NOT_AVAILABLE

La mission n’est pas présente localement.

Elle ne peut pas être exécutée hors ligne.

---

# État DOWNLOADING

Les données essentielles sont en cours de téléchargement.

La mission ne doit pas être présentée comme prête.

---

# État PARTIALLY_READY

Certaines données sont disponibles, mais il manque des éléments.

Exemples :

- cartes hors ligne non téléchargées;
- média facultatif manquant;
- données secondaires absentes.

La mission peut être autorisée uniquement si toutes les données métier essentielles sont présentes.

---

# État READY

Toutes les données nécessaires à l’exécution sont disponibles localement.

L’interface peut afficher :

```text
Disponible hors ligne
```

---

# État ERROR

Le téléchargement ou la validation locale a échoué.

L’application doit indiquer précisément ce qui manque.

---

# Vérification avant le départ

Avant de démarrer une mission, l’application doit valider :

```text
Mission présente
MissionItems présents
Coordonnées présentes
Ordre valide
Stockage local fonctionnel
File de synchronisation fonctionnelle
Paramètres chargés
```

Les cartes hors ligne sont fortement recommandées, mais leur absence ne doit pas nécessairement bloquer la mission si les données opérationnelles sont suffisantes.

---

# Stockage local

Toutes les données nécessaires doivent être enregistrées dans un stockage persistant privé.

Le stockage doit survivre à :

- fermeture de l’application;
- redémarrage du téléphone;
- plantage;
- perte du réseau;
- mise en arrière-plan;
- batterie déchargée.

Les données ne doivent pas dépendre uniquement de la mémoire React.

---

# Données conservées localement

Le stockage local doit contenir au minimum :

## Mission

- identifiant;
- statut;
- opérateur;
- équipement;
- date;
- heure;
- route;
- configuration.

## MissionItems

- ordre;
- adresse;
- coordonnées;
- état;
- chronomètres;
- alertes;
- notes;
- problèmes;
- transitions.

## Synchronisation

- opérations en attente;
- opérations échouées;
- séquences;
- identifiants d’idempotence.

## Système

- session;
- paramètres;
- dernière connectivité connue;
- version des données;
- journaux essentiels.

---

# Écriture locale obligatoire

Toute action doit être confirmée uniquement après une écriture locale réussie.

```text
Action demandée
      ↓
Validation métier
      ↓
Écriture locale
      ↓
Succès
      ├── Oui → Interface mise à jour
      └── Non → Alerte critique
```

Le mode hors ligne n’est fiable que si le stockage local est fiable.

---

# Échec d’écriture locale

Une incapacité à enregistrer localement constitue une erreur critique.

Exemples :

- stockage plein;
- base locale corrompue;
- permission inaccessible;
- transaction échouée;
- système de fichiers indisponible.

Dans ce cas :

- empêcher les transitions risquant d’être perdues;
- afficher une alerte rouge;
- journaliser;
- proposer une action de récupération;
- ne jamais prétendre que l’action est enregistrée.

Exemple :

```text
Enregistrement impossible
Libérez de l’espace ou redémarrez l’application.
```

---

# State Machine hors ligne

La State Machine fonctionne de manière identique en ligne et hors ligne.

Les règles métier ne changent pas.

```text
GPS Event
      ↓
State Machine
      ↓
Transition locale
      ↓
SyncOperation en attente
```

Le réseau ne participe jamais à la décision immédiate.

---

# GPS Engine hors ligne

Le GPS de l’appareil ne dépend pas d’Internet.

Le GPS Engine doit continuer à :

- recevoir les positions;
- calculer les distances;
- détecter les rayons;
- valider le cap;
- publier les événements;
- déclencher les transitions.

Une perte réseau ne doit jamais être interprétée comme une perte GPS.

---

# GPS versus réseau

Ces états sont indépendants.

Exemples :

```text
GPS actif + réseau absent
```

La mission continue normalement.

```text
GPS perdu + réseau actif
```

Les transitions GPS automatiques sont suspendues.

```text
GPS perdu + réseau absent
```

Les actions manuelles restent disponibles.

L’interface doit afficher séparément :

- état GPS;
- état réseau.

---

# Map Engine hors ligne

Le comportement de la carte dépend des ressources disponibles.

Le Map Engine doit pouvoir utiliser :

- tuiles déjà mises en cache;
- cartes hors ligne téléchargées;
- données de mission locales;
- géométrie de route enregistrée;
- marqueurs calculés localement.

---

# Carte disponible

Lorsque les cartes nécessaires sont disponibles :

- affichage normal;
- caméra normale;
- marqueurs normaux;
- route suggérée disponible;
- bâtiments et rues selon les données téléchargées.

---

# Carte partiellement disponible

Lorsque certaines tuiles manquent :

- conserver les données déjà affichées;
- ne pas vider brutalement la carte;
- afficher les marqueurs locaux;
- afficher la route enregistrée;
- indiquer discrètement que certaines données cartographiques sont limitées.

---

# Carte indisponible

Si aucune carte ne peut être affichée :

- conserver une surface sombre cohérente;
- afficher le tracteur;
- afficher la résidence active;
- afficher la distance;
- afficher les prochaines résidences;
- permettre toutes les actions métier;
- afficher un message non bloquant.

Exemple :

```text
Carte non disponible hors ligne
Les données de mission restent accessibles.
```

---

# Route suggérée hors ligne

Le chemin suggéré peut fonctionner selon plusieurs niveaux.

## Niveau 1 — Route déjà calculée

La géométrie de route est enregistrée localement.

Elle continue d’être affichée.

## Niveau 2 — Routage hors ligne disponible

Le moteur peut recalculer localement à partir des données téléchargées.

## Niveau 3 — Routage indisponible

Le système conserve :

- la dernière route valide;
- les marqueurs;
- la distance directe informative;
- l’ordre des résidences.

Il ne doit pas inventer un nouveau chemin routier.

---

# Recalcul de route

En mode hors ligne, un recalcul Mapbox distant peut être impossible.

Le système doit donc éviter de dépendre d’un recalcul après chaque transition.

Avant la mission, il est recommandé de conserver :

- géométrie vers les prochaines résidences;
- segments essentiels;
- ordre de route;
- dernière route connue.

---

# Données cartographiques hors ligne

Lorsqu’une mission est préparée, le système peut télécharger des secteurs autour :

- de chaque résidence;
- de la route principale;
- des segments entre résidences;
- des zones de départ et de retour.

Rayon initial recommandé autour d’une résidence :

```text
500 à 1000 mètres
```

La valeur finale dépendra :

- de la densité urbaine;
- de la taille de la mission;
- du stockage;
- des limites Mapbox;
- de la plateforme.

---

# Téléchargement des cartes

Le téléchargement doit afficher :

- progression;
- taille estimée;
- état;
- erreur;
- possibilité de réessayer.

Exemple :

```text
Préparation hors ligne
Cartes : 78 %
Mission : prête
```

Le téléchargement des cartes ne doit pas bloquer l’accès aux données déjà disponibles.

---

# Nettoyage des cartes

Les cartes hors ligne peuvent occuper beaucoup d’espace.

Une politique de nettoyage doit permettre de supprimer :

- anciennes zones;
- missions terminées;
- caches reconstruisibles;
- données expirées.

Ne jamais supprimer :

- carte nécessaire à une mission active;
- données d’une mission non synchronisée;
- ressources explicitement conservées.

---

# Voice Engine hors ligne

Le Voice Engine doit utiliser la synthèse vocale locale.

Doivent fonctionner hors ligne :

- prochaine résidence;
- état courant;
- alertes locales;
- adresse;
- problème enregistré;
- mission terminée;
- GPS perdu;
- GPS rétabli;
- mode hors ligne.

Aucune annonce essentielle ne doit dépendre d’un service distant.

---

# Authentification hors ligne

Une mission déjà téléchargée doit rester accessible pendant une interruption réseau raisonnable.

Le système peut utiliser :

- session locale sécurisée;
- jeton déjà validé;
- identité locale de l’opérateur;
- durée de grâce contrôlée.

---

# Première connexion

La première connexion à l’application nécessite généralement un réseau.

Sans session locale existante, l’application ne doit pas inventer une authentification.

Message possible :

```text
Connexion Internet requise pour la première connexion.
```

---

# Session existante

Si l’opérateur s’est déjà authentifié et possède une mission active :

- ne pas le déconnecter lors d’une perte réseau;
- continuer la mission;
- conserver les opérations;
- tenter le renouvellement plus tard.

---

# Expiration de la session

Si le jeton expire hors ligne :

- la mission continue localement;
- la synchronisation reste en attente;
- l’opérateur demeure identifié localement;
- une reconnexion sera demandée au retour du réseau si nécessaire.

La mission ne doit pas être verrouillée brutalement.

---

# Déconnexion hors ligne

La déconnexion pendant qu’une mission contient des données non synchronisées doit être contrôlée.

L’application doit afficher :

```text
Des changements sont encore enregistrés sur cet appareil.
```

Options possibles :

- rester connecté;
- tenter de synchroniser;
- quitter en conservant les données;
- annuler.

Les données ne doivent jamais être supprimées automatiquement.

---

# Changement d’utilisateur hors ligne

Un changement d’opérateur ne doit pas être autorisé simplement si des données non synchronisées de l’opérateur précédent existent et ne peuvent pas être isolées correctement.

Les données doivent être séparées par :

- utilisateur;
- mission;
- session;
- organisation.

Aucune opération ne doit être attribuée au mauvais compte.

---

# Synchronisation pendant le mode hors ligne

Le Synchronization Engine conserve toutes les opérations avec l’état :

```text
PENDING
```

ou :

```text
WAITING_FOR_NETWORK
```

Il ne doit pas multiplier inutilement les tentatives lorsque le réseau est clairement absent.

---

# File d’attente visible

L’interface peut afficher :

```text
4 changements en attente
```

L’opérateur ne doit pas avoir à ouvrir un écran technique pour comprendre que ses actions sont sauvegardées.

---

# Retour du réseau

Le retour réseau suit le flux suivant :

```text
Réseau détecté
      ↓
Validation Internet
      ↓
Validation serveur
      ↓
Validation authentification
      ↓
État RECOVERING
      ↓
Synchronisation des opérations
      ↓
Téléchargement des changements compatibles
      ↓
État ONLINE
```

---

# Message de retour

L’interface peut afficher :

```text
Connexion rétablie
Synchronisation en cours
```

Puis :

```text
Synchronisé
```

Le message ne doit pas interrompre le travail.

---

# Reprise automatique

Aucune action manuelle ne doit être nécessaire dans le cas normal.

Le système doit automatiquement :

- reprendre la file;
- respecter les séquences;
- éviter les doublons;
- résoudre les erreurs temporaires;
- mettre à jour l’indicateur.

---

# Annonce vocale de retour

Le Voice Engine peut annoncer :

```text
Connexion rétablie.
```

La synchronisation réussie peut rester silencieuse par défaut.

---

# Changements distants au retour

Pendant la période hors ligne, RECA App peut avoir modifié la mission.

Exemples :

- note ajoutée;
- alerte ajoutée;
- résidence future modifiée;
- mission réassignée;
- résidence annulée.

Le système doit utiliser les règles de conflit définies dans :

```text
07-Synchronization.md
```

---

# Données terrain prioritaires

Les actions déjà réalisées localement ne doivent jamais être écrasées.

Exemples :

- heure réelle de début;
- heure réelle de fin;
- problème enregistré;
- note de l’opérateur;
- statut terminé.

---

# Changements futurs compatibles

Les changements concernant des MissionItems futurs peuvent être appliqués lorsqu’ils ne contredisent pas la mission locale.

Exemples :

- nouvelle alerte;
- nouvelle instruction;
- correction d’adresse;
- changement d’ordre futur.

---

# Changements sensibles

Les modifications suivantes nécessitent un traitement explicite :

- suppression de la mission active;
- réassignation de l’opérateur;
- annulation de la résidence active;
- retrait d’une résidence déjà traitée;
- changement d’organisation;
- changement majeur d’équipement.

L’application ne doit pas interrompre silencieusement la mission.

---

# Chronomètres hors ligne

Tous les chronomètres doivent fonctionner sans réseau.

Ils doivent être calculés à partir d’horodatages persistants.

Ne jamais dépendre uniquement d’un intervalle JavaScript en mémoire.

Exemple :

```text
phaseStartedAt = 08:15:34
heure actuelle = 08:21:16
durée = 5 min 42 s
```

Après redémarrage, la durée doit être reconstruite.

---

# Horloge de l’appareil

Une modification importante de l’heure système peut fausser les chronomètres.

Le moteur doit conserver lorsque possible :

- horodatage UTC;
- heure locale;
- temps monotone;
- heure de démarrage;
- indicateur d’anomalie.

Les règles précises seront définies dans l’implémentation.

---

# Redémarrage hors ligne

Si l’application redémarre sans réseau :

```text
Ouverture
      ↓
Session locale chargée
      ↓
Mission locale chargée
      ↓
MissionContext reconstruit
      ↓
State Machine vérifiée
      ↓
Chronomètres reconstruits
      ↓
Offline Mode restauré
      ↓
Mission continue
```

Aucune communication serveur ne doit être nécessaire pour reprendre.

---

# Redémarrage du téléphone

Après le redémarrage de l’appareil :

- la mission doit rester disponible;
- les opérations doivent rester dans la file;
- les états doivent être restaurés;
- le chronomètre doit reprendre;
- l’opérateur doit être informé de l’état hors ligne.

Les capacités d’exécution en arrière-plan dépendront du système d’exploitation.

---

# Application en arrière-plan

Lorsque l’application passe en arrière-plan :

- les données restent persistantes;
- le GPS continue si autorisé;
- les annonces continuent si autorisées;
- les chronomètres sont calculés par horodatage;
- les opérations restent locales;
- aucun état ne doit être perdu.

---

# Écran verrouillé

Le verrouillage de l’écran ne doit pas être interprété comme une pause de mission.

Selon les autorisations de la plateforme :

- le GPS continue;
- la voix continue;
- les chronomètres continuent;
- les transitions continuent;
- la mission demeure active.

---

# Batterie et mode économie d’énergie

Le mode économie d’énergie peut limiter :

- GPS en arrière-plan;
- fréquence des mises à jour;
- animations;
- synchronisation;
- rafraîchissements.

RECA Operator doit :

- détecter lorsque possible les limitations;
- avertir l’opérateur;
- réduire les fonctions non essentielles;
- conserver la logique métier;
- protéger les écritures locales.

---

# Batterie faible

Une alerte peut apparaître lorsque la batterie devient faible.

Exemple :

```text
Batterie faible
Branchez l’appareil pour poursuivre la mission.
```

La batterie faible n’est pas directement liée au réseau, mais représente un risque important en mode autonome.

---

# Stockage faible

L’application doit surveiller l’espace disponible.

Priorité de conservation :

1. transitions métier;
2. MissionItems;
3. problèmes et notes;
4. file de synchronisation;
5. journaux essentiels;
6. cartes hors ligne;
7. médias;
8. caches secondaires.

Les caches et cartes anciennes peuvent être nettoyés avant toute donnée métier.

---

# Médias hors ligne

Les photos et pièces jointes doivent être enregistrées localement.

Chaque média doit posséder :

- identifiant;
- chemin local;
- MissionItem;
- type;
- checksum;
- taille;
- statut de synchronisation;
- horodatage.

---

# Média en attente

L’interface doit indiquer discrètement :

```text
Photo en attente de synchronisation
```

Le problème associé reste valide même si le média n’est pas encore envoyé.

---

# Compression des médias

Avant stockage ou synchronisation, les médias peuvent être :

- redimensionnés;
- compressés;
- convertis;
- limités en résolution.

La compression ne doit pas rendre la preuve inutilisable.

---

# Longue période hors ligne

Le système doit supporter plusieurs heures sans réseau.

Il doit être capable de conserver :

- toutes les transitions;
- les problèmes;
- les notes;
- les événements critiques;
- plusieurs médias;
- la mission complète.

---

# Limites prévues

Une limite de stockage doit être définie et surveillée.

L’application doit avertir avant d’atteindre une situation critique.

Exemple :

```text
Espace de stockage faible
Les photos seront temporairement limitées.
```

Les transitions métier doivent continuer.

---

# Mission entièrement hors ligne

Scénario attendu :

```text
Mission téléchargée à l’avance
      ↓
Opérateur quitte le réseau
      ↓
Mission démarrée
      ↓
28 résidences effectuées
      ↓
Problèmes et notes enregistrés
      ↓
Mission terminée localement
      ↓
Réseau disponible plusieurs heures plus tard
      ↓
Synchronisation complète
```

Ce scénario doit être officiellement supporté.

---

# Démarrage d’une mission hors ligne

Une mission peut être démarrée hors ligne si :

- elle est `READY`;
- elle appartient à l’opérateur local;
- toutes les données essentielles sont présentes;
- le stockage fonctionne;
- aucune incohérence critique n’existe.

---

# Mission non téléchargée

Si aucune mission locale n’est présente et que le réseau est absent :

```text
Aucune mission disponible hors ligne
Reconnectez-vous pour récupérer une mission.
```

L’application ne peut pas récupérer une mission inconnue sans réseau.

---

# Fin de mission hors ligne

La mission peut être terminée localement.

L’écran de fin doit indiquer :

```text
Mission terminée sur cet appareil
Synchronisation en attente
```

L’opérateur peut fermer l’application.

La mission sera transmise au retour du réseau.

---

# Protection contre la suppression

Une mission terminée mais non synchronisée ne doit pas être supprimée du stockage local.

Elle doit être marquée :

```text
COMPLETED_LOCAL_PENDING_SYNC
```

Après confirmation du serveur :

```text
COMPLETED_SYNCED
```

---

# Nettoyage après synchronisation

Une mission ne peut être nettoyée que lorsque :

- toutes les opérations sont confirmées;
- les médias obligatoires sont confirmés ou explicitement abandonnés;
- aucun conflit n’est ouvert;
- aucune erreur bloquante n’existe;
- la politique de rétention le permet.

---

# MissionContext hors ligne

Le MissionContext expose :

```ts
type OfflineState = {
  status:
    | 'ONLINE'
    | 'DEGRADED'
    | 'OFFLINE'
    | 'SERVER_UNAVAILABLE'
    | 'AUTHENTICATION_DEGRADED'
    | 'RECOVERING'

  since?: string
  pendingOperations: number
  pendingMedia: number

  missionAvailableOffline: boolean
  mapsAvailableOffline: boolean
  lastOnlineAt?: string
  lastServerContactAt?: string
}
```

Les composants visuels lisent cet état.

Ils ne testent pas directement la connexion.

---

# Événements reçus

Exemples :

```text
NetworkStateChanged
InternetCheckFailed
InternetCheckSucceeded
ServerCheckFailed
ServerCheckSucceeded
AuthenticationRefreshFailed
AuthenticationRestored

AppStarted
AppForegrounded
AppBackgrounded

MissionDownloaded
MissionCacheValidated
OfflineMapsDownloaded
StorageLow
StorageRecovered
```

---

# Événements publiés

Exemples :

```text
OfflineModeActivated
OfflineModeDeactivated
ConnectivityDegraded
ConnectivityRecovered
ServerUnavailable
ServerRecovered

MissionOfflineReady
MissionOfflineIncomplete
OfflineMapsReady
OfflineMapsUnavailable

LocalStorageCritical
PendingOperationsChanged
```

Le système ne publie aucune transition métier de résidence.

---

# Interface de développement

Le mode Développement doit permettre d’afficher :

- état réseau système;
- état Internet;
- état serveur;
- état d’authentification;
- durée hors ligne;
- dernière connexion;
- Mission prête hors ligne;
- cartes disponibles;
- taille des cartes;
- opérations en attente;
- médias en attente;
- stockage disponible;
- dernière synchronisation.

---

# Simulations

Le mode Développement doit permettre de simuler :

- absence de réseau;
- réseau lent;
- serveur indisponible;
- authentification expirée;
- carte manquante;
- stockage faible;
- retour réseau;
- conflit au retour;
- plusieurs heures hors ligne.

Les simulations doivent utiliser les mêmes mécanismes que la production lorsque possible.

---

# Journalisation

Chaque changement de connectivité doit être journalisé.

Informations minimales :

- ancien état;
- nouvel état;
- heure;
- cause;
- état réseau système;
- accès Internet;
- accès serveur;
- nombre d’opérations en attente;
- Mission active;
- durée de l’interruption.

Exemple :

```text
08:42:17
ONLINE → OFFLINE
Internet check failed
Pending operations: 3
Mission: 24-01-15
```

---

# Protection de la vie privée

Les données conservées hors ligne peuvent inclure :

- adresses;
- coordonnées GPS;
- notes;
- problèmes;
- photos;
- données d’opérateur.

Elles doivent être conservées dans l’espace privé de l’application.

Les données sensibles doivent être protégées selon les capacités du système.

---

# Sécurité

Le stockage local ne doit pas contenir en clair :

- mot de passe;
- jeton complet dans les journaux;
- informations de paiement;
- secrets API;
- clés serveur.

Les identifiants nécessaires doivent utiliser le stockage sécurisé de la plateforme.

---

# Conflit avec une autre session

Si la même mission est exécutée sur deux appareils, le retour en ligne peut produire un conflit important.

Le système doit détecter :

- deux opérateurs;
- deux sessions;
- transitions concurrentes;
- MissionItems terminés différemment.

Il ne doit jamais fusionner aveuglément ces données.

Une intervention administrative peut être requise.

---

# Règles de priorité

Lors d’une situation dégradée, le système doit préserver dans cet ordre :

```text
1. Intégrité des données métier
2. State Machine
3. GPS et sécurité opérationnelle
4. Chronomètres
5. Alertes
6. Synchronisation
7. Carte détaillée
8. Médias
9. Animations
10. Diagnostics secondaires
```

---

# Tests obligatoires

Le mode hors ligne doit être testé dans les scénarios suivants :

- mission téléchargée puis réseau coupé;
- mission commencée hors ligne;
- mission entière hors ligne;
- retour réseau après une résidence;
- retour réseau après toute la mission;
- réseau intermittent;
- Wi-Fi sans Internet;
- serveur indisponible;
- authentification expirée;
- application fermée hors ligne;
- téléphone redémarré hors ligne;
- GPS actif sans réseau;
- GPS perdu sans réseau;
- carte disponible hors ligne;
- carte partiellement disponible;
- carte totalement indisponible;
- problème avec photo hors ligne;
- stockage faible;
- stockage plein;
- plusieurs centaines d’opérations;
- plusieurs heures d’interruption;
- changement distant pendant l’interruption;
- conflit entre deux appareils;
- fin de mission non synchronisée;
- déconnexion avec données en attente.

---

# Critères de réussite

Le mode hors ligne est considéré fiable si :

- aucune transition métier n’est perdue;
- la mission continue sans réseau;
- l’opérateur comprend l’état du système;
- l’interface ne devient pas bloquante;
- le GPS continue de fonctionner;
- les chronomètres demeurent exacts;
- la voix essentielle fonctionne;
- les données survivent à un redémarrage;
- la synchronisation reprend automatiquement;
- les doublons sont évités;
- les conflits importants ne sont pas écrasés;
- une mission complète peut être réalisée hors ligne.

---

# Règles importantes

Le réseau ne contrôle jamais la mission.

Toute action est enregistrée localement.

Le mode hors ligne est un état normal.

La State Machine reste identique.

Le GPS reste indépendant du réseau.

Les chronomètres sont persistants.

La carte peut être dégradée sans bloquer la mission.

La voix utilise les capacités locales.

Les opérations non synchronisées ne sont jamais supprimées.

Le retour réseau déclenche une reprise automatique.

Une mission terminée localement reste conservée jusqu’à confirmation distante.

L’échec du stockage local est plus critique que l’échec du réseau.

---

# Flux complet

```text
Mission préparée
      ↓
Données stockées localement
      ↓
Réseau perdu
      ↓
Offline Mode
      ↓
GPS + State Machine + Voice continuent
      ↓
Transitions enregistrées localement
      ↓
SyncOperations en attente
      ↓
Mission terminée localement
      ↓
Réseau rétabli
      ↓
Validation de connexion
      ↓
Synchronisation
      ↓
Résolution des conflits
      ↓
Confirmation serveur
      ↓
Mission entièrement synchronisée
```

---

# Objectif final

Le mode hors ligne doit rendre RECA Operator fiable dans les conditions réelles du déneigement.

Une tempête peut affecter :

- le réseau;
- l’électricité;
- les serveurs;
- la mobilité;
- les communications.

L’application doit continuer à fonctionner malgré ces conditions.

L’opérateur ne doit jamais se demander s’il peut poursuivre parce que le signal cellulaire a disparu.

RECA Operator doit conserver chaque action, maintenir la mission et transmettre les résultats dès que la connexion revient.

Le réseau peut disparaître.

La mission, elle, doit continuer.