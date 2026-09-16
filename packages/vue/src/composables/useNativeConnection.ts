import type { ShallowRef } from "vue";
import { useObservableValue } from "src/composables/internal/useObservableValue";
import { useRealtimeClient } from "src/composables/useRealtimeClient";
import type { RegisteredNativeConnection } from "src/types/Register";

/**
 * The adapter's native client as a readonly ref, following session
 * replacement and release. Reads `null` on the server and while no session is
 * active. Its type comes from the registered client, for example
 * `Centrifuge | null`, and is `unknown` until `Register` is augmented.
 *
 * @example
 * ```ts
 * const centrifuge = useNativeConnection();
 * const publish = (text: string) =>
 *   centrifuge.value?.publish("rooms:demo", { text });
 * ```
 */
export const useNativeConnection = (): Readonly<
  ShallowRef<RegisteredNativeConnection | null>
> => {
  const client = useRealtimeClient();

  return useObservableValue(() => client.value.native);
};
