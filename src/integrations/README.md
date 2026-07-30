# `src/integrations`

Adaptateurs vers les systèmes externes, derrière des interfaces **remplaçables** :
client Supabase, Mapbox, synthèse vocale native. Les composants ne les touchent jamais
directement — l'accès passe par les moteurs/services.

Aucun secret en dur : clés via variables d'environnement / stockage sécurisé.
