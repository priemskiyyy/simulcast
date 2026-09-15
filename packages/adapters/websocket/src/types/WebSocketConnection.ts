import type { WebSocketLike } from "src/types/WebSocketLike";
import type { WebSocketFrame } from "src/types/WebSocketProtocol";

/** The connection's native handle: the socket changes across reconnects, so it is read on demand. */
export type WebSocketConnection = {
  readonly socket: WebSocketLike | null;
  /** Sends a frame when the socket is open and reports whether it did. */
  send: (frame: WebSocketFrame) => boolean;
};
