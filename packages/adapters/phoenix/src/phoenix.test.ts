import { Socket } from "phoenix";
import { expect, test, vi } from "vitest";
import { phoenix } from "src/phoenix";

type Frame = [unknown, unknown, string, string, unknown];

class FakeTransport {
  static instances: FakeTransport[] = [];
  readyState = 0;
  sent: Frame[] = [];
  onopen: (() => void) | null = null;
  onclose: ((event: object) => void) | null = null;
  onerror: ((event: object) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(readonly url: string) {
    FakeTransport.instances.push(this);
  }

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  close() {
    this.readyState = 3;
    this.onclose?.({ code: 1000 });
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  drop(code: number) {
    this.readyState = 3;
    this.onclose?.({ code });
  }

  receive(frame: Frame) {
    this.onmessage?.({ data: JSON.stringify(frame) });
  }

  reply(event: string, status: string, response: object) {
    const join = this.sent.find((frame) => frame[3] === event);

    if (join === undefined) {
      throw new Error(`Expected a ${event} frame`);
    }

    this.receive([
      join[0],
      join[1],
      join[2],
      "phx_reply",
      { status, response },
    ]);
  }
}

const configuration = () => ({
  url: "ws://localhost/socket",
  options: { transport: FakeTransport, reconnectAfterMs: () => 60_000 },
});
const latestTransport = () => {
  const transport = FakeTransport.instances.at(-1);

  if (transport === undefined) {
    throw new Error("Expected the socket to open a transport");
  }

  return transport;
};

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

test("creating the adapter opens nothing", () => {
  const before = FakeTransport.instances.length;

  phoenix(configuration());

  expect(FakeTransport.instances).toHaveLength(before);
});

test("each connect creates a fresh socket that reports mapped states and errors until disposed", () => {
  const adapter = phoenix(configuration());
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const transport = latestTransport();
  const other = adapter.connect(connectionObserver());

  expect(connection.native).toBeInstanceOf(Socket);
  expect(other.native).not.toBe(connection.native);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connecting");
  transport.open();
  expect(observer.state).toHaveBeenLastCalledWith("connected");
  transport.onerror?.({ type: "error" });
  expect(observer.error).toHaveBeenCalledTimes(1);
  transport.drop(1006);
  expect(observer.state).toHaveBeenLastCalledWith("connecting");

  connection.dispose();
  connection.dispose();
  transport.open();

  expect(connection.native.connectionState()).toBe("closed");
  expect(observer.state).toHaveBeenCalledTimes(3);
  other.dispose();
});

test("subscribe joins one channel that maps replies, events, and errors until disposed", () => {
  const adapter = phoenix({
    ...configuration(),
    getChannelParams: (channel) => ({ token: `${channel}-token` }),
  });
  const connection = adapter.connect(connectionObserver());
  const transport = latestTransport();
  transport.open();
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "room:1", observer });

  expect(subscription.native.topic).toBe("room:1");
  expect(transport.sent.at(-1)).toEqual([
    expect.any(String),
    expect.any(String),
    "room:1",
    "phx_join",
    { token: "room:1-token" },
  ]);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  transport.reply("phx_join", "ok", {});
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  transport.receive([null, null, "room:1", "message-created", { id: 1 }]);
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    event: "message-created",
    data: { id: 1 },
    native: { event: "message-created", payload: { id: 1 }, ref: null },
  });

  transport.drop(1006);
  expect(observer.error).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");

  subscription.dispose();
  subscription.dispose();
  transport.receive([null, null, "room:1", "message-created", { id: 2 }]);

  expect(observer.publication).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(3);
  connection.dispose();
});

test("a rejected join reports the reason and keeps retrying", () => {
  const adapter = phoenix(configuration());
  const connection = adapter.connect(connectionObserver());
  const transport = latestTransport();
  transport.open();
  const observer = subscriptionObserver();

  connection.subscribe({ channel: "room:1", observer });
  transport.reply("phx_join", "error", { reason: "unauthorized" });

  expect(observer.error).toHaveBeenCalledExactlyOnceWith({
    error: { reason: "unauthorized" },
  });
  expect(observer.state.mock.calls).toEqual([["subscribing"], ["subscribing"]]);
  connection.dispose();
});

test("disposing the connection leaves its channels without observer calls", () => {
  const adapter = phoenix(configuration());
  const connection = adapter.connect(connectionObserver());
  const transport = latestTransport();
  transport.open();
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "room:1", observer });
  transport.reply("phx_join", "ok", {});

  connection.dispose();
  subscription.dispose();

  expect(transport.sent.some((frame) => frame[3] === "phx_leave")).toBe(true);
  expect(observer.state.mock.calls).toEqual([["subscribing"], ["subscribed"]]);
});
