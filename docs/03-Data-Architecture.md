# 03-Data-Architecture.md

# RECA Operator
## Architecture des données

Version : 1.0
Projet : RECA Operator
Statut : Architecture officielle

---

# Objectif

Ce document décrit la structure des données manipulées par RECA Operator.

Il définit :

- les objets utilisés
- leur cycle de vie
- leurs relations
- le flux des données
- les responsabilités de chaque module

L'objectif est que chaque donnée possède une seule source de vérité.

---

# Philosophie

RECA Operator ne crée jamais une mission.

Les missions sont créées par RECA App.

RECA Operator est uniquement responsable de :

- télécharger sa mission
- exécuter la mission
- enregistrer les changements
- synchroniser les résultats

Toutes les données proviennent de RECA App.

---

# Source de vérité

RECA App

↓

Mission

↓

MissionItems

↓

RECA Operator

↓

Synchronisation

↓

RECA App

Aucune donnée n'est créée directement dans RECA Operator à l'exception :

- des positions GPS
- des journaux locaux
- des événements système

---

# Entités principales

L'application manipule les objets suivants.

Mission

MissionItem

GPS Position

Mission Event

Synchronization Queue

Operator Session

---

# Mission

Une Mission représente une sortie complète de déneigement.

Une Mission contient :

- id
- date
- heure de début
- route
- opérateur
- équipement
- statut
- heure réelle de départ
- heure réelle de fin

Une Mission possède plusieurs MissionItems.

---

# MissionItem

Un MissionItem représente une seule résidence à réaliser.

Il contient :

- id
- mission_id
- contrat_id
- ordre
- adresse
- latitude
- longitude
- rayon de détection
- statut
- heure EN ROUTE
- heure EN APPROCHE
- heure EN COURS
- heure TERMINÉE
- temps déplacement
- temps intervention
- notes
- code problème

Chaque MissionItem est complètement indépendant.

---

# États

Un MissionItem peut uniquement être dans un des états suivants.

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

Les retours en arrière sont interdits automatiquement.

---

# Position GPS

Le GPS produit une nouvelle position.

Chaque position contient :

- latitude
- longitude
- précision
- vitesse
- cap
- horodatage

Ces données sont temporaires.

Elles ne sont pas toutes enregistrées.

---

# Session opérateur

Une session représente une ouverture de l'application.

Elle contient :

- utilisateur
- mission
- heure ouverture
- heure fermeture
- version application
- batterie
- mode hors ligne

Une seule session est active.

---

# Mission Event

Chaque changement important génère un événement.

Exemple :

MISSION_STARTED

MISSION_PAUSED

MISSION_RESUMED

MISSION_COMPLETED

ITEM_EN_ROUTE

ITEM_EN_APPROACH

ITEM_STARTED

ITEM_COMPLETED

ITEM_PROBLEM

VOICE_PLAYED

GPS_LOST

GPS_RESTORED

Ces événements servent :

- au débogage
- aux statistiques
- à l'historique

---

# Synchronization Queue

Toutes les modifications sont placées dans une file.

Exemple

ITEM_COMPLETED

↓

Queue

↓

Internet disponible

↓

Synchronisation

↓

Confirmation

↓

Suppression de la file

Aucune donnée n'est perdue.

---

# Cycle d'une mission

Connexion

↓

Téléchargement

↓

Mission

↓

MissionItems

↓

Initialisation

↓

Premier MissionItem = EN ROUTE

↓

GPS actif

↓

Exécution

↓

Synchronisation

↓

Fin mission

---

# Cycle d'un MissionItem

Création

↓

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

↓

Synchronisation

↓

Archivage

---

# Relations

Une Mission

↓

possède plusieurs

↓

MissionItems

Chaque MissionItem

↓

possède

↓

un Contrat

Chaque Contrat

↓

possède

↓

une Zone GPS

Cette Zone GPS est utilisée pour la détection.

Jamais le centre du bâtiment.

---

# Position active

Le système ne surveille jamais toutes les résidences.

À un instant donné :

une seule résidence est active.

Exemple

Mission

↓

Résidence #1 = active

↓

Toutes les autres = EN ATTENTE

Lorsque la résidence est terminée :

Résidence #2 devient active.

Cela réduit énormément la complexité du moteur GPS.

---

# Détection

Le moteur utilise uniquement :

MissionItem actif

↓

GPS actuel

↓

Distance

↓

État

Les autres MissionItems ne participent pas aux calculs.

---

# Cache local

Les données suivantes sont conservées localement.

Mission

MissionItems

Paramètres

Carte hors ligne

Journal

Queue de synchronisation

Cela permet de continuer même sans réseau.

---

# Synchronisation

Les changements suivants sont synchronisés.

État Mission

État MissionItem

Temps déplacement

Temps intervention

Notes

Problèmes

Fin mission

La synchronisation est asynchrone.

Elle ne bloque jamais l'interface.

---

# Historique

Une fois la mission terminée.

Tous les MissionItems deviennent immuables.

Les données servent uniquement :

aux rapports

aux statistiques

à l'optimisation IA

---

# Flux complet

RECA App

↓

Mission

↓

MissionItems

↓

Téléchargement

↓

Cache local

↓

GPS

↓

State Machine

↓

MissionItem

↓

Mission Events

↓

Synchronization Queue

↓

RECA App

---

# Règles

Une seule mission active.

Une seule résidence active.

Une seule source de vérité.

Aucun doublon.

Toutes les modifications sont journalisées.

Toutes les synchronisations sont confirmées.

Aucune donnée n'est perdue lors d'une perte réseau.

---

# Objectif

L'architecture doit permettre :

- un fonctionnement entièrement hors ligne
- une synchronisation fiable
- un moteur GPS simple
- une évolution facile
- une intégration future avec l'intelligence artificielle
- une traçabilité complète des opérations

Toutes les données doivent suivre un cycle clair, prévisible et déterministe.