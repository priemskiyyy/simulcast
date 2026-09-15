/** A Supabase broadcast message; `payload` holds what the sender broadcast. */
export type SupabasePublication = { event: string; [key: string]: unknown };
