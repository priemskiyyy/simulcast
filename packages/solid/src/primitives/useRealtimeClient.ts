import { useContext } from "solid-js";
import { RealtimeClientContext } from "src/context/RealtimeClientContext";

/**
 * Returns the nearest provider's client as an accessor and throws when the provider is missing.
 *
 * @example
 * ```ts
 * const realtime = useRealtimeClient();
 * const native = realtime().native.get();
 * ```
 */
export const useRealtimeClient = () => {
  const client = useContext(RealtimeClientContext);

  if (client === undefined) {
    throw new Error(
      "Simulcast primitives must be used within a RealtimeProvider.",
    );
  }

  return client;
};
