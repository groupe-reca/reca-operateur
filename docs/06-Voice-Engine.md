# 06-Voice-Engine.md

# RECA Operator
## Voice Engine

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Le Voice Engine est responsable des annonces vocales de RECA Operator.

Il transforme certains événements de mission en messages audio courts.

Son objectif est de transmettre une information importante sans obliger l’opérateur à regarder l’écran.

Le Voice Engine ne fournit pas une navigation GPS complète.

Il ne remplace pas Apple Plans, Google Maps, Waze ou un système de navigation automobile.

Il produit uniquement des annonces opérationnelles liées à la mission.

---

# Philosophie

La voix doit informer.

Elle ne doit jamais distraire.

Les annonces doivent être :

- courtes
- utiles
- prévisibles
- peu fréquentes
- compréhensibles immédiatement
- adaptées à la conduite
- utilisables sans réseau

RECA Operator doit rester silencieux lorsqu’aucune information importante ne doit être communiquée.

---

# Responsabilités

Le Voice Engine est responsable de :

- recevoir les événements vocaux
- déterminer leur priorité
- générer le texte à prononcer
- gérer la file d’attente audio
- éviter les répétitions
- respecter les délais entre les annonces
- interrompre une annonce lorsque nécessaire
- fonctionner hors ligne lorsque possible
- mémoriser les annonces déjà prononcées
- signaler les erreurs de synthèse vocale

Le Voice Engine n’est pas responsable de :

- calculer une route
- choisir la résidence active
- modifier les états de mission
- calculer les distances GPS
- afficher l’interface
- synchroniser les données
- décider si une transition métier est valide

---

# Sources des événements

Le Voice Engine reçoit des événements provenant de :

- GPS Engine
- State Machine
- MissionContext
- système de synchronisation
- système hors ligne
- actions manuelles de l’opérateur

Exemples :

```text
MissionStarted
ResidenceActivated
ResidenceApproaching
ResidenceStarted
ResidenceCompleted
ResidenceProblem
ImportantAlertDetected
GpsLost
GpsRecovered
OfflineModeActivated
SynchronizationFailed
MissionCompleted
ManualVoiceRequest
```

Le Voice Engine ne lit jamais directement Supabase.

---

# Principe de fonctionnement

```text
Événement reçu
      ↓
Vérification des paramètres
      ↓
Détermination de la priorité
      ↓
Création du message
      ↓
Vérification anti-répétition
      ↓
Ajout dans la file vocale
      ↓
Lecture audio
      ↓
Journalisation
```

---

# Types d’annonces

Le moteur doit supporter les catégories suivantes.

## Mission

Exemples :

- « Mission démarrée. »
- « Mission terminée. »
- « Aucune résidence restante. »

---

## Résidence suivante

Exemples :

- « Prochaine résidence, 224 rue Scott. »
- « Prochaine résidence, 228 rue Bellevue. »

Cette annonce est prononcée lorsqu’un nouveau MissionItem devient actif.

---

## Approche

Exemples :

- « Résidence en approche. »
- « Résidence à droite. »
- « Résidence à gauche. »
- « Entrée à environ 30 mètres. »

Les annonces gauche ou droite doivent uniquement être utilisées lorsque cette information est suffisamment fiable.

En cas d’incertitude, le moteur doit rester neutre.

---

## Début d’intervention

Exemples :

- « Intervention démarrée. »
- « Résidence en cours. »

Cette annonce doit être brève.

Elle ne doit pas répéter inutilement l’adresse si celle-ci vient d’être annoncée.

---

## Alertes de résidence

Exemples :

- « Attention, plate-bande au fond. »
- « Boîte aux lettres à droite. »
- « Entrée étroite. »
- « Ne pas bloquer le garage. »
- « Attention, obstacle signalé. »

Les alertes critiques ont priorité sur les autres annonces.

---

## Fin d’intervention

Exemples :

- « Résidence terminée. »
- « Intervention terminée. »

Cette annonce peut être suivie de l’adresse suivante.

Exemple :

« Résidence terminée. Prochaine résidence, 228 rue Bellevue. »

---

## Problèmes

Exemples :

- « Problème enregistré. »
- « Résidence conservée dans la liste des problèmes. »
- « Passage à la résidence suivante. »

Les détails sensibles ou complexes ne doivent pas être lus entièrement.

---

## GPS

Exemples :

- « Signal GPS perdu. »
- « Signal GPS rétabli. »
- « Précision GPS insuffisante. »

Ces annonces doivent être utilisées avec modération.

