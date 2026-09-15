import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type { AdapterSubscriptionObserver } from "@priemskiyyy/simulcast";
import type { WebSocketAdapterOptions } from "src/types/WebSocketAdapterOptions";
import type { WebSocketConnection } from "src/types/WebSocketConnection";
import type { WebSocketLike } from "src/types/WebSocketLike";
import type { WebSocketFrame } from "src/types/WebSocketProtocol";

const DEFAULT_RECONNECT_DELAY = 1_000;

const resolveWebSocket = (
  implementation: WebSocketAdapterOptions["webSocket"],
) => {
  if (implementation !== undefined) {
    return implementation;
  }

  if (typeof globalThis.WebSocket !== "function") {
    throw new Error(
      "No WebSocket implementation is available. Pass one through the adapter's webSocket option.",
    );
  }

  return globalThis.WebSocket;
};

/**
 * Describes one multiplexed WebSocket speaking your own protocol, such as a
 * Cloudflare Durable Object or a Hono route. Channels are subscribed by frame
 * and publications are routed by the protocol's decoder. The adapter reopens
 * the socket after a close and resubscribes every demanded channel.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: websocket({
 *     url: () => `wss://example.com/realtime?token=${readToken()}`,
 *     protocol: {
 *       subscribe: (channel) => JSON.stringify({ type: "subscribe", channel }),
 *       unsubscribe: (channel) => JSON.stringify({ type: "unsubscribe", channel }),
 *       decode: ({ data }) => JSON.parse(String(data)),
 *     },
 *   }),
 * });
 * ```
 */
export const websocket = ({
  url,
  protocol,
  reconnectDelay = DEFAULT_RECONNECT_DELAY,
  webSocket,
}: WebSocketAdapterOptions) =>
  createRealtimeAdapter<WebSocketConnection, MessageEvent, string>({
    name: "websocket",
    connect: (observer) => {
      const Implementation = resolveWebSocket(webSocket);
      const channels = new Map<
        string,
        AdapterSubscriptionObserver<MessageEvent>
      >();
      let socket: WebSocketLike | null = null;
      let attempt = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let disposed = false;

      const send = (frame: WebSocketFrame | null) => {
        if (frame === null) {
          return false;
        }

        if (socket === null) {
          return false;
        }

        if (socket.readyState !== socket.OPEN) {
          return false;
        }

        socket.send(frame);
        return true;
      };

      const delayAfter = (event: CloseEvent) =>
        typeof reconnectDelay === "function"
          ? reconnectDelay(attempt, event)
          : reconnectDelay;

      const open = () => {
        const current = new Implementation(
          typeof url === "function" ? url() : url,
        );
        const handleOpen = () => {
          attempt = 0;
          observer.state("connected");

          for (const [channel, channelObserver] of channels) {
            send(protocol.subscribe(channel));
            channelObserver.state("subscribed");
          }
        };
        const handleMessage = (message: MessageEvent) => {
          const publication = protocol.decode(message);

          if (publication === null) {
            return;
          }

          const channelObserver = channels.get(publication.channel);

          if (channelObserver === undefined) {
            return;
          }

          const { event, data } = publication;
          channelObserver.publication(
            event === undefined
              ? { data, native: message }
              : { event, data, native: message },
          );
        };
        const handleError = (event: Event) => observer.error({ error: event });
        const handleClose = (event: CloseEvent) => {
          if (disposed) {
            return;
          }

          // A socket replaced by a reconnect can still close afterwards.
          if (socket !== current) {
            return;
          }

          socket = null;
          const delay = delayAfter(event);

          if (delay <= 0) {
            observer.state("disconnected");

            for (const channelObserver of channels.values()) {
              channelObserver.state("unsubscribed");
            }

            return;
          }

          attempt += 1;
          // Arm cleanup before notifying observers, which can dispose the connection.
          timer = setTimeout(open, delay);
          observer.state("connecting");

          for (const channelObserver of channels.values()) {
            channelObserver.state("subscribing");
          }
        };

        socket = current;
        observer.state("connecting");
        current.addEventListener("open", handleOpen);
        current.addEventListener("message", handleMessage);
        current.addEventListener("error", handleError);
        current.addEventListener("close", handleClose);
      };

      open();

      return {
        native: {
          get socket() {
            return socket;
          },
          send,
        },
        subscribe: ({ channel, observer: channelObserver }) => {
          channels.set(channel, channelObserver);
          const sent = send(protocol.subscribe(channel));
          channelObserver.state(sent ? "subscribed" : "subscribing");

          return {
            native: channel,
            dispose: () => {
              channels.delete(channel);
              send(protocol.unsubscribe(channel));
            },
          };
        },
        dispose: () => {
          disposed = true;
          clearTimeout(timer);

          if (socket === null) {
            return;
          }

          socket.close();
        },
      };
    },
  });
