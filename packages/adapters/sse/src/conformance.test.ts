import { beforeEach } from "vitest";
import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { sse } from "src/sse";

class FakeEventSource extends EventTarget {
  static instances: FakeEventSource[] = [];
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSED = 2;
  readyState = 0;

  constructor(readonly url: string) {
    super();
    FakeEventSource.instances.push(this);
  }

  close() {
    this.readyState = 2;
  }
}

beforeEach(() => {
  FakeEventSource.instances = [];
});

testRealtimeAdapter({
  name: "sse",
  createAdapter: () =>
    sse({
      url: (channel) => `/events/${channel}`,
      eventSource: FakeEventSource,
    }),
  publish: (_connection, channel, data) => {
    const source = FakeEventSource.instances
      .filter((candidate) => candidate.url === `/events/${channel}`)
      .at(-1);

    if (source === undefined || source.readyState === 2) {
      return;
    }

    if (source.readyState === 0) {
      source.readyState = 1;
      source.dispatchEvent(new Event("open"));
    }

    source.dispatchEvent(new MessageEvent("message", { data: String(data) }));
  },
});
