import { RealtimeClient } from "@supabase/realtime-js";
import type {
  RealtimeChannel,
  RealtimeChannelOptions,
} from "@supabase/realtime-js";
import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
} from "@priemskiyyy/simulcast";
import type { SupabaseAdapterOptions } from "src/types/SupabaseAdapterOptions";
import type { SupabasePublication } from "src/types/SupabasePublication";
import { CONNECTION_STATES } from "src/utils/constants/connectionStates";
import { SUBSCRIPTION_STATES } from "src/utils/constants/subscriptionStates";
import { isSupabaseConnectionState } from "src/utils/isSupabaseConnectionState";

// Removal and disconnection report their outcome through the state listeners.
const ignoreRejection = () => {};

const createSubscription = (
  client: RealtimeClient,
  { channel: topic, observer }: AdapterSubscribeRequest<SupabasePublication>,
  options: RealtimeChannelOptions | undefined,
): AdapterSubscription<RealtimeChannel> => {
  const channel = client.channel(topic, options);

  // Postgres changes and presence are provider features; only broadcasts are publications.
  channel.on("broadcast", { event: "*" }, (message: SupabasePublication) =>
    observer.publication({
      event: message.event,
      data: message.payload,
      native: message,
    }),
  );
  observer.state("subscribing");
  channel.subscribe((status, error) => {
    if (error !== undefined) {
      observer.error({ error });
    }

    observer.state(SUBSCRIPTION_STATES[status]);
  });

  return {
    native: channel,
    dispose: () => {
      client.removeChannel(channel).catch(ignoreRejection);
    },
  };
};

/**
 * Describes a Supabase Realtime connection. Nothing connects until the client
 * starts a session; every session gets a fresh `RealtimeClient`.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: supabase({
 *     url: "wss://project.supabase.co/realtime/v1",
 *     options: { params: { apikey: SUPABASE_ANON_KEY }, accessToken: getAccessToken },
 *   }),
 * });
 * ```
 */
export const supabase = ({
  url,
  options,
  getChannelOptions,
}: SupabaseAdapterOptions) =>
  createRealtimeAdapter<RealtimeClient, SupabasePublication, RealtimeChannel>({
    name: "supabase",
    connect: (observer) => {
      const client = new RealtimeClient(url, options);
      // The socket exposes its listeners as `[ref, callback]` tuples rather than `on` methods.
      const ref = `simulcast-${Math.random().toString(36).slice(2)}`;
      const callbacks = client.stateChangeCallbacks;
      const reportState = () => {
        const current = client.connectionState();

        if (!isSupabaseConnectionState(current)) {
          return;
        }

        observer.state(CONNECTION_STATES[current]);
      };

      callbacks.open.push([ref, reportState]);
      callbacks.close.push([ref, reportState]);
      callbacks.error.push([
        ref,
        (error: unknown) => observer.error({ error }),
      ]);
      observer.state("connecting");
      client.connect();

      return {
        native: client,
        subscribe: (request) =>
          createSubscription(
            client,
            request,
            typeof getChannelOptions === "function"
              ? getChannelOptions(request.channel)
              : undefined,
          ),
        dispose: () => {
          callbacks.open = callbacks.open.filter(([id]) => id !== ref);
          callbacks.close = callbacks.close.filter(([id]) => id !== ref);
          callbacks.error = callbacks.error.filter(([id]) => id !== ref);
          client.disconnect().catch(ignoreRejection);
        },
      };
    },
  });
