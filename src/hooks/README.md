# `src/hooks`

Hooks React **minces** qui adaptent les moteurs/contextes aux composants
(`useSyncExternalStore` sur un snapshot, abonnements aux événements). **Aucune logique
métier** : ils lisent l'état des moteurs et relaient les actions, rien de plus.
