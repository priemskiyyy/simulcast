import { useChannel } from "src/composables/useChannel";
import type { UseChannelOptions } from "src/composables/useChannel";
import type { ChannelInput } from "src/types/ChannelInput";

const ignorePublication = () => {};

/**
 * Keeps a channel's native subscription open without consuming publications.
 * Demand comes from publication consumers, so pair this with
 * `useNativeChannel` when a component observes the provider's own subscription
 * but reads nothing through Simulcast. The subscription is released when the
 * last consumer, including this one, goes away.
 *
 * @example
 * ```ts
 * useChannelDemand("rooms:demo");
 * const subscription = useNativeChannel("rooms:demo");
 * ```
 */
export const useChannelDemand = (
  channel: ChannelInput,
  // Derived from `useChannel`, minus the parser it has nothing to parse for.
  options: Pick<UseChannelOptions, "enabled"> = {},
) => {
  useChannel(channel, ignorePublication, options);
};
