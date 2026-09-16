import type { ReadableBox } from "../types/ReadableBox.js";
import type { RegisteredNativeConnection } from "../types/Register.js";
import { useObservableValue } from "./internal/useObservableValue.svelte.js";
import { useRealtimeClient } from "./useRealtimeClient.js";

/**
 * The adapter's native client, following session replacement and release.
 * Reads `null` on the server and while no session is active. Its type comes
 * from the registered client, for example `Centrifuge | null`, and is `unknown`
 * until `Register` is augmented. Call it during component initialisation.
 *
 * @example
 * ```ts
 * const centrifuge = useNativeConnection();
 * const publish = (text: string) =>
 *   centrifuge.current?.publish("rooms:demo", { text });
 * ```
 */
export const useNativeConnection =
  (): ReadableBox<RegisteredNativeConnection | null> => {
    const client = useRealtimeClient();

    return useObservableValue(() => client.current.native);
  };
