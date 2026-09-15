import { RealtimeClient } from "@priemskiyyy/simulcast";
import type {
  AdapterConnectionObserver,
  RealtimePublication,
} from "@priemskiyyy/simulcast";
import { socketio } from "@priemskiyyy/simulcast-socketio";
import { expect, onTestFinished, test, vi } from "vitest";
import { socketioFixture } from "./socketioFixture";

test("Socket.IO authentication rejection reports an error and leaves no server socket", async () => {
  const provider = await socketioFixture();
  const errors = vi.fn<AdapterConnectionObserver["error"]>();
  const states = vi.fn<AdapterConnectionObserver["state"]>();
  const connection = socketio({
    url: provider.url,
    options: { auth: { token: "wrong" }, reconnection: false },
  }).connect({ state: states, error: errors });
  onTestFinished(connection.dispose);
  await expect.poll(() => errors.mock.calls.length).toBe(1);
  expect(String(errors.mock.calls[0]?.[0].error)).toContain("Unauthorized");
  expect(states).toHaveBeenLastCalledWith("disconnected");
  expect(provider.connections()).toBe(0);
});

test("Socket.IO server disconnect is terminal until a fresh session starts", async () => {
  const provider = await socketioFixture();
  const client = new RealtimeClient({ adapter: provider.adapter });
  const room = client.channel("rooms/one");
  const messages = vi.fn<(publication: RealtimePublication) => void>();
  onTestFinished(room.subscribe(messages));
  onTestFinished(client.connect());
  await provider.ready();
  provider.server.disconnectSockets(true);
  await expect.poll(() => client.connection.get()).toBe("disconnected");
  expect(room.status.get().state).toBe("unsubscribed");
  onTestFinished(client.connect());
  await provider.ready();
  await expect.poll(() => room.status.get().state).toBe("subscribed");
  await provider.publish("rooms/one", "fresh session");
  await expect.poll(() => messages.mock.calls.length).toBe(1);
});
