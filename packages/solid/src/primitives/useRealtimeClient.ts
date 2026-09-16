import { useContext } from "solid-js";
import type { Accessor } from "solid-js";
import { RealtimeClientContext } from "src/context/RealtimeClientContext";
import type { RegisteredClient } from "src/types/Register";

/**
 * Returns the nearest provider's client as an accessor and throws when the provider is missing.
 * Augment `Register` to type it; see [[Register]].
 *
 * @example
 * ```ts
 * const realtime = useRealtimeClient();
 * const native = realtime().native.get();
 * ```
 */
export const useRealtimeClient = (): Accessor<RegisteredClient> => {
  const client = useContext(RealtimeClientContext);

  if (client === undefined) {
    throw new Error(
      "Simulcast primitives must be used within a RealtimeProvider.",
    );
  }

  return client;
};
