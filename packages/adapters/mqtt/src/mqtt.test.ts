import { MqttClient } from "mqtt";
import type { IPublishPacket, ISubscriptionGrant } from "mqtt";
import { RealtimeClient } from "@priemskiyyy/simulcast";
import type { RealtimeChannel } from "@priemskiyyy/simulcast";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";
import { mqtt } from "src/mqtt";

const configuration = { url: "mqtt://localhost:1" };

const connectionObserver = () => ({ state: vi.fn(), error: vi.fn() });
const subscriptionObserver = () => ({
  state: vi.fn(),
  error: vi.fn(),
  publication: vi.fn(),
});

const publishPacket = (topic: string, payload: Buffer): IPublishPacket => ({
  cmd: "publish",
  qos: 0,
  dup: false,
  retain: false,
  topic,
  payload,
});

const grantSubscription = (
  client: MqttClient,
  qos: ISubscriptionGrant["qos"],
) => {
  const subscribe = vi.mocked(client.subscribe);
  const callback = subscribe.mock.calls.at(-1)?.[2];

  if (typeof callback !== "function") {
    throw new Error("Expected the adapter to subscribe with a callback");
  }

  const [filter] = subscribe.mock.calls.at(-1) ?? [];
  callback(null, [{ topic: String(filter), qos }]);
};

// Never connected, the real `end` reaches for a stream that does not exist.
beforeEach(() => {
  vi.spyOn(MqttClient.prototype, "connect").mockImplementation(function (
    this: MqttClient,
  ) {
    return this;
  });
  vi.spyOn(MqttClient.prototype, "end").mockImplementation(function (
    this: MqttClient,
  ) {
    return this;
  });
});

test("creating the adapter opens nothing", () => {
  mqtt(configuration);

  expect(MqttClient.prototype.connect).not.toHaveBeenCalled();
});

test("each connect creates a fresh client that reports mapped states and errors until disposed", async () => {
  const adapter = mqtt(configuration);
  const observer = connectionObserver();
  const connection = adapter.connect(observer);
  const other = adapter.connect(connectionObserver());
  const client = connection.native;
  const error = new Error("refused");

  expect(client).toBeInstanceOf(MqttClient);
  expect(other.native).not.toBe(client);
  expect(MqttClient.prototype.connect).toHaveBeenCalledTimes(2);
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("connecting");
  client.emit("connect", { cmd: "connack", sessionPresent: false });
  expect(observer.state).toHaveBeenLastCalledWith("connected");
  client.emit("offline");
  expect(observer.state).toHaveBeenLastCalledWith("connecting");
  client.emit("close");
  expect(observer.state).toHaveBeenLastCalledWith("connecting");
  client.emit("reconnect");
  expect(observer.state).toHaveBeenLastCalledWith("connecting");
  client.emit("error", error);
  expect(observer.error).toHaveBeenCalledExactlyOnceWith({ error });
  client.emit("end");
  expect(observer.state).toHaveBeenLastCalledWith("disconnected");
  const reported = observer.state.mock.calls.length;

  connection.dispose();
  connection.dispose();
  client.emit("connect", { cmd: "connack", sessionPresent: false });
  client.emit("error", error);

  await Promise.resolve();
  expect(MqttClient.prototype.end).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(reported);
  expect(observer.error).toHaveBeenCalledTimes(1);
  other.dispose();
});

test("a client that never reconnects reports disconnected on close", () => {
  const adapter = mqtt({ ...configuration, options: { reconnectPeriod: 0 } });
  const observer = connectionObserver();
  const connection = adapter.connect(observer);

  connection.native.emit("close");

  expect(observer.state).toHaveBeenLastCalledWith("disconnected");
  connection.dispose();
});

test("subscribe grants one filter that routes matching topics until disposed", () => {
  const adapter = mqtt({
    ...configuration,
    getSubscribeOptions: () => ({ qos: 1 }),
  });
  const connection = adapter.connect(connectionObserver());
  const client = connection.native;
  vi.spyOn(client, "subscribe");
  const unsubscribe = vi.spyOn(client, "unsubscribe");
  const observer = subscriptionObserver();
  const subscription = connection.subscribe({ channel: "rooms/+", observer });

  expect(client.subscribe).toHaveBeenCalledWith(
    "rooms/+",
    { qos: 1 },
    expect.any(Function),
  );
  expect(observer.state).toHaveBeenCalledExactlyOnceWith("subscribing");
  grantSubscription(client, 1);
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  const payload = Buffer.from("hi");
  const packet = publishPacket("rooms/one", payload);
  client.emit("message", "rooms/one", payload, packet);
  client.emit(
    "message",
    "other/topic",
    payload,
    publishPacket("other/topic", payload),
  );
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    data: payload,
    native: packet,
  });
  client.emit("offline");
  client.emit("close");
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");
  client.emit("connect", { cmd: "connack", sessionPresent: false });
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");

  subscription.dispose();
  subscription.dispose();
  client.emit("message", "rooms/one", payload, packet);

  expect(unsubscribe).toHaveBeenCalledExactlyOnceWith("rooms/+");
  expect(observer.publication).toHaveBeenCalledTimes(1);
  expect(observer.state).toHaveBeenCalledTimes(4);
  connection.dispose();
});

