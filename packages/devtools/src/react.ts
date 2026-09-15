import { createElement, useEffect, useState } from "react";
import { SimulcastDevtools as Devtools } from "simulcast-devtools";
import type { SimulcastDevtoolsOptions } from "simulcast-devtools";
import { useRealtimeClient } from "simulcast-react";

export type SimulcastDevtoolsProps = Omit<SimulcastDevtoolsOptions, "client">;

/**
 * Mounts the inspector for the nearest `RealtimeProvider`. Renders an empty
 * host element on the server and follows the provider's client after mount.
 *
 * @example
 * ```tsx
 * <RealtimeProvider client={realtime}>
 *   <App />
 *   {import.meta.env.DEV ? <SimulcastDevtools /> : null}
 * </RealtimeProvider>
 * ```
 */
export const SimulcastDevtools = ({
  initialIsOpen = false,
  maxEvents = 200,
}: SimulcastDevtoolsProps) => {
  const client = useRealtimeClient();
  const [devtools] = useState(
    () => new Devtools({ client, initialIsOpen, maxEvents }),
  );

  useEffect(() => {
    devtools.setClient(client);
  }, [devtools, client]);

  useEffect(() => {
    devtools.setMaxEvents(maxEvents);
  }, [devtools, maxEvents]);

  const handleHostRef = (element: HTMLDivElement | null) => {
    if (element === null) {
      return;
    }

    devtools.mount(element);
    return devtools.unmount;
  };

  return createElement("div", {
    ref: handleHostRef,
    "data-simulcast-devtools": "",
  });
};