Le moteur ne doit pas répéter continuellement qu’un signal est perdu.

---

## Réseau et synchronisation

Exemples :

- « Mode hors ligne activé. »
- « Connexion rétablie. »
- « Synchronisation terminée. »
- « Certaines données restent à synchroniser. »

Les événements de synchronisation normaux doivent rester silencieux par défaut.

Seuls les événements importants doivent produire une annonce.

---

# Niveaux de priorité

Chaque annonce possède une priorité.

## Priorité critique

Exemples :

- danger immédiat
- GPS perdu pendant une phase sensible
- problème critique
- erreur empêchant la mission de continuer

Une annonce critique peut interrompre une annonce moins importante.

---

## Priorité élevée

Exemples :

- alerte de résidence
- entrée étroite
- obstacle
- début d’intervention
- résidence en approche

---

## Priorité normale

Exemples :

- prochaine résidence
- résidence terminée
- synchronisation terminée
- mission démarrée

---

## Priorité faible

Exemples :

- information système non urgente
- confirmation d’une action secondaire
- annonce répétée manuellement

Les annonces faibles peuvent être ignorées lorsque la file est occupée.

---

# File d’attente vocale

Les annonces sont placées dans une file ordonnée par :

1. priorité
2. heure de création
3. pertinence actuelle

Une annonce devenue inutile doit être retirée.

Exemple :

```text
« Résidence en approche »
```

ne doit pas être prononcée si la résidence est déjà passée à :

```text
EN COURS
```

avant le début de la lecture.

---

# Interruption

Une annonce peut être interrompue uniquement par une annonce de priorité supérieure.

Exemple :

```text
Annonce normale en cours
      ↓
Alerte critique reçue
      ↓
Interruption
      ↓
Lecture de l’alerte critique
```

Les annonces de même priorité ne s’interrompent pas entre elles.

---

# Anti-répétition

Le Voice Engine doit empêcher les répétitions inutiles.

Chaque annonce possède :

- un identifiant
- un type
- un MissionItem associé
- une heure de dernière lecture
- un délai minimal avant répétition

Exemples de règles :

```text
GPS_LOST
Une seule annonce tant que le GPS n’est pas rétabli.

APPROACHING_RESIDENCE
Une seule annonce par résidence.

RESIDENCE_ALERT
Une seule annonce automatique par alerte et par résidence.

OFFLINE_MODE
Une seule annonce lors du passage hors ligne.
```

---

# Cooldown global

Le moteur doit appliquer un délai minimal entre deux annonces non critiques.

Valeur initiale recommandée :

```text
3 secondes
```

Ce délai doit être configurable.

Les annonces critiques peuvent ignorer ce délai.

---

# Regroupement des messages

Lorsque plusieurs événements liés surviennent presque simultanément, le moteur doit les regrouper.

Exemple non souhaité :

```text
« Résidence terminée. »
« Prochaine résidence. »
« 228 rue Bellevue. »
```

Exemple souhaité :

```text
« Résidence terminée. Prochaine résidence, 228 rue Bellevue. »
```

Le regroupement doit réduire le nombre total d’annonces.

---

# Résidence suivante

Lorsqu’un MissionItem devient actif, l’annonce officielle est :

```text
Prochaine résidence, {adresse}.
```

Exemple :

```text
Prochaine résidence, 224 rue Scott.
```

L’annonce peut inclure une alerte importante si celle-ci est courte.

Exemple :

```text
Prochaine résidence, 224 rue Scott. Attention, plate-bande au fond.
```

Une seule alerte prioritaire doit être incluse dans l’annonce initiale.

Les autres restent accessibles à l’écran ou par commande manuelle.

---

# Détection gauche ou droite

L’annonce :

```text
Résidence à droite.
```

ou :

```text
Résidence à gauche.
```

doit seulement être produite lorsque le système possède suffisamment d’information.

Le calcul peut utiliser :

- position GPS actuelle
- cap validé
- position de la résidence
- géométrie de l’entrée
- seuil de confiance

Si le seuil de confiance n’est pas atteint :

```text
Résidence en approche.
```

doit être utilisé.

Le moteur ne doit jamais inventer une direction.

---

# Commande vocale manuelle

Le bouton Voix permet à l’opérateur de demander la répétition de l’information actuelle.

Exemples :

- prochaine adresse
- état courant
- alerte principale
- nombre de résidences restantes

Exemple de lecture manuelle :

