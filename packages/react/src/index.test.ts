import { expect, test } from "vitest";
import * as api from "src/index";

test("the package exposes the provider and hooks without runtime internals", () => {
  expect(Object.keys(api).sort()).toEqual([
    "RealtimeProvider",
    "createChannelEventHooks",
    "useChannel",
    "useChannelDemand",
    "useChannelStatus",
    "useConnectionState",
    "useNativeChannel",
    "useNativeConnection",
    "useRealtimeClient",
  ]);
});
