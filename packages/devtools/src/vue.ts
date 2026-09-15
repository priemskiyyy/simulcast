import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
} from "vue";
import { SimulcastDevtools as Devtools } from "@priemskiyyy/simulcast-devtools";
import type { SimulcastDevtoolsOptions } from "@priemskiyyy/simulcast-devtools";
import { useRealtimeClient } from "@priemskiyyy/simulcast-vue";

export type SimulcastDevtoolsProps = Omit<SimulcastDevtoolsOptions, "client">;

/**
 * Mounts the inspector for the nearest `RealtimeProvider`. Renders an empty
 * host element on the server and follows the provider's client after mount.
 *
 * @example
 * ```vue
 * <RealtimeProvider :client="realtime">
 *   <App />
 *   <SimulcastDevtools v-if="isDevelopment" />
 * </RealtimeProvider>
 * ```
 */
export const SimulcastDevtools = defineComponent(
  (props: SimulcastDevtoolsProps) => {
    const client = useRealtimeClient();
    const host = shallowRef<HTMLDivElement | null>(null);
    const devtools = new Devtools({
      client: client.value,
      initialIsOpen: props.initialIsOpen ?? false,
      maxEvents: props.maxEvents ?? 200,
    });

    watch(client, (current) => devtools.setClient(current));
    watch(
      () => props.maxEvents ?? 200,
      (maxEvents) => devtools.setMaxEvents(maxEvents),
    );
    onMounted(() => {
      const element = host.value;

      if (element === null) {
        return;
      }

      devtools.mount(element);
    });
    onUnmounted(devtools.unmount);

    return () => h("div", { ref: host, "data-simulcast-devtools": "" });
  },
  { name: "SimulcastDevtools", props: ["initialIsOpen", "maxEvents"] },
);
