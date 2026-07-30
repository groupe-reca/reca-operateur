# `src/domain`

Modèles et règles métier **purs**, sans framework : types d'états
(`MissionItemState`), tables de transitions, calculs de distance/géométrie, invariants.

**Aucun React, aucune I/O, aucun effet de bord** → entièrement testable en isolation.
Les moteurs (`src/engines`) consomment ce domaine.
