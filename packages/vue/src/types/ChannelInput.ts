import type { MaybeRefOrGetter } from "vue";

/** The channel argument every composable accepts: a value, a ref, or a getter. */
export type ChannelInput<TChannel extends string = string> =
  MaybeRefOrGetter<TChannel>;
