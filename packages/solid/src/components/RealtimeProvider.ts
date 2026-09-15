import {
  createComponent,
  createEffect,
  createMemo,
  on,
  onCleanup,
} from "solid-js";
import type { Component, ParentProps } from "solid-js";
import type { RealtimeClient } from "@priemskiyyy/simulcast";
import { RealtimeClientContext } from "src/context/RealtimeClientContext";

export type RealtimeProviderProps = ParentProps<{
  client: RealtimeClient;
  session?: {
    /** Identifies the session, usually the signed-in account. Changing it replaces the connection. */
    id?: string;
    /** Whether a session should be active. Defaults to true. */
    enabled?: boolean;
  };
}>;

/**
 * Owns the client's session while mounted. Changing the session ID or disabling
 * it releases the previous connection; primitives keep their registrations.
 * Effects do not run on the server, so server rendering opens nothing.
 *
 * @example
 * ```tsx
 * <RealtimeProvider client={realtime} session={{ id: user().id }}>
 *   <Room />
 * </RealtimeProvider>
 * ```
 */
export const RealtimeProvider: Component<RealtimeProviderProps> = (props) => {
  const session = () => props.session ?? {};
  const client = createMemo(() => props.client);
  // Memos compare by value, so a new session object with the same ID does not reconnect.
  const id = createMemo(() => session().id);
  const enabled = createMemo(() => session().enabled ?? true);

  createEffect(
    on([client, id, enabled], ([current, , active]) => {
      if (!active) {
        return;
      }

      onCleanup(current.connect());
    }),
  );

  return createComponent(RealtimeClientContext.Provider, {
    value: client,
    get children() {
      return props.children;
    },
  });
};
