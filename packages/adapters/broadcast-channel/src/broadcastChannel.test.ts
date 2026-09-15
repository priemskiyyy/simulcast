import { expect, test, vi } from "vitest";
import { broadcastChannel } from "src/broadcastChannel";

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

test("connect reports connected immediately", () => {
  const observer = connectionObserver();
  const connection = broadcastChannel().connect(observer);

  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connected");
  expect(connection.native).toBeNull();
  connection.dispose();
});

test("subscribe receives messages posted to the prefixed channel until disposed", async () => {
  const connection = broadcastChannel({ prefix: "test:" }).connect(
    connectionObserver(),
  );
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "rooms", observer });
  const publisher = new BroadcastChannel("test:rooms");

  try {
    expect(subscription.native.name).toBe("test:rooms");
    expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribed");
    publisher.postMessage({ id: 1 });
    await vi.waitFor(() =>
      expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
        data: { id: 1 },
        native: expect.any(MessageEvent),
      }),
    );

    subscription.dispose();
    subscription.dispose();
    publisher.postMessage({ id: 2 });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(observer.publication).toHaveBeenCalledTimes(1);
  } finally {
    publisher.close();
    connection.dispose();
  }
});

test("channels with different names do not cross", async () => {
  const connection = broadcastChannel().connect(connectionObserver());
  const first = subscriptionObserver();
  const second = subscriptionObserver();
  connection.subscribe({ channel: "one", observer: first });
  connection.subscribe({ channel: "two", observer: second });
  const publisher = new BroadcastChannel("one");

  try {
    publisher.postMessage("only one");
    await vi.waitFor(() => expect(first.publication).toHaveBeenCalledTimes(1));

    expect(second.publication).not.toHaveBeenCalled();
  } finally {
    publisher.close();
    connection.dispose();
  }
});
