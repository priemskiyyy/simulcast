/**
 * Coarse connection state shared by adapters and the core.
 *
 * `connecting` means the provider is not connected and keeps trying on its
 * own, including reconnects after a network loss. `disconnected` means the
 * provider stopped and will not connect again without a new session.
 * Adapters map richer native states onto these by that meaning, not by name.
 */
export type ConnectionState = "connecting" | "connected" | "disconnected";
