# `src/context`

Pont React entre les moteurs et l'UI (ex. `MissionContext`). Expose aux composants
**uniquement** les données utiles à l'affichage — jamais une copie complète de la base.

Doit rester mince : ne pas devenir un objet géant recréé à chaque fix GPS
(voir `docs/10-Development-Standards.md`, « Mise à jour GPS »).
