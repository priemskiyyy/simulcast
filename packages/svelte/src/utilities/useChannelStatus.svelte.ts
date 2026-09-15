import type { ChannelInput } from "../types/ChannelInput.js";
import { extract } from "./internal/extract.js";
import { useObservableValue } from "./internal/useObservableValue.svelte.js";
import { useRealtimeClient } from "./useRealtimeClient.js";

/**
 * Observes channel status without opening a native subscription. Reads
 * `detached` until a publication consumer opens one. Call it during component
 * initialisation.
 *
 * @example
 * ```ts
 * const status = useChannelStatus(() => `rooms:${roomId}`);
 * ```
 */
export const useChannelStatus = (channel: ChannelInput) => {
  const client = useRealtimeClient();
  const name = $derived(extract(channel));

  return useObservableValue(() => client.current.channel(name).status);
};
