import { beforeEach, expect, test, vi } from "vitest";
import { sse } from "src/sse";

class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  readyState = 0;
  readonly withCredentials: boolean;

  constructor(
    readonly url: string,
    init?: EventSourceInit,
  ) {
    super();
    this.withCredentials = init?.withCredentials === true;
    FakeEventSource.instances.push(this);
  }

  close() {
    this.readyState = 2;
  }

  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  fail(readyState: number) {
    this.readyState = readyState;
    this.dispatchEvent(new Event("error"));
  }

  receive(type: string, data: string) {
    this.dispatchEvent(new MessageEvent(type, { data }));
  }
}

const configuration = () => ({
  url: (channel: string) => `/events/${channel}`,
  events: ["created"],
  withCredentials: true,
  eventSource: FakeEventSource,
});
const latestSource = () => {
  const source = FakeEventSource.instances.at(-1);

  if (source === undefined) {
    throw new Error("Expected the adapter to open a stream");
  }

  return source;
};

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

beforeEach(() => {
  FakeEventSource.instances = [];
});

test("connect reports connected immediately and opens no stream", () => {
  const observer = connectionObserver();
  const connection = sse(configuration()).connect(observer);

  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connected");
  expect(connection.native).toBeNull();
  expect(FakeEventSource.instances).toEqual([]);
  connection.dispose();
});

test("subscribe opens one stream per channel that maps open, messages, and errors until disposed", () => {
  const connection = sse(configuration()).connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "rooms/one", observer });
  const source = latestSource();

  expect(subscription.native).toBe(source);
  expect(source.url).toBe("/events/rooms/one");
  expect(source.withCredentials).toBe(true);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  source.open();
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  source.receive("message", "plain");
  source.receive("created", "named");
  source.receive("ignored", "no listener");
  expect(
    observer.publication.mock.calls.map(([publication]) => publication),
  ).toEqual([
    { data: "plain", native: expect.any(MessageEvent) },
    { event: "created", data: "named", native: expect.any(MessageEvent) },
  ]);
  source.fail(0);
  expect(observer.error).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");
  source.fail(2);
  expect(observer.state).toHaveBeenLastCalledWith("unsubscribed");

  subscription.dispose();
  subscription.dispose();
  source.receive("message", "late");

  expect(source.readyState).toBe(2);
  expect(observer.publication).toHaveBeenCalledTimes(2);
  connection.dispose();
});

test("disposing the connection closes every stream without observer calls", () => {
  const connection = sse(configuration()).connect(connectionObserver());
  const observer = subscriptionObserver();
  connection.subscribe({ channel: "rooms/one", observer });
  const source = latestSource();
  source.open();

  connection.dispose();
  source.receive("message", "late");

  expect(source.readyState).toBe(2);
  expect(observer.publication).not.toHaveBeenCalled();
  expect(observer.state.mock.calls).toEqual([["subscribing"], ["subscribed"]]);
});

test("a missing EventSource implementation fails at connect with a clear message", () => {
  const original = globalThis.EventSource;
  Object.defineProperty(globalThis, "EventSource", {
    value: undefined,
    configurable: true,
  });

  try {
    expect(() =>
      sse({ url: (channel) => channel }).connect(connectionObserver()),
    ).toThrow("No EventSource implementation");
  } finally {
    Object.defineProperty(globalThis, "EventSource", {
      value: original,
      configurable: true,
    });
  }
});
