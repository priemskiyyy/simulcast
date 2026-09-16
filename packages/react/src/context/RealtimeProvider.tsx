import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { RealtimeClientContext } from "src/context/RealtimeClientContext";
import type { RegisteredClient } from "src/types/Register";

export type RealtimeProviderProps = PropsWithChildren<{
  client: RegisteredClient;
  session?: {
    /** Identifies the session, usually the signed-in account. Changing it replaces the connection. */
    id?: string;
    /** Whether a session should be active. Defaults to true. */
    enabled?: boolean;
  };
}>;

/**
 * Owns the client's session while mounted. Changing the session ID or disabling
 * it releases the previous connection; hooks keep their registrations.
 *
 * @example
 * ```tsx
 * const realtime = new RealtimeClient({ adapter: centrifugo({ transport }) });
 *
 * <RealtimeProvider client={realtime} session={{ id: user.id }}>
 *   <div>Connected components go here.</div>
 * </RealtimeProvider>
 * ```
 */
export const RealtimeProvider = ({
  client,
  session = {},
  children,
}: RealtimeProviderProps) => {
  const { id, enabled = true } = session;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return client.connect();
  }, [client, id, enabled]);

  return (
    <RealtimeClientContext.Provider value={client}>
      {children}
    </RealtimeClientContext.Provider>
  );
};
