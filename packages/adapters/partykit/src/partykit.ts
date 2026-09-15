import { PartySocket } from "partysocket";
import { createRealtimeAdapter } from "simulcast";
import type { AdapterSubscribeRequest, AdapterSubscription } from "simulcast";
import type { PartykitAdapterOptions } from "src/types/PartykitAdapterOptions";

const createSubscription = (
  options: PartykitAdapterOptions,
  { channel: room, observer }: AdapterSubscribeRequest<MessageEvent>,
): AdapterSubscription<PartySocket> => {
  const socket = new PartySocket({ ...options, room });
  const handleOpen = () => observer.state("subscribed");
  // PartySocket reconnects on its own until `close()`, which only dispose calls.
  const handleClose = () =>
    observer.state(socket.shouldReconnect ? "subscribing" : "unsubscribed");
  const handleError = (event: Event) => observer.error({ error: event });
  const handleMessage = (event: MessageEvent) =>
    observer.publication({ data: event.data, native: event });

  socket.addEventListener("open", handleOpen);
  socket.addEventListener("close", handleClose);
  socket.addEventListener("error", handleError);
  socket.addEventListener("message", handleMessage);
  observer.state("subscribing");

  return {
    native: socket,
    dispose: () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
      socket.removeEventListener("message", handleMessage);
      socket.close();
    },
  };
};

/**
 * Describes PartyKit or PartyServer rooms on Cloudflare, one `PartySocket`
 * per channel. There is no shared connection, so the adapter reports
 * `connected` as soon as a session starts and each room carries its own state.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: partykit({ host: "chat.example.partykit.dev", party: "chat" }),
 * });
 * ```
 */
export const partykit = (options: PartykitAdapterOptions) =>
  createRealtimeAdapter<null, MessageEvent, PartySocket>({
    name: "partykit",
    connect: (observer) => {
      observer.state("connected");

      return {
        native: null,
        subscribe: (request) => createSubscription(options, request),
        dispose: () => {},
      };
    },
  });
