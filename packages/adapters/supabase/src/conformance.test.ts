import { beforeEach, expect, vi } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { supabase } from "src/supabase";

type Frame = [unknown, unknown, string, string, unknown];

class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readonly protocol = "";
  readyState = 0;
  sent: Frame[] = [];
  replied = new Set<unknown>();
  onopen: ((event: object) => void) | null = null;
  onclose: ((event: object) => void) | null = null;
  onerror: ((event: object) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  readonly url: string;

  constructor(address: string | URL) {
    this.url = String(address);
    FakeSocket.instances.push(this);
  }

  addEventListener() {}

  removeEventListener() {}

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (typeof data !== "string") {
      throw new Error("Expected JSON frames");
    }

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
  FakeSocket.instances = [];
});

testRealtimeAdapter({
  name: "supabase",
  createAdapter: () =>
    supabase({
      url: "ws://localhost/realtime/v1",
      options: { params: { apikey: "anon" }, transport: FakeSocket },
    }),
  publish: async (_connection, channel, data) => {
    // The client opens its socket asynchronously; a disposed client closes it.
    await vi
      .waitFor(
        () =>
          expect(
            FakeSocket.instances.some((socket) => socket.readyState !== 3),
          ).toBe(true),
        { timeout: 200 },
      )
      .catch(() => {});
    const socket = FakeSocket.instances
      .filter((candidate) => candidate.readyState !== 3)
      .at(-1);

    if (socket === undefined) {
      return;
    }

    if (socket.readyState === 0) {
      socket.readyState = 1;
      if (typeof socket.onopen === "function") {
        socket.onopen({});
      }
    }

    await vi
      .waitFor(
        () =>
          expect(socket.sent.some((frame) => frame[3] === "phx_join")).toBe(
            true,
          ),
        { timeout: 200 },
      )
      .catch(() => {});

    for (const join of socket.sent) {
      if (join[3] === "phx_join" && !socket.replied.has(join[1])) {
        socket.replied.add(join[1]);
        socket.receive([
          join[0],
          join[1],
          join[2],
          "phx_reply",
          { status: "ok", response: {} },
        ]);
      }
    }

    socket.receive([
      null,
      null,
      `realtime:${channel}`,
      "broadcast",
      { type: "broadcast", event: "created", payload: data },
    ]);
  },
});
