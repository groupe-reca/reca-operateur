# 02-Application-Architecture.md

# RECA Operator
## Architecture de l'application

Version : 1.0
Projet : RECA Operator
Statut : Architecture officielle

---

# Objectif

Ce document décrit l'architecture complète de RECA Operator.

Il définit les différents modules de l'application ainsi que leurs responsabilités.

Chaque composant possède une responsabilité unique.

Aucun composant ne doit mélanger :

- Interface utilisateur
- Logique métier
- Communication réseau
- Synchronisation
- Calcul GPS

Ces responsabilités doivent toujours être séparées.

---

# Philosophie

RECA Operator est construit selon une architecture modulaire.

Chaque module est indépendant.

Chaque module peut évoluer sans impacter les autres.

L'objectif est d'obtenir une application :

- simple à maintenir
- simple à faire évoluer
- simple à tester
- simple à déboguer

---

# Architecture générale

App

↓

Authentication

↓

Mission Loader

↓

Mission Screen

↓

Synchronisation

↓

Fin de mission

---

# Modules principaux

L'application est composée des modules suivants.

## Authentication

Responsabilité

Authentifier l'utilisateur.

Vérifier son rôle.

Charger son profil.

Rechercher la mission qui lui est assignée.

Ne contient aucune logique GPS.

---

## Mission Loader

Responsabilité

Télécharger la mission.

Télécharger les MissionItems.

Préparer les données.

Créer les objets utilisés par le moteur.

Ne contient aucune interface.

---

## Mission Screen

Responsabilité

Afficher l'ensemble de l'interface utilisateur.

Il contient uniquement les composants visuels.

Aucune logique métier.

Aucun calcul GPS.

---

Le Mission Screen est composé des éléments suivants.

Mission Header

Mission Map

Tractor Marker

Suggested Route

Mission Card

Upcoming Sheet

Floating Buttons

Alerts

Status Badge

Timer

---

# Mission Header

Affiche :

Mission

Opérateur

Équipement

Ville

État actuel

Chronomètre

Aucune logique.

---

# Mission Map

Responsabilité

Afficher la carte.

Suivre le GPS.

Afficher les résidences.

Afficher le chemin suggéré.

Afficher le tracteur.

Ne contient aucun calcul métier.

---

# Tractor Marker

Responsabilité

Afficher le tracteur.

Le tracteur est toujours fixe.

La carte se déplace sous celui-ci.

Le tracteur représente :

Kubota

Pelle avant

Souffleuse arrière.

---

# Suggested Route

Responsabilité

Afficher le chemin suggéré.

Le chemin suit les routes.

Il relie les cinq prochaines résidences.

Il ne s'agit pas d'une navigation GPS.

Il n'affiche aucune instruction.

---

# Mission Card

Responsabilité

Afficher uniquement :

prochaine résidence

distance

temps estimé

état

alertes

---

# Upcoming Sheet

Responsabilité

Afficher les prochaines résidences.

Le panneau est rétractable.

Les cartes sont automatiquement réorganisées.

---

# Floating Buttons

Contient uniquement

Navigation

Problème

Annonce vocale

Options

---

# Alerts

Responsabilité

Afficher les informations importantes.

Exemple

Plate-bande

Boîte aux lettres

Danger

Consigne spéciale

---

# Timer

Responsabilité

Afficher le temps réel.

Le Timer ne fait aucun calcul.

Il affiche uniquement les données produites par le moteur.

---

# Les moteurs

Les moteurs sont complètement indépendants de l'interface.

L'interface ne fait que les utiliser.

Les moteurs sont :

GPS Engine

State Machine

Map Engine

Voice Engine

Offline Engine

Synchronization Engine

---

# GPS Engine

Responsabilité

Recevoir les positions GPS.

Calculer les distances.

Déterminer les changements d'états.

Calculer :

temps déplacement

temps intervention

temps attente

Ne connaît jamais l'interface.

---

# State Machine

Responsabilité

Contrôler tous les changements d'état.

Une résidence ne peut jamais revenir à un état précédent automatiquement.

Transitions autorisées

EN ATTENTE

↓

EN ROUTE

↓

EN APPROCHE

↓

EN COURS

↓

TERMINÉE

Les exceptions sont uniquement autorisées par un administrateur.

---

# Map Engine

Responsabilité

Contrôler entièrement Mapbox.

Zoom.

Rotation.

Caméra.

Chemin suggéré.

Icônes.

Mode hors ligne.

Le reste de l'application ne communique jamais directement avec Mapbox.

---

# Voice Engine

Responsabilité

Produire les annonces vocales.

Bluetooth.

Volume.

Priorités.

Ne décide jamais des états.

---

# Synchronization Engine

Responsabilité

Communication avec RECA App.

Téléchargement des missions.

Envoi des statuts.

Synchronisation différée.

Gestion des conflits.

---

# Offline Engine

Responsabilité

Permettre le fonctionnement sans réseau.

Stockage local.

Synchronisation automatique au retour du réseau.

---

# Flux de données

Connexion

↓

Chargement utilisateur

↓

Chargement mission

↓

Chargement MissionItems

↓

GPS

↓

State Machine

↓

Interface

↓

Synchronisation

↓

Historique

---

# Structure recommandée

src/

app/

components/

Mission/

Header/

Map/

Cards/

BottomSheets/

Buttons/

Alerts/

Status/

engines/

gps/

state-machine/

map/

voice/

offline/

sync/

hooks/

services/

types/

utils/

assets/

---

# Règles d'architecture

Un composant = une responsabilité.

Aucun composant ne dépasse idéalement 250 lignes.

Toute logique métier appartient à un moteur.

Toute logique visuelle appartient aux composants.

Les moteurs ne connaissent jamais React.

Les composants ne connaissent jamais Supabase.

Les composants ne connaissent jamais Mapbox directement.

Toute communication passe par les moteurs.

---

# Dépendances

Mission Screen

↓

utilise

↓

GPS Engine

↓

State Machine

↓

Map Engine

↓

Voice Engine

↓

Synchronization Engine

↓

Offline Engine

Aucun moteur ne dépend d'un autre.

Ils communiquent uniquement par événements.

---

# Objectif final

L'application doit pouvoir évoluer pendant plusieurs années sans nécessiter de refonte complète.

L'ajout d'une nouvelle fonctionnalité ne doit jamais nécessiter de modifier plusieurs modules.

Chaque composant doit être remplaçable indépendamment.

Cette architecture garantit une maintenance simple, une excellente évolutivité et une séparation claire entre l'interface utilisateur, les moteurs métier et les services techniques.