import { createRealtimeAdapter } from "simulcast";
import type { AdapterSubscribeRequest, AdapterSubscription } from "simulcast";
import type { EventSourceLike } from "src/types/EventSourceLike";
import type { SseAdapterOptions } from "src/types/SseAdapterOptions";

const resolveEventSource = (
  implementation: SseAdapterOptions["eventSource"],
) => {
  if (implementation !== undefined) {
    return implementation;
  }

  if (typeof globalThis.EventSource !== "function") {
    throw new Error(
      "No EventSource implementation is available. Pass one through the adapter's eventSource option.",
    );
  }

  return globalThis.EventSource;
};

const createSubscription = (
  Implementation: NonNullable<SseAdapterOptions["eventSource"]>,
  { url, events = [], withCredentials }: SseAdapterOptions,
  { channel, observer }: AdapterSubscribeRequest<MessageEvent>,
): AdapterSubscription<EventSourceLike> => {
  const source = new Implementation(
    url(channel),
    withCredentials === undefined ? undefined : { withCredentials },
  );
  const handleOpen = () => observer.state("subscribed");
  // The browser retries on its own until the stream is closed for good.
  const handleError = (event: Event) => {
    observer.error({ error: event });
    observer.state(
      source.readyState === source.CLOSED ? "unsubscribed" : "subscribing",
    );
  };
  const handleMessage = (event: Event) => {
    if (!(event instanceof MessageEvent)) {
      return;
    }

    if (event.type === "message") {
      observer.publication({ data: event.data, native: event });
      return;
    }

    observer.publication({
      event: event.type,
      data: event.data,
      native: event,
    });
  };

  source.addEventListener("open", handleOpen);
  source.addEventListener("error", handleError);
  source.addEventListener("message", handleMessage);

  for (const event of events) {
    source.addEventListener(event, handleMessage);
  }

  observer.state("subscribing");

  return {
    native: source,
    dispose: () => {
      source.removeEventListener("open", handleOpen);
      source.removeEventListener("error", handleError);
      source.removeEventListener("message", handleMessage);

      for (const event of events) {
        source.removeEventListener(event, handleMessage);
      }

      source.close();
    },
  };
};

/**
 * Describes Server-Sent Events streams, one `EventSource` per channel. There
 * is no shared connection, so the adapter reports `connected` as soon as a
 * session starts and each channel carries its own stream state.
 *
 * @example
 * ```ts
 * const realtime = new RealtimeClient({
 *   adapter: sse({
 *     url: (channel) => `/events/${encodeURIComponent(channel)}`,
 *     events: ["created", "deleted"],
 *   }),
 * });
 * ```
 */
export const sse = (options: SseAdapterOptions) =>
  createRealtimeAdapter<null, MessageEvent, EventSourceLike>({
    name: "sse",
    connect: (observer) => {
      const Implementation = resolveEventSource(options.eventSource);
      observer.state("connected");

      return {
        native: null,
        subscribe: (request) =>
          createSubscription(Implementation, options, request),
        dispose: () => {},
      };
    },
  });
