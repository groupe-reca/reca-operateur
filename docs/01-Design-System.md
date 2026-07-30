DESIGN-SYSTEM.md

RECA Operator v2
Vision

RECA Operator est une application utilisée par un opérateur de tracteur pendant une tempête de neige.

L'objectif n'est pas de faire une application "jolie".

L'objectif est de permettre à un opérateur de travailler plusieurs heures dans une cabine de tracteur sans fatigue visuelle et sans distraction.

Chaque élément affiché doit avoir une utilité.

L'opérateur doit pouvoir comprendre l'écran en moins de deux secondes.

Le design doit être extrêmement stable.

Aucun mouvement inutile.

Aucune animation décorative.

Seulement des animations qui transmettent une information.

Inspiration

Le style graphique officiel est celui présenté dans les maquettes fournies.

On conserve exactement cette direction.

fond très sombre
panneaux translucides
bleu RECA
texte blanc
accents verts
cartes flottantes
grosses informations
peu de texte

L'application doit donner l'impression d'un logiciel professionnel installé directement dans le tracteur.

Philosophie

La carte est l'élément principal.

Tout le reste flotte par-dessus.

On ne quitte jamais la carte.

Les panneaux apparaissent et disparaissent sans jamais cacher complètement la carte.

La carte reste toujours vivante.

Architecture visuelle

Toujours :

Carte plein écran

Puis :

Header flottant

Carte Mission

Liste des prochaines résidences

Boutons d'action

Aucun écran blanc.

Aucun changement de page.

Seulement des panneaux.

Couleurs

Fond

#0B1020

Panneaux

#151C2E

Bleu RECA

#3B82F6

Vert

#4ADE80

Rouge

#EF4444

Orange

#F59E0B

Texte principal

#FFFFFF

Texte secondaire

#94A3B8
La carte

La carte occupe 100% de l'écran.

Elle n'est jamais remplacée.

Elle reste visible en permanence.

Tous les panneaux sont affichés au-dessus.

Mouvement de la carte

Le tracteur reste fixe.

Toujours.

Au centre inférieur.

La carte se déplace sous le tracteur.

Exactement comme Google Maps.

Rotation

La carte ne tourne pas continuellement.

Un changement de cap doit être confirmé.

Exemple

Si le tracteur change de direction :

attendre environ 2 à 3 secondes

si le cap reste stable

alors seulement

rotation douce de la carte.

Cela évite les oscillations GPS.

Zoom

Zoom automatique.

Trois niveaux seulement.

En route

Vue large.

En approche

Vue moyenne.

En intervention

Zoom rapproché.

Icône du tracteur

Ne jamais utiliser un point GPS.

Utiliser une vraie icône de tracteur.

Vue du dessus.

Le tracteur est orienté selon le cap réel.

La pelle est visible.

La souffleuse arrière est visible.

L'utilisateur comprend immédiatement dans quel sens son équipement est orienté.

Tracé bleu

Il ne s'agit pas d'une navigation GPS.

Le tracé est seulement un chemin suggéré.

Il relie :

les cinq prochaines résidences.

Le tracé suit les rues.

Jamais une ligne droite.

Aucune instruction de navigation.

Simplement une suggestion.

Les résidences

Chaque résidence possède un état.

En attente

En route

En approche

En cours

Problème

Terminée

Chaque état possède :

une couleur

une icône

une animation discrète.

Les cartes

Coins très arrondis.

Ombre douce.

Fond semi-transparent.

Très peu de bordures.

Header

Toujours visible.

Contient uniquement :

Mission

Ville

Opérateur

Équipement

Chronomètre

État courant

Pas davantage.

Chronomètre

Toujours très visible.

Gros chiffres.

Le chronomètre indique uniquement l'état courant.

Exemple

EN ROUTE

04:37

Puis

EN APPROCHE

00:08

Puis

EN COURS

03:41

Puis

DÉPART

00:12

Puis

EN ROUTE

00:00

Informations importantes

Les alertes doivent être extrêmement visibles.

Exemple

⚠ Plate-bande au fond

⚠ Ne pas bloquer la porte de garage

⚠ Client handicapé

⚠ Ne pas souffler vers la rue

Ces informations apparaissent automatiquement lorsque l'opérateur approche.

Les panneaux

Tous les panneaux doivent pouvoir être réduits.

Ils utilisent le même système que Google Maps.

Le panneau inférieur peut être :

25 %

50 %

75 %

100 %

Les animations

Uniquement :

Fade

Slide

Expansion

Jamais

Bounce

Zoom

Effets spectaculaires

Typographie

Police moderne.

Très lisible.

Très grosse.

Les adresses doivent être visibles immédiatement.

Responsive

L'application est conçue uniquement pour téléphone.

Portrait uniquement.

Aucune interface tablette.

Aucune interface bureau.

Objectif final

L'utilisateur ne doit jamais avoir besoin de réfléchir.

Il regarde simplement l'écran.

Le logiciel lui montre naturellement :

où aller

quoi faire

combien de temps cela prend

les dangers

la prochaine résidence

sans jamais l'interrompre.

Règle de développement

Avant chaque nouvelle fonctionnalité, vérifier qu'elle respecte ces quatre principes :

La carte reste l'élément principal.
L'opérateur peut comprendre l'écran en moins de deux secondes.
Aucune action supplémentaire ne doit être demandée à l'opérateur si elle peut être automatisée.
Chaque nouvel élément doit réduire la charge mentale, jamais l'augmenter.