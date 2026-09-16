import type { Snippet } from "svelte";
import type { RegisteredClient } from "./Register.js";

export type RealtimeProviderProps = {
  client: RegisteredClient;
  session?: {
    /** Identifies the session, usually the signed-in account. Changing it replaces the connection. */
    id?: string;
    /** Whether a session should be active. Defaults to true. */
    enabled?: boolean;
  };
  children?: Snippet;
};
