import type { State } from "centrifuge";
import type { ConnectionState } from "@priemskiyyy/simulcast";

// Centrifugo's `connecting` already covers reconnect attempts, so the states map one to one.
export const CONNECTION_STATES: Record<`${State}`, ConnectionState> = {
  disconnected: "disconnected",
  connecting: "connecting",
  connected: "connected",
};
