import type { ConnectionState } from "simulcast";
import { useObservableValue } from "src/hooks/internal/useObservableValue";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";

const getServerConnectionState = (): ConnectionState => "disconnected";

/**
 * Reads connection state and rerenders on changes; `onChange` runs on subsequent updates.
 * Returns `disconnected` during server rendering or while the session is inactive.
 *
 * @example
 * ```ts
 * const state = useConnectionState((nextState) => {
 *   console.log("Connection:", nextState);
 * });
 * ```
 */
export const useConnectionState = (
  onChange?: (state: ConnectionState) => void | Promise<unknown>,
) => {
  const client = useRealtimeClient();

  return useObservableValue(
    client.connection,
    getServerConnectionState,
    onChange,
  );
};
