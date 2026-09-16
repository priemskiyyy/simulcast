import { testRealtimeAdapter } from "@priemskiyyy/simulcast/testing";
import { broadcastChannel } from "src/broadcastChannel";

testRealtimeAdapter({
  name: "broadcastChannel",
  createAdapter: () => broadcastChannel({ prefix: "conformance:" }),
  publish: (_connection, channel, data) => {
    const publisher = new BroadcastChannel(`conformance:${channel}`);
    publisher.postMessage(data);
    publisher.close();
  },
});
