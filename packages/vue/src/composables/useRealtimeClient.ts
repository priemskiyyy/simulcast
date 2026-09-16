import { inject } from "vue";
import type { Ref } from "vue";
import { REALTIME_CLIENT_KEY } from "src/context/realtimeClientKey";
import type { RegisteredClient } from "src/types/Register";

/**
 * Returns the nearest provider's client as a readonly ref and throws when the provider is missing.
 * Augment `Register` to type it; see [[Register]].
 *
 * @example
 * ```ts
 * const realtime = useRealtimeClient();
 * const native = realtime.value.native.get();
 * ```
 */
export const useRealtimeClient = (): Readonly<Ref<RegisteredClient>> => {
  const client = inject(REALTIME_CLIENT_KEY);

  if (client === undefined) {
    throw new Error(
      "Simulcast composables must be used within a RealtimeProvider.",
    );
  }

  return client;
};
