import type { ConnectionState } from "@priemskiyyy/simulcast";

export const formatConnectionState = (state: ConnectionState) => {
  const LABELS: Record<ConnectionState, string> = {
    connected: "Connected",
    connecting: "Connecting",
    disconnected: "Disconnected",
  };

  return LABELS[state];
};
