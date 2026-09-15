import {
  defineComponent,
  onMounted,
  onWatcherCleanup,
  provide,
  shallowReadonly,
  toRef,
  watch,
} from "vue";
import type { RealtimeClient } from "@priemskiyyy/simulcast";
import { REALTIME_CLIENT_KEY } from "src/context/realtimeClientKey";

export type RealtimeProviderProps = {
  client: RealtimeClient;
  session?: {
    /** Identifies the session, usually the signed-in account. Changing it replaces the connection. */
    id?: string;
    /** Whether a session should be active. Defaults to true. */
    enabled?: boolean;
  };
};

/**
 * Owns the client's session while mounted. Changing the session ID or disabling
 * it releases the previous connection; composables keep their registrations.
 * Connecting happens after mount, so server rendering opens nothing.
 *
 * @example
 * ```vue
 * <RealtimeProvider :client="realtime" :session="{ id: user.id }">
 *   <Room />
 * </RealtimeProvider>
 * ```
 */
export const RealtimeProvider = defineComponent(
  (props: RealtimeProviderProps, { slots }) => {
    provide(REALTIME_CLIENT_KEY, shallowReadonly(toRef(props, "client")));

    const session = () => props.session ?? {};

    // Separate sources compare by value, so a new session object with the same ID does not reconnect.
    onMounted(() => {
      watch(
        [
          () => props.client,
          () => session().id,
          () => session().enabled ?? true,
        ],
        ([client, , enabled]) => {
          if (!enabled) {
            return;
          }

          onWatcherCleanup(client.connect());
        },
        { immediate: true },
      );
    });

    return () => {
      const children = slots.default;

      if (children === undefined) {
        return null;
      }

      return children();
    };
  },
  { name: "RealtimeProvider", props: ["client", "session"] },
);
