import { cleanup, render } from "@testing-library/svelte";
import { RealtimeClient } from "simulcast";
import { createMockAdapter } from "simulcast/mock";
import { afterEach, expect, test } from "vitest";
import Fixture from "src/svelte.fixture.svelte";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("the Svelte attachment mounts the inspector for the provider's client and removes it on unmount", () => {
  const { adapter, connections } = createMockAdapter();
  const client = new RealtimeClient({ adapter });
  const { container, unmount } = render(Fixture, { client });
  const host = container.querySelector("div div");

  expect(host?.shadowRoot?.textContent).toContain("All channels");
  expect(connections).toHaveLength(1);
  unmount();
  expect(host?.shadowRoot?.childElementCount).toBe(0);
});
