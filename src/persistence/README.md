# `src/persistence`

Stockage **local-first** : schémas locaux, migrations, repositories, transactions
atomiques. C'est la **source immédiate** pendant une mission (jamais Supabase en direct).

Toute action terrain est écrite ici **avant** synchronisation. Voir
`docs/07-Synchronization.md` et `docs/08-Offline-Mode.md`.
