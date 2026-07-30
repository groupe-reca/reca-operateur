# `src/components`

Composants **purement présentationnels** (UI). Reçoivent leurs données par props/hooks
et n'affichent que ce qu'on leur donne.

Interdits (règles `docs/10-Development-Standards.md`) : transitions d'état, calculs
GPS/temps, accès direct à Supabase ou à Mapbox. Nommage `PascalCase`, ≤ ~250 lignes.
