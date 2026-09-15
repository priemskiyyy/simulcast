import { PartySocket } from "partysocket";
import { beforeEach, expect, test, vi } from "vitest";
import { partykit } from "src/partykit";

class FakeWebSocket extends EventTarget {
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  readonly protocol = "";
  readonly extensions = "";
  readonly bufferedAmount = 0;
  binaryType = "blob";

  constructor(readonly url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  send() {}

  close(code = 1000) {
    this.readyState = 3;
    this.dispatchEvent(new CloseEvent("close", { code, wasClean: true }));
  }

  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  drop(code: number) {
    this.readyState = 3;
    this.dispatchEvent(Object.assign(new Event("close"), { code }));
  }

  receive(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

const configuration = () => ({
  host: "example.partykit.dev",
  party: "chat",
  WebSocket: FakeWebSocket,
  minReconnectionDelay: 5,
  maxReconnectionDelay: 10,
});
const latestSocket = async (count: number) => {
  await vi.waitFor(() =>
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(count),
  );
  const socket = FakeWebSocket.instances.at(-1);

  if (socket === undefined) {
    throw new Error("Expected PartySocket to open a socket");
  }

  return socket;
};

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

beforeEach(() => {
  FakeWebSocket.instances = [];
});

test("connect reports connected immediately and opens no socket", async () => {
  const observer = connectionObserver();
  const connection = partykit(configuration()).connect(observer);
  await Promise.resolve();

  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connected");
  expect(connection.native).toBeNull();
  expect(FakeWebSocket.instances).toEqual([]);
  connection.dispose();
});

test("subscribe opens one room socket that maps open, messages, and reconnects until disposed", async () => {
  const connection = partykit(configuration()).connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "lobby", observer });
  const first = await latestSocket(1);

  expect(subscription.native).toBeInstanceOf(PartySocket);
  expect(subscription.native.room).toBe("lobby");
  expect(first.url).toContain("example.partykit.dev/parties/chat/lobby");
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  first.open();
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  first.receive("hello");
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    data: "hello",
    native: expect.any(MessageEvent),
  });

  first.drop(1006);
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");
  const second = await latestSocket(2);
  expect(second).not.toBe(first);
  second.open();
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");

  subscription.dispose();
  subscription.dispose();
  await vi.waitFor(() => expect(second.readyState).toBe(3));
  second.receive("late");

  expect(observer.publication).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(4);
  connection.dispose();
});

test("disposing the connection closes every room without observer calls", async () => {
  const connection = partykit(configuration()).connect(connectionObserver());
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "lobby", observer });
  const socket = await latestSocket(1);
  socket.open();

  connection.dispose();
  await vi.waitFor(() => expect(socket.readyState).toBe(3));
  socket.receive("late");

  expect(subscription.native.shouldReconnect).toBe(false);
  expect(observer.publication).not.toHaveBeenCalled();
  expect(observer.state.mock.calls).toEqual([["subscribing"], ["subscribed"]]);
});
