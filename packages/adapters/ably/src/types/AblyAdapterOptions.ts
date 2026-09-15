import type { ChannelOptions, ClientOptions } from "ably";

export type AblyAdapterOptions = {
  options: ClientOptions;
  /** Per-channel options, such as `params` for rewind or `modes`. */
  getChannelOptions?: (channel: string) => ChannelOptions;
};
