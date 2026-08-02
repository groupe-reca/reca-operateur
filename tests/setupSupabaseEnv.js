// Jest never runs `expo start`'s env loader (that's an Expo CLI concept,
// see docs/10) — process.env.EXPO_PUBLIC_* is otherwise empty under test.
// Dummy values only: no test hits the real network, supabaseSyncTransport
// tests inject a fake SupabaseClient (see tests/supabaseSyncTransport.test.ts).
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
