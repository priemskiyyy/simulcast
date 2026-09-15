import { expect, test } from "vitest";
import * as api from "src/index";

test("the package exposes the client and the detached status without runtime internals", () => {
  expect(Object.keys(api).sort()).toEqual([
    "DETACHED_CHANNEL_STATUS",
    "RealtimeClient",
    "createChannelEventMatcher",
    "createRealtimeAdapter",
  ]);
});
