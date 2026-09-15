import type { ConnectionState } from "simulcast";
import type { PusherConnectionState } from "src/types/PusherConnectionState";

// `unavailable` keeps retrying; `failed` means no usable transport, so it never will.
export const CONNECTION_STATES: Record<PusherConnectionState, ConnectionState> =
  {
    initialized: "disconnected",
    connecting: "connecting",
    connected: "connected",
    unavailable: "connecting",
    failed: "disconnected",
    disconnected: "disconnected",
  };
