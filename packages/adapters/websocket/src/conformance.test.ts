import { beforeEach } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { websocket } from "src/websocket";

class FakeWebSocket extends EventTarget {
  static instances: FakeWebSocket[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readyState = 0;

  constructor(readonly url: string) {
    super();
    FakeWebSocket.instances.push(this);
  }

  send() {}

  close() {
    this.readyState = 3;
    this.dispatchEvent(Object.assign(new Event("close"), { code: 1000 }));
  }
}

const protocol = {
  subscribe: (channel: string) =>
    JSON.stringify({ type: "subscribe", channel }),
  unsubscribe: (channel: string) =>
    JSON.stringify({ type: "unsubscribe", channel }),
  decode: ({ data }: MessageEvent) => {
    const frame: unknown = JSON.parse(String(data));

    if (typeof frame !== "object" || frame === null || !("channel" in frame)) {
      return null;
    }

    if (typeof frame.channel !== "string" || !("data" in frame)) {
      return null;
    }

    return { channel: frame.channel, data: frame.data };
  },
};

beforeEach(() => {
  FakeWebSocket.instances = [];
});

testRealtimeAdapter({
  name: "websocket",
  createAdapter: () =>
    websocket({
      url: "ws://localhost/realtime",
      protocol,
      webSocket: FakeWebSocket,
    }),
  publish: (connection, channel, data) => {
    const socket: FakeWebSocket | null = connection.native.socket;

    if (socket === null || socket.readyState === 3) {
      return;
    }

    if (socket.readyState === 0) {
      socket.readyState = 1;
      socket.dispatchEvent(new Event("open"));
    }

    socket.dispatchEvent(
      new MessageEvent("message", { data: JSON.stringify({ channel, data }) }),
    );
  },
});
