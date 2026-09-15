import { createComponent, createSignal } from "solid-js";
import type { Accessor, Setter } from "solid-js";
import { render } from "solid-js/web";
import type { RealtimeClient } from "@priemskiyyy/simulcast";
import { Devtools } from "src/components/Devtools";
import { EventLog } from "src/utils/EventLog";

export type SimulcastDevtoolsOptions = {
  client: RealtimeClient;
  /** Opens the panel on the first visit. Later visits restore the last open state. */
  initialIsOpen?: boolean;
  /** Events kept in memory. Defaults to 200, clamped to 1–1000. */
  maxEvents?: number;
};

/**
 * Framework-independent inspector for one client. Mount it into any element:
 * the panel renders in a shadow root, so host styles never leak in or out.
 * Recording runs while mounted, also when collapsed, and never creates
 * subscriptions. The framework wrappers under `@priemskiyyy/simulcast-devtools/react`,
 * `/vue`, `/solid`, and `/svelte` read the client from their provider.
 *
 * @example
 * ```ts
 * const devtools = new SimulcastDevtools({ client: realtime });
 * devtools.mount(document.body.appendChild(document.createElement("div")));
 * ```
 */
export class SimulcastDevtools {
  #client: Accessor<RealtimeClient>;
  #setClient: Setter<RealtimeClient>;
  #maxEvents: Accessor<number>;
  #setMaxEvents: Setter<number>;
  #initialIsOpen: boolean;
  #log: EventLog;
  #dispose: (() => void) | null = null;

  constructor({
    client,
    initialIsOpen = false,
    maxEvents = 200,
  }: SimulcastDevtoolsOptions) {
    const [currentClient, setClient] = createSignal(client);
    const [currentMaxEvents, setMaxEvents] = createSignal(maxEvents);
    this.#client = currentClient;
    this.#setClient = setClient;
    this.#maxEvents = currentMaxEvents;
    this.#setMaxEvents = setMaxEvents;
    this.#initialIsOpen = initialIsOpen;
    this.#log = new EventLog(maxEvents);
  }

  /** Renders into `element` through a shadow root and starts recording. Throws when already mounted. */
  mount = (element: HTMLElement) => {
    if (this.#dispose !== null) {
      throw new Error(
        "Simulcast devtools are already mounted. Call unmount() first.",
      );
    }

    const root = element.shadowRoot ?? element.attachShadow({ mode: "open" });
    this.#dispose = render(
      () =>
        createComponent(Devtools, {
          client: this.#client,
          maxEvents: this.#maxEvents,
          initialIsOpen: this.#initialIsOpen,
          log: this.#log,
        }),
      root,
    );
  };

  /** Removes the panel and stops recording. Recorded events survive until the next mount. */
  unmount = () => {
    if (this.#dispose === null) {
      return;
    }

    this.#dispose();
    this.#dispose = null;
  };

  /** Points the inspector at another client, for example after the endpoint changed. */
  setClient = (client: RealtimeClient) => {
    this.#setClient(() => client);
  };

  setMaxEvents = (maxEvents: number) => {
    this.#setMaxEvents(maxEvents);
  };
}