```text
Résidence actuelle, 224 rue Scott.
Intervention en cours depuis 5 minutes 42 secondes.
Attention, plate-bande au fond.
```

La lecture manuelle peut être plus détaillée qu’une annonce automatique.

---

# Bouton Voix

Le bouton Voix doit offrir au minimum :

## Appui simple

Répéter l’information la plus importante.

## Appui prolongé

Ouvrir les options vocales ou lire davantage de détails.

Le comportement exact doit demeurer identique dans tous les états de mission.

---

# Paramètres utilisateur

Les paramètres suivants doivent être configurables :

- voix activée ou désactivée
- volume des annonces
- vitesse de lecture
- voix système
- annonces d’approche
- annonces d’alertes
- annonces système
- répétition automatique
- langue

Pour la version 1.0, la langue principale est :

```text
Français canadien
```

---

# Synthèse vocale

Le moteur doit privilégier la synthèse vocale locale de l’appareil.

Avantages :

- fonctionnement hors ligne
- faible latence
- aucune transmission de texte vers un service externe
- coût réduit
- meilleure résilience

Le moteur doit utiliser une voix française canadienne lorsque disponible.

Sinon :

1. français générique
2. autre voix française disponible
3. signalement silencieux de l’indisponibilité

---

# Fonctionnement hors ligne

Les annonces essentielles doivent continuer de fonctionner sans connexion.

Doivent fonctionner hors ligne :

- prochaine résidence
- adresse
- état de mission
- chronomètre
- alertes déjà téléchargées
- GPS perdu ou rétabli
- mode hors ligne
- résidence terminée

Les annonces ne doivent dépendre d’aucune API distante.

---

# Prononciation des adresses

Les adresses doivent être normalisées avant lecture.

Exemples :

```text
224 rue Scott
```

doit être lu naturellement.

Les abréviations doivent être développées lorsque nécessaire.

Exemples :

```text
r. → rue
av. → avenue
boul. → boulevard
ch. → chemin
N → nord
S → sud
E → est
O → ouest
```

Le moteur doit éviter les transformations risquées.

Les noms propres doivent rester inchangés lorsqu’aucune règle fiable n’existe.

---

# Prononciation des nombres

Les numéros civiques doivent être prononcés comme des nombres naturels.

Exemple :

```text
224
```

doit être lu :

```text
deux cent vingt-quatre
```

et non chiffre par chiffre.

Les numéros de mission peuvent être lus différemment ou rester silencieux.

---

# Gestion du volume

Le Voice Engine doit respecter le volume système.

Il peut appliquer un volume relatif configurable.

Le moteur doit pouvoir réduire temporairement le volume d’un média en cours lorsque la plateforme le permet.

Ce comportement est appelé :

```text
Audio ducking
```

Après l’annonce, le volume précédent doit être rétabli.

---

# Appels téléphoniques et autres médias

Pendant un appel téléphonique :

- les annonces non critiques sont suspendues
- les annonces critiques peuvent être journalisées sans être prononcées
- la lecture reprend uniquement si l’information est encore pertinente

Pendant la lecture de musique ou de radio :

- réduction temporaire du volume
- lecture de l’annonce
- retour au volume initial

Le comportement dépend des capacités du système d’exploitation.

---

# Écran verrouillé

Lorsque le système d’exploitation l’autorise, les annonces doivent continuer pendant :

- écran verrouillé
- application en arrière-plan
- navigation entre les écrans
- perte temporaire du réseau

Le Voice Engine doit être conçu pour fonctionner indépendamment du rendu React.

---

# Événements reçus

Le Voice Engine peut recevoir :

```text
VOICE_MISSION_STARTED
VOICE_NEXT_RESIDENCE
VOICE_APPROACHING
VOICE_RESIDENCE_SIDE
VOICE_RESIDENCE_STARTED
VOICE_RESIDENCE_COMPLETED
VOICE_IMPORTANT_ALERT
VOICE_PROBLEM_RECORDED
VOICE_GPS_LOST
VOICE_GPS_RECOVERED
VOICE_OFFLINE
VOICE_ONLINE
VOICE_MISSION_COMPLETED
VOICE_REPEAT_CURRENT_CONTEXT
```

---

# Événements publiés

Le Voice Engine publie uniquement des événements techniques.

Exemples :

```text
VoiceQueued
VoiceStarted
VoiceCompleted
VoiceInterrupted
VoiceSkipped
VoiceFailed
VoiceUnavailable
```

Il ne publie jamais une transition métier.

---

# Structure d’une annonce

Chaque annonce doit utiliser une structure similaire à celle-ci :

