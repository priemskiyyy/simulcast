import type { SocketConnectOption } from "phoenix";

export type PhoenixAdapterOptions = {
  url: string;
  options?: Partial<SocketConnectOption>;
  /** Per-channel join params, such as a channel token. */
  getChannelParams?: (channel: string) => object;
};