test("a rejected or failed subscription reports the reason and stops", () => {
  const adapter = mqtt(configuration);
  const connection = adapter.connect(connectionObserver());
  const client = connection.native;
  vi.spyOn(client, "subscribe");
  const rejected = subscriptionObserver();
  const failed = subscriptionObserver();

  connection.subscribe({ channel: "denied", observer: rejected });
  grantSubscription(client, 128);
  connection.subscribe({ channel: "broken", observer: failed });
  const callback = vi.mocked(client.subscribe).mock.calls.at(-1)?.[2];
  const error = new Error("broker refused");
  callback?.(error);

  expect(rejected.error).toHaveBeenCalledExactlyOnceWith({
    error: { topic: "denied", qos: 128 },
  });
  expect(rejected.state).toHaveBeenLastCalledWith("unsubscribed");
  expect(failed.error).toHaveBeenCalledExactlyOnceWith({ error });
  expect(failed.state).toHaveBeenLastCalledWith("unsubscribed");
  connection.dispose();
});

test("matching messages arrive while acknowledgement is pending and after it succeeds", () => {
  const connection = mqtt(configuration).connect(connectionObserver());
  const client = connection.native;
  vi.spyOn(client, "subscribe");
  const observer = subscriptionObserver();
  connection.subscribe({ channel: "rooms/+", observer });
  const early = Buffer.from("before acknowledgement");
  const confirmed = Buffer.from("after acknowledgement");

  client.emit("message", "rooms/one", early, publishPacket("rooms/one", early));
  expect(observer.state).toHaveBeenLastCalledWith("subscribing");
  expect(observer.publication).toHaveBeenCalledExactlyOnceWith({
    data: early,
    native: publishPacket("rooms/one", early),
  });
  grantSubscription(client, 1);
  client.emit(
    "message",
    "rooms/one",
    confirmed,
    publishPacket("rooms/one", confirmed),
  );
  expect(observer.publication).toHaveBeenCalledTimes(2);
  expect(observer.publication).toHaveBeenLastCalledWith({
    data: confirmed,
    native: publishPacket("rooms/one", confirmed),
  });
  expect(observer.state).toHaveBeenLastCalledWith("subscribed");
  connection.dispose();
});

test.each(["rejected grant", "callback error"])(
  "%s blocks delivery before notifying observers and stays rejected across reconnects",
  (failure) => {
    const connection = mqtt(configuration).connect(connectionObserver());
    const client = connection.native;
    const subscribe = vi.spyOn(client, "subscribe");
    const observer = subscriptionObserver();
    const payload = Buffer.from("received through another filter");
    observer.error.mockImplementation(() => {
      client.emit(
        "message",
        "rooms/one",
        payload,
        publishPacket("rooms/one", payload),
      );
    });
    connection.subscribe({ channel: "rooms/one", observer });

    if (failure === "rejected grant") {
      grantSubscription(client, 128);
    } else {
      const callback = subscribe.mock.calls.at(-1)?.[2];
      if (callback === undefined)
        throw new Error("Expected a subscription callback");
      callback(new Error("subscription failed"));
    }
    client.emit("close");
    client.emit("connect", { cmd: "connack", sessionPresent: false });
    client.emit(
      "message",
      "rooms/one",
      payload,
      publishPacket("rooms/one", payload),
    );

    expect(observer.error).toHaveBeenCalledTimes(1);
    expect(observer.publication).not.toHaveBeenCalled();
    expect(observer.state.mock.calls).toEqual([
      ["subscribing"],
      ["unsubscribed"],
    ]);
    connection.dispose();
  },
);

test("native types flow from the adapter into the client", () => {
  const client = new RealtimeClient({ adapter: mqtt(configuration) });

  expectTypeOf(client.native.get()).toEqualTypeOf<MqttClient | null>();
  expectTypeOf(client.channel("sensors/#")).toEqualTypeOf<
    RealtimeChannel<IPublishPacket>
  >();
});
