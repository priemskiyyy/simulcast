import type { WebSocketLike } from "src/types/WebSocketLike";
import type { WebSocketProtocol } from "src/types/WebSocketProtocol";

export type WebSocketAdapterOptions = {
  /** The socket URL, or a function when it carries a fresh token. */
  url: string | (() => string);
  protocol: WebSocketProtocol;
  /** Delay before reopening after a close, in milliseconds. A function receives the attempt and the close event. 0 stops reconnecting. Defaults to 1000. */
  reconnectDelay?: number | ((attempt: number, event: CloseEvent) => number);
  /** WebSocket implementation, for Node or tests. Defaults to the global one. */
  webSocket?: new (url: string) => WebSocketLike;
};
