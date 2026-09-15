import type { AdapterSubscription } from "src/types/AdapterSubscription";
import type { RealtimeAdapter } from "src/types/RealtimeAdapter";
import { captureError } from "src/utils/internal/captureError";

/**
 * Adds the contract's bookkeeping to a provider mapping: idempotent disposal,
 * subscriptions released with their connection, and silence after dispose.
 * The mapping only creates native resources and forwards their events.
 *
 * @example
 * ```ts
 * export const provider = (options: ProviderOptions) =>
 *   createRealtimeAdapter<Client, Message, Channel>({
 *     name: "provider",
 *     connect: (observer) => {
 *       const client = new Client(options);
 *       client.onState((state) => observer.state(mapState(state)));
 *       return { native: client, subscribe, dispose: () => client.close() };
 *     },
 *   });
 * ```
 */
export const createRealtimeAdapter = <
  TNativeConnection,
  TNativePublication,
  TNativeSubscription,
>(
  adapter: RealtimeAdapter<
    TNativeConnection,
    TNativePublication,
    TNativeSubscription
  >,
): RealtimeAdapter<
  TNativeConnection,
  TNativePublication,
  TNativeSubscription
> => ({
  name: adapter.name,
  connect: (observer) => {
    const owned = new Set<AdapterSubscription<TNativeSubscription>>();
    let disposed = false;

    const connection = adapter.connect({
      state: (state) => {
        if (disposed) {
          return;
        }

        observer.state(state);
      },
      error: (error) => {
        if (disposed) {
          return;
        }

        observer.error(error);
      },
    });

    return {
      native: connection.native,
      subscribe: ({ channel, observer }) => {
        if (disposed) {
          throw new Error(
            `Cannot subscribe to ${channel} through a disposed ${adapter.name} connection.`,
          );
        }

        let released = false;
        const subscription = connection.subscribe({
          channel,
          observer: {
            state: (state) => {
              if (released) {
                return;
              }

              observer.state(state);
            },
            error: (error) => {
              if (released) {
                return;
              }

              observer.error(error);
            },
            publication: (publication) => {
              if (released) {
                return;
              }

              observer.publication(publication);
            },
          },
        });

        const owner: AdapterSubscription<TNativeSubscription> = {
          native: subscription.native,
          dispose: () => {
            if (released) {
              return;
            }

            released = true;
            owned.delete(owner);
            subscription.dispose();
          },
        };
        owned.add(owner);
        return owner;
      },
      dispose: () => {
        if (disposed) {
          return;
        }

        disposed = true;

        const errors = [
          ...[...owned].flatMap((subscription) =>
            captureError(() => subscription.dispose()),
          ),
          ...captureError(() => connection.dispose()),
        ];

        if (errors.length === 1) {
          throw errors[0];
        }

        if (errors.length > 1) {
          throw new AggregateError(errors, "Adapter cleanup failed.");
        }
      },
    };
  },
});
