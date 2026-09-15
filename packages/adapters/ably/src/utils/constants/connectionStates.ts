import type { ConnectionState as AblyConnectionState } from "ably";
import type { ConnectionState } from "@priemskiyyy/simulcast";

// `disconnected` and `suspended` keep retrying on their own; `closed` and `failed` do not.
export const CONNECTION_STATES: Record<AblyConnectionState, ConnectionState> = {
  initialized: "disconnected",
  connecting: "connecting",
  connected: "connected",
  disconnected: "connecting",
  suspended: "connecting",
  closing: "disconnected",
  closed: "disconnected",
  failed: "disconnected",
};
