# 05-Map-Engine.md

# RECA Operator
## Map Engine

Version : 1.0

Projet : RECA Operator

Statut : Architecture officielle

---

# Objectif

Le Map Engine est responsable de tout ce qui concerne la carte.

Il contrôle entièrement Mapbox.

Il reçoit les événements du GPS Engine ainsi que de la State Machine.

Il ne prend jamais de décisions métier.

Il ne connaît jamais Supabase.

Il ne connaît jamais les règles de la mission.

Son seul rôle est d'afficher correctement l'information.

---

# Philosophie

La carte est le cœur de RECA Operator.

L'utilisateur ne quitte jamais la carte.

Toutes les informations flottent au-dessus.

Le Map Engine doit toujours privilégier :

- la lisibilité
- la stabilité
- la fluidité

Une carte agréable à utiliser est plus importante qu'une carte spectaculaire.

---

# Responsabilités

Le Map Engine est responsable de :

- l'affichage de la carte
- la caméra
- le zoom
- la rotation
- les marqueurs
- le tracteur
- les résidences
- le chemin suggéré
- les cartes hors ligne
- les performances

---

# Source des données

Le Map Engine reçoit uniquement :

MissionContext

↓

GPS Engine

↓

State Machine

↓

Paramètres utilisateur

Il ne lit jamais directement la base de données.

---

# Carte principale

La carte occupe 100 % de l'écran.

Elle constitue l'arrière-plan complet de l'application.

Aucune autre vue ne remplace la carte.

Tous les panneaux sont affichés par-dessus.

---

# Caméra

La caméra suit automatiquement le tracteur.

Le tracteur reste fixe à l'écran.

La caméra est déplacée sous celui-ci.

L'utilisateur a l'impression que le véhicule avance.

Jamais l'inverse.

---

# Position du tracteur

Le tracteur est toujours affiché au même endroit.

Position recommandée.

Centre horizontal.

Environ 60 % de la hauteur de l'écran.

Cette position permet de voir davantage la route devant le véhicule.

---

# Icône du tracteur

Décision propriétaire (2026-08-08) : l'illustration Kubota vue du dessus a été remplacée par une
flèche de navigation standard (`lucide-react-native` `Navigation2`, bleu `colors.navigation` — même
couleur que le chemin suggéré), le style de puk de position utilisé par les applications de
navigation grand public (Google Maps, Waze). L'ancienne exigence (cabine/pelle/souffleuse, modèle
Kubota) ne s'applique plus.

Le tracteur (la flèche) est orienté selon le cap validé.

Jamais selon le cap instantané du GPS.

---

# Rotation

La rotation est stabilisée.

Le Map Engine ne fait jamais pivoter immédiatement la carte.

Workflow :

GPS

↓

Nouveau cap

↓

Validation par le GPS Engine

↓

HeadingChanged

↓

Rotation fluide

La carte ne doit jamais osciller.

---

# Animation de rotation

Durée approximative.

400 à 800 ms.

Transition douce.

Aucune rotation brusque.

---

# Zoom automatique

Le zoom dépend uniquement de l'état de la résidence active.

EN ROUTE

↓

Zoom large

EN APPROCHE

↓

Zoom moyen

EN COURS

↓

Zoom rapproché

Le zoom est animé.

Jamais instantané.

---

# Chemin suggéré

Le chemin bleu représente une suggestion.

Il ne s'agit pas d'une navigation GPS.

Aucune instruction vocale.

Aucune flèche.

Aucune indication de voie.

Le chemin relie :

- la position actuelle
- les cinq prochaines résidences

---

# Calcul du chemin

Le chemin doit suivre les routes.

Jamais une ligne droite.

Le calcul est confié au moteur de routage de Mapbox.

Le chemin est recalculé lorsque :

- une résidence est terminée
- une résidence est ignorée
- la mission est modifiée

Pas à chaque position GPS.

---

# Résidences

Le Map Engine affiche uniquement :

- la résidence active
- les quatre suivantes

Les autres restent masquées.

---

# Apparence des résidences

Résidence active

Grand marqueur vert.

Deuxième

Marqueur bleu.

Troisième

Marqueur bleu.

Quatrième

Marqueur gris.

Cinquième

Marqueur gris.

Les marqueurs doivent être très lisibles.

---

# Résidences terminées

Par défaut.

Les résidences terminées disparaissent.

Un mode Développement pourra permettre de les afficher.

---

# Résidences problème

Les résidences en problème restent visibles.

Couleur rouge.

Icône différente.

Elles restent dans la liste jusqu'à résolution.

---

# Couches

Le Map Engine doit supporter plusieurs couches.

Carte standard.

Satellite.

Hybride.

Hiver.

Le changement doit être instantané.

---

# Cartes hors ligne

Le moteur doit permettre le téléchargement de secteurs.

Les cartes doivent rester utilisables sans réseau.

Les routes.

Les bâtiments.

Les noms de rues.

Les numéros civiques.

Le chemin suggéré doit continuer de fonctionner à partir des données téléchargées lorsque possible.

---

# Performances

Le Map Engine doit être optimisé.

Ne jamais recalculer inutilement.

Ne jamais redessiner toute la carte.

Limiter les animations.

Limiter les mises à jour.

Objectif.

60 FPS.

---

# Recalcul

Le chemin est recalculé uniquement lors d'un événement.

Exemples.

Mission démarrée.

Résidence terminée.

Mission modifiée.

Nouvelle mission.

Jamais à chaque seconde.

---

# Panneaux flottants

Les panneaux ne font pas partie du Map Engine.

Le Map Engine affiche uniquement la carte.

Les composants React affichent les panneaux.

Cette séparation est obligatoire.

---

# Alertes

Les alertes apparaissent lorsque la State Machine le demande.

Le Map Engine ne décide jamais de leur affichage.

---

# Mode développement

Le moteur doit permettre plusieurs options.

Afficher les rayons GPS.

Afficher les coordonnées.

Afficher la précision GPS.

Afficher le cap.

Afficher le chemin complet.

Afficher les résidences terminées.

Afficher les zones de détection.

Toutes ces options doivent être désactivées par défaut.

---

# Événements reçus

MissionLoaded

MissionStarted

HeadingChanged

ResidenceApproaching

ResidenceStarted

ResidenceCompleted

ResidenceProblem

MissionFinished

GpsLost

GpsRecovered

---

# Événements publiés

CameraReady

RouteRendered

OfflineMapLoaded

MapReady

MapError

Aucun événement métier.

---

# Objectif final

Le Map Engine doit donner l'impression d'un système de navigation intégré à un véhicule professionnel.

La carte doit être calme.

Stable.

Lisible.

Le conducteur ne doit jamais avoir l'impression que la carte lutte contre lui.

Elle doit simplement accompagner naturellement son déplacement.

Le Map Engine ne prend jamais de décisions métier.

Il transforme uniquement les données reçues en une représentation visuelle fluide, cohérente et rassurante.