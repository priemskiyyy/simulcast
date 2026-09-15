import { createEffect, onCleanup, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { SimulcastDevtools as Devtools } from "simulcast-devtools";
import type { SimulcastDevtoolsOptions } from "simulcast-devtools";
import { useRealtimeClient } from "simulcast-solid";

export type SimulcastDevtoolsProps = Omit<SimulcastDevtoolsOptions, "client">;

/**
 * Mounts the inspector for the nearest `RealtimeProvider`. Renders nothing on
 * the server and follows the provider's client after mount.
 *
 * @example
 * ```tsx
 * <RealtimeProvider client={realtime}>
 *   <App />
 *   {import.meta.env.DEV ? <SimulcastDevtools /> : null}
 * </RealtimeProvider>
 * ```
 */
export const SimulcastDevtools = (props: SimulcastDevtoolsProps) => {
  if (isServer) {
    return null;
  }

  const client = useRealtimeClient();
  const devtools = new Devtools({
    client: client(),
    initialIsOpen: props.initialIsOpen ?? false,
    maxEvents: props.maxEvents ?? 200,
  });
  const host = document.createElement("div");
  host.dataset.simulcastDevtools = "";

  createEffect(() => devtools.setClient(client()));
  createEffect(() => devtools.setMaxEvents(props.maxEvents ?? 200));
  onMount(() => devtools.mount(host));
  onCleanup(devtools.unmount);

  return host;
};
