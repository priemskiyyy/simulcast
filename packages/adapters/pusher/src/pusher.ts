import Pusher from "pusher-js";
import type { Channel } from "pusher-js";
import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
} from "@priemskiyyy/simulcast";
import type { PusherAdapterOptions } from "src/types/PusherAdapterOptions";
import type { PusherPublication } from "src/types/PusherPublication";
import { CONNECTION_STATES } from "src/utils/constants/connectionStates";
import { isPusherConnectionState } from "src/utils/isPusherConnectionState";

const createSubscription = (
  client: Pusher,
  { channel: name, observer }: AdapterSubscribeRequest<PusherPublication>,
): AdapterSubscription<Channel> => {
  // Pusher shares one channel object per name, so it may already be subscribed through the native client.
  const channel = client.subscribe(name);
  let subscribed = channel.subscribed;

  const handleEvent = (event: string, data: unknown) => {
    if (event === "pusher:subscription_succeeded") {
      subscribed = true;
      observer.state("subscribed");
      return;
    }

    if (event === "pusher:subscription_error") {
      observer.error({ error: data });
      observer.state("unsubscribed");
      return;
    }

    // Remaining `pusher:` events are presence and protocol notices, reachable through `native`.
    if (event.startsWith("pusher:")) {
      return;
    }

    observer.publication({ event, data, native: { event, data } });
  };

  // Pusher resubscribes silently after a reconnect; report the gap the way the channel experiences it.
  const handleConnectionChange = ({ current }: { current: string }) => {
    if (current === "connected") {
      return;
    }

    if (!subscribed) {
      return;
    }

    subscribed = false;
    observer.state("subscribing");
  };

  channel.bind_global(handleEvent);
  client.connection.bind("state_change", handleConnectionChange);
  observer.state(subscribed ? "subscribed" : "subscribing");

  return {
    native: channel,
    dispose: () => {
      channel.unbind_global(handleEvent);
      client.connection.unbind("state_change", handleConnectionChange);
      client.unsubscribe(name);
    },
  };
};

/**
 * Describes a Pusher Channels connection. Nothing connects until the client
 * starts a session; every session gets a fresh `Pusher` instance.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: pusher({ key: PUSHER_KEY, options: { cluster: "eu" } }),
 * });
 * ```
 */
export const pusher = ({ key, options }: PusherAdapterOptions) =>
  createRealtimeAdapter<Pusher, PusherPublication, Channel>({
    name: "pusher",
    connect: (observer) => {
      const authorization = options.channelAuthorization;
      const customHandler =
        authorization !== undefined && "customHandler" in authorization
          ? authorization.customHandler
          : undefined;
      const client = new Pusher(
        key,
        customHandler === undefined
          ? options
          : {
              ...options,
              channelAuthorization: {
                ...options.channelAuthorization,
                customHandler(params, callback) {
                  // A synchronous rejection can precede the channel listener below.
                  customHandler.call(this, params, (...result) => {
                    queueMicrotask(() => callback(...result));
                  });
                },
              },
            },
      );

      const handleStateChange = ({ current }: { current: string }) => {
        if (!isPusherConnectionState(current)) {
          return;
        }

        observer.state(CONNECTION_STATES[current]);
      };
      const handleError = (error: unknown) => observer.error({ error });

      client.connection.bind("state_change", handleStateChange);
      client.connection.bind("error", handleError);

      // The constructor connects before the listener above existed.
      handleStateChange({ current: client.connection.state });

      return {
        native: client,
        subscribe: (request) => createSubscription(client, request),
        dispose: () => {
          client.connection.unbind("state_change", handleStateChange);
          client.connection.unbind("error", handleError);
          // pusher-js emits connecting before creating its transport and timer.
          // Let that callback finish before disconnect releases them:
          // https://github.com/pusher/pusher-js/blob/v8.6.0/src/core/connection/connection_manager.ts
          queueMicrotask(() => client.disconnect());
        },
      };
    },
  });
