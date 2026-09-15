import type { AdapterSubscribeRequest } from "src/types/AdapterSubscribeRequest";
import type { AdapterSubscription } from "src/types/AdapterSubscription";

/**
 * One provider connection owned by the adapter.
 *
 * The core calls `subscribe` at most once per demanded channel on this
 * connection; adapters never deduplicate. `dispose` releases the connection and
 * every subscription created through it, and is idempotent.
 * Adapters created with `createRealtimeAdapter` attempt every cleanup before
 * rethrowing one failure or combining multiple failures in an `AggregateError`.
 */
export type AdapterConnection<
  TNativeConnection = unknown,
  TNativePublication = unknown,
  TNativeSubscription = unknown,
> = {
  native: TNativeConnection;
  subscribe: (
    request: AdapterSubscribeRequest<TNativePublication>,
  ) => AdapterSubscription<TNativeSubscription>;
  dispose: () => void;
};
