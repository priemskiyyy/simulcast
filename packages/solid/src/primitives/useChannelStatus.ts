import { createMemo } from "solid-js";
import { useObservableValue } from "src/primitives/internal/useObservableValue";
import { useRealtimeClient } from "src/primitives/useRealtimeClient";
import type { ChannelInput } from "src/types/ChannelInput";
import { access } from "src/utils/internal/access";

/**
 * Observes channel status as an accessor without opening a native subscription.
 * Reads `detached` until a publication consumer opens one.
 *
 * @example
 * ```ts
 * const status = useChannelStatus(() => `rooms:${roomId()}`);
 * ```
 */
export const useChannelStatus = (channel: ChannelInput) => {
  const client = useRealtimeClient();
  const name = createMemo(() => access(channel));

  return useObservableValue(() => client().channel(name()).status);
};
