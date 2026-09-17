import type { ChannelInput } from "../types/ChannelInput.js";
import type { ReadableBox } from "../types/ReadableBox.js";
import type { RegisteredNativeSubscription } from "../types/Register.js";
import { extract } from "./internal/extract.js";
import { useObservableValue } from "./internal/useObservableValue.svelte.js";
import { useRealtimeClient } from "./useRealtimeClient.js";

/**
 * The adapter's native subscription for a channel, or `null` while none
 * exists. Observing it never opens one: it follows the subscription a
 * `useChannel` consumer demanded and returns to `null` when the last one
 * leaves. Its type comes from the registered client, and is `unknown` until
 * `Register` is augmented. Call it during component initialisation.
 *
 * @example
 * ```ts
 * const subscription = useNativeChannel(() => `rooms:${roomId}`);
 *
 * $effect(() => {
 *   const current = subscription.current;
 *
 *   if (current === null) {
 *     return;
 *   }
 *
 *   current.on("join", handleJoin);
 *   return () => current.off("join", handleJoin);
 * });
 * ```
 */
export const useNativeChannel = (
  channel: ChannelInput,
): ReadableBox<RegisteredNativeSubscription | null> => {
  const client = useRealtimeClient();
  const name = $derived(extract(channel));

  return useObservableValue(() => client.current.channel(name).native);
};
