import { RealtimeClient } from "simulcast";
import { mqtt } from "simulcast-mqtt";
import { expect, onTestFinished, test } from "vitest";
import { mqttFixture } from "./mqttFixture";

test("MQTT broker rejects invalid credentials without creating a live session", async () => {
  const provider = await mqttFixture();
  const client = new RealtimeClient({
    adapter: mqtt({
      url: provider.url,
      options: { username: "test-user", password: "wrong", reconnectPeriod: 0 },
    }),
  });
  onTestFinished(client.connect());
  await expect.poll(() => client.connection.get()).toBe("disconnected");
  expect(provider.accepted()).toBe(0);
});

test("MQTT rejected subscriptions report the broker error and never become subscribed", async () => {
  const provider = await mqttFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const channel = client.channel("denied");
  onTestFinished(
    channel.subscribe(() => {
      throw new Error("A rejected subscription received a message");
    }),
  );
  onTestFinished(client.connect());
  await expect.poll(() => channel.status.get().error).not.toBeNull();
  expect(channel.status.get().state).toBe("unsubscribed");
  expect(provider.count("denied")).toBe(0);
});

test("MQTT wildcard filters route real broker messages and release the last subscription", async () => {
  const provider = await mqttFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const received: string[] = [];
  const channel = client.channel("rooms/+");
  const stopFirst = channel.subscribe(({ data }) => {
    received.push(String(data));
  });
  onTestFinished(stopFirst);
  const stopSecond = channel.subscribe(() => {});
  onTestFinished(stopSecond);
  onTestFinished(client.connect());
  await provider.ready("rooms/+");
  await provider.publish("rooms/one", "one");
  await provider.publish("rooms/one/nested", "excluded");
  await provider.publish("rooms/two", "two");
  await expect.poll(() => received).toEqual(["one", "two"]);
  stopFirst();
  expect(provider.count("rooms/+")).toBe(1);
  stopSecond();
  await expect.poll(() => provider.count("rooms/+")).toBe(0);
});

test("MQTT root wildcard excludes system messages received through an explicit system subscription", async () => {
  const provider = await mqttFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const wildcardMessages: string[] = [];
  const systemMessages: string[] = [];
  onTestFinished(
    client.channel("#").subscribe(({ data }) => {
      wildcardMessages.push(String(data));
    }),
  );
  onTestFinished(
    client.channel("$SYS/review").subscribe(({ data }) => {
      systemMessages.push(String(data));
    }),
  );
  onTestFinished(client.connect());
  await provider.ready("#");
  await provider.ready("$SYS/review");

  await provider.publish("$SYS/review", "system message");
  await provider.publish("rooms/one", "application message");
  await expect.poll(() => systemMessages).toEqual(["system message"]);
  await expect.poll(() => wildcardMessages).toContain("application message");
  expect(wildcardMessages).toEqual(["application message"]);
});

test("MQTT channels become unsubscribed after transport loss when retries are disabled", async () => {
  const provider = await mqttFixture();
  const client = new RealtimeClient({
    adapter: mqtt({
      url: provider.url,
      options: {
        username: "test-user",
        password: "test-token",
        reconnectPeriod: 0,
      },
    }),
  });
  const channel = client.channel("rooms/one");
  onTestFinished(channel.subscribe(() => {}));
  onTestFinished(client.connect());
  await provider.ready("rooms/one");
  await expect.poll(() => channel.status.get().state).toBe("subscribed");

  provider.drop();
  await expect.poll(() => client.connection.get()).toBe("disconnected");
  expect(channel.status.get().state).toBe("unsubscribed");
  await expect.poll(provider.connections).toBe(0);
});

test("MQTT rejected filters stay silent when an accepted wildcard overlaps, including after reconnect", async () => {
  const provider = await mqttFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const wildcardMessages: string[] = [];
  const rejectedMessages: string[] = [];
  const rejectedChannel = client.channel("denied");
  onTestFinished(
    client.channel("#").subscribe(({ data }) => {
      wildcardMessages.push(String(data));
    }),
  );
  onTestFinished(
    rejectedChannel.subscribe(({ data }) => {
      rejectedMessages.push(String(data));
    }),
  );
  onTestFinished(client.connect());
  await provider.ready("#");
  await expect.poll(() => rejectedChannel.status.get().error).not.toBeNull();

  await provider.publish("denied", "before reconnect");
  await expect.poll(() => wildcardMessages).toEqual(["before reconnect"]);
  expect(rejectedMessages).toEqual([]);
  expect(rejectedChannel.status.get().state).toBe("unsubscribed");

  const accepted = provider.accepted();
  provider.drop();
  await expect.poll(provider.accepted).toBe(accepted + 1);
  await provider.ready("#");
  await provider.publish("denied", "after reconnect");
  await expect
    .poll(() => wildcardMessages)
    .toEqual(["before reconnect", "after reconnect"]);
  expect(rejectedMessages).toEqual([]);
  expect(rejectedChannel.status.get().state).toBe("unsubscribed");
  expect(provider.count("denied")).toBe(0);
});
