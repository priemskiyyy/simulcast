import { expect, test, vi } from "vitest";
import type { RealtimeDiagnosticEvent } from "src/types/RealtimeDiagnostics";
import { createMockAdapter } from "src/mock/createMockAdapter";
import { RealtimeClient } from "src/utils/RealtimeClient";

const createClient = () => {
  const { adapter, connections } = createMockAdapter();
  return { client: new RealtimeClient({ adapter }), connections };
};

test("inspection creates no channels and never keeps subscriptions alive", () => {
  const { client, connections } = createClient();
  const { diagnostics } = client;
  const stopEvents = diagnostics.events.subscribe(() => {});
  const stopChanges = diagnostics.subscribe(() => {});
  const end = client.connect();
  expect(diagnostics.get().channels).toEqual([]);

  const channel = client.channel("rooms:one");
  const stopStatus = channel.status.subscribe(() => {});
  expect(connections[0]?.subscriptions).toEqual([]);
  expect(diagnostics.get().channels).toEqual([
    {
      name: "rooms:one",
      state: "detached",
      error: null,
      recovered: false,
      consumers: { publications: 0, status: 1 },
    },
  ]);
  const stopConsumer = channel.subscribe(() => {});
  expect(diagnostics.get().channels[0]?.consumers).toEqual({
    publications: 1,
    status: 1,
  });
  stopConsumer();
  expect(connections[0]?.subscriptions[0]?.disposeCount).toBe(1);
  expect(diagnostics.get().channels[0]?.state).toBe("detached");
  stopStatus();
  expect(diagnostics.get().channels).toEqual([]);
  end();
  stopEvents();
  stopChanges();
});

test("observers capture each adapter publication once regardless of consumer count", () => {
  const { client, connections } = createClient();
  const end = client.connect();
  const channel = client.channel("rooms:one");
  const first = vi.fn();
  const second = vi.fn();
  const stopFirst = channel.subscribe(first);
  const stopSecond = channel.subscribe(second);
  const log = vi.fn();
  const stop = client.diagnostics.events.subscribe(log);
  const publication = { data: { text: "hello" }, native: { offset: 5 } };

  connections[0]?.subscriptions[0]?.observer.publication(publication);

  expect(log).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      source: "channel",
      type: "publication",
      channel: "rooms:one",
      context: publication,
    }),
  );
  expect(first).toHaveBeenCalledTimes(1);
  expect(second).toHaveBeenCalledTimes(1);
  stop();
  stopFirst();
  stopSecond();
  end();
});

test("session replacement retires old observations and snapshots contain only metadata", () => {
  const { client, connections } = createClient();
  const events: RealtimeDiagnosticEvent[] = [];
  const stop = client.diagnostics.events.subscribe((event) =>
    events.push(event),
  );
  const endFirst = client.connect();
  const endSecond = client.connect();
  const error = { error: new Error("refused") };

  connections[0]?.observer.state("connected");
  connections[0]?.observer.error(error);
  connections[1]?.observer.error(error);

  expect(events.filter((event) => event.source === "connection")).toEqual([
    expect.objectContaining({ type: "error", context: error }),
  ]);
  expect(client.diagnostics.get()).toEqual({
    adapter: "mock",
    session: { id: 2 },
    connection: "disconnected",
    channels: [],
  });
  expect(
    events.filter((event) => event.type === "session.started"),
  ).toHaveLength(2);
  endFirst();
  expect(client.diagnostics.get().session).toEqual({ id: 2 });
  endSecond();
  expect(client.diagnostics.get().session).toBeNull();
  stop();
});

test("snapshot edits do not mutate channel ownership", () => {
  const { client, connections } = createClient();
  const end = client.connect();
  const stop = client.channel("rooms:one").subscribe(() => {});
  const snapshot = client.diagnostics.get();
  const channel = snapshot.channels[0];

  if (channel === undefined) {
    throw new Error("Expected a channel snapshot");
  }

  channel.consumers.publications = 0;
  expect(connections[0]?.subscriptions[0]?.disposeCount).toBe(0);
  stop();
  expect(connections[0]?.subscriptions[0]?.disposeCount).toBe(1);
  end();
});
