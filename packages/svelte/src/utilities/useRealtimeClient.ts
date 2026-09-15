import { getRealtimeClient } from "../context/realtimeClientContext.js";

/**
 * Returns the nearest provider's client as a readonly box and throws when the
 * provider is missing. Call it during component initialisation.
 *
 * @example
 * ```ts
 * const realtime = useRealtimeClient();
 * const native = realtime.current.native.get();
 * ```
 */
export const useRealtimeClient = () => {
  const client = getRealtimeClient();

  if (client === undefined) {
    throw new Error(
      "Simulcast utilities must be used within a RealtimeProvider.",
    );
  }

  return client;
};
