import type { EventSourceLike } from "src/types/EventSourceLike";

export type SseAdapterOptions = {
  /** Builds the stream URL for a channel. */
  url: (channel: string) => string;
  /** Named events to deliver in addition to plain messages; EventSource has no wildcard. */
  events?: string[];
  withCredentials?: boolean;
  /** EventSource implementation, for Node or tests. Defaults to the global one. */
  eventSource?: new (url: string, init?: EventSourceInit) => EventSourceLike;
};
