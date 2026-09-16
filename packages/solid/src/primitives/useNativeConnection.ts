import type { Accessor } from "solid-js";
import { useObservableValue } from "src/primitives/internal/useObservableValue";
import { useRealtimeClient } from "src/primitives/useRealtimeClient";
import type { RegisteredNativeConnection } from "src/types/Register";

/**
 * The adapter's native client as an accessor, following session replacement
 * and release. Reads `null` on the server and while no session is active. Its
 * type comes from the registered client, for example `Centrifuge | null`, and
 * is `unknown` until `Register` is augmented.
 *
 * @example
 * ```ts
 * const centrifuge = useNativeConnection();
 * const publish = (text: string) => centrifuge()?.publish("rooms:demo", { text });
 * ```
 */
export const useNativeConnection =
  (): Accessor<RegisteredNativeConnection | null> => {
    const client = useRealtimeClient();

    return useObservableValue(() => client().native);
  };
