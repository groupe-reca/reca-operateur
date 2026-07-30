# `src/engines`

Moteurs métier **indépendants de React** (ne jamais importer React). Chacun a une
responsabilité unique et communique par **événements**. Dépendances **injectées**
(horloge, stockage, logger, client API) pour la testabilité.

Sous-moteurs (voir `docs/02-Application-Architecture.md` et les docs dédiées) :

- `state-machine/` — **décide** de toutes les transitions d'état (autorité métier).
- `gps/` — **détecte** : positions, distances, rayons, cap ; publie des événements.
- `map/` — **affiche** : contrôle exclusif de Mapbox (caméra, couches, tracé, tracteur).
- `voice/` — **informe** : annonces vocales (file, priorités), ne décide jamais.
- `sync/` — **transmet** : file de synchronisation vers RECA App, idempotence, conflits.
- `offline/` — **maintient la continuité** : détection réseau, reprise au retour.

Aucun moteur ne dépend d'un autre ; ils s'échangent uniquement des événements.
