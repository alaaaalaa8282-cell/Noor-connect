/**
 * Local-only auth shim.
 *
 * This re-exports the simple local auth implementation so any
 * existing imports from `@/hooks/useAuth` keep working without
 * requiring Supabase or any remote backend.
 */
export { useAuth } from "./useLocalAuth";
