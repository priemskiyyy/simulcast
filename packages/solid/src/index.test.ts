import { expect, test } from "vitest";
import * as api from "src/index";

test("the package exposes the provider and primitives without runtime internals", () => {
  expect(Object.keys(api).sort()).toEqual([
    "RealtimeProvider",
    "createChannelEventHooks",
    "useChannel",
    "useChannelStatus",
    "useConnectionState",
    "useRealtimeClient",
  ]);
});
