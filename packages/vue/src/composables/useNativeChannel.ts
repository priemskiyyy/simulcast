import { toValue } from "vue";
import type { ShallowRef } from "vue";
import { useObservableValue } from "src/composables/internal/useObservableValue";
import { useRealtimeClient } from "src/composables/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";
import type { RegisteredNativeSubscription } from "src/types/Register";

/**
 * The adapter's native subscription for a channel as a readonly ref, or `null`
 * while none exists. Observing it never opens one: it follows the subscription
 * a `useChannel` consumer demanded and returns to `null` when the last one
 * leaves. Its type comes from the registered client, and is `unknown` until
 * `Register` is augmented.
 *
 * @example
 * ```ts
 * const subscription = useNativeChannel(() => `rooms:${roomId.value}`);
 *
 * watch(subscription, (current, _previous, onCleanup) => {
 *   if (current === null) {
 *     return;
 *   }
 *
 *   current.on("join", handleJoin);
 *   onCleanup(() => current.off("join", handleJoin));
 * });
 * ```
 */
export const useNativeChannel = (
  channel: ChannelInput,
): Readonly<ShallowRef<RegisteredNativeSubscription | null>> => {
  const client = useRealtimeClient();

  return useObservableValue(
    () => client.value.channel(toValue(channel)).native,
  );
};
