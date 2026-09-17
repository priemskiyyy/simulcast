import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import { useObservableValue } from "src/primitives/internal/useObservableValue";
import { useRealtimeClient } from "src/primitives/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";
import type { RegisteredNativeSubscription } from "src/types/Register";
import { access } from "src/utils/internal/access";

/**
 * The adapter's native subscription for a channel as an accessor, or `null`
 * while none exists. Observing it never opens one: it follows the subscription
 * a `useChannel` consumer demanded and returns to `null` when the last one
 * leaves. Its type comes from the registered client, and is `unknown` until
 * `Register` is augmented.
 *
 * @example
 * ```ts
 * const subscription = useNativeChannel(() => `rooms:${roomId()}`);
 *
 * createEffect(() => {
 *   const current = subscription();
 *
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
): Accessor<RegisteredNativeSubscription | null> => {
  const client = useRealtimeClient();
  const name = createMemo(() => access(channel));

  return useObservableValue(() => client().channel(name()).native);
};
