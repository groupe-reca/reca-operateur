# 04-GPS-Engine.md

# RECA Operator
## GPS Engine

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Le GPS Engine est responsable de toute la logique de localisation.

Il reçoit les positions GPS du téléphone.

Il calcule les distances.

Il détermine les changements d'états.

Il ne possède aucune interface graphique.

Il ne communique jamais directement avec Supabase.

Il publie uniquement des événements.

---

# Philosophie

Le moteur GPS ne cherche jamais quelle résidence est la plus proche.

Il connaît déjà la résidence active.

Une seule résidence est analysée à la fois.

Cette approche élimine les erreurs lorsque plusieurs résidences sont très rapprochées.

---

# Source des données

Le moteur reçoit :

Mission

MissionItems

↓

Résidence active

↓

Position GPS

↓

Paramètres

Le moteur ne lit jamais directement la base de données.

---

# Paramètres

Tous les paramètres doivent être configurables.

Valeurs par défaut.

Distance approche

250 mètres

Distance début intervention

30 mètres

Distance fin intervention

50 mètres

Temps validation changement de cap

3 secondes

Temps validation entrée rayon

5 secondes

Temps validation sortie rayon

5 secondes

Temps déplacement fictif

5 secondes

Toutes ces valeurs pourront être ajustées dans un futur panneau Développement.

---

# États possibles

EN ATTENTE

↓

EN ROUTE

↓

EN APPROCHE

↓

EN COURS

↓

TERMINÉE

ou

PROBLÈME

Une résidence ne peut jamais revenir à un état précédent automatiquement.

---

# Démarrage

Lorsque l'opérateur démarre sa mission.

Le premier MissionItem devient automatiquement

EN ROUTE

Toutes les autres résidences restent

EN ATTENTE

---

# EN ROUTE

L'opérateur circule vers la résidence.

Le moteur calcule uniquement la distance.

Lorsque la distance devient inférieure à

250 m

↓

Le statut devient

EN APPROCHE

---

# EN APPROCHE

Le moteur continue de calculer la distance.

Lorsque la distance devient inférieure à

30 m

↓

Démarrer un délai de validation.

Durée

5 secondes

Si le GPS est toujours dans le rayon après ce délai

↓

Le statut devient

EN COURS

---

# EN COURS

Le moteur enregistre :

Heure début intervention

Le temps de déplacement est calculé.

Temps déplacement

=

Heure EN COURS

-

Heure EN ROUTE

---

# Fin de résidence

Deux possibilités.

---

## Cas normal

Lorsque la distance devient supérieure à

50 mètres

↓

Démarrer un délai

5 secondes

↓

Toujours à plus de 50 mètres

↓

La résidence devient

TERMINÉE

↓

La résidence suivante devient

EN ROUTE

---

## Cas spécial

Deux résidences très rapprochées.

L'opérateur quitte la résidence A.

Avant d'atteindre les

50 mètres

Il entre directement dans le rayon

30 mètres

de la résidence suivante.

Dans ce cas :

Résidence A

↓

TERMINÉE

Résidence B

↓

EN COURS

Le temps de déplacement de B est fixé automatiquement à

5 secondes

Cette valeur est marquée comme

Temps fictif

Elle est distinguée d'un véritable déplacement.

---

# Détection GPS

Chaque position GPS contient.

Latitude

Longitude

Précision

Cap

Vitesse

Horodatage

Le moteur ignore automatiquement les positions dont la précision dépasse le seuil configuré.

---

# Stabilisation du cap

Le GPS peut produire des changements de direction erronés.

Le moteur ne valide jamais immédiatement un nouveau cap.

Workflow.

Nouveau cap détecté

↓

Attendre

3 secondes

↓

Le cap est toujours identique

↓

Publier

HeadingChanged

Sinon

Ignorer

Cette règle évite les rotations permanentes de la carte.

---

# Position active

Une seule résidence est surveillée.

Le moteur ignore complètement les autres MissionItems.

Cela réduit énormément la complexité.

---

# Événements publiés

MissionStarted

ApproachingResidence

ResidenceStarted

ResidenceCompleted

ResidenceProblem

HeadingChanged

GpsLost

GpsRecovered

GpsAccuracyChanged

MissionFinished

Le moteur ne modifie jamais l'interface.

Il publie uniquement ces événements.

---

# Cas particuliers

GPS perdu

↓

Conserver l'état courant

↓

Attendre le retour du signal

↓

Reprendre normalement

---

Téléphone verrouillé

↓

Continuer les calculs GPS

↓

Continuer les annonces vocales

↓

Continuer les chronomètres

---

Mode hors ligne

↓

Continuer tous les calculs

↓

Empiler les événements

↓

Synchroniser au retour du réseau

---

# Calculs

Temps déplacement

EN ROUTE

↓

EN COURS

Temps intervention

EN COURS

↓

TERMINÉE

Temps mission

MissionStarted

↓

MissionFinished

Tous les temps sont enregistrés.

---

# Journal

Chaque transition est enregistrée.

Exemple.

08:12:14

EN ROUTE

08:15:08

EN APPROCHE

08:15:34

EN COURS

08:21:17

TERMINÉE

Le journal sert au débogage ainsi qu'aux statistiques.

---

# Règles importantes

Une seule résidence active.

Un seul changement d'état à la fois.

Toutes les transitions sont irréversibles.

Les délais de validation évitent les faux positifs.

Le moteur ne dépend jamais de l'interface.

Le moteur ne dépend jamais de Mapbox.

Le moteur fonctionne même sans réseau.

Le moteur fonctionne même écran verrouillé lorsque le système d'exploitation l'autorise.

---

# Objectif final

Le GPS Engine doit être suffisamment fiable pour qu'un opérateur puisse effectuer une tempête complète sans devoir confirmer manuellement les interventions.

Le moteur doit être prédictible.

Stable.

Déterministe.

Toutes les décisions doivent pouvoir être expliquées par une règle claire.

L'objectif est d'obtenir un système qui fonctionne de manière identique sur toutes les routes, toutes les tempêtes et tous les appareils compatibles.