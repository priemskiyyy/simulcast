export type WebSocketFrame = Parameters<WebSocket["send"]>[0];

export type WebSocketPublication = {
  channel: string;
  data: unknown;
  event?: string;
};

/** How channels and publications are encoded on your socket. */
export type WebSocketProtocol = {
  /** Frame sent when a channel is demanded, or null when the server needs none. */
  subscribe: (channel: string) => WebSocketFrame | null;
  /** Frame sent when the last consumer leaves, or null. */
  unsubscribe: (channel: string) => WebSocketFrame | null;
  /** Routes an incoming frame to a channel, or returns null to ignore it. */
  decode: (message: MessageEvent) => WebSocketPublication | null;
};
