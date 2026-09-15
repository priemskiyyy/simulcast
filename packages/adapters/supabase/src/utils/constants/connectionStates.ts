import type { ConnectionState } from "simulcast";
import type { SupabaseConnectionState } from "src/types/SupabaseConnectionState";

// realtime-js retries after every close until `disconnect()`, which only dispose calls.
export const CONNECTION_STATES: Record<
  SupabaseConnectionState,
  ConnectionState
> = {
  connecting: "connecting",
  open: "connected",
  closing: "disconnected",
  closed: "connecting",
};
