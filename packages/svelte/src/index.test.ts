import { expect, test } from "vitest";
import * as api from "./index.js";

test("the package exposes the provider and utilities without runtime internals", () => {
  expect(Object.keys(api).sort()).toEqual([
    "RealtimeProvider",
    "createChannelEventHooks",
    "useChannel",
    "useChannelStatus",
    "useConnectionState",
    "useRealtimeClient",
  ]);
});
