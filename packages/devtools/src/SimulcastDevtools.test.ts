import { fireEvent, within } from "@testing-library/dom";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import { createMockAdapter } from "@priemskiyyy/simulcast/mock";
import type { MockConnection } from "@priemskiyyy/simulcast/mock";
import { afterEach, expect, test } from "vitest";
import { SimulcastDevtools } from "src/SimulcastDevtools";

afterEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
});

const activeSubscriptions = (connections: MockConnection[]) =>
  connections
    .filter((connection) => connection.disposeCount === 0)
    .flatMap((connection) => connection.subscriptions)
    .filter((subscription) => subscription.disposeCount === 0);

const createClient = () => {
  const { adapter, connections } = createMockAdapter({
    onSubscribe: (subscription) => subscription.observer.state("subscribing"),
  });
  const client = new RealtimeClient({ adapter });
  const subscription = () => {
    const [current] = activeSubscriptions(connections);

    if (current === undefined) {
      throw new Error("Expected an active subscription");
    }

    return current;
  };
  const publish = async (text: string) => {
    subscription().observer.publication({
      event: "message-created",
      data: { text, token: "hidden-token" },
      native: { data: { text } },
    });
    await Promise.resolve();
  };

  return { client, connections, subscription, publish };
};

const mountDevtools = (
  options: ConstructorParameters<typeof SimulcastDevtools>[0],
) => {
  const host = document.body.appendChild(document.createElement("div"));
  const devtools = new SimulcastDevtools(options);
  devtools.mount(host);
  // Queries need an element; the shadow root's only child is the application root.
  const view = () => {
    const root = host.shadowRoot?.firstElementChild;

    if (!(root instanceof HTMLElement)) {
      throw new Error("Expected the devtools root inside the shadow root");
    }

    return within(root);
  };
  const text = () => host.shadowRoot?.textContent ?? "";

  return { host, devtools, view, text };
};

test("the panel observes a client without creating subscriptions and hides payloads by default", async () => {
  const { client, connections, publish } = createClient();
  const { devtools, view, text } = mountDevtools({
    client,
    initialIsOpen: true,
    maxEvents: 5,
  });
  const disconnect = client.connect();
  const unsubscribe = client.channel("rooms:one").subscribe(() => {});

  expect(
    view().getByRole("complementary", { name: "Simulcast devtools" }),
  ).toBeTruthy();
  expect(activeSubscriptions(connections).map((s) => s.channel)).toEqual([
    "rooms:one",
  ]);
  await publish("hidden-payload");
  expect(view().getByText("publication")).toBeTruthy();
  expect(text()).toContain("message-created");
  expect(text()).not.toContain("hidden-payload");
  expect(text()).not.toContain("hidden-token");
  unsubscribe();
  await Promise.resolve();
  expect(activeSubscriptions(connections)).toEqual([]);
  expect(view().getByText(/No channel listeners yet/)).toBeTruthy();
  devtools.unmount();
  disconnect();
});

test("payload capture, filters, kinds, pause, and clear operate only on the timeline", async () => {
  const { client, connections, subscription, publish } = createClient();
  const { view, text } = mountDevtools({
    client,
    initialIsOpen: true,
    maxEvents: 20,
  });
  client.connect();
  client.channel("rooms:one").subscribe(() => {});

  fireEvent.click(view().getByLabelText("Capture payloads"));
  await publish("visible-payload");
  expect(text()).toContain("visible-payload");
  expect(text()).not.toContain("hidden-token");

  fireEvent.input(view().getByLabelText("Filter events"), {
    target: { value: "no-match" },
  });
  expect(view().getByText("No matching events")).toBeTruthy();
  fireEvent.click(view().getByRole("button", { name: "Clear filters" }));
  expect(text()).toContain("visible-payload");

  subscription().observer.error({ error: new Error("boom") });
  await Promise.resolve();
  const kinds = within(view().getByRole("group", { name: "Event kinds" }));
  fireEvent.click(kinds.getByRole("button", { name: /^Errors/ }));
  const timeline = within(view().getByLabelText("Event timeline"));
  expect(timeline.getAllByText("boom")).toHaveLength(1);
  expect(timeline.queryByText("message-created")).toBeNull();
  fireEvent.click(kinds.getByRole("button", { name: /^All/ }));

  fireEvent.click(view().getByRole("button", { name: "Pause" }));
  await publish("paused-message");
  expect(text()).not.toContain("paused-message");
  expect(activeSubscriptions(connections)).toHaveLength(1);
  fireEvent.click(view().getByRole("button", { name: "Clear" }));
  await Promise.resolve();
  expect(view().getByText("Recording paused")).toBeTruthy();
  fireEvent.click(view().getByRole("button", { name: "Resume" }));
  await publish("resumed-message");
  expect(text()).toContain("resumed-message");
});

test("the launcher opens the panel, Escape closes it, and the open state is remembered", () => {
  const { client } = createClient();
  const first = mountDevtools({ client });

  fireEvent.click(
    first.view().getByRole("button", { name: "Open Simulcast devtools" }),
  );
  const panel = first
    .view()
    .getByRole("complementary", { name: "Simulcast devtools" });
  expect(first.host.shadowRoot?.activeElement).toBe(panel);
  const handle = () =>
    first.view().getByRole("separator", { name: "Resize devtools" });
  fireEvent.keyDown(handle(), { key: "ArrowUp" });
  expect(panel.style.height).toBe("444px");
  fireEvent.click(
    first.view().getByRole("button", { name: "Dock to the right" }),
  );
  expect(panel.dataset.position).toBe("right");
  fireEvent.keyDown(handle(), { key: "ArrowLeft" });
  expect(panel.style.width).toBe("544px");
  fireEvent.click(
    first.view().getByRole("button", { name: "Dock to the bottom" }),
  );
  expect(panel.style.height).toBe("444px");
  fireEvent.keyDown(panel, { key: "Escape" });
  const launcher = first
    .view()
    .getByRole("button", { name: "Open Simulcast devtools" });
  expect(first.host.shadowRoot?.activeElement).toBe(launcher);
  first.devtools.unmount();

  const second = mountDevtools({ client, initialIsOpen: true });
  expect(
    second.view().getByRole("button", { name: "Open Simulcast devtools" }),
  ).toBeTruthy();
});

test("the inspector follows a replacement client, keeps history across mounts, and rejects a double mount", async () => {
  const first = createClient();
  const second = createClient();
  const { host, devtools, view, text } = mountDevtools({
    client: first.client,
    initialIsOpen: true,
  });
  first.client.connect();
  first.client.channel("rooms:one").subscribe(() => {});
  await first.publish("first-client");
  expect(text()).toContain("rooms:one");

  devtools.setClient(second.client);
  second.client.connect();
  second.client.channel("rooms:two").subscribe(() => {});
  await second.publish("second-client");
  const channels = within(view().getByLabelText("Realtime channels"));
  expect(channels.getByText("rooms:two")).toBeTruthy();
  expect(channels.queryByText("rooms:one")).toBeNull();
  expect(() => devtools.mount(host)).toThrow("already mounted");

  devtools.unmount();
  expect(host.shadowRoot?.childElementCount).toBe(0);
  await second.publish("while-unmounted");
  devtools.mount(host);
  expect(text()).toContain("message-created");
  expect(text()).not.toContain("while-unmounted");
});
