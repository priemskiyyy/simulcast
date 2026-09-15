import { useObservableValue } from "src/composables/internal/useObservableValue";
import { useRealtimeClient } from "src/composables/useRealtimeClient";

/**
 * The connection state as a readonly ref: `disconnected`, `connecting`, or
 * `connected`. Reads `disconnected` on the server and while no session is active.
 *
 * @example
 * ```ts
 * const connection = useConnectionState();
 * watch(connection, (state) => console.log("Connection:", state));
 * ```
 */
export const useConnectionState = () => {
  const client = useRealtimeClient();

  return useObservableValue(() => client.value.connection);
};
