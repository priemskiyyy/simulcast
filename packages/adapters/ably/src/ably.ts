import { Realtime } from "ably";
import type {
  ChannelOptions,
  ChannelStateChange,
  ConnectionStateChange,
  InboundMessage,
  RealtimeChannel,
} from "ably";
import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
  RealtimePublication,
} from "@priemskiyyy/simulcast";
import type { AblyAdapterOptions } from "src/types/AblyAdapterOptions";
import { CONNECTION_STATES } from "src/utils/constants/connectionStates";
import { SUBSCRIPTION_STATES } from "src/utils/constants/subscriptionStates";

const toPublication = (
  message: InboundMessage,
): RealtimePublication<InboundMessage> => {
  if (message.name === undefined) {
    return { data: message.data, native: message };
  }

  return { event: message.name, data: message.data, native: message };
};

// Attach and detach failures arrive through the state listener with their reason.
const ignoreRejection = () => {};

const createSubscription = (
  client: Realtime,
  { channel: name, observer }: AdapterSubscribeRequest<InboundMessage>,
  options: ChannelOptions | undefined,
): AdapterSubscription<RealtimeChannel> => {
  const channel = client.channels.get(name, options);
  const handleStateChange = (change: ChannelStateChange) => {
    // `update` notices repeat the current state.
    if (change.current === change.previous) {
      return;
    }

    if (change.reason !== undefined) {
      observer.error({ error: change.reason });
    }

    observer.state(SUBSCRIPTION_STATES[change.current]);
  };
  const handleMessage = (message: InboundMessage) =>
    observer.publication(toPublication(message));

  channel.on(handleStateChange);

  // A channel shared with native code may already be attaching; `subscribe` then emits no transition.
  if (channel.state !== "initialized") {
    observer.state(SUBSCRIPTION_STATES[channel.state]);
  }

  channel.subscribe(handleMessage).catch(ignoreRejection);

  return {
    native: channel,
    dispose: () => {
      channel.unsubscribe(handleMessage);
      channel.off(handleStateChange);
      channel.detach().catch(ignoreRejection);
    },
  };
};

/**
 * Describes an Ably connection. Nothing connects until the client starts a
 * session; every session gets a fresh `Realtime` instance.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: ably({ options: { authUrl: "/ably/token" } }),
 * });
 * ```
 */
export const ably = ({ options, getChannelOptions }: AblyAdapterOptions) =>
  createRealtimeAdapter<Realtime, InboundMessage, RealtimeChannel>({
    name: "ably",
    connect: (observer) => {
      // Connect after the listener exists so the first transition is observed.
      const client = new Realtime({ ...options, autoConnect: false });
      const handleStateChange = (change: ConnectionStateChange) => {
        if (change.reason !== undefined) {
          observer.error({ error: change.reason });
        }

        observer.state(CONNECTION_STATES[change.current]);
      };

      client.connection.on(handleStateChange);
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
          client.connection.off(handleStateChange);
          client.close();
        },
      };
    },
  });
