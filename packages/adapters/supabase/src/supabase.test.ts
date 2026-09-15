import { RealtimeClient } from "@supabase/realtime-js";
import { expect, test, vi } from "vitest";
import { supabase } from "src/supabase";

type Frame = [unknown, unknown, string, string, unknown];

class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readonly protocol = "";
  readyState = 0;
  sent: Frame[] = [];
  onopen: ((event: object) => void) | null = null;
  onclose: ((event: object) => void) | null = null;
  onerror: ((event: object) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  readonly url: string;

  constructor(address: string | URL) {
    this.url = String(address);
    FakeSocket.instances.push(this);
  }

  addEventListener() {}

  removeEventListener() {}

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (typeof data !== "string") {
      throw new Error("Expected JSON frames");
    }

    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1000 });
  }

  open() {
    this.readyState = 1;
    this.onopen?.({});
  }

  drop(code: number) {
    this.readyState = 3;
    this.onclose?.({ code });
  }

  receive(frame: Frame) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }

  reply(event: string, status: string, response: object) {
    const frame = this.sent.find((candidate) => candidate[3] === event);

    if (frame === undefined) {
      throw new Error(`Expected a ${event} frame`);
    }

    this.receive([
      frame[0],
      frame[1],
      frame[2],
      "phx_reply",
      { status, response },
    ]);
  }
}

const configuration = () => ({
  url: "ws://localhost/realtime/v1",
  options: { params: { apikey: "anon" }, transport: FakeSocket },
});
const latestSocket = async () => {
  await vi.waitFor(() =>
    expect(FakeSocket.instances.length).toBeGreaterThan(0),
  );
  const socket = FakeSocket.instances.at(-1);

  if (socket === undefined) {
    throw new Error("Expected the client to open a socket");
  }

  return socket;
};
const joined = (socket: FakeSocket) =>
  vi.waitFor(() =>
    expect(socket.sent.some((frame) => frame[3] === "phx_join")).toBe(true),
  );

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

test("creating the adapter opens nothing", async () => {
  const before = FakeSocket.instances.length;

  supabase(configuration());
  await Promise.resolve();

  expect(FakeSocket.instances).toHaveLength(before);
});

test("each connect creates a fresh client that reports mapped states and errors until disposed", async () => {
  const adapter = supabase(configuration());
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const socket = await latestSocket();
  const other = adapter.connect(connectionObserver());

  expect(connection.native).toBeInstanceOf(RealtimeClient);
  expect(other.native).not.toBe(connection.native);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connecting");
  socket.open();
  expect(observer.state).toHaveBeenLastCalledWith("connected");
  socket.onerror?.({ type: "error" });
  expect(observer.error).toHaveBeenCalledTimes(1);
  socket.drop(1006);
  expect(observer.state).toHaveBeenLastCalledWith("connecting");

  connection.dispose();
  connection.dispose();
  socket.open();

  expect(observer.state).toHaveBeenCalledTimes(3);
  expect(
    connection.native.stateChangeCallbacks.open.some(([ref]) =>
      ref.startsWith("simulcast-"),
    ),
  ).toBe(false);
  other.dispose();
});

test("subscribe joins one channel that maps statuses, broadcasts, and errors until disposed", async () => {
  const adapter = supabase({
    ...configuration(),
    getChannelOptions: () => ({ config: { private: true } }),
  });
  const connection = adapter.connect(connectionObserver());
  const socket = await latestSocket();
  socket.open();
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "room:1", observer });
  await joined(socket);
  const join = socket.sent.find((frame) => frame[3] === "phx_join");

  expect(subscription.native.topic).toBe("realtime:room:1");
  expect(join?.[2]).toBe("realtime:room:1");
  expect(join?.[4]).toMatchObject({ config: { private: true } });
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  socket.reply("phx_join", "ok", {});
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  const broadcast = { type: "broadcast", event: "created", payload: { id: 1 } };
  socket.receive([null, null, "realtime:room:1", "broadcast", broadcast]);
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    event: "created",
    data: { id: 1 },
    native: broadcast,
  });

  socket.drop(1006);
  expect(observer.error).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");

  subscription.dispose();
  subscription.dispose();
  socket.receive([null, null, "realtime:room:1", "broadcast", broadcast]);

  expect(observer.publication).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(3);
  connection.dispose();
});

test("a rejected join reports the reason and keeps retrying", async () => {
  const adapter = supabase(configuration());
  const connection = adapter.connect(connectionObserver());
  const socket = await latestSocket();
  socket.open();
  const observer = subscriptionObserver();

  connection.subscribe({ channel: "room:1", observer });
  await joined(socket);
  socket.reply("phx_join", "error", { reason: "unauthorized" });

  expect(observer.error).toHaveBeenCalledTimes(1);
  expect(observer.state.mock.calls).toEqual([["subscribing"], ["subscribing"]]);
  connection.dispose();
});

test("disposing the connection removes its channels without observer calls", async () => {
  const adapter = supabase(configuration());
  const connection = adapter.connect(connectionObserver());
  const socket = await latestSocket();
  socket.open();
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "room:1", observer });
  await joined(socket);
  socket.reply("phx_join", "ok", {});

  connection.dispose();
  subscription.dispose();
  await vi.waitFor(() =>
    expect(socket.sent.some((frame) => frame[3] === "phx_leave")).toBe(true),
  );

  expect(observer.state.mock.calls).toEqual([["subscribing"], ["subscribed"]]);
});
