import type { AdapterError } from "src/types/AdapterError";
import type { ConnectionState } from "src/types/ConnectionState";

/** Callbacks an adapter connection reports into. Silent once disposal starts. */
export type AdapterConnectionObserver = {
  state: (state: ConnectionState) => void;
  error: (error: AdapterError) => void;
};
