/** The channel argument every utility accepts: a value or a getter. */
export type ChannelInput<TChannel extends string = string> =
  TChannel | (() => TChannel);
