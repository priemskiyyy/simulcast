import { beforeEach, expect } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { phoenix } from "src/phoenix";

type Frame = [unknown, unknown, string, string, unknown];

class FakeTransport {
  static instances: FakeTransport[] = [];
  readyState = 0;
  sent: Frame[] = [];
  replied = new Set<unknown>();
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
    if (typeof this.onclose === "function") {
      this.onclose({ code: 1000 });
    }
  }

  receive(frame: Frame) {
    if (typeof this.onmessage === "function") {
      this.onmessage({ data: JSON.stringify(frame) });
    }
  }
}

beforeEach(() => {
  FakeTransport.instances = [];
});

testRealtimeAdapter({
  name: "phoenix",
  createAdapter: () =>
    phoenix({
      url: "ws://localhost/socket",
      options: { transport: FakeTransport, reconnectAfterMs: () => 60_000 },
    }),
  publish: (connection, channel, data) => {
    const transport = FakeTransport.instances
      .filter((candidate) => candidate.readyState !== 3)
      .at(-1);

    if (transport === undefined) {
      return;
    }

    if (transport.readyState === 0) {
      transport.readyState = 1;
      if (typeof transport.onopen === "function") {
        transport.onopen();
      }
    }

    for (const join of transport.sent) {
      if (join[3] === "phx_join" && !transport.replied.has(join[1])) {
        transport.replied.add(join[1]);
        transport.receive([
          join[0],
          join[1],
          join[2],
          "phx_reply",
          { status: "ok", response: {} },
        ]);
      }
    }

    transport.receive([null, null, channel, "created", data]);
    expect(connection.native.connectionState()).toBe("open");
  },
});