```ts
type VoiceAnnouncement = {
  id: string
  type: VoiceAnnouncementType
  priority: VoicePriority

  missionId?: string
  missionItemId?: string

  text: string
  createdAt: string
  expiresAt?: string

  interruptible: boolean
  deduplicationKey?: string
  cooldownMs?: number

  sourceEvent: string
}
```

---

# Expiration

Certaines annonces possèdent une durée de validité.

Exemple :

```text
ResidenceApproaching
```

doit expirer si la résidence passe à EN COURS.

Une annonce expirée :

- n’est pas lue
- est retirée de la file
- est journalisée comme ignorée

---

# Journalisation

Chaque annonce doit être journalisée.

Informations minimales :

- identifiant
- type
- texte
- priorité
- MissionItem
- heure de création
- heure de lecture
- résultat
- raison d’interruption ou d’annulation

Exemple :

```text
08:15:02
VOICE_NEXT_RESIDENCE
« Prochaine résidence, 224 rue Scott. »
COMPLETED
```

---

# Protection de la vie privée

Le Voice Engine ne doit pas prononcer automatiquement :

- nom complet du client
- numéro de téléphone
- informations de paiement
- notes personnelles sensibles
- informations contractuelles confidentielles

Les annonces doivent utiliser principalement :

- adresse
- instructions opérationnelles
- alertes
- état de mission

---

# Erreurs

Si la synthèse vocale échoue :

```text
Erreur de lecture
      ↓
Journalisation
      ↓
Indicateur discret dans l’interface
      ↓
Mission continue normalement
```

Une erreur vocale ne doit jamais bloquer la mission.

---

# Mode silencieux

Lorsque la voix est désactivée :

- les événements sont toujours reçus
- aucune annonce n’est prononcée
- les alertes restent affichées
- les événements importants restent journalisés

Le bouton Voix doit clairement indiquer que le mode silencieux est actif.

---

# Tests obligatoires

Le Voice Engine doit être testé dans les scénarios suivants :

- mission sans alerte
- résidence avec une alerte
- résidence avec plusieurs alertes
- résidences très rapprochées
- transitions rapides
- GPS perdu
- GPS rétabli
- mode hors ligne
- retour en ligne
- application en arrière-plan
- écran verrouillé
- appel téléphonique
- annonce critique pendant une annonce normale
- répétition manuelle
- langue française canadienne indisponible
- synthèse vocale indisponible
- annonce expirée
- file contenant plusieurs priorités

---

# Règles importantes

Le Voice Engine ne donne pas de navigation complète.

La voix reste silencieuse par défaut.

Une annonce doit toujours être utile.

Une annonce critique peut interrompre une annonce normale.

Les répétitions automatiques sont limitées.

Une annonce devenue invalide est supprimée.

Le système doit fonctionner hors ligne.

Les messages doivent rester courts.

Le moteur ne modifie jamais les données métier.

Le moteur ne dépend jamais de l’interface.

---

# Exemples de séquences

## Démarrage de mission

```text
Mission démarrée.
Prochaine résidence, 224 rue Scott.
```

---

## Approche

```text
Résidence en approche.
Attention, plate-bande au fond.
```

---

## Début d’intervention

```text
Intervention démarrée.
```

---

## Fin normale

```text
Résidence terminée.
Prochaine résidence, 228 rue Bellevue.
```

---

## Résidences rapprochées

```text
Résidence terminée.
Intervention suivante démarrée.
```

Le moteur doit éviter de lire une annonce de déplacement artificiel inutile.

---

## Problème

```text
Problème enregistré.
Passage à la résidence suivante.
```

---

## Perte de réseau

```text
Mode hors ligne activé.
```

Aucune répétition tant que le réseau n’est pas rétabli.

---

## Retour du réseau

```text
Connexion rétablie.
```

La synchronisation normale peut rester silencieuse.

---

## Fin de mission

```text
Mission terminée.
Toutes les résidences ont été traitées.
```

---

# Objectif final

Le Voice Engine doit permettre à l’opérateur de comprendre les événements importants sans quitter la route des yeux.

La voix doit agir comme un assistant discret.

Elle doit intervenir uniquement lorsqu’elle apporte une information réellement utile.

Le système doit être :

- fiable
- calme
- déterministe
- prévisible
- rapide
- fonctionnel hors ligne
- indépendant de l’interface

RECA Operator ne doit jamais parler pour remplir le silence.

Chaque annonce doit avoir une raison claire d’exister.