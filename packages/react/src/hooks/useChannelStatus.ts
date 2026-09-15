import { useMemo } from "react";
import { DETACHED_CHANNEL_STATUS } from "simulcast";
import type { ChannelStatus } from "simulcast";
import { useObservableValue } from "src/hooks/internal/useObservableValue";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";

const getServerChannelStatus = () => DETACHED_CHANNEL_STATUS;

/**
 * Observes channel status without opening a native subscription.
 * Returns `detached` until a publication consumer opens one; `onChange` runs on subsequent updates.
 *
 * @example
 * ```ts
 * const { state, error } = useChannelStatus("rooms:general", (status) => {
 *   console.log("Channel:", status.state);
 * });
 * ```
 */
export const useChannelStatus = (
  channel: string,
  onChange?: (status: ChannelStatus) => void | Promise<unknown>,
) => {
  const client = useRealtimeClient();

  // Channel handles are created on demand; keep the subscription stable across renders.
  const status = useMemo(
    () => client.channel(channel).status,
    [client, channel],
  );

  return useObservableValue(status, getServerChannelStatus, onChange);
};
