/** Pusher types its connection state as a plain string; these are the documented values. */
export type PusherConnectionState =
  | "initialized"
  | "connecting"
  | "connected"
  | "unavailable"
  | "failed"
  | "disconnected";
