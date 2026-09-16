import { getRealtimeClient } from "../context/realtimeClientContext.js";
import type { ReadableBox } from "../types/ReadableBox.js";
import type { RegisteredClient } from "../types/Register.js";

/**
 * Returns the nearest provider's client as a readonly box and throws when the
 * provider is missing. Call it during component initialisation. Augment
 * `Register` to type it; see [[Register]].
 *
 * @example
 * ```ts
 * const realtime = useRealtimeClient();
 * const native = realtime.current.native.get();
 * ```
 */
export const useRealtimeClient = (): ReadableBox<RegisteredClient> => {
  const client = getRealtimeClient();

  if (client === undefined) {
    throw new Error(
      "Simulcast utilities must be used within a RealtimeProvider.",
    );
  }

  return client;
};
