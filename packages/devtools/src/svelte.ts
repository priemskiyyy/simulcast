import type { Attachment } from "svelte/attachments";
import { SimulcastDevtools as Devtools } from "simulcast-devtools";
import type { SimulcastDevtoolsOptions } from "simulcast-devtools";
import { useRealtimeClient } from "simulcast-svelte";

export type SimulcastDevtoolsProps = Omit<SimulcastDevtoolsOptions, "client">;

/**
 * Creates an attachment that mounts the inspector for the nearest
 * `RealtimeProvider`. Call it during component initialisation and attach it
 * to any element; it remounts when the provider's client changes.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   const devtools = createDevtools();
 * </script>
 *
 * <div {@attach devtools}></div>
 * ```
 */
export const createDevtools = ({
  initialIsOpen = false,
  maxEvents = 200,
}: SimulcastDevtoolsProps = {}): Attachment<HTMLElement> => {
  const client = useRealtimeClient();

  return (element) => {
    const devtools = new Devtools({
      client: client.current,
      initialIsOpen,
      maxEvents,
    });
    devtools.mount(element);
    return devtools.unmount;
  };
};
