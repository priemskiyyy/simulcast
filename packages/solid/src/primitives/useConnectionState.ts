import { useObservableValue } from "src/primitives/internal/useObservableValue";
import { useRealtimeClient } from "src/primitives/useRealtimeClient";

/**
 * The connection state as an accessor: `disconnected`, `connecting`, or
 * `connected`. Reads `disconnected` on the server and while no session is active.
 *
 * @example
 * ```ts
 * const connection = useConnectionState();
 * createEffect(() => console.log("Connection:", connection()));
 * ```
 */
export const useConnectionState = () => {
  const client = useRealtimeClient();

  return useObservableValue(() => client().connection);
};
