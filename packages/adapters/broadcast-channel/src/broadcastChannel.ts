import { createRealtimeAdapter } from "@priemskiyyy/simulcast";
import type {
  AdapterSubscribeRequest,
  AdapterSubscription,
} from "@priemskiyyy/simulcast";
import type { BroadcastChannelAdapterOptions } from "src/types/BroadcastChannelAdapterOptions";

const createSubscription = (
  prefix: string,
  { channel: name, observer }: AdapterSubscribeRequest<MessageEvent>,
): AdapterSubscription<BroadcastChannel> => {
  const channel = new BroadcastChannel(`${prefix}${name}`);
  const handleMessage = (event: MessageEvent) =>
    observer.publication({ data: event.data, native: event });
  const handleMessageError = (event: MessageEvent) =>
    observer.error({ error: event });

  channel.addEventListener("message", handleMessage);
  channel.addEventListener("messageerror", handleMessageError);
  observer.state("subscribed");

  return {
    native: channel,
    dispose: () => {
      channel.removeEventListener("message", handleMessage);
      channel.removeEventListener("messageerror", handleMessageError);
      channel.close();
    },
  };
};

/**
 * Describes same-origin realtime through `BroadcastChannel`: tabs, workers,
 * and tests on one origin publish to each other with no server. A session is
 * always `connected` and every channel is `subscribed` at once.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({ adapter: broadcastChannel({ prefix: "app:" }) });
 * new BroadcastChannel("app:rooms:demo").postMessage({ text: "hello" });
 * ```
 */
export const broadcastChannel = ({
  prefix = "",
}: BroadcastChannelAdapterOptions = {}) =>
  createRealtimeAdapter<null, MessageEvent, BroadcastChannel>({
    name: "broadcast-channel",
    connect: (observer) => {
      observer.state("connected");

      return {
        native: null,
        subscribe: (request) => createSubscription(prefix, request),
        dispose: () => {},
      };
    },
  });
