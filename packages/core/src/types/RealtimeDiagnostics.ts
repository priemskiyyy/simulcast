import type { AdapterError } from "src/types/AdapterError";
import type { ChannelState } from "src/types/ChannelState";
import type { ConnectionState } from "src/types/ConnectionState";

export type RealtimeSnapshot = {
  /** The adapter's diagnostic name, such as `centrifugo`. */
  adapter: string;
  session: { id: number } | null;
  connection: ConnectionState;
  channels: Array<{
    name: string;
    state: ChannelState;
    error: AdapterError | null;
    recovered: boolean;
    consumers: { publications: number; status: number };
  }>;
};

export type RealtimeDiagnosticEvent = {
  /** `connection` and `channel` come from the adapter. `runtime` is the core's own lifecycle. */
  source: "connection" | "channel" | "runtime";
  channel: string | null;
  type: string;
  timestamp: number;
  context: unknown;
};

/** Read-only view for devtools. Observers never create or keep subscriptions. */
export type RealtimeDiagnostics = {
  get: () => RealtimeSnapshot;
  subscribe: (listener: () => void) => () => void;
  events: {
    subscribe: (
      listener: (event: RealtimeDiagnosticEvent) => void,
    ) => () => void;
  };
};
