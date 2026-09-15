import type { AdapterConnectionObserver } from "src/types/AdapterConnectionObserver";
import type { AdapterSubscriptionObserver } from "src/types/AdapterSubscriptionObserver";
import type { RealtimeAdapter } from "src/types/RealtimeAdapter";

export type MockSubscription = {
  channel: string;
  /** Raw observer. The mock never guards it, so tests can emit after dispose. */
  observer: AdapterSubscriptionObserver;
  disposeCount: number;
};

export type MockConnection = {
  observer: AdapterConnectionObserver;
  /** Every `subscribe` call that returned, in order, including disposed ones. */
  subscriptions: MockSubscription[];
  disposeCount: number;
};

export type MockAdapterOptions = {
  /** Runs inside `connect` once the connection is recorded. Throw to fail setup, or emit state synchronously. */
  onConnect?: (connection: MockConnection) => void;
  /** Runs inside `subscribe` once the subscription is recorded. */
  onSubscribe?: (
    subscription: MockSubscription,
    connection: MockConnection,
  ) => void;
};

/** A throwing hook means the provider failed to create the resource, so nothing stays recorded. */
const record = <TResource>(
  resources: TResource[],
  resource: TResource,
  hook: () => void,
) => {
  resources.push(resource);

  try {
    hook();
  } catch (error) {
    resources.splice(resources.indexOf(resource), 1);
    throw error;
  }
};

/**
 * Deterministic adapter for core tests. It records calls and exposes raw
 * observers; it is deliberately not well behaved, so tests can drive late,
 * duplicate, synchronous, and reentrant callbacks.
 */
export const createMockAdapter = (options: MockAdapterOptions = {}) => {
  const connections: MockConnection[] = [];

  const adapter: RealtimeAdapter<MockConnection, unknown, MockSubscription> = {
    name: "mock",
    connect: (observer) => {
      const connection: MockConnection = {
        observer,
        subscriptions: [],
        disposeCount: 0,
      };
      record(connections, connection, () => {
        if (typeof options.onConnect !== "function") {
          return;
        }

        options.onConnect(connection);
      });

      return {
        native: connection,
        subscribe: (request) => {
          const subscription: MockSubscription = {
            channel: request.channel,
            observer: request.observer,
            disposeCount: 0,
          };
          record(connection.subscriptions, subscription, () => {
            if (typeof options.onSubscribe !== "function") {
              return;
            }

            options.onSubscribe(subscription, connection);
          });

          return {
            native: subscription,
            dispose: () => {
              subscription.disposeCount += 1;
            },
          };
        },
        dispose: () => {
          connection.disposeCount += 1;
        },
      };
    },
  };

  return { adapter, connections };
};
