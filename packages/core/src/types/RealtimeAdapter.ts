import type { AdapterConnection } from "src/types/AdapterConnection";
import type { AdapterConnectionObserver } from "src/types/AdapterConnectionObserver";

/**
 * Cold description of a provider. Creating an adapter opens nothing.
 *
 * `connect` synchronously creates a fresh native client, returns ownership of
 * it, and reports connection progress through the observer afterwards. Every
 * call creates a new native client. `name` is for diagnostics only; the core
 * never branches on it.
 */
export type RealtimeAdapter<
  TNativeConnection = unknown,
  TNativePublication = unknown,
  TNativeSubscription = unknown,
> = {
  name: string;
  connect: (
    observer: AdapterConnectionObserver,
  ) => AdapterConnection<
    TNativeConnection,
    TNativePublication,
    TNativeSubscription
  >;
};
