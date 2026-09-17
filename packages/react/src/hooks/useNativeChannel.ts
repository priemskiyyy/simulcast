import { useMemo } from "react";
import { useObservableValue } from "src/hooks/internal/useObservableValue";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";
import type { RegisteredNativeSubscription } from "src/types/Register";

const getServerNativeChannel = () => null;

/**
 * The adapter's native subscription for a channel, or `null` while none exists.
 * Observing it never opens one: it follows the subscription a `useChannel`
 * consumer demanded and returns to `null` when the last one leaves. Its type
 * comes from the registered client, and is `unknown` until `Register` is
 * augmented.
 *
 * @example
 * ```ts
 * const subscription = useNativeChannel("rooms:demo");
 *
 * useEffect(() => {
 *   if (subscription === null) {
 *     return;
 *   }
 *
 *   subscription.on("join", handleJoin);
 *   return () => {
 *     subscription.off("join", handleJoin);
 *   };
 * }, [subscription]);
 * ```
 */
export const useNativeChannel = (
  channel: string,
): RegisteredNativeSubscription | null => {
  const client = useRealtimeClient();

  // Channel handles are created on demand; keep the subscription stable across renders.
  const handle = useMemo(() => client.channel(channel), [client, channel]);

  return useObservableValue(handle.native, getServerNativeChannel);
};
