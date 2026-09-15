import { Centrifuge } from "centrifuge";
import { useSyncExternalStore } from "react";
import { useRealtimeClient } from "simulcast-react";

const getServerClient = () => null;

/**
 * Returns the current native Centrifuge client and rerenders when the session
 * replaces or releases it. Returns `null` during server rendering, while the
 * session is inactive, or when the provider's adapter is not Centrifugo.
 *
 * @example
 * ```ts
 * const client = useCentrifuge();
 * const sendMessage = async (text: string) => {
 *   if (client === null) {
 *     return;
 *   }
 *
 *   await client.publish("rooms:general", { text });
 * };
 * ```
 */
export const useCentrifuge = () => {
  const { native } = useRealtimeClient();
  const client = useSyncExternalStore(
    native.subscribe,
    native.get,
    getServerClient,
  );

  if (client instanceof Centrifuge) {
    return client;
  }

  return null;
};
