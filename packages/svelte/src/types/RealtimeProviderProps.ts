import type { Snippet } from "svelte";
import type { RealtimeClient } from "simulcast";

export type RealtimeProviderProps = {
  client: RealtimeClient;
  session?: {
    /** Identifies the session, usually the signed-in account. Changing it replaces the connection. */
    id?: string;
    /** Whether a session should be active. Defaults to true. */
    enabled?: boolean;
  };
  children?: Snippet;
};
