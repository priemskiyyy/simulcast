import { cleanup, render } from "@solidjs/testing-library";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { RealtimeProvider } from "simulcast-solid";
import { createComponent } from "solid-js";
import { afterEach, expect, test } from "vitest";
import { SimulcastDevtools } from "src/solid";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("the Solid wrapper mounts the inspector for the provider's client and removes it on cleanup", () => {
  const { adapter, connections } = createMockAdapter();
  const client = new RealtimeClient({ adapter });
  const { container, unmount } = render(() =>
    createComponent(RealtimeProvider, {
      client,
      get children() {
        return createComponent(SimulcastDevtools, { initialIsOpen: true });
      },
    }),
  );
  const host = container.querySelector("[data-simulcast-devtools]");

  expect(host?.shadowRoot?.textContent).toContain("All channels");
  expect(connections).toHaveLength(1);
  unmount();
  expect(host?.shadowRoot?.childElementCount).toBe(0);
});
