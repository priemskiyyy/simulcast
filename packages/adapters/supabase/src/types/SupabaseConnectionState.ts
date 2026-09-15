/** realtime-js widens its connection state to any string; these are the documented values. */
export type SupabaseConnectionState =
  "connecting" | "open" | "closing" | "closed";
