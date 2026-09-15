import { cleanup, render } from "@testing-library/react";
import { StrictMode, createElement } from "react";
import { renderToString } from "react-dom/server";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { RealtimeProvider } from "simulcast-react";
import { afterEach, expect, test } from "vitest";
import { SimulcastDevtools } from "src/react";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const shadowText = (container: HTMLElement) =>
  container.querySelector("[data-simulcast-devtools]")?.shadowRoot
    ?.textContent ?? "";

test("the React wrapper mounts the inspector for the provider's client and removes it on unmount", () => {
  const { adapter, connections } = createMockAdapter();
  const client = new RealtimeClient({ adapter });
  const view = render(
    createElement(
      StrictMode,
      null,
      createElement(
        RealtimeProvider,
        { client },
        createElement(SimulcastDevtools, { initialIsOpen: true }),
      ),
    ),
  );

  const active = () =>
    connections.filter((connection) => connection.disposeCount === 0);

  expect(shadowText(view.container)).toContain("All channels");
  expect(active()).toHaveLength(1);
  view.unmount();
  expect(active()).toHaveLength(0);
});

test("server rendering emits only the host element and opens no connections", () => {
  const { adapter, connections } = createMockAdapter();
  const html = renderToString(
    createElement(
      RealtimeProvider,
      { client: new RealtimeClient({ adapter }) },
      createElement(SimulcastDevtools, { initialIsOpen: true }),
    ),
  );

  expect(html).toBe('<div data-simulcast-devtools=""></div>');
  expect(connections).toEqual([]);
});
