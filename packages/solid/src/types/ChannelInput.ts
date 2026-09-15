import type { Accessor } from "solid-js";

/** The channel argument every primitive accepts: a value or an accessor. */
export type ChannelInput<TChannel extends string = string> =
  TChannel | Accessor<TChannel>;
