/** The part of the WebSocket API the adapter relies on, so other runtimes and tests can supply their own. */
export type WebSocketLike = Pick<
  WebSocket,
  "OPEN" | "readyState" | "send" | "close" | "addEventListener"
>;
