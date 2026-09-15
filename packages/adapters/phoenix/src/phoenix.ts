import { Socket } from "phoenix";
import type { Channel } from "phoenix";
import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
} from "@priemskiyyy/simulcast";
import type { PhoenixAdapterOptions } from "src/types/PhoenixAdapterOptions";
import type { PhoenixPublication } from "src/types/PhoenixPublication";

// Replies and lifecycle frames travel through the same hook as application events.
const isProtocolEvent = (event: string) =>
  event.startsWith("phx_") || event.startsWith("chan_reply_");

const createSubscription = (
  socket: Socket,
  { channel: topic, observer }: AdapterSubscribeRequest<PhoenixPublication>,
  params: object | undefined,
): AdapterSubscription<Channel> => {
  const channel = socket.channel(topic, params);

  // `onMessage` is Phoenix's hook for every incoming event; it must hand the payload back.
  channel.onMessage = (event: string, payload: unknown, ref: unknown) => {
    if (isProtocolEvent(event)) {
      return payload;
    }

    observer.publication({
      event,
      data: payload,
      native: { event, payload, ref },
    });
    return payload;
  };

  // Phoenix rejoins after errors and timeouts until the channel leaves.
  const reportRetry = (reason: unknown) => {
    observer.error({ error: reason });
    observer.state("subscribing");
  };

  channel.onError(reportRetry);
  channel.onClose(() => observer.state("unsubscribed"));
  observer.state("subscribing");
  channel
    .join()
    .receive("ok", () => observer.state("subscribed"))
    .receive("error", reportRetry)
    .receive("timeout", () => observer.state("subscribing"));

  return {
    native: channel,
    dispose: () => {
      channel.leave();
    },
  };
};

/**
 * Describes a Phoenix Channels connection. Nothing connects until the client
 * starts a session; every session gets a fresh `Socket`.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: phoenix({
 *     url: "wss://example.com/socket",
 *     options: { params: { token } },
 *   }),
 * });
 * ```
 */
export const phoenix = ({
  url,
  options,
  getChannelParams,
}: PhoenixAdapterOptions) =>
  createRealtimeAdapter<Socket, PhoenixPublication, Channel>({
    name: "phoenix",
    connect: (observer) => {
      const socket = new Socket(url, options);
      const refs = [
        socket.onOpen(() => observer.state("connected")),
        // Phoenix reconnects after every close until `disconnect()`, which only dispose calls.
        socket.onClose(() => observer.state("connecting")),
        socket.onError((error: unknown) => observer.error({ error })),
      ];

      observer.state("connecting");
      socket.connect();

      return {
        native: socket,
        subscribe: (request) =>
          createSubscription(
            socket,
            request,
            typeof getChannelParams === "function"
              ? getChannelParams(request.channel)
              : undefined,
          ),
        dispose: () => {
          socket.off(refs);
          socket.disconnect();
        },
      };
    },
  });
