import { toValue } from "vue";
import { useObservableValue } from "src/composables/internal/useObservableValue";
import { useRealtimeClient } from "src/composables/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";

/**
 * Observes channel status as a readonly ref without opening a native
 * subscription. Reads `detached` until a publication consumer opens one.
 *
 * @example
 * ```ts
 * const status = useChannelStatus(() => `rooms:${roomId.value}`);
 * ```
 */
export const useChannelStatus = (channel: ChannelInput) => {
  const client = useRealtimeClient();

  return useObservableValue(
    () => client.value.channel(toValue(channel)).status,
  );
};
