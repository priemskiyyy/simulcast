import { beforeEach, expect, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
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
}

beforeEach(() => {
  FakeWebSocket.instances = [];
});

testRealtimeAdapter({
  name: "partykit",
  createAdapter: () =>
    partykit({
      host: "example.partykit.dev",
      party: "chat",
      WebSocket: FakeWebSocket,
      minReconnectionDelay: 5,
      maxReconnectionDelay: 10,
    }),
  channels: ["lobby", "stage"],
  publish: async (_connection, channel, data) => {
    // PartySocket opens its socket asynchronously; a disposed room never opens one.
    const findSocket = () =>
      FakeWebSocket.instances
        .filter((candidate) =>
          candidate.url.includes(`/parties/chat/${channel}`),
        )
        .at(-1);
    await vi
      .waitFor(() => expect(findSocket()).toBeDefined(), { timeout: 200 })
      .catch(() => {});
    const socket = findSocket();

    if (socket === undefined || socket.readyState === 3) {
      return;
    }

    if (socket.readyState === 0) {
      socket.readyState = 1;
      socket.dispatchEvent(new Event("open"));
    }

    socket.dispatchEvent(new MessageEvent("message", { data: String(data) }));
  },
});
