import { useObservableValue } from "./internal/useObservableValue.svelte.js";
import { useRealtimeClient } from "./useRealtimeClient.js";

/**
 * The connection state: `disconnected`, `connecting`, or `connected`. Reads
 * `disconnected` on the server and while no session is active. Call it during
 * component initialisation.
 *
 * @example
 * ```ts
 * const connection = useConnectionState();
 * $effect(() => console.log("Connection:", connection.current));
 * ```
 */
export const useConnectionState = () => {
  const client = useRealtimeClient();

  return useObservableValue(() => client.current.connection);
};
