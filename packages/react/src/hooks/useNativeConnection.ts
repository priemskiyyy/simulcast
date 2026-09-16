import { useObservableValue } from "src/hooks/internal/useObservableValue";
import { useRealtimeClient } from "src/hooks/useRealtimeClient";
import type { RegisteredNativeConnection } from "src/types/Register";

const getServerNativeConnection = () => null;

/**
 * The adapter's native client, following session replacement and release.
 * Returns `null` during server rendering and while no session is active. Its
 * type comes from the registered client, for example `Centrifuge | null`, and
 * is `unknown` until `Register` is augmented.
 *
 * @example
 * ```ts
 * const centrifuge = useNativeConnection();
 * const publish = (text: string) => centrifuge?.publish("rooms:demo", { text });
 * ```
 */
export const useNativeConnection = (): RegisteredNativeConnection | null =>
  useObservableValue(useRealtimeClient().native, getServerNativeConnection);
